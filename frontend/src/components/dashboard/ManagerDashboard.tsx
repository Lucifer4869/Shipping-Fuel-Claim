import { useEffect, useState } from 'react';
import { getWithdrawals, getFuelClaims, managerApproveFuelClaim, managerApproveWithdrawal, getImageUrl } from '../../lib/api';
import { CheckCircle, XCircle, FileText, Banknote, Fuel, Search, X, Image as ImageIcon, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ pendingClaims: 0, totalAmount: 0, pendingWithdrawals: 0 });
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [wRes, cRes] = await Promise.all([getWithdrawals(), getFuelClaims()]);
      
      const withdrawals = wRes.data.map((w: any) => ({
        ...w, type: 'Withdrawal', title: 'เบิกเงิน', amount: w.amount, date: new Date(w.createdAt)
      }));
      
      const claims = cRes.data.map((c: any) => ({
        ...c, type: 'FuelClaim', title: 'เคลมน้ำมัน', amount: c.claimAmount, date: new Date(c.createdAt)
      }));

      // Filter only Pending
      const pendingW = withdrawals.filter((i: any) => i.status === 'Pending');
      const pendingC = claims.filter((i: any) => i.status === 'Pending');
      
      const combined = [...pendingW, ...pendingC].sort((a, b) => b.date.getTime() - a.date.getTime());
      
      const totalAmt = combined.reduce((sum, item) => sum + item.amount, 0);

      setPendingItems(combined);
      setStats({
        pendingClaims: pendingC.length,
        pendingWithdrawals: pendingW.length,
        totalAmount: totalAmt
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredItems = pendingItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.driverName?.toLowerCase().includes(term)) ||
           (item.tripNumber?.toLowerCase().includes(term)) ||
           (item.vehiclePlate?.toLowerCase().includes(term));
  });

  const handleActionClick = (item: any, type: 'approve' | 'reject') => {
    setSelectedItem(item);
    setActionType(type);
    setRemark('');
  };

  const submitAction = async () => {
    if (!selectedItem || !actionType) return;
    setSubmitting(true);
    const isApprove = actionType === 'approve';
    try {
      if (selectedItem.type === 'Withdrawal') {
        await managerApproveWithdrawal(selectedItem.id, { isApproved: isApprove, note: remark });
      } else {
        await managerApproveFuelClaim(selectedItem.id, { isApproved: isApprove, note: remark });
      }
      toast.success(isApprove ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธเรียบร้อย');
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
        <p className="text-slate-400">จัดการอนุมัติการเบิกเงินและเคลมน้ำมัน</p>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-slate-400 text-sm font-medium mb-1">เคลมน้ำมันรออนุมัติ</p>
              <h3 className="text-3xl font-bold text-white">{stats.pendingClaims} <span className="text-sm font-normal text-slate-500">รายการ</span></h3>
              <div className="mt-3 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform"><Fuel className="w-6 h-6 text-emerald-400" /></div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-l-amber-500 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-slate-400 text-sm font-medium mb-1">เบิกเงินรออนุมัติ</p>
              <h3 className="text-3xl font-bold text-white">{stats.pendingWithdrawals} <span className="text-sm font-normal text-slate-500">รายการ</span></h3>
              <div className="mt-3 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform"><Banknote className="w-6 h-6 text-amber-400" /></div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-slate-800 to-blue-900/10 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-blue-300 text-sm font-medium mb-1">ยอดเงินรวมที่รออนุมัติ</p>
              <h3 className="text-3xl font-bold text-white">฿{stats.totalAmount.toLocaleString()}</h3>
              <div className="mt-3 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-blue-400" /></div>
          </div>
        </div>
      </div>

      {/* 2. Table of Pending Items */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="font-semibold text-white text-lg">รายการรอการอนุมัติ</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาคนขับ, ทะเบียน..." 
              className="input-field pl-9 py-1.5 text-sm w-64" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="table-header text-left">ประเภท</th>
                <th className="table-header text-left">ชื่อคนขับ</th>
                <th className="table-header text-left">เลขเดินรถ/ทะเบียน</th>
                <th className="table-header text-right">จำนวนเงิน</th>
                <th className="table-header text-center">วันที่</th>
                <th className="table-header text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-800/30">
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${item.type === 'Withdrawal' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {item.type === 'Withdrawal' ? <Banknote className="w-3.5 h-3.5" /> : <Fuel className="w-3.5 h-3.5" />}
                        {item.title}
                      </span>
                    </td>
                    <td className="table-cell text-slate-200">{item.driverName}</td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-slate-400">{item.tripNumber}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{item.vehiclePlate}</span>
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-white text-right">฿{item.amount.toLocaleString()}</td>
                    <td className="table-cell text-xs text-slate-400 text-center">{item.date.toLocaleDateString('th-TH')}</td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleActionClick(item, 'approve')} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="อนุมัติ">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleActionClick(item, 'reject')} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors" title="ปฏิเสธ">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">ไม่มีรายการรออนุมัติ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Action Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-0 overflow-hidden animate-slideIn max-h-[90vh] flex flex-col">
            <div className={`p-4 border-b border-slate-700/50 flex justify-between items-center shrink-0 ${actionType === 'approve' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 ${actionType === 'approve' ? 'text-emerald-400' : 'text-red-400'}`}>
                {actionType === 'approve' ? <CheckCircle className="w-5 h-5"/> : <XCircle className="w-5 h-5"/>}
                {actionType === 'approve' ? 'ยืนยันการอนุมัติ' : 'ปฏิเสธรายการ'}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Context Info */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ข้อมูลคำร้อง</p>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">ผู้ขอเบิก:</span>
                    <span className="text-white font-medium">{selectedItem.driverName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400 text-sm">ประเภท:</span>
                    <span className="text-white">{selectedItem.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">จำนวนเงิน:</span>
                    <span className="text-xl font-bold text-emerald-400">฿{selectedItem.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipment Details (The Link to Current Work) */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">รายละเอียดงานเดินรถปัจจุบัน</p>
                <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Trip Number</p>
                      <p className="text-sm font-mono text-blue-400">{selectedItem.tripNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">ทะเบียนรถ</p>
                      <p className="text-sm font-bold text-slate-300">{selectedItem.vehiclePlate}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">เส้นทาง</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{selectedItem.origin}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-sm text-white">{selectedItem.destination}</span>
                    </div>
                  </div>
                  {selectedItem.type === 'FuelClaim' && (
                    <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">เลขไมล์ขาไป</p>
                        <p className="text-sm text-slate-300">{selectedItem.mileageOut.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase">เลขไมล์ขากลับ</p>
                        <p className="text-sm text-slate-300">{selectedItem.mileageIn.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedItem.type === 'FuelClaim' && selectedItem.receiptUrl && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ImageIcon className="w-4 h-4"/> รูปหลักฐานใบเสร็จ</label>
                  <div className="bg-slate-800 rounded-lg p-2 border border-slate-700 flex justify-center">
                    <img src={getImageUrl(selectedItem.receiptUrl)} alt="Receipt" className="max-h-48 rounded object-contain" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">หมายเหตุ (Remark)</label>
                <textarea 
                  className="input-field resize-none w-full" 
                  rows={3} 
                  placeholder={actionType === 'approve' ? "ใส่ข้อความเพิ่มเติม (ไม่บังคับ)..." : "ระบุเหตุผลที่ปฏิเสธ..."}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  required={actionType === 'reject'}
                />
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button onClick={() => setSelectedItem(null)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button 
                  onClick={submitAction} 
                  disabled={submitting || (actionType === 'reject' && !remark)} 
                  className={`flex-1 justify-center ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                >
                  {submitting ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
