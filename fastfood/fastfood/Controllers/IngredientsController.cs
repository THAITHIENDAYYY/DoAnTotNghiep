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
    public class IngredientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IngredientsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả nguyên liệu
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IngredientListResponseDto>>> GetIngredients()
        {
            var ingredients = await _context.Ingredients
                .Select(i => new IngredientListResponseDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Unit = i.Unit,
                    Quantity = i.Quantity,
                    MinQuantity = i.MinQuantity,
                    PricePerUnit = i.PricePerUnit,
                    Supplier = i.Supplier,
                    IsActive = i.IsActive,
                    IsLowStock = i.Quantity <= i.MinQuantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(ingredients);
        }

        /// <summary>
        /// Lấy danh sách nguyên liệu đang hoạt động
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<IngredientListResponseDto>>> GetActiveIngredients()
        {
            var ingredients = await _context.Ingredients
                .Where(i => i.IsActive)
                .Select(i => new IngredientListResponseDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Unit = i.Unit,
                    Quantity = i.Quantity,
                    MinQuantity = i.MinQuantity,
                    PricePerUnit = i.PricePerUnit,
                    Supplier = i.Supplier,
                    IsActive = i.IsActive,
                    IsLowStock = i.Quantity <= i.MinQuantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(ingredients);
        }

        /// <summary>
        /// Lấy danh sách nguyên liệu sắp hết
        /// </summary>
        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<IngredientListResponseDto>>> GetLowStockIngredients()
        {
            var ingredients = await _context.Ingredients
                .Where(i => i.Quantity <= i.MinQuantity)
                .Select(i => new IngredientListResponseDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Unit = i.Unit,
                    Quantity = i.Quantity,
                    MinQuantity = i.MinQuantity,
                    PricePerUnit = i.PricePerUnit,
                    Supplier = i.Supplier,
                    IsActive = i.IsActive,
                    IsLowStock = true,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return Ok(ingredients);
        }

        /// <summary>
        /// Lấy thông tin chi tiết nguyên liệu theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<IngredientResponseDto>> GetIngredient(int id)
        {
            var ingredient = await _context.Ingredients
                .Select(i => new IngredientResponseDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Description = i.Description,
                    Unit = i.Unit,
                    Quantity = i.Quantity,
                    MinQuantity = i.MinQuantity,
                    PricePerUnit = i.PricePerUnit,
                    Supplier = i.Supplier,
                    IsActive = i.IsActive,
                    IsLowStock = i.Quantity <= i.MinQuantity,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .FirstOrDefaultAsync(i => i.Id == id);

            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            return Ok(ingredient);
        }

        /// <summary>
        /// Thêm nguyên liệu mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<IngredientResponseDto>> CreateIngredient(CreateIngredientDto dto)
        {
            // Kiểm tra tên nguyên liệu đã tồn tại chưa
            var existingIngredient = await _context.Ingredients
                .FirstOrDefaultAsync(i => i.Name.ToLower() == dto.Name.ToLower());

            if (existingIngredient != null)
            {
                return Conflict(new { message = "Tên nguyên liệu đã tồn tại" });
            }

            var ingredient = new Ingredient
            {
                Name = dto.Name,
                Description = dto.Description,
                Unit = dto.Unit,
                Quantity = dto.Quantity,
                MinQuantity = dto.MinQuantity,
                PricePerUnit = dto.PricePerUnit,
                Supplier = dto.Supplier,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Ingredients.Add(ingredient);
            await _context.SaveChangesAsync();

            var response = new IngredientResponseDto
            {
                Id = ingredient.Id,
                Name = ingredient.Name,
                Description = ingredient.Description,
                Unit = ingredient.Unit,
                Quantity = ingredient.Quantity,
                MinQuantity = ingredient.MinQuantity,
                PricePerUnit = ingredient.PricePerUnit,
                Supplier = ingredient.Supplier,
                IsActive = ingredient.IsActive,
                IsLowStock = ingredient.Quantity <= ingredient.MinQuantity,
                CreatedAt = ingredient.CreatedAt,
                UpdatedAt = ingredient.UpdatedAt
            };

            return CreatedAtAction(nameof(GetIngredient), new { id = ingredient.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin nguyên liệu
        /// </summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<IngredientResponseDto>> UpdateIngredient(int id, UpdateIngredientDto dto)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);

            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            // Kiểm tra tên nguyên liệu đã tồn tại chưa (trừ chính nó)
            var existingIngredient = await _context.Ingredients
                .FirstOrDefaultAsync(i => i.Name.ToLower() == dto.Name.ToLower() && i.Id != id);

            if (existingIngredient != null)
            {
                return Conflict(new { message = "Tên nguyên liệu đã tồn tại" });
            }

            ingredient.Name = dto.Name;
            ingredient.Description = dto.Description;
            ingredient.Unit = dto.Unit;
            ingredient.Quantity = dto.Quantity;
            ingredient.MinQuantity = dto.MinQuantity;
            ingredient.PricePerUnit = dto.PricePerUnit;
            ingredient.Supplier = dto.Supplier;
            ingredient.IsActive = dto.IsActive;
            ingredient.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            var response = new IngredientResponseDto
            {
                Id = ingredient.Id,
                Name = ingredient.Name,
                Description = ingredient.Description,
                Unit = ingredient.Unit,
                Quantity = ingredient.Quantity,
                MinQuantity = ingredient.MinQuantity,
                PricePerUnit = ingredient.PricePerUnit,
                Supplier = ingredient.Supplier,
                IsActive = ingredient.IsActive,
                IsLowStock = ingredient.Quantity <= ingredient.MinQuantity,
                CreatedAt = ingredient.CreatedAt,
                UpdatedAt = ingredient.UpdatedAt
            };

            return Ok(response);
        }

        /// <summary>
        /// Xóa nguyên liệu
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIngredient(int id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);

            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            _context.Ingredients.Remove(ingredient);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa nguyên liệu thành công" });
        }

        /// <summary>
        /// Bật/tắt trạng thái nguyên liệu
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<ActionResult<IngredientResponseDto>> ToggleStatus(int id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);

            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            ingredient.IsActive = !ingredient.IsActive;
            ingredient.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            var response = new IngredientResponseDto
            {
                Id = ingredient.Id,
                Name = ingredient.Name,
                Description = ingredient.Description,
                Unit = ingredient.Unit,
                Quantity = ingredient.Quantity,
                MinQuantity = ingredient.MinQuantity,
                PricePerUnit = ingredient.PricePerUnit,
                Supplier = ingredient.Supplier,
                IsActive = ingredient.IsActive,
                IsLowStock = ingredient.Quantity <= ingredient.MinQuantity,
                CreatedAt = ingredient.CreatedAt,
                UpdatedAt = ingredient.UpdatedAt
            };

            return Ok(response);
        }

        /// <summary>
        /// Cập nhật số lượng nguyên liệu (nhập/xuất kho)
        /// </summary>
        [HttpPatch("{id}/update-quantity")]
        public async Task<ActionResult<IngredientResponseDto>> UpdateQuantity(int id, [FromBody] decimal quantityChange)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);

            if (ingredient == null)
            {
                return NotFound(new { message = "Không tìm thấy nguyên liệu" });
            }

            ingredient.Quantity += quantityChange;

            if (ingredient.Quantity < 0)
            {
                return BadRequest(new { message = "Số lượng nguyên liệu không thể âm" });
            }

            ingredient.UpdatedAt = DateTimeHelper.VietnamNow;
            await _context.SaveChangesAsync();

            var response = new IngredientResponseDto
            {
                Id = ingredient.Id,
                Name = ingredient.Name,
                Description = ingredient.Description,
                Unit = ingredient.Unit,
                Quantity = ingredient.Quantity,
                MinQuantity = ingredient.MinQuantity,
                PricePerUnit = ingredient.PricePerUnit,
                Supplier = ingredient.Supplier,
                IsActive = ingredient.IsActive,
                IsLowStock = ingredient.Quantity <= ingredient.MinQuantity,
                CreatedAt = ingredient.CreatedAt,
                UpdatedAt = ingredient.UpdatedAt
            };

            return Ok(response);
        }
    }
}

