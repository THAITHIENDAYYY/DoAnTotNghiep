using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public class CustomerTier
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal MinimumSpent { get; set; }

        [StringLength(7)]
        public string ColorHex { get; set; } = "#FF6B35";

        [StringLength(250)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }
}

