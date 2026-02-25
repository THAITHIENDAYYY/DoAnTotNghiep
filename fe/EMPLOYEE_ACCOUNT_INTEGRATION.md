# 🔐 Tích Hợp Tài Khoản Nhân Viên - Hướng Dẫn Backend

## ✅ Database Đã Sẵn Sàng!

Database của bạn **đã có sẵn** các bảng và fields cần thiết:

### **ApplicationUser (IdentityUser)**
```csharp
public class ApplicationUser : IdentityUser
{
    // IdentityUser đã có sẵn:
    // - UserName (string)         → Tên đăng nhập
    // - Email (string)            → Email
    // - PasswordHash (string)     → Mật khẩu đã hash
    // - PhoneNumber (string)      → SĐT
}
```

### **Employee**
```csharp
public class Employee
{
    public string? UserId { get; set; }  // Link đến ApplicationUser
    public virtual ApplicationUser? User { get; set; }  // Navigation property
}
```

---

## 🚀 Backend API Cần Tạo

### **1. Endpoint Tạo Tài Khoản**

```csharp
[HttpPost("register-employee")]
public async Task<ActionResult> RegisterEmployeeAccount(RegisterEmployeeAccountDto dto)
{
    try
    {
        // Validate
        if (string.IsNullOrWhiteSpace(dto.Username))
            return BadRequest("Username là bắt buộc");
        
        if (dto.Password.Length < 6)
            return BadRequest("Mật khẩu phải có ít nhất 6 ký tự");

        // Kiểm tra username đã tồn tại chưa
        var existingUser = await _userManager.FindByNameAsync(dto.Username);
        if (existingUser != null)
            return BadRequest("Username đã tồn tại");

        // Tạo ApplicationUser
        var user = new ApplicationUser
        {
            UserName = dto.Username,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber
        };

        // Hash password và lưu user
        var result = await _userManager.CreateAsync(user, dto.Password);
        
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Cập nhật Employee với UserId
        var employee = await _context.Employees.FindAsync(dto.EmployeeId);
        if (employee == null)
            return NotFound("Không tìm thấy nhân viên");

        employee.UserId = user.Id;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Tạo tài khoản thành công", userId = user.Id });
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}
```

### **2. DTO cho RegisterEmployeeAccount**

```csharp
public class RegisterEmployeeAccountDto
{
    [Required]
    public int EmployeeId { get; set; }
    
    [Required]
    [StringLength(50)]
    public string Username { get; set; } = string.Empty;
    
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public string? PhoneNumber { get; set; }
}
```

---

## 📝 Frontend Integration

### **Cập nhật EmployeesPage.tsx**

```typescript
// Thêm state
const [accountData, setAccountData] = useState({
  username: '',
  password: ''
});

// Function để tạo tài khoản
const createEmployeeAccount = async (employeeId: number) => {
  if (!accountData.username || !accountData.password) {
    window.alert('Vui lòng nhập tên đăng nhập và mật khẩu');
    return;
  }

  try {
    const response = await axios.post(
      'http://localhost:5268/api/auth/register-employee',
      {
        employeeId: employeeId,
        username: accountData.username,
        password: accountData.password,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      }
    );

    if (response.data) {
      window.alert('Tạo tài khoản thành công!');
      // Reset form
      setAccountData({ username: '', password: '' });
    }
  } catch (error: any) {
    window.alert(error.response?.data?.message || 'Tạo tài khoản thất bại');
  }
};

// Bind vào form inputs
<input
  id="employee-username"
  type="text"
  className="form-control"
  value={accountData.username}
  onChange={(e) => setAccountData({ ...accountData, username: e.target.value })}
  placeholder="thiennv"
/>

<input
  id="employee-password"
  type="password"
  className="form-control"
  value={accountData.password}
  onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
  placeholder="Tối thiểu 6 ký tự"
/>
```

---

## 🔒 Login Flow Update

### **Cập nhật AuthContext.tsx**

Thay đổi từ hard-coded accounts sang API call thực:

```typescript
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    // Gọi API backend để authenticate
    const response = await axios.post('http://localhost:5268/api/auth/login', {
      username: email,  // Dùng username thay vì email
      password: password
    });

    const { token, user, employee } = response.data;
    
    // Lưu token
    localStorage.setItem('authToken', token);
    
    // Map role từ Employee
    const userRole = employee.role; // 1=Admin, 2=Cashier, 3=WarehouseStaff
    
    setUser({
      id: employee.id,
      email: user.email,
      fullName: `${employee.firstName} ${employee.lastName}`,
      role: userRole,
      roleName: getRoleName(userRole)
    });
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
```

---

## ⚙️ Backend Login Controller

```csharp
[HttpPost("login")]
public async Task<ActionResult> Login(LoginDto dto)
{
    // Tìm user
    var user = await _userManager.FindByNameAsync(dto.Username);
    if (user == null)
        return Unauthorized("Tài khoản không tồn tại");

    // Kiểm tra password
    var isValidPassword = await _userManager.CheckPasswordAsync(user, dto.Password);
    if (!isValidPassword)
        return Unauthorized("Mật khẩu không đúng");

    // Tìm Employee liên kết
    var employee = await _context.Employees
        .FirstOrDefaultAsync(e => e.UserId == user.Id);
    
    if (employee == null)
        return Unauthorized("Không tìm thấy thông tin nhân viên");

    // Generate JWT token
    var token = GenerateJwtToken(user, employee);

    return Ok(new
    {
        token = token,
        user = new
        {
            userName = user.UserName,
            email = user.Email
        },
        employee = new
        {
            id = employee.Id,
            firstName = employee.FirstName,
            lastName = employee.LastName,
            role = employee.Role,
            roleName = GetRoleName(employee.Role)
        }
    });
}
```

---

## 🗄️ Migration (Nếu Cần)

Database đã có sẵn `UserId` field trong `Employee` table, nhưng nếu chưa:

```bash
cd fastfood/fastfood
dotnet ef migrations add AddUserIdToEmployee
dotnet ef database update
```

---

## ✅ Checklist Hoàn Thành

- [x] Database có `ApplicationUser` (IdentityUser)
- [x] Database có `Employee.UserId` field
- [x] UI Form đã có input Username và Password
- [ ] Backend API `/api/auth/register-employee`
- [ ] Backend API `/api/auth/login`
- [ ] Frontend service `authService.ts`
- [ ] Cập nhật `AuthContext.tsx` để dùng API thật
- [ ] Test tạo tài khoản
- [ ] Test đăng nhập

---

## 📞 Example Usage

### **Tạo nhân viên với tài khoản:**

1. Thêm nhân viên mới: Thiên Trần
2. Chọn vai trò: **Thu Ngân (Cashier)**
3. Nhập tên đăng nhập: **thiennv**
4. Nhập mật khẩu: **thien123**
5. Lưu → Backend tạo Employee và ApplicationUser

### **Đăng nhập:**

1. Vào `/login`
2. Username: **thiennv**
3. Password: **thien123**
4. Login → Redirect to `/pos` (vì là Cashier)

---

**Happy Coding! 🚀**

