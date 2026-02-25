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
    public class ProductIngredientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductIngredientsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách nguyên liệu của sản phẩm
        /// </summary>
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<ProductIngredientResponseDto>>> GetProductIngredients(int productId)
        {
            var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
            if (!productExists)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            var ingredients = await _context.ProductIngredients
                .Where(pi => pi.ProductId == productId)
                .Include(pi => pi.Ingredient)
                .Select(pi => new ProductIngredientResponseDto
                {
                    Id = pi.Id,
                    ProductId = pi.ProductId,
                    IngredientId = pi.IngredientId,
                    IngredientName = pi.Ingredient.Name,
                    Unit = pi.Ingredient.Unit,
                    QuantityRequired = pi.QuantityRequired,
                    CurrentStock = pi.Ingredient.Quantity,
                    IsLowStock = pi.Ingredient.Quantity <= pi.Ingredient.MinQuantity,
                    CreatedAt = pi.CreatedAt
                })
                .ToListAsync();

            return Ok(ingredients);
        }

        /// <summary>
        /// Thêm nguyên liệu vào sản phẩm
        /// </summary>
        [HttpPost("product/{productId}")]
        public async Task<ActionResult<ProductIngredientResponseDto>> AddIngredientToProduct(int productId, AddProductIngredientDto dto)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            var ingredient = await _context.Ingredients.FindAsync(dto.IngredientId);
            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            // Kiểm tra xem nguyên liệu đã tồn tại trong sản phẩm chưa
            var existing = await _context.ProductIngredients
                .FirstOrDefaultAsync(pi => pi.ProductId == productId && pi.IngredientId == dto.IngredientId);

            if (existing != null)
            {
                return Conflict(new { message = "Nguyên liệu đã tồn tại trong sản phẩm. Vui lòng cập nhật thay vì thêm mới." });
            }

            var productIngredient = new ProductIngredient
            {
                ProductId = productId,
                IngredientId = dto.IngredientId,
                QuantityRequired = dto.QuantityRequired,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.ProductIngredients.Add(productIngredient);
            await _context.SaveChangesAsync();

            var response = new ProductIngredientResponseDto
            {
                Id = productIngredient.Id,
                ProductId = productIngredient.ProductId,
                IngredientId = productIngredient.IngredientId,
                IngredientName = ingredient.Name,
                Unit = ingredient.Unit,
                QuantityRequired = productIngredient.QuantityRequired,
                CurrentStock = ingredient.Quantity,
                IsLowStock = ingredient.Quantity <= ingredient.MinQuantity,
                CreatedAt = productIngredient.CreatedAt
            };

            return CreatedAtAction(nameof(GetProductIngredients), new { productId = productId }, response);
        }

        /// <summary>
        /// Cập nhật số lượng nguyên liệu trong sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<ProductIngredientResponseDto>> UpdateProductIngredient(int id, [FromBody] decimal quantityRequired)
        {
            var productIngredient = await _context.ProductIngredients
                .Include(pi => pi.Ingredient)
                .FirstOrDefaultAsync(pi => pi.Id == id);

            if (productIngredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu trong sản phẩm" });
            }

            productIngredient.QuantityRequired = quantityRequired;
            await _context.SaveChangesAsync();

            var response = new ProductIngredientResponseDto
            {
                Id = productIngredient.Id,
                ProductId = productIngredient.ProductId,
                IngredientId = productIngredient.IngredientId,
                IngredientName = productIngredient.Ingredient.Name,
                Unit = productIngredient.Ingredient.Unit,
                QuantityRequired = productIngredient.QuantityRequired,
                CurrentStock = productIngredient.Ingredient.Quantity,
                IsLowStock = productIngredient.Ingredient.Quantity <= productIngredient.Ingredient.MinQuantity,
                CreatedAt = productIngredient.CreatedAt
            };

            return Ok(response);
        }

        /// <summary>
        /// Xóa nguyên liệu khỏi sản phẩm
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveIngredientFromProduct(int id)
        {
            var productIngredient = await _context.ProductIngredients.FindAsync(id);

            if (productIngredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu trong sản phẩm" });
            }

            _context.ProductIngredients.Remove(productIngredient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa nguyên liệu khỏi sản phẩm thành công" });
        }

        /// <summary>
        /// Kiểm tra nguyên liệu có đủ để làm sản phẩm không
        /// </summary>
        [HttpGet("product/{productId}/check-availability")]
        public async Task<ActionResult<object>> CheckProductAvailability(int productId, [FromQuery] int quantity = 1)
        {
            var productIngredients = await _context.ProductIngredients
                .Where(pi => pi.ProductId == productId)
                .Include(pi => pi.Ingredient)
                .ToListAsync();

            if (productIngredients.Count == 0)
            {
                return Ok(new
                {
                    available = true,
                    message = "Sản phẩm không yêu cầu nguyên liệu",
                    maxQuantity = int.MaxValue
                });
            }

            var insufficientIngredients = new List<object>();
            var maxPossibleQuantity = int.MaxValue;

            foreach (var pi in productIngredients)
            {
                var requiredQuantity = pi.QuantityRequired * quantity;
                var available = pi.Ingredient.Quantity >= requiredQuantity;
                
                if (!available)
                {
                    insufficientIngredients.Add(new
                    {
                        ingredientName = pi.Ingredient.Name,
                        required = requiredQuantity,
                        available = pi.Ingredient.Quantity,
                        unit = pi.Ingredient.Unit
                    });
                }

                // Tính số lượng tối đa có thể làm
                var possibleQuantity = (int)(pi.Ingredient.Quantity / pi.QuantityRequired);
                if (possibleQuantity < maxPossibleQuantity)
                {
                    maxPossibleQuantity = possibleQuantity;
                }
            }

            if (insufficientIngredients.Count > 0)
            {
                return Ok(new
                {
                    available = false,
                    message = "Không đủ nguyên liệu",
                    insufficientIngredients = insufficientIngredients,
                    maxQuantity = maxPossibleQuantity
                });
            }

            return Ok(new
            {
                available = true,
                message = "Đủ nguyên liệu",
                maxQuantity = maxPossibleQuantity
            });
        }
    }
}

