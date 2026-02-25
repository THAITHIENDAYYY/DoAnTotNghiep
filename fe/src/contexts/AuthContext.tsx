import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/authService';
import { startShift, endShift } from '../api/shiftService';

export const UserRole = {
  Admin: 1,
  Cashier: 2,
  WarehouseStaff: 3
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  employeeId?: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser({
          ...parsed,
          employeeId:
            typeof parsed.employeeId === 'number' ? parsed.employeeId : null
        });
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiLogin(username, password);
      
      // Convert response to User object
      const user: User = {
        id: parseInt(response.userId),
        email: response.email,
        fullName: response.fullName,
        role: response.role as UserRole,
        roleName: response.roleName,
        employeeId: response.employeeId ?? null
      };
      
      setUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));

      // start shift
      if (user.employeeId) {
        try { await startShift(user.employeeId); } catch {}
      }
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user?.employeeId) {
        try { await endShift(user.employeeId); } catch {}
      }
      await apiLogout();
    } finally {
      setUser(null);
      localStorage.removeItem('currentUser');
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

