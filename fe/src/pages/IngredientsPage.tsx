import { useState, useEffect } from 'react';
import { 
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  exportIngredients
} from '../api/ingredientService';
import type { 
  IngredientList, 
  Ingredient, 
  CreateIngredientDto, 
  UpdateIngredientDto
} from '../api/ingredientService';
import './IngredientsPage.css';

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

const IngredientsPage = () => {
  const [ingredients, setIngredients] = useState<IngredientList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<CreateIngredientDto>({
    name: '',
    description: '',
    unit: '',
    quantity: 0,
    minQuantity: 0,
    pricePerUnit: 0,
    supplier: ''
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIngredients();
      // Sắp xếp nguyên liệu mới nhất lên đầu (theo ID giảm dần)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setIngredients(sortedData);
    } catch (err) {
      setError('Không thể tải nguyên liệu. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingIngredient(null);
    setFormData({
      name: '',
      description: '',
      unit: '',
      quantity: 0,
      minQuantity: 0,
      pricePerUnit: 0,
      supplier: ''
    });
    setShowModal(true);
  };

  const handleEdit = (ingredient: IngredientList) => {
    getIngredientById(ingredient.id).then((fullIngredient) => {
      setEditingIngredient(fullIngredient);
      setFormData({
        name: fullIngredient.name,
        description: fullIngredient.description || '',
        unit: fullIngredient.unit,
        quantity: fullIngredient.quantity,
        minQuantity: fullIngredient.minQuantity,
        pricePerUnit: fullIngredient.pricePerUnit,
        supplier: fullIngredient.supplier || ''
      });
      setShowModal(true);
    }).catch((err) => {
      window.alert('Không thể tải thông tin nguyên liệu');
      console.error('Error loading ingredient details:', err);
    });
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa nguyên liệu "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteIngredient(id);
      window.alert('Xóa nguyên liệu thành công!');
      loadIngredients();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể xóa nguyên liệu.'
      );
      window.alert(errorMessage);
      console.error('Error deleting ingredient:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      window.alert('Vui lòng nhập tên nguyên liệu');
      return;
    }

    if (!formData.unit.trim()) {
      window.alert('Vui lòng nhập đơn vị');
      return;
    }

    if (formData.quantity < 0) {
      window.alert('Số lượng không thể âm');
      return;
    }

    if (formData.minQuantity < 0) {
      window.alert('Số lượng tối thiểu không thể âm');
      return;
    }

    if (formData.pricePerUnit <= 0) {
      window.alert('Giá mỗi đơn vị phải lớn hơn 0');
      return;
    }

    try {
      if (editingIngredient) {
        // Update
        const updateData: UpdateIngredientDto = {
          name: formData.name,
          description: formData.description || undefined,
          unit: formData.unit,
          quantity: formData.quantity,
          minQuantity: formData.minQuantity,
          pricePerUnit: formData.pricePerUnit,
          supplier: formData.supplier || undefined,
          isActive: editingIngredient.isActive
        };
        await updateIngredient(editingIngredient.id, updateData);
        window.alert('Cập nhật nguyên liệu thành công!');
      } else {
        // Create
        await createIngredient(formData);
        window.alert('Thêm nguyên liệu thành công!');
      }
      
      setShowModal(false);
      loadIngredients();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể thêm/sửa nguyên liệu. Tên nguyên liệu có thể đã tồn tại.'
      );
      window.alert(errorMessage);
      console.error('Error saving ingredient:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIngredient(null);
    setFormData({
      name: '',
      description: '',
      unit: '',
      quantity: 0,
      minQuantity: 0,
      pricePerUnit: 0,
      supplier: ''
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportIngredients();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TonKhoNguyenLieu_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting inventory:', err);
      window.alert('Lỗi khi xuất tồn kho!');
    } finally {
      setExporting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  // Filter ingredients based on search term
  const filteredIngredients = ingredients.filter(ingredient => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ingredient.name.toLowerCase().includes(search) ||
      ingredient.unit.toLowerCase().includes(search) ||
      (ingredient.supplier?.toLowerCase().includes(search) || false)
    );
  });

  return (
    <div className="ingredients-page">
      <div className="page-header">
        <h2>🧂 Quản Lý Nguyên Liệu</h2>
        <div className="header-actions">
          <button className="btn btn-success" onClick={loadIngredients}>🔄 Làm mới</button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Đang xuất...' : '⬇️ Xuất Excel'}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Nguyên Liệu</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nguyên liệu, đơn vị, nhà cung cấp..."
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
          Hiển thị <strong>{filteredIngredients.length}</strong> / {ingredients.length} nguyên liệu
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
                <th>Tên Nguyên Liệu</th>
                <th>Đơn Vị</th>
                <th>Số Lượng</th>
                <th>SL Tối Thiểu</th>
                <th>Giá/Đơn Vị</th>
                <th>Nhà Cung Cấp</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {searchTerm ? 'Không tìm thấy nguyên liệu nào' : 'Chưa có nguyên liệu nào'}
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((ingredient, index) => (
                  <tr key={ingredient.id}>
                    <td>{index + 1}</td>
                    <td>{ingredient.name}</td>
                    <td>{ingredient.unit}</td>
                    <td>
                      <span className={ingredient.isLowStock ? 'text-warning' : ''}>
                        {ingredient.quantity}
                      </span>
                    </td>
                    <td>{ingredient.minQuantity}</td>
                    <td>{formatPrice(ingredient.pricePerUnit)}</td>
                    <td>{ingredient.supplier || '—'}</td>
                    <td>
                      <span className={`badge ${ingredient.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {ingredient.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                      {ingredient.isLowStock && (
                        <span className="badge badge-warning" style={{ marginLeft: '0.5rem' }}>
                          ⚠️ Sắp hết
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(ingredient)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(ingredient.id, ingredient.name)}
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
              <h3>{editingIngredient ? '📝 Sửa Nguyên Liệu' : '➕ Thêm Nguyên Liệu'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="ingredient-name" className="form-label">Tên Nguyên Liệu *</label>
                <input
                  id="ingredient-name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  aria-label="Tên nguyên liệu"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ingredient-unit" className="form-label">Đơn Vị *</label>
                  <input
                    id="ingredient-unit"
                    type="text"
                    className="form-control"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                    placeholder="kg, g, ml, l, cái, gói..."
                    aria-label="Đơn vị"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ingredient-supplier" className="form-label">Nhà Cung Cấp</label>
                  <input
                    id="ingredient-supplier"
                    type="text"
                    className="form-control"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    aria-label="Nhà cung cấp"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ingredient-quantity" className="form-label">Số Lượng *</label>
                  <input
                    id="ingredient-quantity"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    required
                    aria-label="Số lượng"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ingredient-min-quantity" className="form-label">SL Tối Thiểu *</label>
                  <input
                    id="ingredient-min-quantity"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: parseFloat(e.target.value) || 0 })}
                    required
                    aria-label="Số lượng tối thiểu"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ingredient-price" className="form-label">Giá Mỗi Đơn Vị *</label>
                <input
                  id="ingredient-price"
                  type="number"
                  step="1000"
                  className="form-control"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                  required
                  aria-label="Giá mỗi đơn vị"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ingredient-description" className="form-label">Mô Tả</label>
                <textarea
                  id="ingredient-description"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  aria-label="Mô tả nguyên liệu"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIngredient ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientsPage;

