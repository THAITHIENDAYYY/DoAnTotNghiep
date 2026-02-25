namespace fastfood.Shared.DTOs
{
    public class CustomerListResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? City { get; set; }
        public bool IsActive { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalSpent { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public int? TierId { get; set; }
        public string? TierName { get; set; }
        public string? TierColor { get; set; }
    }
}
