using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Đơn hàng là bắt buộc")]
        public int OrderId { get; set; }

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc")]
        public PaymentMethod Method { get; set; }

        [Required(ErrorMessage = "Số tiền là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0")]
        public decimal Amount { get; set; }

        [StringLength(100, ErrorMessage = "Số tham chiếu không được vượt quá 100 ký tự")]
        public string? ReferenceNumber { get; set; }

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Notes { get; set; }
    }
}
