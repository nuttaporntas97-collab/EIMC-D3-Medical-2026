import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import { PendingItem, RoomNumber } from '../types';
import {
  Clock,
  Pill,
  Package,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Users,
  Calendar,
  Layers
} from 'lucide-react';

export const PendingView: React.FC = () => {
  const { pendingItems, sessionUser, refreshData, showToast, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'MEDICINE' | 'SUPPLY'>('ALL');
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter by Type
  const filteredByType = useMemo(() => {
    if (activeTab === 'ALL') return pendingItems;
    return pendingItems.filter(p => p.ItemType === activeTab);
  }, [pendingItems, activeTab]);

  // Sort strictly by Room (301, 302, ... 323) as required by Section 26
  const sortedByRoom = useMemo(() => {
    return [...filteredByType].sort((a, b) => {
      const roomA = parseInt(a.Room, 10) || 0;
      const roomB = parseInt(b.Room, 10) || 0;
      if (roomA !== roomB) return roomA - roomB;
      const bedDiff = (a.Bed || '').localeCompare(b.Bed || '');
      if (bedDiff !== 0) return bedDiff;
      return new Date(a.RequestedAt).getTime() - new Date(b.RequestedAt).getTime();
    });
  }, [filteredByType]);

  // Group by Room and Patient to facilitate Section 27 Multi-User Combination
  const groupedByRoomPatient = useMemo(() => {
    const map: Record<string, { room: RoomNumber; bed: any; hn: string; patientId: string; items: PendingItem[] }> = {};
    sortedByRoom.forEach(item => {
      const key = `${item.Room}_${item.Bed}_${item.HN}`;
      if (!map[key]) {
        map[key] = {
          room: item.Room,
          bed: item.Bed,
          hn: item.HN,
          patientId: item.PatientID,
          items: []
        };
      }
      map[key].items.push(item);
    });
    return Object.values(map);
  }, [sortedByRoom]);

  // Toggle item selection
  const handleToggleItem = (pendingId: string) => {
    setSelectedPendingIds(prev =>
      prev.includes(pendingId) ? prev.filter(id => id !== pendingId) : [...prev, pendingId]
    );
  };

  // Select all items for a specific room group (Section 27: multi-user combine)
  const handleSelectRoomGroup = (groupItems: PendingItem[]) => {
    const groupIds = groupItems.map(i => i.PendingID);
    const allSelected = groupIds.every(id => selectedPendingIds.includes(id));

    if (allSelected) {
      setSelectedPendingIds(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedPendingIds(prev => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  // Selected items list
  const selectedItems = useMemo(() => {
    return pendingItems.filter(p => selectedPendingIds.includes(p.PendingID));
  }, [pendingItems, selectedPendingIds]);

  // Distinct rooms in selection
  const distinctRoomsInSelection = useMemo(() => {
    return Array.from(new Set(selectedItems.map(i => `ห้อง ${i.Room}`)));
  }, [selectedItems]);

  // Confirm Dispense action
  const handleExecuteDispense = async () => {
    if (selectedPendingIds.length === 0) return;
    setIsProcessing(true);

    try {
      const first = selectedItems[0];
      const res = await db.confirmDispense({
        pendingIds: selectedPendingIds,
        confirmedBy: sessionUser ? `${sessionUser.name} (${sessionUser.sapUser})` : 'พยาบาล',
        patientId: first.PatientID,
        hn: first.HN,
        room: first.Room,
        bed: first.Bed
      });

      if (res.success && res.order) {
        refreshData();
        showToast(res.message, 'success');
        setSelectedPendingIds([]);
        setIsConfirmModalOpen(false);

        // Transition immediately to Print View
        navigateTo('dispense-print', {
          order: res.order,
          items: res.items || []
        });
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'ดำเนินการเบิกล้มเหลว', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span>รายการรอเบิก (Pending Dispense Orders)</span>
          </h1>
          <p className="text-xs text-slate-500">
            ระบบจัดเรียงตามลำดับห้อง (301-323) และรองรับการรวมรายการจากผู้ใช้งานหลายคนเป็นใบเบิกเดียว
          </p>
        </div>

        {/* Tab Switcher: ยา / เวชภัณฑ์ / ทั้งหมด */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({pendingItems.length})
          </button>
          <button
            onClick={() => setActiveTab('MEDICINE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'MEDICINE'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-sky-700 hover:text-sky-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>รอเบิกยา ({pendingItems.filter(p => p.ItemType === 'MEDICINE').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('SUPPLY')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'SUPPLY'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>รอเบิกเวชภัณฑ์ ({pendingItems.filter(p => p.ItemType === 'SUPPLY').length})</span>
          </button>
        </div>
      </div>

      {/* Floating Action Bar when items selected */}
      {selectedPendingIds.length > 0 && (
        <div className="bg-sky-900 text-white p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-20 z-20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center font-bold text-sm">
              {selectedPendingIds.length}
            </div>
            <div>
              <div className="text-sm font-bold">
                เลือกแล้ว {selectedPendingIds.length} รายการ ({distinctRoomsInSelection.join(', ')})
              </div>
              <div className="text-xs text-sky-200">
                พร้อมรวมรายการจากผู้ใช้งานหลายคนเพื่อสร้างใบเบิกเดียว
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPendingIds([])}
              className="px-3 py-2 text-xs font-semibold text-sky-200 hover:text-white transition"
            >
              ยกเลิกการเลือก
            </button>
            <button
              onClick={() => setIsConfirmModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-md transition cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>ดำเนินการเบิก ({selectedPendingIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Grouped Pending Items (by Room & Patient, sorted by Room) */}
      {groupedByRoomPatient.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">ไม่มีรายการรอเบิกค้างในระบบ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ทุกรายการได้รับการดำเนินการเรียบร้อยแล้ว หากต้องการสั่งเบิก สามารถไปที่เมนู "เบิกยา" หรือ "เบิกเวชภัณฑ์"
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByRoomPatient.map(group => {
            const allGroupSelected = group.items.every(i => selectedPendingIds.includes(i.PendingID));
            const someGroupSelected = group.items.some(i => selectedPendingIds.includes(i.PendingID));

            // Distinct users who requested items in this room
            const requesters = Array.from(new Set(group.items.map(i => i.RequestedBy)));

            return (
              <div
                key={`${group.room}_${group.bed}_${group.hn}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
              >
                {/* Group Room Header */}
                <div className="bg-slate-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleSelectRoomGroup(group.items)}
                      className="p-1 rounded text-slate-300 hover:text-white"
                      title={allGroupSelected ? 'ยกเลิกเลือกทั้งห้อง' : 'เลือกทั้งหมดในห้องนี้'}
                    >
                      {allGroupSelected ? (
                        <CheckSquare className="w-5 h-5 text-sky-400" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-bold text-white">
                          ห้อง {group.room} (เตียง {group.bed})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-600 text-white">
                          HN: {group.hn}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5 flex items-center space-x-2">
                        <span>{group.items.length} รายการรอเบิก</span>
                        <span>•</span>
                        <span>ขอโดย: {requesters.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectRoomGroup(group.items)}
                    className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition cursor-pointer"
                  >
                    {allGroupSelected ? 'ยกเลิกเลือกทั้งห้อง' : `เลือกทั้งห้อง (${group.items.length})`}
                  </button>
                </div>

                {/* Items in Room Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-12 text-center">เลือก</th>
                        <th className="py-2.5 px-4">ประเภท</th>
                        <th className="py-2.5 px-4">ชื่อรายการ</th>
                        <th className="py-2.5 px-4 text-center">จำนวน</th>
                        <th className="py-2.5 px-4">ผู้ทำรายการ (Requested By)</th>
                        <th className="py-2.5 px-4">วันที่ / เวลาขอ</th>
                        <th className="py-2.5 px-4 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {group.items.map(item => {
                        const isSelected = selectedPendingIds.includes(item.PendingID);
                        return (
                          <tr
                            key={item.PendingID}
                            onClick={() => handleToggleItem(item.PendingID)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-sky-50/80 font-medium' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // handled by row click
                                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 pointer-events-none"
                              />
                            </td>
                            <td className="py-3 px-4">
                              {item.ItemType === 'MEDICINE' ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                                  <Pill className="w-3 h-3 text-sky-600" />
                                  <span>ยา</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                                  <Package className="w-3 h-3 text-indigo-600" />
                                  <span>เวชภัณฑ์</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {item.ItemName}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-800">
                              {item.Quantity}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <span className="font-medium text-sky-800">{item.RequestedBy}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(item.RequestedAt).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                {item.Status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP: Confirmation of Dispense (PDF #29 requirement: ยืนยันการดำเนินการเบิกหรือไม่?) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                ยืนยันการดำเนินการเบิกหรือไม่?
              </h3>
              <p className="text-xs text-slate-500">
                ระบบจะรวมรายการที่เลือกจำนวน <b>{selectedPendingIds.length} รายการ</b> สร้างเป็นใบเบิกเดียว (DispenseOrder) และบันทึกลง History ใน Google Sheets
              </p>
            </div>

            {/* Selected Summary preview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto divide-y divide-slate-200 text-xs">
              {selectedItems.map((item, idx) => (
                <div key={item.PendingID} className="py-1.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{idx + 1}. {item.ItemName}</span>
                    <span className="text-[10px] text-slate-400 block">
                      ห้อง {item.Room} (เตียง {item.Bed}) • ขอโดย: {item.RequestedBy}
                    </span>
                  </div>
                  <span className="font-bold text-sky-700">{item.Quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteDispense}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-md shadow-sky-600/30 transition disabled:opacity-70 cursor-pointer"
              >
                {isProcessing ? 'กำลังบันทึก...' : 'ยืนยันการเบิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
