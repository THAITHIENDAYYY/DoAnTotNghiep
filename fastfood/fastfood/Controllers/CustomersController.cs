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
    public class CustomersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả khách hàng
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerListResponseDto>>> GetCustomers([FromQuery] CustomerFilterDto? filter)
        {
            var customersQuery = _context.Customers.AsQueryable();

            if (filter != null)
            {
                if (filter.StartDate.HasValue)
                {
                    var startDate = filter.StartDate.Value.Date;
                    customersQuery = customersQuery.Where(c => c.CreatedAt >= startDate);
                }

                if (filter.EndDate.HasValue)
                {
                    var endDate = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1);
                    customersQuery = customersQuery.Where(c => c.CreatedAt <= endDate);
                }

                if (filter.IsActive.HasValue)
                {
                    customersQuery = customersQuery.Where(c => c.IsActive == filter.IsActive.Value);
                }
            }

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
                .ToListAsync();

            if (filter != null)
            {
                if (filter.MinTotalSpent.HasValue)
                {
                    customers = customers.Where(c => c.TotalSpent >= filter.MinTotalSpent.Value).ToList();
                }

                if (filter.MaxTotalSpent.HasValue)
                {
                    customers = customers.Where(c => c.TotalSpent <= filter.MaxTotalSpent.Value).ToList();
                }

                if (filter.MinTotalOrders.HasValue)
                {
                    customers = customers.Where(c => c.TotalOrders >= filter.MinTotalOrders.Value).ToList();
                }

                if (filter.MaxTotalOrders.HasValue)
                {
                    customers = customers.Where(c => c.TotalOrders <= filter.MaxTotalOrders.Value).ToList();
                }
            }

            await AssignTierAsync(customers);

            return Ok(customers);
        }

        /// <summary>
        /// Lấy danh sách khách hàng đang hoạt động
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<CustomerListResponseDto>>> GetActiveCustomers()
        {
            var customers = await _context.Customers
                .Where(c => c.IsActive)
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
                .ToListAsync();

            await AssignTierAsync(customers);

            return Ok(customers);
        }

        /// <summary>
        /// Lấy danh sách khách hàng VIP (có tổng chi tiêu cao)
        /// </summary>
        [HttpGet("vip")]
        public async Task<ActionResult<IEnumerable<CustomerListResponseDto>>> GetVipCustomers([FromQuery] decimal minSpent = 1000000)
        {
            var customers = await _context.Customers
                .Where(c => c.Orders.Sum(o => o.TotalAmount) >= minSpent)
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

            await AssignTierAsync(customers);

            return Ok(customers);
        }

        /// <summary>
        /// Tìm kiếm khách hàng theo tên hoặc email
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<CustomerListResponseDto>>> SearchCustomers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest(new { message = "Từ khóa tìm kiếm không được để trống" });
            }

            var customers = await _context.Customers
                .Where(c => c.FirstName.Contains(query) || 
                           c.LastName.Contains(query) || 
                           c.Email.Contains(query))
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
                .ToListAsync();

            await AssignTierAsync(customers);

            return Ok(customers);
        }

        /// <summary>
        /// Lấy thông tin chi tiết khách hàng theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerResponseDto>> GetCustomer(int id)
        {
            var customer = await _context.Customers
                .Select(c => new CustomerResponseDto
                {
                    Id = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    FullName = c.FirstName + " " + c.LastName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    Address = c.Address,
                    City = c.City,
                    PostalCode = c.PostalCode,
                    DateOfBirth = c.DateOfBirth,
                    Age = DateTimeHelper.VietnamNow.Year - c.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < c.DateOfBirth.DayOfYear ? 1 : 0),
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    UserId = c.UserId,
                    TotalOrders = c.Orders.Count,
                    TotalSpent = c.Orders.Sum(o => o.TotalAmount)
                })
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            await AssignTierAsync(customer);

            return Ok(customer);
        }

        /// <summary>
        /// Lấy thông tin khách hàng theo UserId
        /// </summary>
        [HttpGet("by-user/{userId}")]
        public async Task<ActionResult<CustomerResponseDto>> GetCustomerByUserId(string userId)
        {
            var customer = await _context.Customers
                .Where(c => c.UserId == userId)
                .Select(c => new CustomerResponseDto
                {
                    Id = c.Id,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    FullName = c.FirstName + " " + c.LastName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    Address = c.Address,
                    City = c.City,
                    PostalCode = c.PostalCode,
                    DateOfBirth = c.DateOfBirth,
                    Age = DateTimeHelper.VietnamNow.Year - c.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < c.DateOfBirth.DayOfYear ? 1 : 0),
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    UserId = c.UserId,
                    TotalOrders = c.Orders.Count,
                    TotalSpent = c.Orders.Sum(o => o.TotalAmount)
                })
                .FirstOrDefaultAsync();

            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            await AssignTierAsync(customer);

            return Ok(customer);
        }

        /// <summary>
        /// Tạo khách hàng mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CustomerResponseDto>> CreateCustomer(CreateCustomerDto createCustomerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra email đã tồn tại chưa
            var existingCustomer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email.ToLower() == createCustomerDto.Email.ToLower());

            if (existingCustomer != null)
            {
                return Conflict(new { message = "Email đã tồn tại" });
            }

            // Kiểm tra UserId có tồn tại không (nếu có)
            if (!string.IsNullOrWhiteSpace(createCustomerDto.UserId))
            {
                var existingUserCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.UserId == createCustomerDto.UserId);

                if (existingUserCustomer != null)
                {
                    return Conflict(new { message = "Tài khoản này đã được liên kết với khách hàng khác" });
                }
            }

            var customer = new Customer
            {
                FirstName = createCustomerDto.FirstName,
                LastName = createCustomerDto.LastName,
                Email = createCustomerDto.Email,
                PhoneNumber = createCustomerDto.PhoneNumber,
                Address = createCustomerDto.Address,
                City = createCustomerDto.City,
                PostalCode = createCustomerDto.PostalCode,
                DateOfBirth = createCustomerDto.DateOfBirth,
                IsActive = true,
                UserId = createCustomerDto.UserId,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            var response = new CustomerResponseDto
            {
                Id = customer.Id,
                FirstName = customer.FirstName,
                LastName = customer.LastName,
                FullName = customer.FirstName + " " + customer.LastName,
                Email = customer.Email,
                PhoneNumber = customer.PhoneNumber,
                Address = customer.Address,
                City = customer.City,
                PostalCode = customer.PostalCode,
                DateOfBirth = customer.DateOfBirth,
                Age = DateTimeHelper.VietnamNow.Year - customer.DateOfBirth.Year - (DateTimeHelper.VietnamNow.DayOfYear < customer.DateOfBirth.DayOfYear ? 1 : 0),
                IsActive = customer.IsActive,
                CreatedAt = customer.CreatedAt,
                UpdatedAt = customer.UpdatedAt,
                UserId = customer.UserId,
                TotalOrders = 0,
                TotalSpent = 0
            };

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin khách hàng
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(int id, UpdateCustomerDto updateCustomerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            // Kiểm tra email đã tồn tại chưa (trừ khách hàng hiện tại)
            var existingCustomer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Email.ToLower() == updateCustomerDto.Email.ToLower() && c.Id != id);

            if (existingCustomer != null)
            {
                return Conflict(new { message = "Email đã tồn tại" });
            }

            // Kiểm tra UserId có tồn tại không (nếu có và khác với UserId hiện tại)
            if (!string.IsNullOrWhiteSpace(updateCustomerDto.UserId) && updateCustomerDto.UserId != customer.UserId)
            {
                var existingUserCustomer = await _context.Customers
                    .FirstOrDefaultAsync(c => c.UserId == updateCustomerDto.UserId);

                if (existingUserCustomer != null)
                {
                    return Conflict(new { message = "Tài khoản này đã được liên kết với khách hàng khác" });
                }
            }

            customer.FirstName = updateCustomerDto.FirstName;
            customer.LastName = updateCustomerDto.LastName;
            customer.Email = updateCustomerDto.Email;
            customer.PhoneNumber = updateCustomerDto.PhoneNumber;
            customer.Address = updateCustomerDto.Address;
            customer.City = updateCustomerDto.City;
            customer.PostalCode = updateCustomerDto.PostalCode;
            customer.DateOfBirth = updateCustomerDto.DateOfBirth;
            customer.IsActive = updateCustomerDto.IsActive;
            customer.UserId = updateCustomerDto.UserId;
            customer.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy khách hàng" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa khách hàng (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            // Kiểm tra xem khách hàng có đơn hàng nào không
            var hasOrders = await _context.Orders.AnyAsync(o => o.CustomerId == id);
            if (hasOrders)
            {
                return BadRequest(new { message = "Không thể xóa khách hàng có đơn hàng. Vui lòng vô hiệu hóa khách hàng thay vì xóa." });
            }

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt khách hàng
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleCustomerStatus(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            customer.IsActive = !customer.IsActive;
            customer.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = customer.IsActive ? "Khách hàng đã được kích hoạt" : "Khách hàng đã được vô hiệu hóa",
                isActive = customer.IsActive 
            });
        }

        /// <summary>
        /// Liên kết khách hàng với tài khoản người dùng
        /// </summary>
        [HttpPatch("{id}/link-user")]
        public async Task<IActionResult> LinkCustomerToUser(int id, [FromBody] string userId)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest(new { message = "UserId không được để trống" });
            }

            // Kiểm tra UserId có tồn tại không
            var existingUserCustomer = await _context.Customers
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (existingUserCustomer != null)
            {
                return Conflict(new { message = "Tài khoản này đã được liên kết với khách hàng khác" });
            }

            customer.UserId = userId;
            customer.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Liên kết tài khoản thành công",
                userId = customer.UserId 
            });
        }

        /// <summary>
        /// Hủy liên kết khách hàng với tài khoản người dùng
        /// </summary>
        [HttpPatch("{id}/unlink-user")]
        public async Task<IActionResult> UnlinkCustomerFromUser(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = "Không tìm thấy khách hàng" });
            }

            customer.UserId = null;
            customer.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Hủy liên kết tài khoản thành công"
            });
        }

        private bool CustomerExists(int id)
        {
            return _context.Customers.Any(e => e.Id == id);
        }

        private async Task AssignTierAsync(List<CustomerListResponseDto> customers)
        {
            if (!customers.Any())
            {
                return;
            }

            var tiers = await GetOrderedTiersAsync();
            foreach (var customer in customers)
            {
                var tier = tiers.FirstOrDefault(t => customer.TotalSpent >= t.MinimumSpent);
                if (tier != null)
                {
                    ApplyTierInfo(customer, tier);
                }
            }
        }

        private async Task AssignTierAsync(CustomerResponseDto? customer)
        {
            if (customer == null)
            {
                return;
            }

            var tiers = await GetOrderedTiersAsync();
            var tier = tiers.FirstOrDefault(t => customer.TotalSpent >= t.MinimumSpent);
            if (tier != null)
            {
                ApplyTierInfo(customer, tier);
            }
        }

        private async Task<List<CustomerTier>> GetOrderedTiersAsync()
        {
            return await _context.CustomerTiers
                .OrderByDescending(t => t.MinimumSpent)
                .ThenBy(t => t.DisplayOrder)
                .ToListAsync();
        }

        private static void ApplyTierInfo(CustomerListResponseDto target, CustomerTier tier)
        {
            target.TierId = tier.Id;
            target.TierName = tier.Name;
            target.TierColor = tier.ColorHex;
        }

        private static void ApplyTierInfo(CustomerResponseDto target, CustomerTier tier)
        {
            target.TierId = tier.Id;
            target.TierName = tier.Name;
            target.TierColor = tier.ColorHex;
        }
    }
}
