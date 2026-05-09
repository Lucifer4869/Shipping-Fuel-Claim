import { useEffect, useState } from 'react';
import { getAuditLogs } from '../lib/api';
import toast from 'react-hot-toast';
import { ClipboardList, Search } from 'lucide-react';

interface AuditLog {
  id: number; tableName: string; recordId: number; action: string;
  oldValue?: string; newValue?: string; performedByName: string; createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/20 text-emerald-400',
  UPDATE: 'bg-blue-500/20 text-blue-400',
  DELETE: 'bg-red-500/20 text-red-400',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tableName: '', action: '' });

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

      {/* Filters */}
      <div className="card p-4 flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-40">
          <label className="label">ตาราง</label>
          <select className="input-field" value={filter.tableName} onChange={e => setFilter({ ...filter, tableName: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="Shipments">Shipments</option>
            <option value="Withdrawals">Withdrawals</option>
            <option value="FuelClaims">FuelClaims</option>
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="label">การดำเนินการ</label>
          <select className="input-field" value={filter.action} onChange={e => setFilter({ ...filter, action: e.target.value })}>
            <option value="">ทั้งหมด</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <button id="search-audit-btn" onClick={fetchLogs} className="btn-primary">
          <Search className="w-4 h-4" /> ค้นหา
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-900/50 border-b border-slate-700">
              <tr>
                {['ตาราง', 'Record ID', 'การดำเนินการ', 'ผู้ดำเนินการ', 'ก่อนเปลี่ยน', 'หลังเปลี่ยน', 'วันที่/เวลา'].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => (
                    <td key={j} className="table-cell"><div className="h-4 bg-slate-700 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="table-cell text-center text-slate-500 py-12">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />ไม่พบข้อมูล
                </td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell"><span className="font-mono text-xs text-slate-300">{log.tableName}</span></td>
                    <td className="table-cell text-slate-400 text-center">{log.recordId}</td>
                    <td className="table-cell">
                      <span className={`badge ${actionColors[log.action] ?? 'bg-slate-500/20 text-slate-400'}`}>{log.action}</span>
                    </td>
                    <td className="table-cell text-slate-300">{log.performedByName}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
