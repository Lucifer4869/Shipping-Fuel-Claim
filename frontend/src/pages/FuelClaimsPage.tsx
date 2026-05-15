import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFuelClaims, createFuelClaim, managerApproveFuelClaim, financeApproveFuelClaim, getShipments, deleteFuelClaim, uploadFile, getImageUrl } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Fuel, Clock, CheckCircle, XCircle, X, Trash2, Search, Filter, Eye, FileText, ImageIcon } from 'lucide-react';
import RequestDetailModal from '../components/dashboard/RequestDetailModal';

interface FuelClaim {
  id: number; claimNumber: string; shipmentId: number; tripNumber: string; driverName: string; vehiclePlate: string;
  claimAmount: number; reason: string; receiptUrl?: string; mileageOut: number; mileageIn: number;
  status: string; origin: string; destination: string;
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

// --- หน้าจัดการการเคลมน้ำมัน (Fuel Claims) ---
// ส่วนนี้ใช้สำหรับส่งคำขอเคลมค่าน้ำมันหลังจบทริป (คนขับ) และอนุมัติการจ่ายเงิน (Manager/Finance)
export default function FuelClaimsPage() {
  const { user } = useAuth();
  
  // State สำหรับเก็บรายการเคลมน้ำมันทั้งหมด
  const [claims, setClaims] = useState<FuelClaim[]>([]);
  // State สำหรับเก็บรายการเดินรถ (เพื่อเลือกผูกกับรายการเคลม)
  const [shipments, setShipments] = useState<Shipment[]>([]);
  // State สถานะการโหลด
  const [loading, setLoading] = useState(true);
  
  // State ควบคุมหน้าต่างป๊อปอัพ (เพิ่ม/อนุมัติ/ดูรายละเอียด)
  const [showModal, setShowModal] = useState(false);
  const [approveModal, setApproveModal] = useState<{ id: number; type: 'manager' | 'finance' } | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<FuelClaim | null>(null);
  
  // State สำหรับค้นหาและกรองข้อมูล
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State สำหรับเก็บข้อมูลในฟอร์มเคลมน้ำมัน (รวมถึงเลขไมล์และรูปใบเสร็จ)
  const [form, setForm] = useState({ shipmentId: '', claimAmount: '', reason: '', mileageOut: '', mileageIn: '', receiptUrl: '' });
  // State สำหรับหมายเหตุการอนุมัติ
  const [note, setNote] = useState('');
  // State สถานะการส่งข้อมูลและอัปโหลดรูป
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const [cRes, sRes] = await Promise.all([getFuelClaims(), getShipments()]);
      setClaims(cRes.data);
      setShipments(sRes.data.filter((s: any) => s.status === 'Active'));
    } catch { 
      toast.error('ไม่สามารถโหลดข้อมูลได้'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB');
      return;
    }

    // Validate File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('อนุญาตเฉพาะไฟล์รูปภาพ (JPG, PNG) หรือ PDF เท่านั้น');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFile(file);
      setForm({ ...form, receiptUrl: res.data.url });
      toast.success('อัปโหลดรูปภาพสำเร็จ');
    } catch {
      toast.error('อัปโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!form.shipmentId || !form.claimAmount || !form.reason || !form.mileageOut || !form.mileageIn) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      setSubmitting(false);
      return;
    }

    const amount = parseFloat(form.claimAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('ใส่จำนวนเงินไม่ถูกต้อง');
      setSubmitting(false);
      return;
    }

    const outMile = parseFloat(form.mileageOut);
    const inMile = parseFloat(form.mileageIn);
    if (isNaN(outMile) || isNaN(inMile) || outMile < 0 || inMile < 0) {
      toast.error('เลขไมล์ต้องเป็นตัวเลขที่ถูกต้อง (ไม่ติดลบ)');
      setSubmitting(false);
      return;
    }

    if (inMile < outMile) {
      toast.error('เลขไมล์ขากลับต้องไม่น้อยกว่าเลขไมล์ขาไป');
      setSubmitting(false);
      return;
    }

    try {
      await createFuelClaim({
        shipmentId: parseInt(form.shipmentId),
        claimAmount: parseFloat(form.claimAmount),
        reason: form.reason,
        mileageOut: parseFloat(form.mileageOut),
        mileageIn: parseFloat(form.mileageIn),
        receiptUrl: form.receiptUrl
      });
      toast.success('ส่งคำขอเคลมน้ำมันสำเร็จ!');
      setShowModal(false);
      setForm({ shipmentId: '', claimAmount: '', reason: '', mileageOut: '', mileageIn: '', receiptUrl: '' });
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
        await managerApproveFuelClaim(approveModal.id, { isApproved, note });
      } else {
        await financeApproveFuelClaim(approveModal.id, { isApproved, note });
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      await deleteFuelClaim(id);
      toast.success('ลบรายการเรียบร้อย');
      fetchData();
    } catch {
      toast.error('ลบไม่สำเร็จ');
    }
  };

  const filtered = claims.filter(c => {
    const matchesSearch = 
      c.tripNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Fuel className="w-7 h-7 text-emerald-400" /> เคลมน้ำมัน
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">ตรวจสอบและจัดการรายการเคลมน้ำมัน</p>
        </div>
        {user?.role === 'Driver' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> เคลมน้ำมัน
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
                {['ID', 'เลขที่เดินรถ', 'คนขับ', 'จำนวนเงิน', 'เหตุผล', 'ระยะทาง', 'สถานะ', 'วันที่', ''].map(h => (
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
                filtered.map(c => {
                  const status = statusConfig[c.status] || { label: c.status, cls: 'bg-slate-800 text-slate-400', icon: Clock };
                  const StatusIcon = status.icon;
                  return (
                    <tr key={c.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="table-cell">
                        <span className="text-xs font-bold text-slate-500 font-mono">{c.claimNumber}</span>
                      </td>
                      <td className="table-cell"><span className="font-mono text-primary-400 font-bold">{c.tripNumber}</span></td>
                      <td className="table-cell">
                        <p className="text-slate-200 text-sm">{c.driverName}</p>
                        <p className="text-[10px] text-slate-500">{c.vehiclePlate}</p>
                      </td>
                      <td className="table-cell"><span className="font-bold text-white text-lg">฿{c.claimAmount.toLocaleString()}</span></td>
                      <td className="table-cell text-slate-400 text-sm max-w-[150px] truncate" title={c.reason}>{c.reason}</td>
                      <td className="table-cell">
                        <div className="text-xs text-slate-400">
                           {c.mileageIn - c.mileageOut} กม.
                           <span className="block text-[10px] opacity-50">({c.mileageOut} → {c.mileageIn})</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge flex items-center gap-1.5 w-fit ${status.cls}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="table-cell text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString('th-TH')}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedRequest(c)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors" title="ดูรายละเอียด">
                            <Eye className="w-4 h-4" />
                          </button>
                          {(user?.role === 'Manager' || user?.role === 'Admin') && c.status === 'Pending' && (
                            <button onClick={() => setApproveModal({ id: c.id, type: 'manager' })} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-colors" title="อนุมัติ/ปฏิเสธ">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {(user?.role === 'Finance' || user?.role === 'Admin') && c.status === 'ApprovedByManager' && (
                            <button onClick={() => setApproveModal({ id: c.id, type: 'finance' })} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors" title="ยืนยันการจ่ายเงิน">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'Admin' && (
                            <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors" title="ลบรายการ">
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
          <div className="card w-full max-w-md p-6 animate-slideIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">เคลมน้ำมัน</h3>
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
                <input type="number" className="input-field" placeholder="0.00" value={form.claimAmount}
                  onChange={e => setForm({ ...form, claimAmount: e.target.value })} required />
              </div>
              <div>
                <label className="label">เหตุผลในการเคลม</label>
                <textarea className="input-field min-h-[80px]" placeholder="ระบุเหตุผล เช่น เติมน้ำมันระหว่างทาง, ล้างรถ ฯลฯ" value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">เลขไมล์ขาไป</label>
                  <input type="number" className="input-field" value={form.mileageOut}
                    onChange={e => setForm({ ...form, mileageOut: e.target.value })} required />
                </div>
                <div>
                  <label className="label">เลขไมล์ขากลับ</label>
                  <input type="number" className="input-field" value={form.mileageIn}
                    onChange={e => setForm({ ...form, mileageIn: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">หลักฐานใบเสร็จ</label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="flex-1 relative">
                    <div className="relative group">
                      <div className="input-field py-8 border-dashed border-2 flex flex-col items-center justify-center gap-2 group-hover:border-primary-500 transition-colors cursor-pointer" 
                           onClick={() => !form.receiptUrl && document.getElementById('receipt-upload')?.click()}>
                        {uploading ? (
                          <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                        ) : form.receiptUrl ? (
                          <div className="relative">
                            <img src={getImageUrl(form.receiptUrl)} alt="Preview" className="h-24 object-contain rounded-lg shadow-lg border border-slate-700" />
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setForm({ ...form, receiptUrl: '' });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-slate-500" />
                            <span className="text-xs text-slate-500">คลิกเพื่ออัปโหลดใบเสร็จ</span>
                          </>
                        )}
                      </div>
                      <input id="receipt-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button type="submit" disabled={submitting || uploading} className="btn-primary flex-1 justify-center">
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
