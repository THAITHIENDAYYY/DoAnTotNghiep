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
    public class DiscountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiscountsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả giảm giá
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DiscountListResponseDto>>> GetDiscounts()
        {
            try
            {
                var now = DateTimeHelper.VietnamNow;
                var allDiscounts = await _context.Discounts
                    .OrderByDescending(d => d.Id)
                    .ToListAsync();

                var discounts = allDiscounts.Select(d => new DiscountListResponseDto
                {
                    Id = d.Id,
                    Code = d.Code,
                    Name = d.Name,
                    Type = d.Type,
                    TypeName = d.Type == DiscountType.Percentage ? "Phần trăm" : 
                               d.Type == DiscountType.FixedAmount ? "Số tiền cố định" : "Mua X tặng Y",
                    DiscountValue = d.DiscountValue,
                    StartDate = d.StartDate,
                    EndDate = d.EndDate,
                    UsageLimit = d.UsageLimit,
                    UsedCount = d.UsedCount,
                    IsActive = d.IsActive,
                    IsValid = d.IsActive && 
                              now >= d.StartDate && 
                              now <= d.EndDate &&
                              (d.UsageLimit == null || d.UsedCount < d.UsageLimit)
                }).ToList();

                return Ok(discounts);
            }
            catch (Exception ex)
            {
                // Log error for debugging
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách mã giảm giá", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        /// <summary>
        /// Lấy danh sách giảm giá đang hoạt động và còn hiệu lực
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<DiscountListResponseDto>>> GetActiveDiscounts()
        {
            try
            {
                var now = DateTimeHelper.VietnamNow;
                var allDiscounts = await _context.Discounts
                    .Where(d => d.IsActive &&
                               d.StartDate <= now &&
                               d.EndDate >= now &&
                               (d.UsageLimit == null || d.UsedCount < d.UsageLimit))
                    .OrderByDescending(d => d.StartDate)
                    .ToListAsync();

                var discounts = allDiscounts.Select(d => new DiscountListResponseDto
                {
                    Id = d.Id,
                    Code = d.Code,
                    Name = d.Name,
                    Type = d.Type,
                    TypeName = d.Type == DiscountType.Percentage ? "Phần trăm" : 
                               d.Type == DiscountType.FixedAmount ? "Số tiền cố định" : "Mua X tặng Y",
                    DiscountValue = d.DiscountValue,
                    StartDate = d.StartDate,
                    EndDate = d.EndDate,
                    UsageLimit = d.UsageLimit,
                    UsedCount = d.UsedCount,
                    IsActive = d.IsActive,
                    IsValid = true
                }).ToList();

                return Ok(discounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy danh sách mã giảm giá đang hoạt động", error = ex.Message });
            }
        }

        /// <summary>
        /// Lấy thông tin chi tiết giảm giá theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<DiscountResponseDto>> GetDiscount(int id)
        {
            var discount = await _context.Discounts
                .Include(d => d.ApplicableProducts)
                .Include(d => d.ApplicableCategories)
                .Include(d => d.ApplicableCustomerTiers)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá" });
            }

            var now = DateTimeHelper.VietnamNow;
            var isValid = discount.IsActive &&
                         now >= discount.StartDate &&
                         now <= discount.EndDate &&
                         (discount.UsageLimit == null || discount.UsedCount < discount.UsageLimit);

            var response = new DiscountResponseDto
            {
                Id = discount.Id,
                Code = discount.Code,
                Name = discount.Name,
                Description = discount.Description,
                Type = discount.Type,
                TypeName = discount.Type == DiscountType.Percentage ? "Phần trăm" : 
                           discount.Type == DiscountType.FixedAmount ? "Số tiền cố định" : "Mua X tặng Y",
                DiscountValue = discount.DiscountValue,
                MinOrderAmount = discount.MinOrderAmount,
                MaxDiscountAmount = discount.MaxDiscountAmount,
                StartDate = discount.StartDate,
                EndDate = discount.EndDate,
                UsageLimit = discount.UsageLimit,
                UsedCount = discount.UsedCount,
                IsActive = discount.IsActive,
                IsValid = isValid,
                CreatedAt = discount.CreatedAt,
                UpdatedAt = discount.UpdatedAt,
                ApplicableProductIds = discount.ApplicableProducts.Select(p => p.Id).ToList(),
                ApplicableCategoryIds = discount.ApplicableCategories.Select(c => c.Id).ToList(),
                ApplicableCustomerTierIds = discount.ApplicableCustomerTiers?.Select(ct => ct.Id).ToList() ?? new List<int>(),
                ApplicableEmployeeRoleIds = ParseEmployeeRolesJson(discount.ApplicableEmployeeRoles),
                BuyQuantity = discount.BuyQuantity,
                FreeProductId = discount.FreeProductId,
                FreeProductName = discount.FreeProduct?.Name,
                FreeProductQuantity = discount.FreeProductQuantity,
                FreeProductDiscountType = discount.FreeProductDiscountType,
                FreeProductDiscountTypeName = discount.FreeProductDiscountType.HasValue 
                    ? discount.FreeProductDiscountType.Value == 0 ? "Miễn phí"
                        : discount.FreeProductDiscountType.Value == 1 ? "Giảm %"
                        : "Giảm số tiền"
                    : null,
                FreeProductDiscountValue = discount.FreeProductDiscountValue
            };

            return Ok(response);
        }

        /// <summary>
        /// Kiểm tra mã giảm giá có hợp lệ không
        /// </summary>
        [HttpGet("validate/{code}")]
        public async Task<ActionResult<DiscountResponseDto>> ValidateDiscountCode(string code)
        {
            var discount = await _context.Discounts
                .Include(d => d.ApplicableProducts)
                .Include(d => d.ApplicableCategories)
                .Include(d => d.ApplicableCustomerTiers)
                .Include(d => d.FreeProduct)
                .FirstOrDefaultAsync(d => d.Code.ToUpper() == code.ToUpper());

            if (discount == null)
            {
                return NotFound(new { message = "Mã giảm giá không tồn tại" });
            }

            var now = DateTimeHelper.VietnamNow;
            
            if (!discount.IsActive)
            {
                return BadRequest(new { message = "Mã giảm giá đã bị vô hiệu hóa" });
            }

            if (now < discount.StartDate)
            {
                return BadRequest(new { message = "Mã giảm giá chưa có hiệu lực" });
            }

            if (now > discount.EndDate)
            {
                return BadRequest(new { message = "Mã giảm giá đã hết hạn" });
            }

            if (discount.UsageLimit.HasValue && discount.UsedCount >= discount.UsageLimit.Value)
            {
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng" });
            }

            var response = new DiscountResponseDto
            {
                Id = discount.Id,
                Code = discount.Code,
                Name = discount.Name,
                Description = discount.Description,
                Type = discount.Type,
                TypeName = discount.Type == DiscountType.Percentage ? "Phần trăm" : 
                           discount.Type == DiscountType.FixedAmount ? "Số tiền cố định" : "Mua X tặng Y",
                DiscountValue = discount.DiscountValue,
                MinOrderAmount = discount.MinOrderAmount,
                MaxDiscountAmount = discount.MaxDiscountAmount,
                StartDate = discount.StartDate,
                EndDate = discount.EndDate,
                UsageLimit = discount.UsageLimit,
                UsedCount = discount.UsedCount,
                IsActive = discount.IsActive,
                IsValid = true,
                CreatedAt = discount.CreatedAt,
                UpdatedAt = discount.UpdatedAt,
                ApplicableProductIds = discount.ApplicableProducts.Select(p => p.Id).ToList(),
                ApplicableCategoryIds = discount.ApplicableCategories.Select(c => c.Id).ToList(),
                ApplicableCustomerTierIds = discount.ApplicableCustomerTiers?.Select(ct => ct.Id).ToList() ?? new List<int>(),
                ApplicableEmployeeRoleIds = ParseEmployeeRolesJson(discount.ApplicableEmployeeRoles),
                BuyQuantity = discount.BuyQuantity,
                FreeProductId = discount.FreeProductId,
                FreeProductName = discount.FreeProduct?.Name,
                FreeProductQuantity = discount.FreeProductQuantity,
                FreeProductDiscountType = discount.FreeProductDiscountType,
                FreeProductDiscountTypeName = discount.FreeProductDiscountType.HasValue 
                    ? discount.FreeProductDiscountType.Value == 0 ? "Miễn phí"
                        : discount.FreeProductDiscountType.Value == 1 ? "Giảm %"
                        : "Giảm số tiền"
                    : null,
                FreeProductDiscountValue = discount.FreeProductDiscountValue
            };

            return Ok(response);
        }

        /// <summary>
        /// Tạo mã giảm giá mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<DiscountResponseDto>> CreateDiscount(CreateDiscountDto createDiscountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra mã giảm giá đã tồn tại chưa
            var existingDiscount = await _context.Discounts
                .FirstOrDefaultAsync(d => d.Code.ToUpper() == createDiscountDto.Code.ToUpper());

            if (existingDiscount != null)
            {
                return Conflict(new { message = "Mã giảm giá đã tồn tại" });
            }

            // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
            if (createDiscountDto.StartDate >= createDiscountDto.EndDate)
            {
                return BadRequest(new { message = "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
            }

            // Kiểm tra giá trị giảm giá
            if (createDiscountDto.Type == DiscountType.Percentage)
            {
                if (createDiscountDto.DiscountValue <= 0 || createDiscountDto.DiscountValue > 100)
                {
                    return BadRequest(new { message = "Phần trăm giảm giá phải từ 0.01 đến 100" });
                }
            }
            else if (createDiscountDto.Type == DiscountType.FixedAmount)
            {
                if (createDiscountDto.DiscountValue <= 0)
                {
                    return BadRequest(new { message = "Số tiền giảm giá phải lớn hơn 0" });
                }
            }

            // Kiểm tra BuyXGetY fields
            if (createDiscountDto.Type == DiscountType.BuyXGetY)
            {
                if (!createDiscountDto.BuyQuantity.HasValue || createDiscountDto.BuyQuantity.Value < 1)
                {
                    return BadRequest(new { message = "Số lượng mua phải lớn hơn 0 cho loại Mua X tặng Y" });
                }
                if (!createDiscountDto.FreeProductId.HasValue)
                {
                    return BadRequest(new { message = "Vui lòng chọn sản phẩm được tặng cho loại Mua X tặng Y" });
                }
                if (!createDiscountDto.FreeProductQuantity.HasValue || createDiscountDto.FreeProductQuantity.Value < 1)
                {
                    return BadRequest(new { message = "Số lượng sản phẩm tặng phải lớn hơn 0" });
                }
                
                // Kiểm tra sản phẩm tặng có tồn tại không
                var freeProduct = await _context.Products.FindAsync(createDiscountDto.FreeProductId.Value);
                if (freeProduct == null)
                {
                    return BadRequest(new { message = "Sản phẩm được tặng không tồn tại" });
                }

                // Kiểm tra FreeProductDiscountType và FreeProductDiscountValue
                if (createDiscountDto.FreeProductDiscountType.HasValue)
                {
                    var discountType = createDiscountDto.FreeProductDiscountType.Value;
                    if (discountType == 1) // Percentage
                    {
                        if (!createDiscountDto.FreeProductDiscountValue.HasValue || 
                            createDiscountDto.FreeProductDiscountValue.Value < 0 || 
                            createDiscountDto.FreeProductDiscountValue.Value > 100)
                        {
                            return BadRequest(new { message = "Phần trăm giảm giá cho sản phẩm tặng phải từ 0 đến 100" });
                        }
                    }
                    else if (discountType == 2) // FixedAmount
                    {
                        if (!createDiscountDto.FreeProductDiscountValue.HasValue || 
                            createDiscountDto.FreeProductDiscountValue.Value < 0)
                        {
                            return BadRequest(new { message = "Số tiền giảm cho sản phẩm tặng phải lớn hơn hoặc bằng 0" });
                        }
                    }
                }
            }

            var discount = new Discount
            {
                Code = createDiscountDto.Code.ToUpper(),
                Name = createDiscountDto.Name,
                Description = createDiscountDto.Description,
                Type = createDiscountDto.Type,
                DiscountValue = createDiscountDto.DiscountValue,
                MinOrderAmount = createDiscountDto.MinOrderAmount,
                MaxDiscountAmount = createDiscountDto.MaxDiscountAmount,
                StartDate = createDiscountDto.StartDate,
                EndDate = createDiscountDto.EndDate,
                UsageLimit = createDiscountDto.UsageLimit,
                UsedCount = 0,
                IsActive = true,
                CreatedAt = DateTimeHelper.VietnamNow,
                BuyQuantity = createDiscountDto.BuyQuantity,
                FreeProductId = createDiscountDto.FreeProductId,
                FreeProductQuantity = createDiscountDto.FreeProductQuantity ?? 1,
                FreeProductDiscountType = createDiscountDto.FreeProductDiscountType ?? 0, // Mặc định là Free (0)
                FreeProductDiscountValue = createDiscountDto.FreeProductDiscountValue
            };

            // Thêm sản phẩm áp dụng (nếu có)
            if (createDiscountDto.ApplicableProductIds != null && createDiscountDto.ApplicableProductIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var productIds = createDiscountDto.ApplicableProductIds.ToList();
                var allProducts = await _context.Products.ToListAsync();
                var products = allProducts.Where(p => productIds.Contains(p.Id)).ToList();
                
                foreach (var product in products)
                {
                    discount.ApplicableProducts.Add(product);
                }
            }

            // Thêm danh mục áp dụng (nếu có)
            if (createDiscountDto.ApplicableCategoryIds != null && createDiscountDto.ApplicableCategoryIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var categoryIds = createDiscountDto.ApplicableCategoryIds.ToList();
                var allCategories = await _context.Categories.ToListAsync();
                var categories = allCategories.Where(c => categoryIds.Contains(c.Id)).ToList();
                
                foreach (var category in categories)
                {
                    discount.ApplicableCategories.Add(category);
                }
            }

            // Thêm hạng khách hàng áp dụng (nếu có)
            if (createDiscountDto.ApplicableCustomerTierIds != null && createDiscountDto.ApplicableCustomerTierIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var tierIds = createDiscountDto.ApplicableCustomerTierIds.ToList();
                var allCustomerTiers = await _context.CustomerTiers.ToListAsync();
                var customerTiers = allCustomerTiers.Where(ct => tierIds.Contains(ct.Id)).ToList();
                
                foreach (var tier in customerTiers)
                {
                    discount.ApplicableCustomerTiers.Add(tier);
                }
            }

            // Lưu vai trò nhân viên áp dụng (nếu có)
            if (createDiscountDto.ApplicableEmployeeRoleIds != null && createDiscountDto.ApplicableEmployeeRoleIds.Any())
            {
                discount.ApplicableEmployeeRoles = JsonSerializer.Serialize(createDiscountDto.ApplicableEmployeeRoleIds);
            }

            _context.Discounts.Add(discount);
            await _context.SaveChangesAsync();

            // Load lại discount với navigation properties để tránh lỗi SQL
            var savedDiscount = await _context.Discounts
                .Include(d => d.ApplicableProducts)
                .Include(d => d.ApplicableCategories)
                .Include(d => d.ApplicableCustomerTiers)
                .Include(d => d.FreeProduct)
                .FirstOrDefaultAsync(d => d.Id == discount.Id);

            if (savedDiscount == null)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo mã giảm giá" });
            }

            var response = MapToResponseDto(savedDiscount);
            return CreatedAtAction(nameof(GetDiscount), new { id = savedDiscount.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin giảm giá
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDiscount(int id, UpdateDiscountDto updateDiscountDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var discount = await _context.Discounts
                .Include(d => d.ApplicableProducts)
                .Include(d => d.ApplicableCategories)
                .Include(d => d.ApplicableCustomerTiers)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá" });
            }

            // Kiểm tra mã giảm giá đã tồn tại chưa (trừ mã hiện tại)
            var existingDiscount = await _context.Discounts
                .FirstOrDefaultAsync(d => d.Code.ToUpper() == updateDiscountDto.Code.ToUpper() && d.Id != id);

            if (existingDiscount != null)
            {
                return Conflict(new { message = "Mã giảm giá đã tồn tại" });
            }

            // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
            if (updateDiscountDto.StartDate >= updateDiscountDto.EndDate)
            {
                return BadRequest(new { message = "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
            }

            // Kiểm tra giá trị giảm giá
            if (updateDiscountDto.Type == DiscountType.Percentage)
            {
                if (updateDiscountDto.DiscountValue <= 0 || updateDiscountDto.DiscountValue > 100)
                {
                    return BadRequest(new { message = "Phần trăm giảm giá phải từ 0.01 đến 100" });
                }
            }
            else if (updateDiscountDto.Type == DiscountType.FixedAmount)
            {
                if (updateDiscountDto.DiscountValue <= 0)
                {
                    return BadRequest(new { message = "Số tiền giảm giá phải lớn hơn 0" });
                }
            }

            // Kiểm tra BuyXGetY fields
            if (updateDiscountDto.Type == DiscountType.BuyXGetY)
            {
                if (!updateDiscountDto.BuyQuantity.HasValue || updateDiscountDto.BuyQuantity.Value < 1)
                {
                    return BadRequest(new { message = "Số lượng mua phải lớn hơn 0 cho loại Mua X tặng Y" });
                }
                if (!updateDiscountDto.FreeProductId.HasValue)
                {
                    return BadRequest(new { message = "Vui lòng chọn sản phẩm được tặng cho loại Mua X tặng Y" });
                }
                if (!updateDiscountDto.FreeProductQuantity.HasValue || updateDiscountDto.FreeProductQuantity.Value < 1)
                {
                    return BadRequest(new { message = "Số lượng sản phẩm tặng phải lớn hơn 0" });
                }
                
                // Kiểm tra sản phẩm tặng có tồn tại không
                var freeProduct = await _context.Products.FindAsync(updateDiscountDto.FreeProductId.Value);
                if (freeProduct == null)
                {
                    return BadRequest(new { message = "Sản phẩm được tặng không tồn tại" });
                }

                // Kiểm tra FreeProductDiscountType và FreeProductDiscountValue
                if (updateDiscountDto.FreeProductDiscountType.HasValue)
                {
                    var discountType = updateDiscountDto.FreeProductDiscountType.Value;
                    if (discountType == 1) // Percentage
                    {
                        if (!updateDiscountDto.FreeProductDiscountValue.HasValue || 
                            updateDiscountDto.FreeProductDiscountValue.Value < 0 || 
                            updateDiscountDto.FreeProductDiscountValue.Value > 100)
                        {
                            return BadRequest(new { message = "Phần trăm giảm giá cho sản phẩm tặng phải từ 0 đến 100" });
                        }
                    }
                    else if (discountType == 2) // FixedAmount
                    {
                        if (!updateDiscountDto.FreeProductDiscountValue.HasValue || 
                            updateDiscountDto.FreeProductDiscountValue.Value < 0)
                        {
                            return BadRequest(new { message = "Số tiền giảm cho sản phẩm tặng phải lớn hơn hoặc bằng 0" });
                        }
                    }
                }
            }

            // Cập nhật thông tin
            discount.Code = updateDiscountDto.Code.ToUpper();
            discount.Name = updateDiscountDto.Name;
            discount.Description = updateDiscountDto.Description;
            discount.Type = updateDiscountDto.Type;
            discount.DiscountValue = updateDiscountDto.DiscountValue;
            discount.MinOrderAmount = updateDiscountDto.MinOrderAmount;
            discount.MaxDiscountAmount = updateDiscountDto.MaxDiscountAmount;
            discount.StartDate = updateDiscountDto.StartDate;
            discount.EndDate = updateDiscountDto.EndDate;
            discount.UsageLimit = updateDiscountDto.UsageLimit;
            discount.IsActive = updateDiscountDto.IsActive;
            discount.UpdatedAt = DateTimeHelper.VietnamNow;
            discount.BuyQuantity = updateDiscountDto.BuyQuantity;
            discount.FreeProductId = updateDiscountDto.FreeProductId;
            discount.FreeProductQuantity = updateDiscountDto.FreeProductQuantity ?? 1;
            discount.FreeProductDiscountType = updateDiscountDto.FreeProductDiscountType ?? 0; // Mặc định là Free (0)
            discount.FreeProductDiscountValue = updateDiscountDto.FreeProductDiscountValue;

            // Cập nhật sản phẩm áp dụng
            discount.ApplicableProducts.Clear();
            if (updateDiscountDto.ApplicableProductIds != null && updateDiscountDto.ApplicableProductIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var productIds = updateDiscountDto.ApplicableProductIds.ToList();
                var allProducts = await _context.Products.ToListAsync();
                var products = allProducts.Where(p => productIds.Contains(p.Id)).ToList();
                
                foreach (var product in products)
                {
                    discount.ApplicableProducts.Add(product);
                }
            }

            // Cập nhật danh mục áp dụng
            discount.ApplicableCategories.Clear();
            if (updateDiscountDto.ApplicableCategoryIds != null && updateDiscountDto.ApplicableCategoryIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var categoryIds = updateDiscountDto.ApplicableCategoryIds.ToList();
                var allCategories = await _context.Categories.ToListAsync();
                var categories = allCategories.Where(c => categoryIds.Contains(c.Id)).ToList();
                
                foreach (var category in categories)
                {
                    discount.ApplicableCategories.Add(category);
                }
            }

            // Cập nhật hạng khách hàng áp dụng
            discount.ApplicableCustomerTiers.Clear();
            if (updateDiscountDto.ApplicableCustomerTierIds != null && updateDiscountDto.ApplicableCustomerTierIds.Any())
            {
                // Tách query thành các bước đơn giản để tránh lỗi SQL phức tạp
                var tierIds = updateDiscountDto.ApplicableCustomerTierIds.ToList();
                var allCustomerTiers = await _context.CustomerTiers.ToListAsync();
                var customerTiers = allCustomerTiers.Where(ct => tierIds.Contains(ct.Id)).ToList();
                
                foreach (var tier in customerTiers)
                {
                    discount.ApplicableCustomerTiers.Add(tier);
                }
            }

            // Cập nhật vai trò nhân viên áp dụng
            if (updateDiscountDto.ApplicableEmployeeRoleIds != null && updateDiscountDto.ApplicableEmployeeRoleIds.Any())
            {
                discount.ApplicableEmployeeRoles = JsonSerializer.Serialize(updateDiscountDto.ApplicableEmployeeRoleIds);
            }
            else
            {
                discount.ApplicableEmployeeRoles = null; // null = áp dụng cho tất cả
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!DiscountExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy mã giảm giá" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa mã giảm giá
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDiscount(int id)
        {
            var discount = await _context.Discounts.FindAsync(id);
            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá" });
            }

            // Kiểm tra xem mã giảm giá đã được sử dụng chưa
            var hasUsedInOrders = await _context.Orders.AnyAsync(o => o.DiscountId == id);
            if (hasUsedInOrders)
            {
                return BadRequest(new { message = "Không thể xóa mã giảm giá đã được sử dụng trong đơn hàng" });
            }

            _context.Discounts.Remove(discount);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt mã giảm giá
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleDiscountStatus(int id)
        {
            var discount = await _context.Discounts.FindAsync(id);
            if (discount == null)
            {
                return NotFound(new { message = "Không tìm thấy mã giảm giá" });
            }

            discount.IsActive = !discount.IsActive;
            discount.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = discount.IsActive ? "Mã giảm giá đã được kích hoạt" : "Mã giảm giá đã được vô hiệu hóa",
                isActive = discount.IsActive 
            });
        }

        private bool DiscountExists(int id)
        {
            return _context.Discounts.Any(e => e.Id == id);
        }

        private DiscountResponseDto MapToResponseDto(Discount discount)
        {
            var now = DateTimeHelper.VietnamNow;
            var isValid = discount.IsActive &&
                         now >= discount.StartDate &&
                         now <= discount.EndDate &&
                         (discount.UsageLimit == null || discount.UsedCount < discount.UsageLimit);

            return new DiscountResponseDto
            {
                Id = discount.Id,
                Code = discount.Code,
                Name = discount.Name,
                Description = discount.Description,
                Type = discount.Type,
                TypeName = discount.Type == DiscountType.Percentage ? "Phần trăm" : 
                           discount.Type == DiscountType.FixedAmount ? "Số tiền cố định" : "Mua X tặng Y",
                DiscountValue = discount.DiscountValue,
                MinOrderAmount = discount.MinOrderAmount,
                MaxDiscountAmount = discount.MaxDiscountAmount,
                StartDate = discount.StartDate,
                EndDate = discount.EndDate,
                UsageLimit = discount.UsageLimit,
                UsedCount = discount.UsedCount,
                IsActive = discount.IsActive,
                IsValid = isValid,
                CreatedAt = discount.CreatedAt,
                UpdatedAt = discount.UpdatedAt,
                ApplicableProductIds = discount.ApplicableProducts?.Select(p => p.Id).ToList() ?? new List<int>(),
                ApplicableCategoryIds = discount.ApplicableCategories?.Select(c => c.Id).ToList() ?? new List<int>(),
                ApplicableCustomerTierIds = discount.ApplicableCustomerTiers?.Select(ct => ct.Id).ToList() ?? new List<int>(),
                ApplicableEmployeeRoleIds = ParseEmployeeRolesJson(discount.ApplicableEmployeeRoles),
                BuyQuantity = discount.BuyQuantity,
                FreeProductId = discount.FreeProductId,
                FreeProductName = discount.FreeProduct?.Name,
                FreeProductQuantity = discount.FreeProductQuantity,
                FreeProductDiscountType = discount.FreeProductDiscountType,
                FreeProductDiscountTypeName = discount.FreeProductDiscountType.HasValue 
                    ? discount.FreeProductDiscountType.Value == 0 ? "Miễn phí"
                        : discount.FreeProductDiscountType.Value == 1 ? "Giảm %"
                        : "Giảm số tiền"
                    : null,
                FreeProductDiscountValue = discount.FreeProductDiscountValue
            };
        }

        private List<int> ParseEmployeeRolesJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return new List<int>();

            try
            {
                return JsonSerializer.Deserialize<List<int>>(json) ?? new List<int>();
            }
            catch
            {
                return new List<int>();
            }
        }
    }
}

