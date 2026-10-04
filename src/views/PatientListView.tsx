import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { Patient } from '../types';
import {
  Users,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  UserPlus,
  Pill,
  Package,
  ShoppingBag,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const PatientListView: React.FC = () => {
  const { patients, navigateTo, setEditingPatient, refreshData, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [deleteConfirmPatient, setDeleteConfirmPatient] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      if (selectedStatus !== 'ALL' && p.Status !== selectedStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.HN.toLowerCase().includes(q) ||
        p.FirstName.toLowerCase().includes(q) ||
        p.LastName.toLowerCase().includes(q) ||
        p.Room.includes(q)
      );
    });
  }, [patients, search, selectedStatus]);

  const handleEdit = (p: Patient) => {
    setEditingPatient(p);
    navigateTo('patient-edit');
  };

  const handleDeleteSubmit = async () => {
    if (!deleteConfirmPatient) return;
    setIsDeleting(true);
    try {
      const res = await db.deletePatient(deleteConfirmPatient.PatientID);
      if (res.success) {
        refreshData();
        showToast(res.message, 'success');
        setDeleteConfirmPatient(null);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'ลบข้อมูลล้มเหลว', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Admit':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Refer':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Death':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Moved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Discharge':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>ทะเบียนผู้ป่วย</span>
          </h1>
          <p className="text-xs text-slate-500">
            รายชื่อผู้ป่วยทั้งหมดในหอผู้ป่วย 3 ซิงค์จาก Sheet Patients ใน Google Sheets
          </p>
        </div>

        <button
          onClick={() => navigateTo('main')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-sky-600/30 transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>เพิ่มผู้ป่วยจากผังห้อง</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา HN, ชื่อ, นามสกุล, หรือห้อง..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'Admit', 'Refer', 'Moved', 'Discharge', 'Death'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedStatus === st
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'ทั้งหมด' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">HN</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">เพศ</th>
                <th className="py-3.5 px-4">ห้อง</th>
                <th className="py-3.5 px-4">เตียง</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-center">เบิกจ่าย</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    ไม่พบข้อมูลผู้ป่วย
                  </td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.PatientID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{p.HN}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.FirstName} {p.LastName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.Gender}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">ห้อง {p.Room}</td>
                    <td className="py-3 px-4 text-slate-700">เตียง {p.Bed}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(p.Status)}`}>
                        {p.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => navigateTo('medicine', { patientId: p.PatientID, hn: p.HN, room: p.Room, bed: p.Bed })}
                          title="เบิกยา"
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition"
                        >
                          <Pill className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigateTo('supplies', { patientId: p.PatientID, hn: p.HN, room: p.Room, bed: p.Bed })}
                          title="เบิกเวชภัณฑ์"
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigateTo('relative-purchase', { patientId: p.PatientID, hn: p.HN, room: p.Room, bed: p.Bed })}
                          title="ญาติซื้อ"
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmPatient(p)}
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal (PDF #20 requirement) */}
      {deleteConfirmPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ยืนยันการลบข้อมูลผู้ป่วย?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ป่วย <b>{deleteConfirmPatient.FirstName} {deleteConfirmPatient.LastName}</b> (HN: {deleteConfirmPatient.HN})?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmPatient(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันการลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
