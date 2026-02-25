namespace fastfood.Shared.DTOs
{
    public class IngredientListResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal MinQuantity { get; set; }
        public decimal PricePerUnit { get; set; }
        public string? Supplier { get; set; }
        public bool IsActive { get; set; }
        public bool IsLowStock { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

