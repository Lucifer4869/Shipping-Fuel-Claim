import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '../lib/api';

interface User {
  userId: number;
  fullName: string;
  role: 'Driver' | 'Manager' | 'Finance' | 'Admin';
  token: string;
  vehiclePlate?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  googleLoginUser: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { getMe } = await import('../lib/api');
      const res = await getMe();
      const data = res.data;
      const userData: User = {
        userId: data.userId,
        fullName: data.fullName,
        role: data.role,
        token: localStorage.getItem('token') || '',
        vehiclePlate: data.vehiclePlate,
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      refreshUser(); // ดึงข้อมูลล่าสุดจาก Server เสมอ
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiLogin({ username, password });
    const data = res.data;
    const userData: User = {
      userId: data.userId,
      fullName: data.fullName,
      role: data.role,
      token: data.token,
      vehiclePlate: data.vehiclePlate,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const googleLoginUser = async (idToken: string) => {
    const res = await import('../lib/api').then(m => m.googleLogin(idToken));
    const data = res.data;
    const userData: User = {
      userId: data.userId,
      fullName: data.fullName,
      role: data.role,
      token: data.token,
      vehiclePlate: data.vehiclePlate,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, googleLoginUser, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
