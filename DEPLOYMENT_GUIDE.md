# 🚀 Hướng Dẫn Deploy Hệ Thống Fast Food

Hướng dẫn chi tiết để deploy ứng dụng lên các nền tảng miễn phí và truy cập từ điện thoại.

## 📋 Tổng Quan

- **Frontend**: React + TypeScript + Vite (Deploy trên Vercel)
- **Backend**: .NET 8.0 Web API (Deploy trên Render)
- **Database**: SQL Server (Azure SQL hoặc Render PostgreSQL)

## 🎯 Mục Tiêu

Sau khi deploy, bạn sẽ có:
- ✅ URL chuyên nghiệp cho frontend: `https://fastfood-app.vercel.app`
- ✅ URL chuyên nghiệp cho backend: `https://fastfood-api.onrender.com`
- ✅ Truy cập được từ điện thoại, máy tính bảng, desktop
- ✅ **Web App**: Hoạt động như trang web bình thường trong trình duyệt
- ✅ **Responsive Design**: Tự động điều chỉnh cho mọi kích thước màn hình
- ✅ **Không cần cài đặt**: Sử dụng trực tiếp qua trình duyệt

---

## 📦 Bước 1: Chuẩn Bị Database

### Option 1: Azure SQL Database (Miễn phí - Khuyến nghị)

1. Đăng ký Azure Free Account: https://azure.microsoft.com/free/image.png
2. Tạo Azure SQL Database:
   - Vào Azure Portal → Create Resource → SQL Database
   - Chọn Free Tier (DTU-based, 5 DTU)
   - Lưu connection string

### Option 2: Render PostgreSQL (Miễn phí)

1. Đăng ký Render: https://render.com
2. Tạo PostgreSQL Database:
   - New → PostgreSQL
   - Chọn Free Tier
   - Lưu connection string

**Lưu ý**: Nếu dùng PostgreSQL, cần cài thêm package:
```bash
cd fastfood/fastfood
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
```

---

## 🔧 Bước 2: Deploy Backend (Render)

### 2.1. Chuẩn Bị Code

1. Đảm bảo code đã commit lên GitHub/GitLab
2. Kiểm tra file `render.yaml` đã có trong project

### 2.2. Tạo Service trên Render

1. Đăng nhập Render: https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect repository GitHub/GitLab của bạn
4. Cấu hình:
   - **Name**: `fastfood-api`
   - **Environment**: `Docker` hoặc `Native`
   - **Region**: Chọn gần nhất (Singapore recommended)
   - **Branch**: `main` hoặc `master`
   - **Root Directory**: `fastfood/fastfood`
   - **Build Command**: 
     ```bash
     dotnet restore && dotnet publish -c Release -o ./publish
     ```
   - **Start Command**: 
     ```bash
     dotnet ./publish/fastfood.dll
     ```

### 2.3. Cấu Hình Environment Variables

Thêm các biến môi trường trong Render Dashboard:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Database Connection String
ConnectionStrings__DefaultConnection=Server=your-server;Database=fastfoodma;User Id=your-user;Password=your-password;TrustServerCertificate=True;

# CORS - Thêm URL frontend sau khi deploy
Cors__AllowedOrigins__0=https://fastfood-app.vercel.app
Cors__AllowedOrigins__1=https://fastfood-app.netlify.app

# JWT (giữ nguyên hoặc tạo mới)
Jwt__Key=YourSuperSecretKeyThatIsAtLeast32CharactersLongForProduction!
Jwt__Issuer=FastFoodAPI
Jwt__Audience=FastFoodClient
```

### 2.4. Lưu URL Backend

Sau khi deploy xong, Render sẽ cung cấp URL:
```
https://fastfood-api.onrender.com
```

**Lưu ý**: Render Free Tier có thể sleep sau 15 phút không hoạt động. Để tránh, có thể dùng:
- UptimeRobot (miễn phí) để ping mỗi 5 phút
- Hoặc upgrade lên paid plan

---

## 🎨 Bước 3: Deploy Frontend (Vercel)

### 3.1. Chuẩn Bị Code

1. Đảm bảo code đã commit lên GitHub/GitLab
2. Kiểm tra file `vercel.json` đã có trong project

### 3.2. Tạo Project trên Vercel

1. Đăng nhập Vercel: https://vercel.com
2. Click **Add New** → **Project**
3. Import repository GitHub/GitLab của bạn
4. Cấu hình:
   - **Framework Preset**: Vite
   - **Root Directory**: `fe`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3. Cấu Hình Environment Variables

Thêm biến môi trường trong Vercel Dashboard:

```
VITE_API_BASE_URL=https://fastfood-api.onrender.com/api
```

**Lưu ý**: Thay `fastfood-api.onrender.com` bằng URL backend thực tế của bạn.

### 3.4. Deploy

1. Click **Deploy**
2. Đợi build xong (thường 2-3 phút)
3. Vercel sẽ cung cấp URL:
   ```
   https://fastfood-app.vercel.app
   ```
   (hoặc tên khác tùy bạn đặt)

### 3.5. Cập Nhật CORS Backend

Quay lại Render Dashboard, cập nhật CORS:
```
Cors__AllowedOrigins__0=https://fastfood-app.vercel.app
```

Redeploy backend để áp dụng thay đổi.

---

## 📱 Bước 4: Kiểm Tra và Sử Dụng

### 4.1. Kiểm Tra trên Desktop

1. Mở trình duyệt, truy cập: `https://fastfood-app.vercel.app`
2. Kiểm tra đăng nhập, các tính năng hoạt động
3. Ứng dụng hoạt động như web bình thường trong trình duyệt

### 4.2. Kiểm Tra trên Điện Thoại

1. Mở trình duyệt trên điện thoại (Chrome, Safari, Firefox)
2. Truy cập: `https://fastfood-app.vercel.app`
3. Ứng dụng sẽ hiển thị như trang web bình thường
4. **Không có prompt cài đặt app** - hoạt động hoàn toàn trong trình duyệt
5. Responsive design tự động điều chỉnh cho màn hình nhỏ
6. Hamburger menu (☰) ở góc trên bên trái để mở/đóng sidebar

### 4.3. Tính Năng Mobile

- ✅ **Responsive Design**: Tự động điều chỉnh layout cho mobile
- ✅ **Hamburger Menu**: Menu sidebar có thể ẩn/hiện trên mobile
- ✅ **Touch Friendly**: Tất cả buttons và controls dễ dùng trên màn hình cảm ứng
- ✅ **Web Standard**: Hoạt động như web bình thường, không cần cài đặt

---

## 🔄 Bước 5: Cập Nhật Database Schema

Sau khi có database mới, cần chạy migrations:

### Option 1: Chạy Migrations trên Local

1. Cập nhật connection string trong `appsettings.json` (tạm thời)
2. Chạy:
   ```bash
   cd fastfood/fastfood
   dotnet ef database update
   ```
3. Hoặc tạo database script và chạy trên Azure/Render

### Option 2: Sử dụng EF Migrations Script

```bash
cd fastfood/fastfood
dotnet ef migrations script -o migration.sql
```

Sau đó chạy file `migration.sql` trên database mới.

---

## 🛠️ Troubleshooting

### Backend không kết nối được database

- Kiểm tra connection string
- Kiểm tra firewall rules (Azure SQL)
- Kiểm tra SSL/TLS settings

### CORS Error

- Kiểm tra `Cors__AllowedOrigins` trong Render
- Đảm bảo URL frontend chính xác (có https://)
- Redeploy backend sau khi thay đổi

### Frontend không gọi được API

- Kiểm tra `VITE_API_BASE_URL` trong Vercel
- Kiểm tra Network tab trong DevTools
- Kiểm tra backend có đang chạy không

### Render Free Tier Sleep

- Sử dụng UptimeRobot để ping mỗi 5 phút
- Hoặc upgrade lên paid plan ($7/tháng)

---

## 📊 Tổng Kết URLs

Sau khi deploy xong, bạn sẽ có:

- **Frontend**: `https://fastfood-app.vercel.app`
- **Backend API**: `https://fastfood-api.onrender.com`
- **Swagger Docs**: `https://fastfood-api.onrender.com/swagger`

---

## 🎉 Hoàn Thành!

Bây giờ bạn có thể:
- ✅ Truy cập từ bất kỳ thiết bị nào (điện thoại, máy tính, tablet)
- ✅ Cài đặt như app native (PWA)
- ✅ Sử dụng URL chuyên nghiệp thay vì localhost
- ✅ Chia sẻ với người khác để test

**Lưu ý**: 
- Render Free Tier có thể chậm khi wake up từ sleep
- Vercel Free Tier rất tốt, không có giới hạn nghiêm trọng
- Database Free Tier có giới hạn, nhưng đủ cho demo/đồ án

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. Logs trong Render Dashboard
2. Logs trong Vercel Dashboard
3. Browser Console (F12)
4. Network tab trong DevTools

Chúc bạn deploy thành công! 🚀

