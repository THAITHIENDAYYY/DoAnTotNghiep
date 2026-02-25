import axiosInstance from './axiosInstance';

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  stockQuantity: number;
  minStockLevel: number;
  sku?: string;
  createdAt: string;
  updatedAt?: string;
  categoryId: number;
  categoryName?: string;
  isLowStock: boolean;
}

export interface ProductList {
  id: number;
  name: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isActive: boolean;
  stockQuantity: number;
  sku?: string;
  categoryId: number;
  categoryName?: string;
  isLowStock: boolean;
  availableQuantityByIngredients: number; // Số lượng có thể làm dựa trên nguyên liệu
}

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  stockQuantity: number;
  minStockLevel: number;
  sku?: string;
}

export interface UpdateProductDto {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: number;
  isAvailable: boolean;
  isActive: boolean;
  stockQuantity: number;
  minStockLevel: number;
  sku?: string;
}

// Lấy danh sách tất cả sản phẩm
export const getProducts = async (): Promise<ProductList[]> => {
  const response = await axiosInstance.get<ProductList[]>('/Products');
  return response.data;
};

// Lấy danh sách sản phẩm đang hoạt động và có sẵn
export const getAvailableProducts = async (): Promise<ProductList[]> => {
  const response = await axiosInstance.get<ProductList[]>('/Products/available');
  return response.data;
};

// Lấy sản phẩm theo danh mục
export const getProductsByCategory = async (categoryId: number): Promise<ProductList[]> => {
  const response = await axiosInstance.get<ProductList[]>(`/Products/category/${categoryId}`);
  return response.data;
};

// Lấy danh sách sản phẩm sắp hết hàng
export const getLowStockProducts = async (): Promise<ProductList[]> => {
  const response = await axiosInstance.get<ProductList[]>('/Products/low-stock');
  return response.data;
};

// Tìm kiếm sản phẩm
export const searchProducts = async (name: string): Promise<ProductList[]> => {
  const response = await axiosInstance.get<ProductList[]>(`/Products/search?name=${encodeURIComponent(name)}`);
  return response.data;
};

// Lấy thông tin chi tiết sản phẩm
export const getProductById = async (id: number): Promise<Product> => {
  const response = await axiosInstance.get<Product>(`/Products/${id}`);
  return response.data;
};

// Tạo sản phẩm mới
export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  const response = await axiosInstance.post<Product>('/Products', data);
  return response.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (id: number, data: UpdateProductDto): Promise<void> => {
  await axiosInstance.put(`/Products/${id}`, data);
};

// Xóa sản phẩm
export const deleteProduct = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Products/${id}`);
};

export const exportProducts = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/Export/products', {
    responseType: 'blob'
  });
  return response.data;
};

// Bật/tắt sản phẩm
export const toggleProductStatus = async (id: number): Promise<{ message: string; isActive: boolean }> => {
  const response = await axiosInstance.patch<{ message: string; isActive: boolean }>(`/Products/${id}/toggle-status`);
  return response.data;
};

// Cập nhật số lượng tồn kho
export const updateProductStock = async (id: number, stockQuantity: number): Promise<{ message: string; stockQuantity: number; isLowStock: boolean }> => {
  const response = await axiosInstance.patch<{ message: string; stockQuantity: number; isLowStock: boolean }>(
    `/Products/${id}/update-stock`,
    stockQuantity
  );
  return response.data;
};

