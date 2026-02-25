using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;
using ClosedXML.Excel;
using System.Data;

namespace fastfood.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ExportController> _logger;

    public ExportController(ApplicationDbContext context, ILogger<ExportController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Export sales report to Excel
    /// </summary>
    [HttpPost("sales-report")]
    public async Task<IActionResult> ExportSalesReport([FromBody] ReportFilterDto filter)
    {
        try
        {
            var endDate = filter.EndDate ?? DateTimeHelper.VietnamNow;
            var startDate = filter.StartDate ?? endDate.AddDays(-30);

            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Include(o => o.Employee)
                .Include(o => o.Customer)
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate)
                .Where(o => o.Status != OrderStatus.Cancelled)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            
            // Sheet 1: Summary
            var summarySheet = workbook.Worksheets.Add("Tổng Quan");
            CreateSummarySheet(summarySheet, orders, startDate, endDate);
            
            // Sheet 2: Detailed Orders
            var detailsSheet = workbook.Worksheets.Add("Chi Tiết Đơn Hàng");
            CreateOrderDetailsSheet(detailsSheet, orders);
            
            // Sheet 3: Product Performance
            var productsSheet = workbook.Worksheets.Add("Hiệu Suất Sản Phẩm");
            CreateProductPerformanceSheet(productsSheet, orders);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var fileName = $"BaoCaoBanHang_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.xlsx";
            
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting sales report");
            return StatusCode(500, new { message = "Lỗi khi xuất báo cáo" });
        }
    }

    /// <summary>
    /// Export orders list (theo bộ lọc ngày) ra Excel
    /// </summary>
    [HttpGet("orders")]
    public async Task<IActionResult> ExportOrders([FromQuery] OrderFilterDto? filter)
    {
        try
        {
            var ordersQuery = _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Employee)
                .Include(o => o.Customer)
                .AsQueryable();

            ordersQuery = ApplyOrderFilter(ordersQuery, filter);

            var orders = await ordersQuery
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Danh Sách Đơn Hàng");
            CreateOrderDetailsSheet(worksheet, orders);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var startLabel = filter?.StartDate?.ToString("yyyyMMdd") ?? "all";
            var endLabel = filter?.EndDate?.ToString("yyyyMMdd") ?? "all";
            var fileName = $"DonHang_{startLabel}_{endLabel}_{DateTimeHelper.VietnamNow:HHmmss}.xlsx";

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting orders");
            return StatusCode(500, new { message = "Lỗi khi xuất đơn hàng" });
        }
    }

    /// <summary>
    /// Export customers list ra Excel
    /// </summary>
    [HttpGet("customers")]
    public async Task<IActionResult> ExportCustomers([FromQuery] CustomerFilterDto? filter)
    {
        try
        {
            var customersQuery = _context.Customers
                .Include(c => c.Orders)
                .AsQueryable();

            customersQuery = ApplyCustomerFilter(customersQuery, filter);

            var customers = await customersQuery
                .Select(c => new CustomerListResponseDto
                {
                    Id = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    FullName = c.FirstName + " " + c.LastName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    City = c.City,
                    IsActive = c.IsActive,
                    TotalOrders = c.Orders.Count,
                    TotalSpent = c.Orders.Sum(o => o.TotalAmount),
                    CreatedAt = c.CreatedAt,
                    LastOrderDate = c.Orders.Max(o => (DateTime?)o.OrderDate)
                })
                .OrderByDescending(c => c.TotalSpent)
                .ToListAsync();

            await AssignCustomerTiersAsync(customers);

            if (filter != null)
            {
                customers = ApplyCustomerInMemoryFilters(customers, filter);
            }

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Khach Hang");
            CreateCustomerSheet(worksheet, customers);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var startLabel = filter?.StartDate?.ToString("yyyyMMdd") ?? "all";
            var endLabel = filter?.EndDate?.ToString("yyyyMMdd") ?? "all";
            var fileName = $"KhachHang_{startLabel}_{endLabel}_{DateTimeHelper.VietnamNow:HHmmss}.xlsx";

            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting customers");
            return StatusCode(500, new { message = "Lỗi khi xuất khách hàng" });
        }
    }

    /// <summary>
    /// Export products list to Excel
    /// </summary>
    [HttpGet("products")]
    public async Task<IActionResult> ExportProducts()
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .OrderBy(p => p.Name)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Danh Sách Sản Phẩm");

            // Headers
            worksheet.Cell(1, 1).Value = "STT";
            worksheet.Cell(1, 2).Value = "Tên Sản Phẩm";
            worksheet.Cell(1, 3).Value = "Danh Mục";
            worksheet.Cell(1, 4).Value = "SKU";
            worksheet.Cell(1, 5).Value = "Giá Bán";
            worksheet.Cell(1, 6).Value = "Tồn Kho";
            worksheet.Cell(1, 7).Value = "SL Tối Thiểu";
            worksheet.Cell(1, 8).Value = "Có thể làm";
            worksheet.Cell(1, 9).Value = "Trạng Thái";
            worksheet.Cell(1, 10).Value = "Ngày Tạo";
            worksheet.Cell(1, 11).Value = "Ngày Cập Nhật";

            // Style headers
            var headerRange = worksheet.Range(1, 1, 1, 11);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
            headerRange.Style.Font.FontColor = XLColor.White;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Data
            int row = 2;
            foreach (var product in products)
            {
                worksheet.Cell(row, 1).Value = row - 1;
                worksheet.Cell(row, 2).Value = product.Name;
                worksheet.Cell(row, 3).Value = product.Category?.Name ?? "N/A";
                worksheet.Cell(row, 4).Value = product.SKU ?? string.Empty;
                worksheet.Cell(row, 5).Value = product.Price;
                worksheet.Cell(row, 6).Value = product.StockQuantity;
                worksheet.Cell(row, 7).Value = product.MinStockLevel;
                worksheet.Cell(row, 8).Value = product.ProductIngredients != null && product.ProductIngredients.Any()
                    ? product.ProductIngredients
                        .Where(pi => pi.QuantityRequired > 0 && pi.Ingredient != null)
                        .Select(pi => (int)Math.Floor(pi.Ingredient!.Quantity / pi.QuantityRequired))
                        .DefaultIfEmpty(product.StockQuantity)
                        .Min()
                    : product.StockQuantity;
                worksheet.Cell(row, 9).Value = product.IsAvailable ? "Có sẵn" : "Không có";
                worksheet.Cell(row, 10).Value = product.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                worksheet.Cell(row, 11).Value = product.UpdatedAt?.ToString("dd/MM/yyyy HH:mm") ?? "—";
                row++;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var fileName = $"DanhSachSanPham_{DateTimeHelper.VietnamNow:yyyyMMdd_HHmmss}.xlsx";
            
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting products");
            return StatusCode(500, new { message = "Lỗi khi xuất danh sách sản phẩm" });
        }
    }

    /// <summary>
    /// Export inventory/ingredients to Excel
    /// </summary>
    [HttpGet("inventory")]
    public async Task<IActionResult> ExportInventory()
    {
        try
        {
            var ingredients = await _context.Ingredients
                .OrderBy(i => i.Name)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Tồn Kho Nguyên Liệu");

            // Headers
            worksheet.Cell(1, 1).Value = "STT";
            worksheet.Cell(1, 2).Value = "Tên Nguyên Liệu";
            worksheet.Cell(1, 3).Value = "Đơn Vị";
            worksheet.Cell(1, 4).Value = "Số Lượng";
            worksheet.Cell(1, 5).Value = "Cảnh Báo";
            worksheet.Cell(1, 6).Value = "SL Tối Thiểu";
            worksheet.Cell(1, 7).Value = "Giá/Đơn Vị";
            worksheet.Cell(1, 8).Value = "Nhà Cung Cấp";
            worksheet.Cell(1, 9).Value = "Ngày Cập Nhật";

            // Style headers
            var headerRange = worksheet.Range(1, 1, 1, 9);
            headerRange.Style.Font.Bold = true;
            headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#70AD47");
            headerRange.Style.Font.FontColor = XLColor.White;
            headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // Data
            int row = 2;
            foreach (var ingredient in ingredients)
            {
                worksheet.Cell(row, 1).Value = row - 1;
                worksheet.Cell(row, 2).Value = ingredient.Name;
                worksheet.Cell(row, 3).Value = ingredient.Unit;
                worksheet.Cell(row, 4).Value = ingredient.Quantity;
                
                var warningCell = worksheet.Cell(row, 5);
                if (ingredient.Quantity == 0)
                {
                    warningCell.Value = "Hết hàng";
                    warningCell.Style.Font.FontColor = XLColor.Red;
                    warningCell.Style.Font.Bold = true;
                }
                else if (ingredient.Quantity <= 10)
                {
                    warningCell.Value = "Sắp hết";
                    warningCell.Style.Font.FontColor = XLColor.Orange;
                }
                else
                {
                    warningCell.Value = "Bình thường";
                    warningCell.Style.Font.FontColor = XLColor.Green;
                }
                worksheet.Cell(row, 6).Value = ingredient.MinQuantity;
                worksheet.Cell(row, 7).Value = ingredient.PricePerUnit;
                worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0 ₫";
                worksheet.Cell(row, 8).Value = ingredient.Supplier ?? string.Empty;
                worksheet.Cell(row, 9).Value = ingredient.UpdatedAt?.ToString("dd/MM/yyyy HH:mm") ?? ingredient.CreatedAt.ToString("dd/MM/yyyy HH:mm");
                row++;
            }

            // Auto-fit columns
            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            var fileName = $"TonKhoNguyenLieu_{DateTimeHelper.VietnamNow:yyyyMMdd_HHmmss}.xlsx";
            
            return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting inventory");
            return StatusCode(500, new { message = "Lỗi khi xuất tồn kho" });
        }
    }

    private IQueryable<Order> ApplyOrderFilter(IQueryable<Order> query, OrderFilterDto? filter)
    {
        if (filter == null)
        {
            return query;
        }

        if (filter.StartDate.HasValue)
        {
            var startDate = filter.StartDate.Value.Date;
            query = query.Where(o => o.OrderDate >= startDate);
        }

        if (filter.EndDate.HasValue)
        {
            var endDate = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(o => o.OrderDate <= endDate);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(o => o.Status == filter.Status.Value);
        }

        if (filter.Type.HasValue)
        {
            query = query.Where(o => o.Type == filter.Type.Value);
        }

        if (filter.EmployeeId.HasValue)
        {
            query = query.Where(o => o.EmployeeId == filter.EmployeeId.Value);
        }

        if (filter.CustomerId.HasValue)
        {
            query = query.Where(o => o.CustomerId == filter.CustomerId.Value);
        }

        return query;
    }

    private IQueryable<Customer> ApplyCustomerFilter(IQueryable<Customer> query, CustomerFilterDto? filter)
    {
        if (filter == null)
        {
            return query;
        }

        if (filter.StartDate.HasValue)
        {
            var startDate = filter.StartDate.Value.Date;
            query = query.Where(c => c.CreatedAt >= startDate);
        }

        if (filter.EndDate.HasValue)
        {
            var endDate = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(c => c.CreatedAt <= endDate);
        }

        if (filter.IsActive.HasValue)
        {
            query = query.Where(c => c.IsActive == filter.IsActive.Value);
        }

        return query;
    }

    private static List<CustomerListResponseDto> ApplyCustomerInMemoryFilters(
        List<CustomerListResponseDto> customers,
        CustomerFilterDto filter)
    {
        var result = customers.AsEnumerable();

        if (filter.MinTotalSpent.HasValue)
        {
            result = result.Where(c => c.TotalSpent >= filter.MinTotalSpent.Value);
        }

        if (filter.MaxTotalSpent.HasValue)
        {
            result = result.Where(c => c.TotalSpent <= filter.MaxTotalSpent.Value);
        }

        if (filter.MinTotalOrders.HasValue)
        {
            result = result.Where(c => c.TotalOrders >= filter.MinTotalOrders.Value);
        }

        if (filter.MaxTotalOrders.HasValue)
        {
            result = result.Where(c => c.TotalOrders <= filter.MaxTotalOrders.Value);
        }

        if (filter.TierId.HasValue)
        {
            result = result.Where(c => c.TierId == filter.TierId.Value);
        }

        return result.ToList();
    }

    private async Task AssignCustomerTiersAsync(List<CustomerListResponseDto> customers)
    {
        if (!customers.Any())
        {
            return;
        }

        var tiers = await _context.CustomerTiers
            .OrderByDescending(t => t.MinimumSpent)
            .ThenBy(t => t.DisplayOrder)
            .ToListAsync();

        foreach (var customer in customers)
        {
            var tier = tiers.FirstOrDefault(t => customer.TotalSpent >= t.MinimumSpent);
            if (tier != null)
            {
                customer.TierId = tier.Id;
                customer.TierName = tier.Name;
                customer.TierColor = tier.ColorHex;
            }
        }
    }

    private void CreateSummarySheet(IXLWorksheet worksheet, List<Order> orders, DateTime startDate, DateTime endDate)
    {
        worksheet.Cell(1, 1).Value = "BÁO CÁO TỔNG QUAN BÁN HÀNG";
        worksheet.Cell(1, 1).Style.Font.Bold = true;
        worksheet.Cell(1, 1).Style.Font.FontSize = 16;
        worksheet.Range(1, 1, 1, 2).Merge();

        worksheet.Cell(2, 1).Value = $"Từ ngày: {startDate:dd/MM/yyyy} đến {endDate:dd/MM/yyyy}";
        worksheet.Range(2, 1, 2, 2).Merge();

        worksheet.Cell(4, 1).Value = "Tổng số đơn hàng:";
        worksheet.Cell(4, 2).Value = orders.Count;
        
        worksheet.Cell(5, 1).Value = "Tổng doanh thu:";
        worksheet.Cell(5, 2).Value = orders.Sum(o => o.TotalAmount);
        worksheet.Cell(5, 2).Style.NumberFormat.Format = "#,##0 ₫";
        
        worksheet.Cell(6, 1).Value = "Giá trị đơn trung bình:";
        worksheet.Cell(6, 2).Value = orders.Any() ? orders.Average(o => o.TotalAmount) : 0;
        worksheet.Cell(6, 2).Style.NumberFormat.Format = "#,##0 ₫";
        
        worksheet.Cell(7, 1).Value = "Tổng số món đã bán:";
        worksheet.Cell(7, 2).Value = orders.SelectMany(o => o.OrderItems).Sum(oi => oi.Quantity);

        worksheet.Columns().AdjustToContents();
    }

    private void CreateOrderDetailsSheet(IXLWorksheet worksheet, List<Order> orders)
    {
        // Headers
        worksheet.Cell(1, 1).Value = "Mã ĐH";
        worksheet.Cell(1, 2).Value = "Ngày Giờ";
        worksheet.Cell(1, 3).Value = "Khách Hàng";
        worksheet.Cell(1, 4).Value = "Nhân Viên";
        worksheet.Cell(1, 5).Value = "Loại";
        worksheet.Cell(1, 6).Value = "Trạng Thái";
        worksheet.Cell(1, 7).Value = "Tổng Tiền";

        var headerRange = worksheet.Range(1, 1, 1, 7);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4472C4");
        headerRange.Style.Font.FontColor = XLColor.White;

        int row = 2;
        foreach (var order in orders)
        {
            worksheet.Cell(row, 1).Value = order.OrderNumber;
            worksheet.Cell(row, 2).Value = order.OrderDate.ToString("dd/MM/yyyy HH:mm");
            worksheet.Cell(row, 3).Value = order.Customer != null ? $"{order.Customer.FirstName} {order.Customer.LastName}" : "Khách vãng lai";
            worksheet.Cell(row, 4).Value = order.Employee != null ? $"{order.Employee.FirstName} {order.Employee.LastName}" : "N/A";
            worksheet.Cell(row, 5).Value = order.Type == OrderType.DineIn ? "Tại bàn" : "Mang đi";
            worksheet.Cell(row, 6).Value = GetOrderStatusName(order.Status);
            worksheet.Cell(row, 7).Value = order.TotalAmount;
            worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0 ₫";
            row++;
        }

        worksheet.Columns().AdjustToContents();
    }

    private void CreateProductPerformanceSheet(IXLWorksheet worksheet, List<Order> orders)
    {
        var productStats = orders
            .SelectMany(o => o.OrderItems)
            .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
            .Select(g => new
            {
                g.Key.ProductId,
                ProductName = g.Key.Name,
                TotalSold = g.Sum(oi => oi.Quantity),
                TotalRevenue = g.Sum(oi => oi.TotalPrice)
            })
            .OrderByDescending(p => p.TotalRevenue)
            .ToList();

        // Headers
        worksheet.Cell(1, 1).Value = "Mã SP";
        worksheet.Cell(1, 2).Value = "Tên Sản Phẩm";
        worksheet.Cell(1, 3).Value = "Số Lượng Bán";
        worksheet.Cell(1, 4).Value = "Doanh Thu";

        var headerRange = worksheet.Range(1, 1, 1, 4);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#FFC000");
        headerRange.Style.Font.FontColor = XLColor.Black;

        int row = 2;
        foreach (var stat in productStats)
        {
            worksheet.Cell(row, 1).Value = stat.ProductId;
            worksheet.Cell(row, 2).Value = stat.ProductName;
            worksheet.Cell(row, 3).Value = stat.TotalSold;
            worksheet.Cell(row, 4).Value = stat.TotalRevenue;
            worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0 ₫";
            row++;
        }

        worksheet.Columns().AdjustToContents();
    }

    private string GetOrderStatusName(OrderStatus status)
    {
        return status switch
        {
            OrderStatus.Pending => "Chờ xử lý",
            OrderStatus.Confirmed => "Đã xác nhận",
            OrderStatus.Preparing => "Đang chuẩn bị",
            OrderStatus.Ready => "Sẵn sàng",
            OrderStatus.Delivered => "Hoàn thành",
            OrderStatus.Cancelled => "Đã hủy",
            _ => "Không xác định"
        };
    }

    private void CreateCustomerSheet(IXLWorksheet worksheet, List<CustomerListResponseDto> customers)
    {
        worksheet.Cell(1, 1).Value = "STT";
        worksheet.Cell(1, 2).Value = "Họ tên";
        worksheet.Cell(1, 3).Value = "Email";
        worksheet.Cell(1, 4).Value = "Điện thoại";
        worksheet.Cell(1, 5).Value = "Thành phố";
        worksheet.Cell(1, 6).Value = "Tổng đơn";
        worksheet.Cell(1, 7).Value = "Tổng chi tiêu";
        worksheet.Cell(1, 8).Value = "Hạng";
        worksheet.Cell(1, 9).Value = "Trạng thái";
        worksheet.Cell(1, 10).Value = "Ngày tạo";
        worksheet.Cell(1, 11).Value = "Lần mua gần nhất";

        var headerRange = worksheet.Range(1, 1, 1, 11);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#F39C12");
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

        int row = 2;
        foreach (var customer in customers)
        {
            worksheet.Cell(row, 1).Value = row - 1;
            worksheet.Cell(row, 2).Value = customer.FullName;
            worksheet.Cell(row, 3).Value = customer.Email;
            worksheet.Cell(row, 4).Value = customer.PhoneNumber ?? string.Empty;
            worksheet.Cell(row, 5).Value = customer.City ?? string.Empty;
            worksheet.Cell(row, 6).Value = customer.TotalOrders;
            worksheet.Cell(row, 7).Value = customer.TotalSpent;
            worksheet.Cell(row, 7).Style.NumberFormat.Format = "#,##0 ₫";
            worksheet.Cell(row, 8).Value = customer.TierName ?? "Chưa phân hạng";
            worksheet.Cell(row, 9).Value = customer.IsActive ? "Hoạt động" : "Không hoạt động";
            worksheet.Cell(row, 10).Value = customer.CreatedAt.ToString("dd/MM/yyyy HH:mm");
            worksheet.Cell(row, 11).Value = customer.LastOrderDate?.ToString("dd/MM/yyyy HH:mm") ?? "—";
            row++;
        }

        worksheet.Columns().AdjustToContents();
    }
}

