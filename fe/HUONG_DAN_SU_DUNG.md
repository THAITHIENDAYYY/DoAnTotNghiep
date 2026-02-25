# 📖 Hướng Dẫn Sử Dụng

## 🚀 Chạy Dự Án

### 1. Cài Đặt Dependencies

```bash
cd fe
npm install
```

### 2. Chạy Backend API (Ứng dụng khác)

Mở một terminal mới và chạy backend:

```bash
cd ..\fastfood\fastfood
dotnet run
```

Backend sẽ chạy tại: `http://localhost:5000` hoặc `https://localhost:5001`

### 3. Chạy Frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 🔧 Cấu Hình

### Thay Đổi Port Backend

Nếu backend chạy ở port khác, sửa file `vite.config.ts`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000', // Thay đổi port này
      changeOrigin: true
    }
  }
}
```

## 📦 Các Lệnh NPM

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 🎯 Bước Tiếp Theo

1. Tạo các components cho từng tính năng
2. Setup routing với React Router
3. Tạo API service layer
4. Implement authentication
5. Thêm UI/UX components

## 💡 Gợi Ý Phát Triển

### Cấu Trúc Thư Mục Đề Xuất

```
src/
├── components/
│   ├── common/      # Common components (Button, Card, etc.)
│   ├── layout/      # Layout components (Header, Sidebar, etc.)
│   ├── categories/   # Category management
│   ├── products/     # Product management
│   ├── orders/       # Order management
│   ├── customers/    # Customer management
│   └── employees/    # Employee management
├── services/         # API services
├── types/            # TypeScript types
├── utils/            # Utility functions
├── hooks/            # Custom React hooks
└── contexts/         # React contexts
```

### Cài Đặt Thêm (Optional)

```bash
# UI Library
npm install @mui/material @emotion/react @emotion/styled

# Hoặc
npm install tailwindcss postcss autoprefixer

# Icons
npm install @mui/icons-material
# Hoặc
npm install react-icons
```

## 🐛 Xử Lý Lỗi

### Lỗi CORS
Nếu gặp lỗi CORS, đảm bảo backend có cấu hình CORS:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

app.UseCors("AllowAll");
```

### Lỗi Service Worker
Nếu PWA không hoạt động, kiểm tra:
1. Đã cài đặt `vite-plugin-pwa`?
2. Build production với `npm run build`
3. Xem console để debug

## 📱 Test PWA

1. Build production: `npm run build`
2. Preview: `npm run preview`
3. Mở browser và kiểm tra:
   - Service worker đã được đăng ký
   - Có thể cài đặt như app
   - Hoạt động offline

## 🔗 Tài Liệu Tham Khảo

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vite.dev/guide/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [React Router](https://reactrouter.com/)

