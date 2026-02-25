import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { getAvailableProducts } from '../api/productService';
import { getCategories } from '../api/categoryService';
import { createOrder, getOrdersByEmployee, getOrderById, getOrders, updateOrder } from '../api/orderService';
import { createCustomer } from '../api/customerService';
import { getActiveDiscounts, validateDiscountCode, calculateDiscountAmount, getDiscountById, type DiscountList, type Discount } from '../api/discountService';
import type { ProductList } from '../api/productService';
import type { CategoryList } from '../api/categoryService';
import type { CreateOrderDto, OrderList, Order, UpdateOrderDto } from '../api/orderService';
import './POSPage.css';

interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  imageUrl?: string;
  note?: string;
}

const POSPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<ProductList[]>([]);
  const [categories, setCategories] = useState<CategoryList[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'dinein' | 'takeaway'>('takeaway');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedTableGroupId, setSelectedTableGroupId] = useState<number | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
  const [selectedDiscountData, setSelectedDiscountData] = useState<Discount | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountList[]>([]);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'menu'>('menu');
  const [shiftOrders, setShiftOrders] = useState<OrderList[]>([]);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [shiftHistoryFetched, setShiftHistoryFetched] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewOrderLoading, setViewOrderLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [savedOrders, setSavedOrders] = useState<Array<{
    id: string;
    name: string;
    cart: OrderItem[];
    orderType: 'dinein' | 'takeaway';
    tableNumber: string;
    selectedTableId: number | null;
    discountAmount: number;
    selectedDiscount: string | null;
    createdAt: string;
    updatedAt?: string;
  }>>([]);
  const [showSavedOrdersModal, setShowSavedOrdersModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // Load saved orders from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('pos_saved_orders');
    if (saved) {
      try {
        setSavedOrders(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved orders:', error);
      }
    }
  }, []);

  // Save orders to localStorage whenever it changes
  useEffect(() => {
    if (savedOrders.length > 0) {
      localStorage.setItem('pos_saved_orders', JSON.stringify(savedOrders));
    } else {
      localStorage.removeItem('pos_saved_orders');
    }
  }, [savedOrders]);

  // Nhận bàn đã chọn từ TablesPage
  useEffect(() => {
    const selectedTable = location.state?.selectedTable;
    const selectedTableGroup = location.state?.selectedTableGroup;
    
    if (selectedTableGroup) {
      // Nếu là nhóm bàn
      setOrderType('dinein');
      setTableNumber(selectedTableGroup.name || '');
      setSelectedTableId(null);
      setSelectedTableGroupId(selectedTableGroup.id || null);
      
      // Tính năng cộng dồn món đã bị ẩn - không tự động load đơn cũ
      setEditingOrderId(null);
      setCart([]);
    } else if (selectedTable) {
      // Nếu là bàn đơn lẻ
      setOrderType('dinein');
      setTableNumber(selectedTable.number?.toString() || selectedTable.tableNumber || '');
      setSelectedTableId(selectedTable.id || null);
      setSelectedTableGroupId(null);
      
      // Tính năng cộng dồn món đã bị ẩn - không tự động load đơn cũ
      // Bàn trống hoặc có khách đều tạo đơn mới
      setEditingOrderId(null);
      setCart([]);
    } else if (location.state?.clearTable) {
      // Clear cart when manually resetting or empty table
      setCart([]);
      setEditingOrderId(null);
      setOrderType('takeaway');
      setSelectedTableId(null);
      setSelectedTableGroupId(null);
      setTableNumber('');
    } else {
      // Mặc định nếu không có state từ bàn, reset editing mode
      setEditingOrderId(null);
    }
  }, [location.state]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    try {
      setDiscountLoading(true);
      setDiscountError(null);
      const discounts = await getActiveDiscounts();
      setAvailableDiscounts(discounts);
    } catch (error: any) {
      console.error('Error loading discounts:', error);
      setDiscountError('Không thể tải danh sách giảm giá');
      // Vẫn tiếp tục nếu không load được, chỉ không hiển thị danh sách
      setAvailableDiscounts([]);
    } finally {
      setDiscountLoading(false);
    }
  };

  // Tự động tính lại discount khi selectedDiscountData hoặc cart thay đổi
  useEffect(() => {
    if (selectedDiscountData) {
        const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      const orderProductIds = cart.map(item => item.productId);
      // Lấy categoryIds từ products trong cart
      const orderCategoryIds = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        return product?.categoryId;
      }).filter(id => id !== undefined) as number[];

      const calculatedAmount = calculateDiscountAmount(
        selectedDiscountData,
        subTotal,
        orderProductIds,
        orderCategoryIds
      );
      setDiscountAmount(calculatedAmount);
      } else {
        setDiscountAmount(0);
      }
  }, [selectedDiscountData, cart, products]);

  const loadProducts = async () => {
    try {
      const data = await getAvailableProducts();
        setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const addToCart = (product: ProductList) => {
    // Tìm item cùng productId và không có ghi chú (note = undefined)
    const existingItemWithoutNote = cart.find(item => 
      item.productId === product.id && !item.note
    );
    
    if (existingItemWithoutNote) {
      // Kiểm tra nếu thêm vào sẽ vượt quá số lượng có thể làm
      const newQuantity = existingItemWithoutNote.quantity + 1;
      if (newQuantity > product.availableQuantityByIngredients) {
        window.alert(`❌ Không thể thêm!\n\nSản phẩm "${product.name}" chỉ còn đủ nguyên liệu để làm ${product.availableQuantityByIngredients} phần.`);
        return;
      }
      
      // Nếu đã có item không có ghi chú, tăng số lượng
      setCart(cart.map(item => 
        item === existingItemWithoutNote
          ? { ...item, quantity: item.quantity + 1, totalPrice: item.price * (item.quantity + 1) }
          : item
      ));
    } else {
      // Kiểm tra số lượng có thể làm trước khi thêm mới
      if (product.availableQuantityByIngredients < 1) {
        window.alert(`❌ Hết nguyên liệu!\n\nSản phẩm "${product.name}" không đủ nguyên liệu để làm.`);
        return;
      }
      
      // Chưa có hoặc chỉ có item có ghi chú -> tạo item mới không có ghi chú
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        totalPrice: product.price,
        imageUrl: product.imageUrl,
        note: undefined // Mới thêm chưa có ghi chú
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: number, note?: string) => {
    setCart(cart.filter(item => 
      !(item.productId === productId && 
        ((!item.note && !note) || (item.note === note)))
    ));
  };

  const updateQuantity = (productId: number, quantity: number, note?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, note);
      return;
    }
    setCart(cart.map(item => 
      item.productId === productId && 
      ((!item.note && !note) || (item.note === note))
        ? { ...item, quantity, totalPrice: item.price * quantity }
        : item
    ));
  };

  const clearCart = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả món ăn trong đơn hàng?')) {
      setCart([]);
    }
  };

  const openNoteModal = (itemId: number, itemIndex: number) => {
    const item = cart[itemIndex];
    if (item && item.productId === itemId) {
      setEditingItemIndex(itemIndex);
      setNoteInput(item.note || '');
      setShowNoteModal(true);
    }
  };

  const saveNote = () => {
    if (editingItemIndex !== null && editingItemIndex >= 0 && editingItemIndex < cart.length) {
      const noteText = noteInput.trim() || undefined;
      
      // Lấy item đang được chỉnh sửa
      const editingItem = cart[editingItemIndex];
      if (!editingItem) {
        setShowNoteModal(false);
        setEditingItemIndex(null);
        setNoteInput('');
        return;
      }

      // Kiểm tra xem có item nào khác (không phải item đang edit) cùng productId và note mới không
      const existingItemWithNote = cart.find((item, index) => 
        index !== editingItemIndex &&
        item.productId === editingItem.productId && 
        ((!item.note && !noteText) || (item.note === noteText))
      );

      if (existingItemWithNote) {
        // Nếu đã có item với cùng productId và note mới, gộp lại
        const newQuantity = editingItem.quantity + existingItemWithNote.quantity;
        setCart(cart
          .map((item, index) => {
            if (index === editingItemIndex) {
              // Xóa item đang edit
              return null;
            }
            if (item.productId === editingItem.productId && 
                ((!item.note && !noteText) || (item.note === noteText))) {
              // Gộp vào item đã có
              return { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity };
            }
            return item;
          })
          .filter((item): item is OrderItem => item !== null)
        );
      } else {
        // Kiểm tra xem note có thay đổi không
        if (editingItem.note !== noteText) {
          // Note thay đổi -> tạo item mới với note mới
          if (editingItem.quantity > 1) {
            // Nếu quantity > 1, tách ra: giảm quantity của item cũ, tạo item mới
            setCart(cart.map((item, index) => 
              index === editingItemIndex
                ? { ...item, quantity: item.quantity - 1, totalPrice: item.price * (item.quantity - 1) }
                : item
            ).concat({
              ...editingItem,
              quantity: 1,
              totalPrice: editingItem.price,
              note: noteText
            }));
          } else {
            // Quantity = 1, chỉ update note
            setCart(cart.map((item, index) =>
              index === editingItemIndex
                ? { ...item, note: noteText }
                : item
            ));
          }
        } else {
          // Note không thay đổi, chỉ update (giữ nguyên)
          // Không cần làm gì
        }
      }
    }
    setShowNoteModal(false);
    setEditingItemIndex(null);
    setNoteInput('');
  };

  const cancelNoteModal = () => {
    setShowNoteModal(false);
    setEditingItemIndex(null);
    setNoteInput('');
  };

  const handleDiscountSelect = async (discount: DiscountList) => {
    try {
      // Lấy chi tiết discount để có đầy đủ thông tin
      const discountDetail = await getDiscountById(discount.id);
      setSelectedDiscount(discount.name);
      setSelectedDiscountId(discount.id);
      setSelectedDiscountData(discountDetail);
      setVoucherCode(discount.code);
      
      // Tính toán discount amount sẽ được thực hiện trong useEffect
    } catch (error: any) {
      console.error('Error loading discount details:', error);
      alert('Không thể tải thông tin mã giảm giá');
    }
  };

  const handleVoucherCodeValidate = async () => {
    if (!voucherCode.trim()) {
      alert('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setDiscountLoading(true);
      setDiscountError(null);
      const validatedDiscount = await validateDiscountCode(voucherCode.trim().toUpperCase());
      
      // Kiểm tra đơn hàng tối thiểu
      const subTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
      if (validatedDiscount.minOrderAmount && subTotal < validatedDiscount.minOrderAmount) {
        setDiscountError(`Đơn hàng tối thiểu ${validatedDiscount.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã này`);
        return;
      }

      setSelectedDiscount(validatedDiscount.name);
      setSelectedDiscountId(validatedDiscount.id);
      setSelectedDiscountData(validatedDiscount);
      // Tính toán discount amount sẽ được thực hiện trong useEffect
    } catch (error: any) {
      console.error('Error validating discount code:', error);
      const errorMessage = error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      setDiscountError(errorMessage);
      setSelectedDiscount(null);
      setSelectedDiscountId(null);
      setSelectedDiscountData(null);
      setDiscountAmount(0);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleDiscountConfirm = () => {
    if (voucherCode.trim() && !selectedDiscountData) {
      // Nếu có nhập voucher code nhưng chưa validate, thử validate
      handleVoucherCodeValidate();
      return;
    }
    setShowDiscountModal(false);
    setDiscountError(null);
  };

  const handleDiscountCancel = () => {
    setShowDiscountModal(false);
    // Không reset selectedDiscount và discountAmount để giữ discount đã chọn
    setDiscountError(null);
  };

  const employeeId = user?.employeeId ?? null;

  const loadShiftHistory = async () => {
    if (!employeeId) {
      setShiftError('Tài khoản chưa được gán nhân viên nên không thể xem lịch sử ca.');
      setShiftOrders([]);
      setShiftHistoryFetched(true);
      return;
    }
    setShiftLoading(true);
    setShiftError(null);
    try {
      const data = await getOrdersByEmployee(employeeId);
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const todayOrders = data.filter((order) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
      setShiftOrders(todayOrders);
      setShiftHistoryFetched(true);
    } catch (error) {
      console.error('Error loading shift history:', error);
      setShiftError('Không thể tải lịch sử ca. Vui lòng thử lại.');
    } finally {
      setShiftLoading(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal && !shiftHistoryFetched) {
      loadShiftHistory();
    }
  }, [showHistoryModal, shiftHistoryFetched, employeeId]);

  const removeDiscount = () => {
    setSelectedDiscount(null);
    setSelectedDiscountId(null);
    setSelectedDiscountData(null);
    setDiscountAmount(0);
    setVoucherCode('');
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Bạn có chắc muốn đăng xuất?');
    if (confirmLogout) {
      logout();
      navigate('/login');
    }
  };

  const handleViewOrderDetail = async (orderId: number) => {
    try {
      setViewOrderLoading(true);
      const order = await getOrderById(orderId);
      setViewingOrder(order);
      setShowOrderDetailModal(true);
    } catch (error) {
      console.error('Error loading order details:', error);
      alert('Không thể tải chi tiết đơn hàng');
    } finally {
      setViewOrderLoading(false);
    }
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setViewingOrder(null);
  };

  const getStatusBadgeClass = (statusName: string) => {
    const status = statusName.toLowerCase();
    if (status.includes('xác nhận') || status.includes('confirmed')) return 'badge-success';
    if (status.includes('chờ') || status.includes('pending')) return 'badge-warning';
    if (status.includes('chuẩn bị') || status.includes('preparing')) return 'badge-info';
    if (status.includes('giao') || status.includes('delivered')) return 'badge-success';
    if (status.includes('hủy') || status.includes('cancelled')) return 'badge-danger';
    return 'badge-secondary';
  };

  const createWalkInCustomer = async (): Promise<number> => {
    const walkInCustomer = await createCustomer({
      firstName: 'Khách',
      lastName: 'Vãng Lai',
      email: `walkin_${Date.now()}@temp.com`,
      phoneNumber: `TEMP_${Date.now()}`,
      dateOfBirth: '1990-01-01'
    });
    return walkInCustomer.id;
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    // Nếu là "Mang Đi" và bấm "THANH TOÁN", không lưu vào database (sẽ lưu ở PaymentPage)
    if (orderType === 'takeaway') {
      // Tính toán tổng tiền từ cart (không có VAT, VAT sẽ được tính ở PaymentPage nếu tích checkbox)
      const subTotal = getSubTotal();
      const deliveryFee = getDeliveryFee();
      const totalAmount = subTotal + deliveryFee; // Không tính VAT ở đây
      
      // Generate temporary order number
      const tempOrderNumber = `TAKEAWAY-${Date.now()}`;
      
      console.log('Takeaway order - not saving to database, navigating to payment page...');
      navigate('/payment', {
        state: {
          order: {
            totalAmount: totalAmount - discountAmount,
            subTotal: subTotal,
            taxAmount: 0, // Không tính VAT ở POSPage
            deliveryFee: deliveryFee,
            discountAmount: discountAmount,
            discountId: selectedDiscountId ?? undefined,
            orderNumber: tempOrderNumber,
            type: orderType,
            tableNumber: undefined,
            isOffline: true, // Flag để biết đây là chưa lưu vào database
            cartItems: cart.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              price: item.price,
              totalPrice: item.totalPrice,
              note: item.note
            })) // Lưu cart items để tạo order ở PaymentPage
          }
        }
      });
      return;
    }

    // Nếu là "Tại Bàn", lưu vào database như bình thường
    try {
      console.log('Starting order process (Create or Update)...');
      
      let orderId = editingOrderId;
      let orderResponse: any = null;

      if (editingOrderId) {
        // Cập nhật đơn hàng cũ (Cộng dồn món)
        console.log('Updating existing order:', editingOrderId);
        const updateData: UpdateOrderDto = {
          status: 1, // Giữ nguyên trạng thái Chờ xử lý/Đang hoạt động
          orderItems: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            specialInstructions: item.note || undefined
          })),
          discountId: selectedDiscountId ?? undefined
        };
        await updateOrder(editingOrderId, updateData);
        orderResponse = await getOrderById(editingOrderId);
        console.log('Order updated successfully:', orderResponse);
      } else {
        // Tạo đơn hàng mới
        const customerId = await createWalkInCustomer();
        console.log('Customer created:', customerId);
        
        const orderData: CreateOrderDto = {
          customerId: customerId,
          employeeId: employeeId ?? undefined,
          type: orderType === 'dinein' ? 1 : 2, // 1 = DineIn, 2 = Takeaway
          notes: orderType === 'dinein' && tableNumber 
            ? `Bàn số: ${tableNumber}` 
            : undefined,
          orderItems: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            specialInstructions: item.note || undefined
          })),
          includeVAT: false,
          tableId: orderType === 'dinein' && selectedTableId ? selectedTableId : undefined,
          tableGroupId: orderType === 'dinein' && selectedTableGroupId ? selectedTableGroupId : undefined,
          discountId: selectedDiscountId ?? undefined
        };
        orderResponse = await createOrder(orderData);
        orderId = orderResponse.id;
        console.log('Order created successfully:', orderResponse);
      }
      
      // Navigate to payment page với order data
      console.log('Navigating to payment page...');
      navigate('/payment', {
        state: {
          order: {
            id: orderId,
            totalAmount: orderResponse.totalAmount - (orderResponse.taxAmount || 0) - discountAmount,
            subTotal: orderResponse.subTotal,
            taxAmount: 0,
            deliveryFee: orderResponse.deliveryFee || 0,
            discountAmount: discountAmount,
            discountId: selectedDiscountId ?? undefined,
            orderNumber: orderResponse.orderNumber,
            type: orderType,
            tableNumber: orderType === 'dinein' && tableNumber ? tableNumber : undefined,
            tableId: orderType === 'dinein' && selectedTableId ? selectedTableId : undefined,
            isOffline: false
          }
        }
      });
    } catch (error: any) {
      console.error('Error placing order:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Đặt hàng thất bại. Vui lòng thử lại!';
      
      // Nếu là Network Error, hỏi có muốn tiếp tục offline mode không
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
        const useOfflineMode = window.confirm(
          'Không thể kết nối đến server.\n\n' +
          'Có thể:\n' +
          '1. Backend chưa chạy (http://localhost:5268)\n' +
          '2. Lỗi kết nối mạng\n\n' +
          'Bạn có muốn tiếp tục với chế độ offline (không lưu vào database)?'
        );
        
        if (useOfflineMode) {
          // Tính toán tổng tiền từ cart (giống backend)
        const subTotal = getSubTotal();
        const deliveryFee = getDeliveryFee();
        const totalAmount = subTotal + deliveryFee; // Không tính VAT ở đây
        
        // Generate temporary order number
        const tempOrderNumber = `TEMP-${Date.now()}`;
        
        console.log('Using offline mode, navigating to payment page...');
        navigate('/payment', {
          state: {
            order: {
              totalAmount: totalAmount - discountAmount,
              subTotal: subTotal,
              taxAmount: 0, // Không tính VAT ở POSPage
              deliveryFee: deliveryFee,
              discountAmount: discountAmount,
              discountId: selectedDiscountId ?? undefined,
              orderNumber: tempOrderNumber,
              type: orderType,
              tableNumber: orderType === 'dinein' && tableNumber ? tableNumber : undefined,
              isOffline: true, // Flag để biết đây là offline mode
              cartItems: cart.map(item => ({
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.totalPrice,
                note: item.note
              })) // Lưu cart items để tạo order ở PaymentPage
            }
          }
        });
          return;
        }
      }
      
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const getSubTotal = () => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const getDeliveryFee = () => {
    // Không còn option "Giao Hàng" nữa, nên luôn trả về 0
    return 0;
  };

  const getDiscount = () => {
    return discountAmount;
  };

  const getTotal = () => {
    // Không tính VAT ở POSPage, chỉ tính subtotal + delivery fee - discount
    const subTotal = getSubTotal();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscount();
    return Math.max(0, subTotal + deliveryFee - discount);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleSaveOrder = (name: string) => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống! Không thể lưu đơn.');
      return;
    }

    // Kiểm tra xem có đơn cùng tên hoặc cùng bàn không
    const existingOrderIndex = savedOrders.findIndex(
      order => order.name === name || 
      (orderType === 'dinein' && order.selectedTableId === selectedTableId && order.selectedTableId !== null)
    );

    const savedOrderData = {
      id: existingOrderIndex >= 0 ? savedOrders[existingOrderIndex].id : `saved_${Date.now()}`,
      name: name,
      cart: [...cart],
      orderType: orderType,
      tableNumber: tableNumber,
      selectedTableId: selectedTableId,
      discountAmount: discountAmount,
      selectedDiscount: selectedDiscount,
      createdAt: existingOrderIndex >= 0 ? savedOrders[existingOrderIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingOrderIndex >= 0) {
      // Cập nhật đơn đã tồn tại
      const updatedOrders = [...savedOrders];
      updatedOrders[existingOrderIndex] = savedOrderData;
      setSavedOrders(updatedOrders);
      alert(`Đã cập nhật đơn "${name}" thành công!`);
    } else {
      // Tạo đơn mới
      setSavedOrders([...savedOrders, savedOrderData]);
      alert(`Đã lưu đơn "${name}" thành công!`);
    }

    // Reset giỏ hàng sau khi lưu để nhân viên dễ làm việc
    setCart([]);
    setDiscountAmount(0);
    setSelectedDiscount(null);
    setTableNumber('');
    setSelectedTableId(null);
    // Giữ nguyên orderType để nhân viên tiếp tục với loại đơn tương tự
  };

  const handleLoadSavedOrder = (savedOrder: typeof savedOrders[0]) => {
    if (cart.length > 0) {
      const confirmLoad = window.confirm(
        `Bạn đang có ${cart.length} món trong giỏ hàng.\n\n` +
        `Bạn có muốn:\n` +
        `1. Thay thế giỏ hàng hiện tại bằng đơn "${savedOrder.name}"?\n` +
        `2. Hủy để giữ nguyên giỏ hàng hiện tại?`
      );
      
      if (!confirmLoad) return;
    }

    setCart(savedOrder.cart);
    setOrderType(savedOrder.orderType);
    setTableNumber(savedOrder.tableNumber);
    setSelectedTableId(savedOrder.selectedTableId);
    setDiscountAmount(savedOrder.discountAmount);
    setSelectedDiscount(savedOrder.selectedDiscount);
    
    // Tự động xóa đơn khỏi danh sách đã lưu khi mở
    setSavedOrders(savedOrders.filter(order => order.id !== savedOrder.id));
    setShowSavedOrdersModal(false);
    alert(`Đã tải đơn "${savedOrder.name}"! Đơn đã được xóa khỏi danh sách đã lưu.`);
  };

  const handleDeleteSavedOrder = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa đơn "${name}"?`)) {
      setSavedOrders(savedOrders.filter(order => order.id !== id));
      alert('Đã xóa đơn đã lưu!');
    }
  };

  const filteredProducts = products.filter(product => {
    // Filter by search term
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by selected category
    const matchesCategory = selectedCategory === null || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pos-page">
      {/* Top Toolbar */}
      <div className="pos-toolbar">
        <div className="toolbar-left">
          <button 
            className="toolbar-icon-btn" 
            onClick={() => setShowSidebar(true)}
          >
            ☰
          </button>
          <span className="toolbar-title">Quản Lý Đơn Hàng</span>
        </div>
        <div className="toolbar-right">
          {user?.role === UserRole.Admin && (
            <button className="toolbar-btn back-to-menu-btn" onClick={() => navigate('/')}>
              ⬅️ Menu
            </button>
          )}
          <button
            className="toolbar-btn"
            onClick={() => {
              setShowHistoryModal(true);
              if (!shiftHistoryFetched) {
                loadShiftHistory();
              }
            }}
          >
            Lịch sử mua hàng
          </button>
          <button className="toolbar-btn offline-btn">
            <span>OFFLINE</span>
            {cart.length > 0 && <span className="badge-count">{cart.length}</span>}
          </button>
          <button className="toolbar-btn" onClick={() => navigate('/tables')}>Bàn</button>
          <button className="toolbar-btn" onClick={() => setShowDiscountModal(true)}>🎁 Giảm giá</button>
          <button className="toolbar-btn" onClick={clearCart}>🗑️ Xóa</button>
        </div>
      </div>

      {/* Sidebar Menu */}
      {showSidebar && (
        <>
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)}></div>
          <div className="sidebar-menu">
            <div className="sidebar-tabs">
              <button
                className={sidebarView === 'menu' ? 'active' : ''}
                onClick={() => setSidebarView('menu')}
              >
                Menu thao tác
              </button>
            </div>
            {/* Header */}
            <div className="sidebar-header">
              <div className="sidebar-header-content">
                <div className="sidebar-logo">Aq</div>
                <div className="sidebar-online-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isOnline}
                      onChange={(e) => setIsOnline(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="sidebar-online-text">Trực tuyến</span>
                </div>
              </div>
            </div>

            <div className="sidebar-menu-items">
              <button 
                className="sidebar-menu-item active"
                onClick={() => {
                  setShowSidebar(false);
                  navigate('/shift-report');
                }}
              >
                Quản lí ca
              </button>
              <button 
                className="sidebar-menu-item"
                onClick={() => {
                  setShowSidebar(false);
                  handleLogout();
                }}
              >
                🚪 Đăng xuất
              </button>
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              <span className="sidebar-address">17t10 Nguyễn Thị Định, Hà Nội</span>
              <span className="sidebar-version">v 2.2</span>
            </div>
          </div>
        </>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="modal-overlay" onClick={handleDiscountCancel}>
          <div className="discount-modal" onClick={(e) => e.stopPropagation()}>
            <div className="discount-modal-header">
              <h3>Danh sách giảm giá có thể áp dụng</h3>
            </div>
            <div className="discount-modal-body">
              <div className="voucher-input-section">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Nhập mã voucher"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleVoucherCodeValidate();
                      }
                    }}
                  className="voucher-input"
                    disabled={discountLoading}
                />
                  <button
                    onClick={handleVoucherCodeValidate}
                    disabled={discountLoading || !voucherCode.trim()}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#ff6b35',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: discountLoading || !voucherCode.trim() ? 'not-allowed' : 'pointer',
                      opacity: discountLoading || !voucherCode.trim() ? 0.5 : 1
                    }}
                  >
                    {discountLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
                {discountError && (
                  <div style={{ marginTop: '0.5rem', color: '#d32f2f', fontSize: '0.875rem' }}>
                    {discountError}
                  </div>
                )}
              </div>
              {availableDiscounts.length > 0 && (
                <>
                  <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 600, color: '#666' }}>
                    Hoặc chọn từ danh sách:
              </div>
              <div className="discount-grid">
                    {availableDiscounts.map((discount) => (
                  <button
                        key={discount.id}
                        className={`discount-item ${selectedDiscountId === discount.id ? 'selected' : ''}`}
                    onClick={() => handleDiscountSelect(discount)}
                        disabled={!discount.isValid}
                        title={!discount.isValid ? 'Mã giảm giá không còn hiệu lực' : discount.name}
                      >
                        <div style={{ fontWeight: 600 }}>{discount.name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                          {discount.type === 1 
                            ? `Giảm ${discount.discountValue}%`
                            : `Giảm ${discount.discountValue.toLocaleString('vi-VN')}đ`
                          }
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                          {discount.code}
                        </div>
                  </button>
                ))}
              </div>
                </>
              )}
              {!discountLoading && availableDiscounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Hiện không có mã giảm giá nào đang hoạt động
                </div>
              )}
              {discountLoading && availableDiscounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Đang tải danh sách giảm giá...
                </div>
              )}
            </div>
            <div className="discount-modal-footer">
              <button className="discount-btn-cancel" onClick={handleDiscountCancel}>
                Thoát
              </button>
              <button className="discount-btn-confirm" onClick={handleDiscountConfirm}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="discount-modal history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="discount-modal-header">
              <h3>Lịch sử mua hàng</h3>
            </div>
            <div className="discount-modal-body history-modal-body">
              <div className="shift-history-header">
                <div>
                  <h4>Lịch sử ca hôm nay</h4>
                  <p>{new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                <button
                  className="refresh-btn"
                  onClick={loadShiftHistory}
                  disabled={shiftLoading}
                >
                  {shiftLoading ? 'Đang tải...' : '↻'}
                </button>
              </div>
              {shiftError && <div className="shift-error">{shiftError}</div>}
              {!shiftLoading && shiftOrders.length === 0 && !shiftError && (
                <div className="shift-empty">
                  Chưa có giao dịch nào trong ca.
                </div>
              )}
              {shiftLoading && (
                <div className="shift-loading">
                  Đang tải lịch sử ca...
                </div>
              )}
              {!shiftLoading && shiftOrders.length > 0 && (
                <>
                  <div className="shift-summary">
                    <div>
                      <span>Đơn đã tạo</span>
                      <strong>{shiftOrders.length}</strong>
                    </div>
                    <div>
                      <span>Doanh thu</span>
                      <strong>
                        {formatPrice(
                          shiftOrders.reduce((sum, order) => sum + order.totalAmount, 0)
                        )}
                      </strong>
                    </div>
                  </div>
                  <div className="shift-history-list">
                    {shiftOrders.map((order) => (
                      <div key={order.id} className="shift-order-card">
                        <div className="order-card-header">
                          <span className="order-number">#{order.orderNumber}</span>
                          <span className={`order-status status-${(order.statusName || '').toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.statusName}
                          </span>
                        </div>
                        <div className="order-card-body">
                          <div>
                            <span className="order-label">Thời gian</span>
                            <strong>
                              {new Date(order.orderDate).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </div>
                          <div>
                            <span className="order-label">Thành tiền</span>
                            <strong>{formatPrice(order.totalAmount)}</strong>
                          </div>
                        </div>
                        <div className="order-card-footer">
                          <button
                            className="btn-view-detail"
                            onClick={() => handleViewOrderDetail(order.id)}
                            disabled={viewOrderLoading}
                          >
                            {viewOrderLoading ? 'Đang tải...' : '👁️ Xem chi tiết'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="discount-modal-footer">
              <button className="discount-btn-cancel" onClick={() => setShowHistoryModal(false)}>
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={cancelNoteModal}>
          <div className="note-modal" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <h3>Ghi chú món ăn</h3>
              <button className="close-btn" onClick={cancelNoteModal}>✕</button>
            </div>
            <div className="note-modal-body">
              <textarea
                placeholder="Nhập ghi chú cho món ăn này..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
            <div className="note-modal-footer">
              <button className="btn-cancel" onClick={cancelNoteModal}>Hủy</button>
              <button className="btn-save" onClick={saveNote}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      <div className="pos-content">
        {/* Main Menu Area */}
        <div className="menu-area">
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Nhập tên món ăn cần tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <button 
              className="quick-order-btn" 
              onClick={() => setShowSavedOrdersModal(true)}
              title="Xem đơn đã lưu"
            >
              💾 Đơn Đã Lưu ({savedOrders.length})
            </button>
            {cart.length > 0 && (
              <button 
                className="save-order-btn" 
                onClick={() => {
                  const name = prompt('Nhập tên đơn hàng (ví dụ: Bàn 5, Khách A...):');
                  if (name && name.trim()) {
                    handleSaveOrder(name.trim());
                  }
                }}
                title="Lưu đơn hàng hiện tại"
              >
                💾 Lưu đơn
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                {product.imageUrl && (
                  <div className="product-image">
                    <img src={product.imageUrl} alt={product.name} />
                    {product.availableQuantityByIngredients <= 5 && (
                      <div className="low-stock-badge">
                        ⚠️ Còn làm được {product.availableQuantityByIngredients}
                      </div>
                    )}
                  </div>
                )}
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">{formatPrice(product.price)}</div>
                  {product.availableQuantityByIngredients <= 5 && (
                    <div className="stock-warning">
                      Chỉ còn làm được {product.availableQuantityByIngredients} phần
                    </div>
                  )}
                </div>
                <button 
                  className="add-btn"
                  onClick={() => addToCart(product)}
                >
                  +
                </button>
              </div>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button 
              className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Tất Cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Order Sidebar */}
        <div className="order-sidebar">
          {/* Order Type Tabs */}
          <div className="order-type-tabs">
            <button 
              className={`order-type-tab ${orderType === 'takeaway' ? 'active' : ''}`}
              onClick={() => setOrderType('takeaway')}
            >
              🥡 Mang Đi
            </button>
            <button 
              className={`order-type-tab ${orderType === 'dinein' ? 'active' : ''}`}
              onClick={() => setOrderType('dinein')}
            >
              🍽️ Tại Bàn
            </button>
          </div>

          {/* Table Number (for dinein) */}
          {orderType === 'dinein' && (
            <div className="table-input-section">
              <label>Số Bàn</label>
              <input
                type="text"
                placeholder="Nhập số bàn"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="table-input"
              />
            </div>
          )}

          {/* Cart Items */}
          <div className="cart-items">
            <h3 className="cart-title">Chi Tiết Đơn Hàng</h3>
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Chưa có món nào trong đơn hàng</p>
              </div>
            ) : (
              <div className="cart-list">
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${item.note || 'no-note'}-${index}`} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.productName}</h4>
                      {item.note && (
                        <div className="cart-item-note">
                          📝 <em>{item.note}</em>
                        </div>
                      )}
                      <p>{formatPrice(item.totalPrice)}</p>
                    </div>
                    <div className="cart-item-controls">
                      <button 
                        className="qty-btn" 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.note)}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.note)}
                      >
                        +
                      </button>
                      <button 
                        className="note-btn"
                        onClick={() => openNoteModal(item.productId, index)}
                        title="Thêm ghi chú"
                      >
                        📝
                      </button>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.productId, item.note)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Tổng tiền:</span>
              <span className="summary-value">{formatPrice(getSubTotal())}</span>
            </div>
            <div className="summary-row">
              <span>
                Giảm giá:
                {selectedDiscount && (
                  <button 
                    className="remove-discount-btn"
                    onClick={removeDiscount}
                    title="Xóa giảm giá"
                  >
                    ✕
                  </button>
                )}
              </span>
              <span className="summary-value">{formatPrice(getDiscount())}</span>
            </div>
            {selectedDiscount && (
              <div className="summary-row discount-info">
                <span className="discount-name">{selectedDiscount}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Thành tiền:</span>
              <span className="summary-value">{formatPrice(getTotal())}</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button 
            className="place-order-btn"
            disabled={cart.length === 0}
            onClick={handlePlaceOrder}
          >
            {orderType === 'takeaway' ? '💳 THANH TOÁN' : '💳 ĐẶT MÓN'}
          </button>
        </div>
      </div>

      {/* Saved Orders Modal */}
      {showSavedOrdersModal && (
        <div className="modal-overlay" onClick={() => setShowSavedOrdersModal(false)}>
          <div className="discount-modal saved-orders-modal" onClick={(e) => e.stopPropagation()}>
            <div className="discount-modal-header">
              <h3>💾 Đơn Đã Lưu</h3>
              <button className="modal-close" onClick={() => setShowSavedOrdersModal(false)}>✕</button>
            </div>
            <div className="discount-modal-body">
              {savedOrders.length === 0 ? (
                <div className="empty-saved-orders">
                  <p>Chưa có đơn nào được lưu.</p>
                  <p className="modal-hint">Lưu đơn hàng để có thể tiếp tục sau này.</p>
                </div>
              ) : (
                <div className="saved-orders-list">
                  {savedOrders.map((savedOrder) => {
                    const itemCount = savedOrder.cart.reduce((sum, item) => sum + item.quantity, 0);
                    const total = savedOrder.cart.reduce((sum, item) => sum + item.totalPrice, 0) - savedOrder.discountAmount;
                    const date = new Date(savedOrder.createdAt);
                    
                    return (
                      <div key={savedOrder.id} className="saved-order-card">
                        <div className="saved-order-header">
                          <div className="saved-order-info">
                            <h4>{savedOrder.name}</h4>
                            <div className="saved-order-meta">
                              <span>{savedOrder.orderType === 'dinein' ? '🍽️ Tại bàn' : '🥡 Mang đi'}</span>
                              {savedOrder.tableNumber && <span>Bàn: {savedOrder.tableNumber}</span>}
                              <span>{date.toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                          <div className="saved-order-actions">
                            <button
                              className="btn-load-order"
                              onClick={() => handleLoadSavedOrder(savedOrder)}
                            >
                              📂 Mở
                            </button>
                            <button
                              className="btn-delete-order"
                              onClick={() => handleDeleteSavedOrder(savedOrder.id, savedOrder.name)}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </div>
                        <div className="saved-order-details">
                          <div className="saved-order-items">
                            {savedOrder.cart.slice(0, 3).map((item, index) => (
                              <span key={index} className="saved-item-tag">
                                {item.productName} x{item.quantity}
                              </span>
                            ))}
                            {savedOrder.cart.length > 3 && (
                              <span className="saved-item-tag more">+{savedOrder.cart.length - 3} món khác</span>
                            )}
                          </div>
                          <div className="saved-order-summary">
                            <span>{itemCount} món</span>
                            <strong>{formatPrice(total)}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="discount-modal-footer">
              <button className="discount-btn-cancel" onClick={() => setShowSavedOrdersModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetailModal && viewingOrder && (
        <div className="modal-overlay" onClick={handleCloseOrderDetailModal}>
          <div className="modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👁️ Chi Tiết Đơn Hàng</h3>
              <button className="close-btn" onClick={handleCloseOrderDetailModal}>✕</button>
            </div>
            <div className="modal-body order-detail-body">
              <div className="order-overview">
                <div className="overview-card">
                  <span>Mã đơn</span>
                  <strong>{viewingOrder.orderNumber}</strong>
                </div>
                <div className="overview-card">
                  <span>Ngày đặt</span>
                  <strong>
                    {new Date(viewingOrder.orderDate).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </strong>
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
                    <span>Tổng tiền</span>
                    <strong>{formatPrice(viewingOrder.totalAmount)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Tạm tính</span>
                    <strong>{formatPrice(viewingOrder.subTotal)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Thuế</span>
                    <strong>{formatPrice(viewingOrder.taxAmount)}</strong>
                  </div>
                  {viewingOrder.deliveryFee > 0 && (
                    <div className="detail-row">
                      <span>Phí giao</span>
                      <strong>{formatPrice(viewingOrder.deliveryFee)}</strong>
                    </div>
                  )}
                  <div className="detail-row">
                    <span>Đã thanh toán</span>
                    <strong>{formatPrice(viewingOrder.paidAmount)}</strong>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>👥 Nhân viên</h4>
                  <div className="detail-row">
                    <span>Thu ngân</span>
                    <strong>{viewingOrder.employeeName || 'Admin'}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Ghi chú</span>
                    <strong>{viewingOrder.notes || 'Không có ghi chú'}</strong>
                  </div>
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
              <button type="button" className="btn btn-secondary" onClick={handleCloseOrderDetailModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;

