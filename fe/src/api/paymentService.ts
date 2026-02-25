import axiosInstance from './axiosInstance';

// Payment interfaces
export const PaymentMethod = {
  Cash: 1,
  CreditCard: 2,
  DebitCard: 3,
  MobilePayment: 4,
  BankTransfer: 5
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  Pending: 1,
  Completed: 2,
  Failed: 3,
  Refunded: 4,
  Cancelled: 5
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface Payment {
  id: number;
  orderId: number;
  orderNumber: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  status: PaymentStatus;
  statusName: string;
  transactionId?: string;
  notes?: string;
  paymentDate: string;
  createdAt: string;
  customerName?: string;
  employeeName?: string;
}

export interface PaymentList {
  id: number;
  orderId: number;
  orderNumber: string;
  amount: number;
  method: PaymentMethod; // Backend returns 'method', not 'paymentMethod'
  methodName: string; // Backend returns 'methodName', not 'paymentMethodName'
  status: PaymentStatus;
  statusName: string;
  paymentDate: string;
  transactionId: string;
  referenceNumber?: string;
  completedAt?: string;
  orderTotal: number;
  isFullyPaid: boolean;
  customerName?: string;
}

export interface CreatePaymentDto {
  orderId: number;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentDto {
  status: PaymentStatus;
  referenceNumber?: string;
  notes?: string;
}

export interface PaymentFilter {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  orderId?: number;
  transactionId?: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  completedAmount: number;
  pendingPayments: number;
  pendingAmount: number;
  failedPayments: number;
  refundedPayments: number;
  refundedAmount: number;
  byMethod: PaymentByMethod[];
}

export interface PaymentByMethod {
  method: PaymentMethod;
  methodName: string;
  count: number;
  amount: number;
}

// API Functions

/// Get all payments with optional filter
export const getPayments = async (filter?: PaymentFilter): Promise<PaymentList[]> => {
  const params = new URLSearchParams();
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  if (filter?.paymentMethod !== undefined) params.append('paymentMethod', filter.paymentMethod.toString());
  if (filter?.status !== undefined) params.append('status', filter.status.toString());
  if (filter?.orderId) params.append('orderId', filter.orderId.toString());
  if (filter?.transactionId) params.append('transactionId', filter.transactionId);

  const queryString = params.toString();
  const url = queryString ? `/Payments?${queryString}` : '/Payments';
  const response = await axiosInstance.get<PaymentList[]>(url);
  return response.data;
};

/// Get payment by ID
export const getPaymentById = async (id: number): Promise<Payment> => {
  const response = await axiosInstance.get<Payment>(`/Payments/${id}`);
  return response.data;
};

/// Get payment statistics
export const getPaymentStats = async (startDate?: string, endDate?: string): Promise<PaymentStats> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await axiosInstance.get<PaymentStats>(`/Payments/stats?${params.toString()}`);
  return response.data;
};

/// Create new payment
export const createPayment = async (dto: CreatePaymentDto): Promise<Payment> => {
  const response = await axiosInstance.post<Payment>('/Payments', dto);
  return response.data;
};

/// Update payment
export const updatePayment = async (id: number, dto: UpdatePaymentDto): Promise<void> => {
  await axiosInstance.put(`/Payments/${id}`, dto);
};

/// Delete payment
export const deletePayment = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/Payments/${id}`);
};

/// Confirm payment (set status to Completed)
export const confirmPayment = async (id: number): Promise<Payment> => {
  const response = await axiosInstance.put<Payment>(`/Payments/${id}`, {
    status: PaymentStatus.Completed
  });
  return response.data;
};

// Helper Functions

/// Get payment method name
export const getPaymentMethodName = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.Cash:
      return 'Tiền mặt';
    case PaymentMethod.CreditCard:
      return 'Thẻ tín dụng';
    case PaymentMethod.DebitCard:
      return 'Thẻ ghi nợ';
    case PaymentMethod.MobilePayment:
      return 'Thanh toán di động';
    case PaymentMethod.BankTransfer:
      return 'Chuyển khoản';
    default:
      return 'Không xác định';
  }
};

/// Get payment status name
export const getPaymentStatusName = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.Pending:
      return 'Đang xử lý';
    case PaymentStatus.Completed:
      return 'Hoàn thành';
    case PaymentStatus.Failed:
      return 'Thất bại';
    case PaymentStatus.Refunded:
      return 'Đã hoàn tiền';
    case PaymentStatus.Cancelled:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

/// Get payment status badge class
export const getPaymentStatusBadge = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.Pending:
      return 'badge-warning';
    case PaymentStatus.Completed:
      return 'badge-success';
    case PaymentStatus.Failed:
      return 'badge-danger';
    case PaymentStatus.Refunded:
      return 'badge-info';
    case PaymentStatus.Cancelled:
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

/// Format currency (VND)
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};
