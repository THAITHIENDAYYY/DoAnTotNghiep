# 🔍 Hướng Dẫn Debug API Issues

## Vấn Đề Đã Fix

### 1. ❌ Backend Không Có CORS
**Problem:** Frontend không thể call API vì CORS policy

**Fix:**
- ✅ Đã thêm CORS vào `fastfood/fastfood/Program.cs`
- ✅ Policy: AllowAll (cho phép tất cả origin, method, header)

### 2. 📝 Thêm Console Logs
**Fix:**
- ✅ Request logs: `🚀 API Request`
- ✅ Response logs: `✅ API Response`
- ✅ Error logs: `❌ API Error`

## Cách Debug

### Bước 1: Restart Backend

```bash
cd fastfood/fastfood
dotnet run
```

Hoặc nếu backend đang chạy, dừng lại và chạy lại.

**Kiểm tra:**
- Backend phải chạy trên `https://localhost:7141`
- Hoặc `http://localhost:5268`

### Bước 2: Check Browser Console

Mở browser và:
1. F12 mở DevTools
2. Tab Console
3. Click vào trang Categories
4. Xem logs:

**Nếu thấy:**
```
🚀 API Request: GET /Categories
❌ API Error: Failed to fetch
```
→ **Backend không chạy hoặc CORS chưa được apply**

**Nếu thấy:**
```
🚀 API Request: GET /Categories
✅ API Response: 200 /Categories [array data]
```
→ **API hoạt động tốt**

**Nếu thấy:**
```
🚀 API Request: GET /Categories
❌ API Error: 404 Not Found
```
→ **URL sai hoặc controller không tồn tại**

## Kiểm Tra Backend

### Test API Trực Tiếp

Mở browser và vào:
- Swagger: `https://localhost:7141/swagger`
- Test API: `https://localhost:7141/api/Categories`

Nếu backend chạy đúng:
- ✅ Swagger page mở được
- ✅ GET /api/Categories trả về JSON data

## Common Issues

### Issue 1: SSL Certificate Error

**Error trong console:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solution:**
- Backend dùng self-signed cert
- Click "Advanced" → "Proceed to localhost" trong browser
- Hoặc chạy trên HTTP: `http://localhost:5268`

### Issue 2: Call API Nhưng Không Có Data

**Check:**
1. Backend có đang chạy không?
2. Database có data không?
3. Console có error không?

**Test SQL:**
```sql
SELECT * FROM Categories;
```

### Issue 3: Tên Đã Tồn Tại

**Kiểm tra:**
1. Backend kiểm tra case-insensitive
2. "Nước ngọt" = "nước ngọt" = "NƯỚC NGỌT"
3. Xóa hết data trong database và thử lại

**Test:**
```sql
DELETE FROM Categories;
```

## Updated Config

### axiosInstance.ts
- ✅ Added console.log for request
- ✅ Added console.log for response
- ✅ Added console.error for errors

### Program.cs
- ✅ Added CORS policy "AllowAll"
- ✅ Applied CORS middleware

## Next Steps

1. **Restart Backend:**
   ```bash
   cd fastfood/fastfood
   dotnet run
   ```

2. **Check Browser Console:**
   - Mở DevTools
   - Click Categories page
   - Xem logs

3. **Test API:**
   - Vào `https://localhost:7141/swagger`
   - Test GET /api/Categories

4. **Check Database:**
   - Verify data exists in SQL Server

## Nếu Vẫn Còn Lỗi

### Collect Info:

1. **Backend Logs:**
   - Xem console khi run `dotnet run`

2. **Browser Console:**
   - Copy toàn bộ logs
   - Copy error messages

3. **Network Tab:**
   - F12 → Network tab
   - Click Categories
   - Xem request/response

### Share Info:
- Console logs
- Error messages
- Network requests

