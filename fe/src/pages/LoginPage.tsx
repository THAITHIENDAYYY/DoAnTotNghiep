import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        // Redirect to the page they tried to access or default based on role
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Demo account function - hidden
  // const fillDemoAccount = (role: 'admin' | 'cashier' | 'warehouse') => {
  //   switch (role) {
  //     case 'admin':
  //       setUsername('admin');
  //       setPassword('admin123');
  //       break;
  //     case 'cashier':
  //       setUsername('cashier');
  //       setPassword('cashier123');
  //       break;
  //     case 'warehouse':
  //       setUsername('warehouse');
  //       setPassword('warehouse123');
  //       break;
  //   }
  //   setError('');
  // };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>🍔 FastFood Manager</h1>
            <p>Đăng nhập vào hệ thống</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Demo accounts section - hidden */}
          {/* <div className="demo-accounts">
            <p className="demo-title">📝 Tài khoản demo:</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin"
                onClick={() => fillDemoAccount('admin')}
              >
                👑 Admin
              </button>
              <button
                type="button"
                className="demo-btn cashier"
                onClick={() => fillDemoAccount('cashier')}
              >
                💰 Thu Ngân
              </button>
              <button
                type="button"
                className="demo-btn warehouse"
                onClick={() => fillDemoAccount('warehouse')}
              >
                📦 Nhân Viên Kho
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

