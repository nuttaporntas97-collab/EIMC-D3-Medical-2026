import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { Activity, Lock, User, LogIn, UserPlus, AlertCircle, Database } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { loginSession, navigateTo, showToast, isGoogleConnected, handleGoogleSignIn, isSyncing } = useApp();
  const [sapUser, setSapUser] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!sapUser.trim()) {
      setErrorMessage('กรุณาระบุ SAP User');
      return;
    }
    if (!password) {
      setErrorMessage('กรุณาระบุรหัสผ่าน');
      return;
    }

    setIsLoading(true);
    try {
      const result = await db.login(sapUser, password);
      if (result.success && result.user) {
        loginSession(result.user);
      } else {
        setErrorMessage(result.message || 'ไม่พบผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            เข้าสู่ระบบ EIMC D3 Medical
          </h2>
          <p className="text-xs text-slate-500">
            ระบบตรวจสอบข้อมูลผ่าน Sheet Users ใน Google Sheets
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              SAP User
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={sapUser}
                onChange={e => setSapUser(e.target.value)}
                placeholder="เช่น SAP001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition shadow-md shadow-sky-600/30 disabled:opacity-70 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('register')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 active:scale-[0.99] transition border border-sky-200 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>ลงทะเบียนผู้ใช้ใหม่</span>
            </button>
          </div>
        </form>

        {/* Google Sheets Connection Prompt */}
        <div className="pt-3 border-t border-slate-100 text-center">
          {!isGoogleConnected ? (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">
                ต้องการเชื่อมต่อกับ Google Sheets ส่วนกลางของคุณ:
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSyncing}
                className="w-full inline-flex items-center justify-center space-x-2 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>{isSyncing ? 'กำลังเชื่อมต่อ...' : 'Sign in with Google เพื่อซิงค์ Google Sheets'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Google Sheets เชื่อมต่อพร้อมใช้งาน</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
