using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class UpdateDiscountDto
    {
        [Required(ErrorMessage = "Mã giảm giá là bắt buộc")]
        [StringLength(50, ErrorMessage = "Mã giảm giá không được vượt quá 50 ký tự")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "Tên chương trình giảm giá là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Loại giảm giá là bắt buộc")]
        public DiscountType Type { get; set; }

        // DiscountValue chỉ bắt buộc cho Percentage và FixedAmount, không bắt buộc cho BuyXGetY
        [Range(0, double.MaxValue, ErrorMessage = "Giá trị giảm giá không được âm")]
        public decimal DiscountValue { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá trị đơn hàng tối thiểu không được âm")]
        public decimal? MinOrderAmount { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Số tiền giảm tối đa không được âm")]
        public decimal? MaxDiscountAmount { get; set; }

        [Required(ErrorMessage = "Ngày bắt đầu là bắt buộc")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "Ngày kết thúc là bắt buộc")]
        public DateTime EndDate { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lần sử dụng tối đa phải lớn hơn 0")]
        public int? UsageLimit { get; set; }

        public bool IsActive { get; set; } = true;

        public List<int>? ApplicableProductIds { get; set; }

        public List<int>? ApplicableCategoryIds { get; set; }

        public List<int>? ApplicableCustomerTierIds { get; set; } // Áp dụng cho hạng khách hàng cụ thể (null = tất cả)

        public List<int>? ApplicableEmployeeRoleIds { get; set; } // Áp dụng cho vai trò nhân viên cụ thể (null = tất cả)

        // Cho BuyXGetY: Số lượng cần mua để được tặng (ví dụ: mua 2)
        // Validation được xử lý trong Controller
        public int? BuyQuantity { get; set; }

        // Cho BuyXGetY: ID sản phẩm được tặng
        public int? FreeProductId { get; set; }

        // Cho BuyXGetY: Số lượng sản phẩm được tặng (thường là 1)
        // Validation được xử lý trong Controller
        public int? FreeProductQuantity { get; set; }

        // Cho BuyXGetY: Loại giảm giá cho sản phẩm tặng (0 = Free, 1 = Percentage, 2 = FixedAmount)
        public int? FreeProductDiscountType { get; set; }

        // Cho BuyXGetY: Giá trị giảm cho sản phẩm tặng (% hoặc số tiền)
        [Range(0, double.MaxValue, ErrorMessage = "Giá trị giảm không được âm")]
        public decimal? FreeProductDiscountValue { get; set; }
    }
}

