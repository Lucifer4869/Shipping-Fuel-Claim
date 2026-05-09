import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getShipments, getWithdrawals, getFuelClaims, completeShipment } from '../../lib/api';
import { Truck, MapPin, Navigation, Banknote, Fuel, Clock, CheckCircle, XCircle, Eye, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import RequestDetailModal from './RequestDetailModal';
import toast from 'react-hot-toast';

interface DriverDashboardProps {
  viewMode?: 'personal' | 'all';
}

export default function DriverDashboard({ viewMode = 'personal' }: DriverDashboardProps) {
  const { user: currentUser } = useAuth();
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [shipmentsRes, withdrawalsRes, claimsRes] = await Promise.all([
        getShipments(),
        getWithdrawals(),
        getFuelClaims()
      ]);

      let shipments = shipmentsRes.data;
      let withdrawals = withdrawalsRes.data;
      let claims = claimsRes.data;

      if (viewMode === 'personal') {
        shipments = shipments.filter((s: any) => s.driverId === currentUser?.userId);
        withdrawals = withdrawals.filter((w: any) => w.driverId === currentUser?.userId);
        claims = claims.filter((c: any) => c.driverId === currentUser?.userId);
      }

      const active = shipments.filter((s: any) => s.status === 'Active');
      setActiveShipments(active);

      const wItems = withdrawals.map((w: any) => ({
        ...w,
        type: 'Withdrawal',
        title: 'เบิกเงิน',
        date: new Date(w.createdAt),
        amountDisplay: `฿${w.amount.toLocaleString()}`,
      }));

      const cItems = claims.map((c: any) => ({
        ...c,
        type: 'FuelClaim',
        title: 'เคลมน้ำมัน',
        date: new Date(c.createdAt),
        amountDisplay: `฿${c.claimAmount.toLocaleString()}`,
      }));

      const combined = [...wItems, ...cItems]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, viewMode === 'all' ? 10 : 5);

      setRecentItems(combined);
    } catch (error) {
      console.error("Failed to fetch driver data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [viewMode, currentUser?.userId]);

  const handleCompleteShipment = async (s: any) => {
    const mileage = window.prompt(`ยืนยันการปิดงานเลขที่ "${s.tripNumber}"\nกรุณากรอกเลขไมล์เมื่อเสร็จสิ้น:`, s.startMileage.toString());
    if (mileage !== null) {
      try {
        await completeShipment(s.id, parseFloat(mileage));
        toast.success('ปิดงานเรียบร้อยแล้ว');
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาด');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/20"><Clock className="w-3 h-3 mr-1"/> รออนุมัติ</span>;
      case 'ApprovedByManager':
        return <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/20"><Clock className="w-3 h-3 mr-1"/> รอการเงิน</span>;
      case 'ApprovedByFinance':
      case 'Approved':
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
      {/* 1. Header (Only for personal view) */}
      {viewMode === 'personal' && (
        <div className="card p-6 bg-gradient-to-r from-slate-800 to-slate-800/50 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
              <Truck className="w-8 h-8 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{currentUser?.fullName}</h1>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono">ทะเบียน: {currentUser?.vehiclePlate || 'ไม่ระบุ'}</span>
                <span className="text-sm">พนักงานขับรถ</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Active Jobs Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-400" /> 
          {viewMode === 'all' ? 'งานที่กำลังดำเนินการทั้งหมด' : 'งานปัจจุบัน'}
        </h2>
        
        {activeShipments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeShipments.map(shipment => (
              <div key={shipment.id} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="font-mono text-primary-400 font-bold bg-primary-500/10 px-3 py-1 rounded-lg border border-primary-500/20 mr-3">
                        {shipment.tripNumber}
                      </span>
                      {viewMode === 'all' && (
                        <span className="text-sm text-slate-300 font-medium">โดย: {shipment.driverName}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Active</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1"><MapPin className="w-4 h-4 text-emerald-400" /></div>
                      <p className="text-sm text-slate-300">{shipment.origin} → {shipment.destination}</p>
                    </div>

                    {/* Complete Button */}
                    {viewMode === 'personal' && (
                      <button
                        onClick={() => handleCompleteShipment(shipment)}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all font-bold text-sm"
                      >
                        <CheckSquare className="w-4 h-4" />
                        ปิดงาน (เสร็จสิ้น)
                      </button>
                    )}
                  </div>
                </div>
                <Truck className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 group-hover:text-primary-500/10 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            <p className="text-slate-400 mb-2 font-medium">ไม่มีงานที่พนักงานกำลังดำเนินการอยู่ในขณะนี้</p>
            {viewMode === 'all' && (
              <Link to="/shipments" className="text-primary-400 hover:text-primary-300 text-sm font-bold flex items-center justify-center gap-1">
                ไปที่หน้ารายการเดินรถทั้งหมด <Navigation className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 3. Action Buttons (Only for personal view) */}
      {viewMode === 'personal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/withdrawals" className="card p-6 flex items-center justify-between group hover:border-amber-500/50 transition-all bg-gradient-to-br from-slate-800 to-amber-900/10">
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
          <Link to="/claims" className="card p-6 flex items-center justify-between group hover:border-emerald-500/50 transition-all bg-gradient-to-br from-slate-800 to-emerald-900/10">
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
      )}

      {/* 4. Recent Items Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="font-semibold text-white">รายการล่าสุด{viewMode === 'all' ? 'ของทุกคน' : ''}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="table-header text-left">ประเภท</th>
                {viewMode === 'all' && <th className="table-header text-left">คนขับ</th>}
                <th className="table-header text-left">เลขที่เดินรถ</th>
                <th className="table-header text-left">จำนวนเงิน</th>
                <th className="table-header text-left">สถานะ</th>
                <th className="table-header text-left">วันที่</th>
                <th className="table-header text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {recentItems.length > 0 ? (
                recentItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 group">
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
                    {viewMode === 'all' && (
                      <td className="table-cell text-sm text-slate-300 font-medium">{item.driverName}</td>
                    )}
                    <td className="table-cell font-mono text-xs text-slate-400">{item.tripNumber}</td>
                    <td className="table-cell font-semibold text-white">{item.amountDisplay}</td>
                    <td className="table-cell">{getStatusBadge(item.status)}</td>
                    <td className="table-cell text-xs text-slate-400">{item.date.toLocaleDateString('th-TH')}</td>
                    <td className="table-cell text-right">
                      <button 
                        onClick={() => setSelectedRequest(item)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={viewMode === 'all' ? 7 : 6} className="py-8 text-center text-slate-500">
                    ไม่มีรายการล่าสุด
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shared Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal 
          item={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
        />
      )}
    </div>
  );
}
