import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { IndexView } from './views/IndexView';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { MainView } from './views/MainView';
import { PatientListView } from './views/PatientListView';
import { PatientAddView } from './views/PatientAddView';
import { PatientEditView } from './views/PatientEditView';
import { MedicineView } from './views/MedicineView';
import { SuppliesView } from './views/SuppliesView';
import { RelativePurchaseView } from './views/RelativePurchaseView';
import { PendingView } from './views/PendingView';
import { DispensePrintView } from './views/DispensePrintView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, sessionUser, toasts, removeToast } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Render view based on page state
  const renderCurrentView = () => {
    switch (currentPage) {
      case 'index':
        return <IndexView />;
      case 'login':
        return <LoginView />;
      case 'register':
        return <RegisterView />;
      case 'main':
        return <MainView />;
      case 'patient':
        return <PatientListView />;
      case 'patient-add':
        return <PatientAddView />;
      case 'patient-edit':
        return <PatientEditView />;
      case 'medicine':
        return <MedicineView />;
      case 'supplies':
        return <SuppliesView />;
      case 'relative-purchase':
        return <RelativePurchaseView />;
      case 'pending':
      case 'pending-detail':
        return <PendingView />;
      case 'dispense-print':
        return <DispensePrintView />;
      case 'history':
      case 'history-detail':
        return <HistoryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <IndexView />;
    }
  };

  const isAuthPage = currentPage === 'index' || currentPage === 'login' || currentPage === 'register';
  const showSidebar = !isAuthPage && !!sessionUser;

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 antialiased selection:bg-sky-500 selection:text-white">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full print:hidden">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-sky-600 shrink-0" />}

            <div className="flex-1 font-medium">{toast.message}</div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Hospital Global Header */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex">
        {/* Hospital Sidebar (Strictly no stock menu) */}
        {showSidebar && (
          <Sidebar
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-200 ${
            showSidebar ? 'lg:pl-64' : ''
          }`}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {renderCurrentView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
