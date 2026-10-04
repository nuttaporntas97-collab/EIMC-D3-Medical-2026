import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { HistoryItem, DispenseOrder } from '../types';
import {
  History as HistoryIcon,
  Search,
  Printer,
  Calendar,
  Eye,
  CheckCircle,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { history, dispenseOrders, patients, navigateTo } = useApp();

  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');

  // Group history items by OrderID to show distinct orders
  const groupedOrders = useMemo(() => {
    const map: Record<string, { orderId: string; date: string; hn: string; room: string; bed: string; requestedBy: string; confirmedBy: string; status: string; items: HistoryItem[] }> = {};

    history.forEach(h => {
      if (!map[h.OrderID]) {
        map[h.OrderID] = {
          orderId: h.OrderID,
          date: h.ConfirmedAt || h.CreatedAt,
          hn: h.HN,
          room: h.Room,
          bed: h.Bed,
          requestedBy: h.RequestedBy,
          confirmedBy: h.ConfirmedBy,
          status: h.Status || 'เบิกแล้ว',
          items: []
        };
      }
      map[h.OrderID].items.push(h);
    });

    const list = Object.values(map);
    // Sort descending by date
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [history]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return groupedOrders.filter(ord => {
      if (selectedRoom !== 'ALL' && ord.room !== selectedRoom) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const patient = patients.find(p => p.HN === ord.hn);
      const patientName = patient ? `${patient.FirstName} ${patient.LastName}`.toLowerCase() : '';
      return (
        ord.orderId.toLowerCase().includes(q) ||
        ord.hn.toLowerCase().includes(q) ||
        ord.room.includes(q) ||
        ord.requestedBy.toLowerCase().includes(q) ||
        ord.confirmedBy.toLowerCase().includes(q) ||
        patientName.includes(q)
      );
    });
  }, [groupedOrders, selectedRoom, search, patients]);

  const handleReprint = (ord: any) => {
    const orderObj: DispenseOrder = {
      OrderID: ord.orderId,
      PatientID: ord.items[0]?.PatientID || '',
      HN: ord.hn,
      Room: ord.room as any,
      Bed: ord.bed as any,
      CreatedBy: ord.requestedBy,
      CreatedAt: ord.items[0]?.CreatedAt || ord.date,
      ConfirmedBy: ord.confirmedBy,
      ConfirmedAt: ord.date,
      Status: 'CONFIRMED'
    };

    navigateTo('dispense-print', {
      order: orderObj,
      items: ord.items
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <HistoryIcon className="w-6 h-6 text-sky-600" />
            <span>ประวัติการเบิก (Dispensing History)</span>
          </h1>
          <p className="text-xs text-slate-500">
            รายการใบเบิกที่ยืนยันการจ่ายยาและเวชภัณฑ์แล้ว ข้อมูลดึงจาก Sheet History ใน Google Sheets
          </p>
        </div>

        <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center space-x-2 self-start sm:self-auto">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>รวมใบเบิกทั้งหมด {groupedOrders.length} ฉบับ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่ใบเบิก, HN, ชื่อผู้ป่วย หรือผู้เบิก..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">กรองตามห้อง:</span>
          <select
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="ALL">ทุกห้อง</option>
            {Array.from({ length: 23 }, (_, i) => String(301 + i)).map(r => (
              <option key={r} value={r}>
                ห้อง {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">วันที่ / เวลาเบิก</th>
                <th className="py-3.5 px-4">เลขที่ใบเบิก</th>
                <th className="py-3.5 px-4">ห้อง / เตียง</th>
                <th className="py-3.5 px-4">HN</th>
                <th className="py-3.5 px-4">ผู้ป่วย</th>
                <th className="py-3.5 px-4 text-center">จำนวนรายการ</th>
                <th className="py-3.5 px-4">ผู้ทำรายการ</th>
                <th className="py-3.5 px-4">ผู้ยืนยัน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-right">พิมพ์ซ้ำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 text-xs">
                    ยังไม่มีประวัติการเบิกในระบบ
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const patient = patients.find(p => p.HN === ord.hn);
                  const patientName = patient ? `${patient.FirstName} ${patient.LastName}` : '-';

                  return (
                    <tr key={ord.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ord.date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sky-700 text-xs whitespace-nowrap">
                        {ord.orderId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        ห้อง {ord.room} ({ord.bed})
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{ord.hn}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{patientName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {ord.items.length} รายการ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{ord.requestedBy}</td>
                      <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                        {ord.confirmedBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleReprint(ord)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>พิมพ์ซ้ำ</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
