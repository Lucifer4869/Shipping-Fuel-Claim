import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { Truck, Lock, User, Eye, EyeOff } from 'lucide-react';

// --- หน้าล็อกอิน (Login Page) ---
// หน้าแรกของระบบสำหรับให้พนักงานทุกคนยืนยันตัวตนก่อนเข้าใช้งาน
export default function LoginPage() {
  // State สำหรับเก็บข้อมูล Username และ Password
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // State สำหรับเปิด/ปิดการมองเห็นรหัสผ่าน
  const [showPassword, setShowPassword] = useState(false);
  // State สำหรับสถานะกำลังโหลด (แสดงตอนกดปุ่มล็อกอิน)
  const [loading, setLoading] = useState(false);
  
  // ดึงฟังก์ชัน login และ googleLoginUser มาจาก AuthContext
  const { login, googleLoginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success('เข้าสู่ระบบสำเร็จ!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      await googleLoginUser(credentialResponse.credential);
      toast.success('เข้าสู่ระบบด้วย Google สำเร็จ!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl mb-4 shadow-2xl shadow-primary-600/30">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Shipping System</h1>
          <p className="text-slate-400 mt-1">ระบบจัดการการขนส่ง</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-white mb-6">เข้าสู่ระบบ</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="label">ชื่อผู้ใช้</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-10"
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="กรอกรหัสผ่าน"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-slate-500 text-sm">หรือ</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('การเข้าสู่ระบบด้วย Google ล้มเหลว');
                }}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
                size="large"
                use_fedcm_for_prompt={true}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
