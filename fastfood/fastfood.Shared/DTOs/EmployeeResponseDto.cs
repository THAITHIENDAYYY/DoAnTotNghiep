using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class EmployeeResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int Age { get; set; }
        public DateTime? HireDate { get; set; }
        public DateTime? TerminationDate { get; set; }
        public int YearsOfService { get; set; }
        public decimal? Salary { get; set; }
        public EmployeeRole Role { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public EmployeeStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UserId { get; set; }
        public string? Username { get; set; }
        public int TotalOrdersHandled { get; set; }
    }
}
