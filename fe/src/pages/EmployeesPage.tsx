import { useState, useEffect } from 'react';
import { 
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  createEmployeeAccount,
  EmployeeRole,
  EmployeeStatus,
  getRoleName
} from '../api/employeeService';
import type { 
  EmployeeList, 
  Employee, 
  CreateEmployeeDto, 
  UpdateEmployeeDto,
  CreateEmployeeAccountDto
} from '../api/employeeService';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import './EmployeesPage.css';

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
      if (response.data.message) {
        return response.data.message;
      }
      if (response.data.errors) {
        const errorMessages = Object.entries(response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return errorMessages || defaultMessage;
      }
      if (response.data.title) {
        return response.data.title;
      }
    }
    if (response?.status === 409) {
      return 'Email đã tồn tại. Vui lòng sử dụng email khác.';
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message;
  }
  return defaultMessage;
};

const EmployeesPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.Admin;
  
  const [employees, setEmployees] = useState<EmployeeList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<EmployeeRole | ''>('');
  
  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedEmployeeForPassword, setSelectedEmployeeForPassword] = useState<{ id: number; name: string; username?: string | null } | null>(null);
  
  // Create Account Modal
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [selectedEmployeeForAccount, setSelectedEmployeeForAccount] = useState<{ id: number; name: string } | null>(null);
  const [accountFormData, setAccountFormData] = useState<CreateEmployeeAccountDto>({
    username: '',
    password: ''
  });
  
  const [formData, setFormData] = useState<CreateEmployeeDto>({
    firstName: '',
    lastName: '',
    email: undefined,
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    hireDate: undefined,
    salary: undefined,
    salaryType: 1, // Monthly by default
    role: EmployeeRole.Cashier,
    userId: ''
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployees();
      // Sắp xếp nhân viên mới nhất lên đầu
      const sortedData = data.sort((a, b) => b.id - a.id);
      setEmployees(sortedData);
    } catch (err) {
      setError('Không thể tải nhân viên. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Mở modal tạo tài khoản
  const handleCreateAccount = (employee: EmployeeList) => {
    if (!isAdmin) {
      alert('Chỉ Admin mới có quyền tạo tài khoản!');
      return;
    }
    
    setSelectedEmployeeForAccount({ 
      id: employee.id, 
      name: employee.fullName 
    });
    setAccountFormData({
      username: employee.email?.split('@')[0] || '', // Suggest username from email
      password: ''
    });
    setShowCreateAccountModal(true);
  };

  // Handler: Submit tạo tài khoản
  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountFormData.username || !accountFormData.password) {
      alert('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    if (accountFormData.password.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (!selectedEmployeeForAccount) return;
    
    try {
      await createEmployeeAccount(selectedEmployeeForAccount.id, accountFormData);
      alert('Tạo tài khoản thành công!');
      setShowCreateAccountModal(false);
      loadEmployees(); // Reload để cập nhật trạng thái
    } catch (err: any) {
      console.error('Error creating account:', err);
      alert(err.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng thử lại.');
    }
  };

  // Handler: Mở modal đổi mật khẩu
  const handleChangePassword = (employee: EmployeeList) => {
    if (!isAdmin) {
      alert('Chỉ Admin mới có quyền đổi mật khẩu!');
      return;
    }
    
    if (!employee.userId) {
      alert('Nhân viên chưa có tài khoản đăng nhập!');
      return;
    }
    
    setSelectedEmployeeForPassword({ 
      id: employee.id, 
      name: employee.fullName,
      username: employee.username ?? null
    });
    setShowPasswordModal(true);
  };

  // Handler: Đóng modal đổi mật khẩu
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedEmployeeForPassword(null);
  };

  // Handler: Đóng modal tạo tài khoản
  const handleCloseCreateAccountModal = () => {
    setShowCreateAccountModal(false);
    setSelectedEmployeeForAccount(null);
    setAccountFormData({ username: '', password: '' });
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: undefined,
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      hireDate: undefined,
      salary: undefined,
      salaryType: 1, // Monthly by default
      role: EmployeeRole.Cashier,
      userId: ''
    });
    setShowModal(true);
  };

  const handleEdit = async (employee: EmployeeList) => {
    try {
      const fullEmployee = await getEmployeeById(employee.id);
      setEditingEmployee(fullEmployee);
      setFormData({
        firstName: fullEmployee.firstName,
        lastName: fullEmployee.lastName,
        email: fullEmployee.email || undefined,
        phoneNumber: fullEmployee.phoneNumber || '',
        address: fullEmployee.address || '',
        dateOfBirth: fullEmployee.dateOfBirth.split('T')[0],
        hireDate: fullEmployee.hireDate ? fullEmployee.hireDate.split('T')[0] : undefined,
        salary: fullEmployee.salary,
        salaryType: fullEmployee.salaryType,
        role: fullEmployee.role,
        userId: fullEmployee.userId || ''
      });
      setShowModal(true);
    } catch (err) {
      window.alert('Không thể tải thông tin nhân viên');
      console.error('Error loading employee:', err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa nhân viên "${name}"?`);
    
    if (!confirmed) return;

    try {
      await deleteEmployee(id);
      window.alert('Xóa nhân viên thành công!');
      loadEmployees();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể xóa nhân viên. Nhân viên có thể đang có đơn hàng liên kết.'
      );
      window.alert(errorMessage);
      console.error('Error deleting employee:', err);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: EmployeeStatus, name: string) => {
    const isActive = currentStatus === EmployeeStatus.Active;
    const action = isActive ? 'vô hiệu hóa' : 'kích hoạt';
    const confirmed = window.confirm(`Bạn có chắc muốn ${action} nhân viên "${name}"?`);
    
    if (!confirmed) return;

    try {
      await toggleEmployeeStatus(id);
      window.alert(`${isActive ? 'Vô hiệu hóa' : 'Kích hoạt'} nhân viên thành công!`);
      loadEmployees();
    } catch (err) {
      const errorMessage = getErrorMessage(err, `Không thể ${action} nhân viên`);
      window.alert(errorMessage);
      console.error('Error toggling employee status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      window.alert('Vui lòng nhập họ tên nhân viên');
      return;
    }

    if (!formData.dateOfBirth) {
      window.alert('Vui lòng nhập ngày sinh');
      return;
    }

    const dateOfBirthIso = new Date(formData.dateOfBirth).toISOString();
    const hireDateIso = formData.hireDate ? new Date(formData.hireDate).toISOString() : undefined;
    const trimmedEmail = formData.email?.trim() || undefined;

    try {
      if (editingEmployee) {
        // Update
        const updateData: UpdateEmployeeDto = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: trimmedEmail,
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          dateOfBirth: dateOfBirthIso,
          hireDate: hireDateIso,
          terminationDate: editingEmployee.terminationDate,
          salary: formData.salary,
          salaryType: formData.salaryType,
          role: formData.role,
          status: editingEmployee.status,
          userId: formData.userId?.trim() || undefined
        };
        
        await updateEmployee(editingEmployee.id, updateData);
        window.alert('Cập nhật nhân viên thành công!');
      } else {
        // Create
        const createData: CreateEmployeeDto = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: trimmedEmail,
          phoneNumber: formData.phoneNumber?.trim() || undefined,
          address: formData.address?.trim() || undefined,
          dateOfBirth: dateOfBirthIso,
          hireDate: hireDateIso,
          salary: formData.salary,
          salaryType: formData.salaryType,
          role: formData.role,
          userId: formData.userId?.trim() || undefined
        };
        
        await createEmployee(createData);
        window.alert('Thêm nhân viên thành công!');
      }
      
      handleCloseModal();
      loadEmployees();
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        'Không thể thêm/sửa nhân viên. Email có thể đã tồn tại.'
      );
      window.alert(errorMessage);
      console.error('Error saving employee:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: undefined,
      phoneNumber: '',
      address: '',
      dateOfBirth: '',
      hireDate: undefined,
      salary: undefined,
      salaryType: 1, // Monthly by default
      role: EmployeeRole.Cashier,
      userId: ''
    });
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

  const getStatusBadgeClass = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.Active:
        return 'badge-success';
      case EmployeeStatus.Inactive:
        return 'badge-secondary';
      case EmployeeStatus.OnLeave:
        return 'badge-warning';
      case EmployeeStatus.Terminated:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getRoleBadgeClass = (role: EmployeeRole) => {
    switch (role) {
      case EmployeeRole.Admin:
        return 'badge-primary';
      case EmployeeRole.Cashier:
        return 'badge-info';
      case EmployeeRole.WarehouseStaff:
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  // Filter employees based on search term and role
  const filteredEmployees = employees.filter(employee => {
    // Filter by role
    if (roleFilter !== '' && employee.role !== roleFilter) {
      return false;
    }
    
    // Filter by search term
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      employee.fullName.toLowerCase().includes(search) ||
      (employee.email?.toLowerCase().includes(search) || false) ||
      (employee.phoneNumber?.toLowerCase().includes(search) || false) ||
      employee.roleName.toLowerCase().includes(search)
    );
  });

  return (
    <div className="employees-page">
      <div className="page-header">
        <h2>💼 Quản Lý Nhân Viên</h2>
        <div className="header-actions">
          <button className="btn btn-success" onClick={loadEmployees}>🔄 Làm mới</button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Nhân Viên</button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, SĐT, vai trò..."
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
        <div className="filter-group">
          <select
            className="role-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value ? Number(e.target.value) as EmployeeRole : '')}
          >
            <option value="">Tất cả vai trò</option>
            <option value={EmployeeRole.Admin}>{getRoleName(EmployeeRole.Admin)}</option>
            <option value={EmployeeRole.Cashier}>{getRoleName(EmployeeRole.Cashier)}</option>
            <option value={EmployeeRole.WarehouseStaff}>{getRoleName(EmployeeRole.WarehouseStaff)}</option>
          </select>
        </div>
        <div className="search-stats">
          Hiển thị <strong>{filteredEmployees.length}</strong> / {employees.length} nhân viên
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
                <th>SĐT</th>
                <th>Vai Trò</th>
                <th>Tài Khoản</th>
                <th>Ngày Vào Làm</th>
                <th>Lương</th>
                <th>Trạng Thái</th>
                <th>Đơn Hàng</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-state">
                    {searchTerm ? 'Không tìm thấy nhân viên nào' : 'Chưa có nhân viên nào'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{index + 1}</td>
                    <td className="font-weight-bold">{employee.fullName}</td>
                    <td>{employee.email || 'N/A'}</td>
                    <td>{employee.phoneNumber || '—'}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeClass(employee.role)}`}>
                        {employee.roleName}
                      </span>
                    </td>
                    <td>
                      {employee.userId ? (
                        <div className="account-status-cell">
                          <span className="badge badge-success">✓ Đã tạo</span>
                          {isAdmin && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleChangePassword(employee)}
                              title="Đổi mật khẩu"
                            >
                              🔒 Đổi MK
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="account-status-cell">
                          <span className="badge badge-secondary">✗ Chưa có</span>
                          {isAdmin && (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleCreateAccount(employee)}
                              title="Tạo tài khoản đăng nhập"
                            >
                              ➕ Tạo TK
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{employee.hireDate ? formatDate(employee.hireDate) : 'N/A'}</td>
                    <td className="text-price">{employee.salary != null ? formatPrice(employee.salary) : 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(employee.status)}`}>
                        {employee.statusName}
                      </span>
                    </td>
                    <td className="text-center">{employee.totalOrdersHandled}</td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(employee)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className={`btn btn-sm ${employee.status === EmployeeStatus.Active ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(employee.id, employee.status, employee.fullName)}
                        title={employee.status === EmployeeStatus.Active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      >
                        {employee.status === EmployeeStatus.Active ? '⏸️ Vô hiệu hóa' : '▶️ Kích hoạt'}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(employee.id, employee.fullName)}
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
              <h3>{editingEmployee ? '📝 Sửa Nhân Viên' : '➕ Thêm Nhân Viên'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee-firstname" className="form-label">Tên *</label>
                  <input
                    id="employee-firstname"
                    type="text"
                    className="form-control"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    aria-label="Tên nhân viên"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee-lastname" className="form-label">Họ *</label>
                  <input
                    id="employee-lastname"
                    type="text"
                    className="form-control"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    aria-label="Họ nhân viên"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee-email" className="form-label">Email</label>
                  <input
                    id="employee-email"
                    type="email"
                    className="form-control"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value || undefined })}
                    aria-label="Email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee-phone" className="form-label">Số Điện Thoại</label>
                  <input
                    id="employee-phone"
                    type="tel"
                    className="form-control"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    aria-label="Số điện thoại"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="employee-address" className="form-label">Địa Chỉ</label>
                <input
                  id="employee-address"
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  aria-label="Địa chỉ"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee-dob" className="form-label">Ngày Sinh *</label>
                  <input
                    id="employee-dob"
                    type="date"
                    className="form-control"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                    aria-label="Ngày sinh"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee-hiredate" className="form-label">Ngày Vào Làm</label>
                  <input
                    id="employee-hiredate"
                    type="date"
                    className="form-control"
                    value={formData.hireDate || ''}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value || undefined })}
                    aria-label="Ngày vào làm"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="employee-salary" className="form-label">Lương</label>
                  <input
                    id="employee-salary"
                    type="number"
                    step="100000"
                    className="form-control"
                    value={formData.salary ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, salary: value === '' ? undefined : parseFloat(value) });
                    }}
                    aria-label="Lương"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="employee-role" className="form-label">Vai Trò *</label>
                  <select
                    id="employee-role"
                    className="form-control"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: Number(e.target.value) as EmployeeRole })}
                    required
                    aria-label="Vai trò"
                  >
                    <option value={EmployeeRole.Admin}>{getRoleName(EmployeeRole.Admin)}</option>
                    <option value={EmployeeRole.Cashier}>{getRoleName(EmployeeRole.Cashier)}</option>
                    <option value={EmployeeRole.WarehouseStaff}>{getRoleName(EmployeeRole.WarehouseStaff)}</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmployee ? '💾 Cập Nhật' : '➕ Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedEmployeeForPassword && (
        <ChangePasswordModal
          employeeId={selectedEmployeeForPassword.id}
          employeeName={selectedEmployeeForPassword.name}
          employeeUsername={selectedEmployeeForPassword.username ?? undefined}
          onClose={handleClosePasswordModal}
          onSuccess={loadEmployees}
        />
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && selectedEmployeeForAccount && (
        <div className="modal-overlay" onClick={handleCloseCreateAccountModal}>
          <div className="modal-content create-account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Tạo Tài Khoản Đăng Nhập</h3>
              <button className="close-btn" onClick={handleCloseCreateAccountModal}>✕</button>
            </div>

            <form onSubmit={handleCreateAccountSubmit}>
              <div className="modal-body">
                <div className="employee-info-box">
                  <strong>Nhân viên:</strong> {selectedEmployeeForAccount.name}
                </div>

                <div className="form-group">
                  <label htmlFor="username">
                    Tên đăng nhập <span className="required">*</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    value={accountFormData.username}
                    onChange={(e) => setAccountFormData({ ...accountFormData, username: e.target.value })}
                    placeholder="Ví dụ: employee01"
                    required
                    minLength={4}
                  />
                  <small className="form-hint">
                    Tên đăng nhập phải có ít nhất 4 ký tự
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="password">
                    Mật khẩu <span className="required">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    value={accountFormData.password}
                    onChange={(e) => setAccountFormData({ ...accountFormData, password: e.target.value })}
                    placeholder="Nhập mật khẩu"
                    required
                    minLength={6}
                  />
                  <small className="form-hint">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </small>
                </div>

                <div className="info-box">
                  <strong>💡 Lưu ý:</strong> Nhân viên sẽ sử dụng tên đăng nhập và mật khẩu này để đăng nhập vào hệ thống.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseCreateAccountModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Tạo Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;

