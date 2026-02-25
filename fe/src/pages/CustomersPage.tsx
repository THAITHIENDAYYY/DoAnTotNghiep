import { useState, useEffect } from 'react';
import { 
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTiers,
  createCustomerTier,
  updateCustomerTier,
  deleteCustomerTier,
  exportCustomers
} from '../api/customerService';
import type { 
  CustomerList, 
  Customer, 
  CreateCustomerDto, 
  UpdateCustomerDto,
  CustomerTier,
  CreateCustomerTierDto
} from '../api/customerService';
import './CustomersPage.css';

// Helper type for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      title?: string;
    };
  };
  message?: string;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as ApiError;
    const response = apiErr.response;
    
    if (response?.data) {
      // Nếu có message trực tiếp
      if (response.data.message) {
        return response.data.message;
      }
      
      // Nếu có validation errors
      if (response.data.errors) {
        const errorMessages = Object.entries(response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return errorMessages || defaultMessage;
      }
      
      // Nếu có title (thường từ BadRequest ModelState)
      if (response.data.title) {
        return response.data.title;
      }
    }
    
    // Xử lý các status code khác
    if (response?.status === 409) {
      return 'Email đã tồn tại. Vui lòng sử dụng email khác.';
    }
    if (response?.status === 404) {
      return 'Không tìm thấy khách hàng.';
    }
    if (response?.status === 400) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.';
    }
  }
  
  // Nếu có message từ error object
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message;
  }
  
  return defaultMessage;
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formData, setFormData] = useState<CreateCustomerDto>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: '',
    userId: ''
  });
  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);
  const [editingTier, setEditingTier] = useState<CustomerTier | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tierForm, setTierForm] = useState<CreateCustomerTierDto>({
    name: '',
    minimumSpent: 0,
    colorHex: '#ff6b35',
    description: '',
    displayOrder: 0
  });

  useEffect(() => {
    loadCustomers();
    loadCustomerTiers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomers();
      // Sắp xếp khách hàng mới nhất lên đầu (theo ID giảm dần)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setCustomers(sortedData);
    } catch (err) {
      setError('Không thể tải danh sách khách hàng. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCustomers = async () => {
    try {
      setExporting(true);
      const blob = await exportCustomers();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `KhachHang_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting customers:', error);
      window.alert('Lỗi khi xuất danh sách khách hàng!');
    } finally {
      setExporting(false);
    }
  };

  const loadCustomerTiers = async () => {
    try {
      setTierLoading(true);
      setTierError(null);
      const data = await getCustomerTiers();
      setTiers(data);
    } catch (err) {
      console.error('Error loading tiers:', err);
      setTierError('Không thể tải danh sách hạng khách hàng.');
    } finally {
      setTierLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      postalCode: '',
      dateOfBirth: '',
      userId: ''
    });
    setShowModal(true);
  };

  const handleEdit = (customer: CustomerList) => {
    getCustomerById(customer.id).then((fullCustomer) => {
      setEditingCustomer(fullCustomer);
      setFormData({
        firstName: fullCustomer.firstName,
        lastName: fullCustomer.lastName,
        email: fullCustomer.email,
        phoneNumber: fullCustomer.phoneNumber || '',
        address: fullCustomer.address || '',
        city: fullCustomer.city || '',
        postalCode: fullCustomer.postalCode || '',
        dateOfBirth: fullCustomer.dateOfBirth ? new Date(fullCustomer.dateOfBirth).toISOString().split('T')[0] : '',
        userId: fullCustomer.userId || ''
      });
      setShowModal(true);
    }).catch((err) => {
      window.alert('Không thể tải thông tin khách hàng');
      console.error('Error loading customer details:', err);
    });
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa khách hàng "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteCustomer(id);
      window.alert('Xóa khách hàng thành công!');
      loadCustomers();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể xóa khách hàng. Khách hàng này có thể đang có đơn hàng.'
      );
      window.alert(errorMessage);
      console.error('Error deleting customer:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.dateOfBirth) {
      window.alert('Vui lòng điền đầy đủ các trường bắt buộc: Họ, Tên, Email, và Ngày Sinh.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      window.alert('Email không hợp lệ. Vui lòng nhập đúng định dạng email.');
      return;
    }

    try {
      // Convert dateOfBirth from YYYY-MM-DD to ISO 8601 format
      let dateOfBirthISO: string;
      if (formData.dateOfBirth) {
        // Parse YYYY-MM-DD and convert to ISO 8601 with time 00:00:00 UTC
        // Sử dụng UTC để tránh vấn đề timezone
        const dateStr = formData.dateOfBirth;
        const date = new Date(dateStr + 'T00:00:00Z');
        if (isNaN(date.getTime())) {
          window.alert('Ngày sinh không hợp lệ. Vui lòng chọn lại ngày sinh.');
          return;
        }
        dateOfBirthISO = date.toISOString();
      } else {
        window.alert('Vui lòng chọn ngày sinh.');
        return;
      }
      
      console.log('DateOfBirth conversion:', {
        input: formData.dateOfBirth,
        output: dateOfBirthISO
      });

      if (editingCustomer) {
        // Update
        const updateData: UpdateCustomerDto = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          postalCode: formData.postalCode?.trim() || undefined,
          dateOfBirth: dateOfBirthISO,
          isActive: editingCustomer.isActive,
          userId: formData.userId?.trim() || undefined
        };
        
        console.log('Updating customer:', editingCustomer.id, updateData);
        await updateCustomer(editingCustomer.id, updateData);
        window.alert('Cập nhật khách hàng thành công!');
      } else {
        // Create
        const createData: CreateCustomerDto = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          city: formData.city?.trim() || undefined,
          postalCode: formData.postalCode?.trim() || undefined,
          dateOfBirth: dateOfBirthISO,
          userId: formData.userId?.trim() || undefined
        };
        
        console.log('Creating customer:', createData);
        await createCustomer(createData);
        window.alert('Thêm khách hàng thành công!');
      }
      
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      
      // Log chi tiết cho debugging
      if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as ApiError;
        console.error('Response status:', apiErr.response?.status);
        console.error('Response data:', apiErr.response?.data);
        console.error('Request config:', (err as any).config);
      }
      
      const errorMessage = getErrorMessage(
        err,
        'Không thể thêm/sửa khách hàng. Vui lòng kiểm tra lại thông tin.'
      );
      
      // Nếu là lỗi 500, hiển thị thông báo chi tiết hơn
      if (err && typeof err === 'object' && 'response' in err) {
        const apiErr = err as ApiError;
        if (apiErr.response?.status === 500) {
          const detailedMessage = `Lỗi máy chủ (500): ${errorMessage}\n\nVui lòng kiểm tra:\n1. Backend có đang chạy không?\n2. Dữ liệu gửi lên có đúng format không?\n3. Kiểm tra Console để xem chi tiết lỗi.`;
          window.alert(detailedMessage);
          return;
        }
      }
      
      window.alert(errorMessage);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      address: '',
      city: '',
      postalCode: '',
      dateOfBirth: '',
      userId: ''
    });
  };

  const resetTierForm = () => {
    setTierForm({
      name: '',
      minimumSpent: 0,
      colorHex: '#ff6b35',
      description: '',
      displayOrder: tiers.length
    });
    setEditingTier(null);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tierForm.name.trim()) {
      window.alert('Vui lòng nhập tên hạng khách hàng.');
      return;
    }

    if (tierForm.minimumSpent < 0) {
      window.alert('Ngưỡng chi tiêu phải lớn hơn hoặc bằng 0.');
      return;
    }

    try {
      const payload: CreateCustomerTierDto = {
        name: tierForm.name.trim(),
        minimumSpent: tierForm.minimumSpent,
        colorHex: tierForm.colorHex?.trim() || '#ff6b35',
        description: tierForm.description?.trim() || undefined,
        displayOrder: tierForm.displayOrder ?? 0
      };

      if (editingTier) {
        await updateCustomerTier(editingTier.id, payload);
        window.alert('Cập nhật hạng khách hàng thành công!');
      } else {
        await createCustomerTier(payload);
        window.alert('Thêm hạng khách hàng thành công!');
      }

      resetTierForm();
      await loadCustomerTiers();
      await loadCustomers();
      // Không đóng modal sau khi submit để có thể tiếp tục thêm/sửa
    } catch (err) {
      console.error('Error saving tier:', err);
      const message = getErrorMessage(err, 'Không thể lưu hạng khách hàng.');
      window.alert(message);
    }
  };

  const handleEditTier = (tier: CustomerTier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      minimumSpent: tier.minimumSpent,
      colorHex: tier.colorHex,
      description: tier.description,
      displayOrder: tier.displayOrder
    });
  };

  const handleDeleteTier = async (tier: CustomerTier) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa hạng "${tier.name}"?`);
    if (!confirmed) return;

    try {
      await deleteCustomerTier(tier.id);
      window.alert('Đã xóa hạng khách hàng.');
      await loadCustomerTiers();
      await loadCustomers();
    } catch (err) {
      console.error('Error deleting tier:', err);
      window.alert(getErrorMessage(err, 'Không thể xóa hạng khách hàng.'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      customer.fullName.toLowerCase().includes(search) ||
      customer.email.toLowerCase().includes(search) ||
      (customer.phoneNumber && customer.phoneNumber.toLowerCase().includes(search))
    );
  });

  return (
    <div className="customers-page">
      <div className="page-header">
        <h2>👥 Quản Lý Khách Hàng</h2>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowTierModal(true)}
          >
            🏷️ Phân Hạng Khách Hàng
          </button>
          <button className="btn btn-success" onClick={loadCustomers}>🔄 Làm mới</button>
          <button className="btn btn-secondary" onClick={handleExportCustomers} disabled={exporting}>
            {exporting ? 'Đang xuất...' : '⬇️ Xuất Excel'}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Khách Hàng</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
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
          Hiển thị <strong>{filteredCustomers.length}</strong> / {customers.length} khách hàng
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
                <th>Họ Tên</th>
                <th>Email</th>
                <th>Điện Thoại</th>
                <th>Thành Phố</th>
                <th>Số Đơn Hàng</th>
                <th>Tổng Chi Tiêu</th>
                <th>Hạng khách hàng</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-state">
                    {searchTerm ? 'Không tìm thấy khách hàng nào' : 'Chưa có khách hàng nào'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.id}>
                    <td>{index + 1}</td>
                    <td>{customer.fullName}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phoneNumber || '—'}</td>
                    <td>{customer.city || '—'}</td>
                    <td>{customer.totalOrders}</td>
                    <td>{formatCurrency(customer.totalSpent)}</td>
                    <td>
                      {customer.tierName ? (
                        <span
                          className="tier-badge"
                          style={{ backgroundColor: customer.tierColor || '#e5e7eb' }}
                        >
                          {customer.tierName}
                        </span>
                      ) : (
                        <span className="tier-badge tier-badge--muted">Chưa phân hạng</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {customer.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(customer)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(customer.id, customer.fullName)}
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
              <h3>{editingCustomer ? '📝 Sửa Khách Hàng' : '➕ Thêm Khách Hàng'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customer-firstname" className="form-label">Họ</label>
                  <input
                    id="customer-firstname"
                    type="text"
                    className="form-control"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    aria-label="Họ"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-lastname" className="form-label">Tên</label>
                  <input
                    id="customer-lastname"
                    type="text"
                    className="form-control"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    aria-label="Tên"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="customer-email" className="form-label">Email</label>
                <input
                  id="customer-email"
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  aria-label="Email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer-phone" className="form-label">Số Điện Thoại</label>
                <input
                  id="customer-phone"
                  type="tel"
                  className="form-control"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0123456789"
                  aria-label="Số điện thoại"
                />
              </div>

              <div className="form-group">
                <label htmlFor="customer-address" className="form-label">Địa Chỉ</label>
                <textarea
                  id="customer-address"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  aria-label="Địa chỉ"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customer-city" className="form-label">Thành Phố</label>
                  <input
                    id="customer-city"
                    type="text"
                    className="form-control"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    aria-label="Thành phố"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customer-postal" className="form-label">Mã Bưu Điện</label>
                  <input
                    id="customer-postal"
                    type="text"
                    className="form-control"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    aria-label="Mã bưu điện"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="customer-dob" className="form-label">Ngày Sinh</label>
                <input
                  id="customer-dob"
                  type="date"
                  className="form-control"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  aria-label="Ngày sinh"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tier Management Modal */}
      {showTierModal && (
        <div className="modal-overlay" onClick={() => setShowTierModal(false)}>
          <div className="modal-content tier-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ Phân Hạng Khách Hàng</h3>
              <button className="modal-close" onClick={() => setShowTierModal(false)}>✕</button>
            </div>
            
            <div className="tier-modal-body">
              <div className="tier-header">
                <p>Đặt ngưỡng chi tiêu để tự động phân loại khách hàng thành hạng Bạc, Vàng, Kim Cương...</p>
                <button className="btn btn-secondary btn-sm" onClick={loadCustomerTiers} disabled={tierLoading}>
                  {tierLoading ? 'Đang tải...' : '↻ Làm mới'}
                </button>
              </div>

              {tierError && <div className="alert alert-error">{tierError}</div>}

              <div className="tier-grid">
                <form className="tier-form" onSubmit={handleTierSubmit}>
                  <div className="form-group">
                    <label htmlFor="tier-name">Tên hạng *</label>
                    <input
                      id="tier-name"
                      type="text"
                      className="form-input"
                      value={tierForm.name}
                      onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                      placeholder="Ví dụ: Hạng Vàng"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tier-minimum">Ngưỡng tổng chi tiêu (VND) *</label>
                    <input
                      id="tier-minimum"
                      type="number"
                      min={0}
                      className="form-input"
                      value={tierForm.minimumSpent}
                      onChange={(e) => setTierForm({ ...tierForm, minimumSpent: Number(e.target.value) || 0 })}
                      placeholder="Ví dụ: 5000000"
                      required
                    />
                    <small className="form-hint">
                      Khách hàng đạt mức chi tiêu này sẽ được xếp vào hạng tương ứng.
                    </small>
                  </div>

                  <div className="form-group color-field">
                    <label htmlFor="tier-color">Màu hiển thị</label>
                    <div className="color-input-group">
                      <input
                        id="tier-color"
                        type="color"
                        value={tierForm.colorHex || '#ff6b35'}
                        onChange={(e) => setTierForm({ ...tierForm, colorHex: e.target.value })}
                      />
                      <input
                        type="text"
                        className="form-input"
                        value={tierForm.colorHex}
                        onChange={(e) => setTierForm({ ...tierForm, colorHex: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tier-description">Mô tả</label>
                    <textarea
                      id="tier-description"
                      className="form-input"
                      rows={3}
                      value={tierForm.description || ''}
                      onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                      placeholder="Quyền lợi, ưu đãi của hạng..."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tier-order">Thứ tự hiển thị</label>
                    <input
                      id="tier-order"
                      type="number"
                      className="form-input"
                      value={tierForm.displayOrder ?? 0}
                      onChange={(e) => setTierForm({ ...tierForm, displayOrder: Number(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="tier-form-actions">
                    <button type="button" className="btn btn-secondary" onClick={resetTierForm}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingTier ? '💾 Cập nhật hạng' : '➕ Thêm hạng'}
                    </button>
                  </div>
                </form>

                <div className="tier-list">
            <div className="tier-list-header">
              <h4>Danh sách hạng ({tiers.length})</h4>
              <span className="hint">Ưu tiên theo ngưỡng chi tiêu cao → thấp</span>
            </div>
            {tierLoading ? (
              <div className="loading-inline">Đang tải...</div>
            ) : tiers.length === 0 ? (
              <p className="empty-text">Chưa có hạng nào. Hãy thêm hạng để bắt đầu phân loại khách hàng.</p>
            ) : (
              <table className="tier-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Tên hạng</th>
                    <th style={{ width: '15%' }}>Màu</th>
                    <th style={{ width: '20%' }}>Ngưỡng chi tiêu</th>
                    <th style={{ width: '25%' }}>Mô tả</th>
                    <th style={{ width: '15%' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tiers.map((tier) => (
                    <tr key={tier.id}>
                      <td>
                        <span className="tier-name-text">
                          {tier.name}
                        </span>
                      </td>
                      <td>
                        <div className="tier-color-display">
                          <div
                            className="tier-color-box"
                            style={{ backgroundColor: tier.colorHex || '#e5e7eb' }}
                            title={tier.colorHex}
                          />
                          <span className="tier-color-code">{tier.colorHex}</span>
                        </div>
                      </td>
                      <td className="tier-amount">{formatCurrency(tier.minimumSpent)}</td>
                      <td className="tier-description">{tier.description || '—'}</td>
                      <td className="tier-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditTier(tier)}>
                          ✏️ Sửa
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTier(tier)}>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;

