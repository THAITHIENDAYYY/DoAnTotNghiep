import axiosInstance from './axiosInstance';

export interface ShiftFilter {
  startDate?: string;
  endDate?: string;
  employeeId?: number;
}

export interface ShiftSummary {
  employeeId: number;
  employeeName: string;
  shiftDate: string;
  shiftStart?: string;
  shiftEnd?: string;
  ordersCount: number;
  errorOrdersCount: number;
  totalRevenue: number;
  totalDiscount: number;
  completedPayments: number;
  completedAmount: number;
}

export interface ShiftDetailItem {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}

export interface VoucherOrder {
  orderId: number;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  discountAmount: number;
  discountName?: string;
  discountCode?: string;
}

export interface ShiftDetail {
  employeeId: number;
  employeeName: string;
  shiftDate: string;
  shiftStart?: string;
  shiftEnd?: string;
  ordersCount: number;
  totalRevenue: number;
  totalDiscount: number;
  topItems: ShiftDetailItem[];
  voucherOrders: VoucherOrder[];
}

export const getShiftSummaries = async (filter?: ShiftFilter): Promise<ShiftSummary[]> => {
  const params = new URLSearchParams();
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);
  if (filter?.employeeId !== undefined) params.append('employeeId', String(filter.employeeId));
  const qs = params.toString();
  const url = qs ? `/Shifts/summary?${qs}` : '/Shifts/summary';
  const response = await axiosInstance.get<ShiftSummary[]>(url);
  return response.data;
};

export const getShiftDetail = async (employeeId: number, date: string): Promise<ShiftDetail> => {
  const url = `/Shifts/detail?employeeId=${employeeId}&date=${encodeURIComponent(date)}`;
  const response = await axiosInstance.get<ShiftDetail>(url);
  return response.data;
};

export const startShift = async (employeeId: number): Promise<void> => {
  await axiosInstance.post(`/Shifts/start?employeeId=${employeeId}`);
};

export const endShift = async (employeeId: number): Promise<void> => {
  await axiosInstance.post(`/Shifts/end?employeeId=${employeeId}`);
};

export interface PaymentBreakdown {
  paymentMethod: number;
  paymentMethodName: string;
  transactionCount: number;
  totalAmount: number;
}

export interface CurrentShift {
  employeeId: number;
  employeeName: string;
  shiftStart?: string;
  ordersCount: number;
  totalRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  paymentBreakdown: PaymentBreakdown[];
  topItems: ShiftDetailItem[];
}

export const getCurrentShift = async (employeeId: number): Promise<CurrentShift> => {
  const response = await axiosInstance.get<CurrentShift>(`/Shifts/current?employeeId=${employeeId}`);
  return response.data;
};