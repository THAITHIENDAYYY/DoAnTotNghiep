# ✅ Customer Search Feature - Option 3

## 🎯 Tính Năng Đã Implement

### Tìm kiếm khách hàng theo SĐT (Option 3)

## 📱 UI/UX

### Customer Input Section
```
┌────────────────────────────────────┐
│ 📞 Số điện thoại    ✓ Đã tìm thấy  │
│ [Nhập SĐT khách hàng (tùy chọn)]   │
│ 👤 Nguyễn Văn A | 0912345678       │
└────────────────────────────────────┘
```

## 🔄 Flow Hoạt Động

### 1. User nhập SĐT
```
User types: "09123"
  ↓
handleCustomerPhoneChange() called
  ↓
Search in customers list
  ↓
If found → Show customer info + badge
If not found → User can still continue
```

### 2. Khi đặt hàng
```
Click "💳 ĐẶT MÓN"
  ↓
findOrCreateCustomer(phone)
  ↓
  ├─ Phone empty?
  │   ├─ YES → Create "Khách Vãng Lai"
  │   └─ NO
  │
  └─ Phone exists in DB?
      ├─ YES → Use existing customer
      └─ NO → Create new customer with phone
  ↓
Create order with real customerId
```

## 📦 Code Structure

### State Management
```typescript
const [customers, setCustomers] = useState<CustomerList[]>([]);
const [customerPhone, setCustomerPhone] = useState('');
const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
```

### Key Functions

#### `loadCustomers()`
```typescript
const loadCustomers = async () => {
  const data = await getCustomers();
  setCustomers(data);
};
```
- Load danh sách customers khi component mount

#### `handleCustomerPhoneChange()`
```typescript
const handleCustomerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const phone = e.target.value;
  setCustomerPhone(phone);
  
  // Search customer by phone
  if (phone) {
    const foundCustomer = customers.find(
      c => c.phoneNumber && c.phoneNumber.includes(phone)
    );
    
    if (foundCustomer) {
      setSelectedCustomerId(foundCustomer.id);
    }
  }
};
```
- Auto-search khi user gõ SĐT
- Show customer info nếu tìm thấy

#### `findOrCreateCustomer()`
```typescript
const findOrCreateCustomer = async (phone: string): Promise<number> => {
  // Empty phone → Create walk-in customer
  if (!phone || phone.trim() === '') {
    const walkInCustomer = await createCustomer({...});
    return walkInCustomer.id;
  }

  // Find existing customer
  const existingCustomer = customers.find(
    c => c.phoneNumber?.trim() === phone.trim()
  );

  if (existingCustomer) {
    return existingCustomer.id;
  }

  // Not found → Create new
  const newCustomer = await createCustomer({...});
  return newCustomer.id;
};
```
- **Không nhập SĐT** → Tạo khách vãng lai
- **Tìm thấy** → Dùng customer hiện có
- **Không tìm thấy** → Tạo mới với SĐT đó

#### `handlePlaceOrder()`
```typescript
const handlePlaceOrder = async () => {
  // Tìm hoặc tạo khách hàng
  const customerId = await findOrCreateCustomer(customerPhone);
  
  const orderData: CreateOrderDto = {
    customerId: customerId, // Real customer ID!
    // ...
  };

  await createOrder(orderData);
};
```

## 🎨 UI Components

### Customer Input Section
```tsx
<div className="customer-input-section">
  <label>
    <span>📞 Số điện thoại</span>
    {selectedCustomerId && (
      <span className="customer-found-badge">✓ Đã tìm thấy</span>
    )}
  </label>
  <input
    type="text"
    placeholder="Nhập SĐT khách hàng (tùy chọn)"
    value={customerPhone}
    onChange={handleCustomerPhoneChange}
  />
  {selectedCustomerId && (
    <div className="customer-info">
      👤 {customer.fullName} | {customer.phoneNumber}
    </div>
  )}
</div>
```

## 🎨 CSS Styles

```css
.customer-input-section {
  padding: 15px;
  background: #2a2a2a;
  border-radius: 8px;
}

.customer-found-badge {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
}

.customer-phone-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #444;
  background: #1a1a1a;
  color: #fff;
}

.customer-info {
  background: rgba(255, 107, 53, 0.1);
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: #ffcc80;
}
```

## ✅ Benefits

1. **Tự động tìm kiếm**: Gõ SĐT → Tự động search
2. **Flexible**: Không bắt buộc nhập SĐT
3. **Smart**: Tự tạo customer nếu chưa có
4. **User-friendly**: Badge "✓ Đã tìm thấy"
5. **Clear feedback**: Show customer info khi tìm thấy

## 🧪 Test Cases

### Test 1: Khách hàng có trong DB
```
Input: "0912345678"
Expected: 
  - Show badge "✓ Đã tìm thấy"
  - Show customer info
  - Use existing customerId
```

### Test 2: Khách hàng chưa có trong DB
```
Input: "0987654321"
Expected:
  - No badge
  - Input cho phép nhập
  - Create new customer với SĐT này
```

### Test 3: Không nhập SĐT
```
Input: ""
Expected:
  - Create "Khách Vãng Lai"
  - Order vẫn được tạo thành công
```

## 📝 Notes

- CustomerId không còn hardcode = 1 nữa!
- Mỗi đơn hàng có customerId thật
- Có thể theo dõi lịch sử mua hàng của khách
- Tự động tạo customer profile mới

## 🎉 Done!

Customer search feature hoàn thành theo Option 3!

