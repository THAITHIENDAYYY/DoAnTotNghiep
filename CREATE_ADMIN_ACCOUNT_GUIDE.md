# 🔐 HƯỚNG DẪN TẠO TÀI KHOẢN ADMIN

## Phương án 1: Tạo qua API (KHUYẾN NGHỊ) ⭐

### Bước 1: Tạo Employee với Role Admin

Mở file `fastfood/fastfood/Employees.http` và chạy request sau:

```http
### Tạo Employee Admin
POST https://localhost:5001/api/Employees
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "System",
  "email": "admin@fastfood.com",
  "phoneNumber": "0123456789",
  "address": "123 Main Street",
  "dateOfBirth": "1990-01-01",
  "hireDate": "2024-01-01",
  "salary": 20000000,
  "salaryType": 1,
  "role": 1,
  "status": 1
}
```

**Response sẽ trả về ID của employee** (ví dụ: `id: 1`)

---

### Bước 2: Tạo tài khoản đăng nhập cho Employee

Sử dụng `EmployeeAccount.http`:

```http
### Tạo tài khoản đăng nhập cho Admin
POST https://localhost:5001/api/Employees/1/create-account
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Lưu ý**: Thay `1` bằng ID employee vừa tạo ở bước 1.

---

### Bước 3: Đăng nhập

Truy cập: `http://localhost:3000/login`

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`

---

## Phương án 2: Tạo trực tiếp trong Database SQL

### Bước 1: Mở SQL Server Management Studio

Kết nối đến database `fastfoodma`

### Bước 2: Chạy SQL Script

s

-- 5. Kiểm tra kết quả
SELECT 
    e.Id, 
    e.FirstName, 
    e.LastName, 
    e.Email, 
    e.Role, 
    e.UserId,
    u.UserName
FROM Employees e
LEFT JOIN AspNetUsers u ON e.UserId = u.Id
WHERE e.Email = 'admin@fastfood.com';
```

---

### Bước 3: Đăng nhập

Truy cập: `http://localhost:3000/login`

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`

---

## Phương án 3: Tạo qua Swagger UI (Dễ nhất) 🎯

### Bước 1: Mở Swagger

Truy cập: `https://localhost:5001/swagger`

### Bước 2: Tạo Employee

1. Tìm endpoint: `POST /api/Employees`
2. Click **"Try it out"**
3. Paste JSON:

```json
{
  "firstName": "Admin",
  "lastName": "System",
  "email": "admin@fastfood.com",
  "phoneNumber": "0123456789",
  "address": "123 Main Street",
  "dateOfBirth": "1990-01-01",
  "hireDate": "2024-01-01",
  "salary": 20000000,
  "salaryType": 1,
  "role": 1,
  "status": 1
}
```

4. Click **"Execute"**
5. **Copy ID** từ response (ví dụ: `"id": 1`)

---

### Bước 3: Tạo Account

1. Tìm endpoint: `POST /api/Employees/{id}/create-account`
2. Nhập ID vừa copy vào `{id}` (ví dụ: `1`)
3. Click **"Try it out"**
4. Paste JSON:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

5. Click **"Execute"**

---

### Bước 4: Đăng nhập

Truy cập: `http://localhost:3000/login`

**Thông tin đăng nhập:**
- Username: `admin`
- Password: `admin123`

---

## 🎯 QUICK START (Nhanh nhất)

Nếu backend đang chạy, làm theo 3 bước này:

### 1. Mở Terminal mới, chạy:

```bash
curl -X POST "https://localhost:5001/api/Employees" ^
  -H "Content-Type: application/json" ^
  -d "{\"firstName\":\"Admin\",\"lastName\":\"System\",\"email\":\"admin@fastfood.com\",\"phoneNumber\":\"0123456789\",\"address\":\"123 Main Street\",\"dateOfBirth\":\"1990-01-01\",\"hireDate\":\"2024-01-01\",\"salary\":20000000,\"salaryType\":1,\"role\":1,\"status\":1}" ^
  -k
```

**Copy ID từ response** (ví dụ: `"id":1`)

---

### 2. Tạo account (thay `1` bằng ID vừa lấy):

```bash
curl -X POST "https://localhost:5001/api/Employees/1/create-account" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^
  -k
```

---

### 3. Đăng nhập tại: `http://localhost:3000/login`

**Username:** `admin`  
**Password:** `admin123`

---

## ✅ XÁC NHẬN TÀI KHOẢN ĐÃ TẠO THÀNH CÔNG

### Test Login API:

```bash
curl -X POST "https://localhost:5001/api/Auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}" ^
  -k
```

**Response thành công:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "...",
  "username": "admin",
  "fullName": "Admin System",
  "email": "admin@fastfood.com",
  "role": 1,
  "roleName": "Admin"
}
```

---

## 📋 THÔNG TIN TÀI KHOẢN MẪU

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |
| **Email** | `admin@fastfood.com` |
| **Role** | Admin (full access) |
| **Name** | Admin System |

---

## ⚠️ TROUBLESHOOTING

### Lỗi: "Tên đăng nhập đã tồn tại"
→ Username `admin` đã được tạo. Thử username khác hoặc xóa user cũ.

### Lỗi: "Nhân viên đã có tài khoản đăng nhập"
→ Employee này đã có account. Dùng endpoint change-password để đổi mật khẩu.

### Lỗi kết nối API
→ Kiểm tra backend có đang chạy: `https://localhost:5001/swagger`

### Không đăng nhập được
→ Kiểm tra trong database:
```sql
SELECT e.*, u.UserName 
FROM Employees e
LEFT JOIN AspNetUsers u ON e.UserId = u.Id
WHERE e.Email = 'admin@fastfood.com';
```

---

## 🚀 SAU KHI ĐĂNG NHẬP THÀNH CÔNG

Bạn sẽ có quyền truy cập:
- ✅ Dashboard
- ✅ Reports
- ✅ Payments
- ✅ Employees Management
- ✅ Products, Categories, Ingredients
- ✅ Orders, Customers
- ✅ Tables Management
- ✅ POS System
- ✅ All Admin Features

---

**Created**: November 14, 2025  
**Status**: Ready to use  
**Backend**: https://localhost:5001  
**Frontend**: http://localhost:3000

