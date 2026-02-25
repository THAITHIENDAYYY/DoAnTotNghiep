using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class OrderListResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public OrderStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public OrderType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int? EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public bool IsPaid { get; set; }
        public int ItemCount { get; set; }
        public int? TableId { get; set; }
        public string? Notes { get; set; }
        public bool HasDiscount { get; set; } // Có sử dụng mã giảm giá không
        public decimal? DiscountAmount { get; set; } // Số tiền giảm giá
    }
}
