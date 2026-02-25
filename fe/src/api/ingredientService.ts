import axiosInstance from './axiosInstance';

export interface Ingredient {
  id: number;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  supplier?: string;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IngredientList {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  supplier?: string;
  isActive: boolean;
  isLowStock: boolean;
}

export interface CreateIngredientDto {
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  supplier?: string;
}

export interface UpdateIngredientDto {
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  supplier?: string;
  isActive: boolean;
}

// Lấy danh sách tất cả nguyên liệu
export const getIngredients = async (): Promise<IngredientList[]> => {
  const response = await axiosInstance.get<IngredientList[]>('/Ingredients');
  return response.data;
};

// Lấy danh sách nguyên liệu đang hoạt động
export const getActiveIngredients = async (): Promise<IngredientList[]> => {
  const response = await axiosInstance.get<IngredientList[]>('/Ingredients/active');
  return response.data;
};

// Lấy danh sách nguyên liệu sắp hết
export const getLowStockIngredients = async (): Promise<IngredientList[]> => {
  const response = await axiosInstance.get<IngredientList[]>('/Ingredients/low-stock');
  return response.data;
};

// Lấy thông tin chi tiết nguyên liệu theo ID
export const getIngredientById = async (id: number): Promise<Ingredient> => {
  const response = await axiosInstance.get<Ingredient>(`/Ingredients/${id}`);
  return response.data;
};

// Thêm nguyên liệu mới
export const createIngredient = async (dto: CreateIngredientDto): Promise<Ingredient> => {
  const response = await axiosInstance.post<Ingredient>('/Ingredients', dto);
  return response.data;
};

// Cập nhật thông tin nguyên liệu
export const updateIngredient = async (id: number, dto: UpdateIngredientDto): Promise<Ingredient> => {
  const response = await axiosInstance.put<Ingredient>(`/Ingredients/${id}`, dto);
  return response.data;
};

// Xóa nguyên liệu
export const deleteIngredient = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Ingredients/${id}`);
};

// Bật/tắt trạng thái nguyên liệu
export const toggleIngredientStatus = async (id: number): Promise<Ingredient> => {
  const response = await axiosInstance.patch<Ingredient>(`/Ingredients/${id}/toggle-status`);
  return response.data;
};

// Cập nhật số lượng nguyên liệu (nhập/xuất kho)
export const updateIngredientQuantity = async (id: number, quantityChange: number): Promise<Ingredient> => {
  const response = await axiosInstance.patch<Ingredient>(`/Ingredients/${id}/update-quantity`, quantityChange, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const exportIngredients = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/Export/inventory', {
    responseType: 'blob'
  });
  return response.data;
};

