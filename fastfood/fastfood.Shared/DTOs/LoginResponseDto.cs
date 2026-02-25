namespace fastfood.Shared.DTOs;

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int EmployeeId { get; set; }
}

