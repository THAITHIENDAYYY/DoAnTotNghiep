using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class CreateCustomerDto
    {
        [Required(ErrorMessage = "Tên là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên không được vượt quá 100 ký tự")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Họ là bắt buộc")]
        [StringLength(100, ErrorMessage = "Họ không được vượt quá 100 ký tự")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email là bắt buộc")]
        [EmailAddress(ErrorMessage = "Email không hợp lệ")]
        [StringLength(256, ErrorMessage = "Email không được vượt quá 256 ký tự")]
        public string Email { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự")]
        public string? PhoneNumber { get; set; }

        [StringLength(500, ErrorMessage = "Địa chỉ không được vượt quá 500 ký tự")]
        public string? Address { get; set; }

        [StringLength(100, ErrorMessage = "Thành phố không được vượt quá 100 ký tự")]
        public string? City { get; set; }

        [StringLength(20, ErrorMessage = "Mã bưu điện không được vượt quá 20 ký tự")]
        public string? PostalCode { get; set; }

        [Required(ErrorMessage = "Ngày sinh là bắt buộc")]
        public DateTime DateOfBirth { get; set; }

        public string? UserId { get; set; }
    }
}
