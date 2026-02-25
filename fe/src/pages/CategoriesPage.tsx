import { useState, useEffect } from 'react';
import { 
  getCategories,
  getCategoryById,
  createCategory, 
  updateCategory, 
  deleteCategory
} from '../api/categoryService';
import type { CategoryList, CreateCategoryDto, UpdateCategoryDto, Category } from '../api/categoryService';
import './CategoriesPage.css';

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

const CategoriesPage = () => {
  const [categories, setCategories] = useState<CategoryList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      // Sắp xếp danh mục mới nhất lên đầu (theo ID giảm dần)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setCategories(sortedData);
    } catch (err) {
      setError('Không thể tải danh mục. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '' });
    setShowModal(true);
  };

  const handleEdit = (category: CategoryList) => {
    // Fetch full category details
    getCategoryById(category.id).then((fullCategory) => {
      setEditingCategory(fullCategory);
      setFormData({
        name: fullCategory.name,
        description: fullCategory.description || '',
        imageUrl: fullCategory.imageUrl || ''
      });
      setShowModal(true);
    }).catch((err) => {
      window.alert('Không thể tải thông tin danh mục');
      console.error('Error loading category details:', err);
    });
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteCategory(id);
      window.alert('Xóa danh mục thành công!');
      loadCategories();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err, 
        'Không thể xóa danh mục. Danh mục này có thể đang có sản phẩm liên kết.'
      );
      window.alert(errorMessage);
      console.error('Error deleting category:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      window.alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      if (editingCategory) {
        // Update
        const updateData: UpdateCategoryDto = {
          name: formData.name,
          description: formData.description,
          imageUrl: formData.imageUrl,
          isActive: editingCategory.isActive
        };
        await updateCategory(editingCategory.id, updateData);
        window.alert('Cập nhật danh mục thành công!');
      } else {
        // Create
        await createCategory(formData);
        window.alert('Thêm danh mục thành công!');
      }
      
      setShowModal(false);
      loadCategories();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể thêm/sửa danh mục. Tên danh mục có thể đã tồn tại.'
      );
      window.alert(errorMessage);
      console.error('Error saving category:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageUrl: '' });
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      category.name.toLowerCase().includes(search) ||
      (category.description?.toLowerCase().includes(search) || false)
    );
  });

  return (
    <div className="categories-page">
      <div className="page-header">
        <h2>📁 Quản Lý Danh Mục</h2>
        <div className="header-actions">
          <button className="btn btn-success" onClick={loadCategories}>🔄 Làm mới</button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Danh Mục</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên danh mục, mô tả..."
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
          Hiển thị <strong>{filteredCategories.length}</strong> / {categories.length} danh mục
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
                <th>Tên Danh Mục</th>
                <th>Mô Tả</th>
                <th>Số Sản Phẩm</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    <td>{category.description || '—'}</td>
                    <td>{category.productCount}</td>
                    <td>
                      <span className={`badge ${category.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(category)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(category.id, category.name)}
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
              <h3>{editingCategory ? '📝 Sửa Danh Mục' : '➕ Thêm Danh Mục'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="category-name" className="form-label">Tên Danh Mục *</label>
                <input
                  id="category-name"
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  aria-label="Tên danh mục"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-description" className="form-label">Mô Tả</label>
                <textarea
                  id="category-description"
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  aria-label="Mô tả danh mục"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category-image-url" className="form-label">URL Hình Ảnh</label>
                <input
                  id="category-image-url"
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
                  {editingCategory ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;

