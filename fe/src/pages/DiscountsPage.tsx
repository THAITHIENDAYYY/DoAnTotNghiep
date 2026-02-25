import { useState, useEffect } from 'react';
import { 
  getDiscounts,
  getDiscountById,
  createDiscount, 
  updateDiscount, 
  deleteDiscount,
  toggleDiscountStatus,
  DiscountType
} from '../api/discountService';
import { getCustomerTiers } from '../api/customerService';
import { getCategories } from '../api/categoryService';
import { getProducts } from '../api/productService';
import type { 
  DiscountList, 
  Discount, 
  CreateDiscountDto, 
  UpdateDiscountDto
} from '../api/discountService';
import type { CustomerTier } from '../api/customerService';
import type { CategoryList } from '../api/categoryService';
import type { ProductList } from '../api/productService';
import { EmployeeRole } from '../api/employeeService';
import './DiscountsPage.css';

// Helper type for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    } | any;
  };
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as ApiError;
    return apiErr.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

const DiscountsPage = () => {
  const [discounts, setDiscounts] = useState<DiscountList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Data for dropdowns
  const [customerTiers, setCustomerTiers] = useState<CustomerTier[]>([]);
  const [categories, setCategories] = useState<CategoryList[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);

  // Form data
  const [formData, setFormData] = useState<CreateDiscountDto>({
    code: '',
    name: '',
    description: '',
    type: DiscountType.Percentage,
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    usageLimit: undefined,
    applicableProductIds: [],
    applicableCategoryIds: [],
    applicableCustomerTierIds: [],
    applicableEmployeeRoleIds: [],
    buyQuantity: undefined,
    freeProductId: undefined,
    freeProductQuantity: undefined,
    freeProductDiscountType: 0, // 0 = Free, 1 = Percentage, 2 = FixedAmount
    freeProductDiscountValue: undefined
  });

  // Selection states for conditions
  const [applyToAllCustomers, setApplyToAllCustomers] = useState(true);
  const [applyToAllEmployees, setApplyToAllEmployees] = useState(true);
  const [applyToAllProducts, setApplyToAllProducts] = useState(true);
  const [applyToAllCategories, setApplyToAllCategories] = useState(true);

  useEffect(() => {
    loadDiscounts();
    loadCustomerTiers();
    loadCategories();
    loadProducts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDiscounts();
      setDiscounts(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError('Không thể tải danh sách mã giảm giá. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading discounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerTiers = async () => {
    try {
      const data = await getCustomerTiers();
      setCustomerTiers(data);
    } catch (err) {
      console.error('Error loading customer tiers:', err);
    }
  };

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
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const handleAdd = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: DiscountType.Percentage,
      discountValue: 0,
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: undefined,
      applicableProductIds: [],
      applicableCategoryIds: [],
      applicableCustomerTierIds: [],
      applicableEmployeeRoleIds: [],
      buyQuantity: undefined,
      freeProductId: undefined,
      freeProductQuantity: undefined
    });
    setApplyToAllCustomers(true);
    setApplyToAllEmployees(true);
    setApplyToAllProducts(true);
    setApplyToAllCategories(true);
    setShowModal(true);
  };

  const handleEdit = async (discount: DiscountList) => {
    try {
      const fullDiscount = await getDiscountById(discount.id);
      setEditingDiscount(fullDiscount);
      setFormData({
        code: fullDiscount.code,
        name: fullDiscount.name,
        description: fullDiscount.description || '',
        type: fullDiscount.type,
        discountValue: fullDiscount.discountValue,
        minOrderAmount: fullDiscount.minOrderAmount || undefined,
        maxDiscountAmount: fullDiscount.maxDiscountAmount || undefined,
        startDate: fullDiscount.startDate.split('T')[0],
        endDate: fullDiscount.endDate.split('T')[0],
        usageLimit: fullDiscount.usageLimit || undefined,
        applicableProductIds: fullDiscount.applicableProductIds || [],
        applicableCategoryIds: fullDiscount.applicableCategoryIds || [],
        applicableCustomerTierIds: fullDiscount.applicableCustomerTierIds || [],
        applicableEmployeeRoleIds: fullDiscount.applicableEmployeeRoleIds || [],
        buyQuantity: fullDiscount.buyQuantity || undefined,
        freeProductId: fullDiscount.freeProductId || undefined,
        freeProductQuantity: fullDiscount.freeProductQuantity || undefined,
        freeProductDiscountType: fullDiscount.freeProductDiscountType ?? 0,
        freeProductDiscountValue: fullDiscount.freeProductDiscountValue || undefined
      });
      
      // Set selection states
      setApplyToAllCustomers(fullDiscount.applicableCustomerTierIds.length === 0);
      setApplyToAllEmployees(fullDiscount.applicableEmployeeRoleIds.length === 0);
      setApplyToAllProducts(fullDiscount.applicableProductIds.length === 0);
      setApplyToAllCategories(fullDiscount.applicableCategoryIds.length === 0);
      
      setShowModal(true);
    } catch (err) {
      window.alert('Không thể tải thông tin mã giảm giá');
      console.error('Error loading discount details:', err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteDiscount(id);
      window.alert('Xóa mã giảm giá thành công!');
      loadDiscounts();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err, 
        'Không thể xóa mã giảm giá. Mã này có thể đã được sử dụng trong đơn hàng.'
      );
      window.alert(errorMessage);
      console.error('Error deleting discount:', err);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleDiscountStatus(id);
      window.alert(`Mã giảm giá đã được ${currentStatus ? 'vô hiệu hóa' : 'kích hoạt'}!`);
      loadDiscounts();
    } catch (err) {
      window.alert('Không thể thay đổi trạng thái mã giảm giá');
      console.error('Error toggling discount status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      window.alert('Vui lòng nhập mã giảm giá');
      return;
    }

    if (!formData.name.trim()) {
      window.alert('Vui lòng nhập tên chương trình');
      return;
    }

    // Validation cho BuyXGetY
    if (formData.type === DiscountType.BuyXGetY) {
      if (!formData.buyQuantity || formData.buyQuantity < 1) {
        window.alert('Vui lòng nhập số lượng cần mua cho loại Mua X tặng Y');
        return;
      }
      if (!formData.freeProductId) {
        window.alert('Vui lòng chọn sản phẩm được tặng');
        return;
      }
      if (!formData.freeProductQuantity || formData.freeProductQuantity < 1) {
        window.alert('Vui lòng nhập số lượng sản phẩm được tặng');
        return;
      }
      
      // Validation cho loại giảm giá món tặng
      if (formData.freeProductDiscountType !== undefined && formData.freeProductDiscountType !== 0) {
        if (!formData.freeProductDiscountValue || formData.freeProductDiscountValue < 0) {
          window.alert('Vui lòng nhập giá trị giảm cho món tặng');
          return;
        }
        if (formData.freeProductDiscountType === 1 && formData.freeProductDiscountValue > 100) {
          window.alert('Phần trăm giảm giá không được vượt quá 100%');
          return;
        }
      }
    } else {
      // Validation cho Percentage và FixedAmount
      if (formData.discountValue <= 0) {
        window.alert('Giá trị giảm giá phải lớn hơn 0');
        return;
      }

      if (formData.type === DiscountType.Percentage && formData.discountValue > 100) {
        window.alert('Phần trăm giảm giá không được vượt quá 100%');
        return;
      }
    }

    try {
      // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
      const startDate = new Date(formData.startDate + 'T00:00:00');
      const endDate = new Date(formData.endDate + 'T23:59:59');
      
      if (startDate >= endDate) {
        window.alert('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        return;
      }

      // Chuẩn bị dữ liệu submit - chỉ gửi các mảng có giá trị, undefined nếu không có
      const getArrayOrUndefined = (arr: number[] | undefined, isEmpty: boolean): number[] | undefined => {
        if (isEmpty) return undefined;
        return arr && arr.length > 0 ? arr : undefined;
      };

      const submitData: CreateDiscountDto | UpdateDiscountDto = {
        code: formData.code.toUpperCase().trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        type: formData.type,
        discountValue: formData.type === DiscountType.BuyXGetY ? 0 : formData.discountValue, // BuyXGetY không cần discountValue
        minOrderAmount: formData.minOrderAmount && formData.minOrderAmount > 0 ? formData.minOrderAmount : undefined,
        maxDiscountAmount: formData.maxDiscountAmount && formData.maxDiscountAmount > 0 ? formData.maxDiscountAmount : undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        usageLimit: formData.usageLimit && formData.usageLimit > 0 ? formData.usageLimit : undefined,
        applicableProductIds: getArrayOrUndefined(formData.applicableProductIds, applyToAllProducts),
        applicableCategoryIds: getArrayOrUndefined(formData.applicableCategoryIds, applyToAllCategories),
        applicableCustomerTierIds: getArrayOrUndefined(formData.applicableCustomerTierIds, applyToAllCustomers),
        applicableEmployeeRoleIds: getArrayOrUndefined(formData.applicableEmployeeRoleIds, applyToAllEmployees),
        // BuyXGetY fields
        ...(formData.type === DiscountType.BuyXGetY ? {
          buyQuantity: formData.buyQuantity,
          freeProductId: formData.freeProductId,
          freeProductQuantity: formData.freeProductQuantity,
          freeProductDiscountType: formData.freeProductDiscountType ?? 0,
          freeProductDiscountValue: formData.freeProductDiscountType !== undefined && formData.freeProductDiscountType !== 0 
            ? formData.freeProductDiscountValue 
            : undefined
        } : {})
      };
      
      console.log('Submitting discount data:', JSON.stringify(submitData, null, 2));
      console.log('Form data:', JSON.stringify(formData, null, 2));

      if (editingDiscount) {
        // Update
        const updateData: UpdateDiscountDto = {
          ...submitData,
          isActive: editingDiscount.isActive
        };
        await updateDiscount(editingDiscount.id, updateData);
        window.alert('Cập nhật mã giảm giá thành công!');
      } else {
        // Create
        await createDiscount(submitData as CreateDiscountDto);
        window.alert('Thêm mã giảm giá thành công!');
      }
      
      setShowModal(false);
      loadDiscounts();
    } catch (err) {
      console.error('Error saving discount:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      let errorMessage = 'Không thể thêm/sửa mã giảm giá. ';
      
      if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as ApiError;
        
        // Log chi tiết để debug
        console.error('API Error Status:', apiErr.response?.status);
        console.error('API Error Data:', JSON.stringify(apiErr.response?.data, null, 2));
        
        // Nếu có response data
        if (apiErr.response?.data) {
          const data = apiErr.response.data as any;
          
          // Kiểm tra nếu có errors object (ASP.NET Core ModelState format)
          if (data.errors && typeof data.errors === 'object') {
            const errors: string[] = [];
            Object.keys(data.errors).forEach(key => {
              const value = data.errors[key];
              if (Array.isArray(value) && value.length > 0) {
                // Lấy tất cả error messages cho field này
                errors.push(`${key}: ${value.join(', ')}`);
              } else if (typeof value === 'string') {
                errors.push(`${key}: ${value}`);
              }
            });
            if (errors.length > 0) {
              errorMessage += '\n\nChi tiết lỗi:\n' + errors.join('\n');
            } else if (data.title) {
              errorMessage += data.title;
            } else {
              errorMessage += 'Dữ liệu không hợp lệ.';
            }
          }
          // Nếu có message cụ thể
          else if (data.message) {
            errorMessage += String(data.message);
          }
          // Nếu là ModelState errors format cũ
          else if (typeof data === 'object' && !('message' in data) && !('errors' in data)) {
            const errors: string[] = [];
            Object.keys(data).forEach(key => {
              const value = (data as any)[key];
              if (Array.isArray(value) && value.length > 0) {
                errors.push(`${key}: ${value[0]}`);
              }
            });
            if (errors.length > 0) {
              errorMessage += errors.join('\n');
            } else {
              errorMessage += 'Dữ liệu không hợp lệ.';
            }
          } else {
            errorMessage += 'Mã có thể đã tồn tại hoặc có lỗi xảy ra.';
          }
        } else {
          errorMessage += 'Mã có thể đã tồn tại hoặc có lỗi xảy ra.';
        }
      } else {
        errorMessage += 'Mã có thể đã tồn tại hoặc có lỗi xảy ra.';
      }
      
      window.alert(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Filter discounts based on search term
  const filteredDiscounts = discounts.filter(discount => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      discount.code.toLowerCase().includes(search) ||
      discount.name.toLowerCase().includes(search)
    );
  });

  const employeeRoleNames: Record<number, string> = {
    [EmployeeRole.Admin]: 'Quản trị viên',
    [EmployeeRole.Cashier]: 'Thu ngân',
    [EmployeeRole.WarehouseStaff]: 'Nhân viên kho'
  };

  return (
    <div className="discounts-page">
      <div className="page-header">
        <h2>🎁 Quản Lý Giảm Giá</h2>
        <div className="header-actions">
          <button className="btn btn-success" onClick={loadDiscounts}>🔄 Làm mới</button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Mã Giảm Giá</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã, tên..."
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
          Hiển thị <strong>{filteredDiscounts.length}</strong> / {discounts.length} mã giảm giá
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
                <th>Mã</th>
                <th>Tên</th>
                <th>Loại</th>
                <th>Giá Trị</th>
                <th>Thời Gian</th>
                <th>Lượt Dùng</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {searchTerm ? 'Không tìm thấy mã giảm giá nào' : 'Chưa có mã giảm giá nào'}
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map((discount, index) => (
                  <tr key={discount.id}>
                    <td>{index + 1}</td>
                    <td><strong>{discount.code}</strong></td>
                    <td>{discount.name}</td>
                    <td>{discount.typeName}</td>
                    <td>
                      <strong style={{ 
                        color: discount.type === DiscountType.Percentage ? '#28a745' : 
                               discount.type === DiscountType.FixedAmount ? '#ff6b35' : '#9c27b0',
                        fontSize: '1.05rem'
                      }}>
                        {discount.type === DiscountType.Percentage 
                          ? `${discount.discountValue}%`
                          : discount.type === DiscountType.FixedAmount
                          ? formatPrice(discount.discountValue)
                          : 'Mua X tặng Y'
                        }
                      </strong>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{formatDate(discount.startDate)}</div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>→ {formatDate(discount.endDate)}</div>
                    </td>
                    <td>
                      {discount.usageLimit 
                        ? `${discount.usedCount}/${discount.usageLimit}`
                        : `${discount.usedCount} lượt`
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span className={`badge ${discount.isValid ? 'badge-success' : 'badge-danger'}`}>
                          {discount.isValid ? '✓ Hiệu lực' : '✗ Không hiệu lực'}
                        </span>
                        <span className={`badge ${discount.isActive ? 'badge-info' : 'badge-secondary'}`}>
                          {discount.isActive ? '▶ Hoạt động' : '⏸ Tạm dừng'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleEdit(discount)}
                          title="Sửa mã giảm giá"
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          className="btn btn-warning btn-sm" 
                          onClick={() => handleToggleStatus(discount.id, discount.isActive)}
                          title={discount.isActive ? 'Tạm dừng mã giảm giá' : 'Kích hoạt mã giảm giá'}
                        >
                          {discount.isActive ? '⏸️ Tạm dừng' : '▶️ Kích hoạt'}
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDelete(discount.id, discount.name)}
                          title="Xóa mã giảm giá"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
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
          <div className="modal-content discount-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDiscount ? '📝 Sửa Mã Giảm Giá' : '➕ Thêm Mã Giảm Giá'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="discount-form">
              {/* Basic Info */}
              <div className="form-section">
                <h4>Thông Tin Cơ Bản</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount-code" className="form-label">Mã Giảm Giá *</label>
                    <input
                      id="discount-code"
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                      placeholder="VD: GIAM10K, SALE50"
                      maxLength={50}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount-name" className="form-label">Tên Chương Trình *</label>
                    <input
                      id="discount-name"
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="VD: Giảm 10K cho khách VIP"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="discount-description" className="form-label">Mô Tả</label>
                  <textarea
                    id="discount-description"
                    className="form-control"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả chi tiết về chương trình giảm giá..."
                  />
                </div>
              </div>

              {/* Discount Settings */}
              <div className="form-section">
                <h4>Thiết Lập Giảm Giá</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="discount-type" className="form-label">Loại Giảm Giá *</label>
                    <select
                      id="discount-type"
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) as DiscountType })}
                      required
                    >
                      <option value={DiscountType.Percentage}>Phần trăm (%)</option>
                      <option value={DiscountType.FixedAmount}>Số tiền cố định (VNĐ)</option>
                      <option value={DiscountType.BuyXGetY}>Mua X tặng Y</option>
                    </select>
                  </div>

                  {formData.type !== DiscountType.BuyXGetY && (
                    <div className="form-group">
                      <label htmlFor="discount-value" className="form-label">
                        Giá Trị Giảm * 
                        {formData.type === DiscountType.Percentage ? ' (%)' : ' (VNĐ)'}
                      </label>
                      <input
                        id="discount-value"
                        type="number"
                        className="form-control"
                        value={formData.discountValue || ''}
                        onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                        required
                        min={0}
                        max={formData.type === DiscountType.Percentage ? 100 : undefined}
                        step={formData.type === DiscountType.Percentage ? 1 : 1000}
                      />
                    </div>
                  )}
                </div>

                {/* BuyXGetY Settings */}
                {formData.type === DiscountType.BuyXGetY && (
                  <div className="form-section" style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ marginTop: 0 }}>Thiết Lập Mua X Tặng Y</h4>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="buy-quantity" className="form-label">Số Lượng Cần Mua *</label>
                        <input
                          id="buy-quantity"
                          type="number"
                          className="form-control"
                          value={formData.buyQuantity || ''}
                          onChange={(e) => setFormData({ ...formData, buyQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                          required={formData.type === DiscountType.BuyXGetY}
                          min={1}
                          placeholder="VD: 2 (mua 2 tặng 1)"
                        />
                        <small className="form-text">Ví dụ: Nhập 2 để "Mua 2 tặng 1"</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="free-product-quantity" className="form-label">Số Lượng Tặng *</label>
                        <input
                          id="free-product-quantity"
                          type="number"
                          className="form-control"
                          value={formData.freeProductQuantity || ''}
                          onChange={(e) => setFormData({ ...formData, freeProductQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                          required={formData.type === DiscountType.BuyXGetY}
                          min={1}
                          placeholder="VD: 1"
                        />
                        <small className="form-text">Số lượng sản phẩm được tặng</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="free-product" className="form-label">Sản Phẩm Được Tặng/Giảm Giá *</label>
                      <select
                        id="free-product"
                        className="form-control"
                        value={formData.freeProductId || ''}
                        onChange={(e) => setFormData({ ...formData, freeProductId: e.target.value ? parseInt(e.target.value) : undefined })}
                        required={formData.type === DiscountType.BuyXGetY}
                      >
                        <option value="">-- Chọn sản phẩm được tặng --</option>
                        {products.filter(p => p.isActive && p.isAvailable).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {formatPrice(product.price)}
                          </option>
                        ))}
                      </select>
                      {formData.freeProductId && (
                        <small className="form-text" style={{ color: '#28a745', marginTop: '0.25rem', display: 'block' }}>
                          ✓ Đã chọn: {products.find(p => p.id === formData.freeProductId)?.name}
                        </small>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="free-product-discount-type" className="form-label">Loại Giảm Giá Cho Món Tặng *</label>
                        <select
                          id="free-product-discount-type"
                          className="form-control"
                          value={formData.freeProductDiscountType ?? 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setFormData({ 
                              ...formData, 
                              freeProductDiscountType: value,
                              freeProductDiscountValue: value === 0 ? undefined : formData.freeProductDiscountValue
                            });
                          }}
                          required={formData.type === DiscountType.BuyXGetY}
                        >
                          <option value={0}>Tặng miễn phí</option>
                          <option value={1}>Giảm phần trăm (%)</option>
                          <option value={2}>Giảm số tiền cố định (VNĐ)</option>
                        </select>
                        <small className="form-text">Chọn cách áp dụng cho món thứ Y</small>
                      </div>

                      {formData.freeProductDiscountType !== undefined && formData.freeProductDiscountType !== 0 && (
                        <div className="form-group">
                          <label htmlFor="free-product-discount-value" className="form-label">
                            Giá Trị Giảm Cho Món Tặng * 
                            {formData.freeProductDiscountType === 1 ? ' (%)' : ' (VNĐ)'}
                          </label>
                          <input
                            id="free-product-discount-value"
                            type="number"
                            className="form-control"
                            value={formData.freeProductDiscountValue || ''}
                            onChange={(e) => setFormData({ ...formData, freeProductDiscountValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                            required={formData.freeProductDiscountType !== 0}
                            min={0}
                            max={formData.freeProductDiscountType === 1 ? 100 : undefined}
                            step={formData.freeProductDiscountType === 1 ? 1 : 1000}
                            placeholder={formData.freeProductDiscountType === 1 ? "VD: 50 (giảm 50%)" : "VD: 20000 (giảm 20k)"}
                          />
                          <small className="form-text">
                            {formData.freeProductDiscountType === 1 
                              ? "Ví dụ: Nhập 50 để giảm 50% giá cho món tặng"
                              : "Ví dụ: Nhập 20000 để giảm 20.000đ cho món tặng"
                            }
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="min-order-amount" className="form-label">Đơn Hàng Tối Thiểu (VNĐ)</label>
                    <input
                      id="min-order-amount"
                      type="number"
                      className="form-control"
                      value={formData.minOrderAmount || ''}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                      min={0}
                      step={1000}
                      placeholder="Không giới hạn"
                    />
                  </div>

                  {formData.type === DiscountType.Percentage && (
                    <div className="form-group">
                      <label htmlFor="max-discount-amount" className="form-label">Giảm Tối Đa (VNĐ)</label>
                      <input
                        id="max-discount-amount"
                        type="number"
                        className="form-control"
                        value={formData.maxDiscountAmount || ''}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                        min={0}
                        step={1000}
                        placeholder="Không giới hạn"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Time Settings */}
              <div className="form-section">
                <h4>Thời Gian Áp Dụng</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start-date" className="form-label">Ngày Bắt Đầu *</label>
                    <input
                      id="start-date"
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end-date" className="form-label">Ngày Kết Thúc *</label>
                    <input
                      id="end-date"
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usage-limit" className="form-label">Số Lượt Sử Dụng Tối Đa</label>
                    <input
                      id="usage-limit"
                      type="number"
                      className="form-control"
                      value={formData.usageLimit || ''}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={1}
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>
              </div>

              {/* Applicable Conditions */}
              <div className="form-section">
                <h4>Điều Kiện Áp Dụng</h4>

                {/* Customer Tiers */}
                <div className="condition-group">
                  <div className="condition-header">
                    <label>
                      <input
                        type="checkbox"
                        checked={applyToAllCustomers}
                        onChange={(e) => {
                          setApplyToAllCustomers(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, applicableCustomerTierIds: [] });
                          }
                        }}
                      />
                      <strong>Áp dụng cho TẤT CẢ khách hàng</strong>
                    </label>
                  </div>
                  {!applyToAllCustomers && (
                    <div className="condition-options">
                      <p className="condition-subtitle">Chọn hạng khách hàng:</p>
                      <div className="checkbox-grid">
                        {customerTiers.map((tier) => (
                          <label key={tier.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.applicableCustomerTierIds?.includes(tier.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.applicableCustomerTierIds || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, applicableCustomerTierIds: [...currentIds, tier.id] });
                                } else {
                                  setFormData({ ...formData, applicableCustomerTierIds: currentIds.filter(id => id !== tier.id) });
                                }
                              }}
                            />
                            <span style={{ color: tier.colorHex, fontWeight: 600 }}>{tier.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Employee Roles */}
                <div className="condition-group">
                  <div className="condition-header">
                    <label>
                      <input
                        type="checkbox"
                        checked={applyToAllEmployees}
                        onChange={(e) => {
                          setApplyToAllEmployees(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, applicableEmployeeRoleIds: [] });
                          }
                        }}
                      />
                      <strong>Áp dụng cho TẤT CẢ nhân viên</strong>
                    </label>
                  </div>
                  {!applyToAllEmployees && (
                    <div className="condition-options">
                      <p className="condition-subtitle">Chọn vai trò nhân viên:</p>
                      <div className="checkbox-grid">
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.applicableEmployeeRoleIds?.includes(EmployeeRole.Admin) || false}
                            onChange={(e) => {
                              const currentIds = formData.applicableEmployeeRoleIds || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, applicableEmployeeRoleIds: [...currentIds, EmployeeRole.Admin] });
                              } else {
                                setFormData({ ...formData, applicableEmployeeRoleIds: currentIds.filter(id => id !== EmployeeRole.Admin) });
                              }
                            }}
                          />
                          <span>{employeeRoleNames[EmployeeRole.Admin]}</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.applicableEmployeeRoleIds?.includes(EmployeeRole.Cashier) || false}
                            onChange={(e) => {
                              const currentIds = formData.applicableEmployeeRoleIds || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, applicableEmployeeRoleIds: [...currentIds, EmployeeRole.Cashier] });
                              } else {
                                setFormData({ ...formData, applicableEmployeeRoleIds: currentIds.filter(id => id !== EmployeeRole.Cashier) });
                              }
                            }}
                          />
                          <span>{employeeRoleNames[EmployeeRole.Cashier]}</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.applicableEmployeeRoleIds?.includes(EmployeeRole.WarehouseStaff) || false}
                            onChange={(e) => {
                              const currentIds = formData.applicableEmployeeRoleIds || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, applicableEmployeeRoleIds: [...currentIds, EmployeeRole.WarehouseStaff] });
                              } else {
                                setFormData({ ...formData, applicableEmployeeRoleIds: currentIds.filter(id => id !== EmployeeRole.WarehouseStaff) });
                              }
                            }}
                          />
                          <span>{employeeRoleNames[EmployeeRole.WarehouseStaff]}</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="condition-group">
                  <div className="condition-header">
                    <label>
                      <input
                        type="checkbox"
                        checked={applyToAllProducts}
                        onChange={(e) => {
                          setApplyToAllProducts(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, applicableProductIds: [] });
                          }
                        }}
                      />
                      <strong>Áp dụng cho TẤT CẢ sản phẩm</strong>
                    </label>
                  </div>
                  {!applyToAllProducts && (
                    <div className="condition-options">
                      <p className="condition-subtitle">Chọn sản phẩm (có thể chọn nhiều):</p>
                      <div className="checkbox-grid">
                        {products.map((product) => (
                          <label key={product.id} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.applicableProductIds?.includes(product.id) || false}
                              onChange={(e) => {
                                const currentIds = formData.applicableProductIds || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, applicableProductIds: [...currentIds, product.id] });
                                } else {
                                  setFormData({ ...formData, applicableProductIds: currentIds.filter(id => id !== product.id) });
                                }
                              }}
                            />
                            <span>{product.name} - {formatPrice(product.price)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="condition-group">
                  <div className="condition-header">
                    <label>
                      <input
                        type="checkbox"
                        checked={applyToAllCategories}
                        onChange={(e) => {
                          setApplyToAllCategories(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, applicableCategoryIds: [] });
                          }
                        }}
                      />
                      <strong>Áp dụng cho TẤT CẢ danh mục</strong>
                    </label>
                  </div>
                  {!applyToAllCategories && (
                    <div className="condition-options">
                      <p className="condition-subtitle">Chọn danh mục (có thể chọn nhiều):</p>
                      <div className="checkbox-grid">
                        {categories.map((category) => {
                          // Tìm tất cả products thuộc category này
                          const productsInCategory = products.filter(p => p.categoryId === category.id);
                          
                          return (
                            <label key={category.id} className="checkbox-item">
                              <input
                                type="checkbox"
                                checked={formData.applicableCategoryIds?.includes(category.id) || false}
                                onChange={(e) => {
                                  const currentCategoryIds = formData.applicableCategoryIds || [];
                                  const currentProductIds = formData.applicableProductIds || [];
                                  const productIdsInCategory = productsInCategory.map(p => p.id);
                                  
                                  if (e.target.checked) {
                                    // Chọn category: thêm category vào danh sách và tự động tích tất cả products trong category
                                    const newCategoryIds = [...currentCategoryIds, category.id];
                                    // Thêm tất cả products của category vào applicableProductIds (tránh trùng)
                                    const newProductIds = [...new Set([...currentProductIds, ...productIdsInCategory])];
                                    setFormData({ 
                                      ...formData, 
                                      applicableCategoryIds: newCategoryIds,
                                      applicableProductIds: newProductIds
                                    });
                                  } else {
                                    // Bỏ chọn category: xóa category và tự động bỏ tích tất cả products trong category
                                    const newCategoryIds = currentCategoryIds.filter(id => id !== category.id);
                                    // Chỉ xóa products thuộc category này, giữ lại products thuộc categories khác
                                    // Kiểm tra xem product có thuộc categories nào khác đã được chọn không
                                    const otherSelectedCategories = newCategoryIds;
                                    const productsInOtherCategories = products
                                      .filter(p => otherSelectedCategories.includes(p.categoryId))
                                      .map(p => p.id);
                                    
                                    // Giữ lại products thuộc categories khác hoặc không thuộc category nào (đã chọn thủ công)
                                    const newProductIds = currentProductIds.filter(productId => {
                                      // Nếu product thuộc category này, chỉ giữ nếu nó cũng thuộc categories khác đã chọn
                                      if (productIdsInCategory.includes(productId)) {
                                        return productsInOtherCategories.includes(productId);
                                      }
                                      // Giữ lại products không thuộc category này
                                      return true;
                                    });
                                    
                                    setFormData({ 
                                      ...formData, 
                                      applicableCategoryIds: newCategoryIds,
                                      applicableProductIds: newProductIds
                                    });
                                  }
                                }}
                              />
                              <span>{category.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDiscount ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountsPage;

