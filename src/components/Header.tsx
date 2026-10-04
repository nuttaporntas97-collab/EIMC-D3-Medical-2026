import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Database,
  RefreshCw,
  UserCheck,
  Menu,
  X,
  ExternalLink,
  Building2
} from 'lucide-react';

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const {
    sessionUser,
    currentPage,
    navigateTo,
    isGoogleConnected,
    googleUser,
    handleGoogleSignIn,
    spreadsheetUrl,
    isSyncing,
    syncWithGoogleSheets
  } = useApp();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Ward Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => navigateTo(sessionUser ? 'main' : 'index')}
              className="flex items-center space-x-3 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                    EIMC <span className="text-sky-600">D3 Medical</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                    หอผู้ป่วย 3
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  ห้อง 301 - 323 (23 ห้อง 46 เตียง)
                </p>
              </div>
            </button>
          </div>

          {/* Right: Google Sheets DB Status & User Info */}
          <div className="flex items-center space-x-3">
            {/* Google Sheets Status */}
            {isGoogleConnected ? (
              <div className="flex items-center space-x-1 sm:space-x-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden md:inline">Google Sheets Connected</span>
                <button
                  onClick={syncWithGoogleSheets}
                  disabled={isSyncing}
                  title="ซิงค์ข้อมูลล่าสุดจาก Google Sheets"
                  className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="เปิด Google Sheets ในแท็บใหม่"
                    className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                className="flex items-center space-x-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                title="เชื่อมต่อ Google Sheets ฐานข้อมูลกลาง"
              >
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">เชื่อมต่อ Google Sheets</span>
              </button>
            )}

            {/* Current Session User */}
            {sessionUser && (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 pl-2.5 pr-3 py-1 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-semibold">
                  {sessionUser.sapUser.slice(-2)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {sessionUser.name}
                  </div>
                  <div className="text-[10px] text-sky-600 font-medium leading-none">
                    {sessionUser.position} ({sessionUser.sapUser})
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
