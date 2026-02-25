using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class CustomerTierDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal MinimumSpent { get; set; }
        public string ColorHex { get; set; } = "#FF6B35";
        public string? Description { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class CreateCustomerTierDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Range(0, double.MaxValue)]
        public decimal MinimumSpent { get; set; }

        [StringLength(7)]
        public string ColorHex { get; set; } = "#FF6B35";

        [StringLength(250)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;
    }

    public class UpdateCustomerTierDto : CreateCustomerTierDto
    {
    }
}

