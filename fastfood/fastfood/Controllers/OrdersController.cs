using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using fastfood.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace fastfood.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả đơn hàng (hỗ trợ lọc)
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderListResponseDto>>> GetOrders([FromQuery] OrderFilterDto? filter)
        {
            try
            {
                var ordersQuery = _context.Orders.AsQueryable();

            if (filter != null)
            {
                if (filter.StartDate.HasValue)
                {
                    var startDate = filter.StartDate.Value.Date;
                    ordersQuery = ordersQuery.Where(o => o.OrderDate >= startDate);
                }

                if (filter.EndDate.HasValue)
                {
                    var endDate = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                    ordersQuery = ordersQuery.Where(o => o.OrderDate <= endDate);
                }

                if (filter.Status.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.Status == filter.Status.Value);
                }

                if (filter.Type.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.Type == filter.Type.Value);
                }

                if (filter.EmployeeId.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.EmployeeId == filter.EmployeeId.Value);
                }

                if (filter.CustomerId.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.CustomerId == filter.CustomerId.Value);
                }

                if (filter.TableId.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.TableId == filter.TableId.Value);
                }

                if (filter.TableGroupId.HasValue)
                {
                    ordersQuery = ordersQuery.Where(o => o.TableGroupId == filter.TableGroupId.Value);
                }
            }

                // Load dữ liệu từ database (chỉ select các field cần thiết, không include navigation properties)
                var ordersData = await ordersQuery
                    .Select(o => new
                    {
                        o.Id,
                        o.OrderNumber,
                        o.Status,
                        o.Type,
                        o.TotalAmount,
                        o.OrderDate,
                        o.CustomerId,
                        CustomerFirstName = o.Customer != null ? o.Customer.FirstName : null,
                        CustomerLastName = o.Customer != null ? o.Customer.LastName : null,
                        o.EmployeeId,
                        EmployeeFirstName = o.Employee != null ? o.Employee.FirstName : null,
                        EmployeeLastName = o.Employee != null ? o.Employee.LastName : null,
                        IsPaid = o.Payments.Any(p => p.Status == PaymentStatus.Completed),
                        ItemCount = o.OrderItems.Count,
                        o.TableId,
                        o.Notes,
                        o.DiscountId,
                        o.DiscountAmount
                    })
                .OrderByDescending(o => o.OrderDate)
                    .ToListAsync();
            
                // Map sang DTO trong memory (có thể gọi static methods)
                var result = ordersData.Select(o => new OrderListResponseDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Status = o.Status,
                StatusName = GetStatusName(o.Status),
                Type = o.Type,
                TypeName = GetTypeName(o.Type),
                TotalAmount = o.TotalAmount,
                OrderDate = o.OrderDate,
                CustomerId = o.CustomerId,
                    CustomerName = o.CustomerFirstName != null && o.CustomerLastName != null
                        ? (o.CustomerFirstName + " " + o.CustomerLastName).Trim()
                    : string.Empty,
                EmployeeId = o.EmployeeId,
                    EmployeeName = o.EmployeeFirstName != null && o.EmployeeLastName != null
                        ? (o.EmployeeFirstName + " " + o.EmployeeLastName).Trim()
                        : null,
                    IsPaid = o.IsPaid,
                    ItemCount = o.ItemCount,
                TableId = o.TableId,
                    Notes = o.Notes,
                    HasDiscount = o.DiscountId.HasValue,
                    DiscountAmount = o.DiscountAmount
            }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Log lỗi chi tiết để debug
                Console.WriteLine($"Error in GetOrders: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                return StatusCode(500, new { 
                    message = "Lỗi khi lấy danh sách đơn hàng", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng theo trạng thái
        /// </summary>
        [HttpGet("by-status/{status}")]
        public async Task<ActionResult<IEnumerable<OrderListResponseDto>>> GetOrdersByStatus(OrderStatus status)
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Where(o => o.Status == status)
                .Select(o => new OrderListResponseDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    StatusName = GetStatusName(o.Status),
                    Type = o.Type,
                    TypeName = GetTypeName(o.Type),
                    TotalAmount = o.TotalAmount,
                    OrderDate = o.OrderDate,
                    CustomerId = o.CustomerId,
                    CustomerName = o.Customer.FirstName + " " + o.Customer.LastName,
                    EmployeeId = o.EmployeeId,
                    EmployeeName = o.Employee != null ? o.Employee.FirstName + " " + o.Employee.LastName : null,
                    IsPaid = o.Payments.Any(p => p.Status == PaymentStatus.Completed),
                    ItemCount = o.OrderItems.Count
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// Lấy danh sách đơn hàng theo khách hàng
        /// </summary>
        [HttpGet("by-customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<OrderListResponseDto>>> GetOrdersByCustomer(int customerId)
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Where(o => o.CustomerId == customerId)
                .Select(o => new OrderListResponseDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    StatusName = GetStatusName(o.Status),
                    Type = o.Type,
                    TypeName = GetTypeName(o.Type),
                    TotalAmount = o.TotalAmount,
                    OrderDate = o.OrderDate,
                    CustomerId = o.CustomerId,
                    CustomerName = o.Customer.FirstName + " " + o.Customer.LastName,
                    EmployeeId = o.EmployeeId,
                    EmployeeName = o.Employee != null ? o.Employee.FirstName + " " + o.Employee.LastName : null,
                    IsPaid = o.Payments.Any(p => p.Status == PaymentStatus.Completed),
                    ItemCount = o.OrderItems.Count
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// Lấy danh sách đơn hàng theo nhân viên
        /// </summary>
        [HttpGet("by-employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<OrderListResponseDto>>> GetOrdersByEmployee(int employeeId)
        {
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Where(o => o.EmployeeId == employeeId)
                .Select(o => new OrderListResponseDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    StatusName = GetStatusName(o.Status),
                    Type = o.Type,
                    TypeName = GetTypeName(o.Type),
                    TotalAmount = o.TotalAmount,
                    OrderDate = o.OrderDate,
                    CustomerId = o.CustomerId,
                    CustomerName = o.Customer.FirstName + " " + o.Customer.LastName,
                    EmployeeId = o.EmployeeId,
                    EmployeeName = o.Employee != null ? o.Employee.FirstName + " " + o.Employee.LastName : null,
                    IsPaid = o.Payments.Any(p => p.Status == PaymentStatus.Completed),
                    ItemCount = o.OrderItems.Count
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// Tìm kiếm đơn hàng theo số đơn hàng
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<OrderListResponseDto>>> SearchOrders([FromQuery] string orderNumber)
        {
            if (string.IsNullOrWhiteSpace(orderNumber))
            {
                return BadRequest(new { message = "Số đơn hàng không được để trống" });
            }

            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .Where(o => o.OrderNumber.Contains(orderNumber))
                .Select(o => new OrderListResponseDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status,
                    StatusName = GetStatusName(o.Status),
                    Type = o.Type,
                    TypeName = GetTypeName(o.Type),
                    TotalAmount = o.TotalAmount,
                    OrderDate = o.OrderDate,
                    CustomerId = o.CustomerId,
                    CustomerName = o.Customer.FirstName + " " + o.Customer.LastName,
                    EmployeeId = o.EmployeeId,
                    EmployeeName = o.Employee != null ? o.Employee.FirstName + " " + o.Employee.LastName : null,
                    IsPaid = o.Payments.Any(p => p.Status == PaymentStatus.Completed),
                    ItemCount = o.OrderItems.Count
                })
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn hàng theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderResponseDto>> GetOrder(int id)
        {
            // Phần 1: Load dữ liệu cơ bản từ database (thực thi SQL đơn giản)
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            // Phần 2: Xử lý dữ liệu trong memory (LINQ to Objects) - tránh lỗi SQL WITH syntax
            // Buộc thực thi query trước, sau đó xử lý trong memory
            var orderItemsList = order.OrderItems.ToList();
            var paymentsList = order.Payments.ToList();

            var response = new OrderResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Status = order.Status,
                StatusName = GetStatusName(order.Status),
                Type = order.Type,
                TypeName = GetTypeName(order.Type),
                SubTotal = order.SubTotal,
                TaxAmount = order.TaxAmount,
                DeliveryFee = order.DeliveryFee,
                DiscountAmount = order.DiscountAmount,
                DiscountId = order.DiscountId,
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                OrderDate = order.OrderDate,
                ConfirmedAt = order.ConfirmedAt,
                PreparedAt = order.PreparedAt,
                DeliveredAt = order.DeliveredAt,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer != null ? order.Customer.FirstName + " " + order.Customer.LastName : string.Empty,
                CustomerEmail = order.Customer?.Email ?? string.Empty,
                EmployeeId = order.EmployeeId,
                EmployeeName = order.Employee != null ? order.Employee.FirstName + " " + order.Employee.LastName : null,
                OrderItems = orderItemsList.Select(oi => new OrderItemResponseDto
                {
                    Id = oi.Id,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? string.Empty,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions
                }).ToList(),
                IsPaid = paymentsList.Any(p => p.Status == PaymentStatus.Completed),
                PaidAmount = paymentsList.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount)
            };

            return Ok(response);
        }

        /// <summary>
        /// Tạo đơn hàng mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OrderResponseDto>> CreateOrder(CreateOrderDto createOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra khách hàng có tồn tại không
            var customer = await _context.Customers.FindAsync(createOrderDto.CustomerId);
            if (customer == null)
            {
                return BadRequest(new { message = "Khách hàng không tồn tại" });
            }

            // Kiểm tra nhân viên có tồn tại không (nếu có)
            Employee? employee = null;
            if (createOrderDto.EmployeeId.HasValue)
            {
                employee = await _context.Employees.FindAsync(createOrderDto.EmployeeId.Value);
                if (employee == null)
                {
                    return BadRequest(new { message = "Nhân viên không tồn tại" });
                }
            }

            // Kiểm tra bàn có tồn tại không (nếu có)
            Table? table = null;
            if (createOrderDto.TableId.HasValue)
            {
                table = await _context.Tables.FindAsync(createOrderDto.TableId.Value);
                if (table == null)
                {
                    return BadRequest(new { message = "Bàn không tồn tại" });
                }
            }

            // Kiểm tra sản phẩm và tính toán giá
            var orderItems = new List<OrderItem>();
            var productsDict = new Dictionary<int, Product>(); // Lưu products riêng để validate discount
            decimal subTotal = 0;

            foreach (var itemDto in createOrderDto.OrderItems)
            {
                var product = await _context.Products
                    .AsSplitQuery() // Tách query thành nhiều queries riêng biệt
                    .Include(p => p.ProductIngredients)
                        .ThenInclude(pi => pi.Ingredient)
                    .FirstOrDefaultAsync(p => p.Id == itemDto.ProductId);
                
                if (product == null)
                {
                    return BadRequest(new { message = $"Sản phẩm ID {itemDto.ProductId} không tồn tại" });
                }

                if (!product.IsActive || !product.IsAvailable)
                {
                    return BadRequest(new { message = $"Sản phẩm {product.Name} không khả dụng" });
                }

                // Tính số lượng có thể làm từ nguyên liệu
                int availableQuantity = CalculateAvailableQuantity(product);
                
                if (availableQuantity < itemDto.Quantity)
                {
                    return BadRequest(new { message = $"Sản phẩm {product.Name} không đủ hàng. Có thể làm: {availableQuantity} phần" });
                }

                // Lưu product vào dictionary để dùng khi validate discount
                if (!productsDict.ContainsKey(product.Id))
                {
                    productsDict[product.Id] = product;
                }

                var orderItem = new OrderItem
                {
                    ProductId = itemDto.ProductId,
                    Quantity = itemDto.Quantity,
                    UnitPrice = product.Price,
                    TotalPrice = product.Price * itemDto.Quantity,
                    SpecialInstructions = itemDto.SpecialInstructions
                };

                orderItems.Add(orderItem);
                subTotal += orderItem.TotalPrice;
            }

            // Xử lý mã giảm giá (nếu có)
            Discount? discount = null;
            decimal discountAmount = 0;

            if (createOrderDto.DiscountId.HasValue)
            {
                Console.WriteLine($"🎟️ Discount requested: ID = {createOrderDto.DiscountId.Value}");
                
                discount = await _context.Discounts
                    .AsSplitQuery() // Tách query thành nhiều queries riêng biệt, tránh lỗi SQL WITH syntax
                    .Include(d => d.ApplicableProducts)
                    .Include(d => d.ApplicableCategories)
                    .Include(d => d.ApplicableCustomerTiers)
                    .Include(d => d.FreeProduct)
                    .FirstOrDefaultAsync(d => d.Id == createOrderDto.DiscountId.Value);

                if (discount != null)
                {
                    Console.WriteLine($"📋 DISCOUNT VALIDATION START");
                    Console.WriteLine($"Discount ID: {discount.Id}, Name: {discount.Name}, Code: {discount.Code}");
                    Console.WriteLine($"Is Active: {discount.IsActive}");
                    Console.WriteLine($"Start Date: {discount.StartDate}, End Date: {discount.EndDate}");
                    Console.WriteLine($"Usage: {discount.UsedCount}/{discount.UsageLimit}");
                    
                    // Validate discount
                    var now = DateTimeHelper.VietnamNow;
                    if (!discount.IsActive)
                    {
                        Console.WriteLine($"⚠️ DISCOUNT ERROR: Inactive");
                        return BadRequest(new { message = "Mã giảm giá đã bị vô hiệu hóa" });
                    }

                    if (now < discount.StartDate)
                    {
                        Console.WriteLine($"⚠️ DISCOUNT ERROR: Not started yet");
                        return BadRequest(new { message = "Mã giảm giá chưa có hiệu lực" });
                    }

                    if (now > discount.EndDate)
                    {
                        Console.WriteLine($"⚠️ DISCOUNT ERROR: Expired");
                        return BadRequest(new { message = "Mã giảm giá đã hết hạn" });
                    }

                    if (discount.UsageLimit.HasValue && discount.UsedCount >= discount.UsageLimit.Value)
                    {
                        Console.WriteLine($"⚠️ DISCOUNT ERROR: Usage limit reached");
                        return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng" });
                    }

                    // Kiểm tra áp dụng cho sản phẩm/danh mục cụ thể
                    var orderProductIds = orderItems.Select(oi => oi.ProductId).ToList();
                    // Lấy products từ dictionary đã load trước đó
                    var orderProducts = productsDict.Values.ToList();
                    var orderCategoryIds = orderProducts.Select(p => p.CategoryId).Distinct().ToList();

                    // Xác định các sản phẩm áp dụng discount
                    List<int> applicableOrderProductIds = new List<int>();
                    
                    // Tính subtotal chỉ cho các sản phẩm áp dụng discount (mặc định là toàn bộ nếu không có điều kiện)
                    decimal applicableSubTotal = subTotal;

                    // Kiểm tra sản phẩm cụ thể
                    if (discount.ApplicableProducts != null && discount.ApplicableProducts.Any())
                    {
                        var applicableProductIds = discount.ApplicableProducts.Select(ap => ap.Id).ToList();
                        applicableOrderProductIds = orderProductIds.Where(pid => applicableProductIds.Contains(pid)).ToList();
                        
                        if (!applicableOrderProductIds.Any())
                        {
                            Console.WriteLine($"⚠️ DISCOUNT ERROR: No applicable products found");
                            Console.WriteLine($"Discount ApplicableProducts: {string.Join(", ", applicableProductIds)}");
                            Console.WriteLine($"Order Product IDs: {string.Join(", ", orderProductIds)}");
                            return BadRequest(new { message = "Mã giảm giá này không áp dụng cho sản phẩm trong đơn hàng" });
                        }
                    }

                    // Kiểm tra danh mục
                    if (discount.ApplicableCategories != null && discount.ApplicableCategories.Any())
                    {
                        var applicableCategoryIds = discount.ApplicableCategories.Select(ac => ac.Id).ToList();
                        var productsInCategories = orderProducts
                            .Where(p => applicableCategoryIds.Contains(p.CategoryId))
                            .Select(p => p.Id)
                            .ToList();
                        
                        if (!productsInCategories.Any())
                        {
                            return BadRequest(new { message = "Mã giảm giá này không áp dụng cho danh mục sản phẩm trong đơn hàng" });
                        }
                        
                        // Nếu đã có sản phẩm cụ thể, hợp nhất (OR logic)
                        if (applicableOrderProductIds.Any())
                        {
                            applicableOrderProductIds = applicableOrderProductIds.Union(productsInCategories).ToList();
                        }
                        else
                        {
                            applicableOrderProductIds = productsInCategories;
                        }
                    }

                    // Tính subtotal chỉ cho các sản phẩm áp dụng discount
                    if (applicableOrderProductIds.Any())
                    {
                        applicableSubTotal = orderItems
                            .Where(oi => applicableOrderProductIds.Contains(oi.ProductId))
                            .Sum(oi => oi.TotalPrice);
                    }

                    // Kiểm tra đơn hàng tối thiểu (kiểm tra trên toàn bộ đơn hàng)
                    if (discount.MinOrderAmount.HasValue && subTotal < discount.MinOrderAmount.Value)
                    {
                        Console.WriteLine($"⚠️ DISCOUNT ERROR: Min order amount not met");
                        Console.WriteLine($"Required: {discount.MinOrderAmount.Value}, Current: {subTotal}");
                        return BadRequest(new { message = $"Đơn hàng tối thiểu {discount.MinOrderAmount.Value:N0}đ để áp dụng mã giảm giá này" });
                    }

                    // Kiểm tra áp dụng cho hạng khách hàng
                    if (discount.ApplicableCustomerTiers != null && discount.ApplicableCustomerTiers.Any())
                    {
                        var discountCustomer = await _context.Customers
                            .Include(c => c.Orders)
                            .FirstOrDefaultAsync(c => c.Id == createOrderDto.CustomerId);
                        
                        if (discountCustomer != null)
                        {
                            // Tính tổng tiền đã chi của khách hàng
                            var customerTotalSpent = discountCustomer.Orders
                                .Where(o => o.Status != OrderStatus.Cancelled)
                                .Sum(o => o.TotalAmount);

                            // Lấy tier của khách hàng dựa trên totalSpent
                            var customerTier = await _context.CustomerTiers
                                .OrderByDescending(t => t.MinimumSpent)
                                .FirstOrDefaultAsync(t => customerTotalSpent >= t.MinimumSpent);

                            if (customerTier == null || !discount.ApplicableCustomerTiers.Any(ct => ct.Id == customerTier.Id))
                            {
                                return BadRequest(new { message = "Mã giảm giá này không áp dụng cho hạng khách hàng của bạn" });
                            }
                        }
                    }

                    // Kiểm tra áp dụng cho vai trò nhân viên
                    if (!string.IsNullOrWhiteSpace(discount.ApplicableEmployeeRoles))
                    {
                        try
                        {
                            var allowedRoles = JsonSerializer.Deserialize<List<int>>(discount.ApplicableEmployeeRoles);
                            if (allowedRoles != null && allowedRoles.Any())
                            {
                                if (createOrderDto.EmployeeId.HasValue)
                                {
                                    var discountEmployee = await _context.Employees.FindAsync(createOrderDto.EmployeeId.Value);
                                    if (discountEmployee != null)
                                    {
                                        if (!allowedRoles.Contains((int)discountEmployee.Role))
                                        {
                                            return BadRequest(new { message = "Mã giảm giá này không áp dụng cho vai trò của nhân viên này" });
                                        }
                                    }
                                }
                                // Nếu không có employeeId, có thể vẫn cho phép (khách vãng lai tạo order)
                            }
                        }
                        catch
                        {
                            // Nếu không parse được JSON, bỏ qua kiểm tra này
                        }
                    }

                    // Xử lý BuyXGetY: Tự động thêm sản phẩm tặng
                    if (discount.Type == DiscountType.BuyXGetY)
                    {
                        if (discount.BuyQuantity.HasValue && discount.FreeProductId.HasValue && discount.FreeProduct != null)
                        {
                            // Đếm số lượng sản phẩm áp dụng trong order
                            int applicableProductCount = 0;
                            
                            if (discount.ApplicableProducts != null && discount.ApplicableProducts.Any())
                            {
                                // Đếm theo sản phẩm cụ thể
                                applicableProductCount = orderItems
                                    .Where(oi => discount.ApplicableProducts.Any(ap => ap.Id == oi.ProductId))
                                    .Sum(oi => oi.Quantity);
                            }
                            else if (discount.ApplicableCategories != null && discount.ApplicableCategories.Any())
                            {
                                // Đếm theo danh mục
                                var applicableCategoryIds = discount.ApplicableCategories.Select(c => c.Id).ToList();
                                applicableProductCount = orderItems
                                    .Where(oi => orderProducts.Any(p => p.Id == oi.ProductId && applicableCategoryIds.Contains(p.CategoryId)))
                                    .Sum(oi => oi.Quantity);
                            }
                            else
                            {
                                // Áp dụng cho tất cả sản phẩm
                                applicableProductCount = orderItems.Sum(oi => oi.Quantity);
                            }

                            // Tính số lượng được tặng/giảm giá (ví dụ: mua 2 tặng 1, mua 4 tặng 2)
                            if (applicableProductCount >= discount.BuyQuantity.Value)
                            {
                                int freeQuantity = (applicableProductCount / discount.BuyQuantity.Value) * (discount.FreeProductQuantity ?? 1);
                                
                                // Kiểm tra sản phẩm tặng có sẵn không
                                int availableFreeQuantity = CalculateAvailableQuantity(discount.FreeProduct);
                                if (availableFreeQuantity < freeQuantity)
                                {
                                    return BadRequest(new { message = $"Sản phẩm tặng {discount.FreeProduct.Name} không đủ hàng. Có thể tặng: {availableFreeQuantity} phần" });
                                }

                                // Xác định loại giảm giá và tính giá cho sản phẩm tặng
                                int discountType = discount.FreeProductDiscountType ?? 0; // 0 = Free, 1 = Percentage, 2 = FixedAmount
                                decimal productPrice = discount.FreeProduct.Price;
                                decimal unitPrice = productPrice;
                                decimal discountPerItem = 0;

                                if (discountType == 1) // Giảm %
                                {
                                    decimal discountPercent = discount.FreeProductDiscountValue ?? 0;
                                    discountPerItem = (productPrice * discountPercent) / 100;
                                    unitPrice = productPrice - discountPerItem;
                                }
                                else if (discountType == 2) // Giảm số tiền cố định
                                {
                                    discountPerItem = discount.FreeProductDiscountValue ?? 0;
                                    if (discountPerItem > productPrice)
                                    {
                                        discountPerItem = productPrice; // Không được giảm quá giá gốc
                                    }
                                    unitPrice = productPrice - discountPerItem;
                                }
                                else // discountType == 0 (Miễn phí)
                                {
                                    unitPrice = 0;
                                    discountPerItem = productPrice;
                                }

                                // Tính tổng discount cho các món được tặng/giảm giá
                                decimal totalDiscountForFreeItems = discountPerItem * freeQuantity;

                                // Kiểm tra xem sản phẩm tặng đã có trong order chưa
                                var existingFreeItem = orderItems.FirstOrDefault(oi => oi.ProductId == discount.FreeProductId.Value);
                                if (existingFreeItem != null)
                                {
                                    // Cập nhật số lượng và giá nếu đã có
                                    int oldQuantity = existingFreeItem.Quantity;
                                    existingFreeItem.Quantity += freeQuantity;
                                    
                                    // Tính lại giá: (giá cũ * số lượng cũ + giá mới * số lượng mới) / tổng số lượng
                                    // Hoặc đơn giản hơn: nếu đã có sản phẩm này với giá gốc, ta cần áp dụng giá giảm cho phần tặng
                                    // Giả sử sản phẩm đã có với giá gốc, ta chỉ cần cập nhật phần tặng
                                    decimal oldTotalPrice = existingFreeItem.TotalPrice;
                                    decimal newTotalPrice = oldTotalPrice + (unitPrice * freeQuantity);
                                    existingFreeItem.TotalPrice = newTotalPrice;
                                    
                                    // Cập nhật UnitPrice trung bình
                                    existingFreeItem.UnitPrice = newTotalPrice / existingFreeItem.Quantity;
                                    
                                    if (string.IsNullOrWhiteSpace(existingFreeItem.SpecialInstructions))
                                    {
                                        existingFreeItem.SpecialInstructions = $"Tặng kèm từ khuyến mãi: {discount.Name}";
                                    }
                                    else if (!existingFreeItem.SpecialInstructions.Contains("khuyến mãi"))
                                    {
                                        existingFreeItem.SpecialInstructions += $". Tặng kèm từ khuyến mãi: {discount.Name}";
                                    }
                                }
                                else
                                {
                                    // Thêm mới OrderItem cho sản phẩm tặng/giảm giá
                                    var freeOrderItem = new OrderItem
                                    {
                                        ProductId = discount.FreeProductId.Value,
                                        Quantity = freeQuantity,
                                        UnitPrice = unitPrice,
                                        TotalPrice = unitPrice * freeQuantity,
                                        SpecialInstructions = discountType == 0 
                                            ? $"Tặng kèm từ khuyến mãi: {discount.Name}"
                                            : $"Giảm giá từ khuyến mãi: {discount.Name}"
                                    };
                                    orderItems.Add(freeOrderItem);
                                }
                                
                                // Cộng vào discountAmount
                                discountAmount = totalDiscountForFreeItems;
                            }
                        }
                    }
                    else
                    {
                        // Tính toán số tiền giảm giá cho Percentage và FixedAmount
                        // Chỉ tính trên các sản phẩm áp dụng discount
                        if (discount.Type == DiscountType.Percentage)
                        {
                            discountAmount = (applicableSubTotal * discount.DiscountValue) / 100;
                            if (discount.MaxDiscountAmount.HasValue && discountAmount > discount.MaxDiscountAmount.Value)
                            {
                                discountAmount = discount.MaxDiscountAmount.Value;
                            }
                        }
                        else if (discount.Type == DiscountType.FixedAmount)
                        {
                            discountAmount = discount.DiscountValue;
                            // Không được giảm quá subtotal của các sản phẩm áp dụng
                            if (discountAmount > applicableSubTotal)
                            {
                                discountAmount = applicableSubTotal;
                            }
                        }

                        discountAmount = Math.Max(0, discountAmount);
                        
                        // Debug log for CreateOrder
                        Console.WriteLine($"===== CREATE ORDER DISCOUNT DEBUG =====");
                        Console.WriteLine($"DiscountId: {discount.Id}");
                        Console.WriteLine($"Discount Name: {discount.Name}");
                        Console.WriteLine($"Discount Type: {discount.Type}");
                        Console.WriteLine($"Discount Value: {discount.DiscountValue}");
                        Console.WriteLine($"SubTotal: {subTotal}");
                        Console.WriteLine($"Applicable SubTotal: {applicableSubTotal}");
                        Console.WriteLine($"Calculated Discount Amount: {discountAmount}");
                        Console.WriteLine($"Applicable Product IDs: {string.Join(", ", applicableOrderProductIds)}");
                        Console.WriteLine($"Has ApplicableProducts: {discount.ApplicableProducts?.Any()}");
                        Console.WriteLine($"Has ApplicableCategories: {discount.ApplicableCategories?.Any()}");
                        Console.WriteLine($"========================================");
                    }
                }
                else
                {
                    Console.WriteLine($"⚠️ DISCOUNT ERROR: Discount ID {createOrderDto.DiscountId.Value} not found in database");
                    return BadRequest(new { message = "Không tìm thấy mã giảm giá" });
                }
            }

            // Tính lại subtotal sau khi có thể đã thêm sản phẩm tặng
            subTotal = orderItems.Sum(oi => oi.TotalPrice);

            // Tính toán thuế và phí giao hàng
            decimal taxAmount = createOrderDto.IncludeVAT ? subTotal * 0.1m : 0; // 10% VAT nếu bật
            decimal deliveryFee = createOrderDto.Type == OrderType.Delivery ? 20000 : 0; // 20k phí giao hàng
            decimal totalAmount = subTotal + taxAmount + deliveryFee - discountAmount; // Trừ discount

            // Tạo số đơn hàng
            var orderNumber = await GenerateOrderNumber();

            var order = new Order
            {
                OrderNumber = orderNumber,
                Status = OrderStatus.Pending,
                Type = createOrderDto.Type,
                SubTotal = subTotal,
                TaxAmount = taxAmount,
                DeliveryFee = deliveryFee,
                DiscountAmount = discountAmount > 0 ? discountAmount : null,
                TotalAmount = Math.Max(0, totalAmount), // Đảm bảo không âm
                Notes = createOrderDto.Notes,
                OrderDate = DateTimeHelper.VietnamNow,
                CustomerId = createOrderDto.CustomerId,
                EmployeeId = createOrderDto.EmployeeId,
                TableId = createOrderDto.TableId,
                TableGroupId = createOrderDto.TableGroupId,
                DiscountId = discount?.Id,
                OrderItems = orderItems
            };

            _context.Orders.Add(order);
            
            // Tăng số lần sử dụng của discount nếu có (bao gồm cả BuyXGetY)
            if (discount != null && (discountAmount > 0 || discount.Type == DiscountType.BuyXGetY))
            {
                discount.UsedCount++;
                discount.UpdatedAt = DateTimeHelper.VietnamNow;
            }

            await _context.SaveChangesAsync();
            
            // Cập nhật trạng thái bàn thành Occupied nếu đơn hàng tại bàn
            if (table != null)
            {
                table.Status = TableStatus.Occupied;
                table.UpdatedAt = DateTimeHelper.VietnamNow;
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Table {table.TableNumber} (ID: {table.Id}) updated to Occupied");
            }
            
            // Debug log sau khi save
            Console.WriteLine($"===== ORDER CREATED & SAVED =====");
            Console.WriteLine($"OrderId: {order.Id}");
            Console.WriteLine($"OrderNumber: {order.OrderNumber}");
            Console.WriteLine($"DiscountId: {order.DiscountId}");
            Console.WriteLine($"DiscountAmount in DB: {order.DiscountAmount}");
            Console.WriteLine($"TotalAmount: {order.TotalAmount}");
            Console.WriteLine($"==================================");

            // Cập nhật tồn kho sản phẩm và nguyên liệu
            foreach (var item in orderItems)
            {
                var product = await _context.Products
                    .Include(p => p.ProductIngredients)
                        .ThenInclude(pi => pi.Ingredient)
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId);
                
                if (product != null)
                {
                    // Nếu sản phẩm có nguyên liệu, trừ nguyên liệu
                    if (product.ProductIngredients != null && product.ProductIngredients.Any())
                    {
                        foreach (var pi in product.ProductIngredients)
                        {
                            if (pi.Ingredient != null && pi.QuantityRequired > 0)
                            {
                                // Trừ nguyên liệu: số lượng cần = quantityRequired * số lượng sản phẩm
                                decimal quantityToDeduct = pi.QuantityRequired * item.Quantity;
                                pi.Ingredient.Quantity = Math.Max(0, pi.Ingredient.Quantity - quantityToDeduct);
                                pi.Ingredient.UpdatedAt = DateTimeHelper.VietnamNow;
                            }
                        }
                    }
                    else
                    {
                        // Nếu không có nguyên liệu, trừ StockQuantity
                        product.StockQuantity = Math.Max(0, product.StockQuantity - item.Quantity);
                    }
                    
                    product.UpdatedAt = DateTimeHelper.VietnamNow;
                }
            }

            await _context.SaveChangesAsync();

            // Load lại order với đầy đủ thông tin để trả về response
            var savedOrder = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Customer)
                .Include(o => o.Employee)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            if (savedOrder == null)
            {
                return StatusCode(500, new { message = "Lỗi khi load lại đơn hàng sau khi lưu" });
            }

            // Trả về response
            var response = new OrderResponseDto
            {
                Id = savedOrder.Id,
                OrderNumber = savedOrder.OrderNumber,
                Status = savedOrder.Status,
                StatusName = GetStatusName(savedOrder.Status),
                Type = savedOrder.Type,
                TypeName = GetTypeName(savedOrder.Type),
                SubTotal = savedOrder.SubTotal,
                TaxAmount = savedOrder.TaxAmount,
                DeliveryFee = savedOrder.DeliveryFee,
                DiscountAmount = savedOrder.DiscountAmount,
                DiscountId = savedOrder.DiscountId,
                TotalAmount = savedOrder.TotalAmount,
                Notes = savedOrder.Notes,
                OrderDate = savedOrder.OrderDate,
                ConfirmedAt = savedOrder.ConfirmedAt,
                PreparedAt = savedOrder.PreparedAt,
                DeliveredAt = savedOrder.DeliveredAt,
                CustomerId = savedOrder.CustomerId,
                CustomerName = savedOrder.Customer != null 
                    ? savedOrder.Customer.FirstName + " " + savedOrder.Customer.LastName 
                    : customer.FirstName + " " + customer.LastName,
                CustomerEmail = savedOrder.Customer != null ? savedOrder.Customer.Email : customer.Email,
                EmployeeId = savedOrder.EmployeeId,
                EmployeeName = savedOrder.Employee != null 
                    ? savedOrder.Employee.FirstName + " " + savedOrder.Employee.LastName 
                    : employee != null ? employee.FirstName + " " + employee.LastName : null,
                OrderItems = savedOrder.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    Id = oi.Id,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product != null ? oi.Product.Name : string.Empty,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions
                }).ToList(),
                IsPaid = false,
                PaidAmount = 0
            };

            return CreatedAtAction(nameof(GetOrder), new { id = savedOrder.Id }, response);
        }

        /// <summary>
        /// Cập nhật trạng thái đơn hàng
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrder(int id, UpdateOrderDto updateOrderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Load order với đầy đủ thông tin ngay từ đầu để tránh conflict và load lại nhiều lần
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.Customer)
                .Include(o => o.Discount)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            // Kiểm tra nhân viên có tồn tại không (nếu có)
            if (updateOrderDto.EmployeeId.HasValue)
            {
                var employee = await _context.Employees.FindAsync(updateOrderDto.EmployeeId.Value);
                if (employee == null)
                {
                    return BadRequest(new { message = "Nhân viên không tồn tại" });
                }
            }

            // Kiểm tra bàn mới có tồn tại không (nếu có chuyển bàn)
            Table? newTable = null;
            if (updateOrderDto.TableId.HasValue)
            {
                newTable = await _context.Tables.FindAsync(updateOrderDto.TableId.Value);
                if (newTable == null)
                {
                    return BadRequest(new { message = "Bàn không tồn tại" });
                }
            }

            var oldStatus = order.Status;
            var oldTableId = order.TableId;
            order.Status = updateOrderDto.Status;
            order.Notes = updateOrderDto.Notes;
            order.EmployeeId = updateOrderDto.EmployeeId;

            // Xử lý cập nhật danh sách món ăn nếu có (Cộng dồn món từ POS)
            if (updateOrderDto.OrderItems != null && updateOrderDto.OrderItems.Any())
            {
                // Hoàn lại kho cho các món cũ trước khi xóa
                foreach (var oldItem in order.OrderItems)
                {
                    var product = await _context.Products.FindAsync(oldItem.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity += oldItem.Quantity;
                    }
                }

                // Xóa các món cũ
                _context.OrderItems.RemoveRange(order.OrderItems);
                order.OrderItems.Clear();

                decimal newSubTotal = 0;
                foreach (var itemDto in updateOrderDto.OrderItems)
                {
                    var product = await _context.Products.FindAsync(itemDto.ProductId);
                    if (product == null) continue;

                    // Kiểm tra tồn kho
                    if (product.StockQuantity < itemDto.Quantity)
                    {
                        return BadRequest(new { message = $"Sản phẩm {product.Name} không đủ tồn kho" });
                    }

                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = itemDto.ProductId,
                        Quantity = itemDto.Quantity,
                        UnitPrice = product.Price,
                        TotalPrice = product.Price * itemDto.Quantity,
                        SpecialInstructions = itemDto.SpecialInstructions
                    };
                    
                    order.OrderItems.Add(orderItem);
                    newSubTotal += orderItem.TotalPrice;

                    // Trừ kho mới
                    product.StockQuantity -= itemDto.Quantity;
                    product.UpdatedAt = DateTimeHelper.VietnamNow;
                }

                order.SubTotal = newSubTotal;
                // Tính lại TaxAmount (nếu đơn hàng cũ có TaxAmount > 0 thì áp dụng 10%)
                if (order.TaxAmount > 0 || order.SubTotal > 0)
                {
                    order.TaxAmount = Math.Round(newSubTotal * 0.1m, 2);
                }
            }
            
            // Xử lý cập nhật discount nếu có
            if (updateOrderDto.DiscountId.HasValue)
            {
                // Load discount cơ bản từ database
                    var discount = await _context.Discounts
                        .Include(d => d.ApplicableProducts)
                        .Include(d => d.ApplicableCategories)
                        .Include(d => d.ApplicableCustomerTiers)
                        .Include(d => d.FreeProduct)
                        .FirstOrDefaultAsync(d => d.Id == updateOrderDto.DiscountId.Value);
                    
                    if (discount != null)
                    {
                    // Validate discount
                        var now = DateTimeHelper.VietnamNow;
                        if (!discount.IsActive || now < discount.StartDate || now > discount.EndDate)
                        {
                            return BadRequest(new { message = "Mã giảm giá không còn hiệu lực" });
                        }
                        
                    if (discount.UsageLimit.HasValue && discount.UsedCount >= discount.UsageLimit.Value && order.DiscountId != discount.Id)
                        {
                            return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng" });
                        }
                        
                    // Tính lại discount amount
                    var orderItemsList = order.OrderItems.ToList();
                        var orderProductIds = orderItemsList.Select(oi => oi.ProductId).ToList();
                        
                        List<int> applicableOrderProductIds = new List<int>();
                    decimal applicableSubTotal = order.SubTotal;
                        
                    // Kiểm tra sản phẩm/danh mục áp dụng
                        if (discount.ApplicableProducts != null && discount.ApplicableProducts.Any())
                        {
                            var applicableProductIds = discount.ApplicableProducts.Select(ap => ap.Id).ToList();
                            applicableOrderProductIds = orderProductIds.Where(pid => applicableProductIds.Contains(pid)).ToList();
                            
                            if (!applicableOrderProductIds.Any())
                            {
                                return BadRequest(new { message = "Mã giảm giá này không áp dụng cho sản phẩm trong đơn hàng" });
                            }
                        }
                        
                        if (discount.ApplicableCategories != null && discount.ApplicableCategories.Any())
                        {
                            var applicableCategoryIds = discount.ApplicableCategories.Select(ac => ac.Id).ToList();
                        var productsInCategories = orderItemsList
                            .Where(oi => oi.Product != null && applicableCategoryIds.Contains(oi.Product.CategoryId))
                            .Select(oi => oi.ProductId)
                                .ToList();
                            
                        if (!productsInCategories.Any() && !applicableOrderProductIds.Any())
                            {
                                return BadRequest(new { message = "Mã giảm giá này không áp dụng cho danh mục sản phẩm trong đơn hàng" });
                            }
                            
                                applicableOrderProductIds = applicableOrderProductIds.Union(productsInCategories).ToList();
                        }
                        
                    // Tính subtotal chỉ cho các sản phẩm áp dụng
                        if (applicableOrderProductIds.Any())
                        {
                            applicableSubTotal = orderItemsList
                                .Where(oi => applicableOrderProductIds.Contains(oi.ProductId))
                                .Sum(oi => oi.TotalPrice);
                        }
                        
                        // Tính discount amount
                        decimal newDiscountAmount = 0;
                        if (discount.Type == DiscountType.Percentage)
                        {
                            newDiscountAmount = (applicableSubTotal * discount.DiscountValue) / 100;
                            if (discount.MaxDiscountAmount.HasValue && newDiscountAmount > discount.MaxDiscountAmount.Value)
                            {
                                newDiscountAmount = discount.MaxDiscountAmount.Value;
                            }
                        }
                        else if (discount.Type == DiscountType.FixedAmount)
                        {
                            newDiscountAmount = discount.DiscountValue;
                            if (newDiscountAmount > applicableSubTotal)
                            {
                                newDiscountAmount = applicableSubTotal;
                            }
                        }
                        
                        newDiscountAmount = Math.Max(0, newDiscountAmount);
                        
                    // Debug log
                    Console.WriteLine($"===== UPDATE ORDER DISCOUNT DEBUG =====");
                    Console.WriteLine($"OrderId: {id}");
                    Console.WriteLine($"DiscountId: {discount.Id}");
                    Console.WriteLine($"Calculated Discount Amount: {newDiscountAmount}");
                    Console.WriteLine($"=======================================");
                    
                    // Cập nhật discount vào order
                        order.DiscountId = discount.Id;
                        order.DiscountAmount = newDiscountAmount > 0 ? newDiscountAmount : null;
                        
                    // Cập nhật lại TotalAmount
                    order.TotalAmount = Math.Max(0, order.SubTotal + order.TaxAmount + order.DeliveryFee - (order.DiscountAmount ?? 0));
                    }
                    else
                    {
                        return BadRequest(new { message = "Không tìm thấy mã giảm giá" });
                    }
                }
            else if (updateOrderDto.DiscountId == -1 && order.DiscountId.HasValue)
            {
                // Chỉ xóa discount nếu gửi giá trị -1
                order.DiscountId = null;
                order.DiscountAmount = null;
                order.TotalAmount = Math.Max(0, order.SubTotal + order.TaxAmount + order.DeliveryFee);
            }
            // Quan trọng: Nếu DiscountId không đổi, chúng ta vẫn nên đảm bảo TotalAmount đúng với discount hiện tại
            else if (order.DiscountId.HasValue && order.DiscountAmount.HasValue)
            {
                 order.TotalAmount = Math.Max(0, order.SubTotal + order.TaxAmount + order.DeliveryFee - order.DiscountAmount.Value);
            }
            
            // Cập nhật tableId nếu có (chuyển bàn)
            if (updateOrderDto.TableId.HasValue)
            {
                order.TableId = updateOrderDto.TableId.Value;
                
                // Cập nhật trạng thái bàn cũ về Available
                if (oldTableId.HasValue)
                {
                    var oldTable = await _context.Tables.FindAsync(oldTableId.Value);
                    if (oldTable != null)
                    {
                        oldTable.Status = TableStatus.Available;
                        oldTable.UpdatedAt = DateTimeHelper.VietnamNow;
                    }
                }
                
                // Cập nhật trạng thái bàn mới về Occupied
                if (newTable != null)
                {
                    newTable.Status = TableStatus.Occupied;
                    newTable.UpdatedAt = DateTimeHelper.VietnamNow;
                }
            }

            // Cập nhật thời gian theo trạng thái
            switch (updateOrderDto.Status)
            {
                case OrderStatus.Confirmed:
                    order.ConfirmedAt = DateTimeHelper.VietnamNow;
                    break;
                case OrderStatus.Preparing:
                    order.PreparedAt = DateTimeHelper.VietnamNow;
                    break;
                case OrderStatus.Delivered:
                    order.DeliveredAt = DateTimeHelper.VietnamNow;
                    break;
            }

            try
            {
                await _context.SaveChangesAsync();
                
                // Debug log sau khi save
                Console.WriteLine($"===== ORDER SAVED =====");
                Console.WriteLine($"OrderId: {id}");
                Console.WriteLine($"DiscountId in DB: {order.DiscountId}");
                Console.WriteLine($"DiscountAmount in DB: {order.DiscountAmount}");
                Console.WriteLine($"TotalAmount in DB: {order.TotalAmount}");
                Console.WriteLine($"=======================");
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy đơn hàng" });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { 
                message = $"Đơn hàng đã được cập nhật từ {GetStatusName(oldStatus)} thành {GetStatusName(updateOrderDto.Status)}",
                status = updateOrderDto.Status,
                statusName = GetStatusName(updateOrderDto.Status),
                discountId = order.DiscountId,
                discountAmount = order.DiscountAmount,
                totalAmount = order.TotalAmount
            });
        }

        /// <summary>
        /// Hủy đơn hàng
        /// </summary>
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            if (order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Đơn hàng đã được hủy" });
            }

            if (order.Status == OrderStatus.Delivered)
            {
                return BadRequest(new { message = "Không thể hủy đơn hàng đã giao" });
            }

            // Hoàn trả tồn kho sản phẩm
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    product.StockQuantity += item.Quantity;
                    product.UpdatedAt = DateTimeHelper.VietnamNow;
                }
            }

            order.Status = OrderStatus.Cancelled;
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Đơn hàng đã được hủy và tồn kho đã được hoàn trả",
                status = OrderStatus.Cancelled,
                statusName = GetStatusName(OrderStatus.Cancelled)
            });
        }

        /// <summary>
        /// Xóa đơn hàng (chỉ cho phép xóa đơn hàng đã hủy)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng" });
            }

            if (order.Status != OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Chỉ có thể xóa đơn hàng đã hủy" });
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }

        private async Task<string> GenerateOrderNumber()
        {
            var today = DateTimeHelper.VietnamNow.ToString("yyyyMMdd");
            var count = await _context.Orders
                .Where(o => o.OrderNumber.StartsWith($"ORD{today}"))
                .CountAsync();
            
            return $"ORD{today}{(count + 1):D4}";
        }

        /// <summary>
        /// Tính số lượng sản phẩm có thể làm dựa trên tồn kho nguyên liệu
        /// </summary>
        private int CalculateAvailableQuantity(Product product)
        {
            // Nếu không có nguyên liệu, trả về StockQuantity hiện tại
            if (product.ProductIngredients == null || !product.ProductIngredients.Any())
            {
                return product.StockQuantity;
            }

            int minQuantity = int.MaxValue;

            foreach (var pi in product.ProductIngredients)
            {
                if (pi.QuantityRequired <= 0) continue;

                // Tính số lượng có thể làm từ nguyên liệu này
                decimal ingredientQuantity = pi.Ingredient?.Quantity ?? 0;
                decimal quantityRequired = pi.QuantityRequired;

                if (quantityRequired > 0)
                {
                    var possibleQuantity = (int)Math.Floor(ingredientQuantity / quantityRequired);
                    // Lấy giá trị nhỏ nhất (nguyên liệu ít nhất quyết định số lượng)
                    minQuantity = Math.Min(minQuantity, possibleQuantity);
                }
            }

            return minQuantity == int.MaxValue ? product.StockQuantity : minQuantity;
        }

        private static string GetStatusName(OrderStatus status)
        {
            return status switch
            {
                OrderStatus.Pending => "Chờ xử lý",
                OrderStatus.Confirmed => "Đã xác nhận",
                OrderStatus.Preparing => "Đang chuẩn bị",
                OrderStatus.Ready => "Sẵn sàng",
                OrderStatus.Delivered => "Đã giao",
                OrderStatus.Cancelled => "Đã hủy",
                _ => "Không xác định"
            };
        }

        private static string GetTypeName(OrderType type)
        {
            return type switch
            {
                OrderType.DineIn => "Tại quán",
                OrderType.Takeaway => "Mang về",
                OrderType.Delivery => "Giao hàng",
                _ => "Không xác định"
            };
        }
    }
}
