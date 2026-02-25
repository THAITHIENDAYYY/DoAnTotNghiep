namespace fastfood.Shared.DTOs
{
    public class TableListResponseDto
    {
        public int Id { get; set; }
        public string TableNumber { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int TableAreaId { get; set; }
        public string TableAreaName { get; set; } = string.Empty;
        public string? Location { get; set; }
        public bool IsActive { get; set; }
        public int ActiveOrdersCount { get; set; } // Số đơn hàng đang hoạt động
    }
}

