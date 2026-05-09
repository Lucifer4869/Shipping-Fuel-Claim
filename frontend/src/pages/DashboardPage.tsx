import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWithdrawals, getFuelClaims } from '../lib/api';
import { TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, FileText, Fuel, Wallet } from 'lucide-react';

import DriverDashboard from '../components/dashboard/DriverDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import FinanceDashboard from '../components/dashboard/FinanceDashboard';

interface Stats {
  totalWithdrawalAmount: number;
  totalClaimAmount: number;
  pendingApprovals: number;
  successCount: number;
  rejectedCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'driver' | 'manager' | 'finance'>('overview');

  // Role-based routing for non-admins
  if (user?.role === 'Driver') return <DriverDashboard />;
  if (user?.role === 'Manager') return <ManagerDashboard />;
  if (user?.role === 'Finance') return <FinanceDashboard />;

  // Admin sees the multi-view dashboard
  return (
    <div className="space-y-6">
      {/* Admin Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700/50 w-fit">
        {[
          { id: 'overview', label: 'ภาพรวมระบบ', icon: TrendingUp },
          { id: 'driver', label: 'มุมมอง Driver', icon: Fuel },
          { id: 'manager', label: 'มุมมอง Manager', icon: Clock },
          { id: 'finance', label: 'มุมมอง Finance', icon: Wallet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn">
        {activeTab === 'overview' && <AdminOverview user={user} />}
        {activeTab === 'driver' && <DriverDashboard />}
        {activeTab === 'manager' && <ManagerDashboard />}
        {activeTab === 'finance' && <FinanceDashboard />}
      </div>
    </div>
  );
}

// Extract Admin Overview to its own component for cleaner code
function AdminOverview({ user }: { user: any }) {
  const [stats, setStats] = useState<Stats>({
    totalWithdrawalAmount: 0,
    totalClaimAmount: 0,
    pendingApprovals: 0,
    successCount: 0,
    rejectedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [withdrawalsRes, claimsRes] = await Promise.all([
          getWithdrawals(), getFuelClaims()
        ]);
        const withdrawals = withdrawalsRes.data;
        const claims = claimsRes.data;

        const pendingW = withdrawals.filter((w: any) => w.status === 'Pending' || w.status === 'ApprovedByManager').length;
        const pendingC = claims.filter((c: any) => c.status === 'Pending' || c.status === 'ApprovedByManager').length;
        const successW = withdrawals.filter((w: any) => w.status === 'ApprovedByFinance').length;
        const successC = claims.filter((c: any) => c.status === 'ApprovedByFinance').length;
        const rejectedW = withdrawals.filter((w: any) => w.status === 'Rejected').length;
        const rejectedC = claims.filter((c: any) => c.status === 'Rejected').length;
        const amountW = withdrawals.filter((w: any) => w.status === 'ApprovedByFinance').reduce((sum: number, w: any) => sum + w.amount, 0);
        const amountC = claims.filter((c: any) => c.status === 'ApprovedByFinance').reduce((sum: number, c: any) => sum + c.claimAmount, 0);

        setStats({
          totalWithdrawalAmount: amountW,
          totalClaimAmount: amountC,
          pendingApprovals: pendingW + pendingC,
          successCount: successW + successC,
          rejectedCount: rejectedW + rejectedC,
        });
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'ยอดเบิกเงินสะสม', value: `฿${stats.totalWithdrawalAmount.toLocaleString()}`, sub: 'เฉพาะรายการที่อนุมัติสำเร็จ', icon: Wallet, color: 'text-blue-400', iconBg: 'bg-blue-400/10' },
    { label: 'ยอดเคลมน้ำมันสะสม', value: `฿${stats.totalClaimAmount.toLocaleString()}`, sub: 'เฉพาะรายการที่อนุมัติสำเร็จ', icon: Fuel, color: 'text-emerald-400', iconBg: 'bg-emerald-400/10' },
    { label: 'รายการรออนุมัติ', value: stats.pendingApprovals, sub: 'รอ Manager / Finance', icon: Clock, color: 'text-amber-400', iconBg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 border border-slate-700/50">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">สวัสดี, {user?.fullName} 👋</h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            ระบบจัดการค่าน้ำมันและค่าเบิกจ่ายในฐานะ <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-purple-400">ผู้ดูแลระบบ</span>
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card p-8 animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-2xl mb-6" />
              <div className="h-8 bg-slate-700 rounded mb-4 w-3/4" />
            </div>
          ))
        ) : (
          statCards.map((card) => (
            <div key={card.label} className="card p-8 group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <div className="h-10 w-24 bg-slate-800/50 rounded-full border border-slate-700/50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                  <span className="text-xs font-bold text-emerald-400">+12%</span>
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1">{card.label}</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{card.value}</h3>
              <div className="mt-4 flex items-center text-xs text-slate-500"><AlertCircle className="w-3 h-3 mr-1" />{card.sub}</div>
              <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${card.color.replace('text-', 'bg-')}/5 rounded-full blur-2xl`} />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-8">
          <h2 className="text-xl font-bold text-white mb-8">สรุปสถานะการอนุมัติ</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
                <div><p className="text-sm font-bold text-emerald-400">อนุมัติสำเร็จ</p></div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.successCount}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-amber-400" /></div>
                <div><p className="text-sm font-bold text-amber-400">รอดำเนินการ</p></div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center"><XCircle className="w-5 h-5 text-red-400" /></div>
                <div><p className="text-sm font-bold text-red-400">ถูกปฏิเสธ</p></div>
              </div>
              <span className="text-2xl font-bold text-white">{stats.rejectedCount}</span>
            </div>
          </div>
        </div>
        <div className="card p-8 bg-gradient-to-br from-primary-600/10 to-transparent border-primary-500/20 relative overflow-hidden group">
          <h2 className="text-xl font-bold text-white mb-2">ข้อมูลเชิงลึกระบบเบิกจ่าย</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">สถิติการใช้งานและการอนุมัติรายการค่าน้ำมันรถและเงินทดลองจ่ายภายในองค์กร อัปเดตล่าสุด ณ วันนี้</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50"><p className="text-xs text-slate-500 mb-1 font-medium">อัตราการอนุมัติ</p><p className="text-2xl font-bold text-white">92.4%</p></div>
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50"><p className="text-xs text-slate-500 mb-1 font-medium">ความรวดเร็วเฉลี่ย</p><p className="text-2xl font-bold text-white">2.4 ชม.</p></div>
          </div>
          <button className="w-full mt-8 btn-primary justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all">ดูรายงานละเอียด <FileText className="w-4 h-4" /></button>
          <Fuel className="absolute -right-8 -bottom-8 w-40 h-40 text-primary-500/5 rotate-12" />
        </div>
      </div>
    </div>
  );
}
