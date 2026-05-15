import { useEffect, useState } from 'react';
import { getWithdrawals, getFuelClaims, financeApproveFuelClaim, financeApproveWithdrawal } from '../../lib/api';
import { Banknote, CheckCircle, Search, Clock, FileText, Fuel, X, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinanceDashboard() {
  const [awaitingItems, setAwaitingItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, awaitingPaymentCount: 0, awaitingPaymentAmount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [remark, setRemark] = useState('');

  const fetchData = async () => {
    try {
      const [wRes, cRes] = await Promise.all([getWithdrawals(), getFuelClaims()]);
      
      const withdrawals = wRes.data.map((w: any) => ({
        ...w, type: 'Withdrawal', title: 'เบิกเงิน', amount: w.amount, date: new Date(w.createdAt)
      }));
      
      const claims = cRes.data.map((c: any) => ({
        ...c, type: 'FuelClaim', title: 'เคลมน้ำมัน', amount: c.claimAmount, date: new Date(c.createdAt)
      }));

      const allItems = [...withdrawals, ...claims];
      
      // Calculate Total Paid (ApprovedByFinance)
      const totalPaid = allItems
        .filter(i => i.status === 'ApprovedByFinance')
        .reduce((sum, item) => sum + item.amount, 0);

      // Awaiting Payment (ApprovedByManager)
      const awaiting = allItems
        .filter(i => i.status === 'ApprovedByManager')
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const awaitingAmt = awaiting.reduce((sum, item) => sum + item.amount, 0);

      setAwaitingItems(awaiting);
      setStats({
        totalPaid,
        awaitingPaymentCount: awaiting.length,
        awaitingPaymentAmount: awaitingAmt
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleActionClick = (item: any) => {
    setSelectedItem(item);
    setRemark('จ่ายเงินเรียบร้อย');
  };

  const submitAction = async () => {
    if (!selectedItem) return;
    const uniqueId = `${selectedItem.type}-${selectedItem.id}`;
    setSubmittingId(uniqueId);
    try {
      if (selectedItem.type === 'Withdrawal') {
        await financeApproveWithdrawal(selectedItem.id, { isApproved: true, note: remark });
      } else {
        await financeApproveFuelClaim(selectedItem.id, { isApproved: true, note: remark });
      }
      toast.success('บันทึกการจ่ายเงินเรียบร้อย');
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredItems = awaitingItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.driverName?.toLowerCase().includes(term)) ||
           (item.tripNumber?.toLowerCase().includes(term)) ||
           (item.vehiclePlate?.toLowerCase().includes(term));
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
        <p className="text-slate-400">ระบบจัดการการจ่ายเงิน (เบิกเงิน / เคลมน้ำมัน)</p>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-slate-800 to-blue-900/10 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-blue-300 text-sm font-medium mb-1">ยอดรวมเงินที่จ่ายแล้ว (Total Paid)</p>
              <h3 className="text-4xl font-bold text-white">฿{stats.totalPaid.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-1.5 py-1 px-3 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold w-fit border border-blue-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% จากเดือนก่อน</span>
              </div>
            </div>
            <div className="p-4 bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform"><Banknote className="w-8 h-8 text-blue-400" /></div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-slate-800 to-amber-900/10 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="z-10">
              <p className="text-amber-300 text-sm font-medium mb-1">รายการที่รอจ่าย (Awaiting Payment)</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-bold text-white">฿{stats.awaitingPaymentAmount.toLocaleString()}</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">{stats.awaitingPaymentCount} รายการ</span>
              </div>
              <div className="mt-4 flex items-center gap-1.5 py-1 px-3 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold w-fit border border-amber-500/20">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+5.2% ค้างจ่ายเพิ่มขึ้น</span>
              </div>
            </div>
            <div className="p-4 bg-amber-500/20 rounded-2xl group-hover:scale-110 transition-transform"><Clock className="w-8 h-8 text-amber-400" /></div>
          </div>
        </div>
      </div>

      {/* 2 & 4. Table and Search */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="font-semibold text-white text-lg">รายการรอจ่ายเงิน</h2>
            <p className="text-xs text-slate-400">เฉพาะรายการที่ผ่านการอนุมัติจาก Manager แล้ว</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="ค้นหาคนขับ, ทะเบียนรถ, ทริป..." 
              className="input-field pl-9 py-2 text-sm w-full md:w-80"
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
                <th className="table-header text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const uniqueId = `${item.type}-${item.id}`;
                  const isSubmitting = submittingId === uniqueId;
                  
                  return (
                    <tr key={uniqueId} className="hover:bg-slate-800/30">
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${item.type === 'Withdrawal' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {item.type === 'Withdrawal' ? <FileText className="w-3.5 h-3.5" /> : <Fuel className="w-3.5 h-3.5" />}
                          {item.title}
                        </span>
                      </td>
                      <td className="table-cell text-slate-200 font-medium">{item.driverName}</td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-slate-400">{item.tripNumber}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{item.vehiclePlate}</span>
                        </div>
                      </td>
                      <td className="table-cell font-bold text-white text-right text-lg">฿{item.amount.toLocaleString()}</td>
                      <td className="table-cell text-center">
                        <button 
                          onClick={() => handleActionClick(item)} 
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">ไม่มีรายการรอจ่ายเงิน</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg p-0 overflow-hidden animate-slideIn">
            <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-emerald-500/10">
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-5 h-5"/> ยืนยันการจ่ายเงิน
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400 text-sm">ผู้รับเงิน:</span>
                  <span className="text-white font-medium">{selectedItem.driverName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400 text-sm">ประเภท:</span>
                  <span className="text-white">{selectedItem.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">จำนวนเงินที่ต้องจ่าย:</span>
                  <span className="text-2xl font-bold text-emerald-400">฿{selectedItem.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Shipment Details Context */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ข้อมูลงานที่เกี่ยวข้อง</p>
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
                </div>
              </div>

              {selectedItem.managerNote && (
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">หมายเหตุจาก Manager ({selectedItem.managerName})</p>
                  <p className="text-sm text-slate-300">{selectedItem.managerNote}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => setSelectedItem(null)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button 
                  onClick={submitAction} 
                  disabled={!!submittingId} 
                  className="btn-success flex-1 justify-center"
                >
                  {submittingId ? 'กำลังดำเนินการ...' : 'ยืนยันการจ่ายเงิน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
