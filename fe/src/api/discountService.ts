import axiosInstance from './axiosInstance';

export const DiscountType = {
  Percentage: 1,
  FixedAmount: 2,
  BuyXGetY: 3
} as const;

export type DiscountType = typeof DiscountType[keyof typeof DiscountType];

export interface Discount {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  typeName: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  isValid: boolean;
  createdAt: string;
  updatedAt?: string;
  applicableProductIds: number[];
  applicableCategoryIds: number[];
  applicableCustomerTierIds: number[];
  applicableEmployeeRoleIds: number[];
  buyQuantity?: number;
  freeProductId?: number;
  freeProductName?: string;
  freeProductQuantity?: number;
  freeProductDiscountType?: number;
  freeProductDiscountTypeName?: string;
  freeProductDiscountValue?: number;
}

export interface DiscountList {
  id: number;
  code: string;
  name: string;
  type: DiscountType;
  typeName: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  isValid: boolean;
}

export interface CreateDiscountDto {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  applicableProductIds?: number[];
  applicableCategoryIds?: number[];
  applicableCustomerTierIds?: number[];
  applicableEmployeeRoleIds?: number[];
  buyQuantity?: number;
  freeProductId?: number;
  freeProductQuantity?: number;
  freeProductDiscountType?: number;
  freeProductDiscountValue?: number;
}

export interface UpdateDiscountDto {
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  isActive: boolean;
  applicableProductIds?: number[];
  applicableCategoryIds?: number[];
  applicableCustomerTierIds?: number[];
  applicableEmployeeRoleIds?: number[];
  buyQuantity?: number;
  freeProductId?: number;
  freeProductQuantity?: number;
  freeProductDiscountType?: number;
  freeProductDiscountValue?: number;
}

// Lấy danh sách tất cả mã giảm giá
export const getDiscounts = async (): Promise<DiscountList[]> => {
  const response = await axiosInstance.get<DiscountList[]>('/Discounts');
  return response.data;
};

// Lấy danh sách mã giảm giá đang hoạt động và còn hiệu lực
export const getActiveDiscounts = async (): Promise<DiscountList[]> => {
  const response = await axiosInstance.get<DiscountList[]>('/Discounts/active');
  return response.data;
};

// Lấy thông tin chi tiết mã giảm giá theo ID
export const getDiscountById = async (id: number): Promise<Discount> => {
  const response = await axiosInstance.get<Discount>(`/Discounts/${id}`);
  return response.data;
};

// Kiểm tra và validate mã giảm giá theo code
export const validateDiscountCode = async (code: string): Promise<Discount> => {
  const response = await axiosInstance.get<Discount>(`/Discounts/validate/${encodeURIComponent(code)}`);
  return response.data;
};

// Tạo mã giảm giá mới
export const createDiscount = async (data: CreateDiscountDto): Promise<Discount> => {
  const response = await axiosInstance.post<Discount>('/Discounts', data);
  return response.data;
};

// Cập nhật mã giảm giá
export const updateDiscount = async (id: number, data: UpdateDiscountDto): Promise<void> => {
  await axiosInstance.put(`/Discounts/${id}`, data);
};

// Xóa mã giảm giá
export const deleteDiscount = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Discounts/${id}`);
};

// Bật/tắt mã giảm giá
export const toggleDiscountStatus = async (id: number): Promise<{ message: string; isActive: boolean }> => {
  const response = await axiosInstance.patch<{ message: string; isActive: boolean }>(`/Discounts/${id}/toggle-status`);
  return response.data;
};

// Hàm tính toán số tiền giảm giá dựa trên discount và subtotal
export const calculateDiscountAmount = (
  discount: Discount,
  subTotal: number,
  orderProductIds?: number[],
  orderCategoryIds?: number[]
): number => {
  // Kiểm tra đơn hàng tối thiểu
  if (discount.minOrderAmount && subTotal < discount.minOrderAmount) {
    return 0;
  }

  // Kiểm tra áp dụng cho sản phẩm/danh mục cụ thể
  if (discount.applicableProductIds && discount.applicableProductIds.length > 0) {
    if (!orderProductIds || !orderProductIds.some(id => discount.applicableProductIds.includes(id))) {
      return 0; // Không có sản phẩm nào trong đơn thuộc danh sách áp dụng
    }
  }

  if (discount.applicableCategoryIds && discount.applicableCategoryIds.length > 0) {
    if (!orderCategoryIds || !orderCategoryIds.some(id => discount.applicableCategoryIds.includes(id))) {
      return 0; // Không có danh mục nào trong đơn thuộc danh sách áp dụng
    }
  }

  let discountAmount = 0;

  if (discount.type === DiscountType.Percentage) {
    // Giảm theo phần trăm
    discountAmount = (subTotal * discount.discountValue) / 100;
    // Áp dụng giới hạn tối đa nếu có
    if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
      discountAmount = discount.maxDiscountAmount;
    }
  } else if (discount.type === DiscountType.FixedAmount) {
    // Giảm số tiền cố định
    discountAmount = discount.discountValue;
    // Không được vượt quá subtotal
    if (discountAmount > subTotal) {
      discountAmount = subTotal;
    }
  } else if (discount.type === DiscountType.BuyXGetY) {
    // BuyXGetY không giảm tiền, chỉ tặng sản phẩm (được xử lý ở backend)
    discountAmount = 0;
  }

  return Math.max(0, discountAmount);
};

