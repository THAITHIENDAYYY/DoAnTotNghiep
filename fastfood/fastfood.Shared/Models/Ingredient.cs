using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public class Ingredient
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        [StringLength(50)]
        public string Unit { get; set; } = string.Empty; // đơn vị: kg, g, ml, l, cái, gói...
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; } = 0; // số lượng tồn kho
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinQuantity { get; set; } = 0; // số lượng tối thiểu cảnh báo
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal PricePerUnit { get; set; } = 0; // giá mỗi đơn vị
        
        [StringLength(100)]
        public string? Supplier { get; set; } // nhà cung cấp
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<ProductIngredient> ProductIngredients { get; set; } = new List<ProductIngredient>();
    }
}

