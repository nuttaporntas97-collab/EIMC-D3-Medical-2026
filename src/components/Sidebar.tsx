import React from 'react';
import { useApp } from '../context/AppContext';
import { AppPage } from '../types';
import {
  Users,
  Pill,
  Package,
  ShoppingBag,
  Clock,
  History,
  Settings,
  LogOut,
  LayoutGrid,
  Bed
} from 'lucide-react';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { currentPage, navigateTo, logoutSession, pendingItems } = useApp();

  const menuItems: Array<{
    page: AppPage;
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    {
      page: 'main',
      label: 'ผังหอผู้ป่วย (เตียง)',
      sublabel: 'ห้อง 301 - 323',
      icon: <LayoutGrid className="w-5 h-5" />
    },
    {
      page: 'patient',
      label: 'ผู้ป่วย',
      sublabel: 'รายชื่อและการจัดการ',
      icon: <Users className="w-5 h-5" />
    },
    {
      page: 'medicine',
      label: 'เบิกยา',
      sublabel: 'สั่งเบิกยาประจำห้อง',
      icon: <Pill className="w-5 h-5" />
    },
    {
      page: 'supplies',
      label: 'เบิกเวชภัณฑ์',
      sublabel: 'สั่งเบิกอุปกรณ์ทางการแพทย์',
      icon: <Package className="w-5 h-5" />
    },
    {
      page: 'relative-purchase',
      label: 'ญาติซื้อ',
      sublabel: 'บันทึกของใช้ที่ญาติจัดซื้อ',
      icon: <ShoppingBag className="w-5 h-5" />
    },
    {
      page: 'pending',
      label: 'รายการรอเบิก',
      sublabel: 'รวมและดำเนินการเบิก',
      icon: <Clock className="w-5 h-5" />,
      badge: pendingItems.length
    },
    {
      page: 'history',
      label: 'ประวัติการเบิก',
      sublabel: 'ใบเบิกที่ยืนยันแล้ว',
      icon: <History className="w-5 h-5" />
    },
    {
      page: 'settings',
      label: 'ตั้งค่า',
      sublabel: 'บัญชีผู้ใช้และฐานข้อมูล',
      icon: <Settings className="w-5 h-5" />
    }
  ];

  const handleNav = (page: AppPage) => {
    navigateTo(page);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMobileMenuOpen(false);
    logoutSession();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden print:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-slate-900 text-white z-40 transform transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden flex flex-col justify-between ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-4 px-3 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            เมนูการทำงานหลัก
          </div>

          {menuItems.map(item => {
            const isActive =
              currentPage === item.page ||
              (item.page === 'patient' && (currentPage === 'patient-add' || currentPage === 'patient-edit')) ||
              (item.page === 'pending' && currentPage === 'pending-detail') ||
              (item.page === 'history' && currentPage === 'history-detail');

            return (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-900/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${isActive ? 'text-white' : 'text-sky-400 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <div>{item.label}</div>
                    {item.sublabel && (
                      <div className={`text-[10px] ${isActive ? 'text-sky-100' : 'text-slate-400'}`}>
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-amber-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <LogOut className="w-5 h-5 text-rose-400" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
};
