using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class DiscountListResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public DiscountType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsValid { get; set; } // Còn hiệu lực không
    }
}

