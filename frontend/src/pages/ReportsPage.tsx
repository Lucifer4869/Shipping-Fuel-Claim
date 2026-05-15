import { useState, useEffect } from 'react';
import { getShipments, getWithdrawals, getFuelClaims, getOilPrice } from '../lib/api';
import { 
  Filter, BarChart3, Printer, 
  Info, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatDateAD = (date: Date | string) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// --- หน้าออกรายงานสรุปยอด (Daily Reports) ---
// ส่วนนี้ใช้สำหรับสรุปข้อมูลการเงิน (เบิกเงิน + เคลมน้ำมัน) ออกมาเป็นรูปแบบตารางบัญชีเพื่อพิมพ์หรือบันทึกเป็น PDF
export default function ReportsPage() {
  // State สำหรับเก็บช่วงวันที่เริ่มต้นและสิ้นสุดที่ต้องการออกรายงาน
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  // State สำหรับข้อความ "วันที่จัดทำ" บนหัวรายงาน
  const [reportDate, setReportDate] = useState(formatDateAD(new Date()));
  
  // State สำหรับเก็บข้อมูลรายงานที่ประมวลผลแล้ว
  const [reportData, setReportData] = useState<any[]>([]);
  const [detailedWithdrawals, setDetailedWithdrawals] = useState<any[]>([]);
  const [detailedClaims, setDetailedClaims] = useState<any[]>([]);
  // State สำหรับเก็บยอดรวมสรุปท้ายตาราง
  const [totals, setTotals] = useState({ fuel: 0, allowance: 0, grandTotal: 0 });
  // State สำหรับอัตราน้ำมันประจำวัน (บาท/ลิตร)
  const [oilRate, setOilRate] = useState('32.94');

  const fetchData = async () => {
    try {
      const [sRes, wRes, cRes] = await Promise.all([
        getShipments(),
        getWithdrawals(),
        getFuelClaims()
      ]);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredShipments = sRes.data.filter((s: any) => {
        const sDate = new Date(s.createdAt);
        return sDate >= start && sDate <= end;
      });

      const mapped = filteredShipments.map((s: any) => {
        const sWithdrawals = wRes.data.filter((w: any) => 
          w.shipmentId === s.id && (w.status === 'ApprovedByFinance' || w.status === 'ApprovedByManager' || w.status === 'Pending')
        );
        const sClaims = cRes.data.filter((c: any) => 
          c.shipmentId === s.id && (c.status === 'ApprovedByFinance' || c.status === 'ApprovedByManager' || c.status === 'Pending')
        );

        const fuelTotal = sClaims.reduce((sum: number, c: any) => sum + Number(c.claimAmount), 0);
        const allowanceTotal = sWithdrawals.reduce((sum: number, w: any) => sum + Number(w.amount), 0);
        
        // หาถานะที่ "ค้าง" ที่สุดเพื่อแสดงผล
        const getStatusText = (items: any[]) => {
          if (items.length === 0) return '-';
          if (items.some(i => i.status === 'Pending')) return 'รอ Manager อนุมัติ';
          if (items.some(i => i.status === 'ApprovedByManager')) return 'รอ Finance จ่ายเงิน';
          if (items.every(i => i.status === 'ApprovedByFinance')) return 'จ่ายเงินแล้ว';
          if (items.some(i => i.status === 'Rejected')) return 'ถูกปฏิเสธ';
          return 'รอดำเนินการ';
        };

        return {
          id: s.id,
          date: formatDateAD(s.createdAt),
          tripNumber: s.tripNumber,
          vehiclePlate: s.vehiclePlate,
          plan: `${s.origin} - ${s.destination}`,
          driverName: s.driverName,
          bankAccount: '-', 
          distance: s.routeDistanceKm || (s.endMileage > 0 ? (s.endMileage - s.startMileage) : 0),
          fuelAmount: fuelTotal,
          allowance: allowanceTotal,
          total: fuelTotal + allowanceTotal,
          withdrawalStatus: getStatusText(sWithdrawals),
          claimStatus: getStatusText(sClaims)
        };
      });

      setReportData(mapped);

      // สำหรับตารางรายละเอียดด้านล่าง
      const allWithdrawals = wRes.data.filter((w: any) => {
        const wDate = new Date(w.createdAt);
        return wDate >= start && wDate <= end;
      });
      const allClaims = cRes.data.filter((c: any) => {
        const cDate = new Date(c.createdAt);
        return cDate >= start && cDate <= end;
      });
      setDetailedWithdrawals(allWithdrawals);
      setDetailedClaims(allClaims);

      const fuelSum = mapped.reduce((sum: number, item: any) => sum + item.fuelAmount, 0);
      const allowSum = mapped.reduce((sum: number, item: any) => sum + item.allowance, 0);
      setTotals({ fuel: fuelSum, allowance: allowSum, grandTotal: fuelSum + allowSum });
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('ไม่สามารถโหลดข้อมูลรายงานได้');
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchOilPriceData = async () => {
    try {
      const res = await getOilPrice();
      if (res.data && res.data.price) {
        setOilRate(res.data.price.toString());
      }
    } catch (err) {
      console.error('Failed to fetch oil price from backend:', err);
    }
  };

  useEffect(() => {
    fetchOilPriceData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Custom Input Component to force dd/mm/yyyy display
  const CustomDateInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="space-y-1.5 relative">
      <label className="label text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
        <Filter className="w-3 h-3" /> {label}
      </label>
      <div className="relative">
        <input 
          type="date" 
          className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="input-field flex items-center justify-between pointer-events-none bg-slate-800/40 border-slate-700/50">
          <span className="text-sm text-white">{formatDateAD(value)}</span>
          <Printer className="w-4 h-4 text-slate-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
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
            ออกรายงานสรุปยอดการจ่ายประจำวัน
          </h1>
          <p className="text-slate-400 text-sm mt-1">สร้างรายงานสรุปการทดลองจ่ายในรูปแบบตารางบัญชี</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn-primary shadow-lg shadow-primary-600/20">
            <Printer className="w-4 h-4 mr-2" /> พิมพ์รายงาน (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-5 space-y-4 lg:col-span-1 no-print">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4" /> ตั้งค่ารายงาน
          </h3>
          <div className="space-y-4">
            <CustomDateInput label="วันที่เริ่มต้น" value={startDate} onChange={setStartDate} />
            <CustomDateInput label="วันที่สิ้นสุด" value={endDate} onChange={setEndDate} />
            
            <div>
              <label className="label text-xs font-bold text-slate-500 uppercase tracking-widest">วันที่แสดงบนหัวรายงาน</label>
              <input type="text" className="input-field text-sm" value={reportDate} onChange={e => setReportDate(e.target.value)} />
            </div>
            <div className="pt-4 border-t border-slate-700/50">
              <label className="label text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                อัตราน้ำมันวันนี้ (บาท/ลิตร)
                <button 
                  onClick={fetchOilPriceData}
                  className="text-[10px] text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                  title="ซิงค์ราคาน้ำมันล่าสุดจาก PTT"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> ซิงค์ข้อมูล PTT
                </button>
              </label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field text-sm" 
                placeholder="เช่น 32.94" 
                value={oilRate}
                onChange={e => setOilRate(e.target.value)}
              />
            </div>

            <button onClick={fetchData} className="btn-secondary w-full text-sm py-2.5 mt-2">อัปเดตข้อมูล</button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* Preview Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 no-print">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200 leading-relaxed">
              <strong>คำแนะนำ:</strong> รูปแบบที่เห็นด้านล่างนี้คือตัวอย่างตารางที่จะปรากฏในไฟล์ PDF 
              หากต้องการส่งออกเป็น PDF ให้กดปุ่ม <strong>"พิมพ์รายงาน"</strong> และเลือก "Save as PDF" 
              ในหน้าต่างเครื่องพิมพ์ โดยรายงานจะถูกจัดเป็นแนวนอน (Landscape) ให้อัตโนมัติครับ
            </p>
          </div>

          <div className="card overflow-hidden bg-white text-black p-8 print-area">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-4">สรุปยอดการจ่ายประจำวัน</h2>
              <div className="text-sm mb-4 hidden print:block">
                ประจำวันที่ {formatDateAD(startDate)} ถึง {formatDateAD(endDate)}
              </div>
              
              <div className="flex justify-between items-end mb-1">
                <div className="border border-black px-4 py-1 w-64 flex justify-between bg-gray-50">
                  <span className="font-bold text-sm">วันที่จัดทำ :</span>
                  <span className="text-sm text-red-600 font-bold">{reportDate}</span>
                </div>
                <div className="border border-black px-4 py-1 w-64 flex justify-between bg-gray-50">
                  <span className="font-bold text-sm">อัตราน้ำมันประจำวัน :</span>
                  <span className="text-sm text-blue-600 font-bold">{oilRate} บาท</span>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black text-[10px]">ลำดับ</th>
                  <th className="border border-black text-[10px]">วันที่วิ่งงาน</th>
                  <th className="border border-black text-[10px]">เลขที่แผน</th>
                  <th className="border border-black text-[10px]">รหัสรถ</th>
                  <th className="border border-black text-[10px]">แผน</th>
                  <th className="border border-black text-[10px]">ชื่อ พขร.</th>
                  <th className="border border-black text-[10px]">ระยะทาง (กม.)</th>
                  <th className="border border-black text-[10px]">เคลมน้ำมัน</th>
                  <th className="border border-black text-[10px]">ขอเบิกเงิน</th>
                  <th className="border border-black text-[10px] bg-summary">รวมทั้งสิ้น</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-gray-400 border border-black">ไม่พบข้อมูลในช่วงเวลาที่เลือก</td>
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
                      <td className="border border-black text-[10px] font-bold">{item.distance > 0 ? `${Number(item.distance).toLocaleString()} กม.` : '-'}</td>
                      <td className="border border-black text-[10px] text-right px-2">{item.fuelAmount > 0 ? item.fuelAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="border border-black text-[10px] text-right px-2">{item.allowance > 0 ? item.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className="border border-black text-[10px] text-right px-2 font-bold bg-summary">
                        {item.total > 0 ? item.total.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                      </td>
                    </tr>
                  ))
                )}
                {reportData.length > 0 && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={7} className="border border-black text-right px-4 text-[11px]">รวมทั้งสิ้น</td>
                    <td className="border border-black text-right px-2 text-[10px]">{totals.fuel.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="border border-black text-right px-2 text-[10px]">{totals.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="border border-black text-right px-2 text-[11px] bg-summary">{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Detailed Tables for Clarity */}
            <div className="mt-12">
              <h3 className="text-[12px] font-bold border-l-4 border-black pl-2 mb-3">รายละเอียดการเบิกเงิน (Withdrawals)</h3>
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black text-[8px] py-1 w-[5%]">ลำดับ</th>
                    <th className="border border-black text-[8px] py-1 w-[13%]">เลขที่แผน</th>
                    <th className="border border-black text-[8px] py-1 w-[15%]">ชื่อคนขับ</th>
                    <th className="border border-black text-[8px] py-1 w-[15%]">เหตุผล</th>
                    <th className="border border-black text-[8px] py-1 w-[12%]">Manager</th>
                    <th className="border border-black text-[8px] py-1 w-[12%]">การเงิน</th>
                    <th className="border border-black text-[8px] py-1 w-[14%]">จำนวนเงิน</th>
                    <th className="border border-black text-[8px] py-1 w-[14%]">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedWithdrawals.length > 0 ? detailedWithdrawals.map((item, idx) => {
                    const statusText = item.status === 'ApprovedByFinance' ? 'จ่ายเงินแล้ว' :
                                       item.status === 'Rejected' ? 'ถูกปฏิเสธ' : 
                                       item.status === 'ApprovedByManager' ? 'รอ Finance จ่ายเงิน' : 'รอ Manager อนุมัติ';
                    return (
                    <tr key={`w-${idx}`}>
                      <td className="border border-black text-[8px] py-1">{idx + 1}</td>
                      <td className="border border-black text-[8px] py-1 font-mono">{item.withdrawalNumber || item.tripNumber}</td>
                      <td className="border border-black text-[8px] py-1">{item.driverName}</td>
                      <td className="border border-black text-[8px] py-1 text-left px-1">{item.reason || 'เบิกเงิน'}</td>
                      <td className="border border-black text-[8px] py-1 text-emerald-700 font-medium">{item.managerName || '-'}</td>
                      <td className="border border-black text-[8px] py-1 text-blue-700 font-medium">{item.financeName || '-'}</td>
                      <td className="border border-black text-[8px] py-1 text-right px-1 font-bold">{item.amount > 0 ? item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className={`border border-black text-[8px] py-1 font-bold ${
                        statusText === 'จ่ายเงินแล้ว' ? 'text-emerald-700' : 
                        statusText === 'ถูกปฏิเสธ' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {statusText}
                      </td>
                    </tr>
                  )}) : <tr><td colSpan={8} className="border border-black text-center py-4 text-[8px] text-gray-400">ไม่มีข้อมูลการเบิกเงิน</td></tr>}
                </tbody>
              </table>

              <h3 className="text-[12px] font-bold border-l-4 border-black pl-2 mb-3">รายละเอียดการเคลมน้ำมัน (Fuel Claims)</h3>
              <table className="w-full mb-8">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black text-[8px] py-1 w-[5%]">ลำดับ</th>
                    <th className="border border-black text-[8px] py-1 w-[13%]">เลขที่แผน</th>
                    <th className="border border-black text-[8px] py-1 w-[15%]">ชื่อคนขับ</th>
                    <th className="border border-black text-[8px] py-1 w-[15%]">เหตุผล</th>
                    <th className="border border-black text-[8px] py-1 w-[12%]">Manager</th>
                    <th className="border border-black text-[8px] py-1 w-[12%]">การเงิน</th>
                    <th className="border border-black text-[8px] py-1 w-[14%]">จำนวนเงิน</th>
                    <th className="border border-black text-[8px] py-1 w-[14%]">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedClaims.length > 0 ? detailedClaims.map((item, idx) => {
                    const statusText = item.status === 'ApprovedByFinance' ? 'จ่ายเงินแล้ว' :
                                       item.status === 'Rejected' ? 'ถูกปฏิเสธ' : 
                                       item.status === 'ApprovedByManager' ? 'รอ Finance จ่ายเงิน' : 'รอ Manager อนุมัติ';
                    return (
                    <tr key={`c-${idx}`}>
                      <td className="border border-black text-[8px] py-1">{idx + 1}</td>
                      <td className="border border-black text-[8px] py-1 font-mono">{item.claimNumber || item.tripNumber}</td>
                      <td className="border border-black text-[8px] py-1">{item.driverName}</td>
                      <td className="border border-black text-[8px] py-1 text-left px-1">{item.reason || 'เคลมน้ำมัน'}</td>
                      <td className="border border-black text-[8px] py-1 text-emerald-700 font-medium">{item.managerName || '-'}</td>
                      <td className="border border-black text-[8px] py-1 text-blue-700 font-medium">{item.financeName || '-'}</td>
                      <td className="border border-black text-[8px] py-1 text-right px-1 font-bold">{item.claimAmount > 0 ? item.claimAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                      <td className={`border border-black text-[8px] py-1 font-bold ${
                        statusText === 'จ่ายเงินแล้ว' ? 'text-emerald-700' : 
                        statusText === 'ถูกปฏิเสธ' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {statusText}
                      </td>
                    </tr>
                  )}) : <tr><td colSpan={8} className="border border-black text-center py-4 text-[8px] text-gray-400">ไม่มีข้อมูลการเคลมน้ำมัน</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Footer Signatures */}
            <div className="mt-16 grid grid-cols-3 gap-4 text-center print:break-inside-avoid">
              <div className="space-y-12">
                <p className="text-[11px] whitespace-nowrap">ผู้จัดทำ ........................................</p>
                <p className="text-[11px] font-bold whitespace-nowrap">( ............................................ )</p>
                <p className="text-[10px] whitespace-nowrap">วันที่ ....../....../......</p>
              </div>
              <div className="space-y-12">
                <p className="text-[11px] whitespace-nowrap">ผู้ตรวจสอบ ........................................</p>
                <p className="text-[11px] font-bold whitespace-nowrap">( ............................................ )</p>
                <p className="text-[10px] whitespace-nowrap">วันที่ ....../....../......</p>
              </div>
              <div className="space-y-12">
                <p className="text-[11px] whitespace-nowrap">ผู้อนุมัติจ่ายเงิน ........................................</p>
                <p className="text-[11px] font-bold whitespace-nowrap">( ............................................ )</p>
                <p className="text-[10px] whitespace-nowrap">วันที่ ....../....../......</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
