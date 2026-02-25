namespace fastfood.Shared.DTOs;

public class DashboardStatsDto
{
    public decimal TodayRevenue { get; set; }
    public decimal WeekRevenue { get; set; }
    public decimal MonthRevenue { get; set; }
    public decimal YearRevenue { get; set; }
    
    public int TodayOrders { get; set; }
    public int WeekOrders { get; set; }
    public int MonthOrders { get; set; }
    public int YearOrders { get; set; }
    
    public int TotalCustomers { get; set; }
    public int TotalProducts { get; set; }
    public int TotalEmployees { get; set; }
    public int TotalTables { get; set; }
    
    public int LowStockProducts { get; set; }
    public int OutOfStockProducts { get; set; }
    
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<RevenueByDateDto> RevenueChart { get; set; } = new();
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalSold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class RevenueByDateDto
{
    public DateTime Date { get; set; }
    public decimal Revenue { get; set; }
    public int Orders { get; set; }
}

