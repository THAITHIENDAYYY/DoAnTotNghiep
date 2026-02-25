import axiosInstance from './axiosInstance';

// Enums
export enum TableStatus {
  Available = 1,    // Trống
  Occupied = 2,     // Có khách
  Reserved = 3,     // Đã đặt
  Cleaning = 4,     // Đang dọn
  Maintenance = 5   // Bảo trì
}

// Interfaces
export interface TableArea {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  tableCount: number;
}

export interface TableAreaList {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  tableCount: number;
}

export interface CreateTableAreaDto {
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface UpdateTableAreaDto {
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  statusName: string;
  tableAreaId: number;
  tableAreaName: string;
  location?: string;
  qrCode?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  activeOrdersCount: number;
}

export interface TableList {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  statusName: string;
  tableAreaId: number;
  tableAreaName: string;
  location?: string;
  isActive: boolean;
  activeOrdersCount: number;
}

export interface CreateTableDto {
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  tableAreaId: number;
  location?: string;
  qrCode?: string;
  isActive: boolean;
  notes?: string;
}

export interface UpdateTableDto {
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  tableAreaId: number;
  location?: string;
  qrCode?: string;
  isActive: boolean;
  notes?: string;
}

// Helper functions
export const getStatusName = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.Available:
      return 'Trống';
    case TableStatus.Occupied:
      return 'Có khách';
    case TableStatus.Reserved:
      return 'Đã đặt';
    case TableStatus.Cleaning:
      return 'Đang dọn';
    case TableStatus.Maintenance:
      return 'Bảo trì';
    default:
      return 'Không xác định';
  }
};


export const getStatusBadgeClass = (status: TableStatus): string => {
  switch (status) {
    case TableStatus.Available:
      return 'badge-success';
    case TableStatus.Occupied:
      return 'badge-danger';
    case TableStatus.Reserved:
      return 'badge-warning';
    case TableStatus.Cleaning:
      return 'badge-info';
    case TableStatus.Maintenance:
      return 'badge-secondary';
    default:
      return 'badge-secondary';
  }
};

// Danh sách trạng thái (để dùng trong dropdown)
export const TABLE_STATUSES = [
  { value: TableStatus.Available, label: 'Trống' },
  { value: TableStatus.Occupied, label: 'Có khách' },
  { value: TableStatus.Reserved, label: 'Đã đặt' },
  { value: TableStatus.Cleaning, label: 'Đang dọn' },
  { value: TableStatus.Maintenance, label: 'Bảo trì' }
];

// ====================
// TABLE AREA API CALLS
// ====================

export const getTableAreas = async (): Promise<TableAreaList[]> => {
  const response = await axiosInstance.get('/tables/areas');
  return response.data;
};

export const getActiveTableAreas = async (): Promise<TableAreaList[]> => {
  const response = await axiosInstance.get('/tables/areas/active');
  return response.data;
};

export const getTableAreaById = async (id: number): Promise<TableArea> => {
  const response = await axiosInstance.get(`/tables/areas/${id}`);
  return response.data;
};

export const createTableArea = async (data: CreateTableAreaDto): Promise<TableArea> => {
  const response = await axiosInstance.post('/tables/areas', data);
  return response.data;
};

export const updateTableArea = async (id: number, data: UpdateTableAreaDto): Promise<void> => {
  await axiosInstance.put(`/tables/areas/${id}`, data);
};

export const deleteTableArea = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/tables/areas/${id}`);
};

// ====================
// TABLE API CALLS
// ====================
export const getTables = async (): Promise<TableList[]> => {
  const response = await axiosInstance.get('/tables');
  return response.data;
};

export const getActiveTables = async (): Promise<TableList[]> => {
  const response = await axiosInstance.get('/tables/active');
  return response.data;
};

export const getAvailableTables = async (): Promise<TableList[]> => {
  const response = await axiosInstance.get('/tables/available');
  return response.data;
};

export const getTablesByArea = async (areaId: number): Promise<TableList[]> => {
  const response = await axiosInstance.get(`/tables/by-area/${areaId}`);
  return response.data;
};

export const getTableById = async (id: number): Promise<Table> => {
  const response = await axiosInstance.get(`/tables/${id}`);
  return response.data;
};

export const createTable = async (data: CreateTableDto): Promise<Table> => {
  const response = await axiosInstance.post('/tables', data);
  return response.data;
};

export const updateTable = async (id: number, data: UpdateTableDto): Promise<void> => {
  await axiosInstance.put(`/tables/${id}`, data);
};

export const deleteTable = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/tables/${id}`);
};

export const updateTableStatus = async (id: number, status: TableStatus): Promise<void> => {
  await axiosInstance.patch(`/tables/${id}/status`, status, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const toggleTableActive = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/tables/${id}/toggle-active`);
};

export const searchTables = async (query: string): Promise<TableList[]> => {
  const response = await axiosInstance.get(`/tables/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

// ====================
// TABLE GROUP INTERFACES
// ====================

export interface TableInGroup {
  id: number;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  statusName: string;
  tableAreaName: string;
}

export interface TableGroup {
  id: number;
  name: string;
  status: number;
  statusName: string;
  createdAt: string;
  updatedAt?: string;
  dissolvedAt?: string;
  totalCapacity: number;
  tables: TableInGroup[];
}

export interface TableGroupList {
  id: number;
  name: string;
  status: number;
  statusName: string;
  tableCount: number;
  totalCapacity: number;
  createdAt: string;
  tableNumbers: string[];
}

export interface CreateTableGroupDto {
  name: string;
  tableIds: number[];
}

export interface UpdateTableGroupDto {
  name: string;
}

// ====================
// TABLE GROUP API CALLS
// ====================

export const getTableGroups = async (): Promise<TableGroupList[]> => {
  const response = await axiosInstance.get('/tables/groups');
  return response.data;
};

export const getTableGroupById = async (id: number): Promise<TableGroup> => {
  const response = await axiosInstance.get(`/tables/groups/${id}`);
  return response.data;
};

export const createTableGroup = async (data: CreateTableGroupDto): Promise<TableGroup> => {
  const response = await axiosInstance.post('/tables/groups', data);
  return response.data;
};

export const updateTableGroup = async (id: number, data: UpdateTableGroupDto): Promise<TableGroup> => {
  const response = await axiosInstance.put(`/tables/groups/${id}`, data);
  return response.data;
};

export const dissolveTableGroup = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/tables/groups/${id}`);
};

