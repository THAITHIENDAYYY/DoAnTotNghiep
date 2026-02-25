import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTableAreas, 
  getTablesByArea, 
  getActiveTables, 
  updateTableStatus, 
  TableStatus, 
  type TableList, 
  type TableAreaList,
  getTableGroups,
  createTableGroup,
  updateTableGroup,
  dissolveTableGroup,
  type TableGroupList,
  type CreateTableGroupDto,
  type UpdateTableGroupDto
} from '../api/tableService';
import { getOrders, updateOrder, getOrderById, type OrderList, type Order } from '../api/orderService';
import './TablesPage.css';

const TablesPage = () => {
  const navigate = useNavigate();
  const [tableAreas, setTableAreas] = useState<TableAreaList[]>([]);
  const [tables, setTables] = useState<TableList[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showCloseTableModal, setShowCloseTableModal] = useState(false);
  const [selectedTableForClose, setSelectedTableForClose] = useState<TableList | null>(null);
  const [closeTableOrderDetail, setCloseTableOrderDetail] = useState<Order | null>(null);
  const [loadingCloseTable, setLoadingCloseTable] = useState(false);
  const [showTransferTableModal, setShowTransferTableModal] = useState(false);
  const [selectedTableForTransfer, setSelectedTableForTransfer] = useState<TableList | null>(null);
  const [availableTablesForTransfer, setAvailableTablesForTransfer] = useState<TableList[]>([]);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<OrderList | null>(null);
  const [currentOrderDetail, setCurrentOrderDetail] = useState<Order | null>(null);
  
  // Table Group states
  const [tableGroups, setTableGroups] = useState<TableGroupList[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedTablesForMerge, setSelectedTablesForMerge] = useState<number[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeGroupName, setMergeGroupName] = useState('');
  const [loadingMerge, setLoadingMerge] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedGroupForRename, setSelectedGroupForRename] = useState<TableGroupList | null>(null);
  const [renameGroupName, setRenameGroupName] = useState('');
  const [loadingRename, setLoadingRename] = useState(false);
  const [mergeMode, setMergeMode] = useState(false); // Chế độ chọn bàn để ghép

  useEffect(() => {
    loadTableAreas();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadTablesByArea(selectedGroup);
    } else {
      setTables([]);
    }
  }, [selectedGroup]);

  useEffect(() => {
    loadTableGroups();
  }, []);

  const loadTableAreas = async () => {
    try {
      setLoading(true);
      const areas = await getTableAreas();
      setTableAreas(areas);
      // Set default selected group to first area
      if (areas.length > 0) {
        setSelectedGroup(areas[0].id);
      }
    } catch (error) {
      console.error('Error loading table areas:', error);
      alert('Không thể tải danh sách khu vực bàn');
    } finally {
      setLoading(false);
    }
  };

  const loadTablesByArea = async (areaId: number) => {
    try {
      setLoading(true);
      const areaTables = await getTablesByArea(areaId);
      setTables(areaTables);
    } catch (error) {
      console.error('Error loading tables:', error);
      alert('Không thể tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  const emptyTablesCount = tables.filter(t => t.status === TableStatus.Available).length;
  const occupiedTablesCount = tables.filter(t => t.status === TableStatus.Occupied).length;

  const handleTableClick = (table: TableList) => {
    // Luôn navigate sang POS, bất kể trạng thái bàn
    // POSPage sẽ tự động load đơn cũ nếu bàn đang occupied
    navigate('/pos', {
      state: {
        selectedTable: {
          id: table.id,
          number: parseInt(table.tableNumber.replace(/\D/g, '')) || table.id,
          capacity: table.capacity,
          tableNumber: table.tableNumber,
          status: table.status, // Truyền status để POSPage biết bàn đang occupied
          isOccupied: table.status === TableStatus.Occupied
        }
      }
    });
  };


  const handleCloseTable = async () => {
    if (!selectedTableForClose) return;

    try {
      setLoadingCloseTable(true);
      
      // Đóng bàn - backend sẽ tự động chuyển các đơn hàng sang Delivered
      await updateTableStatus(selectedTableForClose.id, TableStatus.Available);
      
      // Reload tables để cập nhật màu sắc ngay lập tức
      if (selectedGroup) {
        await loadTablesByArea(selectedGroup);
      }
      
      // Reload lại nhóm bàn nếu có
      await loadTableGroups();
      
      // Đóng modal
      setShowCloseTableModal(false);
      setSelectedTableForClose(null);
      setCloseTableOrderDetail(null);
      
      // Hiển thị thông báo thành công
      alert(`✅ Đã đóng bàn ${selectedTableForClose.tableNumber} thành công!\nBàn đã chuyển về trạng thái trống và các đơn hàng đã được hoàn thành.`);
    } catch (error: any) {
      console.error('Error closing table:', error);
      const errorMessage = error.response?.data?.message || 'Không thể đóng bàn. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setLoadingCloseTable(false);
    }
  };

  const handleCancelCloseTable = () => {
    setShowCloseTableModal(false);
    setSelectedTableForClose(null);
    setCloseTableOrderDetail(null);
  };

  const handleTransferTable = async (table: TableList) => {
    try {
      setLoadingTransfer(true);
      // Tìm đơn hàng đang hoạt động của bàn này
      const allOrders = await getOrders();
      const activeOrder = allOrders.find(
        order => order.tableId === table.id && 
        order.status !== 5 && // Không phải Cancelled
        order.status !== 4    // Không phải Delivered
      );
      
      if (!activeOrder) {
        alert('Không tìm thấy đơn hàng đang hoạt động cho bàn này.');
        return;
      }

      // Lấy chi tiết đơn hàng để hiển thị danh sách món ăn
      const orderDetail = await getOrderById(activeOrder.id);

      setCurrentOrder(activeOrder);
      setCurrentOrderDetail(orderDetail);
      setSelectedTableForTransfer(table);
      
      // Lấy danh sách bàn trống từ TẤT CẢ các khu vực để chuyển
      const allTables = await getActiveTables();
      const availableTables = allTables.filter(
        t => t.status === TableStatus.Available && t.id !== table.id
      );
      setAvailableTablesForTransfer(availableTables);
      setShowTransferTableModal(true);
    } catch (error) {
      console.error('Error loading transfer data:', error);
      alert('Không thể tải dữ liệu để chuyển bàn.');
    } finally {
      setLoadingTransfer(false);
    }
  };

  const handleConfirmTransfer = async (newTableId: number) => {
    if (!selectedTableForTransfer || !currentOrder) return;

    try {
      setLoadingTransfer(true);
      // Cập nhật order với tableId mới
      await updateOrder(currentOrder.id, {
        status: currentOrder.status,
        notes: currentOrder.notes,
        employeeId: currentOrder.employeeId,
        tableId: newTableId
      });

      // Reload tables để cập nhật trạng thái
      if (selectedGroup) {
        await loadTablesByArea(selectedGroup);
      }
      
      setShowTransferTableModal(false);
      setSelectedTableForTransfer(null);
      setCurrentOrder(null);
      setCurrentOrderDetail(null);
      setAvailableTablesForTransfer([]);
      alert('Chuyển bàn thành công!');
    } catch (error) {
      console.error('Error transferring table:', error);
      alert('Không thể chuyển bàn. Vui lòng thử lại.');
    } finally {
      setLoadingTransfer(false);
    }
  };

  const handleCancelTransfer = () => {
    setShowTransferTableModal(false);
    setSelectedTableForTransfer(null);
    setCurrentOrder(null);
    setCurrentOrderDetail(null);
    setAvailableTablesForTransfer([]);
  };

  const loadTableGroups = async () => {
    try {
      setLoadingGroups(true);
      const groups = await getTableGroups();
      setTableGroups(groups);
    } catch (error) {
      console.error('Error loading table groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleTableSelectForMerge = (tableId: number) => {
    if (selectedTablesForMerge.includes(tableId)) {
      setSelectedTablesForMerge(selectedTablesForMerge.filter(id => id !== tableId));
    } else {
      // Chỉ cho phép chọn bàn trống
      const table = tables.find(t => t.id === tableId);
      if (table && table.status === TableStatus.Available) {
        setSelectedTablesForMerge([...selectedTablesForMerge, tableId]);
      }
    }
  };

  const handleOpenMergeModal = () => {
    if (selectedTablesForMerge.length < 2) {
      alert('Vui lòng chọn ít nhất 2 bàn trống để ghép');
      return;
    }
    setMergeGroupName('');
    setShowMergeModal(true);
  };

  const handleMergeTables = async () => {
    if (!mergeGroupName.trim()) {
      alert('Vui lòng nhập tên cho nhóm bàn');
      return;
    }

    if (selectedTablesForMerge.length < 2) {
      alert('Phải chọn ít nhất 2 bàn để ghép');
      return;
    }

    try {
      setLoadingMerge(true);
      const createDto: CreateTableGroupDto = {
        name: mergeGroupName.trim(),
        tableIds: selectedTablesForMerge
      };
      
      await createTableGroup(createDto);
      
      // Reload data
      await loadTableGroups();
      if (selectedGroup) {
        await loadTablesByArea(selectedGroup);
      }
      
      setShowMergeModal(false);
      setSelectedTablesForMerge([]);
      setMergeGroupName('');
      alert('Ghép bàn thành công!');
    } catch (error: any) {
      console.error('Error merging tables:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      let errorMessage = 'Không thể ghép bàn. Vui lòng thử lại.';
      
      // Ưu tiên ModelState errors (validation errors)
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errorMessage = errors.join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.title) {
        errorMessage = error.response.data.title;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoadingMerge(false);
    }
  };

  const handleOpenRenameModal = (group: TableGroupList) => {
    setSelectedGroupForRename(group);
    setRenameGroupName(group.name);
    setShowRenameModal(true);
  };

  const handleRenameGroup = async () => {
    if (!selectedGroupForRename || !renameGroupName.trim()) {
      return;
    }

    try {
      setLoadingRename(true);
      const updateDto: UpdateTableGroupDto = {
        name: renameGroupName.trim()
      };
      
      await updateTableGroup(selectedGroupForRename.id, updateDto);
      
      await loadTableGroups();
      setShowRenameModal(false);
      setSelectedGroupForRename(null);
      setRenameGroupName('');
      alert('Đổi tên nhóm bàn thành công!');
    } catch (error: any) {
      console.error('Error renaming group:', error);
      const errorMessage = error.response?.data?.message || 'Không thể đổi tên. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setLoadingRename(false);
    }
  };

  const handleDissolveGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`Bạn có chắc muốn hủy ghép nhóm bàn "${groupName}"?\n\nCác bàn sẽ được trả về trạng thái trống.`)) {
      return;
    }

    try {
      await dissolveTableGroup(groupId);
      await loadTableGroups();
      if (selectedGroup) {
        await loadTablesByArea(selectedGroup);
      }
      alert('Đã hủy ghép nhóm bàn thành công!');
    } catch (error: any) {
      console.error('Error dissolving group:', error);
      const errorMessage = error.response?.data?.message || 'Không thể hủy ghép. Vui lòng thử lại.';
      alert(errorMessage);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="tables-page">
      {/* Header */}
      <div className="tables-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1>Bàn</h1>
        <div className="header-right">
          <span className="time">15:32</span>
        </div>
      </div>

      <div className="tables-content">
        {/* Chú thích bàn */}
        <div className="table-legend">
          <h3>Chú thích bàn</h3>
          <div className="legend-items">
            <div className="legend-item legend-empty">
              <div className="legend-box empty">
                <span className="legend-number">{emptyTablesCount}</span>
              </div>
              <span className="legend-label">Bàn Trống</span>
            </div>
            <div className="legend-item legend-occupied">
              <div className="legend-box occupied">
                <span className="legend-number">{occupiedTablesCount}</span>
              </div>
              <span className="legend-label">Bàn Có Người</span>
            </div>
          </div>
        </div>

        {/* Nhóm bàn (Khu vực) */}
        <div className="table-groups">
          <h3>Khu vực bàn</h3>
          <div className="group-buttons">
            {tableAreas.map((area) => (
              <button
                key={area.id}
                className={`group-btn ${selectedGroup === area.id ? 'active' : ''}`}
                onClick={() => setSelectedGroup(area.id)}
              >
                {area.name}
              </button>
            ))}
          </div>
        </div>

        {/* Nhóm bàn đã ghép */}
        <div className="table-groups-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Nhóm bàn đã ghép {tableGroups.length > 0 && `(${tableGroups.length})`}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className={`btn ${mergeMode ? 'btn-warning' : 'btn-secondary'}`}
                onClick={() => {
                  setMergeMode(!mergeMode);
                  if (!mergeMode) {
                    // Bật chế độ ghép bàn
                    setSelectedTablesForMerge([]);
                  } else {
                    // Tắt chế độ ghép bàn
                    setSelectedTablesForMerge([]);
                  }
                }}
                style={{ 
                  padding: '0.5rem 1rem', 
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}
                title={mergeMode ? 'Tắt chế độ chọn bàn' : 'Bật chế độ chọn bàn để ghép'}
              >
                {mergeMode ? '❌ Tắt chọn' : '🔗 Bật chọn bàn'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleOpenMergeModal}
                disabled={selectedTablesForMerge.length < 2}
                style={{ 
                  padding: '0.75rem 1.5rem', 
                  fontSize: '1rem',
                  opacity: selectedTablesForMerge.length < 2 ? 0.5 : 1,
                  cursor: selectedTablesForMerge.length < 2 ? 'not-allowed' : 'pointer'
                }}
                title={selectedTablesForMerge.length < 2 ? 'Vui lòng chọn ít nhất 2 bàn trống để ghép' : 'Ghép các bàn đã chọn'}
              >
                🔗 Ghép bàn {selectedTablesForMerge.length > 0 && `(${selectedTablesForMerge.length})`}
              </button>
            </div>
          </div>
            {loadingGroups ? (
              <div className="loading">Đang tải...</div>
            ) : tableGroups.length > 0 ? (
              <div className="table-groups-list">
                {tableGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className="table-group-card"
                    onClick={() => {
                      // Navigate to POS với nhóm bàn
                      navigate('/pos', {
                        state: {
                          selectedTableGroup: {
                            id: group.id,
                            name: group.name
                          }
                        }
                      });
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="table-group-header">
                      <h4>{group.name}</h4>
                      <div className="table-group-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenRenameModal(group)}
                          title="Đổi tên"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleDissolveGroup(group.id, group.name)}
                          title="Hủy ghép"
                        >
                          🔓
                        </button>
                      </div>
                    </div>
                    <div className="table-group-info">
                      <span>{group.tableCount} bàn</span>
                      <span>•</span>
                      <span>{group.totalCapacity} chỗ</span>
                      <span>•</span>
                      <span>{group.tableNumbers.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#666',
                background: '#f9f9f9',
                borderRadius: '8px',
                border: '2px dashed #ddd'
              }}>
                <p style={{ margin: 0, fontSize: '1rem' }}>
                  {!mergeMode ? (
                    '💡 Chưa có nhóm bàn nào. Bấm nút "🔗 Bật chọn bàn" để bắt đầu chọn bàn ghép.'
                  ) : selectedTablesForMerge.length === 0 ? (
                    '💡 Đã bật chế độ chọn bàn. Hãy click vào các bàn trống (màu xanh) để chọn. Cần ít nhất 2 bàn.'
                  ) : (
                    `✅ Đã chọn ${selectedTablesForMerge.length} bàn. ${selectedTablesForMerge.length < 2 ? 'Chọn thêm bàn để ghép (cần ít nhất 2 bàn).' : 'Bấm nút "🔗 Ghép bàn" ở trên để tạo nhóm.'}`
                  )}
                </p>
              </div>
            )}
          </div>

        {/* Danh sách bàn */}
        <div className="tables-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Danh sách bàn</h3>
            {selectedTablesForMerge.length > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '0.5rem 1rem',
                background: '#fff3e0',
                borderRadius: '8px',
                border: '2px solid #ff6b35'
              }}>
                <span style={{ color: '#ff6b35', fontWeight: 600 }}>
                  Đã chọn: {selectedTablesForMerge.length} bàn
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedTablesForMerge([])}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                >
                  Hủy chọn
                </button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <div className="tables-grid">
              {tables.map((table) => {
                // Kiểm tra status: ưu tiên status từ database, nếu Available thì coi như trống
                // Chỉ kiểm tra activeOrdersCount như một fallback nếu status không rõ ràng
                const hasActiveOrder = table.activeOrdersCount > 0;
                // Nếu status là Available, bàn là trống (bất kể activeOrdersCount)
                // Nếu status là Occupied hoặc có đơn hàng chưa thanh toán, bàn là occupied
                const isAvailable = table.status === TableStatus.Available;
                const isOccupied = table.status === TableStatus.Occupied || (hasActiveOrder && table.status !== TableStatus.Available);
                
                return (
                  <div
                    key={table.id}
                    className={`table-card ${isAvailable ? 'empty' : isOccupied ? 'occupied' : ''} ${selectedTablesForMerge.includes(table.id) ? 'selected-for-merge' : ''}`}
                    onClick={(e) => {
                      // Nếu đang ở chế độ ghép bàn (mergeMode = true), thì chọn bàn để ghép
                      if (mergeMode) {
                        e.stopPropagation();
                        if (isAvailable) {
                          handleTableSelectForMerge(table.id);
                        } else {
                          alert('Chỉ có thể chọn bàn trống để ghép!');
                        }
                      } else {
                        // Nếu không ở chế độ ghép, click vào bàn sẽ navigate sang POS
                        handleTableClick(table);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Right click để chọn bàn (nếu bàn trống)
                      if (isAvailable) {
                        handleTableSelectForMerge(table.id);
                        if (!mergeMode) {
                          setMergeMode(true); // Tự động bật chế độ ghép
                        }
                      }
                    }}
                  >
                    {/* Action Icons - chỉ hiển thị khi bàn có người (status = Occupied) */}
                    {isOccupied && (
                      <>
                        <button
                          className="table-icon table-icon-left"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              setLoadingCloseTable(true);
                              // Tìm đơn hàng đang hoạt động của bàn này
                              const allOrders = await getOrders();
                              const activeOrder = allOrders.find(
                                order => order.tableId === table.id && 
                                order.status !== 5 && // Không phải Cancelled
                                order.status !== 4    // Không phải Delivered
                              );
                              
                              if (activeOrder) {
                                // Lấy chi tiết đơn hàng để hiển thị danh sách món ăn
                                const orderDetail = await getOrderById(activeOrder.id);
                                setCloseTableOrderDetail(orderDetail);
                              } else {
                                setCloseTableOrderDetail(null);
                              }

                              setSelectedTableForClose(table);
                              setShowCloseTableModal(true);
                            } catch (error) {
                              console.error('Error loading close table data:', error);
                              setCloseTableOrderDetail(null);
                              setSelectedTableForClose(table);
                              setShowCloseTableModal(true);
                            } finally {
                              setLoadingCloseTable(false);
                            }
                          }}
                          title="Đóng bàn"
                        >
                          🔒
                        </button>
                        <button
                          className="table-icon table-icon-right"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTransferTable(table);
                          }}
                          title="Chuyển bàn"
                        >
                          ☰
                        </button>
                      </>
                    )}
                    
                    {/* Capacity Number */}
                    <div className="table-capacity">{table.capacity}</div>
                    
                    {/* Chair Icon */}
                    <div className={`chair-icon ${isAvailable ? 'empty' : isOccupied ? 'occupied' : ''}`}>
                      🪑
                    </div>
                    
                    {/* Table Number */}
                    <div className="table-number-label">{table.tableNumber}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận đóng bàn */}
      {showCloseTableModal && selectedTableForClose && (
        <div className="modal-overlay" onClick={handleCancelCloseTable}>
          <div className="modal-content close-table-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đóng bàn</h3>
              <button className="modal-close" onClick={handleCancelCloseTable}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transfer-order-info">
                <h4>Đơn hàng bàn {selectedTableForClose.tableNumber}</h4>
                {loadingCloseTable ? (
                  <div className="loading">Đang tải...</div>
                ) : closeTableOrderDetail && closeTableOrderDetail.orderItems && closeTableOrderDetail.orderItems.length > 0 ? (
                  <div className="order-items-list">
                    {closeTableOrderDetail.orderItems.map((item, index) => (
                      <div key={item.id || index} className="order-item-row">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="order-total-row">
                      <strong>Tổng tiền: {formatPrice(closeTableOrderDetail.totalAmount)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="modal-hint">Không có món nào trong đơn hàng.</p>
                )}
              </div>
              
              <p className="modal-hint" style={{ marginTop: '1rem' }}>
                Bàn sẽ được chuyển về trạng thái trống sau khi xác nhận.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelCloseTable} disabled={loadingCloseTable}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleCloseTable} disabled={loadingCloseTable}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chuyển bàn */}
      {showTransferTableModal && selectedTableForTransfer && currentOrder && (
        <div className="modal-overlay" onClick={handleCancelTransfer}>
          <div className="modal-content transfer-table-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chuyển bàn</h3>
              <button className="modal-close" onClick={handleCancelTransfer}>✕</button>
            </div>
            <div className="modal-body">
              <div className="transfer-order-info">
                <h4>Đơn hàng bàn {selectedTableForTransfer.tableNumber}</h4>
                {currentOrderDetail && currentOrderDetail.orderItems && currentOrderDetail.orderItems.length > 0 ? (
                  <div className="order-items-list">
                    {currentOrderDetail.orderItems.map((item, index) => (
                      <div key={item.id || index} className="order-item-row">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-quantity">x{item.quantity}</span>
                        <span className="item-price">{formatPrice(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="order-total-row">
                      <strong>Tổng tiền: {formatPrice(currentOrderDetail.totalAmount)}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="modal-hint">Không có món nào trong đơn hàng.</p>
                )}
              </div>
              
              <div className="transfer-tables-section">
                <h4>Chọn bàn mới:</h4>
                {loadingTransfer ? (
                  <div className="loading">Đang tải...</div>
                ) : availableTablesForTransfer.length === 0 ? (
                  <p className="modal-hint">Không có bàn trống nào để chuyển.</p>
                ) : (
                  <div className="transfer-tables-grid">
                    {availableTablesForTransfer.map((table) => (
                      <button
                        key={table.id}
                        className="transfer-table-card"
                        onClick={() => handleConfirmTransfer(table.id)}
                        disabled={loadingTransfer}
                      >
                        <div className="transfer-table-capacity">{table.capacity}</div>
                        <div className="transfer-table-number">{table.tableNumber}</div>
                        <div className="transfer-table-area">{table.tableAreaName}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelTransfer} disabled={loadingTransfer}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ghép bàn */}
      {showMergeModal && (
        <div className="modal-overlay" onClick={() => setShowMergeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ghép bàn</h3>
              <button className="modal-close" onClick={() => setShowMergeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Tên nhóm bàn:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Nhóm bạn A, Tiệc sinh nhật, Bàn 12 người..."
                  value={mergeGroupName}
                  onChange={(e) => setMergeGroupName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Các bàn đã chọn ({selectedTablesForMerge.length}):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedTablesForMerge.map(tableId => {
                    const table = tables.find(t => t.id === tableId);
                    if (!table) return null;
                    return (
                      <span key={tableId} className="badge badge-info" style={{ padding: '0.5rem 1rem' }}>
                        {table.tableNumber} ({table.capacity} chỗ)
                      </span>
                    );
                  })}
                </div>
                <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                  Tổng: {selectedTablesForMerge.reduce((sum, id) => {
                    const table = tables.find(t => t.id === id);
                    return sum + (table?.capacity || 0);
                  }, 0)} chỗ
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowMergeModal(false)}
                disabled={loadingMerge}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleMergeTables}
                disabled={loadingMerge || !mergeGroupName.trim()}
              >
                {loadingMerge ? 'Đang xử lý...' : 'Xác nhận ghép'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal đổi tên nhóm bàn */}
      {showRenameModal && selectedGroupForRename && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Đổi tên nhóm bàn</h3>
              <button className="modal-close" onClick={() => setShowRenameModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Tên mới:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={renameGroupName}
                  onChange={(e) => setRenameGroupName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowRenameModal(false)}
                disabled={loadingRename}
              >
                Hủy
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleRenameGroup}
                disabled={loadingRename || !renameGroupName.trim()}
              >
                {loadingRename ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;

