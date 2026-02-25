using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class UpdateProductDto
    {
        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc")]
        [StringLength(200, ErrorMessage = "Tên sản phẩm không được vượt quá 200 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Mô tả không được vượt quá 1000 ký tự")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Giá sản phẩm là bắt buộc")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá sản phẩm phải lớn hơn 0")]
        public decimal Price { get; set; }

        [StringLength(200, ErrorMessage = "URL hình ảnh không được vượt quá 200 ký tự")]
        public string? ImageUrl { get; set; }

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public int CategoryId { get; set; }

        public bool IsAvailable { get; set; } = true;

        public bool IsActive { get; set; } = true;

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn kho không được âm")]
        public int StockQuantity { get; set; } = 0;

        [Range(0, int.MaxValue, ErrorMessage = "Mức tồn kho tối thiểu không được âm")]
        public int MinStockLevel { get; set; } = 5;

        [StringLength(50, ErrorMessage = "SKU không được vượt quá 50 ký tự")]
        public string? SKU { get; set; }
    }
}
