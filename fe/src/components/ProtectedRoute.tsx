import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: number[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Nếu chưa đăng nhập, redirect đến login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có giới hạn role, kiểm tra role của user
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // Không có quyền truy cập, redirect về trang phù hợp với role
      return <Navigate to={getDefaultPageForRole(user.role)} replace />;
    }
  }

  return <>{children}</>;
};

// Helper function để lấy trang mặc định cho mỗi role
const getDefaultPageForRole = (role: number): string => {
  switch (role) {
    case UserRole.Admin:
      return '/';
    case UserRole.Cashier:
      return '/pos';
    case UserRole.WarehouseStaff:
      return '/ingredients';
    default:
      return '/login';
  }
};

export default ProtectedRoute;

