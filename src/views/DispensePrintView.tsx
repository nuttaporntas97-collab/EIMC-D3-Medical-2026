import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DispenseOrder, DispenseOrderItem, HistoryItem } from '../types';
import { Printer, ArrowLeft, Activity, CheckCircle2, FileText } from 'lucide-react';

export const DispensePrintView: React.FC = () => {
  const { pagePayload, navigateTo, dispenseOrders, history, patients } = useApp();

  // Determine active order and items from payload or latest
  const { order, items } = useMemo(() => {
    if (pagePayload && pagePayload.order) {
      return {
        order: pagePayload.order as DispenseOrder,
        items: (pagePayload.items || []) as Array<DispenseOrderItem | HistoryItem>
      };
    }

    // Fallback to latest dispense order
    if (dispenseOrders.length > 0) {
      const latest = dispenseOrders[0];
      const matchedItems = history.filter(h => h.OrderID === latest.OrderID);
      return { order: latest, items: matchedItems };
    }

    return { order: null, items: [] };
  }, [pagePayload, dispenseOrders, history]);

  // Find patient name
  const patientInfo = useMemo(() => {
    if (!order) return null;
    return patients.find(p => p.PatientID === order.PatientID || p.HN === order.HN);
  }, [order, patients]);

  if (!order) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <FileText className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">ไม่พบข้อมูลใบเบิกสำหรับพิมพ์</h3>
        <button
          onClick={() => navigateTo('history')}
          className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition"
        >
          ไปยังประวัติการเบิก
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-print action header */}
      <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => navigateTo('history')}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ไปยังหน้าประวัติการเบิก</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateTo('main')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            กลับหน้าผังหอผู้ป่วย
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-600/30 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ใบเบิก (Print)</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT CARD */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-md border border-slate-200 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none text-slate-900">
        {/* Document Header */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  EIMC D3 Medical
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  โรงพยาบาลศูนย์การแพทย์ EIMC • หอผู้ป่วยสามัญ 3 (Inpatient Ward 3)
                </p>
                <p className="text-[11px] text-slate-500">
                  ใบเบิกยาและเวชภัณฑ์ประจำหอผู้ป่วย (Medical Dispensing Order Form)
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-md border border-sky-200 inline-block">
                เลขที่: {order.OrderID}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                วันที่:{' '}
                {new Date(order.ConfirmedAt || order.CreatedAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Details Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4 print:bg-white print:border-slate-300">
          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">ผู้ป่วย:</span>
            <span className="font-bold text-slate-900">
              {patientInfo ? `${patientInfo.FirstName} ${patientInfo.LastName}` : '-'}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">HN:</span>
            <span className="font-mono font-bold text-sky-800">{order.HN}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">ห้องพัก:</span>
            <span className="font-bold text-slate-900">ห้อง {order.Room}</span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block uppercase font-bold">เตียง:</span>
            <span className="font-bold text-slate-900">เตียง {order.Bed}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">ลำดับ</th>
                <th className="py-2.5 px-3 border-r border-slate-300">รายการยา / เวชภัณฑ์</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">ประเภท</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-24">จำนวน</th>
                <th className="py-2.5 px-3 border-r border-slate-300">ผู้ขอเบิก (Requested By)</th>
                <th className="py-2.5 px-3 text-center w-28">เวลาที่ขอเบิก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    ไม่มีรายการในใบเบิกนี้
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const itmType = (item as any).ItemType || 'MEDICINE';
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-600">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 font-semibold text-slate-900">
                        {item.ItemName}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {itmType === 'MEDICINE' ? 'ยา' : 'เวชภัณฑ์'}
                        </span>
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-center font-bold text-slate-900 text-sm">
                        {item.Quantity}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 text-slate-700">
                        {item.RequestedBy}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {new Date((item as any).RequestedAt || (item as any).CreatedAt || Date.now()).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures & Confirmation Block */}
        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs text-center">
          <div className="space-y-6">
            <div className="text-slate-500">ผู้ทำรายการขอเบิก (Requested By)</div>
            <div className="pt-8 border-b border-slate-400 w-3/4 mx-auto"></div>
            <div className="font-semibold text-slate-800">({order.CreatedBy || 'พยาบาลผู้รับผิดชอบ'})</div>
            <div className="text-[11px] text-slate-400">พยาบาลประจำวอร์ด / ผู้รับผิดชอบ</div>
          </div>

          <div className="space-y-6">
            <div className="text-slate-500">ผู้ยืนยัน / ผู้จ่ายยา (Confirmed & Dispensed By)</div>
            <div className="pt-8 border-b border-slate-400 w-3/4 mx-auto"></div>
            <div className="font-semibold text-slate-800">({order.ConfirmedBy || 'เภสัชกร/พยาบาลวิชาชีพ'})</div>
            <div className="text-[11px] text-slate-400">เภสัชกร / หัวหน้าเวรพยาบาล</div>
          </div>
        </div>

        {/* Print Footer Notice */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          เอกสารนี้พิมพ์จากระบบ EIMC D3 Medical Database • บันทึกบน Google Sheets แล้ว
        </div>
      </div>
    </div>
  );
};
