# 📊 HƯỚNG DẪN XEM SƠ ĐỒ DATABASE

## 📁 Các file sơ đồ đã tạo:

1. **`SO_DO_DATABASE.puml`** - Sơ đồ đầy đủ, chi tiết (15 bảng)
2. **`SO_DO_DATABASE_SIMPLE.puml`** - Sơ đồ đơn giản, phù hợp cho slide

## 🔧 Cách xem sơ đồ PlantUML:

### Cách 1: Sử dụng VS Code Extension (Khuyến nghị)

1. **Cài đặt extension:**
   - Mở VS Code
   - Vào Extensions (Ctrl+Shift+X)
   - Tìm "PlantUML" (của tác giả: jebbs)
   - Click Install

2. **Xem sơ đồ:**
   - Mở file `.puml`
   - Nhấn `Alt+D` (hoặc click vào preview icon)
   - Sơ đồ sẽ hiển thị bên cạnh

3. **Export sang hình ảnh:**
   - Click chuột phải vào preview
   - Chọn "Export Current Diagram"
   - Chọn định dạng: PNG, SVG, PDF

### Cách 2: Sử dụng PlantUML Online Server

1. **Truy cập:** http://www.plantuml.com/plantuml/uml/
2. **Copy nội dung** từ file `.puml`
3. **Paste** vào ô text
4. **Click "Submit"** để xem sơ đồ
5. **Download** hình ảnh (PNG, SVG)

### Cách 3: Sử dụng PlantUML Server Local

1. **Cài đặt Java** (nếu chưa có)
2. **Download PlantUML JAR:**
   ```bash
   wget http://sourceforge.net/projects/plantuml/files/plantuml.jar/download
   ```
3. **Chạy server:**
   ```bash
   java -jar plantuml.jar -gui
   ```
4. **Mở file .puml** trong PlantUML GUI

### Cách 4: Sử dụng IntelliJ IDEA / WebStorm

1. **Cài đặt plugin:** PlantUML integration
2. **Mở file .puml**
3. **Click "Preview"** để xem sơ đồ

## 📸 Export cho PowerPoint:

### Bước 1: Export từ VS Code
1. Mở file `SO_DO_DATABASE_SIMPLE.puml`
2. Nhấn `Alt+D` để preview
3. Click chuột phải → "Export Current Diagram"
4. Chọn **PNG** hoặc **SVG** (SVG chất lượng cao hơn)

### Bước 2: Chèn vào PowerPoint
1. Mở PowerPoint
2. Vào slide cần chèn (Slide 4)
3. Insert → Pictures → Chọn file PNG/SVG vừa export
4. Điều chỉnh kích thước cho vừa slide

## 🎨 Tùy chỉnh sơ đồ:

Nếu muốn thay đổi màu sắc, font chữ, hoặc layout:

1. **Màu sắc:** Sửa các dòng `#FFE5D9`, `#FF6B35` trong file `.puml`
2. **Font:** Sửa `defaultFontName` và `defaultFontSize`
3. **Layout:** Thay đổi `skinparam linetype` (ortho, polyline, spline)

## 📋 Mô tả sơ đồ:

### Các nhóm chính:

1. **Authentication** (Màu cam nhạt):
   - ApplicationUser
   - Customer
   - Employee

2. **Product Management** (Màu xanh lá):
   - Category
   - Product
   - Ingredient
   - ProductIngredient

3. **Order Management** (Màu vàng nhạt):
   - Order
   - OrderItem
   - Payment

4. **Table Management** (Màu xanh dương):
   - TableArea
   - Table

5. **Discount** (Màu tím):
   - Discount

### Ký hiệu quan hệ:

- **||--o{** : One-to-Many (1-N)
- **||--||** : One-to-One (1-1)
- **}o--o{** : Many-to-Many (N-N)

### Màu sắc:

- **PK (Primary Key)**: Màu đậm, in đậm
- **FK (Foreign Key)**: Màu xanh dương (#3498db)

## 💡 Tips:

1. **Cho slide:** Dùng `SO_DO_DATABASE_SIMPLE.puml` (ngắn gọn, dễ nhìn)
2. **Cho báo cáo chi tiết:** Dùng `SO_DO_DATABASE.puml` (đầy đủ thông tin)
3. **Export SVG:** Chất lượng tốt hơn PNG, có thể zoom không bị mờ
4. **Export PDF:** Phù hợp cho in ấn

## 🔗 Tài liệu tham khảo:

- PlantUML Documentation: http://plantuml.com/
- PlantUML Syntax: http://plantuml.com/guide
- VS Code Extension: https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml

---

**Lưu ý:** Nếu không cài được extension, dùng cách 2 (Online Server) là đơn giản nhất!

