import axiosInstance from './axiosInstance';

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  productCount: number;
}

export interface CategoryList {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  productCount: number;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

// Lấy danh sách tất cả danh mục
export const getCategories = async (): Promise<CategoryList[]> => {
  const response = await axiosInstance.get<CategoryList[]>('/Categories');
  return response.data;
};

// Lấy danh sách danh mục đang hoạt động
export const getActiveCategories = async (): Promise<CategoryList[]> => {
  const response = await axiosInstance.get<CategoryList[]>('/Categories/active');
  return response.data;
};

// Lấy thông tin chi tiết danh mục theo ID
export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await axiosInstance.get<Category>(`/Categories/${id}`);
  return response.data;
};

// Tạo danh mục mới
export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
  const response = await axiosInstance.post<Category>('/Categories', data);
  return response.data;
};

// Cập nhật danh mục
export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<void> => {
  await axiosInstance.put(`/Categories/${id}`, data);
};

// Xóa danh mục
export const deleteCategory = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Categories/${id}`);
};

// Bật/tắt danh mục
export const toggleCategoryStatus = async (id: number): Promise<{ message: string; isActive: boolean }> => {
  const response = await axiosInstance.patch<{ message: string; isActive: boolean }>(`/Categories/${id}/toggle-status`);
  return response.data;
};

