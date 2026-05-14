import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWithdrawals, createWithdrawal, managerApproveWithdrawal, financeApproveWithdrawal, getShipments, deleteWithdrawal } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Wallet, Clock, CheckCircle, XCircle, X, Trash2, Search, Filter, Eye, FileText } from 'lucide-react';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';

interface Withdrawal {
  id: number; withdrawalNumber: string; shipmentId: number; tripNumber: string; driverName: string; vehiclePlate: string;
  amount: number; reason: string; additionalItems?: string; status: string;
  managerName?: string; managerNote?: string; managerApprovedAt?: string;
  financeName?: string; financeNote?: string; financeApprovedAt?: string;
  createdAt: string;
}

interface Shipment { id: number; tripNumber: string; }

const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  Pending: { label: 'รออนุมัติ (M)', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/20', icon: Clock },
  ApprovedByManager: { label: 'รอจ่ายเงิน (F)', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: Clock },
  ApprovedByFinance: { label: 'จ่ายเงินแล้ว', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  Rejected: { label: 'ปฏิเสธ', cls: 'bg-red-500/20 text-red-400 border-red-500/20', icon: XCircle },
};

// --- หน้าจัดการการขอเบิกเงิน (Withdrawals) ---
// ส่วนนี้ใช้สำหรับส่งคำขอเบิกเงินล่วงหน้า (คนขับ) และอนุมัติการเบิกเงิน (Manager/Finance)
export default function WithdrawalsPage() {
  const { user } = useAuth();
  
  // State สำหรับเก็บรายการเบิกเงินทั้งหมด
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  // State สำหรับเก็บรายการเดินรถ (เพื่อเอามาใส่ใน dropdown ตอนขอเบิก)
  const [shipments, setShipments] = useState<Shipment[]>([]);
  // State สถานะการโหลดข้อมูล
  const [loading, setLoading] = useState(true);
  
  // State ควบคุมการแสดงหน้าต่างต่างๆ (เพิ่ม/อนุมัติ/รายละเอียด)
  const [showModal, setShowModal] = useState(false);
  const [approveModal, setApproveModal] = useState<{ id: number; type: 'manager' | 'finance' } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Withdrawal | null>(null);
  
  // State สำหรับการกรองข้อมูล (ค้นหาชื่อ/เลขที่เดินรถ และสถานะ)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State สำหรับเก็บข้อมูลในฟอร์มขอเบิกเงิน
  const [form, setForm] = useState({ shipmentId: '', amount: '', reason: '', additionalItems: '' });
  // State สำหรับบันทึกหมายเหตุตอนอนุมัติ
  const [note, setNote] = useState('');
  // State สถานะกำลังส่งข้อมูล (ป้องกันการกดเบิ้ล)
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [wRes, sRes] = await Promise.all([getWithdrawals(), getShipments()]);
      setWithdrawals(wRes.data);
      setShipments(sRes.data.filter((s: any) => s.status === 'Active'));
    } catch { 
      toast.error('ไม่สามารถโหลดข้อมูลได้'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await deleteWithdrawal(id);
      toast.success('ลบรายการเรียบร้อย');
      fetchData();
    } catch { 
      toast.error('ลบไม่สำเร็จ'); 
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!form.shipmentId || !form.amount || !form.reason) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      setSubmitting(false);
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('จำนวนเงินต้องมากกว่า 0 และรูปแบบถูกต้อง');
      setSubmitting(false);
      return;
    }

    try {
      await createWithdrawal({
        shipmentId: parseInt(form.shipmentId), 
        amount: parseFloat(form.amount),
        reason: form.reason, 
        additionalItems: form.additionalItems || undefined
      });
      toast.success('ส่งรายการขอเบิกเงินสำเร็จ!');
      setShowModal(false);
      setForm({ shipmentId: '', amount: '', reason: '', additionalItems: '' });
      fetchData();
    } catch (err: any) { 
      toast.error(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleApprove = async (isApproved: boolean) => {
    if (!approveModal) return;
    setSubmitting(true);
    try {
      if (approveModal.type === 'manager') {
        await managerApproveWithdrawal(approveModal.id, { isApproved, note });
      } else {
        await financeApproveWithdrawal(approveModal.id, { isApproved, note });
      }
      toast.success(isApproved ? 'อนุมัติเรียบร้อย!' : 'ปฏิเสธเรียบร้อย');
      setApproveModal(null);
      setNote('');
      fetchData();
    } catch { 
      toast.error('ดำเนินการไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = withdrawals.filter(w => {
    const matchesSearch = 
      w.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || w.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-amber-400" /> ขอเบิกเงิน
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">จัดการรายการขอเบิกเงินและตรวจสอบประวัติ</p>
        </div>
        {user?.role === 'Driver' && (
          <button id="new-withdrawal-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> ขอเบิกเงิน
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="ค้นหา เลขที่เดินรถ, ชื่อคนขับ, ทะเบียน..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            className="input-field pl-10 appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">ทุกสถานะ</option>
            <option value="Pending">รออนุมัติ (M)</option>
            <option value="ApprovedByManager">รอจ่ายเงิน (F)</option>
            <option value="ApprovedByFinance">จ่ายเงินแล้ว</option>
            <option value="Rejected">ถูกปฏิเสธ</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-900/50 border-b border-slate-700">
              <tr>
                {['ID', 'เลขที่เดินรถ', 'คนขับ', 'จำนวน', 'เหตุผล', 'สถานะ', 'วันที่', ''].map(h => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-slate-500 py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />ยังไม่มีรายการ
                </td></tr>
              ) : (
                filtered.map(w => {
                  const status = statusConfig[w.status] || { label: w.status, cls: 'bg-slate-800 text-slate-400', icon: Clock };
                  const StatusIcon = status.icon;
                  return (
                    <tr key={w.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="table-cell">
                        <span className="text-xs font-bold text-slate-500 font-mono">{w.withdrawalNumber}</span>
                      </td>
                      <td className="table-cell"><span className="font-mono text-primary-400 font-bold">{w.tripNumber}</span></td>
                      <td className="table-cell">
                        <p className="text-slate-200 text-sm">{w.driverName}</p>
                        <p className="text-[10px] text-slate-500">{w.vehiclePlate}</p>
                      </td>
                      <td className="table-cell"><span className="font-bold text-white text-lg">฿{w.amount.toLocaleString()}</span></td>
                      <td className="table-cell text-slate-400 text-sm max-w-[200px] truncate" title={w.reason}>{w.reason}</td>
                      <td className="table-cell">
                        <span className={`badge flex items-center gap-1.5 w-fit ${status.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-500">{new Date(w.createdAt).toLocaleDateString('th-TH')}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedRequest(w)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="ดูรายละเอียด">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(user?.role === 'Manager' || user?.role === 'Admin') && w.status === 'Pending' && (
                            <button onClick={() => setApproveModal({ id: w.id, type: 'manager' })} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-colors" title="อนุมัติ/ปฏิเสธ">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(user?.role === 'Finance' || user?.role === 'Admin') && w.status === 'ApprovedByManager' && (
                            <button onClick={() => setApproveModal({ id: w.id, type: 'finance' })} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="ยืนยันการจ่ายเงิน">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'Admin' && (
                            <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors" title="ลบรายการ">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slideIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">ขอเบิกเงิน</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">เลขที่เดินรถ (กำลังดำเนินการ)</label>
                <select className="input-field" value={form.shipmentId} onChange={e => setForm({ ...form, shipmentId: e.target.value })} required>
                  <option value="">เลือกเลขที่เดินรถ</option>
                  {shipments.map(s => <option key={s.id} value={s.id}>{s.tripNumber}</option>)}
                </select>
              </div>
              <div>
                <label className="label">จำนวนเงิน (บาท)</label>
                <input type="number" className="input-field" placeholder="0.00" value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <label className="label">เหตุผล</label>
                <textarea className="input-field resize-none" rows={3} placeholder="ระบุเหตุผลการขอเบิก..."
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} required />
              </div>
              <div>
                <label className="label">รายการเพิ่มเติม (ถ้ามี)</label>
                <input className="input-field" placeholder="เช่น ค่าทางด่วน, ค่าที่จอดรถ" value={form.additionalItems}
                  onChange={e => setForm({ ...form, additionalItems: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  ส่งคำขอ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-white mb-4">
              {approveModal.type === 'manager' ? 'Manager' : 'Finance'} — ดำเนินการ
            </h3>
            <div className="mb-4">
              <label className="label">หมายเหตุ (ถ้ามี)</label>
              <textarea className="input-field resize-none" rows={3} value={note}
                onChange={e => setNote(e.target.value)} placeholder="ระบุหมายเหตุ..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApprove(false)} disabled={submitting} className="btn-danger flex-1 justify-center">
                <XCircle className="w-4 h-4" /> ปฏิเสธ
              </button>
              <button onClick={() => handleApprove(true)} disabled={submitting} className="btn-success flex-1 justify-center">
                <CheckCircle className="w-4 h-4" /> อนุมัติ
              </button>
            </div>
            <button onClick={() => { setApproveModal(null); setNote(''); }}
              className="w-full mt-2 text-xs text-slate-500 hover:text-slate-300 text-center">ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  );
}
