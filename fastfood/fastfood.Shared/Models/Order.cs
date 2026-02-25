using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public enum OrderStatus
    {
        Pending = 1,
        Confirmed = 2,
        Preparing = 3,
        Ready = 4,
        Delivered = 5,
        Cancelled = 6
    }
    
    public enum OrderType
    {
        DineIn = 1,
        Takeaway = 2,
        Delivery = 3
    }
    
    public class Order
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; } = string.Empty;
        
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        
        public OrderType Type { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal DeliveryFee { get; set; } = 0;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? ConfirmedAt { get; set; }
        
        public DateTime? PreparedAt { get; set; }
        
        public DateTime? DeliveredAt { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountAmount { get; set; } // Số tiền được giảm giá

        // Foreign Keys
        public int CustomerId { get; set; }
        
        public int? EmployeeId { get; set; }
        
        public int? TableId { get; set; } // Nullable vì takeaway/delivery không cần bàn

        public int? TableGroupId { get; set; } // Nullable - ID của nhóm bàn đã ghép (nếu có)

        public int? DiscountId { get; set; } // Mã giảm giá áp dụng (nếu có)
        
        // Navigation properties
        public virtual Customer Customer { get; set; } = null!;
        public virtual Employee? Employee { get; set; }
        public virtual Table? Table { get; set; } // Bàn phục vụ (nếu là DineIn)
        public virtual TableGroup? TableGroup { get; set; } // Nhóm bàn đã ghép (nếu có)
        public virtual Discount? Discount { get; set; } // Mã giảm giá áp dụng
        public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
