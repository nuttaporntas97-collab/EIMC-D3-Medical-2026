import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { ALL_ROOMS, RoomNumber, BedNumber, PatientStatus } from '../types';
import { Edit, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export const PatientEditView: React.FC = () => {
  const { editingPatient, navigateTo, showToast, refreshData } = useApp();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'ชาย' as 'ชาย' | 'หญิง',
    room: '301' as RoomNumber,
    bed: '1' as BedNumber,
    status: 'Admit' as PatientStatus
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingPatient) {
      setFormData({
        firstName: editingPatient.FirstName,
        lastName: editingPatient.LastName,
        gender: editingPatient.Gender,
        room: editingPatient.Room,
        bed: editingPatient.Bed,
        status: editingPatient.Status
      });
    } else {
      navigateTo('patient');
    }
  }, [editingPatient]);

  if (!editingPatient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('กรุณากรอกชื่อและนามสกุล');
      return;
    }

    setIsLoading(true);
    try {
      const res = await db.updatePatient({
        ...editingPatient,
        FirstName: formData.firstName.trim(),
        LastName: formData.lastName.trim(),
        Gender: formData.gender,
        Room: formData.room,
        Bed: formData.bed,
        Status: formData.status
      });

      if (res.success) {
        refreshData();
        showToast(res.message, 'success');
        navigateTo('patient');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'บันทึกการแก้ไขล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigateTo('patient')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปหน้ารายชื่อผู้ป่วย</span>
        </button>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Edit className="w-6 h-6 text-sky-600" />
          <span>แก้ไขข้อมูลผู้ป่วย (HN: {editingPatient.HN})</span>
        </h1>
        <p className="text-xs text-slate-500">
          สามารถเปลี่ยนสถานะ ห้อง เตียง และข้อมูลผู้ป่วย โดยไม่ต้องระบุวันที่ Admit และหมายเหตุ
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Edit Form */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* HN Readonly */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              HN (Hospital Number)
            </label>
            <input
              type="text"
              value={editingPatient.HN}
              disabled
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-600 cursor-not-allowed"
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
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                นามสกุล <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              เพศ <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
            </select>
          </div>

          {/* Room, Bed, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                ห้อง (301-323) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.room}
                onChange={e => setFormData({ ...formData, room: e.target.value as RoomNumber })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {ALL_ROOMS.map(rm => (
                  <option key={rm} value={rm}>
                    ห้อง {rm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                เตียง <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.bed}
                onChange={e => setFormData({ ...formData, bed: e.target.value as BedNumber })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="1">เตียง 1</option>
                <option value="2">เตียง 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                สถานะผู้ป่วย <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as PatientStatus })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none font-semibold text-sky-700"
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
              onClick={() => navigateTo('patient')}
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
              <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
