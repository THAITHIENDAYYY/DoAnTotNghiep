using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class OrderFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public OrderStatus? Status { get; set; }
        public OrderType? Type { get; set; }
        public int? EmployeeId { get; set; }
        public int? CustomerId { get; set; }
        public int? TableId { get; set; }
        public int? TableGroupId { get; set; }
    }
}

