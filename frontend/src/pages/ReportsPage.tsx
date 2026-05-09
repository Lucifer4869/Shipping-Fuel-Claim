import { useState, useEffect } from 'react';
import { getShipments, getWithdrawals, getFuelClaims } from '../lib/api';
import { 
  Filter, BarChart3, Printer, 
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }));
  
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ fuel: 0, allowance: 0, grandTotal: 0 });

  const fetchData = async () => {
    try {
      const [sRes, wRes, cRes] = await Promise.all([
        getShipments(),
        getWithdrawals(),
        getFuelClaims()
      ]);

      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredShipments = sRes.data.filter((s: any) => {
        const date = new Date(s.createdAt);
        return date >= start && date <= end;
      });

      const mapped = filteredShipments.map((s: any) => {
        const sWithdrawals = wRes.data.filter((w: any) => w.shipmentId === s.id && w.status === 'ApprovedByFinance');
        const sClaims = cRes.data.filter((c: any) => c.shipmentId === s.id && c.status === 'ApprovedByFinance');

        const fuelTotal = sClaims.reduce((sum: number, c: any) => sum + Number(c.claimAmount), 0);
        const allowanceTotal = sWithdrawals.reduce((sum: number, w: any) => sum + Number(w.amount), 0);
        
        return {
          id: s.id,
          date: new Date(s.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          tripNumber: s.tripNumber,
          vehiclePlate: s.vehiclePlate,
          plan: `${s.origin} - ${s.destination}`,
          driverName: s.driverName,
          bankAccount: '-', 
          fuelLitre: '-', 
          fuelAmount: fuelTotal,
          allowance: allowanceTotal,
          total: fuelTotal + allowanceTotal
        };
      });

      setReportData(mapped);
      
      const fuelSum = mapped.reduce((sum: number, item: any) => sum + item.fuelAmount, 0);
      const allowSum = mapped.reduce((sum: number, item: any) => sum + item.allowance, 0);
      setTotals({ fuel: fuelSum, allowance: allowSum, grandTotal: fuelSum + allowSum });

    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลรายงานได้');
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; background: white !important; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; color: black !important; }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid black !important; padding: 6px 4px; font-size: 9pt; text-align: center; color: black !important; }
          th { background-color: #f8f9fa !important; font-weight: bold; -webkit-print-color-adjust: exact; }
          .text-right { text-align: right !important; }
          .bg-summary { background-color: #e2f3e5 !important; font-weight: bold; -webkit-print-color-adjust: exact; }
          .bg-header-box { background-color: #f8f9fa !important; border: 1px solid black !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* Control Panel (No Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-primary-500/10 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary-400" />
            </div>
            ออกรายงานสรุปประจำวัน
          </h1>
          <p className="text-slate-400 text-sm mt-1">สร้างรายงานสรุปการทดลองจ่ายในรูปแบบตารางบัญชี</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-primary shadow-lg shadow-primary-600/20">
            <Printer className="w-4 h-4 mr-2" /> พิมพ์รายงาน (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        <div className="card p-5 space-y-4 lg:col-span-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4" /> ตั้งค่ารายงาน
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label text-xs">ช่วงวันที่ข้อมูล</label>
              <div className="grid grid-cols-1 gap-2">
                <input type="date" className="input-field text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input type="date" className="input-field text-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label text-xs">วันที่แสดงบนหัวรายงาน</label>
              <input type="text" className="input-field text-sm" value={reportDate} onChange={e => setReportDate(e.target.value)} />
            </div>
            <button onClick={fetchData} className="btn-secondary w-full text-sm py-2">อัปเดตข้อมูล</button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Preview Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>คำแนะนำ:</strong> รูปแบบที่เห็นด้านล่างนี้คือตัวอย่างตารางที่จะปรากฏในไฟล์ PDF 
              หากต้องการส่งออกเป็น PDF ให้กดปุ่ม <strong>"พิมพ์รายงาน"</strong> และเลือก "Save as PDF" 
              ในหน้าต่างเครื่องพิมพ์ โดยรายงานจะถูกจัดเป็นแนวนอน (Landscape) ให้อัตโนมัติครับ
            </p>
          </div>

          {/* Table Preview */}
          <div className="card overflow-hidden bg-white text-black p-8 print-area">
            {/* Report Header Like Excel */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-4">สรุปทดลองจ่ายแผน LH ประจำวัน</h2>
              
              <div className="flex justify-start mb-1">
                <div className="border border-black px-4 py-1 w-64 flex justify-between bg-gray-50">
                  <span className="font-bold text-sm">วันที่จัดทำ :</span>
                  <span className="text-sm text-red-600 font-bold">{reportDate}</span>
                </div>
              </div>
            </div>

            {/* Main Table */}
            <table className="w-full border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black text-[10px]">ลำดับ</th>
                  <th className="border border-black text-[10px]">วันที่วิ่งงาน</th>
                  <th className="border border-black text-[10px]">เลขที่แผน</th>
                  <th className="border border-black text-[10px]">รหัสรถ</th>
                  <th className="border border-black text-[10px]">แผน</th>
                  <th className="border border-black text-[10px]">ชื่อ พขร.</th>
                  <th className="border border-black text-[10px]">เลขที่บัญชี TMB</th>
                  <th className="border border-black text-[10px]">จำนวนน้ำมัน / ลิตร</th>
                  <th className="border border-black text-[10px]">ค่าน้ำมันทั้งสิ้น / บาท</th>
                  <th className="border border-black text-[10px]">ค่าเบี้ยเลี้ยง วันวิ่ง</th>
                  <th className="border border-black text-[10px] bg-green-50">รวมทั้งสิ้น</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10 text-center text-gray-400">ไม่พบข้อมูลในช่วงเวลาที่เลือก</td>
                  </tr>
                ) : (
                  reportData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-black text-[10px]">{idx + 1}</td>
                      <td className="border border-black text-[10px]">{item.date}</td>
                      <td className="border border-black text-[10px] font-bold">{item.tripNumber}</td>
                      <td className="border border-black text-[10px]">{item.vehiclePlate}</td>
                      <td className="border border-black text-[10px] text-left px-2">{item.plan}</td>
                      <td className="border border-black text-[10px] text-left px-2">{item.driverName}</td>
                      <td className="border border-black text-[10px]">{item.bankAccount}</td>
                      <td className="border border-black text-[10px]">{item.fuelLitre}</td>
                      <td className="border border-black text-[10px] text-right px-2">{item.fuelAmount > 0 ? item.fuelAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="border border-black text-[10px] text-right px-2">{item.allowance > 0 ? item.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="border border-black text-[10px] text-right px-2 font-bold bg-green-50">
                        {item.total > 0 ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                {reportData.length > 0 && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={8} className="border border-black text-right px-4 text-[11px]">รวมทั้งสิ้น</td>
                    <td className="border border-black text-right px-2 text-[10px]">{totals.fuel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="border border-black text-right px-2 text-[10px]">{totals.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="border border-black text-right px-2 text-[11px] bg-green-100">{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer Placeholder */}
            <div className="mt-12 grid grid-cols-3 gap-8 text-center no-print-flex hidden print:grid">
              <div className="space-y-12">
                <p className="text-xs">ผู้จัดทำ..............................................</p>
                <p className="text-xs">( .................................................. )</p>
              </div>
              <div className="space-y-12">
                <p className="text-xs">ผู้ตรวจสอบ..............................................</p>
                <p className="text-xs">( .................................................. )</p>
              </div>
              <div className="space-y-12">
                <p className="text-xs">ผู้อนุมัติ..............................................</p>
                <p className="text-xs">( .................................................. )</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
