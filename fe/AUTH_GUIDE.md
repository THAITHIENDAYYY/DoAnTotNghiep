# 🔐 Hệ Thống Phân Quyền - Hướng Dẫn

## 📋 Tổng Quan

Hệ thống quản lý fastfood có 3 vai trò (roles) với quyền truy cập khác nhau:

### 1. **👑 Admin** (Quản lý)
- **Quyền:** Toàn quyền truy cập tất cả các trang
- **Các trang có thể truy cập:**
  - 📊 Dashboard
  - 🖥️ Quầy Thu Ngân (POS)
  - 📁 Danh Mục
  - 🍔 Sản Phẩm
  - 🧂 Kho Nguyên Liệu
  - 🛒 Đơn Hàng
  - 👥 Khách Hàng
  - 🪑 Bàn
  - 💼 Nhân Viên

### 2. **💰 Cashier** (Thu Ngân)
- **Quyền:** Chỉ có thể truy cập trang POS và các trang liên quan
- **Các trang có thể truy cập:**
  - 🖥️ Quầy Thu Ngân (POS)
  - 💳 Thanh Toán
  - 🍽️ Bàn
  - 📋 Quản Lý Ca

### 3. **📦 WarehouseStaff** (Nhân Viên Kho)
- **Quyền:** Chỉ có thể truy cập trang Kho Nguyên Liệu
- **Các trang có thể truy cập:**
  - 🧂 Kho Nguyên Liệu

---

## 🚀 Cách Sử Dụng

### **Đăng Nhập**
1. Truy cập: `http://localhost:5173/login`
2. Sử dụng một trong các tài khoản demo sau:

#### **Tài khoản Admin:**
```
Email: admin@example.com
Password: admin123
```

#### **Tài khoản Thu Ngân:**
```
Email: cashier@example.com
Password: cashier123
```

#### **Tài khoản Nhân Viên Kho:**
```
Email: warehouse@example.com
Password: warehouse123
```

### **Đăng Xuất**
- Click nút **"🚪 Đăng Xuất"** ở cuối sidebar (bên trái màn hình)

---

## 🔒 Cơ Chế Bảo Vệ

### **Protected Routes**
- Tất cả các trang đều được bảo vệ bằng `ProtectedRoute` component
- Nếu chưa đăng nhập → tự động redirect về `/login`
- Nếu không có quyền truy cập → tự động redirect về trang phù hợp với role

### **Role-Based Menu**
- Menu sidebar tự động hiển thị các mục phù hợp với role của user
- Admin: thấy tất cả menu
- Cashier: chỉ thấy menu POS
- WarehouseStaff: chỉ thấy menu Kho Nguyên Liệu

---

## 🛠️ Tích Hợp Backend (TODO - Future)

Hiện tại hệ thống dùng **demo accounts** (hard-coded). Để tích hợp backend thực tế:

### **Cập nhật `AuthContext.tsx`:**
```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    // Gọi API backend để authenticate
    const response = await axios.post('http://localhost:5268/api/auth/login', {
      email,
      password
    });

    const { token, user } = response.data;
    
    // Lưu token
    localStorage.setItem('authToken', token);
    
    // Lưu user info
    setUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return true;
  } catch (error) {
    return false;
  }
};
```

### **Backend API cần trả về:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "fullName": "Admin User",
    "role": 1,
    "roleName": "Admin"
  }
}
```

---

## 🎨 UI Features

### **Sidebar User Info**
- Hiển thị avatar (chữ cái đầu của tên)
- Hiển thị tên đầy đủ
- Hiển thị vai trò (role badge)

### **Header User Info**
- Hiển thị "Xin chào, [Tên User]" ở góc phải header

### **Login Page**
- Form đăng nhập với validation
- Nút quick-fill cho tài khoản demo
- Responsive design
- Gradient background đẹp mắt

---

## 📁 Cấu Trúc File

```
fe/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context & logic
│   ├── components/
│   │   ├── Layout.tsx                # Main layout with role-based menu
│   │   ├── Layout.css
│   │   └── ProtectedRoute.tsx        # Route protection component
│   ├── pages/
│   │   ├── LoginPage.tsx             # Login page
│   │   ├── LoginPage.css
│   │   └── ... (other pages)
│   └── App.tsx                       # Routes with protection
```

---

## ⚙️ Configuration

### **Roles Enum:**
```typescript
export enum UserRole {
  Admin = 1,           // Quản lý tất cả
  Cashier = 2,         // Thu ngân - chỉ vào POS
  WarehouseStaff = 3   // Nhân viên kho - chỉ vào Ingredients
}
```

### **Backend Roles (Employee.cs):**
```csharp
public enum EmployeeRole
{
    Admin = 1,           // Quản lý tất cả
    Cashier = 2,         // Thu ngân
    WarehouseStaff = 3   // Nhân viên kho
}
```

---

## 🔍 Testing

### **Test Flow:**

1. **Login as Admin** → Kiểm tra có thể truy cập tất cả trang
2. **Logout → Login as Cashier** → Kiểm tra chỉ thấy menu POS
3. **Thử truy cập URL `/products` trực tiếp** → Tự động redirect về `/pos`
4. **Logout → Login as WarehouseStaff** → Kiểm tra chỉ thấy menu Nguyên Liệu
5. **Logout → Truy cập `/`** → Tự động redirect về `/login`

---

## 🚨 Notes

- ⚠️ Tài khoản demo là **HARD-CODED** - chỉ để testing
- ⚠️ Trong production cần tích hợp với backend API thực
- ⚠️ Token authentication (JWT) cần được implement cho production
- ⚠️ Remember to add refresh token logic
- ⚠️ Add password reset functionality

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng liên hệ team development.

**Happy Coding! 🍔**

