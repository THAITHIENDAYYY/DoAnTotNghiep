using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public enum EmployeeRole
    {
        Admin = 1,           // Quản lý tất cả
        Cashier = 2,         // Thu ngân - chỉ vào POSPage
        WarehouseStaff = 3   // Nhân viên kho - chỉ vào IngredientsPage
    }
    
    public enum EmployeeStatus
    {
        Active = 1,
        Inactive = 2,
        OnLeave = 3,
        Terminated = 4
    }
    
    public enum SalaryType
    {
        Monthly = 1,  // Tháng
        Hourly = 2    // Giờ
    }
    
    public class Employee
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [EmailAddress]
        [StringLength(256)]
        public string? Email { get; set; }
        
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        
        [StringLength(500)]
        public string? Address { get; set; }
        
        public DateTime DateOfBirth { get; set; }
        
        public DateTime? HireDate { get; set; }
        
        public DateTime? TerminationDate { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? Salary { get; set; }
        
        public SalaryType SalaryType { get; set; } = SalaryType.Monthly;
        
        public EmployeeRole Role { get; set; }
        
        public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign Key to ApplicationUser
        public string? UserId { get; set; }
        
        // Navigation properties
        public virtual ApplicationUser? User { get; set; }
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
