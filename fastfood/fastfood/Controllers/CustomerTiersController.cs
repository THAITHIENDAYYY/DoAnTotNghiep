using fastfood.Data;
using fastfood.Shared.DTOs;
using fastfood.Shared.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace fastfood.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomerTiersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CustomerTiersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CustomerTierDto>>> GetTiers()
        {
            var tiers = await _context.CustomerTiers
                .OrderByDescending(t => t.MinimumSpent)
                .ThenBy(t => t.DisplayOrder)
                .Select(t => new CustomerTierDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    MinimumSpent = t.MinimumSpent,
                    Description = t.Description,
                    ColorHex = t.ColorHex,
                    DisplayOrder = t.DisplayOrder
                })
                .ToListAsync();

            return Ok(tiers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CustomerTierDto>> GetTier(int id)
        {
            var tier = await _context.CustomerTiers.FindAsync(id);
            if (tier == null)
            {
                return NotFound(new { message = "Không tìm thấy hạng khách hàng" });
            }

            return Ok(MapToDto(tier));
        }

        [HttpPost]
        public async Task<ActionResult<CustomerTierDto>> CreateTier(CreateCustomerTierDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var normalizedName = dto.Name.Trim();
            var existingTier = await _context.CustomerTiers
                .FirstOrDefaultAsync(t => t.Name.ToLower() == normalizedName.ToLower());

            if (existingTier != null)
            {
                return Conflict(new { message = "Tên hạng khách hàng đã tồn tại" });
            }

            var tier = new CustomerTier
            {
                Name = normalizedName,
                MinimumSpent = dto.MinimumSpent,
                Description = dto.Description,
                ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#FF6B35" : dto.ColorHex,
                DisplayOrder = dto.DisplayOrder
            };

            _context.CustomerTiers.Add(tier);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTier), new { id = tier.Id }, MapToDto(tier));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTier(int id, UpdateCustomerTierDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var tier = await _context.CustomerTiers.FindAsync(id);
            if (tier == null)
            {
                return NotFound(new { message = "Không tìm thấy hạng khách hàng" });
            }

            var normalizedName = dto.Name.Trim();
            var duplicate = await _context.CustomerTiers
                .FirstOrDefaultAsync(t => t.Name.ToLower() == normalizedName.ToLower() && t.Id != id);

            if (duplicate != null)
            {
                return Conflict(new { message = "Tên hạng khách hàng đã tồn tại" });
            }

            tier.Name = normalizedName;
            tier.MinimumSpent = dto.MinimumSpent;
            tier.Description = dto.Description;
            tier.ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#FF6B35" : dto.ColorHex;
            tier.DisplayOrder = dto.DisplayOrder;

            await _context.SaveChangesAsync();

            return Ok(MapToDto(tier));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTier(int id)
        {
            var tier = await _context.CustomerTiers.FindAsync(id);
            if (tier == null)
            {
                return NotFound(new { message = "Không tìm thấy hạng khách hàng" });
            }

            _context.CustomerTiers.Remove(tier);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static CustomerTierDto MapToDto(CustomerTier tier)
        {
            return new CustomerTierDto
            {
                Id = tier.Id,
                Name = tier.Name,
                MinimumSpent = tier.MinimumSpent,
                Description = tier.Description,
                ColorHex = tier.ColorHex,
                DisplayOrder = tier.DisplayOrder
            };
        }
    }
}

