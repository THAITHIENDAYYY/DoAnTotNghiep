import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployees } from '../api/employeeService';
import type { EmployeeList } from '../api/employeeService';
import { getShiftSummaries, getShiftDetail } from '../api/shiftService';
import type { ShiftSummary, ShiftDetail } from '../api/shiftService';
import './ShiftManagementPage.css';

const getDefaultStartDate = () =>
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

type InvoiceTab = 'sales' | 'voucher';

const ShiftManagementPage = () => {
  const [employees, setEmployees] = useState<EmployeeList[]>([]);
  const [summaries, setSummaries] = useState<ShiftSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [employeeId, setEmployeeId] = useState<number | ''>('');

  const [selectedShift, setSelectedShift] = useState<ShiftSummary | null>(null);
  const [detail, setDetail] = useState<ShiftDetail | null>(null);
  const [activeTab, setActiveTab] = useState<InvoiceTab>('sales');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    loadSummaries();
  }, [startDate, endDate, employeeId]);

  const loadEmployees = async () => {
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees', err);
    }
  };

  const loadSummaries = async () => {
    setLoading(true);
    try {
      const filter: any = { startDate, endDate };
      if (employeeId !== '') filter.employeeId = employeeId;
      const data = await getShiftSummaries(filter);
      setSummaries(data);
    } catch (err) {
      console.error('Error loading summaries', err);
      alert('Lỗi khi tải dữ liệu ca!');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetail = async (sum: ShiftSummary) => {
    try {
      const date = sum.shiftDate.split('T')[0];
      const data = await getShiftDetail(sum.employeeId, date);
      setDetail(data);
      setSelectedShift(sum);
      setShowDetail(true);
    } catch (err) {
      console.error('Error loading shift detail', err);
      alert('Không thể tải chi tiết ca.');
    }
  };

  const resetFilters = () => {
    const s = getDefaultStartDate();
    const e = getDefaultEndDate();
    setStartDate(s);
    setEndDate(e);
    setEmployeeId('');
    setSummaries([]);
    setTimeout(loadSummaries, 0);
  };

  const handlePrint = () => {
    window.print();
  };


  // Calculate starting cash (assumed 1,000,000 VND for now)
  const startingCash = 1000000;
  const netRevenue = selectedShift && detail 
    ? startingCash + detail.totalRevenue - (detail.totalDiscount || 0)
    : 0;

  // Mock payment methods (Cash and Credit)
  const cashAmount = selectedShift && detail ? detail.totalRevenue * 0.2 : 0;
  const creditAmount = selectedShift && detail ? detail.totalRevenue * 0.8 : 0;

  // Calculate dashboard totals
  const totalRevenue = summaries.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalOrders = summaries.reduce((sum, s) => sum + s.ordersCount, 0);
  const totalEmployees = new Set(summaries.map(s => s.employeeId)).size;
  const totalShifts = summaries.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Employee performance summary
  const employeePerformance = summaries.reduce((acc, s) => {
    if (!acc[s.employeeId]) {
      acc[s.employeeId] = {
        employeeId: s.employeeId,
        employeeName: s.employeeName,
        totalShifts: 0,
        totalRevenue: 0,
        totalOrders: 0,
        averageRevenue: 0
      };
    }
    acc[s.employeeId].totalShifts++;
    acc[s.employeeId].totalRevenue += s.totalRevenue;
    acc[s.employeeId].totalOrders += s.ordersCount;
    return acc;
  }, {} as Record<number, { employeeId: number; employeeName: string; totalShifts: number; totalRevenue: number; totalOrders: number; averageRevenue: number }>);

  const employeePerformanceList = Object.values(employeePerformance).map(emp => ({
    ...emp,
    averageRevenue: emp.totalShifts > 0 ? emp.totalRevenue / emp.totalShifts : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const handleExportCSV = () => {
    if (summaries.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const headers = ['Ngày', 'Nhân viên', 'Bắt đầu', 'Kết thúc', 'Số đơn', 'Doanh thu', 'Giảm giá'];
    const rows = summaries.map(s => [
      new Date(s.shiftDate).toLocaleDateString('vi-VN'),
      s.employeeName,
      formatTime(s.shiftStart),
      formatTime(s.shiftEnd),
      s.ordersCount,
      s.totalRevenue,
      s.totalDiscount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BaoCaoCa_${startDate}_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { user } = useAuth();

  return (
    <div className="shift-management-page">
      <div className="page-wrapper">
        {/* Orange Header Bar */}
        <div className="shift-page-header">
          <div>
            <h1>🕒 Quản Lý Ca Làm Việc</h1>
            <p className="page-description">
              Quản lý và theo dõi hiệu suất ca làm việc, doanh thu và báo cáo chi tiết
            </p>
          </div>
          {user && (
            <div className="header-user">
              <span>👋 Xin chào, <strong>{user.fullName}</strong></span>
            </div>
          )}
        </div>

        <div className="page-content">
          {/* Dashboard Summary */}
        {!showDetail && summaries.length > 0 && (
          <div className="dashboard-summary">
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <span className="summary-label">Tổng Doanh Thu</span>
              <span className="summary-value">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📦</div>
            <div className="summary-content">
              <span className="summary-label">Tổng Số Đơn</span>
              <span className="summary-value">{totalOrders}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">👥</div>
            <div className="summary-content">
              <span className="summary-label">Số Thu Ngân</span>
              <span className="summary-value">{totalEmployees}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <span className="summary-label">Tổng Số Ca</span>
              <span className="summary-value">{totalShifts}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <span className="summary-label">Đơn TB/Ca</span>
              <span className="summary-value">{totalShifts > 0 ? (totalOrders / totalShifts).toFixed(1) : 0}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💵</div>
            <div className="summary-content">
              <span className="summary-label">Giá trị đơn TB</span>
              <span className="summary-value">{formatCurrency(averageOrderValue)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Employee Performance Section */}
      {!showDetail && employeePerformanceList.length > 0 && (
        <div className="employee-performance-section">
          <div className="section-header">
            <h2>Hiệu Suất Thu Ngân</h2>
            <button className="export-btn" onClick={handleExportCSV}>
              📥 Xuất CSV
            </button>
          </div>
          <div className="performance-grid">
            {employeePerformanceList.map((emp) => (
              <div key={emp.employeeId} className="performance-card">
                <h3>{emp.employeeName}</h3>
                <div className="performance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Số ca:</span>
                    <span className="stat-value">{emp.totalShifts}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tổng doanh thu:</span>
                    <span className="stat-value">{formatCurrency(emp.totalRevenue)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tổng đơn:</span>
                    <span className="stat-value">{emp.totalOrders}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">TB/ca:</span>
                    <span className="stat-value">{formatCurrency(emp.averageRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="shift-filters">
        <div className="filters-card">
          <h3 className="filters-title">🔍 Bộ Lọc Báo Cáo Ca</h3>
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
              <label>Nhân viên</label>
              <select
                className="form-control"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">Tất cả nhân viên</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              {loading && (
                <span style={{ color: '#666', fontSize: '14px', alignSelf: 'center' }}>
                  Đang tải...
                </span>
              )}
              <button className="btn btn-secondary" onClick={resetFilters} disabled={loading}>
                ↻ Đặt lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {!showDetail ? (
        <div className="shift-list-container">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : summaries.length === 0 ? (
            <div className="empty">Không có dữ liệu ca</div>
          ) : (
            <table className="shift-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Nhân viên</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Đơn</th>
                  <th>Đã thanh toán</th>
                  <th>Doanh thu</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s, idx) => (
                  <tr key={`${s.employeeId}-${idx}-${s.shiftDate}`}>
                    <td>{new Date(s.shiftDate).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span className="badge-pill">{s.employeeName}</span>
                    </td>
                    <td>{formatTime(s.shiftStart)}</td>
                    <td>{formatTime(s.shiftEnd)}</td>
                    <td>{s.ordersCount}</td>
                    <td>
                      {s.completedPayments} ({formatCurrency(s.completedAmount)})
                    </td>
                    <td className="text-right">{formatCurrency(s.totalRevenue)}</td>
                    <td>
                      <button className="link-btn" onClick={() => handleViewDetail(s)}>
                        👁️ Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="shift-detail-view">
          {/* Header */}
          <div className="shift-header">
            <button className="shift-back-btn" onClick={() => setShowDetail(false)}>
              ←
            </button>
            <h1 className="shift-title">Quản lí ca</h1>
          </div>

          {/* Main Content - 2 Columns */}
          <div className="shift-content">
            {/* Left Panel - Summary Invoice */}
            <div className="shift-summary-panel">
              <div className="panel-header">
                <h2>Hóa đơn tóm tắt ca</h2>
                <button className="print-btn" onClick={handlePrint}>
                  🖨️ In
                </button>
              </div>

              <div className="summary-content">
                {/* Shift Information */}
                <div className="summary-section">
                  <div className="summary-row">
                    <span className="summary-label">Nhân viên</span>
                    <span className="summary-value">{detail?.employeeName || '—'}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Bắt đầu ca</span>
                    <span className="summary-value">{formatTime(detail?.shiftStart)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Đơn đã bán</span>
                    <span className="summary-value">{detail?.ordersCount || 0}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Đơn lỗi</span>
                    <span className="summary-value error">{selectedShift?.errorOrdersCount || 0}</span>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="summary-section">
                  <h3 className="section-title">Tài chính</h3>
                  <div className="summary-row">
                    <span className="summary-label">Số tiền đầu ca</span>
                    <span className="summary-value">{formatCurrency(startingCash)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Tổng doanh thu</span>
                    <span className="summary-value">{formatCurrency(detail?.totalRevenue || 0)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Tổng giảm giá</span>
                    <span className="summary-value">{formatCurrency(detail?.totalDiscount || 0)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span className="summary-label">Doanh thu</span>
                    <span className="summary-value">{formatCurrency(netRevenue)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Đơn hàng chưa hoàn thành</span>
                    <span className="summary-value">0</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Tổng tiền đơn hàng lỗi</span>
                    <span className="summary-value error">
                      {formatCurrency((selectedShift?.errorOrdersCount || 0) * 50000)}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="summary-section">
                  <h3 className="section-title">Hình thức thanh toán</h3>
                  <div className="payment-methods-table">
                    <div className="payment-methods-header">
                      <span>Hình thức thanh toán</span>
                      <span>Doanh thu</span>
                    </div>
                    <div className="payment-methods-row">
                      <span>Cash (VND)</span>
                      <span>{formatCurrency(cashAmount)}</span>
                    </div>
                    <div className="payment-methods-row">
                      <span>Credit (VND)</span>
                      <span>{formatCurrency(creditAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Invoice Details */}
            <div className="shift-details-panel">
              {/* Tabs */}
              <div className="details-tabs">
                <button
                  className={`details-tab ${activeTab === 'sales' ? 'active' : ''}`}
                  onClick={() => setActiveTab('sales')}
                >
                  Hóa đơn bán hàng
                </button>
                <button
                  className={`details-tab ${activeTab === 'voucher' ? 'active' : ''}`}
                  onClick={() => setActiveTab('voucher')}
                >
                  Hóa đơn voucher
                </button>
              </div>

              {/* Tab Content */}
              <div className="details-content">
                {activeTab === 'sales' && (
                  <>
                    <div className="details-header">
                      <h3>Tổng tiền bán hàng</h3>
                      <button className="print-btn" onClick={handlePrint}>
                        🖨️ In
                      </button>
                    </div>

                    <div className="product-section">
                      <h4 className="section-subtitle">Món</h4>
                      <div className="product-table">
                        <div className="product-table-header">
                          <span>Món</span>
                          <span>Số lượng</span>
                        </div>
                        {detail?.topItems && detail.topItems.length > 0 ? (
                          detail.topItems.map((item, idx) => (
                            <div key={idx} className="product-table-row">
                              <span>{item.productName}</span>
                              <span>{item.quantitySold}</span>
                            </div>
                          ))
                        ) : (
                          <div className="product-table-row">
                            <span>Chưa có dữ liệu</span>
                            <span>—</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="product-section">
                      <h4 className="section-subtitle">Phần ăn thêm</h4>
                      <div className="product-table">
                        <div className="product-table-header">
                          <span>Phần ăn thêm</span>
                          <span>Số lượng</span>
                        </div>
                        <div className="product-table-row">
                          <span>Chưa có dữ liệu</span>
                          <span>—</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'voucher' && (
                  <>
                    <div className="details-header">
                      <h3>Hóa đơn có áp dụng giảm giá</h3>
                      <button className="print-btn" onClick={handlePrint}>
                        🖨️ In
                      </button>
                    </div>
                    <div className="voucher-orders-table">
                      <div className="voucher-orders-header">
                        <span>Số đơn</span>
                        <span>Ngày</span>
                        <span>Mã giảm giá</span>
                        <span>Tên khuyến mãi</span>
                        <span>Giảm giá</span>
                        <span>Tổng tiền</span>
                      </div>
                      {detail?.voucherOrders && detail.voucherOrders.length > 0 ? (
                        detail.voucherOrders.map((voucher) => (
                          <div key={voucher.orderId} className="voucher-orders-row">
                            <span className="order-number">{voucher.orderNumber}</span>
                            <span>{new Date(voucher.orderDate).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            <span className="discount-code">{voucher.discountCode || '—'}</span>
                            <span>{voucher.discountName || '—'}</span>
                            <span className="discount-amount">-{formatCurrency(voucher.discountAmount)}</span>
                            <span className="total-amount">{formatCurrency(voucher.totalAmount)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="voucher-orders-row empty">
                          <span>Chưa có đơn nào áp dụng giảm giá</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManagementPage;
