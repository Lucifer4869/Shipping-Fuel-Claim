import { useEffect, useState } from 'react';
import { getAuditLogs } from '../lib/api';
import toast from 'react-hot-toast';
import { ClipboardList, Search } from 'lucide-react';

interface AuditLog {
  id: number; // รหัสประจำตัวของ Log
  tableName: string; // ชื่อตารางที่ถูกแก้ไข (เช่น Shipments, Users)
  recordId: number; // รหัสประจำตัวของข้อมูลที่ถูกแก้ไข
  action: string; // ชนิดของการแก้ไข (CREATE, UPDATE, DELETE)
  oldValue?: string; // ค่าเดิมก่อนแก้ไข (ถ้ามี)
  newValue?: string; // ค่าใหม่หลังแก้ไข (ถ้ามี)
  performedByName: string; // ชื่อผู้ใช้งานที่ทำการแก้ไข
  performedByRole?: string; // บทบาทของผู้ใช้งานที่ทำการแก้ไข
  createdAt: string; // วันที่และเวลาที่ทำการแก้ไข
  approve?: string; // การอนุมัติ (ถ้ามี)
  referenceNumber?: string; // รหัสอ้างอิง (เช่น FLC-...)
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/20 text-emerald-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

// --- หน้า Audit Logs (ประวัติการใช้งาน) ---
// ส่วนนี้ใช้สำหรับให้ Admin ตรวจสอบย้อนหลังว่าใครทำอะไรในระบบบ้าง
export default function AuditLogsPage() {
  // State สำหรับเก็บรายการ Log ที่ดึงมาจาก Server
  const [logs, setLogs] = useState<AuditLog[]>([]);
  // State สำหรับแสดงสถานะการโหลด
  const [loading, setLoading] = useState(true);
  // State สำหรับเก็บค่าตัวกรอง (ค้นหาตามชื่อคนทำ, ชื่อตาราง, หรือการกระทำ)
  const [filter, setFilter] = useState({ performedByName: '', tableName: '', action: '' });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ ...filter, pageSize: 50 });
      setLogs(res.data);
    } catch { toast.error('ไม่สามารถโหลด Audit Log ได้'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-0.5">ประวัติการเปลี่ยนแปลงข้อมูลทั้งหมดในระบบ</p>
      </div>

      {/* Filters Area */}
      <div className="card p-4 flex gap-4 items-end flex-wrap">
        <div className="flex-[2] min-w-[200px]">
          <label className="label">ค้นหาชื่อผู้ดำเนินการ</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="พิมพ์ชื่อเพื่อค้นหา..." 
              className="input-field pl-10"
              value={filter.performedByName}
              onChange={e => setFilter({ ...filter, performedByName: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && fetchLogs()}
            />
          </div>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="label">ตาราง</label>
          <select className="input-field" value={filter.tableName} onChange={e => setFilter({ ...filter, tableName: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="Shipments">Shipments</option>
            <option value="Withdrawals">Withdrawals</option>
            <option value="FuelClaims">FuelClaims</option>
            <option value="Users">Users</option>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="label">การดำเนินการ</label>
          <select className="input-field" value={filter.action} onChange={e => setFilter({ ...filter, action: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <button onClick={fetchLogs} className="btn-primary px-8">
          ค้นหา
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-900/50 border-b border-slate-700">
              <tr>
                {['ตาราง', ' ID', 'การดำเนินการ', 'ผู้ดำเนินการ', 'ก่อนเปลี่ยน', 'หลังเปลี่ยน', 'วันที่/เวลา'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-cell text-center text-slate-500 py-12">
                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const role = log.performedByRole;
                  let statusText = '-';
                  try {
                    if (log.newValue) {
                      const val = JSON.parse(log.newValue);
                      statusText = val.Status || val.Role || '-';
                    }
                  } catch { }

                  const isRecent = new Date().getTime() - new Date(log.createdAt).getTime() < 5 * 60 * 1000;

                  return (
                    <tr key={log.id} className={`hover:bg-slate-700/20 transition-colors ${isRecent ? 'bg-emerald-500/5' : ''}`}>
                      <td className="table-cell relative">
                        {isRecent && (
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-300">{log.tableName}</span>
                          {isRecent && (
                            <span className="text-[9px] bg-emerald-500 text-white px-1 rounded font-bold animate-bounce">NEW</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-300 font-bold font-mono">
                            {log.referenceNumber || `ID: ${log.recordId}`}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-tighter ${statusText !== '-' ? 'text-primary-400' : 'text-slate-600'}`}>
                            {statusText !== '-' ? `ST: ${statusText}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${actionColors[log.action] ?? 'bg-slate-500/20 text-slate-400'}`}>{log.action}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-300">{log.performedByName}</span>
                          {role && (
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{role}</span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell max-w-xs">
                        {log.oldValue ? (
                          <pre className="text-xs text-slate-500 bg-slate-900/50 rounded px-2 py-1 overflow-auto max-w-xs max-h-16">
                            {JSON.stringify(JSON.parse(log.oldValue), null, 1)}
                          </pre>
                        ) : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="table-cell max-w-xs">
                        {log.newValue ? (
                          <pre className="text-xs text-emerald-500/80 bg-emerald-900/20 rounded px-2 py-1 overflow-auto max-w-xs max-h-16">
                            {JSON.stringify(JSON.parse(log.newValue), null, 1)}
                          </pre>
                        ) : <span className="text-slate-600">-</span>}
                      </td>
                      <td className="table-cell text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('th-TH')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
