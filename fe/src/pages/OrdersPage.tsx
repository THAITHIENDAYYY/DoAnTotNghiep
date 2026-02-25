import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrders, getOrderById, updateOrder, exportOrders } from '../api/orderService';
import type { OrderList, Order, UpdateOrderDto, OrderFilter } from '../api/orderService';
import './OrdersPage.css';

// Helper type for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      title?: string;
    };
  };
  message?: string;
}

const getErrorMessage = (err: unknown, defaultMessage: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const apiErr = err as ApiError;
    const response = apiErr.response;
    
    if (response?.data) {
      if (response.data.message) {
        return response.data.message;
      }
      if (response.data.errors) {
        const errorMessages = Object.entries(response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        return errorMessages || defaultMessage;
      }
      if (response.data.title) {
        return response.data.title;
      }
    }
  }
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message;
  }
  return defaultMessage;
};

const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
};

const getDefaultEndDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

const OrdersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    status: 1,
    notes: '',
  });
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [exporting, setExporting] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState<number | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  // Reload orders when navigating back from other pages (e.g., PaymentPage)
  useEffect(() => {
    loadOrders();
  }, [location.key]); // location.key changes when navigating

  const buildFilter = (override?: Partial<OrderFilter>) => {
    const resolvedStart = override?.startDate ?? startDate;
    const resolvedEnd = override?.endDate ?? endDate;
    const filter: OrderFilter = {};
    if (resolvedStart) {
      filter.startDate = resolvedStart;
    }
    if (resolvedEnd) {
      filter.endDate = resolvedEnd;
    }
    return filter;
  };

  const loadOrders = async (overrideFilter?: Partial<OrderFilter>) => {
    try {
      setLoading(true);
      setError(null);
      const filter = buildFilter(overrideFilter);
      const hasFilter = Object.keys(filter).length > 0;
      const data = await getOrders(hasFilter ? filter : undefined);
      
      // Debug: Log orders with discount
      const ordersWithDiscount = data.filter(o => o.hasDiscount || o.discountAmount);
      if (ordersWithDiscount.length > 0) {
        console.log('Orders with discount:', ordersWithDiscount.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          hasDiscount: o.hasDiscount,
          discountAmount: o.discountAmount
        })));
      }
      
      setOrders(data.sort((a, b) => b.id - a.id));
    } catch (err) {
      setError('Không thể tải đơn hàng. Vui lòng kiểm tra kết nối đến server.');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      window.alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    loadOrders();
  };

  const handleResetFilters = () => {
    const defaultStart = getDefaultStartDate();
    const defaultEnd = getDefaultEndDate();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    loadOrders({ startDate: defaultStart, endDate: defaultEnd });
  };

  const handleExportOrders = async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      window.alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
      return;
    }
    try {
      setExporting(true);
      const filter = buildFilter();
      const hasFilter = Object.keys(filter).length > 0;
      const blob = await exportOrders(hasFilter ? filter : undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `DonHang_${filter.startDate ?? 'all'}_${filter.endDate ?? 'all'}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting orders:', err);
      window.alert('Lỗi khi xuất dữ liệu đơn hàng!');
    } finally {
      setExporting(false);
    }
  };

  const handleView = async (orderList: OrderList) => {
    try {
      setViewLoading(true);
      setViewingOrderId(orderList.id);
      const fullOrder = await getOrderById(orderList.id);
      setViewingOrder(fullOrder);
      setShowViewModal(true);
    } catch (err) {
      window.alert('Không thể tải chi tiết đơn hàng');
      console.error('Error loading order detail:', err);
    } finally {
      setViewLoading(false);
      setViewingOrderId(null);
    }
  };

  const handleEdit = async (orderList: OrderList) => {
    try {
      const fullOrder = await getOrderById(orderList.id);
      setEditingOrder(fullOrder);
      
      // Map status name to status number
      let statusNumber = 1;
      switch (fullOrder.statusName.toLowerCase()) {
        case 'chờ xử lý':
          statusNumber = 1;
          break;
        case 'đã xác nhận':
        case 'đã xử lý':
          statusNumber = 2;
          break;
        case 'đang chuẩn bị':
          statusNumber = 3;
          break;
        case 'đang giao':
          statusNumber = 4;
          break;
        case 'đã giao':
          statusNumber = 5;
          break;
        case 'đã hủy':
          statusNumber = 6;
          break;
      }
      
      setFormData({
        status: statusNumber,
        notes: fullOrder.notes || '',
      });
      setShowModal(true);
    } catch (err) {
      window.alert('Không thể tải thông tin đơn hàng');
      console.error('Error loading order:', err);
    }
  };

  const handlePayment = (order: OrderList) => {
    navigate('/payment', { state: { order } });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    setFormData({
      status: 1,
      notes: '',
    });
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingOrder) return;

    try {
      const updateData: UpdateOrderDto = {
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      };

      console.log('🔄 Updating order:', editingOrder.id, updateData);
      
      await updateOrder(editingOrder.id, updateData);
      
      window.alert('Cập nhật đơn hàng thành công!');
      handleCloseModal();
      loadOrders();
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Không thể cập nhật đơn hàng');
      window.alert(errorMessage);
      console.error('Error updating order:', err);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'chờ xử lý':
        return 'badge-warning';
      case 'đã xác nhận':
      case 'đã xử lý':
        return 'badge-info';
      case 'đang chuẩn bị':
        return 'badge-primary';
      case 'đã giao':
        return 'badge-success';
      case 'đã hủy':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getEmployeeDisplayName = (order: OrderList): string => {
    if (order.employeeName && order.employeeName.trim().length > 0) {
      return order.employeeName;
    }
    if (order.employeeId) {
      return `Nhân viên #${order.employeeId}`;
    }
    return 'Admin';
  };

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.statusName.toLowerCase().includes(search) ||
      order.typeName.toLowerCase().includes(search)
    );
  });

  return (
    <div className="orders-page">
      <div className="page-header">
        <h2>🛒 Quản Lý Đơn Hàng</h2>
        <button className="btn btn-success" onClick={() => loadOrders()}>🔄 Làm mới</button>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn, tên khách hàng, trạng thái..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-stats">
          Hiển thị <strong>{filteredOrders.length}</strong> / {orders.length} đơn hàng
        </div>
      </div>

      <div className="orders-filters card">
        <div className="filter-group">
          <label htmlFor="order-start-date">Từ ngày</label>
          <input
            id="order-start-date"
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="order-end-date">Đến ngày</label>
          <input
            id="order-end-date"
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            🔍 Tìm kiếm
          </button>
          <button className="btn btn-secondary" onClick={handleResetFilters} disabled={loading}>
            ⟳ Đặt lại
          </button>
          <button className="btn btn-success" onClick={handleExportOrders} disabled={exporting}>
            {exporting ? 'Đang xuất...' : '⬇️ Xuất Excel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="table-container card">
          <table className="table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>Loại</th>
                <th>Tổng Tiền</th>
                <th>Giảm Giá</th>
                <th>Ngày Đặt</th>
                <th>Nhân viên thanh toán</th>
                <th>Thanh Toán</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                    {searchTerm ? 'Không tìm thấy đơn hàng nào' : 'Chưa có đơn hàng nào'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.typeName}</td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <span className="badge badge-success" title={`Giảm ${formatPrice(order.discountAmount)}`}>
                          🎁 -{formatPrice(order.discountAmount)}
                        </span>
                      ) : order.hasDiscount ? (
                        <span className="badge badge-warning" title="Có voucher nhưng không áp dụng được">
                          🎟️ Voucher
                        </span>
                      ) : (
                        <span className="badge badge-secondary">—</span>
                      )}
                    </td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{getEmployeeDisplayName(order)}</td>
                    <td>
                      <span className={`badge ${order.isPaid ? 'badge-success' : 'badge-warning'}`}>
                        {order.isPaid ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleView(order)} disabled={viewLoading && viewingOrderId === order.id} title="Xem chi tiết">
                          {viewLoading && viewingOrderId === order.id ? '...' : '👁️ Xem'}
                        </button>
                        <button className="btn btn-success btn-sm" onClick={() => handleEdit(order)} title="Sửa trạng thái">✏️ Sửa</button>
                        {!order.isPaid && order.statusName !== 'Đã hủy' && (
                          <button 
                            className="btn btn-primary btn-sm btn-pay" 
                            onClick={() => handlePayment(order)}
                            title="Thanh toán đơn hàng"
                          >
                            💳 Trả
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
      {/* View Modal */}
      {showViewModal && viewingOrder && (
        <div className="modal-overlay" onClick={handleCloseViewModal}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👁️ Chi Tiết Đơn Hàng</h3>
              <button className="close-btn" onClick={handleCloseViewModal}>✕</button>
            </div>
            <div className="modal-body order-detail-body">
              <div className="order-overview">
                <div className="overview-card">
                  <span>Mã đơn</span>
                  <strong>{viewingOrder.orderNumber}</strong>
                </div>
                <div className="overview-card">
                  <span>Ngày đặt</span>
                  <strong>{formatDate(viewingOrder.orderDate)}</strong>
                </div>
                <div className="overview-card">
                  <span>Trạng thái</span>
                  <span className={`badge ${getStatusBadgeClass(viewingOrder.statusName)}`}>
                    {viewingOrder.statusName}
                  </span>
                </div>
                <div className="overview-card">
                  <span>Thanh toán</span>
                  <span className={`badge ${viewingOrder.isPaid ? 'badge-success' : 'badge-warning'}`}>
                    {viewingOrder.isPaid ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                  </span>
                </div>
              </div>

              <div className="detail-sections">
                <div className="detail-card">
                  <h4>👤 Khách hàng</h4>
                  <div className="detail-row">
                    <span>Tên khách</span>
                    <strong>{viewingOrder.customerName || 'Khách vãng lai'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Email</span>
                    <strong>{viewingOrder.customerEmail || '—'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Loại đơn</span>
                    <strong>{viewingOrder.typeName}</strong>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>💳 Thanh toán</h4>
                  <div className="detail-row">
                    <span>Tạm tính</span>
                    <strong>{formatPrice(viewingOrder.subTotal)}</strong>
                  </div>
                  {viewingOrder.taxAmount > 0 && (
                    <div className="detail-row">
                      <span>Thuế VAT (10%)</span>
                      <strong>{formatPrice(viewingOrder.taxAmount)}</strong>
                    </div>
                  )}
                  {viewingOrder.deliveryFee > 0 && (
                    <div className="detail-row">
                      <span>Phí giao hàng</span>
                      <strong>{formatPrice(viewingOrder.deliveryFee)}</strong>
                    </div>
                  )}
                  {viewingOrder.discountAmount && viewingOrder.discountAmount > 0 && (
                    <div className="detail-row discount-row">
                      <span>🎁 Giảm giá</span>
                      <strong style={{ color: '#f97316' }}>-{formatPrice(viewingOrder.discountAmount)}</strong>
                    </div>
                  )}
                  <div className="detail-row total-row">
                    <span>Tổng tiền</span>
                    <strong style={{ color: '#f97316', fontSize: '1.2em' }}>{formatPrice(viewingOrder.totalAmount)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Đã thanh toán</span>
                    <strong style={{ color: viewingOrder.isPaid ? '#10b981' : '#f59e0b' }}>
                      {formatPrice(viewingOrder.paidAmount)}
                    </strong>
                  </div>
                  {viewingOrder.totalAmount > viewingOrder.paidAmount && (
                    <div className="detail-row">
                      <span>Còn lại</span>
                      <strong style={{ color: '#ef4444' }}>
                        {formatPrice(viewingOrder.totalAmount - viewingOrder.paidAmount)}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="detail-card">
                  <h4>👥 Nhân viên & Ghi chú</h4>
                  <div className="detail-row">
                    <span>Thu ngân</span>
                    <strong>{viewingOrder.employeeName ? viewingOrder.employeeName : 'Admin'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Ghi chú đơn hàng</span>
                    <strong>{viewingOrder.notes || 'Không có ghi chú'}</strong>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>📅 Lịch sử trạng thái</h4>
                  <div className="detail-row">
                    <span>Ngày đặt</span>
                    <strong>{formatDate(viewingOrder.orderDate)}</strong>
                  </div>
                  {viewingOrder.confirmedAt && (
                    <div className="detail-row">
                      <span>Đã xác nhận</span>
                      <strong>{formatDate(viewingOrder.confirmedAt)}</strong>
                    </div>
                  )}
                  {viewingOrder.preparedAt && (
                    <div className="detail-row">
                      <span>Đã chuẩn bị</span>
                      <strong>{formatDate(viewingOrder.preparedAt)}</strong>
                    </div>
                  )}
                  {viewingOrder.deliveredAt && (
                    <div className="detail-row">
                      <span>Đã giao</span>
                      <strong>{formatDate(viewingOrder.deliveredAt)}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-items-table">
                <div className="items-header">
                  <h4>Món ăn trong đơn ({viewingOrder.orderItems.length})</h4>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Món</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingOrder.orderItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="item-info">
                            <strong>{item.productName}</strong>
                            {item.specialInstructions && (
                              <small>Ghi chú: {item.specialInstructions}</small>
                            )}
                          </div>
                        </td>
                        <td>x{item.quantity}</td>
                        <td>{formatPrice(item.unitPrice)}</td>
                        <td>{formatPrice(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseViewModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && editingOrder && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Sửa Đơn Hàng</h3>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="orderNumber">Mã Đơn Hàng</label>
                  <input
                    type="text"
                    id="orderNumber"
                    value={editingOrder.orderNumber}
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customerName">Khách Hàng</label>
                  <input
                    type="text"
                    id="customerName"
                    value={editingOrder.customerName}
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="totalAmount">Tổng Tiền</label>
                  <input
                    type="text"
                    id="totalAmount"
                    value={new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(editingOrder.totalAmount)}
                    disabled
                    className="form-input disabled"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Trạng Thái <span className="required">*</span>
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                    required
                    className="form-input"
                  >
                    <option value={1}>Chờ xử lý</option>
                    <option value={2}>Đã xác nhận</option>
                    <option value={3}>Đang chuẩn bị</option>
                    <option value={4}>Đang giao</option>
                    <option value={5}>Đã giao</option>
                    <option value={6}>Đã hủy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Ghi Chú</label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input"
                    rows={4}
                    placeholder="Nhập ghi chú cho đơn hàng..."
                  />
                </div>

                <div className="order-items-summary">
                  <h4>Món ăn trong đơn ({editingOrder.orderItems.length} món)</h4>
                  <div className="items-list">
                    {editingOrder.orderItems.map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

