using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;

namespace fastfood.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(ApplicationDbContext context, ILogger<ReportsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard statistics (today, week, month, year)
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        try
        {
            var now = DateTimeHelper.VietnamNow;
            var today = now.Date;
            var weekStart = today.AddDays(-(int)today.DayOfWeek);
            var monthStart = new DateTime(now.Year, now.Month, 1);
            var yearStart = new DateTime(now.Year, 1, 1);

            // Get all orders with items
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .ToListAsync();

            // Today stats
            var todayOrders = orders.Where(o => o.OrderDate >= today).ToList();
            var todayRevenue = todayOrders.Sum(o => o.TotalAmount);

            // Week stats
            var weekOrders = orders.Where(o => o.OrderDate >= weekStart).ToList();
            var weekRevenue = weekOrders.Sum(o => o.TotalAmount);

            // Month stats
            var monthOrders = orders.Where(o => o.OrderDate >= monthStart).ToList();
            var monthRevenue = monthOrders.Sum(o => o.TotalAmount);

            // Year stats
            var yearOrders = orders.Where(o => o.OrderDate >= yearStart).ToList();
            var yearRevenue = yearOrders.Sum(o => o.TotalAmount);

            // Entity counts
            var totalCustomers = await _context.Customers.CountAsync();
            var totalProducts = await _context.Products.CountAsync();
            var totalEmployees = await _context.Employees.CountAsync();
            var totalTables = await _context.Tables.CountAsync();

            // Stock alerts
            var lowStockProducts = await _context.Products
                .Where(p => p.StockQuantity > 0 && p.StockQuantity <= 5)
                .CountAsync();
            var outOfStockProducts = await _context.Products
                .Where(p => p.StockQuantity == 0)
                .CountAsync();

            // Top products (last 30 days)
            var last30Days = today.AddDays(-30);
            var topProducts = await _context.OrderItems
                .Include(oi => oi.Product)
                .Where(oi => oi.Order!.OrderDate >= last30Days && oi.Order.Status != OrderStatus.Cancelled)
                .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalSold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.TotalPrice)
                })
                .OrderByDescending(p => p.TotalRevenue)
                .Take(10)
                .ToListAsync();

            // Revenue chart (last 7 days)
            var last7Days = today.AddDays(-6);
            var revenueChart = Enumerable.Range(0, 7)
                .Select(i => {
                    var date = last7Days.AddDays(i);
                    var dayOrders = orders.Where(o => o.OrderDate.Date == date).ToList();
                    return new RevenueByDateDto
                    {
                        Date = date,
                        Revenue = dayOrders.Sum(o => o.TotalAmount),
                        Orders = dayOrders.Count
                    };
                })
                .ToList();

            var stats = new DashboardStatsDto
            {
                TodayRevenue = todayRevenue,
                WeekRevenue = weekRevenue,
                MonthRevenue = monthRevenue,
                YearRevenue = yearRevenue,
                TodayOrders = todayOrders.Count,
                WeekOrders = weekOrders.Count,
                MonthOrders = monthOrders.Count,
                YearOrders = yearOrders.Count,
                TotalCustomers = totalCustomers,
                TotalProducts = totalProducts,
                TotalEmployees = totalEmployees,
                TotalTables = totalTables,
                LowStockProducts = lowStockProducts,
                OutOfStockProducts = outOfStockProducts,
                TopProducts = topProducts,
                RevenueChart = revenueChart
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard stats");
            return StatusCode(500, new { message = "Lỗi khi lấy thống kê dashboard" });
        }
    }

    /// <summary>
    /// Get sales report with filters
    /// </summary>
    [HttpPost("sales")]
    public async Task<ActionResult<SalesReportDto>> GetSalesReport([FromBody] ReportFilterDto filter)
    {
        try
        {
            // Default date range: last 30 days
            var endDate = filter.EndDate ?? DateTimeHelper.VietnamNow;
            var startDate = filter.StartDate ?? endDate.AddDays(-30);

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .ToListAsync();

            // Filter by employee if specified
            if (filter.EmployeeId.HasValue)
            {
                orders = orders.Where(o => o.EmployeeId == filter.EmployeeId).ToList();
            }

            var totalRevenue = orders.Sum(o => o.TotalAmount);
            var totalOrders = orders.Count;
            var totalItems = orders.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity);
            var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

            // Product sales breakdown
            var productSales = orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => new 
                { 
                    oi.ProductId, 
                    ProductName = oi.Product!.Name,
                    CategoryName = oi.Product.Category?.Name ?? "Không có danh mục"
                })
                .Select(g => new ProductSalesDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.TotalPrice),
                    AveragePrice = g.Average(oi => oi.UnitPrice)
                })
                .OrderByDescending(p => p.TotalRevenue)
                .ToList();

            // Filter by category if specified
            if (filter.CategoryId.HasValue)
            {
                var categoryProducts = await _context.Products
                    .Where(p => p.CategoryId == filter.CategoryId)
                    .Select(p => p.Id)
                    .ToListAsync();
                productSales = productSales.Where(ps => categoryProducts.Contains(ps.ProductId)).ToList();
            }

            var report = new SalesReportDto
            {
                ReportDate = DateTimeHelper.VietnamNow,
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                TotalItems = totalItems,
                AverageOrderValue = averageOrderValue,
                ProductSales = productSales
            };

            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating sales report");
            return StatusCode(500, new { message = "Lỗi khi tạo báo cáo bán hàng" });
        }
    }

    /// <summary>
    /// Get revenue by date range (for charts)
    /// </summary>
    [HttpGet("revenue-chart")]
    public async Task<ActionResult<List<RevenueByDateDto>>> GetRevenueChart(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] string groupBy = "day") // day, week, month
    {
        try
        {
            var end = endDate ?? DateTimeHelper.VietnamNow;
            var start = startDate ?? end.AddDays(-30);

            var orders = await _context.Orders
                .Where(o => o.OrderDate >= start && o.OrderDate <= end)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .Select(o => new { o.OrderDate, o.TotalAmount })
                .ToListAsync();

            List<RevenueByDateDto> chartData;

            if (groupBy == "month")
            {
                chartData = orders
                    .GroupBy(o => new DateTime(o.OrderDate.Year, o.OrderDate.Month, 1))
                    .Select(g => new RevenueByDateDto
                    {
                        Date = g.Key,
                        Revenue = g.Sum(o => o.TotalAmount),
                        Orders = g.Count()
                    })
                    .OrderBy(r => r.Date)
                    .ToList();
            }
            else if (groupBy == "week")
            {
                chartData = orders
                    .GroupBy(o => o.OrderDate.Date.AddDays(-(int)o.OrderDate.DayOfWeek))
                    .Select(g => new RevenueByDateDto
                    {
                        Date = g.Key,
                        Revenue = g.Sum(o => o.TotalAmount),
                        Orders = g.Count()
                    })
                    .OrderBy(r => r.Date)
                    .ToList();
            }
            else // day
            {
                chartData = orders
                    .GroupBy(o => o.OrderDate.Date)
                    .Select(g => new RevenueByDateDto
                    {
                        Date = g.Key,
                        Revenue = g.Sum(o => o.TotalAmount),
                        Orders = g.Count()
                    })
                    .OrderBy(r => r.Date)
                    .ToList();
            }

            return Ok(chartData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating revenue chart");
            return StatusCode(500, new { message = "Lỗi khi tạo biểu đồ doanh thu" });
        }
    }

    /// <summary>
    /// Get product performance report
    /// </summary>
    [HttpGet("products/performance")]
    public async Task<ActionResult<List<ProductSalesDto>>> GetProductPerformance(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int? categoryId)
    {
        try
        {
            var end = endDate ?? DateTimeHelper.VietnamNow;
            var start = startDate ?? end.AddDays(-30);

            var query = _context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order!.OrderDate >= start && oi.Order.OrderDate <= end)
                .Where(oi => oi.Order!.Status != OrderStatus.Cancelled);

            if (categoryId.HasValue)
            {
                query = query.Where(oi => oi.Product!.CategoryId == categoryId);
            }

            var productPerformance = await query
                .GroupBy(oi => new
                {
                    oi.ProductId,
                    ProductName = oi.Product!.Name,
                    CategoryName = oi.Product.Category!.Name
                })
                .Select(g => new ProductSalesDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName,
                    CategoryName = g.Key.CategoryName,
                    QuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.TotalPrice),
                    AveragePrice = g.Average(oi => oi.UnitPrice)
                })
                .OrderByDescending(p => p.TotalRevenue)
                .ToListAsync();

            return Ok(productPerformance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting product performance");
            return StatusCode(500, new { message = "Lỗi khi lấy hiệu suất sản phẩm" });
        }
    }
}

