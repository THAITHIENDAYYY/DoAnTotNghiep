using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class AddProductIngredientDto
    {
        [Required(ErrorMessage = "ID nguyên liệu là bắt buộc")]
        public int IngredientId { get; set; }
        
        [Required(ErrorMessage = "Số lượng là bắt buộc")]
        public decimal QuantityRequired { get; set; }
    }
}

