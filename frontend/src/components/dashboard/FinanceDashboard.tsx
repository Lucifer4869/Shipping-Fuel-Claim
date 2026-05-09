import { useEffect, useState } from 'react';
import { getWithdrawals, getFuelClaims, financeApproveFuelClaim, financeApproveWithdrawal } from '../../lib/api';
import { Banknote, CheckCircle, Search, Clock, FileText, Fuel } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinanceDashboard() {
  const [awaitingItems, setAwaitingItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPaid: 0, awaitingPaymentCount: 0, awaitingPaymentAmount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

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

  const handleConfirmPayment = async (item: any) => {
    const confirm = window.confirm(`ยืนยันการจ่ายเงินสำหรับ ${item.title} จำนวน ฿${item.amount.toLocaleString()} ใช่หรือไม่?`);
    if (!confirm) return;

    const uniqueId = `${item.type}-${item.id}`;
    setSubmittingId(uniqueId);
    try {
      if (item.type === 'Withdrawal') {
        await financeApproveWithdrawal(item.id, { isApproved: true, note: 'จ่ายเงินเรียบร้อย' });
      } else {
        await financeApproveFuelClaim(item.id, { isApproved: true, note: 'จ่ายเงินเรียบร้อย' });
      }
      toast.success('บันทึกการจ่ายเงินเรียบร้อย');
      fetchData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredItems = awaitingItems.filter(item => {
    const term = searchTerm.toLowerCase();
    return (item.driverName && item.driverName.toLowerCase().includes(term)) ||
           (item.tripNumber && item.tripNumber.toLowerCase().includes(term));
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
        <div className="card p-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-slate-800 to-blue-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">ยอดรวมเงินที่จ่ายแล้ว (Total Paid)</p>
              <h3 className="text-4xl font-bold text-white">฿{stats.totalPaid.toLocaleString()}</h3>
            </div>
            <div className="p-4 bg-blue-500/20 rounded-2xl"><Banknote className="w-8 h-8 text-blue-400" /></div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-slate-800 to-amber-900/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-300 text-sm font-medium mb-1">รายการที่รอจ่าย (Awaiting Payment)</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-bold text-white">฿{stats.awaitingPaymentAmount.toLocaleString()}</h3>
                <span className="text-sm font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">{stats.awaitingPaymentCount} รายการ</span>
              </div>
            </div>
            <div className="p-4 bg-amber-500/20 rounded-2xl"><Clock className="w-8 h-8 text-amber-400" /></div>
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
              placeholder="ค้นหาชื่อคนขับ, ทะเบียนรถ, ทริป..." 
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
                <th className="table-header text-left">เลขเดินรถ</th>
                <th className="table-header text-right">จำนวนเงิน</th>
                <th className="table-header text-center">Manager อนุมัติเมื่อ</th>
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
                      <td className="table-cell">
                        <p className="text-slate-200 font-medium">{item.driverName}</p>
                      </td>
                      <td className="table-cell font-mono text-xs text-slate-400">{item.tripNumber}</td>
                      <td className="table-cell font-bold text-white text-right text-lg">฿{item.amount.toLocaleString()}</td>
                      <td className="table-cell text-xs text-slate-400 text-center">
                        {item.managerApprovedAt ? new Date(item.managerApprovedAt).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="table-cell text-center">
                        <button 
                          onClick={() => handleConfirmPayment(item)} 
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Confirm Payment
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center text-slate-500">
                      <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-lg font-medium">ไม่มีรายการรอจ่ายเงิน</p>
                      {searchTerm && <p className="text-sm mt-1">ไม่พบผลลัพธ์สำหรับการค้นหา "{searchTerm}"</p>}
                    </div>
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
