namespace fastfood.Shared.DTOs
{
    public class ProductIngredientResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int IngredientId { get; set; }
        public string IngredientName { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal QuantityRequired { get; set; }
        public decimal CurrentStock { get; set; }
        public bool IsLowStock { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

