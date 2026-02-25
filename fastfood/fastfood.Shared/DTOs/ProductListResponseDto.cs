namespace fastfood.Shared.DTOs
{
    public class ProductListResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsAvailable { get; set; }
        public bool IsActive { get; set; }
        public int StockQuantity { get; set; }
        public string? SKU { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public bool IsLowStock { get; set; }
        
        /// <summary>
        /// Số lượng sản phẩm có thể làm dựa trên tồn kho nguyên liệu
        /// Tính = MIN(TồnKhoNguyênLiệu / SốLượngCần) cho tất cả nguyên liệu
        /// </summary>
        public int AvailableQuantityByIngredients { get; set; }
        public int MinStockLevel { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
