using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class CreateTableAreaDto
    {
        [Required(ErrorMessage = "Tên khu vực là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên khu vực không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsActive { get; set; } = true;
    }
}

