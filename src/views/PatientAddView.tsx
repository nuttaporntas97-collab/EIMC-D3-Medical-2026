import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { RoomNumber, BedNumber, PatientStatus } from '../types';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react';

export const PatientAddView: React.FC = () => {
  const { targetRoomBed, navigateTo, showToast, refreshData, sessionUser } = useApp();

  const [hn, setHn] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'ชาย' | 'หญิง'>('ชาย');
  const [status, setStatus] = useState<PatientStatus>('Admit');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fallback if user navigated directly without clicking a bed
  const room: RoomNumber = targetRoomBed ? targetRoomBed.room : '301';
  const bed: BedNumber = targetRoomBed ? targetRoomBed.bed : '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hn.trim()) {
      setErrorMessage('กรุณากรอกเลข HN');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('กรุณากรอกชื่อและนามสกุลผู้ป่วย');
      return;
    }

    setIsLoading(true);
    try {
      const res = await db.addPatient({
        HN: hn.trim(),
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Gender: gender,
        Room: room,
        Bed: bed,
        Status: status,
        CreatedBy: sessionUser ? `${sessionUser.name} (${sessionUser.sapUser})` : 'พยาบาล'
      });

      if (res.success) {
        refreshData();
        showToast(res.message, 'success');
        navigateTo('patient');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกข้อมูลล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigateTo('main')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับไปผังหอผู้ป่วย</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-sky-600" />
            <span>เพิ่มข้อมูลผู้ป่วยใหม่</span>
          </h1>
          <p className="text-xs text-slate-500">
            ระบบล็อกห้องและเตียงตามที่เลือกจากผังหอผู้ป่วยโดยอัตโนมัติ
          </p>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Locked Room and Bed (Read-only Requirement) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-1 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                <span>ห้องพัก</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <div className="px-3.5 py-2.5 bg-slate-200/70 border border-slate-300 rounded-xl text-sm font-bold text-slate-800">
                ห้อง {room}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">ล็อกค่าจากผังหอผู้ป่วย</span>
            </div>

            <div>
              <label className="flex items-center space-x-1 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                <span>เตียง</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <div className="px-3.5 py-2.5 bg-slate-200/70 border border-slate-300 rounded-xl text-sm font-bold text-slate-800">
                เตียง {bed}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">ล็อกค่าจากผังหอผู้ป่วย</span>
            </div>
          </div>

          {/* HN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              HN (Hospital Number) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={hn}
              onChange={e => setHn(e.target.value)}
              placeholder="เช่น 6700123"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              required
            />
          </div>

          {/* Name & Surname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ชื่อผู้ป่วย <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="ชื่อจริง"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="นามสกุล"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Gender & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                เพศ <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'ชาย' | 'หญิง')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              >
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                สถานะ <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as PatientStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition"
              >
                <option value="Admit">Admit</option>
                <option value="Refer">Refer</option>
                <option value="Death">Death</option>
                <option value="Moved">Moved</option>
                <option value="Discharge">Discharge</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => navigateTo('main')}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-600/30 transition disabled:opacity-70 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
