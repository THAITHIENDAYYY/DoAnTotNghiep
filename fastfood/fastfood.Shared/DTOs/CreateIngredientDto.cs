using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class CreateIngredientDto
    {
        [Required(ErrorMessage = "Tên nguyên liệu là bắt buộc")]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        [Required(ErrorMessage = "Đơn vị là bắt buộc")]
        [StringLength(50)]
        public string Unit { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "Số lượng là bắt buộc")]
        public decimal Quantity { get; set; }
        
        [Required(ErrorMessage = "Số lượng tối thiểu là bắt buộc")]
        public decimal MinQuantity { get; set; }
        
        [Required(ErrorMessage = "Giá mỗi đơn vị là bắt buộc")]
        public decimal PricePerUnit { get; set; }
        
        [StringLength(100)]
        public string? Supplier { get; set; }
    }
}

