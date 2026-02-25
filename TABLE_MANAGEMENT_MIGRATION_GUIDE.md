# 📋 HƯỚNG DẪN MIGRATION - TABLE MANAGEMENT SYSTEM

## 🎯 Tổng Quan

Hệ thống quản lý bàn (Table Management) đã được thiết kế hoàn chỉnh với:
- ✅ **Table Model** với các thuộc tính hợp lý cho nhà hàng fast food
- ✅ **DTOs** đầy đủ cho CRUD operations
- ✅ **Relationship** với Order (một bàn có nhiều đơn hàng)
- ✅ **Index unique** cho TableNumber (không trùng số bàn)
- ✅ **Enums** cho Status và Area

---

## 📦 CÁC FILE ĐÃ TẠO/CẬP NHẬT

### 1. Models
- ✅ `fastfood/fastfood.Shared/Models/Table.cs` - Model chính
- ✅ `fastfood/fastfood.Shared/Models/Order.cs` - Thêm `TableId` (nullable)

### 2. DTOs
- ✅ `fastfood/fastfood.Shared/DTOs/CreateTableDto.cs`
- ✅ `fastfood/fastfood.Shared/DTOs/UpdateTableDto.cs`
- ✅ `fastfood/fastfood.Shared/DTOs/TableResponseDto.cs`
- ✅ `fastfood/fastfood.Shared/DTOs/TableListResponseDto.cs`

### 3. Database Context
- ✅ `fastfood/fastfood/Data/ApplicationDbContext.cs` - Thêm `DbSet<Table>` và relationships

---

## 🏗️ CHI TIẾT CLASS TABLE

```csharp
public class Table
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(20)]
    public string TableNumber { get; set; }      // Số bàn: B01, B02, VIP01
    
    [Range(1, 50)]
    public int Capacity { get; set; } = 4;       // Số chỗ ngồi (1-50)
    
    public TableStatus Status { get; set; }       // Trạng thái bàn
    public TableArea Area { get; set; }           // Khu vực
    
    [StringLength(50)]
    public string? Location { get; set; }         // Vị trí chi tiết
    
    [StringLength(200)]
    public string? QRCode { get; set; }           // Mã QR (optional)
    
    public bool IsActive { get; set; } = true;    // Bàn có hoạt động không
    
    [StringLength(500)]
    public string? Notes { get; set; }            // Ghi chú
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation
    public virtual ICollection<Order> Orders { get; set; }
}
```

### 📊 Enums

**TableStatus:**
- `Available = 1` - Trống, sẵn sàng phục vụ
- `Occupied = 2` - Đang có khách
- `Reserved = 3` - Đã đặt trước
- `Cleaning = 4` - Đang dọn dẹp
- `Maintenance = 5` - Bảo trì

**TableArea:**
- `Indoor = 1` - Trong nhà
- `Outdoor = 2` - Ngoài trời
- `VIP = 3` - Khu VIP
- `FirstFloor = 4` - Tầng 1
- `SecondFloor = 5` - Tầng 2
- `ThirdFloor = 6` - Tầng 3

---

## 🚀 HƯỚNG DẪN MIGRATION

### Bước 1: Dừng Backend Server

**QUAN TRỌNG:** Phải dừng server trước khi chạy migration!

```powershell
# Tìm và dừng process đang chạy dotnet
# Bấm Ctrl+C trong terminal đang chạy backend
# Hoặc đóng terminal đó
```

### Bước 2: Tạo Migration

```powershell
cd fastfood\fastfood
dotnet ef migrations add AddTableManagement --project ../fastfood --startup-project ../fastfood
```

**Migration này sẽ tạo:**
- Bảng `Tables` với đầy đủ columns
- Thêm column `TableId` (nullable) vào bảng `Orders`
- Foreign key constraint: `Order.TableId -> Table.Id`
- Unique index cho `TableNumber`

### Bước 3: Kiểm Tra Migration File

Migration file sẽ được tạo tại:
```
fastfood/fastfood/Migrations/[timestamp]_AddTableManagement.cs
```

**Kiểm tra xem có:**
- ✅ `CreateTable("Tables", ...)`
- ✅ `AddColumn("Orders", "TableId", nullable: true)`
- ✅ `CreateIndex("Tables", "TableNumber", unique: true)`
- ✅ `AddForeignKey("Orders", "TableId", "Tables")`

### Bước 4: Update Database

```powershell
dotnet ef database update
```

**Kết quả mong đợi:**
```
Build succeeded.
Applying migration '20XXXXXX_AddTableManagement'.
Done.
```

### Bước 5: Khởi Động Lại Backend

```powershell
dotnet run
```

Hoặc trong Visual Studio: `F5` / `Ctrl+F5`

---

## 🧪 KIỂM TRA SAU KHI MIGRATION

### 1. Kiểm tra trong SQL Server Management Studio (SSMS)

```sql
-- Kiểm tra bảng Tables đã được tạo
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'Tables'

-- Kiểm tra structure
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Tables'

-- Kiểm tra Orders có TableId chưa
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Orders' AND COLUMN_NAME = 'TableId'

-- Kiểm tra unique constraint
SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'Tables' AND CONSTRAINT_TYPE = 'UNIQUE'
```

### 2. Test API với Postman/Thunder Client

**Tạo bàn thử nghiệm:**
```json
POST http://localhost:5000/api/tables
{
  "tableNumber": "B01",
  "capacity": 4,
  "status": 1,
  "area": 4,
  "location": "Gần cửa sổ",
  "isActive": true,
  "notes": "Bàn view đẹp"
}
```

---

## 📝 DỮ LIỆU MẪU

Sau khi migration thành công, bạn có thể chạy script SQL này để tạo dữ liệu mẫu:

```sql
-- Bàn tầng 1 (Indoor)
INSERT INTO Tables (TableNumber, Capacity, Status, Area, Location, IsActive, CreatedAt)
VALUES 
    ('B01', 4, 1, 4, 'Gần quầy', 1, GETDATE()),
    ('B02', 4, 1, 4, 'Giữa phòng', 1, GETDATE()),
    ('B03', 2, 1, 4, 'Góc trái', 1, GETDATE()),
    ('B04', 6, 1, 4, 'Gần cửa sổ', 1, GETDATE()),
    ('B05', 4, 1, 4, 'Giữa phòng', 1, GETDATE());

-- Bàn tầng 2
INSERT INTO Tables (TableNumber, Capacity, Status, Area, Location, IsActive, CreatedAt)
VALUES 
    ('T2-01', 4, 1, 5, 'Tầng 2 - Giữa', 1, GETDATE()),
    ('T2-02', 6, 1, 5, 'Tầng 2 - Góc phải', 1, GETDATE()),
    ('T2-03', 2, 1, 5, 'Tầng 2 - Gần ban công', 1, GETDATE());

-- Bàn VIP
INSERT INTO Tables (TableNumber, Capacity, Status, Area, Location, IsActive, CreatedAt)
VALUES 
    ('VIP01', 8, 1, 3, 'Phòng VIP 1', 1, GETDATE()),
    ('VIP02', 10, 1, 3, 'Phòng VIP 2', 1, GETDATE());

-- Bàn ngoài trời
INSERT INTO Tables (TableNumber, Capacity, Status, Area, Location, IsActive, CreatedAt)
VALUES 
    ('OUT01', 4, 1, 2, 'Sân vườn', 1, GETDATE()),
    ('OUT02', 6, 1, 2, 'Gần hồ nước', 1, GETDATE());
```

---

## 🔄 BƯỚC TIẾP THEO (Sau khi migration xong)

1. **Tạo TablesController.cs** - API CRUD cho Table
2. **Tạo tableService.ts** - Frontend API service
3. **Tạo TableManagementPage.tsx** - UI quản lý bàn
4. **Update POSPage.tsx** - Chọn bàn khi tạo đơn DineIn
5. **Update OrdersPage.tsx** - Hiển thị thông tin bàn

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Backup Database** trước khi migration!
   ```sql
   BACKUP DATABASE [YourDatabaseName] 
   TO DISK = 'C:\Backup\BeforeTableMigration.bak'
   ```

2. **TableId trong Order là nullable** vì:
   - Takeaway không cần bàn
   - Delivery không cần bàn
   - Chỉ DineIn mới có TableId

3. **TableNumber phải unique** - Không được trùng số bàn

4. **Khi xóa Table** - Các Order liên quan sẽ set `TableId = NULL` (không xóa Order)

---

## 🆘 XỬ LÝ LỖI

### Lỗi: "There is already an object named 'Tables'"
```powershell
# Rollback migration
dotnet ef database update [MigrationName-trước-đó]
# Xóa migration file
dotnet ef migrations remove
# Tạo lại
dotnet ef migrations add AddTableManagement
dotnet ef database update
```

### Lỗi: "The process cannot access the file"
```powershell
# Dừng hết process dotnet
taskkill /F /IM dotnet.exe
# Hoặc restart máy
```

### Lỗi: "A connection was successfully established... but then an error occurred"
- Kiểm tra SQL Server có đang chạy không
- Kiểm tra connection string trong `appsettings.json`

---

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Đã tạo Model `Table.cs`
- [ ] Đã tạo các DTOs (Create, Update, Response, List)
- [ ] Đã update `Order.cs` với `TableId`
- [ ] Đã update `ApplicationDbContext.cs`
- [ ] Đã dừng backend server
- [ ] Đã chạy `dotnet ef migrations add AddTableManagement`
- [ ] Đã kiểm tra migration file
- [ ] Đã chạy `dotnet ef database update`
- [ ] Đã kiểm tra trong SSMS/Azure Data Studio
- [ ] Đã khởi động lại backend
- [ ] Đã insert dữ liệu mẫu (optional)
- [ ] Sẵn sàng implement Controller và Frontend

---

**🎉 Chúc bạn migration thành công!**

Nếu gặp vấn đề gì, hãy kiểm tra logs và báo lỗi cụ thể để được hỗ trợ!

