using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.DTOs
{
    public class UpdateTableGroupDto
    {
        [Required(ErrorMessage = "Tên nhóm bàn là bắt buộc")]
        [StringLength(100, ErrorMessage = "Tên nhóm bàn không được vượt quá 100 ký tự")]
        public string Name { get; set; } = string.Empty;
    }
}

