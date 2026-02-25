using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class DiscountResponseDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DiscountType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsValid { get; set; } // Còn hiệu lực không (trong thời gian áp dụng và chưa hết lượt)
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<int> ApplicableProductIds { get; set; } = new List<int>();
        public List<int> ApplicableCategoryIds { get; set; } = new List<int>();
        public List<int> ApplicableCustomerTierIds { get; set; } = new List<int>();
        public List<int> ApplicableEmployeeRoleIds { get; set; } = new List<int>();
        
        // Cho BuyXGetY
        public int? BuyQuantity { get; set; }
        public int? FreeProductId { get; set; }
        public string? FreeProductName { get; set; }
        public int? FreeProductQuantity { get; set; }
        public int? FreeProductDiscountType { get; set; }
        public string? FreeProductDiscountTypeName { get; set; }
        public decimal? FreeProductDiscountValue { get; set; }
    }
}

