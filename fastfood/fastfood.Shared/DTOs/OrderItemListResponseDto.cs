namespace fastfood.Shared.DTOs
{
    public class OrderItemListResponseDto
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? SpecialInstructions { get; set; }
        public string CategoryName { get; set; } = string.Empty;
    }
}
