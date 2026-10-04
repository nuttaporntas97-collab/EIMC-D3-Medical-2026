import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { RelativePurchase, Patient } from '../types';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  PlusCircle,
  X
} from 'lucide-react';

export const RelativePurchaseView: React.FC = () => {
  const { patients, relativePurchases, sessionUser, refreshData, showToast, pagePayload } = useApp();

  const admitPatients = useMemo(() => {
    return patients.filter(p => p.Status === 'Admit');
  }, [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for adding
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pagePayload && pagePayload.patientId) {
      setSelectedPatientId(pagePayload.patientId);
      setIsAddOpen(true);
    } else if (admitPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(admitPatients[0].PatientID);
    }
  }, [pagePayload, admitPatients]);

  const activePatient = useMemo(() => {
    return admitPatients.find(p => p.PatientID === selectedPatientId) || null;
  }, [admitPatients, selectedPatientId]);

  const filteredPurchases = useMemo(() => {
    return relativePurchases.filter(rp => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rp.HN.toLowerCase().includes(q) ||
        rp.ItemName.toLowerCase().includes(q) ||
        rp.Room.includes(q) ||
        rp.Note.toLowerCase().includes(q)
      );
    });
  }, [relativePurchases, searchQuery]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient) {
      showToast('กรุณาเลือกผู้ป่วย', 'error');
      return;
    }
    if (!itemName.trim()) {
      showToast('กรุณากรอกชื่อรายการของใช้ที่ญาติซื้อ', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.addRelativePurchase({
        PatientID: activePatient.PatientID,
        HN: activePatient.HN,
        Room: activePatient.Room,
        Bed: activePatient.Bed,
        ItemName: itemName.trim(),
        Quantity: quantity,
        Note: note.trim(),
        CreatedBy: sessionUser ? `${sessionUser.name} (${sessionUser.sapUser})` : 'พยาบาล'
      });

      if (res.success) {
        refreshData();
        showToast(res.message, 'success');
        setItemName('');
        setQuantity(1);
        setNote('');
        setIsAddOpen(false);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'บันทึกรายการล้มเหลว', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (purchaseId: string) => {
    if (!confirm('ยืนยันการลบรายการญาติซื้อนี้หรือไม่?')) return;
    try {
      const res = await db.deleteRelativePurchase(purchaseId);
      refreshData();
      showToast(res.message, 'success');
    } catch (err: any) {
      showToast('ลบรายการไม่สำเร็จ', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-600" />
            <span>รายการญาติซื้อ (Relative Purchases)</span>
          </h1>
          <p className="text-xs text-slate-500">
            บันทึกของใช้ ยา หรือเวชภัณฑ์ที่ญาติผู้ป่วยจัดซื้อเอง บันทึกลง Sheet RelativePurchases
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-xs shadow-amber-600/30 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>บันทึกรายการญาติซื้อใหม่</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหา HN, รายการ, ห้อง หรือหมายเหตุ..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">วันที่ / เวลา</th>
                <th className="py-3.5 px-4">ห้อง / เตียง</th>
                <th className="py-3.5 px-4">HN</th>
                <th className="py-3.5 px-4">รายการของใช้ที่ซื้อ</th>
                <th className="py-3.5 px-4 text-center">จำนวน</th>
                <th className="py-3.5 px-4">หมายเหตุ</th>
                <th className="py-3.5 px-4">ผู้บันทึก</th>
                <th className="py-3.5 px-4 text-right">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    ยังไม่มีรายการญาติซื้อในระบบ
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(rp => (
                  <tr key={rp.PurchaseID} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(rp.CreatedAt).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      ห้อง {rp.Room} (เตียง {rp.Bed})
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">{rp.HN}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{rp.ItemName}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{rp.Quantity}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {rp.Note || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{rp.CreatedBy}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(rp.PurchaseID)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Relative Purchase */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <span>บันทึกรายการญาติซื้อใหม่</span>
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  เลือกผู้ป่วย <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                >
                  {admitPatients.map(p => (
                    <option key={p.PatientID} value={p.PatientID}>
                      ห้อง {p.Room} (เตียง {p.Bed}) — HN: {p.HN} — {p.FirstName} {p.LastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ชื่อสิ่งของ/รายการที่ญาติซื้อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="เช่น แพมเพิสผู้ใหญ่ size L, แผ่นรองซับ, ยาทาแผล..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  จำนวน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="ระบุรายละเอียดเพิ่มเติม เช่น ซื้อจากร้านขายยาหน้า รพ."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold shadow-md shadow-amber-600/30 transition disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกลง Google Sheets'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
