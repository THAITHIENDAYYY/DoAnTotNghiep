namespace fastfood.Shared.DTOs
{
    public class CustomerFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsActive { get; set; }
        public decimal? MinTotalSpent { get; set; }
        public decimal? MaxTotalSpent { get; set; }
        public int? MinTotalOrders { get; set; }
        public int? MaxTotalOrders { get; set; }
        public int? TierId { get; set; }
    }
}

