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
    public class OrderItemsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrderItemsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả chi tiết đơn hàng
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrderItemListResponseDto>>> GetOrderItems()
        {
            var orderItems = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                .Select(oi => new OrderItemListResponseDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    OrderNumber = oi.Order.OrderNumber,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImageUrl = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions,
                    CategoryName = oi.Product.Category.Name
                })
                .OrderByDescending(oi => oi.OrderId)
                .ToListAsync();

            return Ok(orderItems);
        }

        /// <summary>
        /// Lấy danh sách chi tiết đơn hàng theo đơn hàng
        /// </summary>
        [HttpGet("by-order/{orderId}")]
        public async Task<ActionResult<IEnumerable<OrderItemListResponseDto>>> GetOrderItemsByOrder(int orderId)
        {
            var orderItems = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                .Where(oi => oi.OrderId == orderId)
                .Select(oi => new OrderItemListResponseDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    OrderNumber = oi.Order.OrderNumber,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImageUrl = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions,
                    CategoryName = oi.Product.Category.Name
                })
                .ToListAsync();

            return Ok(orderItems);
        }

        /// <summary>
        /// Lấy danh sách chi tiết đơn hàng theo sản phẩm
        /// </summary>
        [HttpGet("by-product/{productId}")]
        public async Task<ActionResult<IEnumerable<OrderItemListResponseDto>>> GetOrderItemsByProduct(int productId)
        {
            var orderItems = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                .Where(oi => oi.ProductId == productId)
                .Select(oi => new OrderItemListResponseDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    OrderNumber = oi.Order.OrderNumber,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImageUrl = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions,
                    CategoryName = oi.Product.Category.Name
                })
                .OrderByDescending(oi => oi.OrderId)
                .ToListAsync();

            return Ok(orderItems);
        }

        /// <summary>
        /// Lấy thông tin chi tiết đơn hàng theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<OrderItemResponseDto>> GetOrderItem(int id)
        {
            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                    .ThenInclude(p => p.Category)
                .Select(oi => new OrderItemResponseDto
                {
                    Id = oi.Id,
                    OrderId = oi.OrderId,
                    OrderNumber = oi.Order.OrderNumber,
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    ProductImageUrl = oi.Product.ImageUrl,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    TotalPrice = oi.TotalPrice,
                    SpecialInstructions = oi.SpecialInstructions,
                    CategoryId = oi.Product.CategoryId,
                    CategoryName = oi.Product.Category.Name
                })
                .FirstOrDefaultAsync(oi => oi.Id == id);

            if (orderItem == null)
            {
                return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng" });
            }

            return Ok(orderItem);
        }

        /// <summary>
        /// Thêm sản phẩm vào đơn hàng
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<OrderItemResponseDto>> CreateOrderItem(CreateOrderItemDto createOrderItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra đơn hàng có tồn tại không
            var order = await _context.Orders.FindAsync(createOrderItemDto.OrderId);
            if (order == null)
            {
                return BadRequest(new { message = "Đơn hàng không tồn tại" });
            }

            // Kiểm tra trạng thái đơn hàng
            if (order.Status == OrderStatus.Delivered || order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Không thể thêm sản phẩm vào đơn hàng đã giao hoặc đã hủy" });
            }

            // Kiểm tra sản phẩm có tồn tại không
            var product = await _context.Products.FindAsync(createOrderItemDto.ProductId);
            if (product == null)
            {
                return BadRequest(new { message = "Sản phẩm không tồn tại" });
            }

            if (!product.IsActive || !product.IsAvailable)
            {
                return BadRequest(new { message = "Sản phẩm không khả dụng" });
            }

            if (product.StockQuantity < createOrderItemDto.Quantity)
            {
                return BadRequest(new { message = $"Sản phẩm {product.Name} không đủ hàng. Tồn kho: {product.StockQuantity}" });
            }

            // Kiểm tra sản phẩm đã có trong đơn hàng chưa
            var existingOrderItem = await _context.OrderItems
                .FirstOrDefaultAsync(oi => oi.OrderId == createOrderItemDto.OrderId && oi.ProductId == createOrderItemDto.ProductId);

            if (existingOrderItem != null)
            {
                return Conflict(new { message = "Sản phẩm đã có trong đơn hàng. Vui lòng cập nhật số lượng thay vì thêm mới." });
            }

            var orderItem = new OrderItem
            {
                OrderId = createOrderItemDto.OrderId,
                ProductId = createOrderItemDto.ProductId,
                Quantity = createOrderItemDto.Quantity,
                UnitPrice = product.Price,
                TotalPrice = product.Price * createOrderItemDto.Quantity,
                SpecialInstructions = createOrderItemDto.SpecialInstructions
            };

            _context.OrderItems.Add(orderItem);

            // Cập nhật tồn kho sản phẩm
            product.StockQuantity -= createOrderItemDto.Quantity;
            product.UpdatedAt = DateTimeHelper.VietnamNow;

            // Cập nhật tổng tiền đơn hàng
            await UpdateOrderTotal(order.Id);

            await _context.SaveChangesAsync();

            var response = new OrderItemResponseDto
            {
                Id = orderItem.Id,
                OrderId = orderItem.OrderId,
                OrderNumber = order.OrderNumber,
                ProductId = orderItem.ProductId,
                ProductName = product.Name,
                ProductImageUrl = product.ImageUrl,
                Quantity = orderItem.Quantity,
                UnitPrice = orderItem.UnitPrice,
                TotalPrice = orderItem.TotalPrice,
                SpecialInstructions = orderItem.SpecialInstructions,
                CategoryId = product.CategoryId,
                CategoryName = product.Category?.Name ?? ""
            };

            return CreatedAtAction(nameof(GetOrderItem), new { id = orderItem.Id }, response);
        }

        /// <summary>
        /// Cập nhật chi tiết đơn hàng
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderItem(int id, UpdateOrderItemDto updateOrderItemDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .FirstOrDefaultAsync(oi => oi.Id == id);

            if (orderItem == null)
            {
                return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng" });
            }

            // Kiểm tra trạng thái đơn hàng
            if (orderItem.Order.Status == OrderStatus.Delivered || orderItem.Order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Không thể cập nhật chi tiết đơn hàng đã giao hoặc đã hủy" });
            }

            var oldQuantity = orderItem.Quantity;
            var quantityDifference = updateOrderItemDto.Quantity - oldQuantity;

            // Kiểm tra tồn kho nếu tăng số lượng
            if (quantityDifference > 0)
            {
                if (orderItem.Product.StockQuantity < quantityDifference)
                {
                    return BadRequest(new { message = $"Không đủ tồn kho. Tồn kho hiện tại: {orderItem.Product.StockQuantity}, cần thêm: {quantityDifference}" });
                }
            }

            // Cập nhật thông tin
            orderItem.Quantity = updateOrderItemDto.Quantity;
            orderItem.TotalPrice = orderItem.UnitPrice * updateOrderItemDto.Quantity;
            orderItem.SpecialInstructions = updateOrderItemDto.SpecialInstructions;

            // Cập nhật tồn kho sản phẩm
            orderItem.Product.StockQuantity -= quantityDifference;
            orderItem.Product.UpdatedAt = DateTimeHelper.VietnamNow;

            // Cập nhật tổng tiền đơn hàng
            await UpdateOrderTotal(orderItem.OrderId);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderItemExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng" });
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { 
                message = "Chi tiết đơn hàng đã được cập nhật",
                quantity = orderItem.Quantity,
                totalPrice = orderItem.TotalPrice
            });
        }

        /// <summary>
        /// Xóa sản phẩm khỏi đơn hàng
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderItem(int id)
        {
            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .FirstOrDefaultAsync(oi => oi.Id == id);

            if (orderItem == null)
            {
                return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng" });
            }

            // Kiểm tra trạng thái đơn hàng
            if (orderItem.Order.Status == OrderStatus.Delivered || orderItem.Order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Không thể xóa chi tiết đơn hàng đã giao hoặc đã hủy" });
            }

            var orderId = orderItem.OrderId;

            // Hoàn trả tồn kho sản phẩm
            orderItem.Product.StockQuantity += orderItem.Quantity;
            orderItem.Product.UpdatedAt = DateTimeHelper.VietnamNow;

            _context.OrderItems.Remove(orderItem);

            // Cập nhật tổng tiền đơn hàng
            await UpdateOrderTotal(orderId);

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Sản phẩm đã được xóa khỏi đơn hàng và tồn kho đã được hoàn trả",
                returnedQuantity = orderItem.Quantity
            });
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong đơn hàng
        /// </summary>
        [HttpPatch("{id}/update-quantity")]
        public async Task<IActionResult> UpdateQuantity(int id, [FromBody] int newQuantity)
        {
            if (newQuantity <= 0)
            {
                return BadRequest(new { message = "Số lượng phải lớn hơn 0" });
            }

            var orderItem = await _context.OrderItems
                .Include(oi => oi.Order)
                .Include(oi => oi.Product)
                .FirstOrDefaultAsync(oi => oi.Id == id);

            if (orderItem == null)
            {
                return NotFound(new { message = "Không tìm thấy chi tiết đơn hàng" });
            }

            // Kiểm tra trạng thái đơn hàng
            if (orderItem.Order.Status == OrderStatus.Delivered || orderItem.Order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Không thể cập nhật số lượng đơn hàng đã giao hoặc đã hủy" });
            }

            var oldQuantity = orderItem.Quantity;
            var quantityDifference = newQuantity - oldQuantity;

            // Kiểm tra tồn kho nếu tăng số lượng
            if (quantityDifference > 0)
            {
                if (orderItem.Product.StockQuantity < quantityDifference)
                {
                    return BadRequest(new { message = $"Không đủ tồn kho. Tồn kho hiện tại: {orderItem.Product.StockQuantity}, cần thêm: {quantityDifference}" });
                }
            }

            // Cập nhật số lượng và tổng tiền
            orderItem.Quantity = newQuantity;
            orderItem.TotalPrice = orderItem.UnitPrice * newQuantity;

            // Cập nhật tồn kho sản phẩm
            orderItem.Product.StockQuantity -= quantityDifference;
            orderItem.Product.UpdatedAt = DateTimeHelper.VietnamNow;

            // Cập nhật tổng tiền đơn hàng
            await UpdateOrderTotal(orderItem.OrderId);

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Số lượng đã được cập nhật",
                oldQuantity = oldQuantity,
                newQuantity = newQuantity,
                totalPrice = orderItem.TotalPrice
            });
        }

        private bool OrderItemExists(int id)
        {
            return _context.OrderItems.Any(e => e.Id == id);
        }

        private async Task UpdateOrderTotal(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order != null)
            {
                order.SubTotal = order.OrderItems.Sum(oi => oi.TotalPrice);
                order.TaxAmount = order.SubTotal * 0.1m; // 10% VAT
                order.TotalAmount = order.SubTotal + order.TaxAmount + order.DeliveryFee;
            }
        }
    }
}
