# 📄 Hướng Dẫn: 2 Trang Payment trong Hệ Thống

## 🎯 Tổng Quan

Project của bạn có **2 trang Payment khác nhau** phục vụ 2 mục đích:

### 1. **PaymentPage.tsx** - Trang Thanh Toán Đơn Hàng
- **Route:** `/payment`
- **Người dùng:** Admin, Cashier
- **Chức năng:** Checkout đơn hàng từ POS
- **Layout:** Không có sidebar (fullscreen checkout)

### 2. **PaymentsPage.tsx** - Trang Quản Lý Thanh Toán
- **Route:** `/payments`
- **Người dùng:** Admin only
- **Chức năng:** Xem lịch sử, thống kê thanh toán
- **Layout:** Có sidebar (tích hợp trong menu admin)

---

## 📊 So Sánh Chi Tiết

| Tiêu chí | PaymentPage | PaymentsPage |
|----------|-------------|--------------|
| **Route** | `/payment` | `/payments` |
| **Người dùng** | Admin, Cashier | Admin only |
| **Mục đích** | Thanh toán đơn hàng | Quản lý lịch sử |
| **Layout** | Không có sidebar | Có sidebar |
| **Flow** | POS → Payment → Hoàn tất | Dashboard → Payments → Xem lịch sử |
| **Chức năng chính** | - Chọn khách hàng<br>- Chọn phương thức thanh toán<br>- Áp dụng giảm giá<br>- In hóa đơn | - Xem danh sách thanh toán<br>- Filter theo ngày/phương thức<br>- Xem thống kê<br>- Biểu đồ phân tích |

---

## 🔄 Flow Sử Dụng

### Flow 1: Cashier Thanh Toán (PaymentPage)
```
1. Cashier đăng nhập
2. Vào POS Page (/pos)
3. Thêm món vào giỏ hàng
4. Click "Thanh Toán" → Chuyển đến /payment
5. Chọn khách hàng, phương thức thanh toán
6. Hoàn tất đơn hàng
7. In hóa đơn (optional)
8. Quay lại POS
```

### Flow 2: Admin Xem Lịch Sử (PaymentsPage)
```
1. Admin đăng nhập
2. Vào Dashboard (/)
3. Click menu "💳 Quản Lý Thanh Toán" → /payments
4. Xem danh sách thanh toán
5. Filter theo ngày/phương thức
6. Xem biểu đồ thống kê
```

---

## 🎨 UI/UX Khác Biệt

### PaymentPage (Checkout)
```
┌─────────────────────────────────────┐
│     THANH TOÁN ĐƠN HÀNG             │
├─────────────────────────────────────┤
│ Thông tin khách hàng                │
│ [Search customer...]                │
│                                     │
│ Phương thức thanh toán              │
│ ○ Tiền mặt  ○ Chuyển khoản         │
│                                     │
│ Tổng tiền: 150,000 VNĐ             │
│                                     │
│ [Hủy]  [Hoàn Tất Thanh Toán]       │
└─────────────────────────────────────┘
```

### PaymentsPage (Management)
```
┌──────┬──────────────────────────────┐
│ 📊   │ QUẢN LÝ THANH TOÁN          │
│ 💳   ├──────────────────────────────┤
│ 👥   │ Filter: [Từ ngày] [Đến ngày]│
│ 🍔   │                              │
│ ...  │ ┌─────────┬────────┬────────┐│
│      │ │ ID      │ Ngày   │ Số tiền││
│      │ ├─────────┼────────┼────────┤│
│      │ │ #001    │ 14/11  │ 150K   ││
│      │ │ #002    │ 14/11  │ 200K   ││
│      │ └─────────┴────────┴────────┘│
│      │                              │
│      │ 📈 Biểu đồ thống kê          │
└──────┴──────────────────────────────┘
```

---

## 🗂️ Cấu Trúc File

### PaymentPage (Checkout)
```
fe/src/pages/
├── PaymentPage.tsx       # Component chính
├── PaymentPage.css       # Styles riêng
```

**Dependencies:**
- `customerService.ts` - Tìm/tạo khách hàng
- `orderService.ts` - Tạo/cập nhật đơn hàng
- `paymentService.ts` - Xử lý thanh toán

### PaymentsPage (Management)
```
fe/src/pages/
├── PaymentsPage.tsx      # Component quản lý
├── PaymentsPage.css      # Styles riêng

fe/src/api/
├── paymentService.ts     # API calls (extended)
└── reportsService.ts     # Statistics & charts
```

**Dependencies:**
- `paymentService.ts` - CRUD payments, filters
- `reportsService.ts` - Charts & export
- `recharts` - Biểu đồ

---

## 🔧 API Endpoints Sử Dụng

### PaymentPage sử dụng:
```
POST   /api/Orders              # Tạo đơn hàng mới
PUT    /api/Orders/{id}         # Cập nhật đơn hàng
POST   /api/Payments            # Tạo payment record
POST   /api/Customers           # Tạo khách hàng mới
GET    /api/Customers/search    # Tìm khách hàng
```

### PaymentsPage sử dụng:
```
GET    /api/Payments                    # Danh sách payments
GET    /api/Payments/{id}               # Chi tiết payment
GET    /api/Payments/stats              # Thống kê
GET    /api/Reports/revenue-chart       # Biểu đồ doanh thu
POST   /api/Export/sales-report         # Export Excel
```

---

## 🎯 Tính Năng Chi Tiết

### PaymentPage (Checkout)
✅ **Đã có:**
- Tìm kiếm khách hàng (search by name/phone)
- Tạo khách hàng mới nhanh
- Chọn phương thức thanh toán (Cash, Transfer, Card)
- Áp dụng giảm giá (%, VNĐ, voucher)
- Tính VAT (optional)
- Xác nhận thanh toán
- In hóa đơn (receipt printing)
- Quay lại POS

### PaymentsPage (Management)
✅ **Đã có:**
- Danh sách payments (table view)
- Filter theo:
  - Ngày (from/to)
  - Phương thức thanh toán
  - Trạng thái
- Summary cards (từ dữ liệu đã filter):
  - Tổng doanh thu
  - Tổng giao dịch
  - Số giao dịch hoàn thành
- Hiển thị thông tin chi tiết:
  - Mã đơn hàng
  - Số tiền
  - Phương thức thanh toán
  - Trạng thái
  - Ngày thanh toán

⏳ **Có thể thêm sau:**
- Xem chi tiết payment (modal)
- Export Excel payments list
- Refund management
- Payment verification
- Thêm customer name từ backend

---

## 📱 Menu Sidebar (Admin)

Sau khi update, Admin sẽ thấy menu:

```
📊 Dashboard
🖥️ Quầy Thu Ngân (POS)
📁 Danh Mục
🍔 Sản Phẩm
🧂 Kho Nguyên Liệu
🛒 Đơn Hàng
👥 Khách Hàng
🪑 Bàn
💼 Nhân Viên
💳 Quản Lý Thanh Toán  ← NEW!
📈 Báo Cáo & Thống Kê   ← NEW!
```

---

## 🧪 Testing

### Test PaymentPage (Checkout)
1. Đăng nhập với Cashier account
2. Vào POS, thêm món vào giỏ
3. Click "Thanh Toán"
4. Kiểm tra:
   - Tìm khách hàng hoạt động
   - Tạo khách hàng mới hoạt động
   - Chọn phương thức thanh toán
   - Áp dụng giảm giá
   - Hoàn tất thanh toán

### Test PaymentsPage (Management)
1. Đăng nhập với Admin account
2. Click menu "💳 Quản Lý Thanh Toán"
3. Kiểm tra:
   - Danh sách payments hiển thị
   - Filter theo ngày hoạt động
   - Statistics cards cập nhật
   - Biểu đồ render đúng
   - Phân trang hoạt động

---

## 🔒 Phân Quyền

| Trang | Admin | Cashier | Warehouse Staff |
|-------|-------|---------|-----------------|
| `/payment` (Checkout) | ✅ | ✅ | ❌ |
| `/payments` (Management) | ✅ | ❌ | ❌ |

---

## 📝 Notes Quan Trọng

### ⚠️ Không nhầm lẫn 2 trang:
- **PaymentPage** = Cashier checkout đơn hàng
- **PaymentsPage** = Admin xem lịch sử

### 💡 Best Practices:
1. Cashier không cần thấy menu "Quản Lý Thanh Toán"
2. PaymentPage chỉ được truy cập từ POS flow
3. PaymentsPage chỉ Admin mới thấy
4. Không link trực tiếp đến `/payment` trong menu

### 🐛 Known Issues:
- Không có vấn đề known issues hiện tại

---

## 🚀 Workflow Hoàn Chỉnh

### Quy trình đầy đủ:
```
1. Cashier bán hàng (POSPage)
   ↓
2. Thanh toán (PaymentPage) ← Transaction được ghi nhận
   ↓
3. Payment record được lưu vào database
   ↓
4. Admin xem lịch sử (PaymentsPage) ← Hiển thị transaction
```

---

## 🎉 Tóm Tắt

✅ **Đã hoàn thành:**
- ✅ 2 trang Payment hoạt động độc lập
- ✅ Routes được config đúng
- ✅ Menu sidebar có cả 2 items
- ✅ Phân quyền rõ ràng (Admin vs Cashier)
- ✅ Không conflict giữa 2 trang

🎯 **Kết quả:**
- Cashier có trang checkout riêng biệt
- Admin có trang quản lý payments mạnh mẽ
- Hệ thống hoạt động trơn tru, không nhầm lẫn

---

Nếu cần thêm tính năng hoặc chỉnh sửa, hãy cho tôi biết! 🚀

