using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class UpdateOrderItemDto
    {
        [Required(ErrorMessage = "Số lượng là bắt buộc")]
        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int Quantity { get; set; }

        [StringLength(200, ErrorMessage = "Ghi chú đặc biệt không được vượt quá 200 ký tự")]
        public string? SpecialInstructions { get; set; }
    }
}
