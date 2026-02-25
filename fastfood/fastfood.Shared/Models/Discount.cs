using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fastfood.Shared.Models
{
    public enum DiscountType
    {
        Percentage = 1,    // Giảm theo phần trăm
        FixedAmount = 2,   // Giảm số tiền cố định
        BuyXGetY = 3       // Mua X tặng Y (ví dụ: Mua 2 tặng 1)
    }

    public class Discount
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty; // Mã giảm giá (VD: "GIAM10K", "SALE50")

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty; // Tên chương trình giảm giá

        [StringLength(1000)]
        public string? Description { get; set; }

        [Required]
        public DiscountType Type { get; set; } // Loại giảm giá

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountValue { get; set; } // Giá trị giảm (phần trăm hoặc số tiền)

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinOrderAmount { get; set; } // Giá trị đơn hàng tối thiểu để áp dụng

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxDiscountAmount { get; set; } // Số tiền giảm tối đa (cho phần trăm)

        public DateTime StartDate { get; set; } // Ngày bắt đầu

        public DateTime EndDate { get; set; } // Ngày kết thúc

        public int? UsageLimit { get; set; } // Số lần sử dụng tối đa (null = không giới hạn)

        public int UsedCount { get; set; } = 0; // Số lần đã sử dụng

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

        // Áp dụng cho sản phẩm cụ thể (nếu null thì áp dụng cho tất cả)
        public virtual ICollection<Product> ApplicableProducts { get; set; } = new List<Product>();

        // Áp dụng cho danh mục cụ thể (nếu null thì áp dụng cho tất cả)
        public virtual ICollection<Category> ApplicableCategories { get; set; } = new List<Category>();

        // Áp dụng cho hạng khách hàng cụ thể (nếu null thì áp dụng cho tất cả khách hàng)
        public virtual ICollection<CustomerTier> ApplicableCustomerTiers { get; set; } = new List<CustomerTier>();

        // Áp dụng cho vai trò nhân viên cụ thể (null = tất cả, danh sách = chỉ các role được chọn)
        public string? ApplicableEmployeeRoles { get; set; } // JSON array: [1, 2, 3] hoặc null = tất cả

        // Cho BuyXGetY: Số lượng cần mua để được tặng (ví dụ: mua 2)
        public int? BuyQuantity { get; set; }

        // Cho BuyXGetY: ID sản phẩm được tặng
        public int? FreeProductId { get; set; }

        // Cho BuyXGetY: Navigation property đến sản phẩm được tặng
        public virtual Product? FreeProduct { get; set; }

        // Cho BuyXGetY: Số lượng sản phẩm được tặng (thường là 1)
        public int? FreeProductQuantity { get; set; } = 1;

        // Cho BuyXGetY: Loại giảm giá cho sản phẩm tặng (Free = miễn phí, Percentage = giảm %, FixedAmount = giảm số tiền)
        public int? FreeProductDiscountType { get; set; } // 0 = Free, 1 = Percentage, 2 = FixedAmount

        // Cho BuyXGetY: Giá trị giảm cho sản phẩm tặng (% hoặc số tiền)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? FreeProductDiscountValue { get; set; }
    }

    public enum FreeProductDiscountType
    {
        Free = 0,           // Miễn phí (tặng)
        Percentage = 1,     // Giảm theo phần trăm
        FixedAmount = 2     // Giảm số tiền cố định
    }
}

