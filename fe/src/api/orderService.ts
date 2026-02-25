import axiosInstance from './axiosInstance';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  statusName: string;
  type: string;
  typeName: string;
  subTotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount?: number;
  discountId?: number;
  totalAmount: number;
  notes?: string;
  orderDate: string;
  confirmedAt?: string;
  preparedAt?: string;
  deliveredAt?: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  employeeId?: number;
  employeeName?: string;
  orderItems: OrderItem[];
  isPaid: boolean;
  paidAmount: number;
}

export interface OrderList {
  id: number;
  orderNumber: string;
  status: number;
  statusName: string;
  type: number;
  typeName: string;
  totalAmount: number;
  orderDate: string;
  customerId: number;
  customerName: string;
  employeeId?: number;
  employeeName?: string;
  isPaid: boolean;
  itemCount: number;
  tableId?: number; // ID của bàn (nếu là đơn tại bàn)
  notes?: string;
  hasDiscount: boolean; // Có sử dụng mã giảm giá không
  discountAmount?: number; // Số tiền giảm giá
}

export interface OrderFilter {
  startDate?: string;
  endDate?: string;
  status?: number;
  type?: number;
  employeeId?: number;
  customerId?: number;
  tableId?: number;
  tableGroupId?: number; // ID của nhóm bàn đã ghép
}

export interface CreateOrderDto {
  customerId: number;
  employeeId?: number;
  type: number;
  notes?: string;
  orderItems: CreateOrderItemDto[];
  includeVAT?: boolean; // Có áp dụng thuế VAT không (mặc định true)
  tableId?: number; // ID của bàn (nếu là đơn tại bàn)
  tableGroupId?: number; // ID của nhóm bàn đã ghép (nếu có)
  discountId?: number; // ID của mã giảm giá (nếu có)
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  specialInstructions?: string;
}

export interface UpdateOrderDto {
  status: number;
  notes?: string;
  employeeId?: number;
  tableId?: number; // ID của bàn mới (để chuyển bàn)
  discountId?: number; // ID của mã giảm giá (để áp dụng hoặc thay đổi discount)
  orderItems?: CreateOrderItemDto[]; // Danh sách món ăn mới (để cộng dồn món)
}

export interface OrderUpdateResponse {
  message: string;
  status: number;
  statusName: string;
}

export interface OrderCancelResponse {
  message: string;
  status: number;
  statusName: string;
}

// Lấy danh sách tất cả đơn hàng
export const getOrders = async (filter?: OrderFilter): Promise<OrderList[]> => {
  const params = new URLSearchParams();
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  if (filter?.status !== undefined) params.append('status', filter.status.toString());
  if (filter?.type !== undefined) params.append('type', filter.type.toString());
  if (filter?.employeeId !== undefined) params.append('employeeId', filter.employeeId.toString());
  if (filter?.customerId !== undefined) params.append('customerId', filter.customerId.toString());
  if (filter?.tableId !== undefined) params.append('tableId', filter.tableId.toString());

  const query = params.toString();
  const url = query ? `/Orders?${query}` : '/Orders';
  const response = await axiosInstance.get<OrderList[]>(url);
  return response.data;
};

// Lấy đơn hàng theo trạng thái
export const getOrdersByStatus = async (status: number): Promise<OrderList[]> => {
  const response = await axiosInstance.get<OrderList[]>(`/Orders/by-status/${status}`);
  return response.data;
};

// Lấy đơn hàng theo khách hàng
export const getOrdersByCustomer = async (customerId: number): Promise<OrderList[]> => {
  const response = await axiosInstance.get<OrderList[]>(`/Orders/by-customer/${customerId}`);
  return response.data;
};

// Lấy đơn hàng theo nhân viên
export const getOrdersByEmployee = async (employeeId: number): Promise<OrderList[]> => {
  const response = await axiosInstance.get<OrderList[]>(`/Orders/by-employee/${employeeId}`);
  return response.data;
};

// Tìm kiếm đơn hàng
export const searchOrders = async (orderNumber: string): Promise<OrderList[]> => {
  const response = await axiosInstance.get<OrderList[]>(`/Orders/search?orderNumber=${encodeURIComponent(orderNumber)}`);
  return response.data;
};

// Lấy thông tin chi tiết đơn hàng
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await axiosInstance.get<Order>(`/Orders/${id}`);
  return response.data;
};

// Tạo đơn hàng mới
export const createOrder = async (data: CreateOrderDto): Promise<Order> => {
  const response = await axiosInstance.post<Order>('/Orders', data);
  return response.data;
};

// Cập nhật đơn hàng
export const updateOrder = async (id: number, data: UpdateOrderDto): Promise<OrderUpdateResponse> => {
  const response = await axiosInstance.put<OrderUpdateResponse>(`/Orders/${id}`, data);
  return response.data;
};

// Hủy đơn hàng
export const cancelOrder = async (id: number): Promise<OrderCancelResponse> => {
  const response = await axiosInstance.patch<OrderCancelResponse>(`/Orders/${id}/cancel`);
  return response.data;
};

export const exportOrders = async (filter?: OrderFilter): Promise<Blob> => {
  const params = new URLSearchParams();
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  if (filter?.status !== undefined) params.append('status', filter.status.toString());
  if (filter?.type !== undefined) params.append('type', filter.type.toString());
  if (filter?.employeeId !== undefined) params.append('employeeId', filter.employeeId.toString());
  if (filter?.customerId !== undefined) params.append('customerId', filter.customerId.toString());
  if (filter?.tableId !== undefined) params.append('tableId', filter.tableId.toString());
  if (filter?.tableGroupId !== undefined) params.append('tableGroupId', filter.tableGroupId.toString());

  const query = params.toString();
  const url = query ? `/Export/orders?${query}` : '/Export/orders';
  const response = await axiosInstance.get(url, { responseType: 'blob' });
  return response.data;
};

