using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Models
{
    public enum TableStatus
    {
        Available = 1,      // Trống - Sẵn sàng phục vụ
        Occupied = 2,       // Đang có khách
        Reserved = 3,       // Đã đặt trước
        Cleaning = 4,       // Đang dọn dẹp
        Maintenance = 5     // Bảo trì
    }

    public class Table
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string TableNumber { get; set; } = string.Empty; // Số bàn: B01, B02, VIP01, etc.

        [Required]
        [Range(1, 50)]
        public int Capacity { get; set; } = 4; // Số chỗ ngồi (mặc định 4 người)

        public TableStatus Status { get; set; } = TableStatus.Available;

        [StringLength(50)]
        public string? Location { get; set; } // Vị trí chi tiết: "Gần cửa sổ", "Góc phải", etc.

        [StringLength(200)]
        public string? QRCode { get; set; } // Mã QR để khách scan đặt món (optional)

        public bool IsActive { get; set; } = true; // Bàn có đang hoạt động không

        [StringLength(500)]
        public string? Notes { get; set; } // Ghi chú: "Bàn gần quạt", "View đẹp", etc.

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Foreign Key
        public int TableAreaId { get; set; }

        // Navigation properties
        public virtual TableArea TableArea { get; set; } = null!;
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}

