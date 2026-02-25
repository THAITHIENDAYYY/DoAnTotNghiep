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
    public class TableGroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TableGroupsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả nhóm bàn đang hoạt động
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TableGroupListResponseDto>>> GetTableGroups()
        {
            var groups = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                .Include(tg => tg.Orders)
                    .ThenInclude(o => o.Payments)
                .Where(tg => tg.DissolvedAt == null) // Chỉ lấy nhóm chưa bị hủy
                .OrderByDescending(tg => tg.CreatedAt)
                .ToListAsync();

            var result = groups.Select(tg => new TableGroupListResponseDto
            {
                Id = tg.Id,
                Name = tg.Name,
                Status = (int)tg.Status,
                StatusName = GetGroupStatusName(tg.Status),
                TableCount = tg.TableGroupTables.Count,
                TotalCapacity = tg.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = tg.TableGroupTables
                    .OrderBy(tgt => tgt.Table.TableNumber)
                    .Select(tgt => tgt.Table.TableNumber)
                    .ToList(),
                ActiveOrdersCount = tg.Orders.Count(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin chi tiết nhóm bàn theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<TableGroupResponseDto>> GetTableGroup(int id)
        {
            var group = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                .Include(tg => tg.Orders)
                    .ThenInclude(o => o.Payments)
                .FirstOrDefaultAsync(tg => tg.Id == id && tg.DissolvedAt == null);

            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            var response = new TableGroupResponseDto
            {
                Id = group.Id,
                Name = group.Name,
                Status = (int)group.Status,
                StatusName = GetGroupStatusName(group.Status),
                CreatedAt = group.CreatedAt,
                UpdatedAt = group.UpdatedAt,
                DissolvedAt = group.DissolvedAt,
                TableCount = group.TableGroupTables.Count,
                TotalCapacity = group.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = group.TableGroupTables
                    .OrderBy(tgt => tgt.Table.TableNumber)
                    .Select(tgt => tgt.Table.TableNumber)
                    .ToList(),
                TableIds = group.TableGroupTables
                    .Select(tgt => tgt.TableId)
                    .ToList(),
                ActiveOrdersCount = group.Orders.Count(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
            };

            return Ok(response);
        }

        /// <summary>
        /// Tạo nhóm bàn mới (ghép bàn)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TableGroupResponseDto>> CreateTableGroup(CreateTableGroupDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra các bàn có tồn tại không
            var tables = await _context.Tables
                .Where(t => createDto.TableIds.Contains(t.Id))
                .ToListAsync();

            if (tables.Count != createDto.TableIds.Count)
            {
                return BadRequest(new { message = "Một hoặc nhiều bàn không tồn tại" });
            }

            // Kiểm tra các bàn có đang trống không
            foreach (var table in tables)
            {
                if (table.Status != TableStatus.Available)
                {
                    return BadRequest(new { message = $"Bàn {table.TableNumber} không ở trạng thái trống" });
                }

                // Kiểm tra bàn có đang thuộc nhóm nào khác không
                var existingGroup = await _context.TableGroupTables
                    .Include(tgt => tgt.TableGroup)
                    .FirstOrDefaultAsync(tgt => tgt.TableId == table.Id && tgt.TableGroup.DissolvedAt == null);

                if (existingGroup != null)
                {
                    return BadRequest(new { message = $"Bàn {table.TableNumber} đã thuộc nhóm bàn '{existingGroup.TableGroup.Name}'" });
                }
            }

            // Tạo nhóm bàn
            var tableGroup = new TableGroup
            {
                Name = createDto.Name,
                Status = TableGroupStatus.Active, // Mặc định là Active khi ghép bàn
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.TableGroups.Add(tableGroup);
            await _context.SaveChangesAsync();

            // Thêm các bàn vào nhóm
            foreach (var tableId in createDto.TableIds)
            {
                var tableGroupTable = new TableGroupTable
                {
                    TableGroupId = tableGroup.Id,
                    TableId = tableId,
                    CreatedAt = DateTimeHelper.VietnamNow
                };
                _context.TableGroupTables.Add(tableGroupTable);

                // Cập nhật trạng thái bàn thành Occupied
                var table = tables.First(t => t.Id == tableId);
                table.Status = TableStatus.Occupied;
                table.UpdatedAt = DateTimeHelper.VietnamNow;
            }

            await _context.SaveChangesAsync();

            // Lấy lại thông tin nhóm bàn vừa tạo
            var createdGroup = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                .FirstOrDefaultAsync(tg => tg.Id == tableGroup.Id);

            var response = new TableGroupResponseDto
            {
                Id = createdGroup!.Id,
                Name = createdGroup.Name,
                Status = (int)createdGroup.Status,
                StatusName = GetGroupStatusName(createdGroup.Status),
                CreatedAt = createdGroup.CreatedAt,
                UpdatedAt = createdGroup.UpdatedAt,
                DissolvedAt = createdGroup.DissolvedAt,
                TableCount = createdGroup.TableGroupTables.Count,
                TotalCapacity = createdGroup.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = createdGroup.TableGroupTables
                    .OrderBy(tgt => tgt.Table.TableNumber)
                    .Select(tgt => tgt.Table.TableNumber)
                    .ToList(),
                TableIds = createdGroup.TableGroupTables
                    .Select(tgt => tgt.TableId)
                    .ToList(),
                ActiveOrdersCount = 0
            };

            return CreatedAtAction(nameof(GetTableGroup), new { id = response.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin nhóm bàn (đổi tên)
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTableGroup(int id, UpdateTableGroupDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var group = await _context.TableGroups
                .FirstOrDefaultAsync(tg => tg.Id == id && tg.DissolvedAt == null);

            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            group.Name = updateDto.Name;
            group.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Hủy ghép nhóm bàn (dissolve)
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DissolveTableGroup(int id)
        {
            var group = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                .Include(tg => tg.Orders)
                    .ThenInclude(o => o.Payments)
                .FirstOrDefaultAsync(tg => tg.Id == id && tg.DissolvedAt == null);

            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            // Kiểm tra xem nhóm bàn có đơn hàng chưa thanh toán không
            var hasUnpaidOrders = group.Orders.Any(o => 
                o.Status != OrderStatus.Delivered && 
                o.Status != OrderStatus.Cancelled &&
                !o.Payments.Any(p => p.Status == PaymentStatus.Completed));

            if (hasUnpaidOrders)
            {
                return BadRequest(new { message = "Không thể hủy ghép nhóm bàn có đơn hàng chưa thanh toán" });
            }

            // Đánh dấu nhóm bàn là đã hủy
            group.DissolvedAt = DateTimeHelper.VietnamNow;
            group.UpdatedAt = DateTimeHelper.VietnamNow;

            // Cập nhật trạng thái các bàn về Available
            foreach (var tableGroupTable in group.TableGroupTables)
            {
                tableGroupTable.Table.Status = TableStatus.Available;
                tableGroupTable.Table.UpdatedAt = DateTimeHelper.VietnamNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string GetGroupStatusName(TableGroupStatus status)
        {
            return status switch
            {
                TableGroupStatus.Active => "Đang hoạt động",
                TableGroupStatus.Dissolved => "Đã hủy ghép",
                _ => "Không xác định"
            };
        }
    }
}

