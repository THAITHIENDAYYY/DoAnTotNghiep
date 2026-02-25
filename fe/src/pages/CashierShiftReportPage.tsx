import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentShift, getShiftDetail, getShiftSummaries, endShift } from '../api/shiftService';
import type { CurrentShift, ShiftDetail, ShiftSummary } from '../api/shiftService';
import './CashierShiftReportPage.css';

const CashierShiftReportPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftSummary[]>([]);
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [endingShift, setEndingShift] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!user?.employeeId) {
      alert('Bạn chưa được gán nhân viên. Vui lòng liên hệ quản trị viên.');
      navigate('/pos');
      return;
    }
    loadCurrentShift();
    loadShiftHistory();
  }, [user?.employeeId]);

  const loadCurrentShift = async () => {
    if (!user?.employeeId) return;
    setLoading(true);
    try {
      const shift = await getCurrentShift(user.employeeId);
      setCurrentShift(shift);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCurrentShift(null);
      } else {
        console.error('Error loading current shift:', error);
        alert('Không thể tải thông tin ca hiện tại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadShiftHistory = async () => {
    if (!user?.employeeId) return;
    setLoadingHistory(true);
    try {
      const history = await getShiftSummaries({ employeeId: user.employeeId });
      setShiftHistory(history);
    } catch (error) {
      console.error('Error loading shift history:', error);
      alert('Không thể tải lịch sử ca.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleEndShift = async () => {
    if (!user?.employeeId || !currentShift) return;
    
    const confirmEnd = window.confirm('Bạn có chắc chắn muốn kết thúc ca làm việc?');
    if (!confirmEnd) return;

    setEndingShift(true);
    try {
      await endShift(user.employeeId);
      alert('Đã kết thúc ca làm việc thành công!');
      
      // Load final shift detail before clearing
      if (currentShift.shiftStart) {
        const date = new Date(currentShift.shiftStart).toISOString().split('T')[0];
        const detail = await getShiftDetail(user.employeeId, date);
        setSelectedShiftDetail(detail);
        setShowDetail(true);
      }
      
      setCurrentShift(null);
      loadShiftHistory();
    } catch (error: any) {
      console.error('Error ending shift:', error);
      alert(error.response?.data?.message || 'Không thể kết thúc ca. Vui lòng thử lại.');
    } finally {
      setEndingShift(false);
    }
  };

  const handleViewHistoryDetail = async (shift: ShiftSummary) => {
    try {
      const date = shift.shiftDate.split('T')[0];
      const detail = await getShiftDetail(user!.employeeId!, date);
      setSelectedShiftDetail(detail);
      setShowDetail(true);
    } catch (error) {
      console.error('Error loading shift detail:', error);
      alert('Không thể tải chi tiết ca.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDuration = (start?: string) => {
    if (!start) return '—';
    const startTime = new Date(start);
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="cashier-shift-report-page">
        <div className="loading-container">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="cashier-shift-report-page">
      <div className="report-header">
        <h1>Báo Cáo Ca Làm Việc</h1>
        <button 
          className="history-btn"
          onClick={() => {
            setShowHistory(!showHistory);
            if (!showHistory) loadShiftHistory();
          }}
        >
          📋 Lịch sử ca
        </button>
      </div>

      {!currentShift ? (
        <div className="no-shift-message">
          <div className="no-shift-icon">🕒</div>
          <h2>Chưa có ca làm việc đang diễn ra</h2>
          <p>Ca làm việc sẽ tự động bắt đầu khi bạn đăng nhập.</p>
        </div>
      ) : (
        <div className="current-shift-dashboard">
          {/* Shift Info Header */}
          <div className="shift-info-card">
            <div className="shift-info-header">
              <div>
                <h2>Ca Làm Việc Hiện Tại</h2>
                <p className="shift-time">
                  Bắt đầu: {formatTime(currentShift.shiftStart)} ({formatDuration(currentShift.shiftStart)})
                </p>
              </div>
              <button
                className="end-shift-btn"
                onClick={handleEndShift}
                disabled={endingShift}
              >
                {endingShift ? 'Đang kết thúc...' : '🏁 Kết Thúc Ca'}
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-content">
                <span className="metric-label">Doanh Thu Ròng</span>
                <span className="metric-value">{formatCurrency(currentShift.netRevenue)}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">📦</div>
              <div className="metric-content">
                <span className="metric-label">Tổng Số Hóa Đơn</span>
                <span className="metric-value">{currentShift.ordersCount}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🎁</div>
              <div className="metric-content">
                <span className="metric-label">Tổng Giảm Giá</span>
                <span className="metric-value">{formatCurrency(currentShift.totalDiscount)}</span>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">💵</div>
              <div className="metric-content">
                <span className="metric-label">Tổng Doanh Thu</span>
                <span className="metric-value">{formatCurrency(currentShift.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="payment-breakdown-card">
            <h3>Chi Tiết Hình Thức Thanh Toán</h3>
            <div className="payment-breakdown-table">
              <div className="payment-breakdown-header">
                <span>Hình thức</span>
                <span>Số lượng</span>
                <span>Tổng giá trị</span>
              </div>
              {currentShift.paymentBreakdown.length > 0 ? (
                currentShift.paymentBreakdown.map((payment, idx) => (
                  <div key={idx} className="payment-breakdown-row">
                    <span>{payment.paymentMethodName}</span>
                    <span>{payment.transactionCount}</span>
                    <span className="amount">{formatCurrency(payment.totalAmount)}</span>
                  </div>
                ))
              ) : (
                <div className="payment-breakdown-row empty">
                  <span colSpan={3}>Chưa có giao dịch</span>
                </div>
              )}
              <div className="payment-breakdown-footer">
                <span>Tổng cộng</span>
                <span>
                  {currentShift.paymentBreakdown.reduce((sum, p) => sum + p.transactionCount, 0)}
                </span>
                <span className="amount">
                  {formatCurrency(
                    currentShift.paymentBreakdown.reduce((sum, p) => sum + p.totalAmount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="top-items-card">
            <h3>Top Món Bán Chạy</h3>
            <div className="top-items-table">
              <div className="top-items-header">
                <span>Món</span>
                <span>Số lượng</span>
                <span>Doanh thu</span>
              </div>
              {currentShift.topItems.length > 0 ? (
                currentShift.topItems.map((item, idx) => (
                  <div key={idx} className="top-items-row">
                    <span>{item.productName}</span>
                    <span>{item.quantitySold}</span>
                    <span className="amount">{formatCurrency(item.totalRevenue)}</span>
                  </div>
                ))
              ) : (
                <div className="top-items-row empty">
                  <span colSpan={3}>Chưa có món nào</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-header">
              <h2>Lịch Sử Ca Làm Việc</h2>
              <button className="close-btn" onClick={() => setShowHistory(false)}>×</button>
            </div>
            <div className="history-modal-content">
              {loadingHistory ? (
                <div className="loading">Đang tải...</div>
              ) : shiftHistory.length === 0 ? (
                <div className="empty">Chưa có lịch sử ca</div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Bắt đầu</th>
                      <th>Kết thúc</th>
                      <th>Đơn</th>
                      <th>Doanh thu</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftHistory.map((shift, idx) => (
                      <tr key={idx}>
                        <td>{new Date(shift.shiftDate).toLocaleDateString('vi-VN')}</td>
                        <td>{formatTime(shift.shiftStart)}</td>
                        <td>{formatTime(shift.shiftEnd)}</td>
                        <td>{shift.ordersCount}</td>
                        <td>{formatCurrency(shift.totalRevenue)}</td>
                        <td>
                          <button
                            className="view-detail-btn"
                            onClick={() => handleViewHistoryDetail(shift)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedShiftDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h2>Chi Tiết Ca Làm Việc</h2>
              <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="detail-modal-content">
              <div className="detail-section">
                <h3>Thông Tin Ca</h3>
                <div className="detail-row">
                  <span>Nhân viên:</span>
                  <span>{selectedShiftDetail.employeeName}</span>
                </div>
                <div className="detail-row">
                  <span>Ngày:</span>
                  <span>{new Date(selectedShiftDetail.shiftDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="detail-row">
                  <span>Bắt đầu:</span>
                  <span>{formatTime(selectedShiftDetail.shiftStart)}</span>
                </div>
                <div className="detail-row">
                  <span>Kết thúc:</span>
                  <span>{formatTime(selectedShiftDetail.shiftEnd)}</span>
                </div>
                <div className="detail-row">
                  <span>Số đơn:</span>
                  <span>{selectedShiftDetail.ordersCount}</span>
                </div>
                <div className="detail-row">
                  <span>Doanh thu:</span>
                  <span className="amount">{formatCurrency(selectedShiftDetail.totalRevenue)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Top Món Bán Chạy</h3>
                <div className="top-items-table">
                  <div className="top-items-header">
                    <span>Món</span>
                    <span>Số lượng</span>
                    <span>Doanh thu</span>
                  </div>
                  {selectedShiftDetail.topItems.length > 0 ? (
                    selectedShiftDetail.topItems.map((item, idx) => (
                      <div key={idx} className="top-items-row">
                        <span>{item.productName}</span>
                        <span>{item.quantitySold}</span>
                        <span className="amount">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="top-items-row empty">
                      <span colSpan={3}>Không có dữ liệu</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierShiftReportPage;

