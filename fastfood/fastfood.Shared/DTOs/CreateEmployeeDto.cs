using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;
using fastfood.Shared.Attributes;

namespace fastfood.Shared.DTOs
{
    public class CreateEmployeeDto
    {
        [Required(ErrorMessage = "Tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên không được vượt quá 100 ký tự")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ không được vượt quá 100 ký tự")]
        public string LastName { get; set; } = string.Empty;

        [OptionalEmailAddress(ErrorMessage = "Email không hợp lệ")]
        [StringLength(256, ErrorMessage = "Email không được vượt quá 256 ký tự")]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
        public string? PhoneNumber { get; set; }

        [StringLength(500, ErrorMessage = "Địa chỉ không được vượt quá 500 ký tự")]
        public string? Address { get; set; }

        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        public DateTime? HireDate { get; set; }

        public decimal? Salary { get; set; }

        [Required(ErrorMessage = "Loại lương là bắt buộc")]
        public SalaryType SalaryType { get; set; }

        [Required(ErrorMessage = "Vai trò là bắt buộc")]
        public EmployeeRole Role { get; set; }

        public string? UserId { get; set; }
    }
}
