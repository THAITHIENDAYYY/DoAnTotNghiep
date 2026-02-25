using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace fastfood.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả thanh toán
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PaymentListResponseDto>>> GetPayments([FromQuery] PaymentFilterDto? filter)
        {
            var paymentsQuery =
                from payment in _context.Payments
                join order in _context.Orders on payment.OrderId equals order.Id
                join customer in _context.Customers on order.CustomerId equals customer.Id into customerGroup
                from customer in customerGroup.DefaultIfEmpty()
                select new { payment, order, customer };

            // Áp dụng lọc ở phía ứng dụng để tránh các lỗi SQL hiếm gặp
            var filterSnapshot = filter; 

            var payments = await paymentsQuery
                .OrderByDescending(p => p.payment.PaymentDate)
                .Select(p => new PaymentListResponseDto
                {
                    Id = p.payment.Id,
                    TransactionId = p.payment.TransactionId,
                    Method = p.payment.Method,
                    MethodName = GetMethodName(p.payment.Method),
                    Status = p.payment.Status,
                    StatusName = GetStatusName(p.payment.Status),
                    Amount = p.payment.Amount,
                    ReferenceNumber = p.payment.ReferenceNumber,
                    PaymentDate = p.payment.PaymentDate,
                    CompletedAt = p.payment.CompletedAt,
                    OrderId = p.payment.OrderId,
                    OrderNumber = p.order.OrderNumber,
                    OrderTotal = p.order.TotalAmount,
                    IsFullyPaid = false,
                    CustomerName = p.customer != null
                        ? $"{p.customer.FirstName} {p.customer.LastName}".Trim()
                        : string.Empty
                })
                .ToListAsync();

            // Lọc in-memory (an toàn, ổn định với mọi phiên bản SQL Server)
            if (filterSnapshot != null)
            {
                if (filterSnapshot.StartDate.HasValue)
                {
                    var startDate = filterSnapshot.StartDate.Value.Date;
                    payments = payments.Where(x => x.PaymentDate >= startDate).ToList();
                }

                if (filterSnapshot.EndDate.HasValue)
                {
                    var endDate = filterSnapshot.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                    payments = payments.Where(x => x.PaymentDate <= endDate).ToList();
                }

                if (filterSnapshot.PaymentMethod.HasValue)
                {
                    payments = payments.Where(x => x.Method == filterSnapshot.PaymentMethod.Value).ToList();
                }

                if (filterSnapshot.Status.HasValue)
                {
                    payments = payments.Where(x => x.Status == filterSnapshot.Status.Value).ToList();
                }

                if (filterSnapshot.OrderId.HasValue)
                {
                    payments = payments.Where(x => x.OrderId == filterSnapshot.OrderId.Value).ToList();
                }

                if (!string.IsNullOrWhiteSpace(filterSnapshot.TransactionId))
                {
                    payments = payments.Where(x => !string.IsNullOrEmpty(x.TransactionId) && x.TransactionId.Contains(filterSnapshot.TransactionId)).ToList();
                }
            }

            if (payments.Count > 0)
            {
                var orderIds = payments.Select(p => p.OrderId).Distinct().ToList();
                var paidAmounts = await _context.Payments
                    .Where(p => orderIds.Contains(p.OrderId) && p.Status == PaymentStatus.Completed)
                    .GroupBy(p => p.OrderId)
                    .Select(g => new
                    {
                        OrderId = g.Key,
                        PaidAmount = g.Sum(p => p.Amount)
                    })
                    .ToListAsync();

                var paidLookup = paidAmounts.ToDictionary(x => x.OrderId, x => x.PaidAmount);

                foreach (var payment in payments)
                {
                    if (paidLookup.TryGetValue(payment.OrderId, out var paidAmount))
                    {
                        payment.IsFullyPaid = paidAmount >= payment.OrderTotal;
                    }
                }
            }

            return Ok(payments);
        }

        /// <summary>
        /// Lấy danh sách thanh toán theo trạng thái
        /// </summary>
        [HttpGet("by-status/{status}")]
        public async Task<ActionResult<IEnumerable<PaymentListResponseDto>>> GetPaymentsByStatus(PaymentStatus status)
        {
            var payments = await _context.Payments
                .Include(p => p.Order)
                .Where(p => p.Status == status)
                .Select(p => new PaymentListResponseDto
                {
                    Id = p.Id,
                    TransactionId = p.TransactionId,
                    Method = p.Method,
                    MethodName = GetMethodName(p.Method),
                    Status = p.Status,
                    StatusName = GetStatusName(p.Status),
                    Amount = p.Amount,
                    ReferenceNumber = p.ReferenceNumber,
                    PaymentDate = p.PaymentDate,
                    CompletedAt = p.CompletedAt,
                    OrderId = p.OrderId,
                    OrderNumber = p.Order.OrderNumber,
                    OrderTotal = p.Order.TotalAmount,
                    IsFullyPaid = false // Sẽ được cập nhật sau
                })
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            // Cập nhật IsFullyPaid cho từng payment
            foreach (var payment in payments)
            {
                payment.IsFullyPaid = await IsOrderFullyPaid(payment.OrderId);
            }

            return Ok(payments);
        }

        /// <summary>
        /// Lấy danh sách thanh toán theo đơn hàng
        /// </summary>
        [HttpGet("by-order/{orderId}")]
        public async Task<ActionResult<IEnumerable<PaymentListResponseDto>>> GetPaymentsByOrder(int orderId)
        {
            var payments = await _context.Payments
                .Include(p => p.Order)
                .Where(p => p.OrderId == orderId)
                .Select(p => new PaymentListResponseDto
                {
                    Id = p.Id,
                    TransactionId = p.TransactionId,
                    Method = p.Method,
                    MethodName = GetMethodName(p.Method),
                    Status = p.Status,
                    StatusName = GetStatusName(p.Status),
                    Amount = p.Amount,
                    ReferenceNumber = p.ReferenceNumber,
                    PaymentDate = p.PaymentDate,
                    CompletedAt = p.CompletedAt,
                    OrderId = p.OrderId,
                    OrderNumber = p.Order.OrderNumber,
                    OrderTotal = p.Order.TotalAmount,
                    IsFullyPaid = false // Sẽ được cập nhật sau
                })
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            // Cập nhật IsFullyPaid cho từng payment
            foreach (var payment in payments)
            {
                payment.IsFullyPaid = await IsOrderFullyPaid(payment.OrderId);
            }

            return Ok(payments);
        }

        /// <summary>
        /// Lấy danh sách thanh toán theo phương thức
        /// </summary>
        [HttpGet("by-method/{method}")]
        public async Task<ActionResult<IEnumerable<PaymentListResponseDto>>> GetPaymentsByMethod(PaymentMethod method)
        {
            var payments = await _context.Payments
                .Include(p => p.Order)
                .Where(p => p.Method == method)
                .Select(p => new PaymentListResponseDto
                {
                    Id = p.Id,
                    TransactionId = p.TransactionId,
                    Method = p.Method,
                    MethodName = GetMethodName(p.Method),
                    Status = p.Status,
                    StatusName = GetStatusName(p.Status),
                    Amount = p.Amount,
                    ReferenceNumber = p.ReferenceNumber,
                    PaymentDate = p.PaymentDate,
                    CompletedAt = p.CompletedAt,
                    OrderId = p.OrderId,
                    OrderNumber = p.Order.OrderNumber,
                    OrderTotal = p.Order.TotalAmount,
                    IsFullyPaid = false // Sẽ được cập nhật sau
                })
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            // Cập nhật IsFullyPaid cho từng payment
            foreach (var payment in payments)
            {
                payment.IsFullyPaid = await IsOrderFullyPaid(payment.OrderId);
            }

            return Ok(payments);
        }

        /// <summary>
        /// Tìm kiếm thanh toán theo mã giao dịch
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<PaymentListResponseDto>>> SearchPayments([FromQuery] string transactionId)
        {
            if (string.IsNullOrWhiteSpace(transactionId))
            {
                return BadRequest(new { message = "Mã giao dịch không được để trống" });
            }

            var payments = await _context.Payments
                .Include(p => p.Order)
                .Where(p => p.TransactionId.Contains(transactionId))
                .Select(p => new PaymentListResponseDto
                {
                    Id = p.Id,
                    TransactionId = p.TransactionId,
                    Method = p.Method,
                    MethodName = GetMethodName(p.Method),
                    Status = p.Status,
                    StatusName = GetStatusName(p.Status),
                    Amount = p.Amount,
                    ReferenceNumber = p.ReferenceNumber,
                    PaymentDate = p.PaymentDate,
                    CompletedAt = p.CompletedAt,
                    OrderId = p.OrderId,
                    OrderNumber = p.Order.OrderNumber,
                    OrderTotal = p.Order.TotalAmount,
                    IsFullyPaid = false // Sẽ được cập nhật sau
                })
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            // Cập nhật IsFullyPaid cho từng payment
            foreach (var payment in payments)
            {
                payment.IsFullyPaid = await IsOrderFullyPaid(payment.OrderId);
            }

            return Ok(payments);
        }

        /// <summary>
        /// Lấy thông tin chi tiết thanh toán theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentResponseDto>> GetPayment(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Order)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            var paidAmount = await _context.Payments
                .Where(p => p.OrderId == payment.OrderId && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var response = new PaymentResponseDto
            {
                Id = payment.Id,
                TransactionId = payment.TransactionId,
                Method = payment.Method,
                MethodName = GetMethodName(payment.Method),
                Status = payment.Status,
                StatusName = GetStatusName(payment.Status),
                Amount = payment.Amount,
                ReferenceNumber = payment.ReferenceNumber,
                PaymentDate = payment.PaymentDate,
                CompletedAt = payment.CompletedAt,
                Notes = payment.Notes,
                OrderId = payment.OrderId,
                OrderNumber = payment.Order.OrderNumber,
                OrderTotal = payment.Order.TotalAmount,
                RemainingAmount = payment.Order.TotalAmount - paidAmount,
                IsFullyPaid = paidAmount >= payment.Order.TotalAmount
            };

            return Ok(response);
        }

        /// <summary>
        /// Tạo thanh toán mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<PaymentResponseDto>> CreatePayment(CreatePaymentDto createPaymentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Kiểm tra đơn hàng có tồn tại không
                var order = await _context.Orders.FindAsync(createPaymentDto.OrderId);
                if (order == null)
                {
                    return BadRequest(new { message = "Đơn hàng không tồn tại" });
                }

                // Kiểm tra trạng thái đơn hàng
                if (order.Status == OrderStatus.Cancelled)
                {
                    return BadRequest(new { message = "Không thể thanh toán cho đơn hàng đã hủy" });
                }

                // Tính toán số tiền đã thanh toán (xử lý null)
                decimal paidAmount = 0m;
                try
                {
                    var payments = await _context.Payments
                        .Where(p => p.OrderId == createPaymentDto.OrderId && p.Status == PaymentStatus.Completed)
                        .Select(p => p.Amount)
                        .ToListAsync();
                    
                    paidAmount = payments.Sum();
                }
                catch (Exception ex)
                {
                    // Nếu có lỗi, giả sử chưa có payment nào
                    paidAmount = 0m;
                }

                var remainingAmount = order.TotalAmount - paidAmount;

                // Kiểm tra số tiền thanh toán
                if (createPaymentDto.Amount > remainingAmount)
                {
                    return BadRequest(new { message = $"Số tiền thanh toán ({createPaymentDto.Amount:N0}) vượt quá số tiền còn lại ({remainingAmount:N0})" });
                }

                if (createPaymentDto.Amount <= 0)
                {
                    return BadRequest(new { message = "Số tiền thanh toán phải lớn hơn 0" });
                }

                // Tạo mã giao dịch
                string transactionId;
                try
                {
                    transactionId = await GenerateTransactionId();
                }
                catch (Exception ex)
                {
                    // Fallback nếu GenerateTransactionId lỗi
                    transactionId = $"TXN{DateTimeHelper.VietnamNow:yyyyMMddHHmmss}{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}";
                }

                var payment = new Payment
                {
                    TransactionId = transactionId,
                    Method = createPaymentDto.Method,
                    Status = PaymentStatus.Pending,
                    Amount = createPaymentDto.Amount,
                    ReferenceNumber = createPaymentDto.ReferenceNumber,
                    PaymentDate = DateTimeHelper.VietnamNow,
                    Notes = createPaymentDto.Notes,
                    OrderId = createPaymentDto.OrderId
                };

                try
                {
                    _context.Payments.Add(payment);
                    await _context.SaveChangesAsync();
                }
                catch (Exception saveEx)
                {
                    // Log lỗi chi tiết hơn
                    return StatusCode(500, new { 
                        message = $"Lỗi khi lưu payment: {saveEx.Message}", 
                        details = saveEx.ToString(),
                        innerException = saveEx.InnerException?.ToString()
                    });
                }

                var response = new PaymentResponseDto
                {
                    Id = payment.Id,
                    TransactionId = payment.TransactionId,
                    Method = payment.Method,
                    MethodName = GetMethodName(payment.Method),
                    Status = payment.Status,
                    StatusName = GetStatusName(payment.Status),
                    Amount = payment.Amount,
                    ReferenceNumber = payment.ReferenceNumber,
                    PaymentDate = payment.PaymentDate,
                    CompletedAt = payment.CompletedAt,
                    Notes = payment.Notes,
                    OrderId = payment.OrderId,
                    OrderNumber = order.OrderNumber,
                    OrderTotal = order.TotalAmount,
                    RemainingAmount = remainingAmount - payment.Amount,
                    IsFullyPaid = (paidAmount + payment.Amount) >= order.TotalAmount
                };

                return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, response);
            }
            catch (Exception ex)
            {
                // Log lỗi và trả về 500 với thông báo chi tiết
                return StatusCode(500, new { message = $"Lỗi khi tạo thanh toán: {ex.Message}", details = ex.ToString() });
            }
        }

        /// <summary>
        /// Cập nhật trạng thái thanh toán
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePayment(int id, UpdatePaymentDto updatePaymentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            var oldStatus = payment.Status;
            payment.Status = updatePaymentDto.Status;
            payment.ReferenceNumber = updatePaymentDto.ReferenceNumber;
            payment.Notes = updatePaymentDto.Notes;

            // Cập nhật thời gian hoàn thành nếu chuyển sang Completed
            if (updatePaymentDto.Status == PaymentStatus.Completed && payment.CompletedAt == null)
            {
                payment.CompletedAt = DateTimeHelper.VietnamNow;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PaymentExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy thanh toán" });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { 
                message = $"Thanh toán đã được cập nhật từ {GetStatusName(oldStatus)} thành {GetStatusName(updatePaymentDto.Status)}",
                status = updatePaymentDto.Status,
                statusName = GetStatusName(updatePaymentDto.Status),
                completedAt = payment.CompletedAt
            });
        }

        /// <summary>
        /// Xác nhận thanh toán
        /// </summary>
        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> ConfirmPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            if (payment.Status == PaymentStatus.Completed)
            {
                return BadRequest(new { message = "Thanh toán đã được xác nhận" });
            }

            payment.Status = PaymentStatus.Completed;
            payment.CompletedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Thanh toán đã được xác nhận",
                status = PaymentStatus.Completed,
                statusName = GetStatusName(PaymentStatus.Completed),
                completedAt = payment.CompletedAt
            });
        }

        /// <summary>
        /// Hủy thanh toán
        /// </summary>
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            if (payment.Status == PaymentStatus.Completed)
            {
                return BadRequest(new { message = "Không thể hủy thanh toán đã hoàn thành" });
            }

            payment.Status = PaymentStatus.Cancelled;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Thanh toán đã được hủy",
                status = PaymentStatus.Cancelled,
                statusName = GetStatusName(PaymentStatus.Cancelled)
            });
        }

        /// <summary>
        /// Hoàn tiền
        /// </summary>
        [HttpPatch("{id}/refund")]
        public async Task<IActionResult> RefundPayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            if (payment.Status != PaymentStatus.Completed)
            {
                return BadRequest(new { message = "Chỉ có thể hoàn tiền cho thanh toán đã hoàn thành" });
            }

            payment.Status = PaymentStatus.Refunded;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Hoàn tiền thành công",
                status = PaymentStatus.Refunded,
                statusName = GetStatusName(PaymentStatus.Refunded)
            });
        }

        /// <summary>
        /// Xóa thanh toán (chỉ cho phép xóa thanh toán đã hủy)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePayment(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
            {
                return NotFound(new { message = "Không tìm thấy thanh toán" });
            }

            if (payment.Status != PaymentStatus.Cancelled)
            {
                return BadRequest(new { message = "Chỉ có thể xóa thanh toán đã hủy" });
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Lấy tổng quan thanh toán của đơn hàng
        /// </summary>
        [HttpGet("order-summary/{orderId}")]
        public async Task<ActionResult> GetOrderPaymentSummary(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            var payments = await _context.Payments
                .Where(p => p.OrderId == orderId)
                .ToListAsync();

            var paidAmount = payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .Sum(p => p.Amount);

            var refundedAmount = payments
                .Where(p => p.Status == PaymentStatus.Refunded)
                .Sum(p => p.Amount);

            var summary = new
            {
                OrderId = orderId,
                OrderNumber = order.OrderNumber,
                OrderTotal = order.TotalAmount,
                PaidAmount = paidAmount,
                RefundedAmount = refundedAmount,
                RemainingAmount = order.TotalAmount - paidAmount,
                IsFullyPaid = paidAmount >= order.TotalAmount,
                PaymentCount = payments.Count,
                Payments = payments.Select(p => new
                {
                    p.Id,
                    p.TransactionId,
                    Method = GetMethodName(p.Method),
                    Status = GetStatusName(p.Status),
                    p.Amount,
                    p.PaymentDate,
                    p.CompletedAt
                })
            };

            return Ok(summary);
        }

        private bool PaymentExists(int id)
        {
            return _context.Payments.Any(e => e.Id == id);
        }

        private async Task<bool> IsOrderFullyPaid(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null) return false;

            var paidAmount = await _context.Payments
                .Where(p => p.OrderId == orderId && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            return paidAmount >= order.TotalAmount;
        }

        private async Task<string> GenerateTransactionId()
        {
            // Đơn giản hóa: dùng timestamp + random để tránh query database
            // Format: TXN + yyyyMMdd + HHmmss + 4 ký tự random
            try
            {
                var timestamp = DateTimeHelper.VietnamNow.ToString("yyyyMMddHHmmss");
                var random = new Random().Next(1000, 9999);
                var transactionId = $"TXN{timestamp}{random}";
                
                // Kiểm tra xem ID đã tồn tại chưa (rất hiếm nhưng kiểm tra để đảm bảo)
                var exists = await _context.Payments.AnyAsync(p => p.TransactionId == transactionId);
                if (exists)
                {
                    // Nếu trùng, thêm thêm random
                    random = new Random().Next(10000, 99999);
                    transactionId = $"TXN{timestamp}{random}";
                }
                
                return transactionId;
            }
            catch (Exception ex)
            {
                // Fallback nếu có lỗi - dùng timestamp + GUID
                var guid = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 8).ToUpper();
                return $"TXN{DateTimeHelper.VietnamNow:yyyyMMddHHmmss}{guid}";
            }
        }

        private static string GetMethodName(PaymentMethod method)
        {
            return method switch
            {
                PaymentMethod.Cash => "Tiền mặt",
                PaymentMethod.CreditCard => "Thẻ tín dụng",
                PaymentMethod.DebitCard => "Thẻ ghi nợ",
                PaymentMethod.MobilePayment => "Thanh toán di động",
                PaymentMethod.BankTransfer => "Chuyển khoản ngân hàng",
                _ => "Không xác định"
            };
        }

        private static string GetStatusName(PaymentStatus status)
        {
            return status switch
            {
                PaymentStatus.Pending => "Chờ xử lý",
                PaymentStatus.Completed => "Hoàn thành",
                PaymentStatus.Failed => "Thất bại",
                PaymentStatus.Refunded => "Đã hoàn tiền",
                PaymentStatus.Cancelled => "Đã hủy",
                _ => "Không xác định"
            };
        }
    }
}
