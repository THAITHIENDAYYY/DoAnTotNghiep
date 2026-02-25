import { useState, useEffect } from 'react';
import { 
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProducts,
  toggleProductStatus
} from '../api/productService';
import { getCategories } from '../api/categoryService';
import { getIngredients } from '../api/ingredientService';
import { 
  getProductIngredients,
  addIngredientToProduct,
  removeIngredientFromProduct
} from '../api/productIngredientService';
import type { 
  ProductList, 
  Product, 
  CreateProductDto, 
  UpdateProductDto
} from '../api/productService';
import type { CategoryList } from '../api/categoryService';
import type { IngredientList } from '../api/ingredientService';
import type { ProductIngredient, AddProductIngredientDto } from '../api/productIngredientService';
import './ProductsPage.css';

// Helper type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as ApiError;
    return apiErr.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

// Helper function để lấy ví dụ số lượng dựa trên đơn vị
const getQuantityExample = (unit: string): string => {
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('gram') || unitLower === 'g') return '200'; // 200 gram
  if (unitLower.includes('kg') || unitLower === 'kilogram') return '0.2'; // 0.2 kg
  if (unitLower.includes('lon') || unitLower.includes('chai') || unitLower.includes('hộp')) return '1'; // 1 lon/chai
  if (unitLower.includes('lít') || unitLower === 'l') return '0.5'; // 0.5 lít
  if (unitLower.includes('ml') || unitLower === 'milliliter') return '500'; // 500 ml
  if (unitLower.includes('quả') || unitLower.includes('cái') || unitLower.includes('trái')) return '2'; // 2 quả
  if (unitLower.includes('gói') || unitLower.includes('túi')) return '1'; // 1 gói
  return '10'; // Mặc định
};

const ProductsPage = () => {
  const [products, setProducts] = useState<ProductList[]>([]);
  const [categories, setCategories] = useState<CategoryList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    categoryId: 0,
    stockQuantity: 0,
    minStockLevel: 5,
    sku: ''
  });

  // States for ingredients modal
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<IngredientList[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number>(0);
  const [quantityRequired, setQuantityRequired] = useState<number>(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      // Sắp xếp sản phẩm mới nhất lên đầu (theo ID giảm dần)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setProducts(sortedData);
    } catch (err) {
      setError('Không thể tải sản phẩm. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      sku: ''
    });
    setShowModal(true);
  };

  const handleEdit = (product: ProductList) => {
    getProductById(product.id).then((fullProduct) => {
      setEditingProduct(fullProduct);
      setFormData({
        name: fullProduct.name,
        description: fullProduct.description || '',
        price: fullProduct.price,
        imageUrl: fullProduct.imageUrl || '',
        categoryId: fullProduct.categoryId,
        stockQuantity: fullProduct.stockQuantity,
        minStockLevel: fullProduct.minStockLevel,
        sku: fullProduct.sku || ''
      });
      setShowModal(true);
    }).catch((err) => {
      window.alert('Không thể tải thông tin sản phẩm');
      console.error('Error loading product details:', err);
    });
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteProduct(id);
      window.alert('Xóa sản phẩm thành công!');
      loadProducts();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể xóa sản phẩm. Sản phẩm này có thể đang có trong đơn hàng.'
      );
      window.alert(errorMessage);
      console.error('Error deleting product:', err);
    }
  };

  const handleToggleStatus = async (id: number, name: string, currentStatus: boolean) => {
    const action = currentStatus ? 'ẩn' : 'hiện';
    const confirmed = window.confirm(`Bạn có chắc muốn ${action} sản phẩm "${name}" ở trang POS?`);
    
    if (!confirmed) return;

    try {
      await toggleProductStatus(id);
      window.alert(`${currentStatus ? 'Ẩn' : 'Hiện'} sản phẩm thành công!`);
      loadProducts();
    } catch (err) {
      const errorMessage = getErrorMessage(err, `Không thể ${action} sản phẩm`);
      window.alert(errorMessage);
      console.error(`Error toggling product status:`, err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      window.alert('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!formData.categoryId) {
      window.alert('Vui lòng chọn danh mục');
      return;
    }

    if (formData.price <= 0) {
      window.alert('Giá sản phẩm phải lớn hơn 0');
      return;
    }

    try {
      if (editingProduct) {
        // Update
        const updateData: UpdateProductDto = {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          imageUrl: formData.imageUrl,
          categoryId: formData.categoryId,
          isAvailable: editingProduct.isAvailable,
          isActive: editingProduct.isActive,
          stockQuantity: formData.stockQuantity,
          minStockLevel: formData.minStockLevel,
          sku: formData.sku
        };
        await updateProduct(editingProduct.id, updateData);
        window.alert('Cập nhật sản phẩm thành công!');
      } else {
        // Create
        await createProduct(formData);
        window.alert('Thêm sản phẩm thành công!');
      }
      
      setShowModal(false);
      loadProducts();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể thêm/sửa sản phẩm. Tên sản phẩm có thể đã tồn tại.'
      );
      window.alert(errorMessage);
      console.error('Error saving product:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: 0,
      stockQuantity: 0,
      minStockLevel: 5,
      sku: ''
    });
  };

  // Ingredients Modal Handlers
  const handleViewIngredients = async (product: ProductList) => {
    setSelectedProductId(product.id);
    setSelectedProductName(product.name);
    setShowIngredientsModal(true);
    await loadProductIngredients(product.id);
    await loadAvailableIngredients();
  };

  const loadProductIngredients = async (productId: number) => {
    try {
      const data = await getProductIngredients(productId);
      setProductIngredients(data);
    } catch (err) {
      console.error('Error loading product ingredients:', err);
    }
  };

  const loadAvailableIngredients = async () => {
    try {
      const data = await getIngredients();
      setAvailableIngredients(data);
    } catch (err) {
      console.error('Error loading available ingredients:', err);
    }
  };

  const handleAddIngredient = async () => {
    if (!selectedProductId) return;

    if (selectedIngredientId === 0) {
      window.alert('Vui lòng chọn nguyên liệu');
      return;
    }

    if (quantityRequired <= 0) {
      window.alert('Số lượng phải lớn hơn 0');
      return;
    }

    try {
      const dto: AddProductIngredientDto = {
        ingredientId: selectedIngredientId,
        quantityRequired: quantityRequired
      };

      await addIngredientToProduct(selectedProductId, dto);
      window.alert('Thêm nguyên liệu thành công!');
      setSelectedIngredientId(0);
      setQuantityRequired(0);
      await loadProductIngredients(selectedProductId);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể thêm nguyên liệu');
      window.alert(errorMessage);
      console.error('Error adding ingredient:', err);
    }
  };

  const handleRemoveIngredient = async (ingredientId: number, ingredientName: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa nguyên liệu "${ingredientName}"?`);
    
    if (!confirmed) return;

    try {
      await removeIngredientFromProduct(ingredientId);
      window.alert('Xóa nguyên liệu thành công!');
      if (selectedProductId) {
        await loadProductIngredients(selectedProductId);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể xóa nguyên liệu');
      window.alert(errorMessage);
      console.error('Error removing ingredient:', err);
    }
  };

  const handleCloseIngredientsModal = () => {
    setShowIngredientsModal(false);
    setSelectedProductId(null);
    setSelectedProductName('');
    setProductIngredients([]);
    setSelectedIngredientId(0);
    setQuantityRequired(0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      (product.categoryName?.toLowerCase().includes(search) || false) ||
      (product.sku?.toLowerCase().includes(search) || false)
    );
  });

  const handleExportProducts = async () => {
    try {
      setExporting(true);
      const blob = await exportProducts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SanPham_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting products:', err);
      window.alert('Lỗi khi xuất danh sách sản phẩm!');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>🍔 Quản Lý Sản Phẩm</h2>
        <div className="header-actions">
          <button className="btn btn-success" onClick={loadProducts}>🔄 Làm mới</button>
          <button className="btn btn-secondary" onClick={handleExportProducts} disabled={exporting}>
            {exporting ? 'Đang xuất...' : '⬇️ Xuất Excel'}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Sản Phẩm</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, danh mục, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-stats">
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên Sản Phẩm</th>
                <th>Danh Mục</th>
                <th>Giá</th>
                <th>Tồn Kho / Có Thể Làm</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    {searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>{product.name}</td>
                    <td>{product.categoryName || '—'}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <div className="stock-info">
                        <div className="stock-row">
                          <span className="stock-label">Tồn kho:</span>
                          <span className={(product.availableQuantityByIngredients <= product.minStockLevel) ? 'text-warning fw-bold' : 'fw-bold'}>
                            {product.availableQuantityByIngredients}
                          </span>
                        </div>
                        <div className="stock-row">
                          <span className="stock-label">Có thể làm:</span>
                          <span className={`available-quantity ${product.availableQuantityByIngredients <= 5 ? 'text-warning' : 'text-success'}`}>
                            {product.availableQuantityByIngredients} phần
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${product.isActive && product.isAvailable ? 'badge-success' : product.isActive ? 'badge-warning' : 'badge-danger'}`}>
                        {product.isActive && product.isAvailable ? 'Có sẵn' : !product.isActive ? 'Đang ẩn' : 'Hết hàng'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-info btn-sm" 
                        onClick={() => handleViewIngredients(product)}
                        title="Xem và quản lý nguyên liệu"
                      >
                        🧂 Nguyên Liệu
                      </button>
                      <button 
                        className={`btn btn-sm ${product.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(product.id, product.name, product.isActive)}
                        title={product.isActive ? "Ẩn sản phẩm khỏi POS" : "Hiện sản phẩm trên POS"}
                      >
                        {product.isActive ? '👁️ Ẩn' : '👁️ Hiện'}
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(product)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '📝 Sửa Sản Phẩm' : '➕ Thêm Sản Phẩm'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="product-name" className="form-label">Tên Sản Phẩm *</label>
                <input
                  id="product-name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  aria-label="Tên sản phẩm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-category" className="form-label">Danh Mục *</label>
                <select
                  id="product-category"
                  className="form-control"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  required
                  aria-label="Danh mục"
                >
                  <option value={0}>-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="product-price" className="form-label">Giá (VND) *</label>
                <input
                  id="product-price"
                  type="number"
                  className="form-control"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  min="0"
                  step="1000"
                  required
                  aria-label="Giá sản phẩm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-description" className="form-label">Mô Tả</label>
                <textarea
                  id="product-description"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  aria-label="Mô tả sản phẩm"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="product-stock" className="form-label">Tồn Kho *</label>
                  <input
                    id="product-stock"
                    type="number"
                    className="form-control"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    min="0"
                    required
                    aria-label="Số lượng tồn kho"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="product-min-stock" className="form-label">Mức Tồn Kho Tối Thiểu *</label>
                  <input
                    id="product-min-stock"
                    type="number"
                    className="form-control"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
                    min="1"
                    required
                    aria-label="Mức tồn kho tối thiểu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="product-sku" className="form-label">SKU (Mã sản phẩm)</label>
                <input
                  id="product-sku"
                  type="text"
                  className="form-control"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="VD: SP001"
                  aria-label="Mã SKU"
                />
              </div>

              <div className="form-group">
                <label htmlFor="product-image" className="form-label">URL Hình Ảnh</label>
                <input
                  id="product-image"
                  type="text"
                  className="form-control"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  aria-label="URL hình ảnh"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ingredients Management Modal */}
      {showIngredientsModal && (
        <div className="modal-overlay" onClick={handleCloseIngredientsModal}>
          <div className="modal-content ingredients-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>🧂 Nguyên Liệu - {selectedProductName}</h3>
                <small style={{ color: '#999', fontSize: '0.85rem' }}>💡 Kéo góc dưới phải để phóng to/thu nhỏ</small>
              </div>
              <button className="modal-close" onClick={handleCloseIngredientsModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Add Ingredient Section */}
              <div className="add-ingredient-section">
                <h4>➕ Thêm Nguyên Liệu</h4>
                <div className="unit-info-box">
                  <strong>💡 Lưu ý về đơn vị:</strong> Mỗi nguyên liệu có đơn vị riêng (gram, kg, lon, chai, quả...). 
                  Nhập số lượng theo đúng đơn vị đã chọn. 
                  <br />
                  <em>Ví dụ: Gà rán cần 200 gram → chọn "Gà (gram)" và nhập 200</em>
                </div>
                <div className="add-ingredient-form">
                  <div className="form-group">
                    <label htmlFor="select-ingredient">Chọn Nguyên Liệu</label>
                    <select
                      id="select-ingredient"
                      className="form-control"
                      value={selectedIngredientId}
                      onChange={(e) => setSelectedIngredientId(Number(e.target.value))}
                    >
                      <option value={0}>-- Chọn nguyên liệu --</option>
                      {availableIngredients
                        .filter(ing => !productIngredients.some(pi => pi.ingredientId === ing.id))
                        .map(ingredient => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} ({ingredient.unit})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="quantity-required">
                      Số Lượng Cần
                      {selectedIngredientId > 0 && (
                        <span className="unit-badge">
                          ({availableIngredients.find(i => i.id === selectedIngredientId)?.unit || ''})
                        </span>
                      )}
                    </label>
                    <input
                      id="quantity-required"
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={quantityRequired}
                      onChange={(e) => setQuantityRequired(parseFloat(e.target.value) || 0)}
                      placeholder={
                        selectedIngredientId > 0 
                          ? `Ví dụ: ${getQuantityExample(availableIngredients.find(i => i.id === selectedIngredientId)?.unit || '')}` 
                          : 'Chọn nguyên liệu trước'
                      }
                      disabled={selectedIngredientId === 0}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddIngredient}
                  >
                    ➕ Thêm
                  </button>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="ingredients-list-section">
                <h4>📋 Danh Sách Nguyên Liệu ({productIngredients.length})</h4>
                {productIngredients.length === 0 ? (
                  <div className="empty-state">
                    Chưa có nguyên liệu nào
                  </div>
                ) : (
                  <table className="table ingredients-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Tên Nguyên Liệu</th>
                        <th>Số Lượng Cần</th>
                        <th>Tồn Kho Hiện Tại</th>
                        <th>Trạng Thái</th>
                        <th>Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productIngredients.map((pi, index) => (
                        <tr key={pi.id}>
                          <td>{index + 1}</td>
                          <td><strong>{pi.ingredientName}</strong></td>
                          <td>
                            <span className="quantity-display">
                              {pi.quantityRequired} <span className="unit-text">{pi.unit}</span>
                            </span>
                          </td>
                          <td>
                            <span className={pi.isLowStock ? 'text-warning fw-bold' : 'fw-bold'}>
                              {pi.currentStock} {pi.unit}
                            </span>
                          </td>
                          <td>
                            {pi.isLowStock ? (
                              <span className="badge badge-warning">⚠️ Sắp hết</span>
                            ) : (
                              <span className="badge badge-success">✓ Đủ</span>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveIngredient(pi.id, pi.ingredientName)}
                            >
                              🗑️ Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseIngredientsModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;

