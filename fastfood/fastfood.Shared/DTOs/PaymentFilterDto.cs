using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class PaymentFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public PaymentStatus? Status { get; set; }
        public int? OrderId { get; set; }
        public string? TransactionId { get; set; }
    }
}

