import axiosInstance from './axiosInstance';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  role: number;
  roleName: string;
  expiresAt: string;
  employeeId: number;
}
// Dòng 20-33: Login và lưu token
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', {
    username,
    password
  });
  
    // Dòng 27-29: Lưu token vào localStorage
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('tokenExpiry', response.data.expiresAt);
  }
  
  return response.data;
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('currentUser');
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const isTokenExpired = (): boolean => {
  const expiry = localStorage.getItem('tokenExpiry');
  if (!expiry) return true;
  
  return new Date(expiry) < new Date();
};

