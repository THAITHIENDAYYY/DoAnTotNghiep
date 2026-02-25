using System.Collections.Generic;

namespace fastfood.Shared.DTOs
{
    public class TableGroupListResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public int TableCount { get; set; }
        public int TotalCapacity { get; set; }
        public List<string> TableNumbers { get; set; } = new List<string>();
        public int ActiveOrdersCount { get; set; }
    }
}

