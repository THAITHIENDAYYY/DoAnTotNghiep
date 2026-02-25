using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class PaymentListResponseDto
    {
        public int Id { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public PaymentMethod Method { get; set; }
        public string MethodName { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? ReferenceNumber { get; set; }
        public DateTime PaymentDate { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal OrderTotal { get; set; }
        public bool IsFullyPaid { get; set; }
        public string? CustomerName { get; set; }
    }
}
