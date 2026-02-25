import axiosInstance from './axiosInstance';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth: string;
  age: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  totalOrders: number;
  totalSpent: number;
  tierId?: number;
  tierName?: string;
  tierColor?: string;
}

export interface CustomerList {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  city?: string;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  tierId?: number;
  tierName?: string;
  tierColor?: string;
}

export interface CustomerTier {
  id: number;
  name: string;
  minimumSpent: number;
  colorHex: string;
  description?: string;
  displayOrder: number;
}

export interface CreateCustomerTierDto {
  name: string;
  minimumSpent: number;
  colorHex?: string;
  description?: string;
  displayOrder?: number;
}

export type UpdateCustomerTierDto = CreateCustomerTierDto;

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth: string;
  userId?: string;
}

export interface UpdateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOfBirth: string;
  isActive: boolean;
  userId?: string;
}

// Lấy danh sách tất cả khách hàng
export const getCustomers = async (): Promise<CustomerList[]> => {
  const response = await axiosInstance.get<CustomerList[]>('/Customers');
  return response.data;
};

// Lấy danh sách khách hàng đang hoạt động
export const getActiveCustomers = async (): Promise<CustomerList[]> => {
  const response = await axiosInstance.get<CustomerList[]>('/Customers/active');
  return response.data;
};

// Lấy danh sách khách hàng VIP
export const getVipCustomers = async (minSpent = 1000000): Promise<CustomerList[]> => {
  const response = await axiosInstance.get<CustomerList[]>(`/Customers/vip?minSpent=${minSpent}`);
  return response.data;
};

// Tìm kiếm khách hàng
export const searchCustomers = async (query: string): Promise<CustomerList[]> => {
  const response = await axiosInstance.get<CustomerList[]>(`/Customers/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

// Lấy thông tin chi tiết khách hàng
export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await axiosInstance.get<Customer>(`/Customers/${id}`);
  return response.data;
};

// Lấy thông tin khách hàng theo UserId
export const getCustomerByUserId = async (userId: string): Promise<Customer> => {
  const response = await axiosInstance.get<Customer>(`/Customers/by-user/${userId}`);
  return response.data;
};

// Tạo khách hàng mới
export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  const response = await axiosInstance.post<Customer>('/Customers', data);
  return response.data;
};

// Cập nhật thông tin khách hàng
export const updateCustomer = async (id: number, data: UpdateCustomerDto): Promise<void> => {
  await axiosInstance.put(`/Customers/${id}`, data);
};

// Xóa khách hàng
export const deleteCustomer = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Customers/${id}`);
};

// Bật/tắt khách hàng
export const toggleCustomerStatus = async (id: number): Promise<{ message: string; isActive: boolean }> => {
  const response = await axiosInstance.patch<{ message: string; isActive: boolean }>(`/Customers/${id}/toggle-status`);
  return response.data;
};

export const exportCustomers = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/Export/customers', {
    responseType: 'blob'
  });
  return response.data;
};

// Customer tiers
export const getCustomerTiers = async (): Promise<CustomerTier[]> => {
  const response = await axiosInstance.get<CustomerTier[]>('/CustomerTiers');
  return response.data;
};

export const createCustomerTier = async (data: CreateCustomerTierDto): Promise<CustomerTier> => {
  const response = await axiosInstance.post<CustomerTier>('/CustomerTiers', data);
  return response.data;
};

export const updateCustomerTier = async (id: number, data: UpdateCustomerTierDto): Promise<CustomerTier> => {
  const response = await axiosInstance.put<CustomerTier>(`/CustomerTiers/${id}`, data);
  return response.data;
};

export const deleteCustomerTier = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/CustomerTiers/${id}`);
};

