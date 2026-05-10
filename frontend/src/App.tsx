import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentsPage from './pages/ShipmentsPage';
import WithdrawalsPage from './pages/WithdrawalsPage';
import FuelClaimsPage from './pages/FuelClaimsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';

import ReportsPage from './pages/ReportsPage';

// --- ส่วนการจัดการ Route ที่ต้องมีการตรวจสอบสิทธิ์ (ProtectedRoute) ---
// ใช้สำหรับป้องกันหน้าเพจไม่ให้ผู้ที่ไม่ได้ล็อกอิน หรือไม่มีสิทธิ์ (Role) เข้าถึงได้
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  
  // ถ้ากำลังโหลดข้อมูลผู้ใช้ ให้แสดง Loading Spinner
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  // ถ้ายังไม่ได้ล็อกอิน ให้ดีดไปที่หน้า Login
  if (!user) return <Navigate to="/login" replace />;
  
  // ถ้ามีการระบุ Role และ User ที่ล็อกอินไม่มีสิทธิ์ ให้ดีดกลับไปหน้า Dashboard
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  
  // ถ้าผ่านเงื่อนไขทั้งหมด ให้แสดงผลหน้าที่เลือกโดยหุ้มด้วย Layout หลัก
  return <Layout>{children}</Layout>;
}

// --- ส่วนการกำหนดเส้นทาง (Routing Table) ---
function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* หน้า Login: ถ้าล็อกอินอยู่แล้วจะเข้าไม่ได้ จะโดนส่งไปหน้า Dashboard ทันที */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      
      {/* หน้าต่างๆ ที่ต้องล็อกอินก่อนถึงจะเข้าได้ (ProtectedRoute) */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/shipments" element={<ProtectedRoute><ShipmentsPage /></ProtectedRoute>} />
      <Route path="/withdrawals" element={<ProtectedRoute><WithdrawalsPage /></ProtectedRoute>} />
      <Route path="/fuel-claims" element={<ProtectedRoute><FuelClaimsPage /></ProtectedRoute>} />
      
      {/* หน้าที่จำกัดสิทธิ์เฉพาะบางบทบาท (Role Restricted) */}
      <Route path="/reports" element={<ProtectedRoute roles={['Admin', 'Manager', 'Finance']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute roles={['Admin']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['Admin']}><UsersPage /></ProtectedRoute>} />
      
      {/* ถ้าพิมพ์ URL มั่ว ให้ดีดกลับไปหน้า Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(148,163,184,0.2)' },
              success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
