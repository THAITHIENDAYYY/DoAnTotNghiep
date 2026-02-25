import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole } from './contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Lazy load all pages for better performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const IngredientsPage = lazy(() => import('./pages/IngredientsPage'));
const POSPage = lazy(() => import('./pages/POSPage'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const TablesPage = lazy(() => import('./pages/TablesPage'));
const TableManagementPage = lazy(() => import('./pages/TableManagementPage'));
const ShiftManagementPage = lazy(() => import('./pages/ShiftManagementPage'));
const CashierShiftReportPage = lazy(() => import('./pages/CashierShiftReportPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

// Loading component
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: '#f8f9fa'
  }}>
    <div style={{
      textAlign: 'center'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #FF6B35',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{
        fontSize: '16px',
        color: '#7f8c8d',
        fontWeight: '500'
      }}>Đang tải...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />
        
        {/* POS and Payment pages - no Layout */}
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Cashier]}>
              <POSPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Cashier]}>
              <PaymentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tables" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Cashier]}>
              <TablesPage />
            </ProtectedRoute>
          } 
        />
        {/* POS and Payment pages - no Layout */}
        
        {/* Protected routes with Layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route 
            path="shift-report" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Cashier]}>
                <CashierShiftReportPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="shift-management" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <ShiftManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            index 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="categories" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <CategoriesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="products" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="ingredients" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.WarehouseStaff]}>
                <IngredientsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="orders" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="customers" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <CustomersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="employees" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <EmployeesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="tables-management" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <TableManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="payments" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <PaymentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="discounts" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <DiscountsPage />
              </ProtectedRoute>
            } 
          />
        </Route>

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
