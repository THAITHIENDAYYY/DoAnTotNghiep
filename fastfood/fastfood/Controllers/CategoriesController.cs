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
    public class CategoriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả danh mục
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryListResponseDto>>> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new CategoryListResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    IsActive = c.IsActive,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        /// <summary>
        /// Lấy danh sách danh mục đang hoạt động
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<CategoryListResponseDto>>> GetActiveCategories()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .Select(c => new CategoryListResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    IsActive = c.IsActive,
                    ProductCount = c.Products.Count
                })
                .ToListAsync();

            return Ok(categories);
        }

        /// <summary>
        /// Lấy thông tin chi tiết danh mục theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryResponseDto>> GetCategory(int id)
        {
            var category = await _context.Categories
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    ProductCount = c.Products.Count
                })
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            return Ok(category);
        }

        /// <summary>
        /// Tạo danh mục mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<CategoryResponseDto>> CreateCategory(CreateCategoryDto createCategoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra tên danh mục đã tồn tại chưa
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == createCategoryDto.Name.ToLower());

            if (existingCategory != null)
            {
                return Conflict(new { message = "Tên danh mục đã tồn tại" });
            }

            var category = new Category
            {
                Name = createCategoryDto.Name,
                Description = createCategoryDto.Description,
                ImageUrl = createCategoryDto.ImageUrl,
                IsActive = true,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var response = new CategoryResponseDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ImageUrl = category.ImageUrl,
                IsActive = category.IsActive,
                CreatedAt = category.CreatedAt,
                UpdatedAt = category.UpdatedAt,
                ProductCount = 0
            };

            return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin danh mục
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDto updateCategoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            // Kiểm tra tên danh mục đã tồn tại chưa (trừ danh mục hiện tại)
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == updateCategoryDto.Name.ToLower() && c.Id != id);

            if (existingCategory != null)
            {
                return Conflict(new { message = "Tên danh mục đã tồn tại" });
            }

            category.Name = updateCategoryDto.Name;
            category.Description = updateCategoryDto.Description;
            category.ImageUrl = updateCategoryDto.ImageUrl;
            category.IsActive = updateCategoryDto.IsActive;
            category.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy danh mục" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa danh mục (soft delete)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            // Kiểm tra xem danh mục có sản phẩm nào không
            var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
            if (hasProducts)
            {
                return BadRequest(new { message = "Không thể xóa danh mục có sản phẩm. Vui lòng xóa hoặc chuyển sản phẩm trước." });
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt danh mục
        /// </summary>
        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleCategoryStatus(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Không tìm thấy danh mục" });
            }

            category.IsActive = !category.IsActive;
            category.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new { 
                message = category.IsActive ? "Danh mục đã được kích hoạt" : "Danh mục đã được vô hiệu hóa",
                isActive = category.IsActive 
            });
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.Id == id);
        }
    }
}
