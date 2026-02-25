namespace fastfood.Shared.DTOs
{
    public class CustomerResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int Age { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UserId { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public int? TierId { get; set; }
        public string? TierName { get; set; }
        public string? TierColor { get; set; }
    }
}
