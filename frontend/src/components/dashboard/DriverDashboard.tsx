import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getShipments, getWithdrawals, getFuelClaims } from '../../lib/api';
import { Truck, MapPin, Navigation, Banknote, Fuel, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [activeShipment, setActiveShipment] = useState<any>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipmentsRes, withdrawalsRes, claimsRes] = await Promise.all([
          getShipments(),
          getWithdrawals(),
          getFuelClaims()
        ]);

        // Get current active shipment
        const active = shipmentsRes.data.find((s: any) => s.status === 'Active');
        setActiveShipment(active || null);

        // Combine withdrawals and claims for recent items
        const withdrawals = withdrawalsRes.data.map((w: any) => ({
          ...w,
          type: 'Withdrawal',
          title: 'เบิกเงิน',
          date: new Date(w.createdAt),
          amountDisplay: `฿${w.amount.toLocaleString()}`,
        }));

        const claims = claimsRes.data.map((c: any) => ({
          ...c,
          type: 'FuelClaim',
          title: 'เคลมน้ำมัน',
          date: new Date(c.createdAt),
          amountDisplay: `฿${c.claimAmount.toLocaleString()}`,
        }));

        const combined = [...withdrawals, ...claims]
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5); // Take latest 5

        setRecentItems(combined);
      } catch (error) {
        console.error("Failed to fetch driver data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3 mr-1"/> รออนุมัติ</span>;
      case 'ApprovedByManager':
        return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3 mr-1"/> รอการเงิน</span>;
      case 'ApprovedByFinance':
      case 'Approved': // Fallback if some APIs still return Approved
      case 'Paid':
        return <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"><CheckCircle className="w-3 h-3 mr-1"/> สำเร็จ</span>;
      case 'Rejected':
        return <span className="badge bg-red-500/20 text-red-400 border border-red-500/20"><XCircle className="w-3 h-3 mr-1"/> ปฏิเสธ</span>;
      default:
        return <span className="badge bg-slate-500/20 text-slate-400">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <div className="card p-6 bg-gradient-to-r from-slate-800 to-slate-800/50 border-l-4 border-l-primary-500">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
            <Truck className="w-8 h-8 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.fullName}</h1>
            <p className="text-slate-400 flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono">ทะเบียน: {user?.vehiclePlate || 'ไม่ระบุ'}</span>
              <span className="text-sm">พนักงานขับรถ</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Current Job Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-400" /> งานปัจจุบัน
        </h2>
        {activeShipment ? (
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Truck className="w-24 h-24" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-primary-400 font-bold bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20">
                  {activeShipment.tripNumber}
                </span>
                <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">กำลังดำเนินการ</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1"><MapPin className="w-5 h-5 text-emerald-400" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">จุดรับสินค้า</p>
                    <p className="text-sm text-slate-200">{activeShipment.origin}</p>
                  </div>
                </div>
                <div className="ml-2.5 w-0.5 h-6 bg-slate-700 rounded-full" />
                <div className="flex items-start gap-3">
                  <div className="mt-1"><MapPin className="w-5 h-5 text-red-400" /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">จุดส่งสินค้า</p>
                    <p className="text-sm text-slate-200">{activeShipment.destination}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            <p className="text-slate-400">ไม่มีงานที่กำลังดำเนินการ</p>
          </div>
        )}
      </div>

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/withdrawals" className="card p-6 flex items-center justify-between group hover:border-amber-500/50 transition-all cursor-pointer bg-gradient-to-br from-slate-800 to-amber-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">ขอเบิกเงิน</h3>
              <p className="text-xs text-slate-400">เบิกเงินทดลองจ่ายสำหรับการเดินทาง</p>
            </div>
          </div>
        </Link>
        <Link to="/claims" className="card p-6 flex items-center justify-between group hover:border-emerald-500/50 transition-all cursor-pointer bg-gradient-to-br from-slate-800 to-emerald-900/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Fuel className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">เคลมค่าน้ำมัน</h3>
              <p className="text-xs text-slate-400">ส่งบิลเคลมค่าน้ำมันหลังจบงาน</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 4. Recent Items Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50">
          <h2 className="font-semibold text-white">รายการล่าสุด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="table-header text-left">ประเภท</th>
                <th className="table-header text-left">เลขที่เดินรถ</th>
                <th className="table-header text-left">จำนวนเงิน</th>
                <th className="table-header text-left">สถานะ</th>
                <th className="table-header text-left">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentItems.length > 0 ? (
                recentItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {item.type === 'Withdrawal' ? (
                          <Banknote className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Fuel className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="text-sm text-slate-300">{item.title}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">{item.tripNumber}</td>
                    <td className="table-cell font-semibold text-white">{item.amountDisplay}</td>
                    <td className="table-cell">{getStatusBadge(item.status)}</td>
                    <td className="table-cell text-xs text-slate-400">{item.date.toLocaleDateString('th-TH')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    ไม่มีรายการล่าสุด
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
