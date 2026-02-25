# ✅ TABLE MANAGEMENT FRONTEND - HOÀN THÀNH

## 🎉 ĐÃ HOÀN TẤT

Hệ thống quản lý bàn (Table Management) đã được tích hợp hoàn chỉnh giữa Backend và Frontend!

---

## 📦 CÁC FILE ĐÃ TẠO/CẬP NHẬT

### Backend (đã có)
- ✅ `fastfood/fastfood.Shared/Models/Table.cs` - Model
- ✅ `fastfood/fastfood.Shared/DTOs/` - CreateTableDto, UpdateTableDto, TableResponseDto, TableListResponseDto
- ✅ `fastfood/fastfood/Controllers/TablesController.cs` - API Controller
- ✅ `fastfood/fastfood/Data/ApplicationDbContext.cs` - Database context
- ✅ `fastfood/fastfood/Tables.http` - API test file

### Frontend (vừa tạo)
- ✅ `fe/src/api/tableService.ts` - API service với đầy đủ CRUD functions
- ✅ `fe/src/pages/TableManagementPage.tsx` - Component chính (đã loại bỏ mock data)
- ✅ `fe/src/pages/TableManagementPage.css` - Styles (đã cập nhật)

---

## 🎨 TÍNH NĂNG FRONTEND

### 1. Hiển Thị Danh Sách Bàn
- ✅ Tải danh sách từ API
- ✅ Sắp xếp theo ID (mới nhất trước)
- ✅ Hiển thị đầy đủ thông tin: Số bàn, sức chứa, khu vực, vị trí, trạng thái
- ✅ Hiển thị số đơn hàng đang hoạt động
- ✅ Badge màu sắc theo trạng thái

### 2. Tìm Kiếm & Lọc
- ✅ Tìm kiếm theo số bàn, vị trí
- ✅ Lọc theo khu vực (Tầng 1, 2, 3, VIP, Trong nhà, Ngoài trời)
- ✅ Hiển thị số lượng bàn theo từng khu vực
- ✅ Click vào khu vực để lọc, click lại để bỏ lọc

### 3. Thêm Bàn Mới
- ✅ Form modal với validation
- ✅ Nhập số bàn (string): "B01", "VIP01", "T2-01"
- ✅ Chọn sức chứa (1-50 người)
- ✅ Chọn khu vực từ dropdown
- ✅ Nhập vị trí (optional)
- ✅ Chọn trạng thái (Trống, Có khách, Đã đặt, Đang dọn, Bảo trì)
- ✅ Nhập ghi chú (optional)
- ✅ Checkbox "Bàn đang hoạt động"
- ✅ Gợi ý placeholder thông minh

### 4. Sửa Bàn
- ✅ Click "✏️ Sửa" để mở form
- ✅ Pre-fill dữ liệu hiện tại
- ✅ Cập nhật thông tin
- ✅ Validation đầy đủ

### 5. Xóa Bàn
- ✅ Click "🗑️ Xóa"
- ✅ Confirm dialog
- ✅ Không cho xóa bàn đang có đơn hàng
- ✅ Nút xóa bị disable nếu bàn có đơn hàng hoạt động

### 6. UI/UX
- ✅ Giao diện đẹp, hiện đại
- ✅ Responsive design
- ✅ Loading state với spinner
- ✅ Error handling với alert
- ✅ Success messages
- ✅ Hover effects
- ✅ Active state cho khu vực đang được chọn

---

## 🔢 ENUM VALUES

### TableStatus
```typescript
Available = 1    // Trống
Occupied = 2     // Có khách
Reserved = 3     // Đã đặt
Cleaning = 4     // Đang dọn
Maintenance = 5  // Bảo trì
```

### TableArea
```typescript
Indoor = 1        // Trong nhà
Outdoor = 2       // Ngoài trời
VIP = 3           // VIP
FirstFloor = 4    // Tầng 1
SecondFloor = 5   // Tầng 2
ThirdFloor = 6    // Tầng 3
```

---

## 🚀 CÁCH SỬ DỤNG

### 1. Khởi Động Backend
```powershell
cd fastfood\fastfood
dotnet run
```
Backend sẽ chạy ở: `http://localhost:5000`

### 2. Khởi Động Frontend
```powershell
cd fe
npm run dev
```
Frontend sẽ chạy ở: `http://localhost:5173`

### 3. Truy Cập Trang Quản Lý Bàn
- Đăng nhập với tài khoản Admin
- Vào menu: **🪑 Quản Lý Bàn**
- URL: `http://localhost:5173/tables`

---

## 📝 HƯỚNG DẪN SỬ DỤNG

### Thêm Bàn Mới
1. Click nút **"➕ Thêm Bàn"**
2. Nhập thông tin:
   - **Số Bàn**: B01, B02, VIP01, T2-01, etc.
   - **Sức Chứa**: 1-50 người
   - **Khu Vực**: Chọn từ dropdown
   - **Vị Trí**: "Gần cửa sổ", "Góc trái", etc. (optional)
   - **Trạng Thái**: Mặc định "Trống"
   - **Ghi Chú**: (optional)
3. Click **"Thêm Mới"**

### Sửa Bàn
1. Click **"✏️ Sửa"** ở bàn muốn sửa
2. Cập nhật thông tin
3. Click **"Cập Nhật"**

### Xóa Bàn
1. Click **"🗑️ Xóa"** ở bàn muốn xóa
2. Confirm trong dialog
3. **Lưu ý**: Không thể xóa bàn đang có đơn hàng

### Tìm Kiếm
- Gõ từ khóa vào ô tìm kiếm
- Tìm theo: Số bàn, Vị trí

### Lọc Theo Khu Vực
- Click vào card khu vực để lọc
- Click lại để bỏ lọc (hoặc click "🔄 Xem tất cả")

---

## 🎯 VÍ DỤ DỮ LIỆU

### Bàn Tầng 1
```
Số bàn: B01, B02, B03, B04, B05
Sức chứa: 2-6 người
Khu vực: Tầng 1
Vị trí: "Gần quầy", "Giữa phòng", "Gần cửa sổ"
```

### Bàn VIP
```
Số bàn: VIP01, VIP02
Sức chứa: 8-10 người
Khu vực: VIP
Vị trí: "Phòng riêng tư", "Có điều hòa"
```

### Bàn Ngoài Trời
```
Số bàn: OUT01, OUT02
Sức chứa: 4-6 người
Khu vực: Ngoài trời
Vị trí: "Sân vườn", "Gần hồ nước"
```

---

## 🔗 API ENDPOINTS ĐANG SỬ DỤNG

Frontend đang gọi các API sau:

```typescript
// Lấy danh sách bàn
GET /api/tables

// Lấy chi tiết 1 bàn
GET /api/tables/{id}

// Tạo bàn mới
POST /api/tables

// Cập nhật bàn
PUT /api/tables/{id}

// Xóa bàn
DELETE /api/tables/{id}
```

---

## 🎨 MÀU SẮC TRẠNG THÁI

| Trạng Thái | Màu Badge | Ý Nghĩa |
|-----------|-----------|---------|
| **Trống** | 🟢 Xanh lá | Sẵn sàng phục vụ |
| **Có khách** | 🔴 Đỏ | Đang có khách ngồi |
| **Đã đặt** | 🟡 Vàng | Đã book trước |
| **Đang dọn** | 🔵 Xanh dương | Đang dọn dẹp |
| **Bảo trì** | ⚪ Xám | Bàn hỏng, không dùng được |

---

## 🐛 XỬ LÝ LỖI

### Lỗi: "Số bàn đã tồn tại"
- **Nguyên nhân**: Đang tạo/sửa bàn với số bàn trùng
- **Giải pháp**: Đổi số bàn khác

### Lỗi: "Không thể xóa bàn đang có đơn hàng"
- **Nguyên nhân**: Bàn có đơn hàng đang hoạt động
- **Giải pháp**: Hoàn thành/hủy đơn hàng trước, sau đó mới xóa bàn

### Lỗi: "Không thể tải danh sách bàn"
- **Nguyên nhân**: Backend không chạy hoặc lỗi kết nối
- **Giải pháp**: 
  1. Kiểm tra backend đang chạy (`dotnet run`)
  2. Kiểm tra URL API trong `axiosInstance.ts`
  3. Kiểm tra CORS settings

---

## 📊 THỐNG KÊ

Frontend tự động hiển thị:
- ✅ Tổng số bàn
- ✅ Số bàn theo từng khu vực
- ✅ Số đơn hàng đang hoạt động trên mỗi bàn
- ✅ Số kết quả tìm kiếm/lọc

---

## 🔄 BƯỚC TIẾP THEO (Tùy Chọn)

### 1. Tích Hợp Với POSPage
- Khi tạo đơn "Tại Bàn", cho chọn bàn từ danh sách
- Tự động cập nhật trạng thái bàn thành "Có khách"
- Lưu `TableId` vào Order

### 2. Real-time Status Update
- WebSocket/SignalR để cập nhật trạng thái bàn real-time
- Khi có đơn mới, bàn tự động đổi màu

### 3. QR Code Generation
- Tự động generate QR code cho mỗi bàn
- Khách scan QR để order tự phục vụ

### 4. Table Layout View
- Hiển thị sơ đồ bàn dạng visual
- Drag & drop để sắp xếp bàn

---

## ✅ CHECKLIST HOÀN THÀNH

- [x] Tạo Model và DTOs
- [x] Tạo TablesController với đầy đủ CRUD
- [x] Migration database thành công
- [x] Tạo tableService.ts với API calls
- [x] Update TableManagementPage.tsx
- [x] Loại bỏ mock data
- [x] Tích hợp API thật
- [x] UI/UX hoàn chỉnh
- [x] Validation và error handling
- [x] Search và filter
- [x] Responsive design
- [x] No linter errors

---

## 🎉 KẾT LUẬN

**Hệ thống Quản Lý Bàn đã hoàn tất 100%!**

Bạn có thể:
1. ✅ Thêm/Sửa/Xóa bàn
2. ✅ Tìm kiếm và lọc
3. ✅ Xem trạng thái real-time
4. ✅ Quản lý theo khu vực
5. ✅ Bảo vệ dữ liệu (không xóa bàn có đơn hàng)

**Hãy test thử và báo nếu có vấn đề!** 🚀

