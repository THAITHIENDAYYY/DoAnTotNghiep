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
    public class TablesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TablesController(ApplicationDbContext context)
        {
            _context = context;
        }

        #region TableArea CRUD

        /// <summary>
        /// Lấy danh sách tất cả khu vực
        /// </summary>
        [HttpGet("areas")]
        public async Task<ActionResult<IEnumerable<TableAreaListResponseDto>>> GetTableAreas()
        {
            var areas = await _context.TableAreas
                .Include(ta => ta.Tables)
                .OrderBy(ta => ta.DisplayOrder)
                .ThenBy(ta => ta.Name)
                .Select(ta => new TableAreaListResponseDto
                {
                    Id = ta.Id,
                    Name = ta.Name,
                    Description = ta.Description,
                    DisplayOrder = ta.DisplayOrder,
                    IsActive = ta.IsActive,
                    TableCount = ta.Tables.Count
                })
                .ToListAsync();

            return Ok(areas);
        }

        /// <summary>
        /// Lấy danh sách khu vực đang hoạt động
        /// </summary>
        [HttpGet("areas/active")]
        public async Task<ActionResult<IEnumerable<TableAreaListResponseDto>>> GetActiveTableAreas()
        {
            var areas = await _context.TableAreas
                .Where(ta => ta.IsActive)
                .Include(ta => ta.Tables)
                .OrderBy(ta => ta.DisplayOrder)
                .ThenBy(ta => ta.Name)
                .Select(ta => new TableAreaListResponseDto
                {
                    Id = ta.Id,
                    Name = ta.Name,
                    Description = ta.Description,
                    DisplayOrder = ta.DisplayOrder,
                    IsActive = ta.IsActive,
                    TableCount = ta.Tables.Count
                })
                .ToListAsync();

            return Ok(areas);
        }

        /// <summary>
        /// Lấy chi tiết khu vực theo ID
        /// </summary>
        [HttpGet("areas/{id}")]
        public async Task<ActionResult<TableAreaResponseDto>> GetTableArea(int id)
        {
            var area = await _context.TableAreas
                .Include(ta => ta.Tables)
                .Where(ta => ta.Id == id)
                .Select(ta => new TableAreaResponseDto
                {
                    Id = ta.Id,
                    Name = ta.Name,
                    Description = ta.Description,
                    DisplayOrder = ta.DisplayOrder,
                    IsActive = ta.IsActive,
                    CreatedAt = ta.CreatedAt,
                    UpdatedAt = ta.UpdatedAt,
                    TableCount = ta.Tables.Count
                })
                .FirstOrDefaultAsync();

            if (area == null)
            {
                return NotFound(new { message = "Không tìm thấy khu vực" });
            }

            return Ok(area);
        }

        /// <summary>
        /// Tạo khu vực mới
        /// </summary>
        [HttpPost("areas")]
        public async Task<ActionResult<TableAreaResponseDto>> CreateTableArea(CreateTableAreaDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra tên khu vực đã tồn tại chưa
            var existingArea = await _context.TableAreas
                .FirstOrDefaultAsync(ta => ta.Name.ToLower() == createDto.Name.ToLower());

            if (existingArea != null)
            {
                return Conflict(new { message = "Tên khu vực đã tồn tại" });
            }

            var area = new TableArea
            {
                Name = createDto.Name,
                Description = createDto.Description,
                DisplayOrder = createDto.DisplayOrder,
                IsActive = createDto.IsActive,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.TableAreas.Add(area);
            await _context.SaveChangesAsync();

            var response = new TableAreaResponseDto
            {
                Id = area.Id,
                Name = area.Name,
                Description = area.Description,
                DisplayOrder = area.DisplayOrder,
                IsActive = area.IsActive,
                CreatedAt = area.CreatedAt,
                UpdatedAt = area.UpdatedAt,
                TableCount = 0
            };

            return CreatedAtAction(nameof(GetTableArea), new { id = area.Id }, response);
        }

        /// <summary>
        /// Cập nhật khu vực
        /// </summary>
        [HttpPut("areas/{id}")]
        public async Task<IActionResult> UpdateTableArea(int id, UpdateTableAreaDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var area = await _context.TableAreas.FindAsync(id);
            if (area == null)
            {
                return NotFound(new { message = "Không tìm thấy khu vực" });
            }

            // Kiểm tra tên đã tồn tại (trừ khu vực hiện tại)
            var existingArea = await _context.TableAreas
                .FirstOrDefaultAsync(ta => ta.Name.ToLower() == updateDto.Name.ToLower() && ta.Id != id);

            if (existingArea != null)
            {
                return Conflict(new { message = "Tên khu vực đã tồn tại" });
            }

            area.Name = updateDto.Name;
            area.Description = updateDto.Description;
            area.DisplayOrder = updateDto.DisplayOrder;
            area.IsActive = updateDto.IsActive;
            area.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TableAreaExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy khu vực" });
                }
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa khu vực
        /// </summary>
        [HttpDelete("areas/{id}")]
        public async Task<IActionResult> DeleteTableArea(int id)
        {
            var area = await _context.TableAreas
                .Include(ta => ta.Tables)
                .FirstOrDefaultAsync(ta => ta.Id == id);

            if (area == null)
            {
                return NotFound(new { message = "Không tìm thấy khu vực" });
            }

            // Kiểm tra xem còn bàn nào trong khu vực này không
            if (area.Tables.Any())
            {
                return BadRequest(new { message = $"Không thể xóa khu vực có {area.Tables.Count} bàn. Vui lòng xóa hoặc chuyển bàn sang khu vực khác trước." });
            }

            _context.TableAreas.Remove(area);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        #endregion

        #region Table CRUD

        /// <summary>
        /// Lấy danh sách tất cả bàn
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TableListResponseDto>>> GetTables()
        {
            var tables = await _context.Tables
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                .Select(t => new TableListResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    IsActive = t.IsActive,
                    ActiveOrdersCount = t.Orders.Count(o => 
                        o.Status != OrderStatus.Delivered && 
                        o.Status != OrderStatus.Cancelled)
                })
                .ToListAsync();

            return Ok(tables);
        }

        /// <summary>
        /// Lấy danh sách bàn đang hoạt động
        /// </summary>
        [HttpGet("active")]
        public async Task<ActionResult<IEnumerable<TableListResponseDto>>> GetActiveTables()
        {
            var tables = await _context.Tables
                .Where(t => t.IsActive)
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                .Select(t => new TableListResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    IsActive = t.IsActive,
                    ActiveOrdersCount = t.Orders.Count(o => 
                        o.Status != OrderStatus.Delivered && 
                        o.Status != OrderStatus.Cancelled)
                })
                .ToListAsync();

            return Ok(tables);
        }

        /// <summary>
        /// Lấy danh sách bàn trống (Available)
        /// </summary>
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<TableListResponseDto>>> GetAvailableTables()
        {
            var tables = await _context.Tables
                .Where(t => t.IsActive && t.Status == TableStatus.Available)
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                .Select(t => new TableListResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    IsActive = t.IsActive,
                    ActiveOrdersCount = 0
                })
                .ToListAsync();

            return Ok(tables);
        }

        /// <summary>
        /// Lấy danh sách bàn theo khu vực
        /// </summary>
        [HttpGet("by-area/{areaId}")]
        public async Task<ActionResult<IEnumerable<TableListResponseDto>>> GetTablesByArea(int areaId)
        {
            var areaExists = await _context.TableAreas.AnyAsync(ta => ta.Id == areaId);
            if (!areaExists)
            {
                return BadRequest(new { message = "Khu vực không tồn tại" });
            }

            var tables = await _context.Tables
                .Where(t => t.TableAreaId == areaId && t.IsActive)
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                    .ThenInclude(o => o.Payments)
                .ToListAsync();

            // Tự động cập nhật status bàn dựa trên đơn hàng
            bool hasChanges = false;
            foreach (var table in tables)
            {
                // Kiểm tra xem có đơn hàng chưa thanh toán không
                var activeOrders = table.Orders.Where(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed)
                ).ToList();

                // Nếu có đơn hàng chưa thanh toán và bàn đang Available, cập nhật thành Occupied
                if (activeOrders.Any() && table.Status == TableStatus.Available)
                {
                    table.Status = TableStatus.Occupied;
                    table.UpdatedAt = DateTimeHelper.VietnamNow;
                    hasChanges = true;
                }
            }

            // Lưu các thay đổi status nếu có
            if (hasChanges)
            {
                await _context.SaveChangesAsync();
            }

            // Trả về kết quả
            var result = tables.Select(t => {
                var activeOrders = t.Orders.Where(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed)
                ).ToList();

                return new TableListResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    IsActive = t.IsActive,
                    ActiveOrdersCount = activeOrders.Count
                };
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Lấy thông tin chi tiết bàn theo ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<TableResponseDto>> GetTable(int id)
        {
            var table = await _context.Tables
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                .Where(t => t.Id == id)
                .Select(t => new TableResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    QRCode = t.QRCode,
                    IsActive = t.IsActive,
                    Notes = t.Notes,
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    ActiveOrdersCount = t.Orders.Count(o => 
                        o.Status != OrderStatus.Delivered && 
                        o.Status != OrderStatus.Cancelled)
                })
                .FirstOrDefaultAsync();

            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn" });
            }

            return Ok(table);
        }

        /// <summary>
        /// Tạo bàn mới
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<TableResponseDto>> CreateTable(CreateTableDto createTableDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra số bàn đã tồn tại chưa
            var existingTable = await _context.Tables
                .FirstOrDefaultAsync(t => t.TableNumber.ToLower() == createTableDto.TableNumber.ToLower());

            if (existingTable != null)
            {
                return Conflict(new { message = "Số bàn đã tồn tại" });
            }

            // Kiểm tra khu vực có tồn tại không
            var areaExists = await _context.TableAreas.AnyAsync(ta => ta.Id == createTableDto.TableAreaId);
            if (!areaExists)
            {
                return BadRequest(new { message = "Khu vực không tồn tại" });
            }

            var table = new Table
            {
                TableNumber = createTableDto.TableNumber,
                Capacity = createTableDto.Capacity,
                Status = createTableDto.Status,
                TableAreaId = createTableDto.TableAreaId,
                Location = createTableDto.Location,
                QRCode = createTableDto.QRCode,
                IsActive = createTableDto.IsActive,
                Notes = createTableDto.Notes,
                CreatedAt = DateTimeHelper.VietnamNow
            };

            _context.Tables.Add(table);
            await _context.SaveChangesAsync();

            // Load TableArea để lấy tên
            await _context.Entry(table).Reference(t => t.TableArea).LoadAsync();

            var response = new TableResponseDto
            {
                Id = table.Id,
                TableNumber = table.TableNumber,
                Capacity = table.Capacity,
                Status = (int)table.Status,
                StatusName = GetStatusName(table.Status),
                TableAreaId = table.TableAreaId,
                TableAreaName = table.TableArea.Name,
                Location = table.Location,
                QRCode = table.QRCode,
                IsActive = table.IsActive,
                Notes = table.Notes,
                CreatedAt = table.CreatedAt,
                UpdatedAt = table.UpdatedAt,
                ActiveOrdersCount = 0
            };

            return CreatedAtAction(nameof(GetTable), new { id = table.Id }, response);
        }

        /// <summary>
        /// Cập nhật thông tin bàn
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTable(int id, UpdateTableDto updateTableDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var table = await _context.Tables.FindAsync(id);
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn" });
            }

            // Kiểm tra số bàn đã tồn tại chưa (trừ bàn hiện tại)
            var existingTable = await _context.Tables
                .FirstOrDefaultAsync(t => t.TableNumber.ToLower() == updateTableDto.TableNumber.ToLower() && t.Id != id);

            if (existingTable != null)
            {
                return Conflict(new { message = "Số bàn đã tồn tại" });
            }

            // Kiểm tra khu vực có tồn tại không
            var areaExists = await _context.TableAreas.AnyAsync(ta => ta.Id == updateTableDto.TableAreaId);
            if (!areaExists)
            {
                return BadRequest(new { message = "Khu vực không tồn tại" });
            }

            table.TableNumber = updateTableDto.TableNumber;
            table.Capacity = updateTableDto.Capacity;
            table.Status = updateTableDto.Status;
            table.TableAreaId = updateTableDto.TableAreaId;
            table.Location = updateTableDto.Location;
            table.QRCode = updateTableDto.QRCode;
            table.IsActive = updateTableDto.IsActive;
            table.Notes = updateTableDto.Notes;
            table.UpdatedAt = DateTimeHelper.VietnamNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TableExists(id))
                {
                    return NotFound(new { message = "Không tìm thấy bàn" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Xóa bàn
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTable(int id)
        {
            var table = await _context.Tables
                .Include(t => t.Orders)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn" });
            }

            // Kiểm tra xem bàn có đơn hàng đang hoạt động không
            var hasActiveOrders = table.Orders.Any(o => 
                o.Status != OrderStatus.Delivered && 
                o.Status != OrderStatus.Cancelled);

            if (hasActiveOrders)
            {
                return BadRequest(new { message = "Không thể xóa bàn đang có đơn hàng hoạt động" });
            }

            _context.Tables.Remove(table);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Cập nhật trạng thái bàn
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTableStatus(int id, [FromBody] int status)
        {
            if (!Enum.IsDefined(typeof(TableStatus), status))
            {
                return BadRequest(new { message = "Trạng thái không hợp lệ" });
            }

            var table = await _context.Tables
                .Include(t => t.Orders)
                    .ThenInclude(o => o.Payments)
                .FirstOrDefaultAsync(t => t.Id == id);
            
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn" });
            }

            var newStatus = (TableStatus)status;

            // Nếu đang đóng bàn (chuyển về Available), tự động chuyển các đơn hàng chưa hoàn thành sang Delivered
            if (newStatus == TableStatus.Available)
            {
                var activeOrders = table.Orders.Where(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled).ToList();
                
                // Tự động chuyển tất cả đơn hàng đang hoạt động sang Delivered
                foreach (var order in activeOrders)
                {
                    order.Status = OrderStatus.Delivered;
                    order.DeliveredAt = DateTimeHelper.VietnamNow;
                }
            }

            table.Status = newStatus;
            table.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            Console.WriteLine($"✅ Table {table.TableNumber} (ID: {table.Id}) status updated to {GetStatusName(newStatus)}");

            return Ok(new
            {
                message = $"Trạng thái bàn đã được cập nhật thành {GetStatusName(newStatus)}",
                status = status,
                statusName = GetStatusName(newStatus)
            });
        }

        /// <summary>
        /// Vô hiệu hóa/kích hoạt bàn
        /// </summary>
        [HttpPatch("{id}/toggle-active")]
        public async Task<IActionResult> ToggleTableActive(int id)
        {
            var table = await _context.Tables.FindAsync(id);
            if (table == null)
            {
                return NotFound(new { message = "Không tìm thấy bàn" });
            }

            table.IsActive = !table.IsActive;
            table.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = table.IsActive ? "Bàn đã được kích hoạt" : "Bàn đã được vô hiệu hóa",
                isActive = table.IsActive
            });
        }

        /// <summary>
        /// Tìm kiếm bàn
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<TableListResponseDto>>> SearchTables([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetTables();
            }

            var tables = await _context.Tables
                .Include(t => t.TableArea)
                .Include(t => t.Orders)
                .Where(t =>
                    t.TableNumber.ToLower().Contains(query.ToLower()) ||
                    (t.Location != null && t.Location.ToLower().Contains(query.ToLower())) ||
                    (t.Notes != null && t.Notes.ToLower().Contains(query.ToLower())) ||
                    t.TableArea.Name.ToLower().Contains(query.ToLower()))
                .Select(t => new TableListResponseDto
                {
                    Id = t.Id,
                    TableNumber = t.TableNumber,
                    Capacity = t.Capacity,
                    Status = (int)t.Status,
                    StatusName = GetStatusName(t.Status),
                    TableAreaId = t.TableAreaId,
                    TableAreaName = t.TableArea.Name,
                    Location = t.Location,
                    IsActive = t.IsActive,
                    ActiveOrdersCount = t.Orders.Count(o => 
                        o.Status != OrderStatus.Delivered && 
                        o.Status != OrderStatus.Cancelled)
                })
                .ToListAsync();

            return Ok(tables);
        }

        #endregion

        #region TableGroup Management

        /// <summary>
        /// Lấy danh sách tất cả nhóm bàn đang hoạt động
        /// </summary>
        [HttpGet("groups")]
        public async Task<ActionResult<IEnumerable<TableGroupListResponseDto>>> GetTableGroups()
        {
            var tableGroups = await _context.TableGroups
                .Where(tg => tg.Status == TableGroupStatus.Active)
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                        .ThenInclude(t => t.TableArea)
                .Include(tg => tg.Orders)
                    .ThenInclude(o => o.Payments)
                .OrderByDescending(tg => tg.CreatedAt)
                .ToListAsync();

            var result = tableGroups.Select(tg => new TableGroupListResponseDto
            {
                Id = tg.Id,
                Name = tg.Name,
                Status = (int)tg.Status,
                StatusName = tg.Status == TableGroupStatus.Active ? "Đang hoạt động" : "Đã hủy",
                TableCount = tg.TableGroupTables.Count,
                TotalCapacity = tg.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = tg.TableGroupTables.Select(tgt => tgt.Table.TableNumber).ToList(),
                ActiveOrdersCount = tg.Orders.Count(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
            }).ToList();

            return Ok(result);
        }

        /// <summary>
        /// Lấy chi tiết nhóm bàn theo ID
        /// </summary>
        [HttpGet("groups/{id}")]
        public async Task<ActionResult<TableGroupResponseDto>> GetTableGroup(int id)
        {
            var group = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                        .ThenInclude(t => t.TableArea)
                .FirstOrDefaultAsync(tg => tg.Id == id);

            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            var response = new TableGroupResponseDto
            {
                Id = group.Id,
                Name = group.Name,
                Status = (int)group.Status,
                StatusName = group.Status == TableGroupStatus.Active ? "Đang hoạt động" : "Đã hủy",
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
        /// Ghép các bàn lại thành một nhóm
        /// </summary>
        [HttpPost("groups")]
        public async Task<ActionResult<TableGroupResponseDto>> CreateTableGroup(CreateTableGroupDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Kiểm tra số lượng bàn
            if (createDto.TableIds == null || createDto.TableIds.Count < 2)
            {
                return BadRequest(new { message = "Phải chọn ít nhất 2 bàn để ghép" });
            }

            // Kiểm tra các bàn có tồn tại và đang trống không
            var tables = await _context.Tables
                .Where(t => createDto.TableIds.Contains(t.Id))
                .ToListAsync();

            if (tables.Count != createDto.TableIds.Count)
            {
                return BadRequest(new { message = "Một hoặc nhiều bàn không tồn tại" });
            }

            // Kiểm tra các bàn có đang trống và không thuộc nhóm bàn nào khác không
            foreach (var table in tables)
            {
                if (table.Status != TableStatus.Available)
                {
                    return BadRequest(new { message = $"Bàn {table.TableNumber} không trống" });
                }

                // Kiểm tra bàn có đang thuộc nhóm bàn active nào không
                var existingGroup = await _context.TableGroupTables
                    .Include(tgt => tgt.TableGroup)
                    .Where(tgt => tgt.TableId == table.Id && tgt.TableGroup.Status == TableGroupStatus.Active)
                    .FirstOrDefaultAsync();

                if (existingGroup != null)
                {
                    return BadRequest(new { message = $"Bàn {table.TableNumber} đã thuộc nhóm bàn khác" });
                }
            }

            // Tạo nhóm bàn mới
            var tableGroup = new TableGroup
            {
                Name = createDto.Name,
                Status = TableGroupStatus.Active,
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

            // Load lại để trả về response
            var savedGroup = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                        .ThenInclude(t => t.TableArea)
                .FirstOrDefaultAsync(tg => tg.Id == tableGroup.Id);

            if (savedGroup == null)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo nhóm bàn" });
            }

            var response = new TableGroupResponseDto
            {
                Id = savedGroup.Id,
                Name = savedGroup.Name,
                Status = (int)savedGroup.Status,
                StatusName = "Đang hoạt động",
                CreatedAt = savedGroup.CreatedAt,
                UpdatedAt = savedGroup.UpdatedAt,
                DissolvedAt = savedGroup.DissolvedAt,
                TableCount = savedGroup.TableGroupTables.Count,
                TotalCapacity = savedGroup.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = savedGroup.TableGroupTables
                    .OrderBy(tgt => tgt.Table.TableNumber)
                    .Select(tgt => tgt.Table.TableNumber)
                    .ToList(),
                TableIds = savedGroup.TableGroupTables
                    .Select(tgt => tgt.TableId)
                    .ToList(),
                ActiveOrdersCount = 0
            };

            return CreatedAtAction(nameof(GetTableGroup), new { id = tableGroup.Id }, response);
        }

        /// <summary>
        /// Cập nhật tên nhóm bàn
        /// </summary>
        [HttpPut("groups/{id}")]
        public async Task<ActionResult<TableGroupResponseDto>> UpdateTableGroup(int id, UpdateTableGroupDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var group = await _context.TableGroups.FindAsync(id);
            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            if (group.Status != TableGroupStatus.Active)
            {
                return BadRequest(new { message = "Nhóm bàn đã bị hủy, không thể cập nhật" });
            }

            group.Name = updateDto.Name;
            group.UpdatedAt = DateTimeHelper.VietnamNow;

            await _context.SaveChangesAsync();

            // Load lại để trả về response
            var updatedGroup = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                        .ThenInclude(t => t.TableArea)
                .FirstOrDefaultAsync(tg => tg.Id == id);

            if (updatedGroup == null)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật nhóm bàn" });
            }

            var response = new TableGroupResponseDto
            {
                Id = updatedGroup.Id,
                Name = updatedGroup.Name,
                Status = (int)updatedGroup.Status,
                StatusName = "Đang hoạt động",
                CreatedAt = updatedGroup.CreatedAt,
                UpdatedAt = updatedGroup.UpdatedAt,
                DissolvedAt = updatedGroup.DissolvedAt,
                TableCount = updatedGroup.TableGroupTables.Count,
                TotalCapacity = updatedGroup.TableGroupTables.Sum(tgt => tgt.Table.Capacity),
                TableNumbers = updatedGroup.TableGroupTables
                    .OrderBy(tgt => tgt.Table.TableNumber)
                    .Select(tgt => tgt.Table.TableNumber)
                    .ToList(),
                TableIds = updatedGroup.TableGroupTables
                    .Select(tgt => tgt.TableId)
                    .ToList(),
                ActiveOrdersCount = updatedGroup.Orders.Count(o => 
                    o.Status != OrderStatus.Delivered && 
                    o.Status != OrderStatus.Cancelled &&
                    !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
            };

            return Ok(response);
        }

        /// <summary>
        /// Hủy ghép nhóm bàn (trả các bàn về trạng thái trống)
        /// </summary>
        [HttpDelete("groups/{id}")]
        public async Task<IActionResult> DissolveTableGroup(int id)
        {
            var group = await _context.TableGroups
                .Include(tg => tg.TableGroupTables)
                    .ThenInclude(tgt => tgt.Table)
                .FirstOrDefaultAsync(tg => tg.Id == id);

            if (group == null)
            {
                return NotFound(new { message = "Không tìm thấy nhóm bàn" });
            }

            if (group.Status == TableGroupStatus.Dissolved)
            {
                return BadRequest(new { message = "Nhóm bàn đã được hủy trước đó" });
            }

            // Kiểm tra xem có đơn hàng đang hoạt động không
            var activeOrders = await _context.Orders
                .Where(o => o.TableGroupId == id && 
                           o.Status != OrderStatus.Delivered && 
                           o.Status != OrderStatus.Cancelled &&
                           !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
                .CountAsync();

            if (activeOrders > 0)
            {
                return BadRequest(new { message = "Không thể hủy nhóm bàn vì còn đơn hàng chưa thanh toán" });
            }

            // Cập nhật trạng thái nhóm bàn
            group.Status = TableGroupStatus.Dissolved;
            group.DissolvedAt = DateTimeHelper.VietnamNow;
            group.UpdatedAt = DateTimeHelper.VietnamNow;

            // Trả các bàn về trạng thái Available
            foreach (var tableGroupTable in group.TableGroupTables)
            {
                var table = tableGroupTable.Table;
                // Chỉ cập nhật nếu bàn không có đơn hàng đang hoạt động
                var tableActiveOrders = await _context.Orders
                    .Where(o => o.TableId == table.Id && 
                               o.Status != OrderStatus.Delivered && 
                               o.Status != OrderStatus.Cancelled &&
                               !o.Payments.Any(p => p.Status == PaymentStatus.Completed))
                    .CountAsync();

                if (tableActiveOrders == 0)
                {
                    table.Status = TableStatus.Available;
                    table.UpdatedAt = DateTimeHelper.VietnamNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã hủy ghép nhóm bàn thành công" });
        }

        #endregion

        #region Helper Methods

        private bool TableExists(int id)
        {
            return _context.Tables.Any(e => e.Id == id);
        }

        private bool TableAreaExists(int id)
        {
            return _context.TableAreas.Any(e => e.Id == id);
        }

        private static string GetStatusName(TableStatus status)
        {
            return status switch
            {
                TableStatus.Available => "Trống",
                TableStatus.Occupied => "Có khách",
                TableStatus.Reserved => "Đã đặt",
                TableStatus.Cleaning => "Đang dọn",
                TableStatus.Maintenance => "Bảo trì",
                _ => "Không xác định"
            };
        }

        #endregion
    }
}
