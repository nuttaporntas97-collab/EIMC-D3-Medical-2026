import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ALL_ROOMS, RoomNumber, BedNumber, Patient } from '../types';
import {
  Bed,
  UserPlus,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Pill,
  Package,
  ShoppingBag,
  Edit,
  User,
  Activity
} from 'lucide-react';

export const MainView: React.FC = () => {
  const { patients, navigateTo, setTargetRoomBed, setEditingPatient } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'VACANT' | 'OCCUPIED'>('ALL');

  // Modal for clicking an empty bed
  const [vacantBedModal, setVacantBedModal] = useState<{ room: RoomNumber; bed: BedNumber } | null>(null);

  // Modal for clicking an occupied bed
  const [patientDetailModal, setPatientDetailModal] = useState<Patient | null>(null);

  // Mapping occupied patients by room and bed
  const roomBedMap = useMemo(() => {
    const map: Record<string, Patient> = {};
    patients.forEach(p => {
      if (p.Status === 'Admit') {
        map[`${p.Room}_${p.Bed}`] = p;
      }
    });
    return map;
  }, [patients]);

  // Overall Statistics
  const totalBeds = 46;
  const occupiedCount = Object.keys(roomBedMap).length;
  const vacantCount = totalBeds - occupiedCount;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return ALL_ROOMS.filter(room => {
      const p1 = roomBedMap[`${room}_1`];
      const p2 = roomBedMap[`${room}_2`];

      // Status filter
      if (filterStatus === 'VACANT' && p1 && p2) return false;
      if (filterStatus === 'OCCUPIED' && !p1 && !p2) return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (room.includes(q)) return true;
      if (p1 && (p1.HN.toLowerCase().includes(q) || `${p1.FirstName} ${p1.LastName}`.toLowerCase().includes(q))) return true;
      if (p2 && (p2.HN.toLowerCase().includes(q) || `${p2.FirstName} ${p2.LastName}`.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [roomBedMap, searchQuery, filterStatus]);

  const handleBedClick = (room: RoomNumber, bed: BedNumber) => {
    const key = `${room}_${bed}`;
    const patient = roomBedMap[key];
    if (patient) {
      setPatientDetailModal(patient);
    } else {
      setVacantBedModal({ room, bed });
    }
  };

  const handleConfirmAddPatient = () => {
    if (!vacantBedModal) return;
    setTargetRoomBed(vacantBedModal);
    setVacantBedModal(null);
    navigateTo('patient-add');
  };

  const handleQuickAction = (action: 'medicine' | 'supplies' | 'relative-purchase' | 'edit') => {
    if (!patientDetailModal) return;
    const p = patientDetailModal;
    setPatientDetailModal(null);

    if (action === 'edit') {
      setEditingPatient(p);
      navigateTo('patient-edit');
    } else {
      navigateTo(action, { patientId: p.PatientID, hn: p.HN, room: p.Room, bed: p.Bed });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Ward Statistics */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>ผังหอผู้ป่วย 3 (Inpatient Ward D3)</span>
            </h1>
            <p className="text-sm text-slate-500">
              ระบบแสดงสถานะเตียงผู้ป่วย ห้อง 301 - 323 รวม 23 ห้อง 46 เตียง
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <div className="text-xs text-emerald-600 font-medium">เตียงว่าง</div>
              <div className="text-xl font-bold text-emerald-700">{vacantCount}</div>
            </div>
            <div className="px-4 py-2 bg-sky-50 border border-sky-200 rounded-xl text-center">
              <div className="text-xs text-sky-600 font-medium">มีผู้ป่วย Admit</div>
              <div className="text-xl font-bold text-sky-700">{occupiedCount}</div>
            </div>
            <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs text-slate-500 font-medium">รวมทั้งหมด</div>
              <div className="text-xl font-bold text-slate-800">{totalBeds}</div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ค้นหาห้อง (เช่น 301), HN, หรือชื่อผู้ป่วย..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด (23 ห้อง)
            </button>
            <button
              onClick={() => setFilterStatus('VACANT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'VACANT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              เฉพาะมีเตียงว่าง
            </button>
            <button
              onClick={() => setFilterStatus('OCCUPIED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === 'OCCUPIED'
                  ? 'bg-sky-600 text-white'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              เฉพาะมีผู้ป่วย
            </button>
          </div>
        </div>
      </div>

      {/* Rooms Grid (301 - 323) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map(room => {
          const patientBed1 = roomBedMap[`${room}_1`];
          const patientBed2 = roomBedMap[`${room}_2`];

          return (
            <div
              key={room}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Room Header */}
              <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold tracking-wide">ห้อง {room}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium">
                    2 เตียง
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {patientBed1 && patientBed2
                    ? 'เต็ม'
                    : !patientBed1 && !patientBed2
                    ? 'ว่างทั้งหมด'
                    : 'ว่าง 1 เตียง'}
                </div>
              </div>

              {/* Beds in Room */}
              <div className="p-3.5 space-y-3">
                {/* Bed 1 */}
                <div
                  onClick={() => handleBedClick(room, '1')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    patientBed1
                      ? 'bg-sky-50/80 border-sky-200 hover:bg-sky-100/70 hover:border-sky-300'
                      : 'bg-emerald-50/40 border-dashed border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Bed className="w-4 h-4 text-sky-600" />
                      <span>เตียง 1</span>
                    </span>
                    {patientBed1 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-600 text-white">
                        มีผู้ป่วย ({patientBed1.Status})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        ว่าง
                      </span>
                    )}
                  </div>

                  {patientBed1 ? (
                    <div className="mt-1 text-xs space-y-0.5">
                      <div className="font-semibold text-slate-900 truncate">
                        {patientBed1.FirstName} {patientBed1.LastName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>HN: {patientBed1.HN}</span>
                        <span>เพศ: {patientBed1.Gender}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-center py-1.5 text-xs text-emerald-700 font-medium flex items-center justify-center space-x-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>กดเพื่อเพิ่มผู้ป่วย</span>
                    </div>
                  )}
                </div>

                {/* Bed 2 */}
                <div
                  onClick={() => handleBedClick(room, '2')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    patientBed2
                      ? 'bg-sky-50/80 border-sky-200 hover:bg-sky-100/70 hover:border-sky-300'
                      : 'bg-emerald-50/40 border-dashed border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Bed className="w-4 h-4 text-sky-600" />
                      <span>เตียง 2</span>
                    </span>
                    {patientBed2 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-600 text-white">
                        มีผู้ป่วย ({patientBed2.Status})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        ว่าง
                      </span>
                    )}
                  </div>

                  {patientBed2 ? (
                    <div className="mt-1 text-xs space-y-0.5">
                      <div className="font-semibold text-slate-900 truncate">
                        {patientBed2.FirstName} {patientBed2.LastName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>HN: {patientBed2.HN}</span>
                        <span>เพศ: {patientBed2.Gender}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-center py-1.5 text-xs text-emerald-700 font-medium flex items-center justify-center space-x-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>กดเพื่อเพิ่มผู้ป่วย</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP 1: Clicking Vacant Bed (PDF requirement: Popup เพิ่มข้อมูล / ยกเลิก) */}
      {vacantBedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bed className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                ห้อง {vacantBedModal.room} เตียง {vacantBedModal.bed}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                เตียงนี้ว่างอยู่ ต้องการเพิ่มข้อมูลผู้ป่วยใหม่หรือไม่?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setVacantBedModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAddPatient}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-600/30 transition cursor-pointer"
              >
                เพิ่มข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Clicking Occupied Bed Patient Quick Actions */}
      {patientDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                  {patientDetailModal.Room}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {patientDetailModal.FirstName} {patientDetailModal.LastName}
                  </h3>
                  <div className="text-xs text-slate-500">
                    HN: <span className="font-semibold text-slate-700">{patientDetailModal.HN}</span> • ห้อง {patientDetailModal.Room} เตียง {patientDetailModal.Bed} ({patientDetailModal.Gender})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPatientDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleQuickAction('medicine')}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition text-left cursor-pointer"
              >
                <Pill className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">เบิกยา</div>
                  <div className="text-[10px] text-sky-600">สั่งรายการยาประจำเตียง</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('supplies')}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition text-left cursor-pointer"
              >
                <Package className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">เบิกเวชภัณฑ์</div>
                  <div className="text-[10px] text-indigo-600">สั่งเบิกอุปกรณ์การแพทย์</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('relative-purchase')}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition text-left cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">ญาติซื้อ</div>
                  <div className="text-[10px] text-amber-600">บันทึกของใช้ที่ญาติซื้อ</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('edit')}
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition text-left cursor-pointer"
              >
                <Edit className="w-5 h-5 text-slate-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">แก้ไขข้อมูล</div>
                  <div className="text-[10px] text-slate-500">เปลี่ยนห้อง/เตียง/สถานะ</div>
                </div>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPatientDetailModal(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
