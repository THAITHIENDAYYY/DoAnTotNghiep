using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Models
{
    /// <summary>
    /// Bảng trung gian để liên kết TableGroup với Table (Many-to-Many)
    /// </summary>
    public class TableGroupTable
    {
        public int Id { get; set; }

        [Required]
        public int TableGroupId { get; set; }

        [Required]
        public int TableId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual TableGroup TableGroup { get; set; } = null!;
        public virtual Table Table { get; set; } = null!;
    }
}

