# 📋 HƯỚNG DẪN MIGRATION - TABLE AREA CRUD

## 🎯 Tổng Quan

Đã chuyển đổi **TableArea từ enum cứng sang database table** với CRUD đầy đủ!

**Trước:** 
```csharp
public enum TableArea {
    Indoor = 1, Outdoor = 2, VIP = 3, 
    FirstFloor = 4, SecondFloor = 5, ThirdFloor = 6
}
```

**Sau:**
```csharp
public class TableArea {
    public int Id { get; set; }
    public string Name { get; set; }  // "Tầng 1", "Sân vườn", "VIP 2", etc.
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    // ... timestamps & navigation
}
```

---

## 📦 CÁC FILE ĐÃ TẠO/CẬP NHẬT

### 1. Models
- ✅ **NEW:** `fastfood/fastfood.Shared/Models/TableArea.cs` - Model mới
- ✅ **UPDATED:** `fastfood/fastfood.Shared/Models/Table.cs` 
  - Xóa `TableArea` enum
  - Thêm `TableAreaId` (int) foreign key
  - Thêm navigation property `TableArea`

### 2. DTOs
**TableArea DTOs (NEW):**
- ✅ `CreateTableAreaDto.cs`
- ✅ `UpdateTableAreaDto.cs`
- ✅ `TableAreaResponseDto.cs`
- ✅ `TableAreaListResponseDto.cs`

**Table DTOs (UPDATED):**
- ✅ `CreateTableDto.cs` - `Area` enum → `TableAreaId` int
- ✅ `UpdateTableDto.cs` - `Area` enum → `TableAreaId` int  
- ✅ `TableResponseDto.cs` - `Area`, `AreaName` → `TableAreaId`, `TableAreaName`
- ✅ `TableListResponseDto.cs` - `Area`, `AreaName` → `TableAreaId`, `TableAreaName`

### 3. Controller
- ✅ **REWRITTEN:** `fastfood/fastfood/Controllers/TablesController.cs`
  - Thêm section mới: **TableArea CRUD**
    - `GET /api/tables/areas` - Lấy tất cả khu vực
    - `GET /api/tables/areas/active` - Lấy khu vực active
    - `GET /api/tables/areas/{id}` - Chi tiết khu vực
    - `POST /api/tables/areas` - Tạo khu vực
    - `PUT /api/tables/areas/{id}` - Sửa khu vực
    - `DELETE /api/tables/areas/{id}` - Xóa khu vực
  - Update toàn bộ Table endpoints để dùng `TableArea` navigation
  - Xóa helper `GetAreaName()` (không cần nữa)

### 4. Database Context
- ✅ **UPDATED:** `fastfood/fastfood/Data/ApplicationDbContext.cs`
  - Thêm `DbSet<TableArea>`
  - Thêm relationship: `TableArea` → `Tables` (One-to-Many)
  - Thêm unique index cho `TableArea.Name`
  - Restrict delete (không xóa khu vực có bàn)

---

## 🚀 HƯỚNG DẪN MIGRATION

### ⚠️ QUAN TRỌNG: Dừng Backend Trước!

```powershell
# Tìm terminal đang chạy backend và bấm Ctrl+C
# HOẶC đóng terminal đó
```

### Bước 1: Tạo Migration

```powershell
cd fastfood\fastfood
dotnet ef migrations add ConvertTableAreaToTable
```

**Migration này sẽ:**
- ✅ Tạo bảng `TableAreas` mới
- ✅ Thêm column `TableAreaId` vào bảng `Tables`
- ✅ Migrate dữ liệu cũ từ enum sang table mới
- ✅ Xóa column `Area` (enum cũ) khỏi `Tables`
- ✅ Tạo foreign key constraint
- ✅ Tạo unique index cho `TableArea.Name`

### Bước 2: Seed Dữ Liệu Mẫu (Quan Trọng!)

**Sau khi tạo migration, BẠN CẦN THÊM DATA SEED** vào migration file để không mất dữ liệu!

Mở file migration vừa tạo và thêm vào method `Up()`:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    // ... (code tạo bảng TableAreas)
    
    // SEED DỮ LIỆU KHU VỰC MẶC ĐỊNH
    migrationBuilder.InsertData(
        table: "TableAreas",
        columns: new[] { "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt" },
        values: new object[,]
        {
            { "Tầng 1", "Khu vực tầng 1", 1, true, DateTime.UtcNow },
            { "Tầng 2", "Khu vực tầng 2", 2, true, DateTime.UtcNow },
            { "Tầng 3", "Khu vực tầng 3", 3, true, DateTime.UtcNow },
            { "VIP", "Khu vực VIP", 4, true, DateTime.UtcNow },
            { "Trong nhà", "Khu vực trong nhà", 5, true, DateTime.UtcNow },
            { "Ngoài trời", "Khu vực ngoài trời / sân vườn", 6, true, DateTime.UtcNow }
        });
    
    // MIGRATE DỮ LIỆU CŨ (nếu có bàn)
    // Giả sử enum cũ: 1=Indoor, 2=Outdoor, 3=VIP, 4=FirstFloor, 5=SecondFloor, 6=ThirdFloor
    migrationBuilder.Sql(@"
        UPDATE Tables 
        SET TableAreaId = CASE Area
            WHEN 1 THEN (SELECT Id FROM TableAreas WHERE Name = 'Trong nhà')
            WHEN 2 THEN (SELECT Id FROM TableAreas WHERE Name = 'Ngoài trời')
            WHEN 3 THEN (SELECT Id FROM TableAreas WHERE Name = 'VIP')
            WHEN 4 THEN (SELECT Id FROM TableAreas WHERE Name = 'Tầng 1')
            WHEN 5 THEN (SELECT Id FROM TableAreas WHERE Name = 'Tầng 2')
            WHEN 6 THEN (SELECT Id FROM TableAreas WHERE Name = 'Tầng 3')
        END
    ");
    
    // Xóa column Area cũ
    migrationBuilder.DropColumn(
        name: "Area",
        table: "Tables");
}
```

### Bước 3: Update Database

```powershell
dotnet ef database update
```

### Bước 4: Khởi Động Lại Backend

```powershell
dotnet run
```

---

## 🧪 TEST API

### Test TableArea CRUD

```http
### 1. Lấy tất cả khu vực
GET http://localhost:5000/api/tables/areas

### 2. Lấy khu vực active
GET http://localhost:5000/api/tables/areas/active

### 3. Tạo khu vực mới
POST http://localhost:5000/api/tables/areas
Content-Type: application/json

{
  "name": "Rooftop",
  "description": "Khu vực sân thượng",
  "displayOrder": 7,
  "isActive": true
}

### 4. Sửa khu vực
PUT http://localhost:5000/api/tables/areas/1
Content-Type: application/json

{
  "name": "Tầng 1 (Lobby)",
  "description": "Khu vực tầng 1 - gần lễ tân",
  "displayOrder": 1,
  "isActive": true
}

### 5. Xóa khu vực (chỉ xóa được nếu không có bàn)
DELETE http://localhost:5000/api/tables/areas/10
```

### Test Table với TableArea

```http
### 1. Tạo bàn với khu vực mới
POST http://localhost:5000/api/tables
Content-Type: application/json

{
  "tableNumber": "RT01",
  "capacity": 6,
  "status": 1,
  "tableAreaId": 7,
  "location": "Rooftop - góc view đẹp",
  "isActive": true
}

### 2. Lấy bàn theo khu vực
GET http://localhost:5000/api/tables/by-area/7
```

---

## 📊 KẾT QUẢ SAU KHI MIGRATION

### Database Structure

**Bảng `TableAreas`:**
```
Id | Name        | Description              | DisplayOrder | IsActive
---|-------------|--------------------------|--------------|----------
1  | Tầng 1      | Khu vực tầng 1          | 1            | true
2  | Tầng 2      | Khu vực tầng 2          | 2            | true
3  | Tầng 3      | Khu vực tầng 3          | 3            | true
4  | VIP         | Khu vực VIP             | 4            | true
5  | Trong nhà   | Khu vực trong nhà       | 5            | true
6  | Ngoài trời  | Sân vườn / outdoor      | 6            | true
```

**Bảng `Tables`:**
```
Id | TableNumber | Capacity | Status | TableAreaId | Location
---|-------------|----------|--------|-------------|----------
1  | B01         | 4        | 1      | 1           | Gần quầy
2  | VIP01       | 8        | 1      | 4           | Phòng riêng
3  | OUT01       | 6        | 1      | 6           | Sân vườn
```

---

## 🎯 LỢI ÍCH CỦA THAY ĐỔI NÀY

### ✅ Trước (Enum Cứng)
- ❌ Chỉ 6 khu vực cố định
- ❌ Không thể thêm/sửa/xóa
- ❌ Tên tiếng Việt hardcode trong code
- ❌ Không linh hoạt cho từng nhà hàng

### ✅ Sau (Database Table)
- ✅ Không giới hạn số lượng khu vực
- ✅ CRUD đầy đủ qua API
- ✅ Mỗi nhà hàng tự quản lý khu vực riêng
- ✅ Có thể sắp xếp thứ tự hiển thị (`DisplayOrder`)
- ✅ Soft delete với `IsActive`
- ✅ Mô tả chi tiết cho từng khu vực
- ✅ Đếm số bàn theo từng khu vực
- ✅ Bảo vệ: không xóa khu vực còn bàn

---

## 🔄 BƯỚC TIẾP THEO

Sau khi migration thành công, bạn cần:

1. **Update Frontend**
   - Update `fe/src/api/tableService.ts`
     - Xóa `TableArea` enum
     - Thêm API calls cho TableArea CRUD
   - Update `fe/src/pages/TableManagementPage.tsx`
     - Fetch TableAreas từ API (thay vì dùng enum)
     - Thêm CRUD UI cho TableArea
     - Dropdown TableArea lấy từ API
   
2. **Test Toàn Bộ Flow**
   - Tạo/Sửa/Xóa khu vực
   - Tạo/Sửa bàn với khu vực mới
   - Lọc bàn theo khu vực động

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup Database Trước Khi Migration!**
   ```sql
   BACKUP DATABASE [YourDatabaseName] 
   TO DISK = 'C:\Backup\BeforeTableAreaMigration.bak'
   ```

2. **Data Migration Script Quan Trọng**
   - Phải có script migrate dữ liệu cũ từ enum sang table
   - Nếu đã có bàn trong database, chúng cần được map sang khu vực mới

3. **Foreign Key Constraint**
   - `Table.TableAreaId` bắt buộc (required)
   - `DeleteBehavior.Restrict` - không xóa khu vực có bàn

4. **Unique Name**
   - Tên khu vực không được trùng
   - Case-insensitive check

---

## ✅ CHECKLIST

- [ ] Dừng backend server
- [ ] Chạy `dotnet ef migrations add ConvertTableAreaToTable`
- [ ] Thêm seed data vào migration file
- [ ] Thêm script migrate dữ liệu cũ (nếu có)
- [ ] Chạy `dotnet ef database update`
- [ ] Kiểm tra database có bảng `TableAreas` chưa
- [ ] Kiểm tra `Tables` có column `TableAreaId` chưa
- [ ] Test API `/api/tables/areas`
- [ ] Test tạo/sửa/xóa khu vực
- [ ] Test tạo bàn với `TableAreaId`
- [ ] Khởi động lại backend
- [ ] Update frontend code
- [ ] Test toàn bộ flow

---

**🎉 Chúc bạn migration thành công!**

Sau khi hoàn tất, hệ thống quản lý khu vực sẽ linh hoạt và mạnh mẽ hơn rất nhiều!

