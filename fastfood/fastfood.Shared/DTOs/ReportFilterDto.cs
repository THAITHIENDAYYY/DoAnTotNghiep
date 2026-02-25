namespace fastfood.Shared.DTOs;

public class ReportFilterDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? CategoryId { get; set; }
    public int? EmployeeId { get; set; }
    public string? ReportType { get; set; } // "daily", "weekly", "monthly", "yearly"
}

public class SalesReportDto
{
    public DateTime ReportDate { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalItems { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<ProductSalesDto> ProductSales { get; set; } = new();
}

public class ProductSalesDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AveragePrice { get; set; }
}

