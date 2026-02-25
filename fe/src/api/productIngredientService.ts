import axiosInstance from './axiosInstance';

export interface ProductIngredient {
  id: number;
  productId: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  quantityRequired: number;
  currentStock: number;
  isLowStock: boolean;
  createdAt: string;
}

export interface AddProductIngredientDto {
  ingredientId: number;
  quantityRequired: number;
}

// Lấy danh sách nguyên liệu của sản phẩm
export const getProductIngredients = async (productId: number): Promise<ProductIngredient[]> => {
  const response = await axiosInstance.get<ProductIngredient[]>(`/ProductIngredients/product/${productId}`);
  return response.data;
};

// Thêm nguyên liệu vào sản phẩm
export const addIngredientToProduct = async (productId: number, dto: AddProductIngredientDto): Promise<ProductIngredient> => {
  const response = await axiosInstance.post<ProductIngredient>(`/ProductIngredients/product/${productId}`, dto);
  return response.data;
};

// Cập nhật số lượng nguyên liệu trong sản phẩm
export const updateProductIngredient = async (id: number, quantityRequired: number): Promise<ProductIngredient> => {
  const response = await axiosInstance.put<ProductIngredient>(`/ProductIngredients/${id}`, quantityRequired, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Xóa nguyên liệu khỏi sản phẩm
export const removeIngredientFromProduct = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/ProductIngredients/${id}`);
};

// Kiểm tra nguyên liệu có đủ để làm sản phẩm không
export const checkProductAvailability = async (productId: number, quantity: number = 1): Promise<{
  available: boolean;
  message: string;
  maxQuantity: number;
  insufficientIngredients?: Array<{
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
  }>;
}> => {
  const response = await axiosInstance.get(`/ProductIngredients/product/${productId}/check-availability`, {
    params: { quantity }
  });
  return response.data;
};

