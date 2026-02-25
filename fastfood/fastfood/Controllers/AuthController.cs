using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace fastfood.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Login with username and password
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            _logger.LogInformation("Login attempt for username: {Username}", request.Username);

            // Find employee by username
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.User != null && e.User.UserName == request.Username);

            if (employee == null || employee.User == null)
            {
                _logger.LogWarning("Employee not found for username: {Username}", request.Username);
                return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không đúng" });
            }

            // Check employee status - only Active employees can login
            if (employee.Status != EmployeeStatus.Active)
            {
                _logger.LogWarning("Login attempt with inactive account. Username: {Username}, Status: {Status}", 
                    request.Username, employee.Status);
                
                var statusMessage = employee.Status switch
                {
                    EmployeeStatus.Terminated => "Tài khoản của bạn đã bị chấm dứt",
                    EmployeeStatus.Inactive => "Tài khoản của bạn đã bị vô hiệu hóa",
                    EmployeeStatus.OnLeave => "Tài khoản của bạn đang trong thời gian nghỉ phép",
                    _ => "Tài khoản của bạn không hoạt động"
                };
                
                return Unauthorized(new { message = statusMessage });
            }

            // Verify password (simple comparison for now - should use hashing in production)
            if (employee.User.PasswordHash != request.Password)
            {
                _logger.LogWarning("Invalid password for username: {Username}", request.Username);
                return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không đúng" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(employee);
            var expiresAt = DateTimeHelper.VietnamNow.AddHours(24);

            var response = new LoginResponseDto
            {
                Token = token,
                UserId = employee.UserId ?? string.Empty,
                Email = employee.Email ?? string.Empty,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Role = (int)employee.Role,
                RoleName = GetRoleName(employee.Role),
                ExpiresAt = expiresAt,
                EmployeeId = employee.Id
            };

            _logger.LogInformation("Login successful for username: {Username}", request.Username);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for username: {Username}", request.Username);
            return StatusCode(500, new { message = "Lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }

    //Sử dụng Token để lấy thông tin user
    /// Verify token and get current user info
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<LoginResponseDto>> GetCurrentUser()
    {
        try
        {
            // Get userId from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                return Unauthorized(new { message = "Token không hợp lệ" });
            }

            var userId = userIdClaim.Value;
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (employee == null || employee.User == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin người dùng" });
            }

            // Check employee status - only Active employees can access
            if (employee.Status != EmployeeStatus.Active)
            {
                _logger.LogWarning("Access attempt with inactive account. UserId: {UserId}, Status: {Status}", 
                    userId, employee.Status);
                return Unauthorized(new { message = "Tài khoản của bạn không còn hoạt động" });
            }

            var response = new LoginResponseDto
            {
                Token = string.Empty, // Don't return token in this endpoint
                UserId = employee.UserId ?? string.Empty,
                Email = employee.Email ?? string.Empty,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Role = (int)employee.Role,
                RoleName = GetRoleName(employee.Role),
                ExpiresAt = DateTimeHelper.VietnamNow.AddHours(24),
                EmployeeId = employee.Id
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Lỗi hệ thống. Vui lòng thử lại sau." });
        }
    }
    //JWT Token generation
    private string GenerateJwtToken(Employee employee)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "FastFoodAPI";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "FastFoodClient";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, employee.UserId ?? string.Empty),
            new Claim(ClaimTypes.Name, employee.User?.UserName ?? employee.Email ?? "Unknown"),
            new Claim(ClaimTypes.Email, employee.Email ?? string.Empty),
            new Claim(ClaimTypes.GivenName, $"{employee.FirstName} {employee.LastName}"),
            new Claim(ClaimTypes.Role, employee.Role.ToString()),
            new Claim("EmployeeId", employee.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTimeHelper.VietnamNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GetRoleName(EmployeeRole role)
    {
        return role switch
        {
            EmployeeRole.Admin => "Quản trị viên",
            EmployeeRole.Cashier => "Thu ngân",
            EmployeeRole.WarehouseStaff => "Nhân viên kho",
            _ => "Không xác định"
        };
    }
}

