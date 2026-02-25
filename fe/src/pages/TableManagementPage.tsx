import { useState, useEffect } from 'react';
import './TableManagementPage.css';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getTableAreas,
  createTableArea,
  updateTableArea,
  deleteTableArea,
  type TableList,
  type CreateTableDto,
  type UpdateTableDto,
  type TableAreaList,
  type CreateTableAreaDto,
  type UpdateTableAreaDto,
  TableStatus,
  TABLE_STATUSES,
  getStatusBadgeClass
} from '../api/tableService';

const TableManagementPage = () => {
  // Tables state
  const [tables, setTables] = useState<TableList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableList | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<number | 'all'>('all');
  
  const [formData, setFormData] = useState<CreateTableDto>({
    tableNumber: '',
    capacity: 4,
    status: TableStatus.Available,
    tableAreaId: 0,
    location: '',
    isActive: true,
    notes: ''
  });

  // TableArea state
  const [tableAreas, setTableAreas] = useState<TableAreaList[]>([]);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<TableAreaList | null>(null);
  const [areaFormData, setAreaFormData] = useState<CreateTableAreaDto>({
    name: '',
    description: '',
    displayOrder: 0,
    isActive: true
  });

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTables();
      // Sort by ID descending (newest first)
      const sortedData = data.sort((a, b) => b.id - a.id);
      setTables(sortedData);
    } catch (err: any) {
      console.error('Error loading tables:', err);
      setError('Không thể tải danh sách bàn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadTableAreas = async () => {
    try {
      const data = await getTableAreas();
      // Sort by DisplayOrder then by Name
      const sortedData = data.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      });
      setTableAreas(sortedData);
    } catch (err: any) {
      console.error('Error loading table areas:', err);
      setError('Không thể tải danh sách khu vực. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    loadTables();
    loadTableAreas();
  }, []);

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = 
      table.tableNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.location && table.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      table.tableAreaName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'all' || table.tableAreaId === selectedArea;
    
    return matchesSearch && matchesArea;
  });

  const handleAdd = () => {
    setEditingTable(null);
    setFormData({
      tableNumber: '',
      capacity: 4,
      status: TableStatus.Available,
      tableAreaId: tableAreas.length > 0 ? tableAreas[0].id : 0,
      location: '',
      isActive: true,
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (table: TableList) => {
    setEditingTable(table);
    setFormData({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status: table.status,
      tableAreaId: table.tableAreaId,
      location: table.location || '',
      isActive: table.isActive,
      notes: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, tableNumber: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa bàn ${tableNumber}?`);
    
    if (!confirmed) return;

    try {
      await deleteTable(id);
      setTables(tables.filter(t => t.id !== id));
      alert('Xóa bàn thành công!');
    } catch (err: any) {
      console.error('Error deleting table:', err);
      const errorMsg = err.response?.data?.message || 'Không thể xóa bàn. Bàn này có thể đang có đơn hàng.';
      alert(errorMsg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tableNumber.trim()) {
      alert('Vui lòng nhập số bàn');
      return;
    }

    if (!formData.capacity || formData.capacity <= 0) {
      alert('Vui lòng nhập sức chứa hợp lệ');
      return;
    }

    try {
      if (editingTable) {
        // Update
        const updateData: UpdateTableDto = {
          tableNumber: formData.tableNumber,
          capacity: formData.capacity,
          status: formData.status,
          tableAreaId: formData.tableAreaId,
          location: formData.location,
          isActive: formData.isActive,
          notes: formData.notes
        };
        await updateTable(editingTable.id, updateData);
        alert('Cập nhật bàn thành công!');
      } else {
        // Create
        await createTable(formData);
        alert('Thêm bàn thành công!');
      }
      
      setShowModal(false);
      loadTables();
    } catch (err: any) {
      console.error('Error saving table:', err);
      const errorMsg = err.response?.data?.message || 'Không thể thêm/sửa bàn. Số bàn có thể đã tồn tại.';
      alert(errorMsg);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
  };

  const getStatusBadge = (status: TableStatus, statusName: string) => {
    const badgeClass = getStatusBadgeClass(status);
    return <span className={`badge ${badgeClass}`}>{statusName}</span>;
  };

  // ==================
  // TABLE AREA HANDLERS
  // ==================

  const handleAddArea = () => {
    setEditingArea(null);
    setAreaFormData({
      name: '',
      description: '',
      displayOrder: tableAreas.length + 1,
      isActive: true
    });
    setShowAreaModal(true);
  };

  const handleEditArea = (area: TableAreaList) => {
    setEditingArea(area);
    setAreaFormData({
      name: area.name,
      description: area.description || '',
      displayOrder: area.displayOrder,
      isActive: area.isActive
    });
    setShowAreaModal(true);
  };

  const handleDeleteArea = async (id: number, name: string) => {
    const area = tableAreas.find(a => a.id === id);
    if (area && area.tableCount > 0) {
      alert(`Không thể xóa khu vực "${name}". Đang có ${area.tableCount} bàn thuộc khu vực này.`);
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa khu vực "${name}"?`);
    if (!confirmed) return;

    try {
      await deleteTableArea(id);
      alert('Xóa khu vực thành công!');
      loadTableAreas();
      loadTables(); // Reload tables để cập nhật count
    } catch (err: any) {
      console.error('Error deleting area:', err);
      const errorMsg = err.response?.data?.message || 'Không thể xóa khu vực.';
      alert(errorMsg);
    }
  };

  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!areaFormData.name.trim()) {
      alert('Vui lòng nhập tên khu vực');
      return;
    }

    try {
      if (editingArea) {
        // Update
        const updateData: UpdateTableAreaDto = {
          name: areaFormData.name,
          description: areaFormData.description,
          displayOrder: areaFormData.displayOrder,
          isActive: areaFormData.isActive
        };
        await updateTableArea(editingArea.id, updateData);
        alert('Cập nhật khu vực thành công!');
      } else {
        // Create
        await createTableArea(areaFormData);
        alert('Thêm khu vực thành công!');
      }
      
      setShowAreaModal(false);
      loadTableAreas();
      loadTables(); // Reload tables để cập nhật count
    } catch (err: any) {
      console.error('Error saving area:', err);
      const errorMsg = err.response?.data?.message || 'Không thể thêm/sửa khu vực. Tên khu vực có thể đã tồn tại.';
      alert(errorMsg);
    }
  };

  const handleCloseAreaModal = () => {
    setShowAreaModal(false);
    setEditingArea(null);
  };

  return (
    <div className="table-management-page">
      <div className="page-header">
        <h2>🪑 Quản Lý Bàn</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleAddArea}>📍 Thêm Khu Vực</button>
          <button className="btn btn-primary" onClick={handleAdd}>➕ Thêm Bàn</button>
        </div>
      </div>

      {/* Khu Vực Section */}
      <div className="groups-section card">
        <h3>📋 Khu Vực</h3>
        <div className="groups-grid">
          {tableAreas.map((area) => (
            <div 
              key={area.id} 
              className={`group-card ${selectedArea === area.id ? 'active' : ''}`}
            >
              <div className="group-info" onClick={() => setSelectedArea(selectedArea === area.id ? 'all' : area.id)} style={{ cursor: 'pointer' }}>
                <span className="group-name">{area.name}</span>
                <span className="group-table-count">
                  {area.tableCount} bàn
                </span>
                {area.description && (
                  <span className="group-description">{area.description}</span>
                )}
              </div>
              <div className="group-actions">
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditArea(area);
                  }}
                  title="Sửa khu vực"
                >
                  ✏️
                </button>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteArea(area.id, area.name);
                  }}
                  disabled={area.tableCount > 0}
                  title={area.tableCount > 0 ? 'Không thể xóa khu vực có bàn' : 'Xóa khu vực'}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {selectedArea !== 'all' && (
            <div 
              className="group-card"
              onClick={() => setSelectedArea('all')}
              style={{ cursor: 'pointer', border: '2px dashed #ccc' }}
            >
              <div className="group-info">
                <span className="group-name">🔄 Xem tất cả</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="search-section card">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo số bàn, vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>
        <div className="search-stats">
          Hiển thị {filteredTables.length} / {tables.length} bàn
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
                <th>STT</th>
                <th>Số Bàn</th>
                <th>Sức Chứa</th>
                <th>Khu Vực</th>
                <th>Vị Trí</th>
                <th>Trạng Thái</th>
                <th>Đơn Đang Hoạt Động</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    {searchTerm || selectedArea !== 'all' 
                      ? 'Không tìm thấy bàn nào' 
                      : 'Chưa có bàn nào. Nhấn "Thêm Bàn" để bắt đầu.'}
                  </td>
                </tr>
              ) : (
                filteredTables.map((table, index) => (
                  <tr key={table.id}>
                    <td>{index + 1}</td>
                    <td><strong>{table.tableNumber}</strong></td>
                    <td>{table.capacity} người</td>
                    <td>{table.tableAreaName}</td>
                    <td>{table.location || '-'}</td>
                    <td>{getStatusBadge(table.status, table.statusName)}</td>
                    <td>
                      {table.activeOrdersCount > 0 ? (
                        <span className="badge badge-warning">{table.activeOrdersCount} đơn</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => handleEdit(table)}
                      >
                        ✏️ Sửa
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(table.id, table.tableNumber)}
                        disabled={table.activeOrdersCount > 0}
                        title={table.activeOrdersCount > 0 ? 'Không thể xóa bàn đang có đơn hàng' : 'Xóa bàn'}
                      >
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTable ? 'Sửa Bàn' : 'Thêm Bàn Mới'}</h3>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Số Bàn <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    placeholder="Ví dụ: B01, VIP01, T2-01"
                    required
                  />
                  <small className="form-hint">
                    💡 Gợi ý: B01-B10 (bàn thường), VIP01 (bàn VIP), T2-01 (tầng 2)
                  </small>
                </div>

                <div className="form-group">
                  <label>Sức Chứa (người) <span className="required">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="Nhập sức chứa"
                    min="1"
                    max="50"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Khu Vực <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={formData.tableAreaId}
                    onChange={(e) => setFormData({ ...formData, tableAreaId: parseInt(e.target.value) })}
                    required
                  >
                    {tableAreas.filter(a => a.isActive).map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  {tableAreas.length === 0 && (
                    <small className="form-hint" style={{ color: '#dc3545' }}>
                      ⚠️ Chưa có khu vực nào. Vui lòng tạo khu vực trước!
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Vị Trí</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ví dụ: Gần cửa sổ, Góc trái, Giữa phòng..."
                  />
                </div>

                <div className="form-group">
                  <label>Trạng Thái <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) as TableStatus })}
                    required
                  >
                    {TABLE_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Ghi Chú</label>
                  <textarea
                    className="form-input"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ghi chú về bàn (nếu có)..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Bàn đang hoạt động</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTable ? 'Cập Nhật' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form cho Khu Vực */}
      {showAreaModal && (
        <div className="modal-overlay" onClick={handleCloseAreaModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingArea ? 'Sửa Khu Vực' : 'Thêm Khu Vực Mới'}</h3>
              <button className="close-btn" onClick={handleCloseAreaModal}>✕</button>
            </div>
            <form onSubmit={handleSubmitArea}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên Khu Vực <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={areaFormData.name}
                    onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                    placeholder="Ví dụ: Tầng 1, Sân vườn, VIP 2..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    className="form-input"
                    value={areaFormData.description}
                    onChange={(e) => setAreaFormData({ ...areaFormData, description: e.target.value })}
                    placeholder="Mô tả về khu vực này (tùy chọn)..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Thứ Tự Hiển Thị</label>
                  <input
                    type="number"
                    className="form-input"
                    value={areaFormData.displayOrder}
                    onChange={(e) => setAreaFormData({ ...areaFormData, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="Số thứ tự (càng nhỏ càng hiển thị trước)"
                    min="0"
                  />
                  <small className="form-hint">
                    💡 Khu vực có thứ tự nhỏ hơn sẽ hiển thị trước
                  </small>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={areaFormData.isActive}
                      onChange={(e) => setAreaFormData({ ...areaFormData, isActive: e.target.checked })}
                    />
                    <span>Khu vực đang hoạt động</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseAreaModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingArea ? 'Cập Nhật' : 'Thêm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementPage;
