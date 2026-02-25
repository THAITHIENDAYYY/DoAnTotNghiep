# 🔧 FIX TABLE AREA MIGRATION ERROR

## ❌ LỖI GẶP PHẢI

```
The ALTER TABLE statement conflicted with the FOREIGN KEY constraint 
"FK_Tables_TableAreas_TableAreaId". The conflict occurred in database 
"fastfoodma", table "dbo.TableAreas", column 'Id'.
```

## 🎯 NGUYÊN NHÂN

Migration đã:
1. ✅ Đổi tên column `Area` → `TableAreaId`
2. ✅ Tạo bảng `TableAreas`
3. ❌ Cố tạo foreign key NHƯNG bảng `TableAreas` TRỐNG!

→ Các bàn có `TableAreaId` = 1,2,3,4,5,6 nhưng không có ID tương ứng trong `TableAreas`

## ✅ ĐÃ SỬA

Đã thêm **seed data** vào migration file:
```csharp
migrationBuilder.InsertData(
    table: "TableAreas",
    columns: new[] { "Id", "Name", "Description", "DisplayOrder", "IsActive", "CreatedAt" },
    values: new object[,]
    {
        { 1, "Trong nhà", "Khu vực trong nhà", 5, true, DateTime.UtcNow },
        { 2, "Ngoài trời", "Khu vực ngoài trời / sân vườn", 6, true, DateTime.UtcNow },
        { 3, "VIP", "Khu vực VIP", 4, true, DateTime.UtcNow },
        { 4, "Tầng 1", "Khu vực tầng 1", 1, true, DateTime.UtcNow },
        { 5, "Tầng 2", "Khu vực tầng 2", 2, true, DateTime.UtcNow },
        { 6, "Tầng 3", "Khu vực tầng 3", 3, true, DateTime.UtcNow }
    });
```

**Mapping:**
- ID 1 = Trong nhà (enum cũ: Indoor = 1)
- ID 2 = Ngoài trời (enum cũ: Outdoor = 2)
- ID 3 = VIP (enum cũ: VIP = 3)
- ID 4 = Tầng 1 (enum cũ: FirstFloor = 4)
- ID 5 = Tầng 2 (enum cũ: SecondFloor = 5)
- ID 6 = Tầng 3 (enum cũ: ThirdFloor = 6)

## 🚀 CÁCH SỬA

### Bước 1: Rollback Migration Lỗi

```powershell
cd fastfood\fastfood

# Rollback về migration trước đó (initial2)
dotnet ef database update 20251110150846_initial2
```

Lệnh này sẽ:
- ✅ Xóa bảng `TableAreas`
- ✅ Đổi tên column `TableAreaId` về `Area`
- ✅ Xóa foreign key và indexes

### Bước 2: Chạy Lại Migration (Đã Sửa)

```powershell
# Chạy lại migration với seed data
dotnet ef database update
```

Lần này migration sẽ:
1. ✅ Đổi tên `Area` → `TableAreaId`
2. ✅ Tạo bảng `TableAreas`
3. ✅ **INSERT 6 khu vực mặc định**
4. ✅ Tạo indexes
5. ✅ Tạo foreign key (THÀNH CÔNG vì đã có data!)

### Bước 3: Kiểm Tra

```sql
-- Kiểm tra bảng TableAreas có 6 records
SELECT * FROM TableAreas ORDER BY Id

-- Kiểm tra foreign key đã tạo
SELECT 
    name AS ForeignKeyName,
    OBJECT_NAME(parent_object_id) AS TableName,
    OBJECT_NAME(referenced_object_id) AS ReferencedTableName
FROM sys.foreign_keys
WHERE name = 'FK_Tables_TableAreas_TableAreaId'

-- Kiểm tra các bàn đã link đúng chưa
SELECT 
    t.Id,
    t.TableNumber,
    t.TableAreaId,
    ta.Name AS AreaName
FROM Tables t
LEFT JOIN TableAreas ta ON t.TableAreaId = ta.Id
```

### Bước 4: Khởi Động Lại Backend

```powershell
dotnet run
```

## 🧪 TEST API

```http
### 1. Lấy tất cả khu vực (phải có 6 khu vực)
GET http://localhost:5000/api/tables/areas

### 2. Lấy tất cả bàn (phải có TableAreaName)
GET http://localhost:5000/api/tables

### 3. Tạo bàn với khu vực
POST http://localhost:5000/api/tables
Content-Type: application/json

{
  "tableNumber": "B01",
  "capacity": 4,
  "status": 1,
  "tableAreaId": 4,
  "location": "Gần quầy",
  "isActive": true
}
```

## ⚠️ NẾU VẪN LỖI

### Tùy chọn 1: Xóa Migration và Tạo Lại

```powershell
# 1. Rollback về initial2
dotnet ef database update 20251110150846_initial2

# 2. Xóa migration file
Remove-Item .\Migrations\20251110153505_initial3.*

# 3. Tạo migration mới (file đã sửa sẽ được tạo lại tương tự)
dotnet ef migrations add AddTableAreaTable

# 4. Update database
dotnet ef database update
```

### Tùy chọn 2: Manual Fix SQL (Nếu không rollback được)

```sql
-- 1. Xóa foreign key nếu đã tồn tại
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tables_TableAreas_TableAreaId')
BEGIN
    ALTER TABLE Tables DROP CONSTRAINT FK_Tables_TableAreas_TableAreaId
END

-- 2. Insert data vào TableAreas (nếu chưa có)
IF NOT EXISTS (SELECT * FROM TableAreas)
BEGIN
    INSERT INTO TableAreas (Name, Description, DisplayOrder, IsActive, CreatedAt)
    VALUES 
        ('Trong nhà', 'Khu vực trong nhà', 5, 1, GETDATE()),
        ('Ngoài trời', 'Khu vực ngoài trời / sân vườn', 6, 1, GETDATE()),
        ('VIP', 'Khu vực VIP', 4, 1, GETDATE()),
        ('Tầng 1', 'Khu vực tầng 1', 1, 1, GETDATE()),
        ('Tầng 2', 'Khu vực tầng 2', 2, 1, GETDATE()),
        ('Tầng 3', 'Khu vực tầng 3', 3, 1, GETDATE())
END

-- 3. Tạo lại foreign key
ALTER TABLE Tables
ADD CONSTRAINT FK_Tables_TableAreas_TableAreaId
FOREIGN KEY (TableAreaId) REFERENCES TableAreas(Id)
```

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi fix xong:
- ✅ Bảng `TableAreas` có 6 records
- ✅ Bảng `Tables` có column `TableAreaId` (int)
- ✅ Foreign key `FK_Tables_TableAreas_TableAreaId` tồn tại
- ✅ Tất cả bàn đều link đúng với khu vực
- ✅ API `/api/tables/areas` trả về 6 khu vực
- ✅ API `/api/tables` trả về bàn với `TableAreaName`

## 📊 KIỂM TRA CUỐI CÙNG

```sql
-- 1. Số lượng khu vực
SELECT COUNT(*) AS TotalAreas FROM TableAreas
-- Expected: 6

-- 2. Số lượng bàn có khu vực hợp lệ
SELECT COUNT(*) AS TablesWithValidArea 
FROM Tables t
INNER JOIN TableAreas ta ON t.TableAreaId = ta.Id
-- Expected: Tất cả bàn

-- 3. Bàn không có khu vực hợp lệ (phải = 0)
SELECT COUNT(*) AS TablesWithInvalidArea 
FROM Tables t
LEFT JOIN TableAreas ta ON t.TableAreaId = ta.Id
WHERE ta.Id IS NULL
-- Expected: 0
```

---

**🎉 Sau khi rollback và chạy lại, migration sẽ thành công!**

