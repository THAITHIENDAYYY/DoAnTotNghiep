import axiosInstance from './axiosInstance';

// Dashboard Statistics
export interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  
  todayOrders: number;
  weekOrders: number;
  monthOrders: number;
  yearOrders: number;
  
  totalCustomers: number;
  totalProducts: number;
  totalEmployees: number;
  totalTables: number;
  
  lowStockProducts: number;
  outOfStockProducts: number;
  
  topProducts: TopProduct[];
  revenueChart: RevenueByDate[];
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface RevenueByDate {
  date: string;
  revenue: number;
  orders: number;
}

// Sales Report
export interface SalesReport {
  reportDate: string;
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  productSales: ProductSales[];
}

export interface ProductSales {
  productId: number;
  productName: string;
  categoryName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  employeeId?: number;
  reportType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

// API Functions

/// Get Dashboard Statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await axiosInstance.get<DashboardStats>('/reports/dashboard');
  return response.data;
};

/// Get Sales Report with filters (NEW - Full filter support!)
export const getSalesReport = async (filter: ReportFilter): Promise<SalesReport> => {
  const response = await axiosInstance.post<SalesReport>('/reports/sales', filter);
  return response.data;
};

/// Get Revenue Chart Data
export const getRevenueChart = async (
  startDate?: string,
  endDate?: string,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<RevenueByDate[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  params.append('groupBy', groupBy);
  
  const response = await axiosInstance.get<RevenueByDate[]>(`/reports/revenue-chart?${params.toString()}`);
  return response.data;
};

/// Get Product Performance
export const getProductPerformance = async (
  startDate?: string,
  endDate?: string,
  categoryId?: number
): Promise<ProductSales[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (categoryId) params.append('categoryId', categoryId.toString());
  
  const response = await axiosInstance.get<ProductSales[]>(`/reports/products/performance?${params.toString()}`);
  return response.data;
};

/// Export Sales Report to Excel
export const exportSalesReport = async (filter: ReportFilter): Promise<Blob> => {
  const response = await axiosInstance.post('/export/sales-report', filter, {
    responseType: 'blob'
  });
  return response.data;
};

/// Export Products List to Excel
export const exportProducts = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/export/products', {
    responseType: 'blob'
  });
  return response.data;
};

/// Export Inventory to Excel
export const exportInventory = async (): Promise<Blob> => {
  const response = await axiosInstance.get('/export/inventory', {
    responseType: 'blob'
  });
  return response.data;
};

// Helper Functions

/// Format currency (VND)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/// Format number with thousand separator
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('vi-VN').format(num);
};

/// Download blob as file
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

