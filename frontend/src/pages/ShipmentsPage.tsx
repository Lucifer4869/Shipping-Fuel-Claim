import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getShipments, createShipment, updateShipment, deleteShipment } from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, Truck, MapPin, Gauge, Calendar, X, Route, Navigation, Edit2, User, Phone, Trash2 } from 'lucide-react';
import { LocationPicker } from '../components/LocationPicker';

interface LocationData { address: string; lat: number; lng: number; }
interface RouteInfo { distanceKm: number; durationText: string; }

interface Shipment {
  id: number; tripNumber: string; vehiclePlate: string; driverName: string;
  origin: string; originLat?: number; originLng?: number;
  destination: string; destinationLat?: number; destinationLng?: number;
  routeDistanceKm?: number;
  senderName: string; senderPhone: string;
  receiverName: string; receiverPhone: string;
  startMileage: number; endMileage?: number;
  status: string; createdAt: string; withdrawalCount: number; fuelClaimCount: number;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  Active: { label: 'กำลังดำเนินการ', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/20' },
  Completed: { label: 'เสร็จสิ้น', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' },
  Cancelled: { label: 'ยกเลิก', cls: 'bg-red-500/20 text-red-400 border border-red-500/20' },
};

export default function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    vehiclePlate: '', startMileage: '',
    senderName: '', senderPhone: '', receiverName: '', receiverPhone: ''
  });
  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const resetForm = () => {
    setForm({ vehiclePlate: '', startMileage: '', senderName: '', senderPhone: '', receiverName: '', receiverPhone: '' });
    setOrigin(null); setDestination(null); setRouteInfo(null);
    setEditId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (s: Shipment) => {
    setForm({
      vehiclePlate: s.vehiclePlate,
      startMileage: s.startMileage.toString(),
      senderName: s.senderName,
      senderPhone: s.senderPhone,
      receiverName: s.receiverName,
      receiverPhone: s.receiverPhone
    });
    setOrigin(s.origin ? { address: s.origin, lat: s.originLat ?? 0, lng: s.originLng ?? 0 } : null);
    setDestination(s.destination ? { address: s.destination, lat: s.destinationLat ?? 0, lng: s.destinationLng ?? 0 } : null);
    setRouteInfo(s.routeDistanceKm ? { distanceKm: s.routeDistanceKm, durationText: '' } : null);
    setEditId(s.id);
    setShowModal(true);
  };

  const fetchShipments = async () => {
    try {
      const res = await getShipments();
      setShipments(res.data);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id: number, tripNumber: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบการเดินรถเลขที่ "${tripNumber}"?\nการกระทำนี้ไม่สามารถกู้คืนได้`)) {
      try {
        await deleteShipment(id);
        toast.success('ลบข้อมูลสำเร็จ');
        fetchShipments();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'ไม่สามารถลบข้อมูลนี้ได้');
      }
    }
  };

  useEffect(() => { fetchShipments(); }, []);

  const handleRouteInfo = useCallback((info: RouteInfo | null) => {
    setRouteInfo(info);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehiclePlate || !form.startMileage) {
      toast.error('กรุณากรอกทะเบียนรถและเลขไมล์'); return;
    }
    if (!origin) { toast.error('กรุณาเลือกต้นทาง'); return; }
    if (!destination) { toast.error('กรุณาเลือกปลายทาง'); return; }

    setSubmitting(true);
    try {
      const payload = {
        vehiclePlate: form.vehiclePlate,
        origin: origin.address,
        originLat: origin.lat || null,
        originLng: origin.lng || null,
        destination: destination.address,
        destinationLat: destination.lat || null,
        destinationLng: destination.lng || null,
        routeDistanceKm: routeInfo?.distanceKm ?? null,
        senderName: form.senderName,
        senderPhone: form.senderPhone,
        receiverName: form.receiverName,
        receiverPhone: form.receiverPhone,
        startMileage: parseFloat(form.startMileage),
      };

      if (editId) {
        await updateShipment(editId, payload);
        toast.success('อัปเดตข้อมูลสำเร็จ!');
      } else {
        await createShipment(payload);
        toast.success('สร้างเลขที่เดินรถสำเร็จ!');
      }
      
      setShowModal(false);
      resetForm();
      fetchShipments();
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally { setSubmitting(false); }
  };

  const openGoogleMapsRoute = (s: Shipment) => {
    if (s.originLat && s.originLng && s.destinationLat && s.destinationLng) {
      const url = `https://www.google.com/maps/dir/${s.originLat},${s.originLng}/${s.destinationLat},${s.destinationLng}`;
      window.open(url, '_blank');
    }
  };

  const detailShipment = shipments.find(s => s.id === detailId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">การเดินรถ</h1>
          <p className="text-slate-400 text-sm mt-0.5">จัดการเลขที่เดินรถและเส้นทาง</p>
        </div>
        {(user?.role === 'Driver' || user?.role === 'Admin') && (
          <button id="new-shipment-btn" onClick={openCreateModal} className="btn-primary">
            <Plus className="w-4 h-4" /> สร้างเลขที่เดินรถ
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-900/50 border-b border-slate-700">
              <tr>
                {['เลขที่เดินรถ', 'ทะเบียนรถ', 'คนขับ', 'ต้นทาง → ปลายทาง', 'ระยะทาง', 'สถานะ', 'วันที่', ''].map(h => (
                  <th key={h} className="table-header text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="table-cell">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-cell text-center text-slate-500 py-12">
                    <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    ยังไม่มีข้อมูลการเดินรถ
                  </td>
                </tr>
              ) : (
                shipments.map(s => (
                  <tr key={s.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="table-cell">
                      <span className="font-mono text-primary-400 font-medium">{s.tripNumber}</span>
                    </td>
                    <td className="table-cell">
                      <span className="badge bg-slate-700 text-slate-200">{s.vehiclePlate}</span>
                    </td>
                    <td className="table-cell text-slate-300">{s.driverName}</td>
                    <td className="table-cell">
                      <div className="max-w-xs">
                        <div className="flex items-center gap-1 text-xs">
                          <Navigation className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate text-slate-300">{s.origin}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs mt-0.5">
                          <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="truncate text-slate-300">{s.destination}</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Route className="w-3 h-3 text-primary-400" />
                        {s.routeDistanceKm
                          ? <span className="text-primary-400 font-medium">{s.routeDistanceKm.toLocaleString()} กม.</span>
                          : s.endMileage
                            ? `${(s.endMileage - s.startMileage).toLocaleString()} กม.`
                            : <span className="text-slate-600">-</span>
                        }
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${statusConfig[s.status]?.cls}`}>
                        {statusConfig[s.status]?.label}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        {s.originLat && s.destinationLat && (
                          <button
                            onClick={() => openGoogleMapsRoute(s)}
                            title="เปิดใน Google Maps"
                            className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(user?.role === 'Admin' || (user?.role === 'Driver' && s.status === 'Active')) && (
                          <button
                            onClick={() => openEditModal(s)}
                            title="แก้ไขข้อมูล"
                            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setDetailId(s.id === detailId ? null : s.id)}
                          title="ดูรายละเอียด"
                          className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-xs"
                        >
                          <Gauge className="w-3.5 h-3.5" />
                        </button>
                        {user?.role === 'Admin' && (
                          <button
                            onClick={() => handleDelete(s.id, s.tripNumber)}
                            title="ลบข้อมูล"
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Detail Card */}
      {detailShipment && (
        <div className="card p-5 border border-primary-500/20 animate-fadeIn">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-white">รายละเอียด: {detailShipment.tripNumber}</h3>
            <button onClick={() => setDetailId(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-500 text-xs">ทะเบียนรถ</span>
              <p className="text-white font-medium">{detailShipment.vehiclePlate}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">คนขับ</span>
              <p className="text-white font-medium">{detailShipment.driverName}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">เลขไมล์เริ่ม</span>
              <p className="text-white font-medium">{detailShipment.startMileage.toLocaleString()} กม.</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">เลขไมล์สิ้นสุด</span>
              <p className="text-white font-medium">{detailShipment.endMileage ? `${detailShipment.endMileage.toLocaleString()} กม.` : '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium">ข้อมูลผู้ส่ง</span>
              </div>
              <p className="text-white text-sm">{detailShipment.senderName || '-'}</p>
              <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                <Phone className="w-3 h-3" />
                {detailShipment.senderPhone || '-'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-4 h-4 text-red-400" />
                <span className="text-slate-300 font-medium">ข้อมูลผู้รับ</span>
              </div>
              <p className="text-white text-sm">{detailShipment.receiverName || '-'}</p>
              <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                <Phone className="w-3 h-3" />
                {detailShipment.receiverPhone || '-'}
              </div>
            </div>
          </div>
          {detailShipment.originLat && detailShipment.destinationLat && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <Route className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-primary-400 font-semibold">{detailShipment.routeDistanceKm} กม.</span>
                <span>· ระยะทางตามเส้นทางจริง</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">ต้นทาง</span>
                  </div>
                  <p className="text-sm text-white leading-snug">{detailShipment.origin}</p>
                  <p className="text-xs text-slate-600 mt-1">{detailShipment.originLat?.toFixed(5)}, {detailShipment.originLng?.toFixed(5)}</p>
                </div>
                <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">ปลายทาง</span>
                  </div>
                  <p className="text-sm text-white leading-snug">{detailShipment.destination}</p>
                  <p className="text-xs text-slate-600 mt-1">{detailShipment.destinationLat?.toFixed(5)}, {detailShipment.destinationLng?.toFixed(5)}</p>
                </div>
              </div>
              <button
                onClick={() => openGoogleMapsRoute(detailShipment)}
                className="mt-3 w-full btn-secondary justify-center text-sm"
              >
                <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                เปิดเส้นทางใน Google Maps
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="card w-full max-w-xl p-6 animate-slideIn my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">{editId ? 'แก้ไขข้อมูลเดินรถ' : 'สร้างเลขที่เดินรถใหม่'}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{editId ? 'แก้ไขข้อมูลการเดินทางและเส้นทาง' : 'เลือกต้นทาง-ปลายทางบนแผนที่'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">ทะเบียนรถ</label>
                <input className="input-field" placeholder="เช่น กข 1234 กทม." value={form.vehiclePlate}
                  onChange={e => setForm({ ...form, vehiclePlate: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                  <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><User className="w-3.5 h-3.5"/> ข้อมูลผู้ส่ง</h4>
                  <input className="input-field py-1.5 text-sm" placeholder="ชื่อผู้ส่ง" value={form.senderName} onChange={e => setForm({...form, senderName: e.target.value})} />
                  <input className="input-field py-1.5 text-sm" placeholder="เบอร์โทรศัพท์" value={form.senderPhone} onChange={e => setForm({...form, senderPhone: e.target.value})} />
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                  <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1"><User className="w-3.5 h-3.5"/> ข้อมูลผู้รับ</h4>
                  <input className="input-field py-1.5 text-sm" placeholder="ชื่อผู้รับ" value={form.receiverName} onChange={e => setForm({...form, receiverName: e.target.value})} />
                  <input className="input-field py-1.5 text-sm" placeholder="เบอร์โทรศัพท์" value={form.receiverPhone} onChange={e => setForm({...form, receiverPhone: e.target.value})} />
                </div>
              </div>

              {/* GPS Location Picker */}
              <div>
                <label className="label flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary-400" />
                  ต้นทาง - ปลายทาง (GPS)
                </label>
                <LocationPicker
                  origin={origin}
                  destination={destination}
                  onOriginChange={setOrigin}
                  onDestinationChange={setDestination}
                  onRouteInfo={handleRouteInfo}
                />
              </div>

              <div>
                <label className="label">เลขไมล์เริ่มต้น (กม.)</label>
                <input type="number" className="input-field" placeholder="เช่น 50000" value={form.startMileage}
                  onChange={e => setForm({ ...form, startMileage: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
