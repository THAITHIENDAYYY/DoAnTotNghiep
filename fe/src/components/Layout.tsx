import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  // Define menu items with role restrictions
  const menuItems: Array<{
    path: string;
    icon: string;
    label: string;
    allowedRoles: number[];
    className?: string;
  }> = [
    // {
    //   path: '/',
    //   icon: '📊',
    //   label: 'Dashboard',
    //   allowedRoles: [UserRole.Admin]
    // },
    {
      path: '/pos',
      icon: '🖥️',
      label: 'Quầy Thu Ngân (POS)',
      allowedRoles: [UserRole.Admin, UserRole.Cashier],
      className: 'pos-link'
    },
    {
      path: '/categories',
      icon: '📁',
      label: 'Danh Mục',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/products',
      icon: '🍔',
      label: 'Sản Phẩm',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/ingredients',
      icon: '🧂',
      label: 'Kho Nguyên Liệu',
      allowedRoles: [UserRole.Admin, UserRole.WarehouseStaff]
    },
    {
      path: '/orders',
      icon: '🛒',
      label: 'Đơn Hàng',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/customers',
      icon: '👥',
      label: 'Khách Hàng',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/tables-management',
      icon: '🪑',
      label: 'Bàn',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/employees',
      icon: '💼',
      label: 'Nhân Viên',
      allowedRoles: [UserRole.Admin]
    },
    // {
    //   path: '/payments',
    //   icon: '💳',
    //   label: 'Quản Lý Thanh Toán',
    //   allowedRoles: [UserRole.Admin]
    // },
    {
      path: '/shift-report',
      icon: '🕒',
      label: 'Báo Cáo Ca Làm Việc',
      allowedRoles: [UserRole.Cashier]
    },
    {
      path: '/shift-management',
      icon: '🕒',
      label: 'Quản Lí Ca',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/reports',
      icon: '📈',
      label: 'Báo Cáo & Thống Kê',
      allowedRoles: [UserRole.Admin]
    },
    {
      path: '/discounts',
      icon: '🎁',
      label: 'Giảm Giá',
      allowedRoles: [UserRole.Admin]
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    user && item.allowedRoles.includes(user.role)
  );

  return (
    <div className="layout">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🍔 FastFood Manager</h2>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{user.fullName}</div>
              <div className="user-role">{user.roleName}</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {filteredMenuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${item.className || ''} ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={() => {
              setSidebarOpen(false);
              handleLogout();
            }}
          >
            🚪 Đăng Xuất
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <h1>Hệ Thống Quản Lý Cửa Hàng Thức Ăn Nhanh</h1>
          {user && (
            <div className="header-user">
              <span>👋 Xin chào, <strong>{user.fullName}</strong></span>
            </div>
          )}
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

