using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class UpdateOrderDto
    {
        [Required(ErrorMessage = "Trạng thái đơn hàng là bắt buộc")]
        public OrderStatus Status { get; set; }

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Notes { get; set; }

        public int? EmployeeId { get; set; }

        /// <summary>
        /// ID của bàn mới (để chuyển bàn)
        /// </summary>
        public int? TableId { get; set; }

        /// <summary>
        /// ID của mã giảm giá (để áp dụng hoặc thay đổi discount)
        /// </summary>
        public int? DiscountId { get; set; }

        /// <summary>
        /// Danh sách món ăn (để cập nhật giỏ hàng)
        /// </summary>
        public List<CreateOrderItemDto>? OrderItems { get; set; }
    }
}
