using System;
using System.Collections.Generic;

namespace fastfood.Shared.DTOs
{
    public class TableGroupResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Status { get; set; }
        public string StatusName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DissolvedAt { get; set; }
        public int TableCount { get; set; }
        public int TotalCapacity { get; set; }
        public List<string> TableNumbers { get; set; } = new List<string>();
        public List<int> TableIds { get; set; } = new List<int>();
        public int ActiveOrdersCount { get; set; }
    }
}

