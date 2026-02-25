using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Models
{
    public enum TableGroupStatus
    {
        Active = 1,      // Đang hoạt động (đã ghép)
        Dissolved = 2    // Đã hủy ghép
    }

    public class TableGroup
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // Tên tạm thời: "Nhóm bạn A", "Tiệc sinh nhật", etc.

        public TableGroupStatus Status { get; set; } = TableGroupStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DissolvedAt { get; set; } // Thời điểm hủy ghép

        // Navigation properties
        public virtual ICollection<TableGroupTable> TableGroupTables { get; set; } = new List<TableGroupTable>();
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}

