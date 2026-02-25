# ✅ LOGIN PAGE - CẬP NHẬT ĐĂNG NHẬP BẰNG USERNAME

## 📝 Tổng quan

Đã cập nhật trang đăng nhập từ **Email/Password** sang **Username/Password** và tích hợp với backend API thật.

---

## 🔧 Các thay đổi chính

### 1. **LoginPage.tsx** - UI đăng nhập
✅ **Thay đổi:**
- Đổi state từ `email` → `username`
- Đổi label: "Email" → "Tên đăng nhập"
- Đổi input type: `email` → `text`
- Đổi placeholder: "Nhập email" → "Nhập tên đăng nhập"
- Cập nhật error message: "Email hoặc mật khẩu không đúng" → "Tên đăng nhập hoặc mật khẩu không đúng"
- Cập nhật demo accounts để dùng username
- Thêm `autoComplete` attributes

**Demo Accounts (updated):**
- Admin: `username: admin`, `password: admin123`
- Cashier: `username: cashier`, `password: cashier123`
- Warehouse: `username: warehouse`, `password: warehouse123`

---

### 2. **authService.ts** (NEW) - API service
✅ **Tạo mới:**
- `login(username, password)` - Gọi API `/api/Auth/login`
- `logout()` - Xóa token và user data
- `getStoredToken()` - Lấy token từ localStorage
- `isTokenExpired()` - Kiểm tra token hết hạn

**Interfaces:**
```typescript
interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: number;
  roleName: string;
  expiresAt: string;
}
```

**Features:**
- Tự động lưu JWT token vào localStorage
- Lưu expiry time
- Xử lý token management

---

### 3. **AuthContext.tsx** - Context provider
✅ **Cập nhật:**
- Import `authService` để gọi API thật
- Thay đổi parameter: `login(email, password)` → `login(username, password)`
- Xóa hardcoded demo accounts
- Gọi API backend thật qua `authService.login()`
- Lưu JWT token
- Convert response sang User object
- Fix TypeScript enum issues với `erasableSyntaxOnly`

**Before (Demo):**
```typescript
const demoAccounts = [
  { email: 'admin@example.com', ... }
];
```

**After (API):**
```typescript
const response = await apiLogin(username, password);
const user: User = {
  id: parseInt(response.userId),
  email: response.email,
  fullName: response.fullName,
  role: response.role as UserRole,
  roleName: response.roleName
};
```

---

## 🎯 Flow đăng nhập mới

```
User nhập Username + Password
      ↓
LoginPage.tsx (handleSubmit)
      ↓
AuthContext.login(username, password)
      ↓
authService.login(username, password)
      ↓
POST /api/Auth/login
      ↓
Backend trả về JWT token + user info
      ↓
authService lưu token vào localStorage
      ↓
AuthContext lưu user vào state + localStorage
      ↓
Navigate to dashboard (based on role)
```

---

## 📁 Files đã thay đổi

### Mới tạo:
1. ✅ `fe/src/api/authService.ts` (58 lines)

### Đã cập nhật:
1. ✅ `fe/src/pages/LoginPage.tsx`
   - Changed: state variables, labels, placeholders, demo accounts
   
2. ✅ `fe/src/contexts/AuthContext.tsx`
   - Changed: login function, imports, UserRole enum → const object
   - Removed: hardcoded demo accounts
   - Added: API integration

---

## 🔐 Security Improvements

✅ **JWT Token Management:**
- Token lưu trong localStorage
- Expiry time được check
- Token tự động gửi trong headers (via axiosInstance)

✅ **API Integration:**
- Không còn hardcoded passwords
- Backend xác thực thật
- Role-based access control từ backend

---

## 🚀 Cách sử dụng

### 1. Đảm bảo backend đang chạy:
```bash
cd fastfood/fastfood
dotnet run
# Backend: https://localhost:5001
```

### 2. Tạo tài khoản Admin (nếu chưa có):

**Swagger UI** - `https://localhost:5001/swagger`:
1. POST `/api/Employees` - Tạo employee với role Admin (role=1)
2. POST `/api/Employees/{id}/create-account` - Tạo username/password

**Thông tin tạo:**
```json
// Step 1: Create Employee
{
  "firstName": "Admin",
  "lastName": "System",
  "role": 1,  // Admin
  ...
}

// Step 2: Create Account
{
  "username": "admin",
  "password": "admin123"
}
```

### 3. Đăng nhập:
- Truy cập: `http://localhost:3000/login`
- Nhập: **Username** (không phải email)
- Nhập: **Password**
- Click: "Đăng Nhập"

---

## ✅ Testing Checklist

- [x] UI hiển thị "Tên đăng nhập" thay vì "Email"
- [x] Input type là "text" không phải "email"
- [x] Gọi API `/api/Auth/login` thành công
- [x] JWT token được lưu vào localStorage
- [x] User info được lưu vào localStorage
- [x] Redirect đúng based on role:
  - Admin → `/` (Dashboard)
  - Cashier → `/pos`
  - Warehouse → `/ingredients`
- [x] Logout xóa token và user data
- [x] Protected routes hoạt động đúng
- [x] No TypeScript linter errors

---

## 🐛 Troubleshooting

### Lỗi: "Failed to fetch" hoặc "Network Error"
→ Backend chưa chạy. Start backend tại port 5001

### Lỗi: "Tên đăng nhập hoặc mật khẩu không đúng"
→ Kiểm tra username/password trong database
→ Xem `CREATE_ADMIN_ACCOUNT_GUIDE.md` để tạo tài khoản

### Lỗi CORS
→ Backend CORS đã được cấu hình trong `Program.cs`
→ Cho phép `http://localhost:3000` và `http://localhost:5173`

### Token expired
→ Token hết hạn sau 24 giờ
→ Đăng nhập lại để lấy token mới

---

## 📊 API Endpoints sử dụng

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/Auth/login` | Đăng nhập với username/password |
| GET | `/api/Auth/me` | Lấy thông tin user hiện tại |
| POST | `/api/Employees/{id}/create-account` | Tạo tài khoản cho employee |
| POST | `/api/Employees/{id}/change-password` | Đổi mật khẩu |

---

## 🎨 UI Changes

**Before:**
```
┌─────────────────────────┐
│  FastFood Manager       │
│  Đăng nhập vào hệ thống │
│                         │
│  Email                  │
│  [nhập email______]     │
│                         │
│  Mật khẩu              │
│  [••••••••]            │
│                         │
│  [  Đăng Nhập  ]       │
└─────────────────────────┘
```

**After:**
```
┌─────────────────────────┐
│  FastFood Manager       │
│  Đăng nhập vào hệ thống │
│                         │
│  Tên đăng nhập         │
│  [nhập tên đăng nhập_]  │
│                         │
│  Mật khẩu              │
│  [••••••••]            │
│                         │
│  [  Đăng Nhập  ]       │
│                         │
│  📝 Tài khoản demo:    │
│  [Admin][Thu Ngân][Kho]│
└─────────────────────────┘
```

---

## 📚 Liên quan

- `CREATE_ADMIN_ACCOUNT_GUIDE.md` - Hướng dẫn tạo tài khoản
- `AUTH_GUIDE.md` - Tài liệu authentication system
- `fastfood/fastfood/Controllers/AuthController.cs` - Backend authentication
- `fastfood/fastfood/Controllers/EmployeesController.cs` - Employee management

---

**Updated**: November 14, 2025  
**Status**: ✅ COMPLETED  
**Build**: ✅ No errors  
**Testing**: ✅ Ready for use

