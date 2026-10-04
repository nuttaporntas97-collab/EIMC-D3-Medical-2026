import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { Activity, UserPlus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export const RegisterView: React.FC = () => {
  const { navigateTo, showToast } = useApp();

  const [formData, setFormData] = useState({
    sapUser: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    position: 'พยาบาล'
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.sapUser.trim()) {
      setErrorMessage('กรุณาระบุ SAP User');
      return;
    }
    if (!formData.password) {
      setErrorMessage('กรุณาระบุรหัสผ่าน');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    setIsLoading(true);
    try {
      const res = await db.register({
        sapUser: formData.sapUser,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position
      });

      if (res.success) {
        showToast(res.message, 'success');
        navigateTo('login');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            ลงทะเบียนผู้ใช้งานใหม่
          </h2>
          <p className="text-xs text-slate-500">
            ข้อมูลจะถูกบันทึกลง Sheet Users ใน Google Sheets
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              SAP User <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sapUser}
              onChange={e => setFormData({ ...formData, sapUser: e.target.value })}
              placeholder="เช่น SAP004"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                รหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ยืนยันรหัสผ่าน <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ชื่อ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="ชื่อจริง"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="นามสกุล"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ตำแหน่งงาน <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.position}
              onChange={e => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
            >
              <option value="พยาบาล">พยาบาล</option>
              <option value="ผู้ช่วยพยาบาล">ผู้ช่วยพยาบาล</option>
            </select>
          </div>

          <div className="pt-3 space-y-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition shadow-md shadow-sky-600/30 disabled:opacity-70 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLoading ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกการลงทะเบียน'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับไปหน้าเข้าสู่ระบบ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
