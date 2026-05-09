import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFuelClaims, createFuelClaim, managerApproveFuelClaim, financeApproveFuelClaim, getShipments, uploadFile, deleteFuelClaim } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Fuel, CheckCircle, XCircle, X, Route, Upload, Trash2 } from 'lucide-react';

interface FuelClaim {
  id: number; shipmentId: number; tripNumber: string; driverName: string;
  claimAmount: number; receiptUrl?: string; mileageOut: number; mileageIn: number;
  distance: number; status: string; 
  managerName?: string; managerNote?: string; managerApprovedAt?: string;
  financeName?: string; financeNote?: string; financeApprovedAt?: string;
  createdAt: string;
}
interface Shipment { id: number; tripNumber: string; }

const statusConfig: Record<string, { label: string; cls: string }> = {
  Pending: { label: 'รอ Manager อนุมัติ', cls: 'bg-amber-500/20 text-amber-400' },
  ApprovedByManager: { label: 'รอ Finance อนุมัติ', cls: 'bg-blue-500/20 text-blue-400' },
  ApprovedByFinance: { label: 'อนุมัติสำเร็จ', cls: 'bg-emerald-500/20 text-emerald-400' },
  Rejected: { label: 'ถูกปฏิเสธ', cls: 'bg-red-500/20 text-red-400' },
};

export default function FuelClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<FuelClaim[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [approveModal, setApproveModal] = useState<{ id: number; type: 'manager' | 'finance' } | null>(null);
  
  const [form, setForm] = useState({ shipmentId: '', claimAmount: '', mileageOut: '', mileageIn: '' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([getFuelClaims(), getShipments()]);
      setClaims(cRes.data);
      setShipments(sRes.data.filter((s: { status: string }) => s.status === 'Active'));
    } catch { toast.error('ไม่สามารถโหลดข้อมูลได้'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await deleteFuelClaim(id);
      toast.success('ลบรายการเรียบร้อย');
      fetchData();
    } catch { toast.error('ลบไม่สำเร็จ'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(form.mileageIn) <= parseFloat(form.mileageOut)) {
      toast.error('เลขไมล์กลับต้องมากกว่าเลขไมล์ไป'); return;
    }
    setSubmitting(true);
    try {
      let finalReceiptUrl = '';
      if (receiptFile) {
        const uploadRes = await uploadFile(receiptFile);
        finalReceiptUrl = 'http://localhost:5000' + uploadRes.data.url;
      }

      await createFuelClaim({
        shipmentId: parseInt(form.shipmentId), claimAmount: parseFloat(form.claimAmount),
        mileageOut: parseFloat(form.mileageOut), mileageIn: parseFloat(form.mileageIn),
        receiptUrl: finalReceiptUrl || undefined
      });
      toast.success('ส่งรายการเคลมน้ำมันสำเร็จ!');
      setShowModal(false);
      setForm({ shipmentId: '', claimAmount: '', mileageOut: '', mileageIn: '' });
      setReceiptFile(null);
      fetchData();
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    finally { setSubmitting(false); }
  };

  const handleApprove = async (isApproved: boolean) => {
    if (!approveModal) return;
    setSubmitting(true);
    try {
      if (approveModal.type === 'manager') {
        await managerApproveFuelClaim(approveModal.id, { isApproved, note });
      } else {
        await financeApproveFuelClaim(approveModal.id, { isApproved, note });
      }
      toast.success(isApproved ? 'อนุมัติเรียบร้อย!' : 'ปฏิเสธเรียบร้อย');
      setApproveModal(null); setNote('');
      fetchData();
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">เคลมน้ำมัน</h1>
          <p className="text-slate-400 text-sm mt-0.5">จัดการรายการเคลมค่าน้ำมัน</p>
        </div>
        {user?.role === 'Driver' && (
          <button id="new-claim-btn" onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> เคลมน้ำมัน
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-900/50 border-b border-slate-700">
              <tr>
                {['เลขที่เดินรถ', 'คนขับ', 'จำนวน', 'ระยะทาง', 'ใบเสร็จ', 'สถานะ', 'การดำเนินการ'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
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
              ) : claims.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-slate-500 py-12">
                  <Fuel className="w-8 h-8 mx-auto mb-2 opacity-30" />ยังไม่มีรายการ
                </td></tr>
              ) : (
                claims.map(c => (
                  <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell"><span className="font-mono text-primary-400">{c.tripNumber}</span></td>
                    <td className="table-cell text-slate-300">{c.driverName}</td>
                    <td className="table-cell"><span className="font-semibold text-emerald-400">฿{c.claimAmount.toLocaleString()}</span></td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Route className="w-3 h-3" />
                        {(c.mileageIn - c.mileageOut).toLocaleString()} กม.
                      </div>
                    </td>
                    <td className="table-cell">
                      {c.receiptUrl ? (
                        <a href={c.receiptUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-primary-400 hover:text-primary-300 underline">ดูใบเสร็จ</a>
                      ) : <span className="text-xs text-slate-600">-</span>}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusConfig[c.status]?.cls}`}>{statusConfig[c.status]?.label}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {(user?.role === 'Manager' || user?.role === 'Admin') && (
                          <button onClick={() => setApproveModal({ id: c.id, type: 'manager' })}
                            className="btn-primary text-xs py-1 px-3">
                            {c.status === 'Pending' ? 'อนุมัติ/ปฏิเสธ' : 'เปลี่ยนสถานะ (M)'}
                          </button>
                        )}
                        {(user?.role === 'Finance' || user?.role === 'Admin') && (c.status === 'ApprovedByManager' || c.status === 'ApprovedByFinance' || c.status === 'Rejected') && (
                          <button onClick={() => setApproveModal({ id: c.id, type: 'finance' })}
                            className="btn-success text-xs py-1 px-3">
                            {c.status === 'ApprovedByManager' ? 'ยืนยัน (F)' : 'เปลี่ยนสถานะ (F)'}
                          </button>
                        )}
                        {user?.role === 'Admin' && (
                          <button onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors" title="ลบรายการ">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-md p-6 animate-slideIn">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">เคลมน้ำมัน</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">เลขที่เดินรถ</label>
                <select className="input-field" value={form.shipmentId} onChange={e => setForm({ ...form, shipmentId: e.target.value })} required>
                  <option value="">เลือกเลขที่เดินรถ</option>
                  {shipments.map(s => <option key={s.id} value={s.id}>{s.tripNumber}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">เลขไมล์ขาไป</label>
                  <input type="number" className="input-field" placeholder="0" value={form.mileageOut}
                    onChange={e => setForm({ ...form, mileageOut: e.target.value })} required />
                </div>
                <div>
                  <label className="label">เลขไมล์ขากลับ</label>
                  <input type="number" className="input-field" placeholder="0" value={form.mileageIn}
                    onChange={e => setForm({ ...form, mileageIn: e.target.value })} required />
                </div>
              </div>
              {form.mileageOut && form.mileageIn && (
                <div className="bg-emerald-500/10 rounded-xl px-4 py-2 text-sm text-emerald-400">
                  ระยะทาง: {Math.max(0, parseFloat(form.mileageIn) - parseFloat(form.mileageOut)).toLocaleString()} กม.
                </div>
              )}
              <div>
                <label className="label">จำนวนเงินที่เคลม (บาท)</label>
                <input type="number" step="0.01" className="input-field" placeholder="0.00" value={form.claimAmount}
                  onChange={e => setForm({ ...form, claimAmount: e.target.value })} required />
              </div>
              <div>
                <label className="label">อัปโหลดรูปใบเสร็จ (ถ้ามี)</label>
                <div className="relative">
                  <input type="file" accept="image/*" className="hidden" id="receipt-upload"
                    onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                  <label htmlFor="receipt-upload" className="input-field flex items-center justify-between cursor-pointer hover:bg-slate-700/50">
                    <span className={receiptFile ? 'text-emerald-400' : 'text-slate-500'}>
                      {receiptFile ? receiptFile.name : 'คลิกเพื่อเลือกไฟล์รูปภาพ...'}
                    </span>
                    <Upload className="w-4 h-4 text-slate-400" />
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  ส่งรายการ
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
              {approveModal.type === 'manager' ? 'Manager' : 'Finance'} — ดำเนินการเคลมน้ำมัน
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
