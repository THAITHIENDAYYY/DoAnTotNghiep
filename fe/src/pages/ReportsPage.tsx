import { useState, useEffect } from 'react';
import {
  getSalesReport,
  getRevenueChart,
  getProductPerformance,
  exportSalesReport,
  exportProducts,
  exportInventory,
  formatCurrency,
  formatNumber,
  downloadBlob
} from '../api/reportsService';
import type { SalesReport, RevenueByDate, ProductSales, ReportFilter } from '../api/reportsService';
import { getCategories } from '../api/categoryService';
import { getEmployees } from '../api/employeeService';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ReportsPage.css';

interface Category {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  
  // Filter states
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [chartGroupBy, setChartGroupBy] = useState<'day' | 'week' | 'month'>('day');
  
  // Data states
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueByDate[]>([]);
  const [productPerformance, setProductPerformance] = useState<ProductSales[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    loadCategories();
    loadEmployees();
    loadReports();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const filter: ReportFilter = {
        startDate,
        endDate,
        categoryId: selectedCategory,
        employeeId: selectedEmployee
      };

      const [salesData, chartData, performanceData] = await Promise.all([
        getSalesReport(filter),
        getRevenueChart(startDate, endDate, chartGroupBy),
        getProductPerformance(startDate, endDate, selectedCategory)
      ]);

      setSalesReport(salesData);
      setRevenueChart(chartData);
      setProductPerformance(performanceData);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('Lỗi khi tải báo cáo!');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSales = async () => {
    setExporting('sales');
    try {
      const filter: ReportFilter = {
        startDate,
        endDate,
        categoryId: selectedCategory,
        employeeId: selectedEmployee
      };
      
      const blob = await exportSalesReport(filter);
      const filename = `BaoCaoBanHang_${startDate}_${endDate}.xlsx`;
      downloadBlob(blob, filename);
      alert('Xuất báo cáo thành công!');
    } catch (error) {
      console.error('Error exporting sales:', error);
      alert('Lỗi khi xuất báo cáo bán hàng!');
    } finally {
      setExporting(null);
    }
  };

  const handleExportProducts = async () => {
    setExporting('products');
    try {
      const blob = await exportProducts();
      const filename = `DanhSachSanPham_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(blob, filename);
      alert('Xuất danh sách sản phẩm thành công!');
    } catch (error) {
      console.error('Error exporting products:', error);
      alert('Lỗi khi xuất danh sách sản phẩm!');
    } finally {
      setExporting(null);
    }
  };

  const handleExportInventory = async () => {
    setExporting('inventory');
    try {
      const blob = await exportInventory();
      const filename = `TonKho_${new Date().toISOString().split('T')[0]}.xlsx`;
      downloadBlob(blob, filename);
      alert('Xuất báo cáo tồn kho thành công!');
    } catch (error) {
      console.error('Error exporting inventory:', error);
      alert('Lỗi khi xuất báo cáo tồn kho!');
    } finally {
      setExporting(null);
    }
  };

  const formatChartData = (data: RevenueByDate[]) => {
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit',
        ...(chartGroupBy === 'month' ? { year: 'numeric' } : {})
      }),
      revenueFormatted: formatCurrency(item.revenue)
    }));
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>📊 Báo Cáo & Thống Kê</h1>
        <p className="page-description">
          Xem báo cáo doanh thu, hiệu suất sản phẩm và xuất dữ liệu Excel
        </p>
      </div>

      {/* Filters and Export Section - Horizontal Layout */}
      <div className="filters-export-container">
        {/* Filters Section */}
        <div className="filters-section">
          <div className="filters-card">
            <h3>🔍 Bộ Lọc Báo Cáo</h3>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label>Từ ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Đến ngày</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Danh mục</label>
                <select
                  className="form-control"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Nhân viên</label>
                <select
                  className="form-control"
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả nhân viên</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Nhóm theo</label>
                <select
                  className="form-control"
                  value={chartGroupBy}
                  onChange={(e) => setChartGroupBy(e.target.value as 'day' | 'week' | 'month')}
                >
                  <option value="day">Ngày</option>
                  <option value="week">Tuần</option>
                  <option value="month">Tháng</option>
                </select>
              </div>

              <div className="filter-actions">
                <button 
                  className="btn btn-primary"
                  onClick={loadReports}
                  disabled={loading}
                >
                  {loading ? '⏳ Đang tải...' : '🔄 Tải báo cáo'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="export-section">
          <h3>📥 Xuất Báo Cáo Excel</h3>
          <div className="export-buttons">
            <button
              className="btn btn-success"
              onClick={handleExportSales}
              disabled={exporting !== null}
            >
              {exporting === 'sales' ? '⏳ Đang xuất...' : '📊 Xuất Báo Cáo Bán Hàng'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleExportProducts}
              disabled={exporting !== null}
            >
              {exporting === 'products' ? '⏳ Đang xuất...' : '📦 Xuất Danh Sách Sản Phẩm'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleExportInventory}
              disabled={exporting !== null}
            >
              {exporting === 'inventory' ? '⏳ Đang xuất...' : '📋 Xuất Tồn Kho'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {salesReport && (
        <div className="summary-section">
          <div className="summary-cards">
            <div className="summary-card revenue">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h4>Tổng Doanh Thu</h4>
                <p className="card-value">{formatCurrency(salesReport.totalRevenue)}</p>
              </div>
            </div>
            <div className="summary-card orders">
              <div className="card-icon">🛒</div>
              <div className="card-content">
                <h4>Tổng Đơn Hàng</h4>
                <p className="card-value">{formatNumber(salesReport.totalOrders)}</p>
              </div>
            </div>
            <div className="summary-card items">
              <div className="card-icon">📦</div>
              <div className="card-content">
                <h4>Tổng Sản Phẩm Bán</h4>
                <p className="card-value">{formatNumber(salesReport.totalItems)}</p>
              </div>
            </div>
            <div className="summary-card average">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h4>Giá Trị TB/Đơn</h4>
                <p className="card-value">{formatCurrency(salesReport.averageOrderValue)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {revenueChart.length > 0 && (
        <div className="chart-section">
          <h3>📈 Biểu Đồ Doanh Thu</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={formatChartData(revenueChart)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#333' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FF6B35" 
                  strokeWidth={3}
                  name="Doanh thu"
                  dot={{ fill: '#FF6B35', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Product Performance */}
      {productPerformance.length > 0 && (
        <div className="performance-section">
          <h3>🏆 Hiệu Suất Sản Phẩm</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={productPerformance.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="productName" angle={-45} textAnchor="end" height={120} />
                <YAxis />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="quantitySold" fill="#4ECDC4" name="Số lượng bán" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="performance-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sản Phẩm</th>
                  <th>Danh Mục</th>
                  <th>Số Lượng Bán</th>
                  <th>Doanh Thu</th>
                  <th>Giá TB</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.map((product, index) => (
                  <tr key={product.productId}>
                    <td>{index + 1}</td>
                    <td className="product-name">{product.productName}</td>
                    <td>{product.categoryName}</td>
                    <td className="text-center">{formatNumber(product.quantitySold)}</td>
                    <td className="text-right revenue-cell">{formatCurrency(product.totalRevenue)}</td>
                    <td className="text-right">{formatCurrency(product.averagePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Đang tải báo cáo...</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

