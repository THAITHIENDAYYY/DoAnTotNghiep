using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public OrderType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public decimal SubTotal { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public int? DiscountId { get; set; }
        public string? Notes { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? PreparedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public int? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public List<OrderItemResponseDto> OrderItems { get; set; } = new List<OrderItemResponseDto>();
        public bool IsPaid { get; set; }
        public decimal PaidAmount { get; set; }
    }
}
