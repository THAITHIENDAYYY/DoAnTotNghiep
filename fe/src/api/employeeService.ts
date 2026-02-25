import axiosInstance from './axiosInstance';

export const EmployeeRole = {
  Admin: 1,
  Cashier: 2,
  WarehouseStaff: 3
} as const;
export type EmployeeRole = typeof EmployeeRole[keyof typeof EmployeeRole];

export const EmployeeStatus = {
  Active: 1,
  Inactive: 2,
  OnLeave: 3,
  Terminated: 4
} as const;
export type EmployeeStatus = typeof EmployeeStatus[keyof typeof EmployeeStatus];

export const SalaryType = {
  Monthly: 1,
  Hourly: 2
} as const;
export type SalaryType = typeof SalaryType[keyof typeof SalaryType];

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth: string;
  hireDate?: string;
  terminationDate?: string;
  salary?: number;
  salaryType: SalaryType;
  salaryTypeName: string;
  role: EmployeeRole;
  roleName: string;
  status: EmployeeStatus;
  statusName: string;
  totalOrdersHandled: number;
  yearsOfService: number;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  username?: string;
}

export interface EmployeeList {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  hireDate?: string;
  yearsOfService: number;
  salary?: number;
  salaryType: SalaryType;
  salaryTypeName: string;
  role: EmployeeRole;
  roleName: string;
  status: EmployeeStatus;
  statusName: string;
  totalOrdersHandled: number;
  userId?: string;
  username?: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth: string;
  hireDate?: string;
  salary?: number;
  salaryType: SalaryType;
  role: EmployeeRole;
  userId?: string;
}

export interface UpdateEmployeeDto {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  dateOfBirth: string;
  hireDate?: string;
  terminationDate?: string;
  salary?: number;
  salaryType: SalaryType;
  role: EmployeeRole;
  status: EmployeeStatus;
  userId?: string;
}

export interface ChangePasswordDto {
  newPassword: string;
  confirmPassword: string;
}

export interface CreateEmployeeAccountDto {
  username: string;
  password: string;
}

// Lấy danh sách tất cả nhân viên
export const getEmployees = async (): Promise<EmployeeList[]> => {
  const response = await axiosInstance.get<EmployeeList[]>('/Employees');
  return response.data;
};

// Lấy danh sách nhân viên đang hoạt động
export const getActiveEmployees = async (): Promise<EmployeeList[]> => {
  const response = await axiosInstance.get<EmployeeList[]>('/Employees/active');
  return response.data;
};

// Lấy nhân viên theo vai trò
export const getEmployeesByRole = async (role: EmployeeRole): Promise<EmployeeList[]> => {
  const response = await axiosInstance.get<EmployeeList[]>(`/Employees/by-role/${role}`);
  return response.data;
};

// Lấy thông tin chi tiết nhân viên
export const getEmployeeById = async (id: number): Promise<Employee> => {
  const response = await axiosInstance.get<Employee>(`/Employees/${id}`);
  return response.data;
};

// Thêm nhân viên mới
export const createEmployee = async (dto: CreateEmployeeDto): Promise<Employee> => {
  const response = await axiosInstance.post<Employee>('/Employees', dto);
  return response.data;
};

// Cập nhật thông tin nhân viên
export const updateEmployee = async (id: number, dto: UpdateEmployeeDto): Promise<Employee> => {
  const response = await axiosInstance.put<Employee>(`/Employees/${id}`, dto);
  return response.data;
};

// Xóa nhân viên
export const deleteEmployee = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Employees/${id}`);
};

// Bật/tắt trạng thái nhân viên
export const toggleEmployeeStatus = async (id: number): Promise<Employee> => {
  const response = await axiosInstance.patch<Employee>(`/Employees/${id}/toggle-status`);
  return response.data;
};

// Tạo tài khoản đăng nhập cho nhân viên (Admin only)
export const createEmployeeAccount = async (id: number, dto: CreateEmployeeAccountDto): Promise<void> => {
  await axiosInstance.post(`/Employees/${id}/create-account`, dto);
};

// Đổi mật khẩu cho nhân viên (Admin only)
export const changeEmployeePassword = async (id: number, dto: ChangePasswordDto): Promise<void> => {
  await axiosInstance.post(`/Employees/${id}/change-password`, dto);
};

// Helper functions
export const getRoleName = (role: EmployeeRole): string => {
  switch (role) {
    case EmployeeRole.Admin: return 'Quản lý (Admin)';
    case EmployeeRole.Cashier: return 'Thu ngân (Cashier)';
    case EmployeeRole.WarehouseStaff: return 'Nhân viên kho (Warehouse)';
    default: return 'Không xác định';
  }
};

export const getStatusName = (status: EmployeeStatus): string => {
  switch (status) {
    case EmployeeStatus.Active: return 'Đang làm việc';
    case EmployeeStatus.Inactive: return 'Không hoạt động';
    case EmployeeStatus.OnLeave: return 'Nghỉ phép';
    case EmployeeStatus.Terminated: return 'Đã nghỉ việc';
    default: return 'Không xác định';
  }
};

export const getSalaryTypeName = (salaryType: SalaryType): string => {
  switch (salaryType) {
    case SalaryType.Monthly: return 'Tháng';
    case SalaryType.Hourly: return 'Giờ';
    default: return 'Không xác định';
  }
};

