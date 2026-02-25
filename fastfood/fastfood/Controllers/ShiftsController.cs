using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace fastfood.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShiftsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ShiftsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Start a shift for employee
        [HttpPost("start")]
        public async Task<ActionResult> StartShift([FromQuery] int employeeId)
        {
            var vietnamNow = DateTimeHelper.VietnamNow;
            var hasOpen = await _context.WorkShifts.AnyAsync(ws => ws.EmployeeId == employeeId && ws.EndAt == null);
            if (!hasOpen)
            {
                _context.WorkShifts.Add(new Shared.Models.WorkShift
                {
                    EmployeeId = employeeId,
                    StartAt = vietnamNow
                });
                await _context.SaveChangesAsync();
            }
            return Ok(new { startedAt = vietnamNow });
        }

        // End most recent open shift for employee
        [HttpPost("end")]
        public async Task<ActionResult> EndShift([FromQuery] int employeeId)
        {
            var openShift = await _context.WorkShifts
                .Where(ws => ws.EmployeeId == employeeId && ws.EndAt == null)
                .OrderByDescending(ws => ws.StartAt)
                .FirstOrDefaultAsync();
            if (openShift == null)
            {
                return NotFound(new { message = "Không tìm thấy ca đang mở" });
            }
            openShift.EndAt = DateTimeHelper.VietnamNow;
            await _context.SaveChangesAsync();
            return Ok(new { endedAt = openShift.EndAt });
        }

        // Summary by employee per day
        [HttpGet("summary")]
        public async Task<ActionResult<IEnumerable<ShiftSummaryDto>>> GetShiftSummaries([FromQuery] ShiftFilterDto? filter)
        {
            var ordersQuery = _context.Orders
                .Include(o => o.Employee)
                .Include(o => o.Payments)
                .AsQueryable();

            if (filter?.StartDate != null)
            {
                var start = filter.StartDate.Value.Date;
                ordersQuery = ordersQuery.Where(o => o.OrderDate >= start);
            }
            if (filter?.EndDate != null)
            {
                var end = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                ordersQuery = ordersQuery.Where(o => o.OrderDate <= end);
            }
            if (filter?.EmployeeId != null)
            {
                ordersQuery = ordersQuery.Where(o => o.EmployeeId == filter.EmployeeId.Value);
            }

            // Materialize to avoid provider limitations with Date grouping
            var orders = await ordersQuery
                .Select(o => new
                {
                    o.Id,
                    o.OrderDate,
                    o.TotalAmount,
                    EmployeeId = o.EmployeeId ?? 0,
                    EmployeeName = o.Employee != null ? o.Employee.FirstName + " " + o.Employee.LastName : "Admin",
                    Payments = o.Payments.Select(p => new { p.Status, p.Amount }).ToList()
                })
                .ToListAsync();

            var summaries = orders
                .GroupBy(o => new { o.EmployeeId, ShiftDate = o.OrderDate.Date })
                .Select(g => new ShiftSummaryDto
                {
                    EmployeeId = g.Key.EmployeeId,
                    EmployeeName = g.Max(o => o.EmployeeName)!,
                    ShiftDate = g.Key.ShiftDate,
                    // Prefer WorkShift records when available
                    ShiftStart = _context.WorkShifts
                        .Where(ws => ws.EmployeeId == g.Key.EmployeeId && ws.StartAt.Date == g.Key.ShiftDate)
                        .Select(ws => (DateTime?)ws.StartAt)
                        .OrderBy(t => t)
                        .FirstOrDefault() ?? g.Min(o => (DateTime?)o.OrderDate),
                    ShiftEnd = _context.WorkShifts
                        .Where(ws => ws.EmployeeId == g.Key.EmployeeId && ws.StartAt.Date == g.Key.ShiftDate)
                        .Select(ws => ws.EndAt)
                        .OrderByDescending(t => t)
                        .FirstOrDefault() ?? g.Max(o => (DateTime?)o.OrderDate),
                    OrdersCount = g.Count(),
                    ErrorOrdersCount = 0,
                    TotalRevenue = g.Sum(o => o.TotalAmount),
                    TotalDiscount = 0,
                    CompletedPayments = g.SelectMany(o => o.Payments).Count(p => p.Status == Shared.Models.PaymentStatus.Completed),
                    CompletedAmount = g.SelectMany(o => o.Payments)
                        .Where(p => p.Status == Shared.Models.PaymentStatus.Completed)
                        .Sum(p => p.Amount)
                })
                .OrderByDescending(s => s.ShiftDate)
                .ToList();

            return Ok(summaries);
        }

        // Detail for a specific employee and day
        [HttpGet("detail")]
        public async Task<ActionResult<ShiftDetailDto>> GetShiftDetail([FromQuery] int employeeId, [FromQuery] DateTime date)
        {
            var dayStart = date.Date;
            var dayEnd = date.Date.AddDays(1).AddTicks(-1);

            var orders = await _context.Orders
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Payments)
                .Include(o => o.Discount)
                .Where(o => (o.EmployeeId ?? 0) == employeeId && o.OrderDate >= dayStart && o.OrderDate <= dayEnd)
                .ToListAsync();

            var detail = new ShiftDetailDto
            {
                EmployeeId = employeeId,
                EmployeeName = orders.FirstOrDefault()?.Employee != null
                    ? orders.First().Employee!.FirstName + " " + orders.First().Employee!.LastName
                    : "Admin",
                ShiftDate = dayStart,
                ShiftStart = orders.Min(o => (DateTime?)o.OrderDate),
                ShiftEnd = orders.Max(o => (DateTime?)o.OrderDate),
                OrdersCount = orders.Count,
                TotalRevenue = orders.Sum(o => o.TotalAmount),
                TotalDiscount = orders.Where(o => o.DiscountAmount.HasValue).Sum(o => o.DiscountAmount ?? 0)
            };

            var topItems = orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => oi.Product != null ? oi.Product.Name : "Unknown")
                .Select(g => new ShiftDetailItemDto
                {
                    ProductName = g.Key,
                    QuantitySold = g.Sum(i => i.Quantity),
                    TotalRevenue = g.Sum(i => i.TotalPrice)
                })
                .OrderByDescending(i => i.QuantitySold)
                .Take(20)
                .ToList();

            detail.TopItems = topItems;

            // Get orders with discounts (voucher orders)
            var voucherOrders = orders
                .Where(o => o.DiscountId.HasValue && o.DiscountAmount.HasValue && o.DiscountAmount > 0)
                .Select(o => new VoucherOrderDto
                {
                    OrderId = o.Id,
                    OrderNumber = o.OrderNumber,
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    DiscountAmount = o.DiscountAmount ?? 0,
                    DiscountName = o.Discount != null ? o.Discount.Name : null,
                    DiscountCode = o.Discount != null ? o.Discount.Code : null
                })
                .OrderByDescending(o => o.OrderDate)
                .ToList();

            detail.VoucherOrders = voucherOrders;
            return Ok(detail);
        }

        // Get current active shift for employee
        [HttpGet("current")]
        public async Task<ActionResult<CurrentShiftDto>> GetCurrentShift([FromQuery] int employeeId)
        {
            var currentShift = await _context.WorkShifts
                .Where(ws => ws.EmployeeId == employeeId && ws.EndAt == null)
                .OrderByDescending(ws => ws.StartAt)
                .FirstOrDefaultAsync();

            if (currentShift == null)
            {
                return NotFound(new { message = "Không có ca đang mở" });
            }

            var shiftStart = currentShift.StartAt;
            var orders = await _context.Orders
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Payments)
                .Where(o => (o.EmployeeId ?? 0) == employeeId && o.OrderDate >= shiftStart)
                .ToListAsync();

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            var paymentBreakdown = orders
                .SelectMany(o => o.Payments)
                .Where(p => p.Status == Shared.Models.PaymentStatus.Completed)
                .GroupBy(p => p.Method)
                .Select(g => new PaymentBreakdownDto
                {
                    PaymentMethod = (int)g.Key,
                    PaymentMethodName = GetPaymentMethodName(g.Key),
                    TransactionCount = g.Count(),
                    TotalAmount = g.Sum(p => p.Amount)
                })
                .ToList();

            var topItems = orders
                .SelectMany(o => o.OrderItems)
                .GroupBy(oi => oi.Product != null ? oi.Product.Name : "Unknown")
                .Select(g => new ShiftDetailItemDto
                {
                    ProductName = g.Key,
                    QuantitySold = g.Sum(i => i.Quantity),
                    TotalRevenue = g.Sum(i => i.TotalPrice)
                })
                .OrderByDescending(i => i.QuantitySold)
                .Take(10)
                .ToList();

            var totalDiscount = orders.Sum(o => o.DiscountAmount ?? 0);
            var totalRevenue = orders.Sum(o => o.TotalAmount);
            var netRevenue = totalRevenue - totalDiscount;

            var currentShiftDto = new CurrentShiftDto
            {
                EmployeeId = employeeId,
                EmployeeName = employee != null ? $"{employee.FirstName} {employee.LastName}" : "Unknown",
                ShiftStart = shiftStart,
                OrdersCount = orders.Count,
                TotalRevenue = totalRevenue,
                TotalDiscount = totalDiscount,
                NetRevenue = netRevenue,
                PaymentBreakdown = paymentBreakdown,
                TopItems = topItems
            };

            return Ok(currentShiftDto);
        }

        private string GetPaymentMethodName(Shared.Models.PaymentMethod method)
        {
            return method switch
            {
                Shared.Models.PaymentMethod.Cash => "Tiền mặt",
                Shared.Models.PaymentMethod.CreditCard => "Thẻ tín dụng",
                Shared.Models.PaymentMethod.DebitCard => "Thẻ ghi nợ",
                Shared.Models.PaymentMethod.MobilePayment => "Ví điện tử",
                Shared.Models.PaymentMethod.BankTransfer => "Chuyển khoản",
                _ => "Không xác định"
            };
        }
    }
}

