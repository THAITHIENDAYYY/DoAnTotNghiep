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
    public class ProductsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả sản phẩm
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductListResponseDto>>> GetProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductIngredients)
                    .ThenInclude(pi => pi.Ingredient)
                .ToListAsync();

            var productDtos = products.Select(p => new ProductListResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsActive = p.IsActive,
                StockQuantity = p.StockQuantity,
                SKU = p.SKU,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                IsLowStock = p.StockQuantity <= p.MinStockLevel,
                AvailableQuantityByIngredients = CalculateAvailableQuantity(p),
                MinStockLevel = p.MinStockLevel,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return Ok(productDtos);
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
                
                // Debug logging
                Console.WriteLine($"[DEBUG] Product: {product.Name}, Ingredient: {pi.Ingredient?.Name ?? "null"}, Stock: {ingredientQuantity}, Required: {quantityRequired}");
                
                if (quantityRequired > 0)
                {
                    var possibleQuantity = (int)Math.Floor(ingredientQuantity / quantityRequired);
                    Console.WriteLine($"[DEBUG] Possible quantity: {possibleQuantity}");
                    
                    // Lấy giá trị nhỏ nhất (nguyên liệu ít nhất quyết định số lượng)
                    minQuantity = Math.Min(minQuantity, possibleQuantity);
                }
            }

            var result = minQuantity == int.MaxValue ? product.StockQuantity : minQuantity;
            Console.WriteLine($"[DEBUG] Final available quantity for {product.Name}: {result}");
            return result;
        }

        /// <summary>
        /// Lấy danh sách sản phẩm đang hoạt động và có sẵn
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<ProductListResponseDto>>> GetAvailableProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductIngredients)
                    .ThenInclude(pi => pi.Ingredient)
                .Where(p => p.IsActive && p.IsAvailable)
                .ToListAsync();

            var productDtos = products.Select(p => new ProductListResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsActive = p.IsActive,
                StockQuantity = p.StockQuantity,
                SKU = p.SKU,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                IsLowStock = p.StockQuantity <= p.MinStockLevel,
                AvailableQuantityByIngredients = CalculateAvailableQuantity(p),
                MinStockLevel = p.MinStockLevel,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return Ok(productDtos);
        }

        /// <summary>
        /// Lấy danh sách sản phẩm theo danh mục
        /// </summary>
        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<ProductListResponseDto>>> GetProductsByCategory(int categoryId)
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductIngredients)
                    .ThenInclude(pi => pi.Ingredient)
                .Where(p => p.CategoryId == categoryId)
                .ToListAsync();

            var productDtos = products.Select(p => new ProductListResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsAvailable = p.IsAvailable,
                IsActive = p.IsActive,
                StockQuantity = p.StockQuantity,
                SKU = p.SKU,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                IsLowStock = p.StockQuantity <= p.MinStockLevel,
                AvailableQuantityByIngredients = CalculateAvailableQuantity(p),
                MinStockLevel = p.MinStockLevel,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();

            return Ok(productDtos);
        }

        /// <summary>
        /// Lấy danh sách sản phẩm sắp hết hàng
        /// </summary>
        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<ProductListResponseDto>>> GetLowStockProducts()
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.StockQuantity <= p.MinStockLevel)
                .Select(p => new ProductListResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    IsAvailable = p.IsAvailable,
                    IsActive = p.IsActive,
                    StockQuantity = p.StockQuantity,
                    SKU = p.SKU,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    IsLowStock = p.StockQuantity <= p.MinStockLevel,
                    AvailableQuantityByIngredients = 0,
                    MinStockLevel = p.MinStockLevel,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        /// <summary>
        /// Tìm kiếm sản phẩm theo tên
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductListResponseDto>>> SearchProducts([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Tên sản phẩm không được để trống" });
            }

            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.Name.Contains(name))
                .Select(p => new ProductListResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    IsAvailable = p.IsAvailable,
                    IsActive = p.IsActive,
                    StockQuantity = p.StockQuantity,
                    SKU = p.SKU,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    IsLowStock = p.StockQuantity <= p.MinStockLevel,
                    AvailableQuantityByIngredients = 0,
                    MinStockLevel = p.MinStockLevel,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt
                })
                .ToListAsync();

            return Ok(products);
        }

        /// <summary>
        /// Lấy thông tin chi tiết sản phẩm theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductResponseDto>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Select(p => new ProductResponseDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    IsAvailable = p.IsAvailable,
                    IsActive = p.IsActive,
                    StockQuantity = p.StockQuantity,
                    MinStockLevel = p.MinStockLevel,
                    SKU = p.SKU,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    IsLowStock = p.StockQuantity <= p.MinStockLevel
                })
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            return Ok(product);
        }

        /// <summary>
        /// Tạo sản phẩm mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<ProductResponseDto>> CreateProduct(CreateProductDto createProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra danh mục có tồn tại không
            var category = await _context.Categories.FindAsync(createProductDto.CategoryId);
            if (category == null)
            {
                return BadRequest(new { message = "Danh mục không tồn tại" });
            }

            // Kiểm tra tên sản phẩm đã tồn tại chưa
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Name.ToLower() == createProductDto.Name.ToLower());

            if (existingProduct != null)
            {
                return Conflict(new { message = "Tên sản phẩm đã tồn tại" });
            }

            // Kiểm tra SKU đã tồn tại chưa (nếu có)
            if (!string.IsNullOrWhiteSpace(createProductDto.SKU))
            {
                var existingSku = await _context.Products
                    .FirstOrDefaultAsync(p => p.SKU == createProductDto.SKU);

                if (existingSku != null)
                {
                    return Conflict(new { message = "SKU đã tồn tại" });
                }
            }

            var product = new Product
            {
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                Price = createProductDto.Price,
                ImageUrl = createProductDto.ImageUrl,
                CategoryId = createProductDto.CategoryId,
                IsAvailable = true,
                IsActive = true,
                StockQuantity = createProductDto.StockQuantity,
                MinStockLevel = createProductDto.MinStockLevel,
                SKU = createProductDto.SKU,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            var response = new ProductResponseDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                ImageUrl = product.ImageUrl,
                IsAvailable = product.IsAvailable,
                IsActive = product.IsActive,
                StockQuantity = product.StockQuantity,
                MinStockLevel = product.MinStockLevel,
                SKU = product.SKU,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                CategoryId = product.CategoryId,
                CategoryName = category.Name,
                IsLowStock = product.StockQuantity <= product.MinStockLevel
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, UpdateProductDto updateProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            // Kiểm tra danh mục có tồn tại không
            var category = await _context.Categories.FindAsync(updateProductDto.CategoryId);
            if (category == null)
            {
                return BadRequest(new { message = "Danh mục không tồn tại" });
            }

            // Kiểm tra tên sản phẩm đã tồn tại chưa (trừ sản phẩm hiện tại)
            var existingProduct = await _context.Products
                .FirstOrDefaultAsync(p => p.Name.ToLower() == updateProductDto.Name.ToLower() && p.Id != id);

            if (existingProduct != null)
            {
                return Conflict(new { message = "Tên sản phẩm đã tồn tại" });
            }

            // Kiểm tra SKU đã tồn tại chưa (nếu có và khác với SKU hiện tại)
            if (!string.IsNullOrWhiteSpace(updateProductDto.SKU) && updateProductDto.SKU != product.SKU)
            {
                var existingSku = await _context.Products
                    .FirstOrDefaultAsync(p => p.SKU == updateProductDto.SKU);

                if (existingSku != null)
                {
                    return Conflict(new { message = "SKU đã tồn tại" });
                }
            }

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.Price = updateProductDto.Price;
            product.ImageUrl = updateProductDto.ImageUrl;
            product.CategoryId = updateProductDto.CategoryId;
            product.IsAvailable = updateProductDto.IsAvailable;
            product.IsActive = updateProductDto.IsActive;
            product.StockQuantity = updateProductDto.StockQuantity;
            product.MinStockLevel = updateProductDto.MinStockLevel;
            product.SKU = updateProductDto.SKU;
            product.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy sản phẩm" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa sản phẩm (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            // Kiểm tra xem sản phẩm có trong đơn hàng nào không
            var hasOrderItems = await _context.OrderItems.AnyAsync(oi => oi.ProductId == id);
            if (hasOrderItems)
            {
                return BadRequest(new { message = "Không thể xóa sản phẩm đã có trong đơn hàng. Vui lòng vô hiệu hóa sản phẩm thay vì xóa." });
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt sản phẩm
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleProductStatus(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            product.IsActive = !product.IsActive;
            product.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = product.IsActive ? "Sản phẩm đã được kích hoạt" : "Sản phẩm đã được vô hiệu hóa",
                isActive = product.IsActive 
            });
        }

        /// <summary>
        /// Cập nhật số lượng tồn kho
        /// </summary>
        [HttpPatch("{id}/update-stock")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] int newStockQuantity)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            if (newStockQuantity < 0)
            {
                return BadRequest(new { message = "Số lượng tồn kho không được âm" });
            }

            product.StockQuantity = newStockQuantity;
            product.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Cập nhật tồn kho thành công",
                stockQuantity = product.StockQuantity,
                isLowStock = product.StockQuantity <= product.MinStockLevel
            });
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.Id == id);
        }
    }
}
