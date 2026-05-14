import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '../lib/api';

// --- กำหนดรูปแบบข้อมูลผู้ใช้ (Interface) ---
interface User {
  userId: number; // ไอดีผู้ใช้
  fullName: string; // ชื่อ-นามสกุล
  role: 'Driver' | 'Manager' | 'Finance' | 'Admin'; // บทบาท (คนขับ, ผู้จัดการ, การเงิน, แอดมิน)
  vehiclePlate?: string; // ทะเบียนรถ (ถ้ามี)
}

// --- กำหนดค่าที่เราจะแชร์ให้หน้าอื่นๆ ใช้งานได้ ---
interface AuthContextType {
  user: User | null; // ข้อมูลผู้ใช้ปัจจุบัน (ถ้าไม่ได้ล็อกอินจะเป็น null)
  login: (username: string, password: string) => Promise<void>; // ฟังก์ชันล็อกอินปกติ
  googleLoginUser: (idToken: string) => Promise<void>; // ฟังก์ชันล็อกอินผ่าน Google
  logout: () => void; // ฟังก์ชันออกจากระบบ
  refreshUser: () => Promise<void>; // ฟังก์ชันดึงข้อมูลผู้ใช้ล่าสุดจาก Server
  isLoading: boolean; // สถานะการโหลดข้อมูล (ป้องกันหน้าจอกระพริบตอนเข้าเว็บ)
}

// สร้าง Context เพื่อแชร์ข้อมูล
const AuthContext = createContext<AuthContextType | null>(null);

// --- Component หลักที่ครอบคลุมทั้งแอปฯ ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // ตัวแปรเก็บข้อมูลผู้ใช้
  const [isLoading, setIsLoading] = useState(true); // ตัวแปรเก็บสถานะการโหลด

  // ฟังก์ชันดึงข้อมูลใหม่จาก Server (เพื่อให้ข้อมูล Profile ทันสมัยเสมอ)
  const refreshUser = async () => {
    try {
      const { getMe } = await import('../lib/api');
      const res = await getMe();
      const data = res.data;
      const userData: User = {
        userId: data.userId,
        fullName: data.fullName,
        role: data.role,
        vehiclePlate: data.vehiclePlate,
      };
      // อัปเดตข้อมูลทั้งใน LocalStorage และ State
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error('ไม่สามารถดึงข้อมูลผู้ใช้ล่าสุดได้:', err);
    }
  };

  // ตรวจสอบเมื่อเปิดเว็บครั้งแรกว่าเคยล็อกอินค้างไว้ไหม
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData)); // ดึงค่าเก่ามาใช้ก่อน
      refreshUser().finally(() => setIsLoading(false)); // แล้วค่อยโหลดค่าใหม่จาก Server ทับอีกทีเพื่อความชัวร์
    } else {
      setIsLoading(false);
    }
  }, []);

  // ฟังก์ชันล็อกอินด้วย Username/Password
  const login = async (username: string, password: string) => {
    const res = await apiLogin({ username, password });
    const data = res.data;
    const userData: User = {
      userId: data.userId,
      fullName: data.fullName,
      role: data.role,
      vehiclePlate: data.vehiclePlate,
    };
    // บันทึกข้อมูลผู้ใช้ลงในเครื่อง (ไม่ต้องเซฟ Token แล้วเพราะอยู่ใน Cookie)
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ฟังก์ชันล็อกอินผ่าน Google
  const googleLoginUser = async (idToken: string) => {
    const res = await import('../lib/api').then(m => m.googleLogin(idToken));
    const data = res.data;
    const userData: User = {
      userId: data.userId,
      fullName: data.fullName,
      role: data.role,
      vehiclePlate: data.vehiclePlate,
    };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // ฟังก์ชันออกจากระบบ
  const logout = async () => {
    try {
      const { logoutApi } = await import('../lib/api');
      await logoutApi(); // สั่งให้ Backend ล้าง Cookie ทิ้ง
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.clear(); // ล้างข้อมูล User ออกจากเครื่อง
    setUser(null); // ล้างข้อมูลในตัวแปร
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLoginUser, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Hook สำหรับดึงข้อมูลไปใช้งานในหน้าอื่นๆ ---
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
