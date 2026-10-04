import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/googleSheetsService';
import {
  Settings,
  User,
  KeyRound,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Copy,
  Code2,
  FileCode
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    sessionUser,
    isGoogleConnected,
    googleUser,
    handleGoogleSignIn,
    handleGoogleSignOut,
    spreadsheetId,
    spreadsheetUrl,
    isSyncing,
    syncWithGoogleSheets,
    showToast
  } = useApp();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!sessionUser) return;
    if (!oldPassword || !newPassword) {
      setPasswordMsg({ text: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่', isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน', isError: true });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await db.changePassword(sessionUser.sapUser, oldPassword, newPassword);
      if (res.success) {
        setPasswordMsg({ text: res.message, isError: false });
        showToast(res.message, 'success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ text: res.message, isError: true });
      }
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', isError: true });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const copyAppsScript = () => {
    const code = `// Google Apps Script Code - EIMC D3 Medical
// ดูไฟล์ Code.gs และ Config.gs ในโปรเจกต์
function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }
`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast('คัดลอกโค้ด Google Apps Script แล้ว', 'success');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-6 h-6 text-sky-600" />
          <span>การตั้งค่าระบบ (Settings & Database)</span>
        </h1>
        <p className="text-xs text-slate-500">
          ข้อมูลบัญชีผู้ใช้งาน การเปลี่ยนรหัสผ่าน และการเชื่อมต่อฐานข้อมูล Google Sheets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        {sessionUser && (
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-sky-600" />
              <span>ข้อมูลผู้ใช้งานที่เข้าสู่ระบบ</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">SAP User:</span>
                <span className="font-mono font-bold text-sky-700">{sessionUser.sapUser}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">ชื่อ - นามสกุล:</span>
                <span className="font-semibold text-slate-900">{sessionUser.name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 font-medium">ตำแหน่ง:</span>
                <span className="font-medium text-slate-800">{sessionUser.position}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">สิทธิ์การใช้งาน (Role):</span>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800">
                  {sessionUser.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Card (PDF #33 requirement) */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2 pb-3 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-sky-600" />
            <span>เปลี่ยนรหัสผ่าน (Change Password)</span>
          </h3>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                passwordMsg.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {passwordMsg.isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                รหัสผ่านเดิม <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                รหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                ยืนยันรหัสผ่านใหม่ <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isUpdatingPassword ? 'กำลังบันทึกลง Google Sheets...' : 'บันทึกรหัสผ่านใหม่'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Google Sheets Database Status */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>ฐานข้อมูลกลาง Google Sheets (EIMC D3 Medical Database)</span>
          </h3>

          <div className="flex items-center space-x-2">
            <button
              onClick={syncWithGoogleSheets}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ข้อมูลเดี๋ยวนี้'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-slate-700">สถานะการเชื่อมต่อ Google Account:</span>{' '}
                {isGoogleConnected ? (
                  <span className="text-emerald-700 font-bold">
                    เชื่อมต่อแล้ว ({googleUser?.email})
                  </span>
                ) : (
                  <span className="text-slate-500">ยังไม่ได้เชื่อมต่อ Google Account</span>
                )}
              </div>

              {!isGoogleConnected ? (
                <button
                  onClick={handleGoogleSignIn}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition"
                >
                  Sign in with Google
                </button>
              ) : (
                <button
                  onClick={handleGoogleSignOut}
                  className="text-rose-600 hover:underline"
                >
                  ยกเลิกการเชื่อมต่อ
                </button>
              )}
            </div>

            {spreadsheetId && (
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-700">Spreadsheet ID:</span>{' '}
                  <span className="font-mono text-slate-600">{spreadsheetId}</span>
                </div>

                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-800 font-semibold"
                  >
                    <span>เปิดดู Google Sheet ในแท็บใหม่</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Database Sheets Summary */}
          <div className="text-slate-600">
            <p className="font-semibold text-slate-800 mb-1">
              ตารางทั้งหมด 9 Sheets ที่ใช้งานจริงใน Google Spreadsheet:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Users (ผู้ใช้งานระบบ)',
                'Patients (ทะเบียนผู้ป่วย)',
                'Medicines (รายการยา)',
                'Supplies (รายการเวชภัณฑ์)',
                'RelativePurchases (ญาติซื้อ)',
                'PendingItems (รายการรอเบิก)',
                'DispenseOrders (ใบเบิกยา)',
                'DispenseOrderItems (รายการในใบเบิก)',
                'History (ประวัติการเบิก)'
              ].map(sheet => (
                <div key={sheet} className="p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">{sheet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
