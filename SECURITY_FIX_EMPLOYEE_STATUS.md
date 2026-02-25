# Sửa Lỗi Bảo Mật: Kiểm Tra Trạng Thái Tài Khoản Khi Đăng Nhập

## Vấn Đề
**Lỗi bảo mật nghiêm trọng**: Tài khoản nhân viên đã bị vô hiệu hóa (Inactive, Terminated, OnLeave) vẫn có thể đăng nhập được vào hệ thống.

## Nguyên Nhân
AuthController chỉ kiểm tra:
- Username có tồn tại không
- Password có đúng không

Nhưng **KHÔNG kiểm tra trạng thái (Status)** của nhân viên.

## Giải Pháp Đã Áp Dụng

### 1. Thêm Kiểm Tra Status Khi Login
**File:** `fastfood/fastfood/Controllers/AuthController.cs`

```csharp
// Check employee status - only Active employees can login
if (employee.Status != EmployeeStatus.Active)
{
    _logger.LogWarning("Login attempt with inactive account. Username: {Username}, Status: {Status}", 
        request.Username, employee.Status);
    
    var statusMessage = employee.Status switch
    {
        EmployeeStatus.Terminated => "Tài khoản đã bị chấm dứt",
        EmployeeStatus.Inactive => "Tài khoản đã bị vô hiệu hóa",
        EmployeeStatus.OnLeave => "Tài khoản đang trong thời gian nghỉ phép",
        _ => "Tài khoản không hoạt động"
    };
    
    return Unauthorized(new { message = statusMessage });
}
```

### 2. Thêm Kiểm Tra Status Cho Endpoint /auth/me
Cũng kiểm tra status khi user đang đăng nhập muốn lấy thông tin:

```csharp
// Check employee status - only Active employees can access
if (employee.Status != EmployeeStatus.Active)
{
    _logger.LogWarning("Access attempt with inactive account. UserId: {UserId}, Status: {Status}", 
        userId, employee.Status);
    return Unauthorized(new { message = "Tài khoản không còn hoạt động" });
}
```

## Các Trạng Thái Employee

Theo `Employee.cs` enum:
- **Active (1)**: Tài khoản hoạt động - ✅ Được phép đăng nhập
- **Inactive (2)**: Tài khoản vô hiệu hóa - ❌ Không được đăng nhập
- **OnLeave (3)**: Đang nghỉ phép - ❌ Không được đăng nhập
- **Terminated (4)**: Đã chấm dứt hợp đồng - ❌ Không được đăng nhập

## Thông Báo Lỗi Cho User

Thay vì thông báo chung "Tài khoản hoặc mật khẩu không đúng", hệ thống sẽ hiển thị thông báo cụ thể:
- "Tài khoản đã bị vô hiệu hóa" (Inactive)
- "Tài khoản đã bị chấm dứt" (Terminated)
- "Tài khoản đang trong thời gian nghỉ phép" (OnLeave)

## Logging

Mọi lần đăng nhập với tài khoản không active sẽ được log:
```
Login attempt with inactive account. Username: {Username}, Status: {Status}
```

Giúp admin theo dõi các lần cố gắng đăng nhập bất thường.

## Kiểm Tra

### Test Case 1: Đăng nhập với tài khoản Active
✅ **Kết quả mong đợi**: Đăng nhập thành công

### Test Case 2: Đăng nhập với tài khoản Inactive
❌ **Kết quả mong đợi**: Bị từ chối với thông báo "Tài khoản đã bị vô hiệu hóa"

### Test Case 3: Đăng nhập với tài khoản Terminated
❌ **Kết quả mong đợi**: Bị từ chối với thông báo "Tài khoản đã bị chấm dứt"

### Test Case 4: Đăng nhập với tài khoản OnLeave
❌ **Kết quả mong đợi**: Bị từ chối với thông báo "Tài khoản đang trong thời gian nghỉ phép"

### Test Case 5: User đang đăng nhập bị admin vô hiệu hóa
❌ **Kết quả mong đợi**: Khi gọi API tiếp theo sẽ bị từ chối (token vẫn valid nhưng status check sẽ fail)

## Lưu Ý Quan Trọng

### 1. Token Đã Cấp Vẫn Valid
Nếu user đã đăng nhập và có token, sau đó admin vô hiệu hóa tài khoản:
- Token vẫn còn hiệu lực trong 24h
- Nhưng khi gọi `/auth/me` sẽ bị từ chối
- **Khuyến nghị**: Implement token revocation hoặc refresh token mechanism

### 2. Middleware Authorization
Nên thêm middleware để kiểm tra status cho mọi request authenticated:
```csharp
// TODO: Add middleware to check employee status on every authenticated request
```

### 3. Frontend Handling
Frontend cần xử lý các error messages này và hiển thị cho user một cách rõ ràng.

## Hoàn Thành
✅ Build thành công  
✅ Backend đang chạy trên http://localhost:5268  
✅ Kiểm tra status khi login  
✅ Kiểm tra status khi get user info  
✅ Log các lần đăng nhập bất thường  

---
**Ngày sửa:** 25/12/2024  
**Mức độ:** Critical Security Fix  
**Status:** ✅ Đã hoàn thành

