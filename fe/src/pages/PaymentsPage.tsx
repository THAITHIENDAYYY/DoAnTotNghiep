import { useState, useEffect } from 'react';
import type { PaymentFilter, PaymentList } from '../api/paymentService';
import { getPayments, PaymentMethod, PaymentStatus, getPaymentStatusBadge } from '../api/paymentService';
import './PaymentsPage.css';

const PaymentsPage = () => {
  const [payments, setPayments] = useState<PaymentList[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const getDefaultStartDate = () =>
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | ''>('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async (overrideFilter?: Partial<PaymentFilter>) => {
    setLoading(true);
    try {
      const resolvedStartDate = overrideFilter?.startDate ?? startDate;
      const resolvedEndDate = overrideFilter?.endDate ?? endDate;
      const resolvedMethod =
        overrideFilter?.paymentMethod ?? (filterMethod === '' ? undefined : filterMethod);
      const resolvedStatus =
        overrideFilter?.status ?? (filterStatus === '' ? undefined : filterStatus);

      const filter: PaymentFilter = {};

      if (resolvedStartDate) filter.startDate = resolvedStartDate;
      if (resolvedEndDate) filter.endDate = resolvedEndDate;
      if (resolvedMethod !== undefined) filter.paymentMethod = resolvedMethod;
      if (resolvedStatus !== undefined) filter.status = resolvedStatus;
      
      const data = await getPayments(filter);
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
      alert('Lỗi khi tải dữ liệu thanh toán!');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadPayments();
  };

  const handleReset = () => {
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setFilterMethod('');
    setFilterStatus('');
    loadPayments({
      startDate: defaultStart,
      endDate: defaultEnd,
      paymentMethod: undefined,
      status: undefined
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary from current filtered data
  const totalAmount = payments
    .filter(p => Number(p.status) === PaymentStatus.Completed)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCount = payments.length;
  const completedCount = payments.filter(p => Number(p.status) === PaymentStatus.Completed).length;

  return (
    <div className="payments-page">
      <div className="page-header">
        <h1>💳 Quản Lý Thanh Toán</h1>
        <p className="page-description">Xem và quản lý lịch sử các giao dịch thanh toán</p>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <div className="summary-label">Tổng Doanh Thu</div>
            <div className="summary-value">{formatCurrency(totalAmount)}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <div className="summary-label">Tổng Giao Dịch</div>
            <div className="summary-value">{totalCount}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <div className="summary-label">Đã Hoàn Thành</div>
            <div className="summary-value">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Từ ngày:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Đến ngày:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Phương thức:</label>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value ? Number(e.target.value) as PaymentMethod : '')}
          >
            <option value="">Tất cả</option>
            <option value={PaymentMethod.Cash}>Tiền mặt</option>
            <option value={PaymentMethod.CreditCard}>Thẻ tín dụng</option>
            <option value={PaymentMethod.DebitCard}>Thẻ ghi nợ</option>
            <option value={PaymentMethod.MobilePayment}>Thanh toán di động</option>
            <option value={PaymentMethod.BankTransfer}>Chuyển khoản</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value ? Number(e.target.value) as PaymentStatus : '')}
          >
            <option value="">Tất cả</option>
            <option value={PaymentStatus.Pending}>Đang xử lý</option>
            <option value={PaymentStatus.Completed}>Hoàn thành</option>
            <option value={PaymentStatus.Failed}>Thất bại</option>
            <option value={PaymentStatus.Refunded}>Đã hoàn tiền</option>
            <option value={PaymentStatus.Cancelled}>Đã hủy</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn-filter" onClick={handleFilter}>
            🔍 Tìm kiếm
          </button>
          <button className="btn-reset" onClick={handleReset}>
            🔄 Đặt lại
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>Không có dữ liệu thanh toán</p>
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mã Đơn</th>
                <th>Số Tiền</th>
                <th>Phương Thức</th>
                <th>Trạng Thái</th>
                <th>Ngày Thanh Toán</th>
                <th>Khách Hàng</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>{payment.orderNumber}</td>
                  <td className="amount">{formatCurrency(payment.amount)}</td>
                  <td>
                    <span className="method-badge">
                      {payment.methodName}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getPaymentStatusBadge(payment.status)}`}>
                      {payment.statusName}
                    </span>
                  </td>
                  <td>{formatDate(payment.paymentDate)}</td>
                  <td>{payment.customerName || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
