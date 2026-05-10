import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Truck,
  LayoutDashboard,
  FileText,
  Fuel,
  ClipboardList,
  LogOut,
  ChevronRight,
  User,
  BarChart3
} from 'lucide-react';

interface Props {
  children: ReactNode;
}

const roleColors: Record<string, string> = {
  Driver: 'bg-blue-600',
  Manager: 'bg-amber-600',
  Finance: 'bg-emerald-600',
  Admin: 'bg-purple-600',
};

const roleLabels: Record<string, string> = {
  Driver: 'คนขับรถ',
  Manager: 'ผู้จัดการ',
  Finance: 'การเงิน',
  Admin: 'ผู้ดูแลระบบ',
};

export default function Layout({ children }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'หน้าหลัก',
      roles: ['Driver', 'Manager', 'Finance', 'Admin']
    },
    {
      to: '/shipments',
      icon: Truck,
      label: 'การเดินรถ',
      roles: ['Driver', 'Manager', 'Finance', 'Admin']
    },
    {
      to: '/withdrawals',
      icon: FileText,
      label: 'ขอเบิกเงิน',
      roles: ['Driver', 'Manager', 'Finance', 'Admin']
    },
    {
      to: '/fuel-claims',
      icon: Fuel,
      label: 'เคลมน้ำมัน',
      roles: ['Driver', 'Manager', 'Finance', 'Admin']
    },
    {
      to: '/reports',
      icon: BarChart3,
      label: 'ออกรายงาน',
      roles: ['Admin', 'Manager', 'Finance']
    },
    {
      to: '/users',
      icon: User,
      label: 'จัดการผู้ใช้งาน',
      roles: ['Admin']
    },
    {
      to: '/audit-logs',
      icon: ClipboardList,
      label: 'Audit Log',
      roles: ['Admin']
    },
  ].filter(item => item.roles.includes(user?.role ?? ''));

  return (
    <div className="min-h-screen flex bg-dark-950">
      
      {/* Sidebar */}
      <aside className="w-64 h-screen sticky top-0 bg-dark-800 border-r border-slate-700/50 flex flex-col">
        
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
              <Truck className="w-5 h-5 text-white" />
            </div>

            <div>
              <p className="font-bold text-white text-sm">
                Shipping System
              </p>

              <p className="text-xs text-slate-500">
                ระบบขนส่ง
              </p>
            </div>

          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Main Menu */}
          <div className="space-y-1">
            
            {navItems
              .filter(item => !['/users', '/audit-logs'].includes(item.to))
              .map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    px-3 py-2.5
                    rounded-xl
                    text-sm font-medium
                    transition-all duration-200
                    group
                    ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-4 h-4 flex-shrink-0" />

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {isActive && (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
          </div>

          {/* Admin Section */}
          {user?.role === 'Admin' && (
            <div className="pt-4 border-t border-slate-700/50 space-y-2">
              
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                ผู้ดูแลระบบ (ADMIN)
              </p>

              <div className="space-y-1">
                
                {navItems
                  .filter(item =>
                    ['/users', '/audit-logs'].includes(item.to)
                  )
                  .map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `
                        flex items-center gap-3
                        px-3 py-2.5
                        rounded-xl
                        text-sm font-medium
                        transition-all duration-200
                        group
                        ${
                          isActive
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }
                        `
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className="w-4 h-4 flex-shrink-0" />

                          <span className="flex-1">
                            {item.label}
                          </span>

                          {isActive && (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile & Logout (Moved to Bottom) */}
        <div className="p-4 border-t border-slate-700/50 bg-dark-900/30">
          
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-slate-700/30 border border-slate-700/50">
            
            <div
              className={`w-10 h-10 ${roleColors[user?.role ?? '']} rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner`}
            >
              <User className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              
              <p className="text-sm font-bold text-white truncate">
                {user?.fullName}
              </p>

              <div className="flex items-center gap-2 mt-0.5">
                {user?.role?.trim() === 'Driver' && (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                    ทะเบียน: {user?.vehiclePlate || 'ไม่ระบุ'}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 truncate">
                  {roleLabels[user?.role ?? '']}
                </span>
              </div>

            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="
              mt-3
              w-full
              flex items-center gap-3
              px-3 py-2.5
              rounded-xl
              text-sm font-bold
              text-red-400
              hover:text-white
              hover:bg-red-600/20
              transition-all
            "
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
}