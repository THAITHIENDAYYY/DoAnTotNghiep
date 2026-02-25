using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class CreateTableGroupDto
    {
        [Required(ErrorMessage = "Tên nhóm bàn là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên nhóm bàn không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Danh sách bàn là bắt buộc")]
        [MinLength(2, ErrorMessage = "Phải chọn ít nhất 2 bàn để ghép")]
        public List<int> TableIds { get; set; } = new List<int>();
    }
}

