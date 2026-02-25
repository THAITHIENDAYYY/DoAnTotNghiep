# HƯỚNG DẪN CÀI ĐẶT HỆ THỐNG QUẢN LÝ THỨC ĂN NHANH

## 📋 MỤC LỤC
1. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
2. [Cài đặt công cụ cần thiết](#cài-đặt-công-cụ-cần-thiết)
3. [Cài đặt Backend (API)](#cài-đặt-backend-api)
4. [Cài đặt Frontend](#cài-đặt-frontend)
5. [Chạy ứng dụng](#chạy-ứng-dụng)
6. [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)

---

## 🖥️ YÊU CẦU HỆ THỐNG

### Phần cứng tối thiểu:
- **CPU**: Intel Core i3 hoặc tương đương
- **RAM**: 4GB (khuyến nghị 8GB)
- **Ổ cứng**: 5GB dung lượng trống

### Hệ điều hành:
- Windows 10/11
- macOS 10.15 trở lên
- Linux (Ubuntu 20.04 trở lên)

---

## 🛠️ CÀI ĐẶT CÔNG CỤ CẦN THIẾT

### 1. Cài đặt .NET 8.0 SDK

**Windows/macOS/Linux:**
1. Truy cập: https://dotnet.microsoft.com/download/dotnet/8.0
2. Tải và cài đặt **.NET 8.0 SDK**
3. Kiểm tra cài đặt thành công:
```bash
dotnet --version
```
Kết quả phải hiển thị: `8.0.x` hoặc cao hơn

### 2. Cài đặt SQL Server

#### Windows:
1. Tải **SQL Server 2019 Express** hoặc mới hơn từ:
   https://www.microsoft.com/sql-server/sql-server-downloads
2. Cài đặt với các tùy chọn mặc định
3. Cài đặt **SQL Server Management Studio (SSMS)** để quản lý database:
   https://aka.ms/ssmsfullsetup

#### macOS/Linux:
1. Sử dụng Docker để chạy SQL Server:
```bash
docker pull mcr.microsoft.com/mssql/server:2022-latest
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
   -p 1433:1433 --name sqlserver --hostname sqlserver \
   -d mcr.microsoft.com/mssql/server:2022-latest
```

2. Hoặc cài đặt trực tiếp (Ubuntu/Linux):
```bash
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2022.list)"
sudo apt-get update
sudo apt-get install -y mssql-server
sudo /opt/mssql/bin/mssql-conf setup
```

### 3. Cài đặt Node.js & npm

**Windows/macOS/Linux:**
1. Truy cập: https://nodejs.org/
2. Tải và cài đặt phiên bản **LTS** (khuyến nghị 18.x hoặc 20.x)
3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

### 4. Cài đặt Git (nếu chưa có)

**Windows:**
- Tải từ: https://git-scm.com/download/win

**macOS:**
```bash
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install git
```

---

## 🔧 CÀI ĐẶT BACKEND (API)

### Bước 1: Clone hoặc Copy project

Nếu sử dụng Git:
```bash
git clone <repository-url>
cd DoAnTotNghiep
```

Hoặc copy toàn bộ thư mục project vào máy mới.

### Bước 2: Cấu hình Connection String

1. Mở file `fastfood/fastfood/appsettings.json`
2. Sửa **ConnectionStrings** theo thông tin SQL Server của bạn:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=TEN_SERVER;Database=fastfoodma;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

**Lưu ý:**
- Thay `TEN_SERVER` bằng tên SQL Server của bạn
  - Windows: Thường là `localhost` hoặc `.\SQLEXPRESS` hoặc `MSI` (tên máy)
  - Docker: `localhost,1433`
  
**Ví dụ các trường hợp:**

```json
// SQL Server Express (Windows)
"DefaultConnection": "Server=.\\SQLEXPRESS;Database=fastfoodma;Trusted_Connection=True;TrustServerCertificate=True;"

// SQL Server thường (Windows với Windows Authentication)
"DefaultConnection": "Server=localhost;Database=fastfoodma;Trusted_Connection=True;TrustServerCertificate=True;"

// SQL Server với SQL Authentication
"DefaultConnection": "Server=localhost;Database=fastfoodma;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;"

// SQL Server trên Docker
"DefaultConnection": "Server=localhost,1433;Database=fastfoodma;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;"
```

### Bước 3: Restore packages

Mở terminal/command prompt tại thư mục `fastfood/fastfood`:

```bash
cd fastfood/fastfood
dotnet restore
```

### Bước 4: Tạo Database và chạy Migrations

```bash
# Tạo database và áp dụng migrations
dotnet ef database update
```

**Nếu gặp lỗi "dotnet ef not found"**, cài đặt công cụ EF:
```bash
dotnet tool install --global dotnet-ef
```

### Bước 5: Tạo tài khoản Admin đầu tiên

Sau khi database đã được tạo, chạy lệnh sau để tạo tài khoản admin:

**Cách 1: Sử dụng Swagger UI**
1. Chạy backend (xem [Chạy ứng dụng](#chạy-ứng-dụng))
2. Truy cập: http://localhost:5177/swagger
3. Sử dụng endpoint `POST /api/Employees` để tạo admin

**Cách 2: Chạy SQL Script trực tiếp**

Mở SSMS hoặc công cụ quản lý SQL, kết nối vào database `fastfoodma` và chạy:

```sql
-- Tạo admin account
INSERT INTO Employees (FullName, Username, Email, PhoneNumber, Role, PasswordHash, Status, CreatedAt)
VALUES (
    N'Administrator',
    'admin',
    'admin@fastfood.com',
    '0123456789',
    'Admin',
    '$2a$11$YourHashedPasswordHere', -- Mật khẩu: admin123 (sẽ cần hash)
    'Active',
    GETDATE()
);
```

**Lưu ý**: Để hash mật khẩu, tốt nhất là sử dụng API endpoint hoặc xem file `CREATE_ADMIN_ACCOUNT_GUIDE.md` để biết chi tiết.

### Bước 6: Build Backend

```bash
dotnet build
```

---

## 🎨 CÀI ĐẶT FRONTEND

### Bước 1: Di chuyển vào thư mục Frontend

```bash
cd fe
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

**Nếu gặp lỗi**, thử xóa cache và cài lại:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Bước 3: Cấu hình API URL

1. Mở file `fe/src/api/axios.ts` (hoặc file config tương tự)
2. Kiểm tra baseURL đang trỏ đúng địa chỉ backend:

```typescript
const API_BASE_URL = 'http://localhost:5177/api';
```

**Lưu ý**: Port mặc định của backend là `5177`, kiểm tra file `fastfood/fastfood/Properties/launchSettings.json` để xác nhận port chính xác.

### Bước 4: Build Frontend (optional)

Để chạy production build:
```bash
npm run build
```

---

## 🚀 CHẠY ỨNG DỤNG

### Chạy Backend (API)

**Cách 1: Chạy trong Development Mode**

Mở terminal tại `fastfood/fastfood`:
```bash
dotnet run
```

Hoặc với hot reload:
```bash
dotnet watch run
```

Backend sẽ chạy tại: **http://localhost:5177**
- API Swagger: http://localhost:5177/swagger

**Cách 2: Chạy bằng Visual Studio**
1. Mở file `fastfood/fastfood.sln` bằng Visual Studio
2. Chọn project `fastfood` làm startup project
3. Nhấn F5 hoặc click nút Run

### Chạy Frontend

Mở terminal tại `fe`:
```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

### Đăng nhập hệ thống

Truy cập: http://localhost:5173

**Tài khoản mặc định:**
- Username: `admin`
- Password: `admin123` (hoặc mật khẩu bạn đã tạo)

---

## 🐛 XỬ LÝ LỖI THƯỜNG GẶP

### 1. Lỗi kết nối SQL Server

**Lỗi:** `A network-related or instance-specific error occurred`

**Giải pháp:**
1. Kiểm tra SQL Server đã chạy chưa:
   - Windows: Services → SQL Server (MSSQLSERVER) → Start
2. Kiểm tra SQL Server Browser đã bật:
   - Services → SQL Server Browser → Start
3. Kiểm tra TCP/IP đã enable:
   - SQL Server Configuration Manager → SQL Server Network Configuration → Protocols → TCP/IP → Enable
4. Kiểm tra firewall cho phép port 1433

### 2. Lỗi "dotnet ef not found"

```bash
dotnet tool install --global dotnet-ef
dotnet tool update --global dotnet-ef
```

### 3. Lỗi CORS khi gọi API

**Lỗi:** `Access to XMLHttpRequest blocked by CORS policy`

**Giải pháp:**
1. Kiểm tra backend đang chạy
2. Kiểm tra `appsettings.json` có đúng port frontend:
```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",
    "http://localhost:3000"
  ]
}
```

### 4. Lỗi port đã được sử dụng

**Backend:**
```bash
# Tìm process đang dùng port 5177 (Windows)
netstat -ano | findstr :5177
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5177 | xargs kill -9
```

**Frontend:**
```bash
# Tìm và kill process port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill -9
```

### 5. Lỗi npm install trên Windows

```bash
# Chạy PowerShell/CMD as Administrator
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm install
```

### 6. Database Migration lỗi

```bash
# Xóa database và tạo lại
dotnet ef database drop
dotnet ef database update
```

### 7. Lỗi SSL/Certificate

Nếu gặp lỗi certificate khi chạy backend:
```bash
dotnet dev-certs https --trust
```

---

## 📚 TÀI LIỆU THAM KHẢO THÊM

- `CREATE_ADMIN_ACCOUNT_GUIDE.md` - Hướng dẫn tạo tài khoản admin
- `DEPLOYMENT_GUIDE.md` - Hướng dẫn deploy lên production
- `HUONG_DAN_SU_DUNG.md` - Hướng dẫn sử dụng hệ thống
- `API_SETUP_COMPLETE.md` - Chi tiết về API endpoints

---

## 🎯 KIỂM TRA HỆ THỐNG

Sau khi cài đặt xong, kiểm tra các điểm sau:

### Backend:
- ✅ Truy cập được Swagger: http://localhost:5177/swagger
- ✅ API trả về response (test với endpoint GET /api/Categories)

### Frontend:
- ✅ Trang web load được: http://localhost:5173
- ✅ Trang đăng nhập hiển thị
- ✅ Đăng nhập thành công với tài khoản admin

### Database:
- ✅ Database `fastfoodma` đã được tạo
- ✅ Các bảng đã có trong database (Categories, Products, Orders, etc.)
- ✅ Có ít nhất 1 tài khoản admin trong bảng Employees

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề trong quá trình cài đặt:

1. Kiểm tra lại từng bước trong hướng dẫn
2. Xem phần [Xử lý lỗi thường gặp](#xử-lý-lỗi-thường-gặp)
3. Kiểm tra log lỗi trong terminal/console
4. Tham khảo các file README khác trong project

---

## 📝 GHI CHÚ

- **Port mặc định:**
  - Backend: 5177
  - Frontend: 5173
  - SQL Server: 1433

- **Thông tin đăng nhập mặc định:**
  - Admin username: `admin`
  - Admin password: `admin123`

- **Khuyến nghị bảo mật:**
  - Đổi JWT Key trong `appsettings.json` trước khi deploy production
  - Đổi password admin sau lần đăng nhập đầu tiên
  - Sử dụng HTTPS trong môi trường production

---

**Chúc bạn cài đặt thành công! 🎉**

