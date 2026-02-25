using System.ComponentModel.DataAnnotations;
using fastfood.Shared.Models;

namespace fastfood.Shared.DTOs
{
    public class CreateTableDto
    {
        [Required(ErrorMessage = "Số bàn là bắt buộc")]
        [StringLength(20, ErrorMessage = "Số bàn không được vượt quá 20 ký tự")]
        public string TableNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số chỗ ngồi là bắt buộc")]
        [Range(1, 50, ErrorMessage = "Số chỗ ngồi phải từ 1 đến 50")]
        public int Capacity { get; set; } = 4;

        [Required(ErrorMessage = "Trạng thái là bắt buộc")]
        public TableStatus Status { get; set; } = TableStatus.Available;

        [Required(ErrorMessage = "Khu vực là bắt buộc")]
        public int TableAreaId { get; set; }

        [StringLength(50, ErrorMessage = "Vị trí không được vượt quá 50 ký tự")]
        public string? Location { get; set; }

        [StringLength(200, ErrorMessage = "Mã QR không được vượt quá 200 ký tự")]
        public string? QRCode { get; set; }

        public bool IsActive { get; set; } = true;

        [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
        public string? Notes { get; set; }
    }
}

