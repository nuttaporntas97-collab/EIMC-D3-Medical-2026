import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { Supply, Patient } from '../types';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  X,
  ShoppingBag
} from 'lucide-react';

interface CartItem {
  supply: Supply;
  quantity: number;
}

export const SuppliesView: React.FC = () => {
  const { patients, supplies, sessionUser, navigateTo, showToast, refreshData, pagePayload } = useApp();

  const admitPatients = useMemo(() => {
    return patients.filter(p => p.Status === 'Admit');
  }, [patients]);

  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [searchSup, setSearchSup] = useState('');
  const [selectedSup, setSelectedSup] = useState<Supply | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Add new supply modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupUnit, setNewSupUnit] = useState('ชิ้น');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pagePayload && pagePayload.patientId) {
      setSelectedPatientId(pagePayload.patientId);
    } else if (admitPatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(admitPatients[0].PatientID);
    }
  }, [pagePayload, admitPatients]);

  const activePatient = useMemo(() => {
    return admitPatients.find(p => p.PatientID === selectedPatientId) || null;
  }, [admitPatients, selectedPatientId]);

  const filteredSupplies = useMemo(() => {
    if (!searchSup.trim()) return supplies.slice(0, 15);
    const q = searchSup.toLowerCase();
    return supplies.filter(s => s.SupplyName.toLowerCase().includes(q));
  }, [supplies, searchSup]);

  const handleAddToCart = () => {
    if (!selectedSup) return;
    if (quantity <= 0) {
      showToast('จำนวนต้องมากกว่า 0', 'error');
      return;
    }

    const existingIdx = cart.findIndex(c => c.supply.SupplyID === selectedSup.SupplyID);
    if (existingIdx !== -1) {
      const newCart = [...cart];
      newCart[existingIdx].quantity += quantity;
      setCart(newCart);
    } else {
      setCart([...cart, { supply: selectedSup, quantity }]);
    }

    setSelectedSup(null);
    setQuantity(1);
    setSearchSup('');
    showToast(`เพิ่ม ${selectedSup.SupplyName} เข้ารายการแล้ว`, 'success');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const newCart = [...cart];
    newCart[index].quantity = newQty;
    setCart(newCart);
  };

  // "รอเบิก" (Save as PENDING in Google Sheets)
  const handleSavePending = async () => {
    if (!activePatient) {
      showToast('กรุณาเลือกผู้ป่วย', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('กรุณาเลือกรายการเวชภัณฑ์ก่อนกดรอเบิก', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToPending = cart.map(c => ({
        patientId: activePatient.PatientID,
        hn: activePatient.HN,
        room: activePatient.Room,
        bed: activePatient.Bed,
        itemType: 'SUPPLY' as const,
        itemId: c.supply.SupplyID,
        itemName: c.supply.SupplyName,
        quantity: c.quantity,
        requestedBy: sessionUser ? `${sessionUser.name} (${sessionUser.sapUser})` : 'พยาบาล'
      }));

      const res = await db.createPendingItems(itemsToPending);
      if (res.success) {
        refreshData();
        showToast(res.message, 'success');
        setCart([]);
        navigateTo('pending');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'บันทึกรายการรอเบิกล้มเหลว', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new supply
  const handleAddNewSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) {
      showToast('กรุณากรอกชื่อเวชภัณฑ์', 'error');
      return;
    }

    try {
      const res = await db.addSupply(
        newSupName.trim(),
        newSupUnit.trim(),
        sessionUser ? sessionUser.sapUser : 'User'
      );
      if (res.success && res.supply) {
        refreshData();
        showToast(res.message, 'success');
        setSelectedSup(res.supply);
        setIsAddModalOpen(false);
        setNewSupName('');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'เพิ่มเวชภัณฑ์ล้มเหลว', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-sky-600" />
            <span>เบิกเวชภัณฑ์ (Medical Supplies Dispensing)</span>
          </h1>
          <p className="text-xs text-slate-500">
            สั่งเบิกอุปกรณ์ทางการแพทย์และเวชภัณฑ์มิใช่ยา บันทึกลง Sheet Supplies & PendingItems
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เพิ่มเวชภัณฑ์ใหม่ในระบบ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Selector & Supplies Search (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Patient Selector Card */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              เลือกผู้ป่วย (เฉพาะสถานะ Admit) <span className="text-rose-500">*</span>
            </label>

            {admitPatients.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs">
                ยังไม่มีผู้ป่วย Admit ในวอร์ด กรุณาเพิ่มผู้ป่วยจากผังห้องก่อน
              </div>
            ) : (
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              >
                {admitPatients.map(p => (
                  <option key={p.PatientID} value={p.PatientID}>
                    ห้อง {p.Room} (เตียง {p.Bed}) — HN: {p.HN} — {p.FirstName} {p.LastName} ({p.Gender})
                  </option>
                ))}
              </select>
            )}

            {activePatient && (
              <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center justify-between text-xs text-sky-900">
                <div>
                  <span className="font-bold">ห้อง {activePatient.Room} เตียง {activePatient.Bed}</span> • HN: {activePatient.HN}
                </div>
                <div className="font-semibold text-slate-800">
                  {activePatient.FirstName} {activePatient.LastName}
                </div>
              </div>
            )}
          </div>

          {/* Search & Select Supply */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                ค้นหาและเลือกเวชภัณฑ์
              </label>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center space-x-1"
              >
                <span>ไม่พบรายการ? เพิ่มรายการใหม่</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchSup}
                onChange={e => setSearchSup(e.target.value)}
                placeholder="พิมพ์ชื่อเวชภัณฑ์ เช่น Syringe, Gauze, NSS..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            {/* Results list */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {filteredSupplies.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                  <p>ไม่พบรายการเวชภัณฑ์ที่ค้นหา</p>
                  <button
                    onClick={() => {
                      setNewSupName(searchSup);
                      setIsAddModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold hover:bg-sky-100 transition inline-block"
                  >
                    + เพิ่ม "{searchSup}" ลงในระบบทันที
                  </button>
                </div>
              ) : (
                filteredSupplies.map(s => {
                  const isSelected = selectedSup?.SupplyID === s.SupplyID;
                  return (
                    <div
                      key={s.SupplyID}
                      onClick={() => setSelectedSup(s)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-sky-100/70 border-l-4 border-sky-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{s.SupplyName}</div>
                        <div className="text-[11px] text-slate-400">
                          รหัส: {s.SupplyID} • หน่วย: {s.Unit}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {s.Unit}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Area */}
            {selectedSup && (
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-sky-800">เวชภัณฑ์ที่เลือก:</span>
                    <h4 className="text-sm font-bold text-slate-900">{selectedSup.SupplyName}</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">หน่วย: {selectedSup.Unit}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      จำนวนที่เบิก
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-center font-bold outline-none"
                    />
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 mt-4 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>เพิ่มเข้ารายการ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & รอเบิก (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-sky-600" />
                  <span>รายการเวชภัณฑ์ที่จะเบิก ({cart.length})</span>
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold"
                  >
                    ล้างรายการ
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 mt-2">
                {cart.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    ยังไม่มีรายการเวชภัณฑ์ในใบเบิก
                    <br />
                    โปรดเลือกเวชภัณฑ์และกด "เพิ่มเข้ารายการ"
                  </div>
                ) : (
                  cart.map((c, idx) => (
                    <div key={c.supply.SupplyID} className="py-3 flex items-center justify-between">
                      <div className="flex-1 pr-2">
                        <div className="text-xs font-bold text-slate-800">{c.supply.SupplyName}</div>
                        <div className="text-[11px] text-slate-400">{c.supply.Unit}</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={c.quantity}
                          onChange={e => handleUpdateCartQty(idx, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-center text-xs font-bold"
                        />
                        <span className="text-xs text-slate-500">{c.supply.Unit}</span>
                        <button
                          onClick={() => handleRemoveFromCart(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom Button as specified: "รอเบิก" */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSavePending}
                disabled={isSubmitting || cart.length === 0}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition shadow-md shadow-sky-600/30 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'รอเบิก (บันทึกลงรายการรอเบิก)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Supply */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-sky-600" />
                <span>เพิ่มเวชภัณฑ์ใหม่ลงในระบบ</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewSupply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  ชื่อเวชภัณฑ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSupName}
                  onChange={e => setNewSupName(e.target.value)}
                  placeholder="เช่น สายให้อาหาร NG Tube No. 14"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  หน่วยนับ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newSupUnit}
                  onChange={e => setNewSupUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="ชิ้น">ชิ้น</option>
                  <option value="ซอง">ซอง</option>
                  <option value="ขวด">ขวด</option>
                  <option value="ม้วน">ม้วน</option>
                  <option value="แผ่น">แผ่น</option>
                  <option value="คู่">คู่</option>
                  <option value="กล่อง">กล่อง</option>
                  <option value="ชุด">ชุด</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-600/30 transition cursor-pointer"
                >
                  บันทึกลง Google Sheets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
