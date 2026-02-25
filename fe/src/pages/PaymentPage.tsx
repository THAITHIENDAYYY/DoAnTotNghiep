import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { getCustomers, createCustomer, searchCustomers } from '../api/customerService';
import { createOrder, updateOrder, getOrderById } from '../api/orderService';
import { createPayment, confirmPayment, PaymentMethod } from '../api/paymentService';
import { updateTableStatus, TableStatus } from '../api/tableService';
import { getActiveDiscounts, validateDiscountCode, getDiscountById, type DiscountList, type Discount } from '../api/discountService';
import { getAvailableProducts } from '../api/productService';
import type { CustomerList } from '../api/customerService';
import type { CreateOrderDto } from '../api/orderService';
import type { ProductList } from '../api/productService';
import './PaymentPage.css';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  note?: string;
}

interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  createdAt: string;
  cashier?: string;
  subTotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  amountReceived: number;
  change: number;
  items: InvoiceItem[];
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderFromState = location.state?.order;

  const [fullOrder, setFullOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Tiền mặt');
  const [amount, setAmount] = useState<number>(0);
  const [customers, setCustomers] = useState<CustomerList[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [includeVAT, setIncludeVAT] = useState<boolean>(false);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountList[]>([]);
  const [allDiscounts, setAllDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<ProductList[]>([]);
  const [suggestedDiscount, setSuggestedDiscount] = useState<Discount | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load full order from backend if orderId exists
  useEffect(() => {
    console.log('🌟 PaymentPage mounted');
    console.log('orderFromState:', orderFromState);
    console.log('orderFromState.id:', orderFromState?.id);
    console.log('orderFromState.discountId:', orderFromState?.discountId);
    console.log('orderFromState.discountAmount:', orderFromState?.discountAmount);
    
    const loadFullOrder = async () => {
      if (orderFromState?.id) {
        console.log('📥 Loading full order from backend...');
        try {
          const loadedOrder = await getOrderById(orderFromState.id);
          console.log('✅ Full order loaded:', loadedOrder);
          console.log('Loaded order discountId:', loadedOrder.discountId);
          console.log('Loaded order discountAmount:', loadedOrder.discountAmount);
          
          setFullOrder(loadedOrder);
          
          // Update amount from full order
          if (loadedOrder.totalAmount) {
            setAmount(loadedOrder.totalAmount);
          }
          
          // Update discount info from full order
          if (loadedOrder.discountAmount) {
            setDiscountAmount(loadedOrder.discountAmount);
            console.log('✅ Set discountAmount from loaded order:', loadedOrder.discountAmount);
          }
          if (loadedOrder.discountId) {
            setSelectedDiscountId(loadedOrder.discountId);
            console.log('✅ Set selectedDiscountId from loaded order:', loadedOrder.discountId);
          }
        } catch (error) {
          console.error('Error loading full order:', error);
          // Fallback to state order
          setFullOrder(orderFromState);
          if (orderFromState?.totalAmount) {
            setAmount(orderFromState.totalAmount);
          }
          if (orderFromState?.discountAmount) {
            setDiscountAmount(orderFromState.discountAmount);
          }
          if (orderFromState?.discountId) {
            setSelectedDiscountId(orderFromState.discountId);
          console.log('✅ Set selectedDiscountId from orderFromState (with id):', orderFromState.discountId);
          }
        }
    } else {
        // No orderId, use state order
        setFullOrder(orderFromState);
        if (orderFromState?.totalAmount) {
          setAmount(orderFromState.totalAmount);
        }
        if (orderFromState?.discountAmount) {
          setDiscountAmount(orderFromState.discountAmount);
        }
        if (orderFromState?.discountId) {
          setSelectedDiscountId(orderFromState.discountId);
          console.log('✅ Set selectedDiscountId from orderFromState (no id):', orderFromState.discountId);
        } else {
          console.log('⚠️ orderFromState.discountId is missing:', orderFromState);
        }
      }
    };
    
    loadFullOrder();
    loadCustomers();
    loadProducts();
    loadAllDiscounts();
  }, [orderFromState?.id]);

  // Use fullOrder instead of order
  const order = fullOrder || orderFromState;

  // Tự động load discounts khi mở modal
  useEffect(() => {
    if (showDiscountModal) {
      loadDiscounts();
    }
  }, [showDiscountModal]);

  // Tự động kiểm tra và đề xuất discount khi order, customer hoặc discounts thay đổi
  useEffect(() => {
    checkApplicableDiscounts();
  }, [order, selectedCustomerId, customers, allDiscounts, products]);

  const loadDiscounts = async () => {
    try {
      setDiscountLoading(true);
      setDiscountError(null);
      const discounts = await getActiveDiscounts();
      setAvailableDiscounts(discounts);
    } catch (error: any) {
      console.error('Error loading discounts:', error);
      setDiscountError('Không thể tải danh sách giảm giá');
      setAvailableDiscounts([]);
    } finally {
      setDiscountLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getAvailableProducts();
      setProducts(data);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const loadAllDiscounts = async () => {
    try {
      const discountList = await getActiveDiscounts();
      // Load full discount details để có thông tin về điều kiện
      const discountDetails = await Promise.all(
        discountList.map(d => getDiscountById(d.id).catch(() => null))
      );
      setAllDiscounts(discountDetails.filter((d): d is Discount => d !== null));
    } catch (err) {
      console.error('Error loading all discounts:', err);
      setAllDiscounts([]);
    }
  };

  const handleCustomerPhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustomerPhone(phone);
    
    // Tìm khách hàng theo SĐT
    if (phone) {
      try {
        // Tìm trong danh sách đã load
        const foundCustomer = customers.find(
          c => c.phoneNumber && c.phoneNumber.includes(phone)
        );
        
        if (foundCustomer) {
          setSelectedCustomerId(foundCustomer.id);
        } else {
          // Tìm kiếm trên server
          try {
            const searchResults = await searchCustomers(phone);
            const foundBySearch = searchResults.find(
              c => c.phoneNumber && c.phoneNumber.includes(phone)
            );
            
            if (foundBySearch) {
              setSelectedCustomerId(foundBySearch.id);
            } else {
              setSelectedCustomerId(null);
            }
          } catch (error) {
            console.error('Error searching customer:', error);
            setSelectedCustomerId(null);
          }
        }
      } catch (error) {
        console.error('Error finding customer:', error);
        setSelectedCustomerId(null);
      }
    } else {
      setSelectedCustomerId(null);
    }
  };

  const phoneSuggestions = customerPhone
    ? customers
        .filter(
          (c) =>
            (c.phoneNumber && c.phoneNumber.includes(customerPhone)) ||
            c.fullName.toLowerCase().includes(customerPhone.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSelectCustomer = (customer: CustomerList) => {
    setCustomerName(customer.fullName);
    if (customer.phoneNumber) {
      setCustomerPhone(customer.phoneNumber);
    }
    setSelectedCustomerId(customer.id);
  };

  const getTierBenefitText = (tierName?: string | null) => {
    if (!tierName) {
      return 'Chưa có hạng - tích điểm để nhận ưu đãi.';
    }

    const lower = tierName.toLowerCase();
    if (lower.includes('kim cương')) return 'Ưu đãi: -15% + tặng đồ uống.';
    if (lower.includes('vàng')) return 'Ưu đãi: -10% cho đơn tiếp theo.';
    if (lower.includes('bạc')) return 'Ưu đãi: -5% cho đơn tiếp theo.';
    if (lower.includes('đồng')) return 'Ưu đãi thành viên cơ bản.';
    return 'Ưu đãi thành viên đang áp dụng.';
  };

  const quickAmounts = [500000, 200000, 100000, 50000, 20000, 10000];

  const handleQuickAmount = (value: number) => {
    setAmount(value);
  };

  const handleNumberClick = (digit: string) => {
    setAmount(prev => {
      // Append digit to current amount (as string)
      const newAmount = parseInt(prev.toString() + digit);
      return newAmount;
    });
  };

  const handleDelete = () => {
    setAmount(prev => {
      const amountStr = prev.toString();
      return parseInt(amountStr.slice(0, -1)) || 0;
    });
  };

  const handleTripleZero = () => {
    setAmount(prev => {
      // Nhân số hiện tại với 1000 để thêm 3 số 0
      return prev * 1000;
    });
  };


  const getTaxAmount = () => {
    if (!includeVAT) return 0; // Không tính VAT nếu chưa tích checkbox
    const subTotal = order?.subTotal || 0;
    return subTotal * 0.1; // 10% VAT
  };

  const getTotal = () => {
    // Tính lại total từ subtotal + VAT (nếu tích checkbox) + delivery fee - discount
    const subTotal = order?.subTotal || 0;
    const taxAmount = getTaxAmount(); // Tính VAT nếu tích checkbox
    const deliveryFee = order?.deliveryFee || 0;
    const discount = discountAmount || 0;
    return Math.max(0, subTotal + taxAmount + deliveryFee - discount);
  };

  const checkApplicableDiscounts = async () => {
    // Chỉ check nếu đã có order và đã load xong data
    if (!order || allDiscounts.length === 0 || products.length === 0) {
      setSuggestedDiscount(null);
      return;
    }

    // Lấy order items
    const orderItems = order.orderItems || order.cartItems || [];
    if (orderItems.length === 0) {
      setSuggestedDiscount(null);
      return;
    }

    // Lấy productIds và categoryIds từ order items
    const orderProductIds = orderItems.map((item: any) => item.productId || item.id).filter((id: any) => id);
    const orderCategoryIds = orderProductIds
      .map((productId: number) => {
        const product = products.find(p => p.id === productId);
        return product?.categoryId;
      })
      .filter((id: any) => id) as number[];

    // Lấy customer tier
    const selectedCustomer = selectedCustomerId 
      ? customers.find(c => c.id === selectedCustomerId)
      : null;
    const customerTierId = selectedCustomer?.tierId;

    // Lấy employee role
    const employeeRole = user?.role;

      const subTotal = order?.subTotal || 0;

    // Kiểm tra từng discount
    for (const discount of allDiscounts) {
      // Kiểm tra minOrderAmount
      if (discount.minOrderAmount && subTotal < discount.minOrderAmount) {
        continue;
      }

      // Kiểm tra customer tier - NẾU discount yêu cầu customer tier cụ thể thì phải có customer đã chọn
      // Nếu discount.applicableCustomerTierIds là undefined/null hoặc mảng rỗng => áp dụng cho TẤT CẢ khách hàng
      if (discount.applicableCustomerTierIds && discount.applicableCustomerTierIds.length > 0) {
        // Chỉ check nếu discount yêu cầu tier cụ thể
        if (!customerTierId || !discount.applicableCustomerTierIds.includes(customerTierId)) {
          continue; // Bỏ qua nếu chưa có customer hoặc customer tier không khớp
        }
      }
      // Nếu không có điều kiện customer tier => áp dụng cho tất cả (không cần check)

      // Kiểm tra employee role - NẾU discount yêu cầu employee role cụ thể
      // Nếu discount.applicableEmployeeRoleIds là undefined/null hoặc mảng rỗng => áp dụng cho TẤT CẢ nhân viên
      if (discount.applicableEmployeeRoleIds && discount.applicableEmployeeRoleIds.length > 0) {
        // Chỉ check nếu discount yêu cầu role cụ thể
        if (!employeeRole || !discount.applicableEmployeeRoleIds.includes(employeeRole as any)) {
          continue;
        }
      }
      // Nếu không có điều kiện employee role => áp dụng cho tất cả (không cần check)

      // Kiểm tra products
      if (discount.applicableProductIds && discount.applicableProductIds.length > 0) {
        if (!orderProductIds.some((id: number) => discount.applicableProductIds.includes(id))) {
          continue;
        }
      }

      // Kiểm tra categories
      if (discount.applicableCategoryIds && discount.applicableCategoryIds.length > 0) {
        if (!orderCategoryIds.some((id: number) => discount.applicableCategoryIds.includes(id))) {
          continue;
        }
      }

      // Kiểm tra đặc biệt cho BuyXGetY - cần đủ số lượng sản phẩm
      if (discount.type === 3) { // BuyXGetY
        if (!discount.buyQuantity) {
          continue; // Thiếu thông tin BuyXGetY
        }

        let totalApplicableQuantity = 0;
        
        // Kiểm tra theo products
        if (discount.applicableProductIds && discount.applicableProductIds.length > 0) {
          for (const item of orderItems) {
            const productId = item.productId || item.id;
            if (discount.applicableProductIds.includes(productId)) {
              totalApplicableQuantity += (item.quantity || 1);
            }
          }
        }
        // Kiểm tra theo categories
        else if (discount.applicableCategoryIds && discount.applicableCategoryIds.length > 0) {
          for (const item of orderItems) {
            const productId = item.productId || item.id;
            const product = products.find(p => p.id === productId);
            if (product && discount.applicableCategoryIds.includes(product.categoryId)) {
              totalApplicableQuantity += (item.quantity || 1);
            }
          }
        }
        // Nếu không có điều kiện products/categories thì áp dụng cho tất cả
        else {
          for (const item of orderItems) {
            totalApplicableQuantity += (item.quantity || 1);
          }
        }

        // Kiểm tra số lượng có đủ không (ví dụ: mua 2 thì cần có ít nhất 2)
        if (totalApplicableQuantity < discount.buyQuantity) {
          continue; // Không đủ số lượng
        }
      }

      // Nếu discount này đã được chọn, không đề xuất lại
      if (selectedDiscountId === discount.id) {
        continue;
      }

      // Tìm thấy discount có thể áp dụng
      setSuggestedDiscount(discount);
      return;
    }

    // Không tìm thấy discount nào
    setSuggestedDiscount(null);
  };

  const handleDiscountSelect = async (discount: DiscountList) => {
    console.log('🎟️ === DISCOUNT SELECTED ===');
    console.log('Discount:', discount);
    console.log('Discount ID:', discount.id);
    console.log('Discount Code:', discount.code);
    console.log('Discount Type:', discount.type);
    console.log('Discount Value:', discount.discountValue);
    
    try {
      const discountDetail = await getDiscountById(discount.id);
      console.log('✅ Discount detail loaded:', discountDetail);
      
      setSelectedDiscountId(discount.id);
      setVoucherCode(discount.code);
      
      console.log('✅ State updated - selectedDiscountId:', discount.id);
      
      // Nếu order đã tồn tại (có id và không phải offline), cập nhật order với discountId mới
      console.log('📋 handleDiscountSelect - Order info:', {
        orderId: order?.id,
        isOffline: order?.isOffline,
        hasId: !!order?.id,
        order: order
      });
      
      // Kiểm tra xem order có id và không phải offline order
      const hasOrderId = order?.id && typeof order.id === 'number';
      const isOfflineOrder = order?.isOffline === true;
      
      if (hasOrderId && !isOfflineOrder) {
        try {
          // Update order với discountId mới - backend sẽ tính lại discount và totalAmount
          // Cần gửi status hiện tại vì UpdateOrderDto yêu cầu status
          // Load lại order từ backend để lấy status chính xác
          const currentOrder = await getOrderById(order.id);
          const currentStatus = typeof currentOrder.status === 'number' 
            ? currentOrder.status 
            : typeof currentOrder.status === 'string' 
            ? parseInt(currentOrder.status) || 1
            : 1;
          
          console.log('Updating order with discount:', {
            orderId: order.id,
            discountId: discount.id,
            currentStatus,
            discountDetail: discountDetail
          });
          
          await updateOrder(order.id, {
            status: currentStatus,
            discountId: discount.id
          });
          
          console.log('Order updated successfully, reloading...');
          
          // Load lại order từ backend để lấy discountAmount và totalAmount đã được tính lại
          const reloadedOrder = await getOrderById(order.id);
          console.log('Reloaded order:', reloadedOrder);
          
          setFullOrder(reloadedOrder);
          
          // Cập nhật discountAmount và amount từ order đã reload
          if (reloadedOrder.discountAmount !== undefined && reloadedOrder.discountAmount !== null) {
            console.log('Setting discountAmount:', reloadedOrder.discountAmount);
            setDiscountAmount(reloadedOrder.discountAmount);
    } else {
            console.warn('No discountAmount in reloaded order');
      setDiscountAmount(0);
          }
          if (reloadedOrder.totalAmount) {
            setAmount(reloadedOrder.totalAmount);
          }
        } catch (updateError: any) {
          console.error('Error updating order with discount:', updateError);
          console.error('Error response:', updateError.response);
          const errorMessage = updateError.response?.data?.message || 'Không thể áp dụng mã giảm giá';
          alert(errorMessage);
          return;
        }
      } else {
        // Nếu order chưa tồn tại, tính toán ở frontend dựa trên orderItems
        const orderItems = order?.orderItems || order?.cartItems || [];
        
        // Tính subtotal chỉ cho các sản phẩm áp dụng discount
        let applicableSubTotal = order?.subTotal || 0;
        
        // Xác định các sản phẩm áp dụng discount (hợp nhất sản phẩm và danh mục)
        const applicableProductIds: number[] = [];
        
        if (discountDetail.applicableProductIds && discountDetail.applicableProductIds.length > 0) {
          // Thêm các sản phẩm cụ thể
          applicableProductIds.push(...discountDetail.applicableProductIds);
        }
        
        if (discountDetail.applicableCategoryIds && discountDetail.applicableCategoryIds.length > 0) {
          // Thêm các sản phẩm trong danh mục được chọn
          orderItems.forEach((item: any) => {
            const productId = item.productId || item.id;
            const product = products.find(p => p.id === productId);
            if (product && discountDetail.applicableCategoryIds.includes(product.categoryId)) {
              if (!applicableProductIds.includes(productId)) {
                applicableProductIds.push(productId);
              }
            }
          });
        }
        
        // Nếu có điều kiện sản phẩm/danh mục, chỉ tính trên các sản phẩm đó
        if (applicableProductIds.length > 0) {
          applicableSubTotal = orderItems
            .filter((item: any) => {
              const productId = item.productId || item.id;
              return applicableProductIds.includes(productId);
            })
            .reduce((sum: number, item: any) => sum + (item.totalPrice || item.price * (item.quantity || 1)), 0);
        }
        // Nếu không có điều kiện, áp dụng cho toàn bộ (giữ nguyên applicableSubTotal = order?.subTotal)
        
        // Tính discount amount dựa trên applicableSubTotal
        let calculatedAmount = 0;
        if (discountDetail.type === 1) { // Percentage
          calculatedAmount = (applicableSubTotal * discountDetail.discountValue) / 100;
          if (discountDetail.maxDiscountAmount && calculatedAmount > discountDetail.maxDiscountAmount) {
            calculatedAmount = discountDetail.maxDiscountAmount;
          }
        } else if (discountDetail.type === 2) { // FixedAmount
          calculatedAmount = discountDetail.discountValue;
          if (calculatedAmount > applicableSubTotal) {
            calculatedAmount = applicableSubTotal;
          }
        }
        
        const finalAmount = Math.max(0, calculatedAmount);
        console.log('Setting discountAmount (offline order):', {
          applicableSubTotal,
          calculatedAmount,
          finalAmount,
          discountDetail: discountDetail
        });
        setDiscountAmount(finalAmount);
      }
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
      
      const subTotal = order?.subTotal || 0;
      if (validatedDiscount.minOrderAmount && subTotal < validatedDiscount.minOrderAmount) {
        setDiscountError(`Đơn hàng tối thiểu ${validatedDiscount.minOrderAmount.toLocaleString('vi-VN')}đ để áp dụng mã này`);
        return;
      }

      setSelectedDiscountId(validatedDiscount.id);
      
      // Nếu order đã tồn tại (có id và không phải offline), cập nhật order với discountId mới
      console.log('handleVoucherCodeValidate - Order info:', {
        orderId: order?.id,
        isOffline: order?.isOffline,
        hasId: !!order?.id,
        order: order
      });
      
      // Kiểm tra xem order có id và không phải offline order
      const hasOrderId = order?.id && typeof order.id === 'number';
      const isOfflineOrder = order?.isOffline === true;
      
      if (hasOrderId && !isOfflineOrder) {
        try {
          // Update order với discountId mới - backend sẽ tính lại discount và totalAmount
          // Cần gửi status hiện tại vì UpdateOrderDto yêu cầu status
          // Load lại order từ backend để lấy status chính xác
          const currentOrder = await getOrderById(order.id);
          const currentStatus = typeof currentOrder.status === 'number' 
            ? currentOrder.status 
            : typeof currentOrder.status === 'string' 
            ? parseInt(currentOrder.status) || 1
            : 1;
          
          console.log('Updating order with discount (voucher code):', {
            orderId: order.id,
            discountId: validatedDiscount.id,
            currentStatus,
            validatedDiscount: validatedDiscount
          });
          
          await updateOrder(order.id, {
            status: currentStatus,
            discountId: validatedDiscount.id
          });
          
          console.log('Order updated successfully, reloading...');
          
          // Load lại order từ backend để lấy discountAmount và totalAmount đã được tính lại
          const reloadedOrder = await getOrderById(order.id);
          console.log('Reloaded order:', reloadedOrder);
          
          setFullOrder(reloadedOrder);
          
          // Cập nhật discountAmount và amount từ order đã reload
          if (reloadedOrder.discountAmount !== undefined && reloadedOrder.discountAmount !== null) {
            console.log('Setting discountAmount:', reloadedOrder.discountAmount);
            setDiscountAmount(reloadedOrder.discountAmount);
          } else {
            console.warn('No discountAmount in reloaded order');
            setDiscountAmount(0);
          }
          if (reloadedOrder.totalAmount) {
            setAmount(reloadedOrder.totalAmount);
          }
        } catch (updateError: any) {
          console.error('Error updating order with discount:', updateError);
          console.error('Error response:', updateError.response);
          const errorMessage = updateError.response?.data?.message || 'Không thể áp dụng mã giảm giá';
          setDiscountError(errorMessage);
          setSelectedDiscountId(null);
          setDiscountAmount(0);
          return;
        }
      } else {
        // Nếu order chưa tồn tại, tính toán ở frontend dựa trên orderItems
        const orderItems = order?.orderItems || order?.cartItems || [];
        
        // Tính subtotal chỉ cho các sản phẩm áp dụng discount
        let applicableSubTotal = subTotal;
        
        // Xác định các sản phẩm áp dụng discount (hợp nhất sản phẩm và danh mục)
        const applicableProductIds: number[] = [];
        
        if (validatedDiscount.applicableProductIds && validatedDiscount.applicableProductIds.length > 0) {
          // Thêm các sản phẩm cụ thể
          applicableProductIds.push(...validatedDiscount.applicableProductIds);
        }
        
        if (validatedDiscount.applicableCategoryIds && validatedDiscount.applicableCategoryIds.length > 0) {
          // Thêm các sản phẩm trong danh mục được chọn
          orderItems.forEach((item: any) => {
            const productId = item.productId || item.id;
            const product = products.find(p => p.id === productId);
            if (product && validatedDiscount.applicableCategoryIds.includes(product.categoryId)) {
              if (!applicableProductIds.includes(productId)) {
                applicableProductIds.push(productId);
              }
            }
          });
        }
        
        // Nếu có điều kiện sản phẩm/danh mục, chỉ tính trên các sản phẩm đó
        if (applicableProductIds.length > 0) {
          applicableSubTotal = orderItems
            .filter((item: any) => {
              const productId = item.productId || item.id;
              return applicableProductIds.includes(productId);
            })
            .reduce((sum: number, item: any) => sum + (item.totalPrice || item.price * (item.quantity || 1)), 0);
        }
        // Nếu không có điều kiện, áp dụng cho toàn bộ (giữ nguyên applicableSubTotal = subTotal)
        
        // Tính discount amount dựa trên applicableSubTotal
        let calculatedAmount = 0;
        if (validatedDiscount.type === 1) { // Percentage
          calculatedAmount = (applicableSubTotal * validatedDiscount.discountValue) / 100;
          if (validatedDiscount.maxDiscountAmount && calculatedAmount > validatedDiscount.maxDiscountAmount) {
            calculatedAmount = validatedDiscount.maxDiscountAmount;
          }
        } else if (validatedDiscount.type === 2) { // FixedAmount
          calculatedAmount = validatedDiscount.discountValue;
          if (calculatedAmount > applicableSubTotal) {
            calculatedAmount = applicableSubTotal;
          }
        }
        
        setDiscountAmount(Math.max(0, calculatedAmount));
      }
    } catch (error: any) {
      console.error('Error validating discount code:', error);
      const errorMessage = error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      setDiscountError(errorMessage);
      setSelectedDiscountId(null);
      setDiscountAmount(0);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleDiscountConfirm = () => {
    // Discount đã được chọn thông qua handleDiscountSelect hoặc handleVoucherCodeValidate
    // Chỉ cần đóng modal
    setShowDiscountModal(false);
  };

  const handleDiscountCancel = () => {
    setShowDiscountModal(false);
    setVoucherCode('');
  };

  const removeDiscount = () => {
    setSelectedDiscountId(null);
    setDiscountAmount(0);
    setVoucherCode('');
  };

  const getChange = () => {
    return Math.max(0, amount - getTotal());
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handlePayment = async () => {
    console.log('💳 === PAYMENT PROCESS STARTED ===');
    console.log('Order info:', {
      type: order?.type,
      isOffline: order?.isOffline,
      hasCartItems: !!order?.cartItems,
      orderId: order?.id,
      selectedDiscountId: selectedDiscountId,
      discountAmount: discountAmount
    });
    
    const total = getTotal();
    
    if (total === 0) {
      alert('Không có đơn hàng để thanh toán!');
      return;
    }

    if (amount < total) {
      alert(`Số tiền khách đưa không đủ!\nCần thêm: ${formatPrice(total - amount)}`);
      return;
    }

    const change = getChange();
    const confirmMessage = `
Xác nhận thanh toán?

Phương thức: ${paymentMethod}
Số tiền: ${formatPrice(total)}
Tiền khách đưa: ${formatPrice(amount)}
Tiền trả lại: ${formatPrice(change)}
    `;

    if (!window.confirm(confirmMessage)) {
      console.log('❌ Payment cancelled by user');
      return;
    }

    try {
      console.log('🔀 Checking payment flow...');
      console.log('Condition 1 (Takeaway offline):', order?.type === 'takeaway' && order?.isOffline && order?.cartItems);
      console.log('Condition 2 (DineIn with orderId):', order?.id && !order?.isOffline);
      
      // Nếu là "Mang đi" (takeaway) và chưa lưu vào database (isOffline = true)
      if (order?.type === 'takeaway' && order?.isOffline && order?.cartItems) {
        console.log('✅ FLOW: Takeaway offline order (will create new order)');
        console.log('Processing takeaway order payment...');
        
        // 1. Tạo/tìm customer theo SĐT
        let customerId: number;
        if (customerPhone && selectedCustomerId) {
          // Đã tìm thấy customer theo SĐT
          customerId = selectedCustomerId;
          console.log('Using existing customer:', customerId);
        } else if (customerPhone) {
          // Tìm customer theo SĐT
          const foundCustomers = await searchCustomers(customerPhone);
          const foundCustomer = foundCustomers.find(
            c => c.phoneNumber && c.phoneNumber.includes(customerPhone)
          );
          
          if (foundCustomer) {
            customerId = foundCustomer.id;
            console.log('Found customer by phone:', customerId);
          } else {
            // Tạo customer mới
            const dateOfBirth = new Date('1990-01-01T00:00:00Z').toISOString();
            // Xử lý tên: nếu có customerName thì dùng, không thì dùng "Khách Hàng"
            let firstName = 'Khách';
            let lastName = 'Hàng';
            if (customerName.trim()) {
              const nameParts = customerName.trim().split(' ');
              if (nameParts.length === 1) {
                firstName = nameParts[0];
                lastName = '.'; // Backend không chấp nhận empty string, dùng '.'
              } else {
                lastName = nameParts[nameParts.length - 1];
                firstName = nameParts.slice(0, -1).join(' ');
              }
            }
            
            const newCustomer = await createCustomer({
              firstName: firstName,
              lastName: lastName,
              email: `customer_${Date.now()}@temp.com`,
              phoneNumber: customerPhone,
              dateOfBirth: dateOfBirth
            });
            customerId = newCustomer.id;
            console.log('Created new customer:', customerId);
          }
        } else {
          // Không có SĐT -> tạo customer với tên đã nhập hoặc "Khách Vãng Lai"
          const dateOfBirth = new Date('1990-01-01T00:00:00Z').toISOString();
          let firstName = 'Khách';
          let lastName = 'Vãng Lai';
          if (customerName.trim()) {
            const nameParts = customerName.trim().split(' ');
            if (nameParts.length === 1) {
              firstName = nameParts[0];
              lastName = '.'; // Backend không chấp nhận empty string, dùng '.'
            } else {
              lastName = nameParts[nameParts.length - 1];
              firstName = nameParts.slice(0, -1).join(' ');
            }
          }
          
          const walkInCustomer = await createCustomer({
            firstName: firstName,
            lastName: lastName,
            email: `walkin_${Date.now()}@temp.com`,
            phoneNumber: customerPhone || `TEMP_${Date.now()}`,
            dateOfBirth: dateOfBirth
          });
          customerId = walkInCustomer.id;
          console.log('Created walk-in customer:', customerId);
        }

        // 2. Tạo order với status = Confirmed (2) = "Đã Xử Lý"
        const orderData: CreateOrderDto = {
          customerId: customerId,
          employeeId: user?.employeeId ?? undefined,
          type: 2, // Takeaway
          orderItems: order.cartItems.map((item: { productId: number; quantity: number; note?: string }) => ({
            productId: item.productId,
            quantity: item.quantity,
            specialInstructions: item.note || undefined
          })),
          includeVAT: includeVAT,
          discountId: selectedDiscountId ?? undefined
        };

        console.log('🚀 Creating order with discount...');
        console.log('🔍 DEBUG - orderFromState:', orderFromState);
        console.log('🔍 DEBUG - orderFromState.discountId:', orderFromState?.discountId);
        console.log('🔍 DEBUG - selectedDiscountId state:', selectedDiscountId);
        console.log('🔍 DEBUG - orderData.discountId:', selectedDiscountId ?? undefined);
        console.log('orderData:', orderData);
        const createdOrder = await createOrder(orderData);
        console.log('✅ Order created:', createdOrder);
        console.log('Order discountId:', createdOrder.discountId);
        console.log('Order discountAmount:', createdOrder.discountAmount);

        // 3. Cập nhật order status thành Confirmed (2) = "Đã Xử Lý"
        console.log('Updating order status to Confirmed...');
        await updateOrder(createdOrder.id, {
          status: 2, // Confirmed = "Đã Xử Lý"
          notes: undefined,
          employeeId: user?.employeeId ?? undefined,
          discountId: selectedDiscountId ?? undefined // Gửi kèm để giữ discount
        });
        console.log('Order status updated to Confirmed');

        // 3.5. Reload order để lấy totalAmount chính xác từ backend (sau khi áp dụng discount)
        const latestCreatedOrder = await getOrderById(createdOrder.id);
        console.log('Reloaded order with actual totalAmount:', latestCreatedOrder.totalAmount);
        
        // Sử dụng totalAmount từ backend
        const actualTotal = latestCreatedOrder.totalAmount || total;

        // 4. Tạo payment với status = Completed (2) = "Đã Thanh Toán"
        const paymentMethodNumber = getPaymentMethodNumber(paymentMethod);
        const payment = await createPayment({
          orderId: createdOrder.id,
          method: paymentMethodNumber,
          amount: actualTotal, // Sử dụng totalAmount từ backend thay vì frontend calculated
          referenceNumber: undefined,
          notes: undefined
        });
        console.log('Payment created:', payment);

        // 5. Xác nhận payment (chuyển sang Completed)
        await confirmPayment(payment.id);
        console.log('Payment confirmed (Completed)');

        openInvoiceModal({
          sourceOrder: latestCreatedOrder,
          orderNumber: latestCreatedOrder.orderNumber || order?.orderNumber,
          customerDisplayName: customerName || latestCreatedOrder.customerName,
          customerPhone: customerPhone,
          totalAmount: actualTotal, // Sử dụng actualTotal từ backend
          amountReceived: amount,
          change,
          deliveryFee: latestCreatedOrder.deliveryFee ?? order?.deliveryFee ?? 0,
          discount: latestCreatedOrder.discountAmount || discountAmount,
          taxAmount: includeVAT ? getTaxAmount() : 0,
          items: latestCreatedOrder.orderItems || order?.cartItems
        });
      } else if (order?.id && !order?.isOffline) {
        console.log('✅ FLOW: DineIn order (already has orderId, only create payment)');
        // Nếu là "Tại bàn" (dinein) - đã có orderId, chỉ tạo payment
        console.log('Processing dinein order payment...');
        console.log('OrderId:', order.id);
        console.log('Current discountAmount:', discountAmount);
        console.log('Current selectedDiscountId:', selectedDiscountId);
        
        // Reload order từ backend để đảm bảo có TotalAmount chính xác (sau khi áp dụng discount)
        const latestOrder = await getOrderById(order.id);
        console.log('Latest order before payment:', latestOrder);
        
        // Sử dụng totalAmount từ backend thay vì tính toán frontend
        const actualTotal = latestOrder.totalAmount || total;
        console.log('Payment amount - Frontend calculated:', total, 'Backend TotalAmount:', actualTotal);
        
        const paymentMethodNumber = getPaymentMethodNumber(paymentMethod);
        const payment = await createPayment({
          orderId: order.id,
          method: paymentMethodNumber,
          amount: actualTotal, // Sử dụng TotalAmount từ backend
          referenceNumber: undefined,
          notes: undefined
        });
        console.log('Payment created:', payment);

        // Xác nhận payment (chuyển sang Completed)
        await confirmPayment(payment.id);
        console.log('Payment confirmed (Completed)');

        // Cập nhật trạng thái bàn thành Occupied nếu là đơn tại bàn
        if (order?.tableId) {
          try {
            await updateTableStatus(order.tableId, TableStatus.Occupied);
            console.log('Table status updated to Occupied');
          } catch (error) {
            console.error('Error updating table status:', error);
            // Không báo lỗi cho user, chỉ log
          }
        }

        // Reload lại order sau khi payment để có dữ liệu mới nhất
        const updatedOrder = await getOrderById(order.id);
        openInvoiceModal({
          sourceOrder: updatedOrder,
          orderNumber: updatedOrder.orderNumber,
          customerDisplayName: updatedOrder.customerName,
          customerPhone: customerPhone || undefined,
          totalAmount: actualTotal, // Sử dụng actualTotal từ backend
          amountReceived: amount,
          change,
          deliveryFee: updatedOrder.deliveryFee ?? 0,
          discount: updatedOrder.discountAmount || discountAmount,
          taxAmount: includeVAT ? getTaxAmount() : 0,
          items: updatedOrder.orderItems
        });
      } else {
        console.log('❌ FLOW: Unknown - Cannot process payment');
        console.log('Order details:', {
          type: order?.type,
          isOffline: order?.isOffline,
          hasCartItems: !!order?.cartItems,
          hasId: !!order?.id
        });
        alert('Không thể xử lý thanh toán. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
        stack: error?.stack
      });
      
      let errorMessage = 'Thanh toán thất bại. Vui lòng thử lại!';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.details) {
        errorMessage = `Lỗi: ${error.response.data.details}`;
      } else if (error?.message) {
        errorMessage = `Lỗi: ${error.message}`;
      }
      
      alert(`Lỗi: ${errorMessage}`);
    }
  };

  const openInvoiceModal = (data: {
    sourceOrder?: any;
    items?: any[];
    orderNumber?: string;
    customerDisplayName?: string;
    customerPhone?: string;
    totalAmount: number;
    amountReceived: number;
    change: number;
    deliveryFee?: number;
    discount?: number;
    taxAmount?: number;
  }) => {
    const items = buildInvoiceItems(data.items ?? data.sourceOrder?.orderItems ?? order?.cartItems ?? []);
    const subTotalValue =
      order?.subTotal ??
      data.sourceOrder?.subTotal ??
      items.reduce((sum, item) => sum + item.total, 0);

    setInvoiceData({
      orderNumber: data.orderNumber || order?.orderNumber || `ORDER-${Date.now()}`,
      customerName: data.customerDisplayName || customerName || 'Khách hàng',
      customerPhone: data.customerPhone || customerPhone,
      paymentMethod,
      createdAt: new Date().toISOString(),
      cashier: user?.fullName,
      subTotal: subTotalValue,
      taxAmount: data.taxAmount ?? (includeVAT ? getTaxAmount() : 0),
      deliveryFee: data.deliveryFee ?? order?.deliveryFee ?? 0,
      discountAmount: data.discount ?? discountAmount,
      totalAmount: data.totalAmount,
      amountReceived: data.amountReceived,
      change: data.change,
      items
    });
    setShowInvoiceModal(true);
  };

  const buildInvoiceItems = (items: any[]): InvoiceItem[] => {
    if (!Array.isArray(items)) return [];
    return items.map((item, index) => {
      const quantity = item.quantity ?? 1;
      const price = item.price ?? item.unitPrice ?? item.totalPrice ?? 0;
      const total = item.totalPrice ?? price * quantity;
      return {
        name: item.productName || item.name || `Món ${index + 1}`,
        quantity,
        price,
        total,
        note: item.note || item.specialInstructions
      };
    });
  };

  const handleInvoiceClose = () => {
    setShowInvoiceModal(false);
    setInvoiceData(null);
    navigate('/pos');
  };

  const handlePrintInvoice = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open('', '', 'width=800,height=900');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #111; }
            h2 { text-align: center; margin-bottom: 8px; }
            .invoice-meta { text-align: center; font-size: 14px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
            th { background: #f5f5f5; }
            .totals { margin-top: 16px; font-size: 15px; }
            .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
          </style>
        </head>
        <body>
          ${invoiceRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const getPaymentMethodNumber = (method: string): PaymentMethod => {
    switch (method) {
      case 'Cash':
      case 'Tiền mặt':
        return PaymentMethod.Cash;
      case 'Bank Transfer':
      case 'Chuyển khoản':
        return PaymentMethod.BankTransfer;
      case 'VNPAY':
      case 'GrabPay':
      case 'ZaloPay':
      case 'MoMo':
        return PaymentMethod.MobilePayment;
      case 'Credit':
        return PaymentMethod.CreditCard;
      default:
        return PaymentMethod.Cash;
    }
  };

  // Debug: check order data
  console.log('Payment Page - Order data:', order);
  console.log('Payment Page - Total:', getTotal());
  console.log('Payment Page - Amount:', amount);

  return (
    <div className="payment-page">
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
                            : discount.type === 3
                            ? 'Mua X Tặng Y'
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

      {/* Invoice Modal */}
      {showInvoiceModal && invoiceData && (
        <div className="modal-overlay invoice-overlay" onClick={handleInvoiceClose}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invoice-modal-header">
              <div>
                <h3>Hóa đơn thanh toán</h3>
                <p>Mã đơn: <strong>{invoiceData.orderNumber}</strong></p>
              </div>
              <button className="invoice-close-btn" onClick={handleInvoiceClose}>
                ✕
              </button>
            </div>

            <div className="invoice-modal-body">
              <div className="invoice-content" ref={invoiceRef}>
                <h2>FASTFOOD POS</h2>
                <div className="invoice-meta">
                  <div>
                    <span>Ngày tạo:</span>
                    <strong>{formatDateTime(invoiceData.createdAt)}</strong>
                  </div>
                  <div>
                    <span>Thu ngân:</span>
                    <strong>{invoiceData.cashier || user?.fullName || '---'}</strong>
                  </div>
                  <div>
                    <span>Khách hàng:</span>
                    <strong>{invoiceData.customerName}</strong>
                  </div>
                  {invoiceData.customerPhone && (
                    <div>
                      <span>SĐT:</span>
                      <strong>{invoiceData.customerPhone}</strong>
                    </div>
                  )}
                  <div>
                    <span>Phương thức:</span>
                    <strong>{invoiceData.paymentMethod}</strong>
                  </div>
                </div>

                {invoiceData.items.length > 0 ? (
                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>Món</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceData.items.map((item, index) => (
                        <tr key={`${item.name}-${index}`}>
                          <td>
                            <div className="invoice-item-name">
                              <span>{item.name}</span>
                              {item.note && <small>Ghi chú: {item.note}</small>}
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="invoice-empty">
                    Chưa có danh sách món để hiển thị.
                  </div>
                )}

                <div className="invoice-summary">
                  <div>
                    <span>Tạm tính:</span>
                    <strong>{formatPrice(invoiceData.subTotal)}</strong>
                  </div>
                  {invoiceData.taxAmount > 0 && (
                    <div>
                      <span>Thuế VAT:</span>
                      <strong>{formatPrice(invoiceData.taxAmount)}</strong>
                    </div>
                  )}
                  {invoiceData.deliveryFee > 0 && (
                    <div>
                      <span>Phí giao hàng:</span>
                      <strong>{formatPrice(invoiceData.deliveryFee)}</strong>
                    </div>
                  )}
                  {invoiceData.discountAmount > 0 && (
                    <div className="invoice-discount">
                      <span>Giảm giá:</span>
                      <strong>-{formatPrice(invoiceData.discountAmount)}</strong>
                    </div>
                  )}
                  <div className="invoice-total">
                    <span>Tổng thanh toán:</span>
                    <strong>{formatPrice(invoiceData.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Khách đưa:</span>
                    <strong>{formatPrice(invoiceData.amountReceived)}</strong>
                  </div>
                  <div>
                    <span>Tiền thừa:</span>
                    <strong>{formatPrice(invoiceData.change)}</strong>
                  </div>
                </div>
              </div>

              <div className="invoice-actions">
                <button className="print-btn" onClick={handlePrintInvoice}>
                  🖨️ In hóa đơn
                </button>
                <button className="done-btn" onClick={handleInvoiceClose}>
                  ✓ Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="payment-header">
        <div className="header-left-buttons">
          <button 
            className="back-btn"
            onClick={() => navigate('/pos')}
          >
            ← Quay lại
          </button>
          {user?.role === UserRole.Admin && (
            <button 
              className="back-to-menu-btn-payment"
              onClick={() => navigate('/')}
            >
              ⬅️ Menu
            </button>
          )}
        </div>
        <h1>Thanh toán</h1>
        <button className="discount-header-btn" onClick={() => setShowDiscountModal(true)}>
          🎁 Giảm giá
        </button>
      </div>

      <div className="payment-content">
        {/* Left Column - Payment Methods */}
        <div className="payment-methods-column">
          {/* Current Payment Method */}
          <div className="current-method">
            <span className="method-name">{paymentMethod}</span>
            <span className="method-amount">
              {amount > 0 ? formatPrice(amount) : formatPrice(getTotal())}
            </span>
            <span className="method-currency">VND</span>
          </div>

          {/* Customer Name Input */}
          <div className="customer-input-section">
            <label>
              <span>👤 Tên khách hàng</span>
            </label>
            <input
              type="text"
              placeholder="Nhập tên khách hàng (tùy chọn)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="customer-name-input"
            />
          </div>

          {/* Customer Phone Input */}
          <div className="customer-input-section">
            <label>
              <span>📞 Số điện thoại</span>
              {selectedCustomerId && (
                <span className="customer-found-badge">✓ Đã tìm thấy</span>
              )}
            </label>
            <input
              type="text"
              placeholder="Nhập SĐT khách hàng (tùy chọn)"
              value={customerPhone}
              onChange={handleCustomerPhoneChange}
              className="customer-phone-input"
            />
            {phoneSuggestions.length > 0 && (
              <div className="customer-suggestions">
                {phoneSuggestions.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    className="customer-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectCustomer(customer);
                    }}
                  >
                    <div className="suggestion-main">
                      <span className="suggestion-name">{customer.fullName}</span>
                      <span className="suggestion-phone">{customer.phoneNumber}</span>
                    </div>
                    {customer.tierName && (
                      <span className="suggestion-tier">{customer.tierName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {selectedCustomerId && (
              <div className="customer-info">
                {(() => {
                  const customer = customers.find(c => c.id === selectedCustomerId);
                  return customer ? (
                    <div className="customer-info-details">
                      <div>
                        👤 {customer.fullName} | {customer.phoneNumber}
                      </div>
                      <div className="customer-tier-info">
                        <span className="customer-tier-badge">
                          {customer.tierName ?? 'Chưa phân hạng'}
                        </span>
                        <span className="customer-tier-benefit">
                          {getTierBenefitText(customer.tierName)}
                        </span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="payment-methods-section">
            <h3>Phương thức thanh toán</h3>
            <div className="payment-methods-grid">
              <button
                className={`method-btn ${paymentMethod === 'Tiền mặt' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Tiền mặt')}
              >
                💵 Tiền mặt
              </button>
              <button
                className={`method-btn ${paymentMethod === 'Chuyển khoản' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Chuyển khoản')}
              >
                🏦 Chuyển khoản
              </button>
              
            </div>
          </div>

         
        </div>

        {/* Middle Column - Keypad */}
        <div className="keypad-column">
          {/* Order Items Detail */}
          <div className="order-items-detail">
            <div className="order-items-header">
              <h3>Chi tiết đơn hàng</h3>
              <span className="items-count">
                {(order?.orderItems?.length || order?.cartItems?.length || 0)} món
              </span>
            </div>
            <div className="order-items-list">
              {(order?.orderItems || order?.cartItems || []).map((item: any, index: number) => {
                // Kiểm tra xem có phải sản phẩm tặng không (từ BuyXGetY)
                const isFreeItem = item.specialInstructions?.includes('khuyến mãi') || 
                                  item.specialInstructions?.includes('Tặng') ||
                                  (item.unitPrice === 0 && item.totalPrice === 0 && item.specialInstructions);
                const isDiscountedItem = item.specialInstructions?.includes('Giảm giá') && 
                                        (item.unitPrice || item.price || 0) > 0 &&
                                        (item.totalPrice || 0) > 0;
                const itemTotalPrice = (item.unitPrice || item.price || 0) * (item.quantity || 1);
                
                return (
                  <div 
                    key={item.id || index} 
                    className={`order-item-row ${isFreeItem ? 'free-item' : ''} ${isDiscountedItem ? 'discounted-item' : ''}`}
                  >
                    <div className="item-name">
                      <span className="item-name-text">
                        {item.productName || item.name || `Món ${index + 1}`}
                        {isFreeItem && <span className="free-badge">🎁 Tặng</span>}
                        {isDiscountedItem && <span className="discount-badge">💸 Giảm giá</span>}
                      </span>
                      {item.specialInstructions && (
                        <span className="item-note">{item.specialInstructions}</span>
                      )}
                    </div>
                    <div className="item-details">
                      <span className="item-quantity">x{item.quantity || 1}</span>
                      <span className={`item-price ${isFreeItem ? 'free-price' : ''}`}>
                        {isFreeItem ? 'Miễn phí' : formatPrice(itemTotalPrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
              {(!order?.orderItems || order.orderItems.length === 0) && (!order?.cartItems || order.cartItems.length === 0) && (
                <div className="empty-order-items">
                  <p>Chưa có món nào trong đơn hàng</p>
                </div>
              )}
            </div>
          </div>

          {/* Keypad Section - Smaller */}
          <div className="keypad-section-small">
          {/* Quick Amount Buttons */}
            <div className="quick-amounts-small">
            {quickAmounts.map(amt => (
              <button
                key={amt}
                  className="quick-amount-btn-small"
                onClick={() => handleQuickAmount(amt)}
              >
                {formatPrice(amt)}
              </button>
            ))}
          </div>

          {/* Display Amount */}
            <div className="amount-display-small">
              <span className="amount-value-small">
              {amount > 0 ? formatPrice(amount) : formatPrice(getTotal())}
            </span>
          </div>

          {/* Number Keypad */}
            <div className="keypad-small">
              <div className="keypad-row-small">
                <button className="keypad-btn-small" onClick={() => handleNumberClick('9')}>9</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('8')}>8</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('7')}>7</button>
            </div>
              <div className="keypad-row-small">
                <button className="keypad-btn-small" onClick={() => handleNumberClick('6')}>6</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('5')}>5</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('4')}>4</button>
            </div>
              <div className="keypad-row-small">
                <button className="keypad-btn-small" onClick={() => handleNumberClick('3')}>3</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('2')}>2</button>
                <button className="keypad-btn-small" onClick={() => handleNumberClick('1')}>1</button>
            </div>
              <div className="keypad-row-small">
                <button className="keypad-btn-small" onClick={() => handleNumberClick('0')}>0</button>
                
                <button className="keypad-btn-small delete-btn-small" onClick={handleDelete}>
                XÓA
              </button>
                <button className="keypad-btn-small triple-zero-btn-small" onClick={handleTripleZero}>
                  000
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="summary-column">
          {/* Order Details */}
          <div className="order-summary">
            {order?.subTotal && (
              <div className="summary-row">
                <span>Tổng tiền:</span>
                <span>{formatPrice(order.subTotal)}</span>
              </div>
            )}
            {/* Toggle VAT - chỉ tích mới tính VAT */}
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeVAT}
                  onChange={(e) => setIncludeVAT(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Áp dụng thuế VAT (10%)</span>
              </label>
            </div>
            {includeVAT && (
              <div className="summary-row">
                <span>Thuế VAT (10%):</span>
                <span>{formatPrice(getTaxAmount())}</span>
              </div>
            )}
            {order?.deliveryFee !== undefined && order.deliveryFee > 0 && (
              <div className="summary-row">
                <span>Phí giao hàng:</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
            )}
            {/* Suggested Discount */}
            {suggestedDiscount && !selectedDiscountId && (
              <div className="summary-row suggested-discount-row" style={{
                background: '#fff3e0',
                border: '2px solid #ff6b35',
                borderRadius: '8px',
                padding: '0.75rem',
                margin: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#ff6b35', fontSize: '0.9rem' }}>
                      🎁 Có khuyến mãi!
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                      {suggestedDiscount.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>
                      {suggestedDiscount.type === 1 
                        ? `Giảm ${suggestedDiscount.discountValue}%`
                        : suggestedDiscount.type === 3 
                        ? suggestedDiscount.freeProductName 
                          ? `Mua ${suggestedDiscount.buyQuantity} tặng ${suggestedDiscount.freeProductQuantity || 1} ${suggestedDiscount.freeProductName}`
                          : `Mua ${suggestedDiscount.buyQuantity} tặng ${suggestedDiscount.freeProductQuantity || 1} món`
                        : `Giảm ${suggestedDiscount.discountValue.toLocaleString('vi-VN')}đ`
                      }
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (suggestedDiscount) {
                      await handleDiscountSelect({
                        id: suggestedDiscount.id,
                        code: suggestedDiscount.code,
                        name: suggestedDiscount.name,
                        type: suggestedDiscount.type,
                        typeName: suggestedDiscount.typeName,
                        discountValue: suggestedDiscount.discountValue,
                        startDate: suggestedDiscount.startDate,
                        endDate: suggestedDiscount.endDate,
                        usageLimit: suggestedDiscount.usageLimit,
                        usedCount: suggestedDiscount.usedCount,
                        isActive: suggestedDiscount.isActive,
                        isValid: suggestedDiscount.isValid
                      });
                      setSuggestedDiscount(null);
                    }
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    width: '100%'
                  }}
                >
                  Áp dụng ngay
                </button>
              </div>
            )}
            
            {(discountAmount > 0 || (order?.discountAmount && order.discountAmount > 0)) ? (
              <div className="summary-row discount-row">
                <span>🎁 Giảm giá:</span>
                <span className="discount-amount" style={{ color: '#f97316', fontWeight: 700 }}>
                  -{formatPrice(discountAmount || order?.discountAmount || 0)}
                  {selectedDiscountId && (
                  <button 
                    className="remove-discount-btn-mini"
                    onClick={removeDiscount}
                    title="Xóa giảm giá"
                  >
                    ✕
                  </button>
                  )}
                </span>
              </div>
            ) : (
              <div className="summary-row">
                <span>Giảm giá:</span>
                <span>{formatPrice(0)}</span>
              </div>
            )}
            {order?.tableNumber && (
              <div className="summary-row">
                <span>Bàn/code:</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Phương thức:</span>
              <span className="payment-method-name">{paymentMethod}</span>
            </div>
            <div className="summary-row">
              <span>Thành tiền:</span>
              <span className="order-amount">{formatPrice(getTotal())}</span>
            </div>
            {amount > 0 && (
              <div className="summary-row">
                <span>Tiền khách đưa:</span>
                <span className="amount-received-mini">{formatPrice(amount)}</span>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="payment-info">
            <div className="payment-info-row">
              <span>Tiền khách đưa:</span>
              <span className="amount-received">{formatPrice(amount)}</span>
            </div>
            <div className="payment-info-row">
              <span>Tiền trả lại:</span>
              <span className="amount-change">{formatPrice(getChange())}</span>
            </div>
          </div>

          {/* Total Bar - Moved to bottom and smaller */}
          <div className="total-bar-bottom">
            <span className="total-label-bottom">Tổng thanh toán:</span>
            <span className="total-value-bottom">{formatPrice(getTotal())}</span>
          </div>

          {/* Pay Button */}
          <button 
            className="pay-button"
            onClick={handlePayment}
            disabled={amount < getTotal()}
          >
            THANH TOÁN
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
