import { useState, useEffect } from 'react';
import { getProducts } from '../api/productService';
import { getCategories } from '../api/categoryService';
import { getOrders } from '../api/orderService';
import { getCustomers } from '../api/customerService';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0,
    customers: 0,
    loading: true
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      const [products, categories, orders, customers] = await Promise.all([
        getProducts().catch(() => []),
        getCategories().catch(() => []),
        getOrders().catch(() => []),
        getCustomers().catch(() => [])
      ]);

      setStats({
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        customers: customers.length,
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="stats-grid">
        <div className="stat-card products">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.loading ? '...' : stats.products}</h3>
            <p>Sản Phẩm</p>
          </div>
        </div>

        <div className="stat-card categories">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <h3>{stats.loading ? '...' : stats.categories}</h3>
            <p>Danh Mục</p>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{stats.loading ? '...' : stats.orders}</h3>
            <p>Đơn Hàng</p>
          </div>
        </div>

        <div className="stat-card customers">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.loading ? '...' : stats.customers}</h3>
            <p>Khách Hàng</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <h2>📊 Bảng Điều Khiển</h2>
          <p>Chào mừng đến với hệ thống quản lý cửa hàng thức ăn nhanh</p>
          <p>Vui lòng chọn chức năng từ menu bên trái để bắt đầu.</p>
        </div>

        <div className="quick-actions">
          <h3>🚀 Hành Động Nhanh</h3>
          <div className="actions-grid">
            <a href="/pos" className="action-btn">
              🖥️ Mở POS
            </a>
            <a href="/products" className="action-btn">
              ➕ Thêm Sản Phẩm
            </a>
            <a href="/orders" className="action-btn">
              📋 Xem Đơn Hàng
            </a>
            <a href="/ingredients" className="action-btn">
              🧂 Quản Lý Kho
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

