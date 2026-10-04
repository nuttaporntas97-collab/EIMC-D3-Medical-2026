import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, ShieldCheck, Database, ArrowRight, UserCheck, Stethoscope } from 'lucide-react';

export const IndexView: React.FC = () => {
  const { navigateTo, sessionUser } = useApp();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-sky-50 via-white to-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 text-center">
        {/* Medical Cross Logo */}
        <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 transform hover:rotate-3 transition duration-300">
          <Activity className="w-12 h-12" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>ระบบบริหารจัดการหอผู้ป่วย</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            EIMC <span className="text-sky-600">D3 Medical</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            ระบบบริหารเตียงผู้ป่วย เบิกจ่ายยาและเวชภัณฑ์ประจำหอผู้ป่วย 3 (ห้อง 301 - 323)
            เชื่อมต่อฐานข้อมูลส่วนกลางด้วย Google Sheets
          </p>
        </div>

        {/* Quick Highlights */}
        <div className="grid grid-cols-2 gap-3 text-left pt-2">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span>23 ห้อง (46 เตียง)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Google Sheets Database</span>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="pt-4 space-y-3">
          {sessionUser ? (
            <button
              onClick={() => navigateTo('main')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition shadow-md shadow-sky-600/30 cursor-pointer"
            >
              <span>ไปยังผังหอผู้ป่วย</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => navigateTo('login')}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-sky-600 hover:bg-sky-700 active:scale-[0.99] transition shadow-md shadow-sky-600/30 cursor-pointer"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <div className="text-xs text-slate-400">
            โรงพยาบาล EIMC • แผนกบริการเภสัชกรรมและหอผู้ป่วยใน 3
          </div>
        </div>
      </div>
    </div>
  );
};
