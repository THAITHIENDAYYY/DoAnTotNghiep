using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class CreateOrderDto
    {
        [Required(ErrorMessage = "Khách hàng là bắt buộc")]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Loại đơn hàng là bắt buộc")]
        public OrderType Type { get; set; }

        [Required(ErrorMessage = "Danh sách sản phẩm là bắt buộc")]
        [MinLength(1, ErrorMessage = "Đơn hàng phải có ít nhất 1 sản phẩm")]
        public List<CreateOrderItemDto> OrderItems { get; set; } = new List<CreateOrderItemDto>();

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Notes { get; set; }

        public int? EmployeeId { get; set; }

        /// <summary>
        /// ID của bàn (nếu là đơn tại bàn)
        /// </summary>
        public int? TableId { get; set; }

        /// <summary>
        /// ID của nhóm bàn đã ghép (nếu có)
        /// </summary>
        public int? TableGroupId { get; set; }

        /// <summary>
        /// Có áp dụng thuế VAT không (mặc định là true)
        /// </summary>
        public bool IncludeVAT { get; set; } = true;

        /// <summary>
        /// ID của mã giảm giá áp dụng (nếu có)
        /// </summary>
        public int? DiscountId { get; set; }
    }
}
