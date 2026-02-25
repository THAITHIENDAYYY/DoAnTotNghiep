# 🚀 Hướng Dẫn Deploy Nhanh

## 📝 Tóm Tắt

Để deploy và truy cập từ điện thoại, bạn cần:

1. **Backend**: Deploy lên Render (miễn phí)
2. **Frontend**: Deploy lên Vercel hoặc Netlify (miễn phí)
3. **Database**: Azure SQL hoặc Render PostgreSQL (miễn phí)

## ⚡ Quick Start

### 1. Deploy Backend (Render)

1. Đăng ký: https://render.com
2. New → Web Service → Connect GitHub
3. Chọn repository → Branch: `main`
4. Root Directory: `fastfood/fastfood`
5. Build Command: `dotnet restore && dotnet publish -c Release -o ./publish`
6. Start Command: `dotnet ./publish/fastfood.dll`
7. Thêm Environment Variables:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   ASPNETCORE_URLS=http://0.0.0.0:$PORT
   ConnectionStrings__DefaultConnection=your-connection-string
   Cors__AllowedOrigins__0=https://your-frontend-url.vercel.app
   ```
8. Lưu URL backend (ví dụ: `https://fastfood-api.onrender.com`)

### 2. Deploy Frontend (Vercel)

1. Đăng ký: https://vercel.com
2. Add New → Project → Import GitHub
3. Root Directory: `fe`
4. Framework: Vite
5. Thêm Environment Variable:
   ```
   VITE_API_BASE_URL=https://fastfood-api.onrender.com/api
   ```
6. Deploy → Lưu URL frontend

### 3. Cập Nhật CORS

Quay lại Render, cập nhật:
```
Cors__AllowedOrigins__0=https://your-frontend-url.vercel.app
```

Redeploy backend.

## 📱 Truy Cập Từ Điện Thoại

1. Mở trình duyệt trên điện thoại
2. Truy cập URL frontend
3. PWA sẽ tự động hiển thị option "Add to Home Screen"
4. Cài đặt như app native

## 📚 Chi Tiết

Xem file `DEPLOYMENT_GUIDE.md` để biết hướng dẫn chi tiết.

