using System.ComponentModel.DataAnnotations;

namespace fastfood.Shared.Models
{
    public class Customer
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        
        [StringLength(500)]
        public string? Address { get; set; }
        
        [StringLength(100)]
        public string? City { get; set; }
        
        [StringLength(20)]
        public string? PostalCode { get; set; }
        
        public DateTime DateOfBirth { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign Key to ApplicationUser
        public string? UserId { get; set; }
        
        // Navigation properties
        public virtual ApplicationUser? User { get; set; }
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
