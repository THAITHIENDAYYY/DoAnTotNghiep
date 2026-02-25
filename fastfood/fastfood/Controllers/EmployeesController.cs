using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace fastfood.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(ApplicationDbContext context, ILogger<EmployeesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Lấy danh sách tất cả nhân viên
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeListResponseDto>>> GetEmployees()
        {
            var employees = await _context.Employees
                .Select(e => new EmployeeListResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    HireDate = e.HireDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    SalaryType = e.SalaryType,
                    SalaryTypeName = GetSalaryTypeName(e.SalaryType),
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    TotalOrdersHandled = e.Orders.Count,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null
                })
                .ToListAsync();

            return Ok(employees);
        }

        /// <summary>
        /// Lấy danh sách nhân viên đang hoạt động
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<EmployeeListResponseDto>>> GetActiveEmployees()
        {
            var employees = await _context.Employees
                .Where(e => e.Status == EmployeeStatus.Active)
                .Select(e => new EmployeeListResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    HireDate = e.HireDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    SalaryType = e.SalaryType,
                    SalaryTypeName = GetSalaryTypeName(e.SalaryType),
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    TotalOrdersHandled = e.Orders.Count,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null
                })
                .ToListAsync();

            return Ok(employees);
        }

        /// <summary>
        /// Lấy danh sách nhân viên theo vai trò
        /// </summary>
        [HttpGet("by-role/{role}")]
        public async Task<ActionResult<IEnumerable<EmployeeListResponseDto>>> GetEmployeesByRole(EmployeeRole role)
        {
            var employees = await _context.Employees
                .Where(e => e.Role == role)
                .Select(e => new EmployeeListResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    HireDate = e.HireDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    SalaryType = e.SalaryType,
                    SalaryTypeName = GetSalaryTypeName(e.SalaryType),
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    TotalOrdersHandled = e.Orders.Count,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null
                })
                .ToListAsync();

            return Ok(employees);
        }

        /// <summary>
        /// Tìm kiếm nhân viên theo tên hoặc email
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<EmployeeListResponseDto>>> SearchEmployees([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Từ khóa tìm kiếm không được để trống" });
            }

            var employees = await _context.Employees
                .Where(e => e.FirstName.Contains(query) || 
                           e.LastName.Contains(query) || 
                           e.Email.Contains(query))
                .Select(e => new EmployeeListResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    HireDate = e.HireDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    SalaryType = e.SalaryType,
                    SalaryTypeName = GetSalaryTypeName(e.SalaryType),
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    TotalOrdersHandled = e.Orders.Count,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null
                })
                .ToListAsync();

            return Ok(employees);
        }

        /// <summary>
        /// Lấy thông tin chi tiết nhân viên theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeResponseDto>> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Select(e => new EmployeeResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    Address = e.Address,
                    DateOfBirth = e.DateOfBirth,
                    Age = DateTimeHelper.VietnamNow.Year - e.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.DateOfBirth.DayOfYear ? 1 : 0),
                    HireDate = e.HireDate,
                    TerminationDate = e.TerminationDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null,
                    TotalOrdersHandled = e.Orders.Count
                })
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            return Ok(employee);
        }

        /// <summary>
        /// Lấy thông tin nhân viên theo UserId
        /// </summary>
        [HttpGet("by-user/{userId}")]
        public async Task<ActionResult<EmployeeResponseDto>> GetEmployeeByUserId(string userId)
        {
            var employee = await _context.Employees
                .Where(e => e.UserId == userId)
                .Select(e => new EmployeeResponseDto
                {
                    Id = e.Id,
                    FirstName = e.FirstName,
                    LastName = e.LastName,
                    FullName = e.FirstName + " " + e.LastName,
                    Email = e.Email,
                    PhoneNumber = e.PhoneNumber,
                    Address = e.Address,
                    DateOfBirth = e.DateOfBirth,
                    Age = DateTimeHelper.VietnamNow.Year - e.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.DateOfBirth.DayOfYear ? 1 : 0),
                    HireDate = e.HireDate,
                    TerminationDate = e.TerminationDate,
                    YearsOfService = e.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - e.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < e.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                    Salary = e.Salary,
                    Role = e.Role,
                    RoleName = GetRoleName(e.Role),
                    Status = e.Status,
                    StatusName = GetStatusName(e.Status),
                    CreatedAt = e.CreatedAt,
                    UpdatedAt = e.UpdatedAt,
                    UserId = e.UserId,
                    Username = e.User != null ? e.User.UserName : null,
                    TotalOrdersHandled = e.Orders.Count
                })
                .FirstOrDefaultAsync();

            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            return Ok(employee);
        }

        /// <summary>
        /// Tạo nhân viên mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<EmployeeResponseDto>> CreateEmployee(CreateEmployeeDto createEmployeeDto)
        {
            // Xử lý chuỗi rỗng thành null cho các trường optional
            if (string.IsNullOrWhiteSpace(createEmployeeDto.Email))
            {
                createEmployeeDto.Email = null;
                ModelState.Remove("Email"); // Xóa lỗi validation của Email nếu nó rỗng
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra email đã tồn tại nếu được cung cấp
            if (!string.IsNullOrWhiteSpace(createEmployeeDto.Email))
            {
                var existingEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Email.ToLower() == createEmployeeDto.Email.ToLower());

                if (existingEmployee != null)
                {
                    return Conflict(new { message = "Email đã tồn tại" });
                }
            }

            // Kiểm tra UserId có tồn tại không (nếu có)
            if (!string.IsNullOrWhiteSpace(createEmployeeDto.UserId))
            {
                var existingUserEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == createEmployeeDto.UserId);

                if (existingUserEmployee != null)
                {
                    return Conflict(new { message = "Tài khoản này đã được liên kết với nhân viên khác" });
                }
            }

            // Kiểm tra ngày sinh hợp lệ
            if (createEmployeeDto.DateOfBirth >= DateTimeHelper.VietnamNow)
            {
                return BadRequest(new { message = "Ngày sinh không hợp lệ" });
            }

            // Kiểm tra ngày tuyển dụng hợp lệ (nếu có)
            if (createEmployeeDto.HireDate.HasValue && createEmployeeDto.HireDate.Value < createEmployeeDto.DateOfBirth)
            {
                return BadRequest(new { message = "Ngày tuyển dụng không thể trước ngày sinh" });
            }

            var employee = new Employee
            {
                FirstName = createEmployeeDto.FirstName,
                LastName = createEmployeeDto.LastName,
                Email = string.IsNullOrWhiteSpace(createEmployeeDto.Email) ? null : createEmployeeDto.Email.Trim(),
                PhoneNumber = createEmployeeDto.PhoneNumber,
                Address = createEmployeeDto.Address,
                DateOfBirth = createEmployeeDto.DateOfBirth,
                HireDate = createEmployeeDto.HireDate ?? DateTimeHelper.VietnamNow,
                Salary = createEmployeeDto.Salary ?? 0,
                Role = createEmployeeDto.Role,
                Status = EmployeeStatus.Active,
                UserId = createEmployeeDto.UserId,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            var response = new EmployeeResponseDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                FullName = employee.FirstName + " " + employee.LastName,
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Address = employee.Address,
                DateOfBirth = employee.DateOfBirth,
                Age = DateTimeHelper.VietnamNow.Year - employee.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < employee.DateOfBirth.DayOfYear ? 1 : 0),
                HireDate = employee.HireDate,
                TerminationDate = employee.TerminationDate,
                YearsOfService = employee.HireDate.HasValue ? DateTimeHelper.VietnamNow.Year - employee.HireDate.Value.Year - (DateTimeHelper.VietnamNow.DayOfYear < employee.HireDate.Value.DayOfYear ? 1 : 0) : 0,
                Salary = employee.Salary,
                Role = employee.Role,
                RoleName = GetRoleName(employee.Role),
                Status = employee.Status,
                StatusName = GetStatusName(employee.Status),
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt,
                UserId = employee.UserId,
                Username = employee.User != null ? employee.User.UserName : null,
                TotalOrdersHandled = 0
            };

            return CreatedAtAction(nameof(GetEmployee), new { id = employee.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin nhân viên
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, UpdateEmployeeDto updateEmployeeDto)
        {
            // Xử lý chuỗi rỗng thành null cho các trường optional
            if (string.IsNullOrWhiteSpace(updateEmployeeDto.Email))
            {
                updateEmployeeDto.Email = null;
                ModelState.Remove("Email"); // Xóa lỗi validation của Email nếu nó rỗng
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            // Kiểm tra email đã tồn tại chưa (trừ nhân viên hiện tại) nếu có email
            if (!string.IsNullOrWhiteSpace(updateEmployeeDto.Email))
            {
                var existingEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Email.ToLower() == updateEmployeeDto.Email.ToLower() && e.Id != id);

                if (existingEmployee != null)
                {
                    return Conflict(new { message = "Email đã tồn tại" });
                }
            }

            // Kiểm tra UserId có tồn tại không (nếu có và khác với UserId hiện tại)
            if (!string.IsNullOrWhiteSpace(updateEmployeeDto.UserId) && updateEmployeeDto.UserId != employee.UserId)
            {
                var existingUserEmployee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == updateEmployeeDto.UserId);

                if (existingUserEmployee != null)
                {
                    return Conflict(new { message = "Tài khoản này đã được liên kết với nhân viên khác" });
                }
            }

            // Kiểm tra ngày sinh hợp lệ
            if (updateEmployeeDto.DateOfBirth >= DateTimeHelper.VietnamNow)
            {
                return BadRequest(new { message = "Ngày sinh không hợp lệ" });
            }

            // Kiểm tra ngày tuyển dụng hợp lệ (nếu có)
            if (updateEmployeeDto.HireDate.HasValue && updateEmployeeDto.HireDate.Value < updateEmployeeDto.DateOfBirth)
            {
                return BadRequest(new { message = "Ngày tuyển dụng không thể trước ngày sinh" });
            }

            employee.FirstName = updateEmployeeDto.FirstName;
            employee.LastName = updateEmployeeDto.LastName;
            employee.Email = string.IsNullOrWhiteSpace(updateEmployeeDto.Email) ? null : updateEmployeeDto.Email.Trim();
            employee.PhoneNumber = updateEmployeeDto.PhoneNumber;
            employee.Address = updateEmployeeDto.Address;
            employee.DateOfBirth = updateEmployeeDto.DateOfBirth;
            employee.HireDate = updateEmployeeDto.HireDate ?? employee.HireDate;
            employee.TerminationDate = updateEmployeeDto.TerminationDate;
            employee.Salary = updateEmployeeDto.Salary ?? employee.Salary;
            employee.Role = updateEmployeeDto.Role;
            employee.Status = updateEmployeeDto.Status;
            employee.UserId = updateEmployeeDto.UserId;
            employee.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EmployeeExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy nhân viên" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa nhân viên (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            // Kiểm tra xem nhân viên có đơn hàng nào không
            var hasOrders = await _context.Orders.AnyAsync(o => o.EmployeeId == id);
            if (hasOrders)
            {
                return BadRequest(new { message = "Không thể xóa nhân viên có đơn hàng. Vui lòng vô hiệu hóa nhân viên thay vì xóa." });
            }

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Thay đổi trạng thái nhân viên
        /// </summary>
        [HttpPatch("{id}/change-status")]
        public async Task<IActionResult> ChangeEmployeeStatus(int id, [FromBody] EmployeeStatus newStatus)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            employee.Status = newStatus;
            
            // Nếu chuyển sang trạng thái Terminated, cập nhật ngày nghỉ việc
            if (newStatus == EmployeeStatus.Terminated && employee.TerminationDate == null)
            {
                employee.TerminationDate = DateTimeHelper.VietnamNow;
            }
            
            employee.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = $"Trạng thái nhân viên đã được cập nhật thành {GetStatusName(newStatus)}",
                status = newStatus,
                statusName = GetStatusName(newStatus),
                terminationDate = employee.TerminationDate
            });
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt nhân viên (Toggle Active/Inactive)
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult<EmployeeResponseDto>> ToggleStatus(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            // Toggle giữa Active và Inactive
            if (employee.Status == EmployeeStatus.Active)
            {
                employee.Status = EmployeeStatus.Inactive;
            }
            else
            {
                employee.Status = EmployeeStatus.Active;
            }
            
            employee.UpdatedAt = DateTimeHelper.VietnamNow;
            await _context.SaveChangesAsync();

            // Trả về thông tin nhân viên đã cập nhật
            var response = new EmployeeResponseDto
            {
                Id = employee.Id,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                FullName = $"{employee.FirstName} {employee.LastName}",
                Email = employee.Email,
                PhoneNumber = employee.PhoneNumber,
                Address = employee.Address,
                DateOfBirth = employee.DateOfBirth,
                Age = (DateTimeHelper.VietnamNow - employee.DateOfBirth).Days / 365,
                HireDate = employee.HireDate,
                TerminationDate = employee.TerminationDate,
                YearsOfService = employee.HireDate.HasValue 
                    ? (DateTimeHelper.VietnamNow - employee.HireDate.Value).Days / 365 
                    : 0,
                Salary = employee.Salary,
                Role = employee.Role,
                RoleName = GetRoleName(employee.Role),
                Status = employee.Status,
                StatusName = GetStatusName(employee.Status),
                CreatedAt = employee.CreatedAt,
                UpdatedAt = employee.UpdatedAt,
                UserId = employee.UserId,
                Username = employee.User?.UserName,
                TotalOrdersHandled = await _context.Orders.CountAsync(o => o.EmployeeId == id)
            };

            return Ok(response);
        }

        /// <summary>
        /// Cập nhật lương nhân viên
        /// </summary>
        [HttpPatch("{id}/update-salary")]
        public async Task<IActionResult> UpdateSalary(int id, [FromBody] decimal newSalary)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            if (newSalary <= 0)
            {
                return BadRequest(new { message = "Lương phải lớn hơn 0" });
            }

            employee.Salary = newSalary;
            employee.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Cập nhật lương thành công",
                salary = employee.Salary
            });
        }

        /// <summary>
        /// Liên kết nhân viên với tài khoản người dùng
        /// </summary>
        [HttpPatch("{id}/link-user")]
        public async Task<IActionResult> LinkEmployeeToUser(int id, [FromBody] string userId)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { message = "UserId không được để trống" });
            }

            // Kiểm tra UserId có tồn tại không
            var existingUserEmployee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (existingUserEmployee != null)
            {
                return Conflict(new { message = "Tài khoản này đã được liên kết với nhân viên khác" });
            }

            employee.UserId = userId;
            employee.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Liên kết tài khoản thành công",
                userId = employee.UserId 
            });
        }

        /// <summary>
        /// Hủy liên kết nhân viên với tài khoản người dùng
        /// </summary>
        [HttpPatch("{id}/unlink-user")]
        public async Task<IActionResult> UnlinkEmployeeFromUser(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null)
            {
                return NotFound(new { message = "Không tìm thấy nhân viên" });
            }

            employee.UserId = null;
            employee.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Hủy liên kết tài khoản thành công"
            });
        }

        private bool EmployeeExists(int id)
        {
            return _context.Employees.Any(e => e.Id == id);
        }

        private static string GetRoleName(EmployeeRole role)
        {
            return role switch
            {
                EmployeeRole.Admin => "Quản lý (Admin)",
                EmployeeRole.Cashier => "Thu ngân (Cashier)",
                EmployeeRole.WarehouseStaff => "Nhân viên kho (Warehouse)",
                _ => "Không xác định"
            };
        }

        private static string GetStatusName(EmployeeStatus status)
        {
            return status switch
            {
                EmployeeStatus.Active => "Đang hoạt động",
                EmployeeStatus.Inactive => "Không hoạt động",
                EmployeeStatus.OnLeave => "Nghỉ phép",
                EmployeeStatus.Terminated => "Đã nghỉ việc",
                _ => "Không xác định"
            };
        }

        private static string GetSalaryTypeName(SalaryType salaryType)
        {
            return salaryType switch
            {
                SalaryType.Monthly => "Tháng",
                SalaryType.Hourly => "Giờ",
                _ => "Không xác định"
            };
        }

        /// <summary>
        /// Tạo tài khoản đăng nhập cho nhân viên (Admin only)
        /// </summary>
        [HttpPost("{id}/create-account")]
        public async Task<IActionResult> CreateEmployeeAccount(int id, [FromBody] CreateEmployeeAccountRequest request)
        {
            try
            {
                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = "Nhân viên không tồn tại" });
                }

                if (!string.IsNullOrEmpty(employee.UserId))
                {
                    return BadRequest(new { message = "Nhân viên đã có tài khoản đăng nhập" });
                }

                // Check if username already exists
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserName == request.Username);
                if (existingUser != null)
                {
                    return Conflict(new { message = "Tên đăng nhập đã tồn tại" });
                }

                // Create new user
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid().ToString(),
                    UserName = request.Username,
                    Email = employee.Email,
                    EmailConfirmed = true,
                    // WARNING: In production, use proper password hashing!
                    // Use IPasswordHasher<ApplicationUser> for security
                    PasswordHash = request.Password // TODO: Hash this properly in production
                };

                _context.Users.Add(user);
                employee.UserId = user.Id;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Tạo tài khoản thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating employee account for ID: {EmployeeId}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }

        /// <summary>
        /// Đổi mật khẩu cho nhân viên (Admin only)
        /// </summary>
        [HttpPost("{id}/change-password")]
        public async Task<IActionResult> ChangeEmployeePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            try
            {
                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { message = "Mật khẩu xác nhận không khớp" });
                }

                if (request.NewPassword.Length < 6)
                {
                    return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự" });
                }

                var employee = await _context.Employees.FindAsync(id);
                if (employee == null)
                {
                    return NotFound(new { message = "Nhân viên không tồn tại" });
                }

                if (string.IsNullOrEmpty(employee.UserId))
                {
                    return BadRequest(new { message = "Nhân viên chưa có tài khoản đăng nhập" });
                }

                var user = await _context.Users.FindAsync(employee.UserId);
                if (user == null)
                {
                    return NotFound(new { message = "Không tìm thấy tài khoản người dùng" });
                }

                // WARNING: In production, use proper password hashing!
                // Use IPasswordHasher<ApplicationUser> for security
                user.PasswordHash = request.NewPassword; // TODO: Hash this properly in production
                await _context.SaveChangesAsync();

                return Ok(new { message = "Đổi mật khẩu thành công" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for employee ID: {EmployeeId}", id);
                return StatusCode(500, new { message = "Lỗi hệ thống", error = ex.Message });
            }
        }
    }

    // Request DTOs
    public class CreateEmployeeAccountRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
