import { useState, useEffect } from 'react';
import { getDashboardStats, formatCurrency, formatNumber } from '../api/reportsService';
import type { DashboardStats } from '../api/reportsService';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardStats}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="admin-dashboard-page">
      <div className="page-header">
        <h2>📊 Dashboard Quản Trị</h2>
        <button className="btn btn-secondary" onClick={loadDashboardStats}>
          🔄 Làm mới
        </button>
      </div>

      {/* Revenue Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card revenue-today">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Doanh Thu Hôm Nay</h3>
            <p className="stat-value">{formatCurrency(stats.todayRevenue)}</p>
            <span className="stat-detail">{formatNumber(stats.todayOrders)} đơn hàng</span>
          </div>
        </div>

        <div className="stat-card revenue-week">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>Doanh Thu Tuần Này</h3>
            <p className="stat-value">{formatCurrency(stats.weekRevenue)}</p>
            <span className="stat-detail">{formatNumber(stats.weekOrders)} đơn hàng</span>
          </div>
        </div>

        <div className="stat-card revenue-month">
          <div className="stat-icon">📆</div>
          <div className="stat-info">
            <h3>Doanh Thu Tháng Này</h3>
            <p className="stat-value">{formatCurrency(stats.monthRevenue)}</p>
            <span className="stat-detail">{formatNumber(stats.monthOrders)} đơn hàng</span>
          </div>
        </div>

        <div className="stat-card revenue-year">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Doanh Thu Năm Nay</h3>
            <p className="stat-value">{formatCurrency(stats.yearRevenue)}</p>
            <span className="stat-detail">{formatNumber(stats.yearOrders)} đơn hàng</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="quick-stat-card">
          <div className="quick-stat-icon">👥</div>
          <div className="quick-stat-info">
            <p className="quick-stat-value">{formatNumber(stats.totalCustomers)}</p>
            <span className="quick-stat-label">Khách hàng</span>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon">🍔</div>
          <div className="quick-stat-info">
            <p className="quick-stat-value">{formatNumber(stats.totalProducts)}</p>
            <span className="quick-stat-label">Sản phẩm</span>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon">👨‍💼</div>
          <div className="quick-stat-info">
            <p className="quick-stat-value">{formatNumber(stats.totalEmployees)}</p>
            <span className="quick-stat-label">Nhân viên</span>
          </div>
        </div>

        <div className="quick-stat-card">
          <div className="quick-stat-icon">🪑</div>
          <div className="quick-stat-info">
            <p className="quick-stat-value">{formatNumber(stats.totalTables)}</p>
            <span className="quick-stat-label">Bàn</span>
          </div>
        </div>
      </div>

      {/* Stock Alerts */}
      {(stats.lowStockProducts > 0 || stats.outOfStockProducts > 0) && (
        <div className="alerts-section">
          <h3>⚠️ Cảnh Báo Tồn Kho</h3>
          <div className="alerts-grid">
            {stats.outOfStockProducts > 0 && (
              <div className="alert-card danger">
                <span className="alert-icon">🚫</span>
                <div className="alert-info">
                  <strong>{stats.outOfStockProducts} sản phẩm</strong>
                  <span>Hết hàng</span>
                </div>
              </div>
            )}
            {stats.lowStockProducts > 0 && (
              <div className="alert-card warning">
                <span className="alert-icon">⚠️</span>
                <div className="alert-info">
                  <strong>{stats.lowStockProducts} sản phẩm</strong>
                  <span>Sắp hết hàng</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue Chart (Last 7 Days) */}
      <div className="chart-section card">
        <h3>📈 Doanh Thu 7 Ngày Gần Đây</h3>
        <div className="simple-bar-chart">
          {stats.revenueChart.map((item, index) => {
            const maxRevenue = Math.max(...stats.revenueChart.map(r => r.revenue));
            const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
            const date = new Date(item.date);
            const dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
            
            return (
              <div key={index} className="bar-item">
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ height: `${heightPercent}%` }}
                    title={`${formatCurrency(item.revenue)} - ${item.orders} đơn`}
                  >
                    <span className="bar-value">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
                <span className="bar-label">{dayLabel}</span>
                <span className="bar-orders">{item.orders} đơn</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="top-products-section card">
        <h3>🏆 Top 10 Sản Phẩm Bán Chạy (30 Ngày Gần Đây)</h3>
        {stats.topProducts.length === 0 ? (
          <p className="empty-state">Chưa có dữ liệu bán hàng</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Sản Phẩm</th>
                  <th>Đã Bán</th>
                  <th>Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={product.productId}>
                    <td className="rank-cell">
                      <span className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td><strong>{product.productName}</strong></td>
                    <td>{formatNumber(product.totalSold)} phần</td>
                    <td className="text-price">{formatCurrency(product.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

