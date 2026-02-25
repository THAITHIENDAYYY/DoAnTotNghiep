using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class EmployeeListResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? HireDate { get; set; }
        public int YearsOfService { get; set; }
        public decimal? Salary { get; set; }
        public SalaryType SalaryType { get; set; }
        public string SalaryTypeName { get; set; } = string.Empty;
        public EmployeeRole Role { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public EmployeeStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int TotalOrdersHandled { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
    }
}
