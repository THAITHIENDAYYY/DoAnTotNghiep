using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class UpdatePaymentDto
    {
        [Required(ErrorMessage = "Trạng thái thanh toán là bắt buộc")]
        public PaymentStatus Status { get; set; }

        [StringLength(100, ErrorMessage = "Số tham chiếu không được vượt quá 100 ký tự")]
        public string? ReferenceNumber { get; set; }

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Notes { get; set; }
    }
}
