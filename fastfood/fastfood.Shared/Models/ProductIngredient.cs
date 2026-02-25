using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public class ProductIngredient
    {
        public int Id { get; set; }
        
        // Foreign Keys
        public int ProductId { get; set; }
        public int IngredientId { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal QuantityRequired { get; set; } // Số lượng nguyên liệu cần cho 1 đơn vị sản phẩm
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Product Product { get; set; } = null!;
        public virtual Ingredient Ingredient { get; set; } = null!;
    }
}

