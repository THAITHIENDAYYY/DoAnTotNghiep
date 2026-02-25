using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public enum PaymentMethod
    {
        Cash = 1,
        CreditCard = 2,
        DebitCard = 3,
        MobilePayment = 4,
        BankTransfer = 5
    }
    
    public enum PaymentStatus
    {
        Pending = 1,
        Completed = 2,
        Failed = 3,
        Refunded = 4,
        Cancelled = 5
    }
    
    public class Payment
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string TransactionId { get; set; } = string.Empty;
        
        public PaymentMethod Method { get; set; }
        
        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [StringLength(100)]
        public string? ReferenceNumber { get; set; }
        
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? CompletedAt { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        // Foreign Key
        public int OrderId { get; set; }
        
        // Navigation properties
        public virtual Order Order { get; set; } = null!;
    }
}
