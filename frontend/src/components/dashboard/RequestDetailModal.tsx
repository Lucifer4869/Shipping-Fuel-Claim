import { X, CheckCircle, XCircle, Clock, Banknote, Fuel, Navigation, MapPin, Truck, Image as ImageIcon } from 'lucide-react';

interface RequestDetailModalProps {
  item: any;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; cls: string; icon: any }> = {
  Pending: { label: 'รออนุมัติ (Manager)', cls: 'bg-amber-500/10 text-amber-400', icon: Clock },
  ApprovedByManager: { label: 'รอการเงินจ่ายเงิน', cls: 'bg-blue-500/10 text-blue-400', icon: Clock },
  ApprovedByFinance: { label: 'จ่ายเงินสำเร็จ', cls: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
  Rejected: { label: 'ปฏิเสธ', cls: 'bg-red-500/10 text-red-400', icon: XCircle },
};

export default function RequestDetailModal({ item, onClose }: RequestDetailModalProps) {
  if (!item) return null;

  const isWithdrawal = item.type === 'Withdrawal' || item.amount !== undefined;
  const status = statusConfig[item.status] || { label: item.status, cls: 'bg-slate-500/10 text-slate-400', icon: Clock };
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="card w-full max-w-lg p-0 overflow-hidden animate-slideIn max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isWithdrawal ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isWithdrawal ? <Banknote className="w-5 h-5" /> : <Fuel className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-white leading-tight">{isWithdrawal ? 'รายละเอียดการเบิกเงิน' : 'รายละเอียดการเคลมน้ำมัน'}</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.tripNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Banner */}
          <div className={`rounded-xl p-4 flex items-center gap-3 border ${status.cls.replace('/10', '/20')} ${status.cls}`}>
            <StatusIcon className="w-6 h-6" />
            <div>
              <p className="text-xs opacity-70 font-medium">สถานะปัจจุบัน</p>
              <p className="font-bold">{status.label}</p>
            </div>
          </div>

          {/* Main Financial Info */}
          <div className="bg-slate-800/30 rounded-2xl p-5 border border-slate-700/50 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">จำนวนเงิน</p>
              <h2 className={`text-4xl font-black ${isWithdrawal ? 'text-amber-400' : 'text-emerald-400'}`}>
                ฿{(item.amount || item.claimAmount || 0).toLocaleString()}
              </h2>
              {isWithdrawal ? (
                <div className="mt-3">
                  <p className="text-xs text-slate-400">เหตุผล: <span className="text-slate-200">{item.reason}</span></p>
                  {item.additionalItems && <p className="text-xs text-slate-400">เพิ่มเติม: <span className="text-slate-200">{item.additionalItems}</span></p>}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">เลขไมล์ขาไป</p>
                    <p className="text-sm text-slate-200 font-mono">{item.mileageOut?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">เลขไมล์ขากลับ</p>
                    <p className="text-sm text-slate-200 font-mono">{item.mileageIn?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipment & Driver Info */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Truck className="w-3.5 h-3.5"/> ข้อมูลการเดินรถที่เกี่ยวข้อง
            </p>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 divide-y divide-slate-700/50">
              <div className="pb-3 flex justify-between items-center">
                <span className="text-xs text-slate-500">คนขับ:</span>
                <span className="text-sm text-white font-semibold">{item.driverName}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-xs text-slate-500">ทะเบียนรถ:</span>
                <span className="text-sm text-slate-200 font-mono">{item.vehiclePlate}</span>
              </div>
              <div className="pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-white truncate">{item.origin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-white truncate">{item.destination}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Approval History */}
          {(item.managerName || item.financeName) && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">บันทึกการตรวจสอบ</p>
              <div className="space-y-3">
                {item.managerName && (
                  <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400 font-medium">Manager: {item.managerName}</span>
                      <span className="text-[10px] text-slate-500">{item.managerApprovedAt && new Date(item.managerApprovedAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="text-slate-200">หมายเหตุ: {item.managerNote || '-'}</p>
                  </div>
                )}
                {item.financeName && (
                  <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-emerald-400 font-medium">Finance: {item.financeName}</span>
                      <span className="text-[10px] text-slate-500">{item.financeApprovedAt && new Date(item.financeApprovedAt).toLocaleDateString('th-TH')}</span>
                    </div>
                    <p className="text-slate-200">หมายเหตุ: {item.financeNote || '-'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Receipt Image for Fuel Claims */}
          {!isWithdrawal && item.receiptUrl && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="w-4 h-4"/> หลักฐานใบเสร็จ
              </label>
              <div className="bg-slate-800 rounded-xl p-2 border border-slate-700">
                <img src={item.receiptUrl} alt="Receipt" className="w-full max-h-64 object-contain rounded-lg" />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-slate-800/80 shrink-0">
          <button onClick={onClose} className="btn-secondary w-full justify-center">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}
