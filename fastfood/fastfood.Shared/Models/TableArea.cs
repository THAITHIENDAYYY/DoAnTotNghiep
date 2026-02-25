using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Models
{
    public class TableArea
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // Tầng 1, Tầng 2, VIP, Sân vườn, etc.

        [StringLength(500)]
        public string? Description { get; set; }

        public int DisplayOrder { get; set; } = 0; // Thứ tự hiển thị

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Table> Tables { get; set; } = new List<Table>();
    }
}

