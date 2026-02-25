import axios from 'axios';

// Lấy API URL từ environment variable hoặc sử dụng giá trị mặc định
const getApiBaseUrl = (): string => {
  // Trong production, sử dụng VITE_API_BASE_URL từ environment
  // Trong development, fallback về localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5268/api';
};

// Tạo instance của axios với cấu hình cơ bản
const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token hoặc xử lý trước khi gửi request
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    if (config.data) {
      console.log('📦 Request payload:', JSON.stringify(config.data, null, 2));
    }
    // Thêm token authentication tự động
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý response và errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.response?.data);
    // Xử lý lỗi chung
    if (error.response) {
      // Server đã trả về response với status code ngoài range 2xx
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - Cần đăng nhập');
          // Có thể redirect đến trang login
          break;
        case 403:
          console.error('Forbidden - Không có quyền truy cập');
          break;
        case 404:
          console.error('Not Found - Không tìm thấy tài nguyên');
          break;
        case 500:
          console.error('Server Error - Lỗi máy chủ');
          break;
        default:
          console.error('Error:', error.response.data);
      }
    } else if (error.request) {
      // Request đã được gửi nhưng không nhận được response
      console.error('No response from server - Có thể server không chạy');
    } else {
      // Có lỗi xảy ra khi thiết lập request
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

