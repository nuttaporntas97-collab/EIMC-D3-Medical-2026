import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken } from '../services/firebaseAuth';
import { db } from '../services/googleSheetsService';
import {
  AppPage,
  SessionUser,
  Patient,
  Medicine,
  Supply,
  RelativePurchase,
  PendingItem,
  DispenseOrder,
  DispenseOrderItem,
  HistoryItem,
  RoomNumber,
  BedNumber
} from '../types';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  // Navigation & Page
  currentPage: AppPage;
  navigateTo: (page: AppPage, payload?: any) => void;
  pagePayload: any;

  // Session
  sessionUser: SessionUser | null;
  loginSession: (user: SessionUser) => void;
  logoutSession: () => void;

  // Google Account & Sheets Connection
  googleUser: FirebaseUser | null;
  isGoogleConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  syncMessage: string;
  handleGoogleSignIn: () => Promise<void>;
  handleGoogleSignOut: () => Promise<void>;
  syncWithGoogleSheets: () => Promise<void>;

  // Data
  patients: Patient[];
  medicines: Medicine[];
  supplies: Supply[];
  relativePurchases: RelativePurchase[];
  pendingItems: PendingItem[];
  dispenseOrders: DispenseOrder[];
  history: HistoryItem[];

  // Refresh
  refreshData: () => void;

  // Selected state for workflows
  targetRoomBed: { room: RoomNumber; bed: BedNumber } | null;
  setTargetRoomBed: (rb: { room: RoomNumber; bed: BedNumber } | null) => void;
  editingPatient: Patient | null;
  setEditingPatient: (p: Patient | null) => void;
  selectedPrintOrder: { order: DispenseOrder; items: DispenseOrderItem[] | HistoryItem[] } | null;
  setSelectedPrintOrder: (order: { order: DispenseOrder; items: DispenseOrderItem[] | HistoryItem[] } | null) => void;
  selectedPendingForDetail: PendingItem[] | null;
  setSelectedPendingForDetail: (items: PendingItem[] | null) => void;

  // Notifications
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<AppPage>('index');
  const [pagePayload, setPagePayload] = useState<any>(null);

  // Session user in local storage
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(() => {
    try {
      const saved = localStorage.getItem('eimc_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Google Auth state
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(db.getSpreadsheetId());
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(db.getSpreadsheetUrl());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Data lists
  const [patients, setPatients] = useState<Patient[]>(db.patients);
  const [medicines, setMedicines] = useState<Medicine[]>(db.medicines);
  const [supplies, setSupplies] = useState<Supply[]>(db.supplies);
  const [relativePurchases, setRelativePurchases] = useState<RelativePurchase[]>(db.relativePurchases);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>(db.pendingItems);
  const [dispenseOrders, setDispenseOrders] = useState<DispenseOrder[]>(db.dispenseOrders);
  const [history, setHistory] = useState<HistoryItem[]>(db.history);

  // Workflow states
  const [targetRoomBed, setTargetRoomBed] = useState<{ room: RoomNumber; bed: BedNumber } | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<{ order: DispenseOrder; items: DispenseOrderItem[] | HistoryItem[] } | null>(null);
  const [selectedPendingForDetail, setSelectedPendingForDetail] = useState<PendingItem[] | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshData = () => {
    setPatients([...db.patients]);
    setMedicines([...db.medicines]);
    setSupplies([...db.supplies]);
    setRelativePurchases([...db.relativePurchases]);
    setPendingItems([...db.pendingItems]);
    setDispenseOrders([...db.dispenseOrders]);
    setHistory([...db.history]);
    setSpreadsheetId(db.getSpreadsheetId());
    setSpreadsheetUrl(db.getSpreadsheetUrl());
  };

  // Sync with Google Sheets
  const syncWithGoogleSheets = async () => {
    setIsSyncing(true);
    setSyncMessage('กำลังเชื่อมต่อ Google Sheets...');
    try {
      const result = await db.syncAllData();
      if (result.success) {
        refreshData();
        setSyncMessage('เชื่อมต่อ Google Sheets สำเร็จ');
        showToast('ซิงค์ข้อมูลกับ Google Sheets สำเร็จ', 'success');
      } else {
        setSyncMessage(result.message);
        showToast(result.message, 'info');
      }
    } catch (err: any) {
      setSyncMessage(err.message || 'เชื่อมต่อล้มเหลว');
      showToast('ไม่สามารถซิงค์กับ Google Sheets ได้', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen to Google Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, _token) => {
        setGoogleUser(user);
        setIsSyncing(true);
        try {
          await db.initSpreadsheet();
          refreshData();
        } catch (e) {
          console.warn('Init spreadsheet on auth error:', e);
        } finally {
          setIsSyncing(false);
        }
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        showToast(`เชื่อมต่อ Google Account: ${res.user.email} สำเร็จ`, 'success');
        await db.initSpreadsheet();
        refreshData();
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      showToast('การเชื่อมต่อ Google ล้มเหลว: ' + (err.message || ''), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    showToast('ยกเลิกการเชื่อมต่อ Google สำเร็จ', 'info');
  };

  const loginSession = (user: SessionUser) => {
    setSessionUser(user);
    localStorage.setItem('eimc_session_user', JSON.stringify(user));
    showToast(`ยินดีต้อนรับ ${user.name} (${user.position})`, 'success');
    setCurrentPage('main');
  };

  const logoutSession = () => {
    setSessionUser(null);
    localStorage.removeItem('eimc_session_user');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    setCurrentPage('login');
  };

  const navigateTo = (page: AppPage, payload?: any) => {
    // Protected pages guard: if logged out, allow only index, login, register
    if (!sessionUser && page !== 'index' && page !== 'login' && page !== 'register') {
      showToast('กรุณาเข้าสู่ระบบก่อนใช้งาน', 'error');
      setCurrentPage('login');
      return;
    }
    setPagePayload(payload);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
        pagePayload,
        sessionUser,
        loginSession,
        logoutSession,
        googleUser,
        isGoogleConnected: !!googleUser,
        spreadsheetId,
        spreadsheetUrl,
        isSyncing,
        syncMessage,
        handleGoogleSignIn,
        handleGoogleSignOut,
        syncWithGoogleSheets,
        patients,
        medicines,
        supplies,
        relativePurchases,
        pendingItems,
        dispenseOrders,
        history,
        refreshData,
        targetRoomBed,
        setTargetRoomBed,
        editingPatient,
        setEditingPatient,
        selectedPrintOrder,
        setSelectedPrintOrder,
        selectedPendingForDetail,
        setSelectedPendingForDetail,
        toasts,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
