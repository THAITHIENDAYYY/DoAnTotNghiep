import { useState } from 'react';
import { changeEmployeePassword, type ChangePasswordDto } from '../api/employeeService';
import './ChangePasswordModal.css';

interface ChangePasswordModalProps {
  employeeId: number;
  employeeName: string;
  employeeUsername?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal = ({ employeeId, employeeName, employeeUsername, onClose, onSuccess }: ChangePasswordModalProps) => {
  const [formData, setFormData] = useState<ChangePasswordDto>({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      await changeEmployeePassword(employeeId, formData);
      alert('Đổi mật khẩu thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content change-password-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔒 Đổi Mật Khẩu</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="employee-info-box">
              <strong>Nhân viên:</strong> {employeeName}
            </div>
            {employeeUsername && (
              <div className="employee-info-box">
                <strong>Tên đăng nhập:</strong> {employeeUsername}
              </div>
            )}

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword">
                Mật khẩu mới <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Nhập mật khẩu mới"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <small className="form-hint">
                Mật khẩu phải có ít nhất 6 ký tự
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Xác nhận mật khẩu <span className="required">*</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Nhập lại mật khẩu mới"
                required
                minLength={6}
              />
            </div>

            <div className="warning-box">
              <strong>⚠️ Lưu ý:</strong> Sau khi đổi mật khẩu, nhân viên sẽ phải đăng nhập lại bằng mật khẩu mới.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

