import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser } from '../lib/api';
import toast from 'react-hot-toast';
import { Users as UsersIcon, Plus, UserCircle, Edit2, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'Driver',
    vehiclePlate: '',
    isActive: true
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await getUsers();
      return res.data;
    },
    enabled: user?.role === 'Admin'
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('เพิ่มผู้ใช้สำเร็จ');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('แก้ไขข้อมูลสำเร็จ');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ลบผู้ใช้สำเร็จ');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'ไม่สามารถลบผู้ใช้นี้ได้');
    }
  });

  const handleDelete = (id: number, username: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}"?\nการกระทำนี้ไม่สามารถกู้คืนได้`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ 
        id: editingUser.id, 
        data: {
          fullName: formData.fullName,
          role: formData.role,
          password: formData.password || undefined,
          vehiclePlate: formData.role === 'Driver' ? formData.vehiclePlate : '',
          isActive: formData.isActive
        } 
      });
    } else {
      if (!formData.username || !formData.password || !formData.fullName) {
        return toast.error('กรุณากรอกข้อมูลให้ครบ');
      }
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '',
      fullName: u.fullName,
      role: u.role,
      vehiclePlate: u.vehiclePlate || '',
      isActive: u.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'Driver',
      vehiclePlate: '',
      isActive: true
    });
  };

  if (user?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
        <p>หน้านี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-primary-500" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-slate-400 text-sm mt-1">จัดการบัญชีและสิทธิ์การใช้งานในระบบ</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มผู้ใช้
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-dark-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium">ชื่อผู้ใช้ (Username)</th>
                <th className="px-6 py-4 font-medium">ชื่อ-สกุล</th>
                <th className="px-6 py-4 font-medium">บทบาท (Role)</th>
                <th className="px-6 py-4 font-medium">สถานะ</th>
                <th className="px-6 py-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <span className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                    </div>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-dark-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-slate-300">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-200">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{u.fullName}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        u.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.role === 'Manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        u.role === 'Finance' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {u.role}
                      </span>
                      {u.vehiclePlate && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          รถ: {u.vehiclePlate}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.isActive ? 
                      <span className="text-emerald-400 text-xs">ใช้งานได้</span> : 
                      <span className="text-red-400 text-xs">ระงับการใช้งาน</span>
                    }
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(u)}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        disabled={u.id === 1} // Protect initial admin
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                        title="ลบผู้ใช้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">ไม่มีข้อมูลผู้ใช้</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-dark-950">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">ชื่อผู้ใช้ (Username)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="input-field disabled:opacity-50"
                  placeholder="เช่น driver02"
                />
              </div>

              <div>
                <label className="label">รหัสผ่าน {editingUser && '(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)'}</label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="label">ชื่อ-สกุล</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field"
                  placeholder="นายสมมติ นามสกุล"
                />
              </div>

              <div>
                <label className="label">บทบาท (Role)</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="Driver">Driver (พนักงานขับรถ)</option>
                  <option value="Manager">Manager (ผู้จัดการ)</option>
                  <option value="Finance">Finance (การเงิน)</option>
                  <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              {formData.role === 'Driver' && (
                <div>
                  <label className="label">ทะเบียนรถประจำตัว (Vehicle Plate)</label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={e => setFormData({ ...formData, vehiclePlate: e.target.value })}
                    className="input-field"
                    placeholder="เช่น กข 1234 กทม."
                  />
                  <p className="text-xs text-slate-500 mt-1">ใช้สำหรับอ้างอิงตอนสร้างการเดินรถ</p>
                </div>
              )}

              {editingUser && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-dark-800 border-slate-600 text-primary-500 focus:ring-primary-500/50"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-300">เปิดใช้งานบัญชีนี้</label>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                  ยกเลิก
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary flex-1 justify-center">
                  {editingUser ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
