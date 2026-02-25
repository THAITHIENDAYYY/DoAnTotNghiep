# ✅ Feature: Ghi chú món ăn trong POS

## 🎯 Tính Năng Đã Thêm

### 1. Nút "📝" trong Cart Items
Thêm nút ghi chú cho từng món ăn trong giỏ hàng.

### 2. Modal Ghi Chú
Khi click nút "📝", hiển thị modal để nhập ghi chú cho món ăn.

### 3. Hiển Thị Ghi Chú
Nếu món ăn có ghi chú, hiển thị dưới tên món trong "Chi Tiết Đơn Hàng".

## 📦 Code Changes

### `fe/src/pages/POSPage.tsx`

#### 1. Interface Update
```typescript
interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
  note?: string;  // ✅ Thêm field ghi chú
}
```

#### 2. State Management
```typescript
const [showNoteModal, setShowNoteModal] = useState(false);
const [editingItemId, setEditingItemId] = useState<number | null>(null);
const [noteInput, setNoteInput] = useState('');
```

#### 3. Functions
```typescript
const openNoteModal = (itemId: number) => {
  const item = cart.find(i => i.productId === itemId);
  setEditingItemId(itemId);
  setNoteInput(item?.note || '');
  setShowNoteModal(true);
};

const saveNote = () => {
  if (editingItemId !== null) {
    setCart(cart.map(item =>
      item.productId === editingItemId
        ? { ...item, note: noteInput.trim() || undefined }
        : item
    ));
  }
  setShowNoteModal(false);
  setEditingItemId(null);
  setNoteInput('');
};

const cancelNoteModal = () => {
  setShowNoteModal(false);
  setEditingItemId(null);
  setNoteInput('');
};
```

#### 4. UI Updates

**Note Button trong Cart:**
```typescript
<button 
  className="note-btn"
  onClick={() => openNoteModal(item.productId)}
  title="Thêm ghi chú"
>
  📝
</button>
```

**Hiển Thị Ghi Chú:**
```typescript
{item.note && (
  <div className="cart-item-note">
    📝 <em>{item.note}</em>
  </div>
)}
```

**Modal:**
```typescript
{showNoteModal && (
  <div className="modal-overlay" onClick={cancelNoteModal}>
    <div className="note-modal" onClick={(e) => e.stopPropagation()}>
      <div className="note-modal-header">
        <h3>Ghi chú món ăn</h3>
        <button className="close-btn" onClick={cancelNoteModal}>✕</button>
      </div>
      <div className="note-modal-body">
        <textarea
          placeholder="Nhập ghi chú cho món ăn này..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          rows={4}
          autoFocus
        />
      </div>
      <div className="note-modal-footer">
        <button className="btn-cancel" onClick={cancelNoteModal}>Hủy</button>
        <button className="btn-save" onClick={saveNote}>Lưu</button>
      </div>
    </div>
  </div>
)}
```

### `fe/src/pages/POSPage.css`

#### 1. Note Button Styles
```css
.note-btn {
  background: #fff3e0;
  border: 1px solid #ffcc80;
  color: #ff6b35;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
}

.note-btn:hover {
  background: #ffe0b2;
  transform: scale(1.1);
}
```

#### 2. Note Display Styles
```css
.cart-item-note {
  font-size: 13px;
  color: #ff6b35;
  margin-top: 4px;
  padding: 4px 8px;
  background: #fff3e0;
  border-radius: 4px;
}
```

#### 3. Modal Styles
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

.note-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.2s;
}
```

## 🎨 UI/UX Flow

### User Journey
1. User thêm món vào cart
2. Click nút "📝" trên món đó
3. Modal hiển thị với textarea
4. User nhập ghi chú (ví dụ: "Không cay", "Thêm nước đá")
5. Click "Lưu" → ghi chú được lưu
6. Ghi chú hiển thị dưới tên món trong cart
7. Click "Hủy" hoặc click outside modal để đóng

### Visual States

**Default State:**
- Cart item hiển thị: Tên món + Giá
- Nút "📝" màu cam nhạt

**With Note:**
- Cart item hiển thị:
  ```
  Tên món
  📝 Không cay
  Giá
  ```

**Modal Open:**
- Overlay đen mờ 50%
- Modal trắng, rounded corners
- Animation slide up + fade in
- Textarea có focus state

## ✅ Features Summary

- ✅ Nút ghi chú cho từng món
- ✅ Modal để nhập ghi chú
- ✅ Hiển thị ghi chú trong cart
- ✅ Edit existing note
- ✅ Remove note (để trống → gỡ note)
- ✅ Animations (fade in, slide up)
- ✅ Responsive design
- ✅ Accessible (title attribute)

## 🎉 Ready!

Ghi chú món ăn đã sẵn sàng sử dụng!

