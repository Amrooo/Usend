import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import AdminDashboard from './screens/admin/AdminDashboard';
import Login from './screens/Login';
import { Screen } from './types';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, handleLogout } = useApp();
  
  const handleExit = async () => {
    await handleLogout();
  };

  if (!user) {
    return <Login onNavigate={() => {}} />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-xl border border-red-100 rounded-3xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Admin Access Denied</h2>
          <p className="text-zinc-500 mb-8 leading-relaxed">
            This module is restricted to <strong className="text-zinc-700">Administrator</strong> accounts. You do not have permission to view the Admin Management Portal.
          </p>
          <button 
            onClick={handleExit}
            className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

export type ToastMessage = { title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' };

function GlobalToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener('app_toast', handleToast);
    return () => window.removeEventListener('app_toast', handleToast);
  }, []);

  if (!toast) return null;

  const type = toast.type || 'info';

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-[#113f36]/5 text-[#113f36] border-[#113f36]/20',
    error: 'bg-red-50 text-red-600 border-red-200',
    warning: 'bg-orange-50 text-orange-600 border-orange-200',
    info: 'bg-[#113f36]/5 text-[#113f36] border-[#113f36]/20'
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 24, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`fixed top-0 left-1/2 -translate-x-1/2 z-[9999] shadow-lg rounded-2xl p-4 flex items-start gap-4 border w-[90%] max-w-md pointer-events-auto cursor-pointer backdrop-blur-xl ${colors[type]}`}
        onClick={() => setToast(null)}
      >
        <div className="shrink-0 mt-0.5">
           {icons[type]}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold tracking-tight">{toast.title}</h4>
          <p className="text-xs mt-1 font-medium opacity-80 leading-relaxed">{toast.message}</p>
        </div>
        <button className="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1">
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminApp() {
  const navigate = (screen: Screen) => {
    // Basic navigation just for Login component to reset state, 
    // real admin dashboard has its own internal routing.
  };

  return (
    <AppProvider>
      <LanguageProvider>
        <GlobalToast />
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 w-full">
          <AuthGuard>
            <AdminDashboard onNavigate={navigate} />
          </AuthGuard>
        </div>
      </LanguageProvider>
    </AppProvider>
  );
}
