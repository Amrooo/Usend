import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen } from './types';
import { LanguageProvider } from './context/LanguageContext';
import Splash from './screens/Splash';
import LandingPage from './screens/LandingPage';
import AboutUs from './screens/AboutUs';
import ContactUs from './screens/ContactUs';
import Onboarding from './screens/Onboarding';
import PhoneAuth from './screens/PhoneAuth';
import Login from './screens/Login';
import Home from './screens/Home';
import Details from './screens/Details';
import Confirm from './screens/Confirm';
import Success from './screens/Success';
import Tracking from './screens/Tracking';
import Completed from './screens/Completed';
import Orders from './screens/Orders';
import Profile from './screens/Profile';
import MerchantDashboard from './screens/merchant/MerchantDashboard';
import MerchantBatchOrders from './screens/merchant/MerchantBatchOrders';
import MerchantIndividualOrder from './screens/merchant/MerchantIndividualOrder';
import MerchantTracking from './screens/merchant/MerchantTracking';
import MerchantPayments from './screens/merchant/MerchantPayments';
import MerchantCustomers from './screens/merchant/MerchantCustomers';
import MerchantSettings from './screens/merchant/MerchantSettings';
import MerchantInventory from './screens/merchant/MerchantInventory';
import MerchantIntegrations from './screens/merchant/MerchantIntegrations';
import MerchantWallet from './screens/merchant/MerchantWallet';

import { AlertCircle, Bell, CheckCircle2, Info, LogIn, X, ShieldAlert } from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext';

import PortalRegister from './screens/PortalRegister';

function AuthGuard({ children, requiredRole, onNavigate }: { children: React.ReactNode, requiredRole?: 'merchant' | 'user', onNavigate?: (screen: Screen) => void }) {
  const { user, setUser, signOut } = useApp();
  
  const handleExit = async () => {
    await signOut();
    if (onNavigate) onNavigate('login');
  };

  const handleSwitchToMerchant = async () => {
    if (user) {
      const updated = { ...user, role: 'merchant' };
      setUser(updated);
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        await setDoc(doc(db, 'users', user.uid || user.id), { role: 'merchant' }, { merge: true });
      } catch (e) {
        console.warn('Role switch sync:', e);
      }
    } else {
      if (onNavigate) onNavigate('login');
    }
  };

  const isApprovedException = 
    user?.email?.toLowerCase() === 'octman.sam@gmail.com' || 
    user?.email?.toLowerCase() === 'amro-samman@hotmail.com' ||
    user?.role === 'admin';

  // 1. If not logged in at all -> Show clean Sign In prompt with direct login action
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-xl border border-zinc-200/80 rounded-3xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-[#113f36]/10 text-[#113f36] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">
            {requiredRole === 'merchant' ? 'Merchant Portal Sign In' : 'Sign In Required'}
          </h2>
          <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
            Please sign in with your USend account to access this section.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => onNavigate && onNavigate('login')}
              className="w-full bg-[#113f36] hover:bg-[#0d2f29] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              Sign In to Continue
            </button>
            <button 
              onClick={() => onNavigate && onNavigate('landing_page')}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-xs"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. If logged in as 'user' but screen requires 'merchant' -> Allow 1-click upgrade / switch
  if (requiredRole === 'merchant' && user.role !== 'merchant' && !isApprovedException) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-xl border border-zinc-200/80 rounded-3xl max-w-md w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">Merchant Access</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            You are currently signed in as <strong className="text-zinc-800">{user.email || user.name}</strong>. Switch to Merchant mode to create and dispatch bulk orders.
          </p>
          <div className="space-y-3">
            <button 
              onClick={handleSwitchToMerchant}
              className="w-full bg-[#113f36] hover:bg-[#0d2f29] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
            >
              Switch to Merchant Mode
            </button>
            <button 
              onClick={handleExit}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold py-3 rounded-xl transition-colors cursor-pointer text-xs"
            >
              Sign In with Another Account
            </button>
          </div>
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing_page');

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const isMerchantScreen = currentScreen.startsWith('merchant_');

  const isPublicScreen = currentScreen === 'landing_page' || currentScreen === 'about_us' || currentScreen === 'contact_us';
  const isLogin = currentScreen === 'login' || currentScreen === 'hub';

  const isPortalRegister = currentScreen === 'portal_register';

  return (
    <AppProvider>
      <LanguageProvider>
        <GlobalToast />
      {isPublicScreen || isLogin || isPortalRegister ? (
        <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 w-full">
           <AnimatePresence mode="wait" initial={false}>
             {currentScreen === 'landing_page' && <LandingPage onNavigate={navigate} />}
             {currentScreen === 'about_us' && <AboutUs onNavigate={navigate} />}
             {currentScreen === 'contact_us' && <ContactUs onNavigate={navigate} />}
             {(currentScreen === 'login' || currentScreen === 'hub') && <Login onNavigate={navigate} />}
             {currentScreen === 'portal_register' && <PortalRegister onNavigate={navigate} />}
           </AnimatePresence>
        </div>
      ) : isMerchantScreen ? (
        <AuthGuard requiredRole="merchant" onNavigate={navigate}>
          <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans transition-colors duration-300 w-full">
            <AnimatePresence mode="wait" initial={false}>
              {currentScreen === 'merchant_dashboard' && <MerchantDashboard key="merchant_dashboard" onNavigate={navigate} />}
              {currentScreen === 'merchant_individual' && <MerchantIndividualOrder key="merchant_individual" onNavigate={navigate} />}
              {currentScreen === 'merchant_batch' && <MerchantBatchOrders key="merchant_batch" onNavigate={navigate} />}
              {currentScreen === 'merchant_tracking' && <MerchantTracking key="merchant_tracking" onNavigate={navigate} />}
              {currentScreen === 'merchant_payments' && <MerchantPayments key="merchant_payments" onNavigate={navigate} />}
              {currentScreen === 'merchant_customers' && <MerchantCustomers key="merchant_customers" onNavigate={navigate} />}
              {currentScreen === 'merchant_settings' && <MerchantSettings key="merchant_settings" onNavigate={navigate} />}
              {currentScreen === 'merchant_inventory' && <MerchantInventory key="merchant_inventory" onNavigate={navigate} />}
              {currentScreen === 'merchant_integrations' && <MerchantIntegrations key="merchant_integrations" onNavigate={navigate} />}
              {currentScreen === 'merchant_wallet' && <MerchantWallet key="merchant_wallet" onNavigate={navigate} />}
            </AnimatePresence>
          </div>
        </AuthGuard>
      ) : (
        <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-300">
          {/* Mobile Frame Container */}
          <div className="w-full max-w-[393px] h-[852px] max-h-[95vh] bg-white rounded-[3rem] shadow-2xl overflow-hidden relative border-[8px] border-zinc-900 flex flex-col transition-colors duration-300">
            {/* Status Bar Mock */}
            <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-6 z-50 text-xs font-semibold pointer-events-none text-zinc-900 transition-colors duration-300">
              <span>9:41</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-3 bg-current rounded-sm mask mask-signal"></div>
                <div className="w-4 h-3 bg-current rounded-sm mask mask-wifi"></div>
                <div className="w-5 h-3 border border-current rounded-sm flex items-center p-[1px]">
                  <div className="w-full h-full bg-current rounded-[1px]"></div>
                </div>
              </div>
            </div>
            
            {/* Dynamic Island Mock */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-50 pointer-events-none"></div>
 
            {/* Screen Content */}
            <div className="flex-1 relative overflow-hidden bg-white transition-colors duration-300">
              <AnimatePresence mode="wait" initial={false}>
                {currentScreen === 'splash' && <Splash key="splash" onNavigate={navigate} />}
                {currentScreen === 'onboarding' && <Onboarding key="onboarding" onNavigate={navigate} />}
                {currentScreen === 'phone_auth' && <PhoneAuth onNavigate={navigate} />}
                {currentScreen === 'home' && <Home key="home" onNavigate={navigate} />}
                {currentScreen === 'details' && <Details key="details" onNavigate={navigate} />}
                {currentScreen === 'confirm' && <Confirm key="confirm" onNavigate={navigate} />}
                {currentScreen === 'success' && <Success key="success" onNavigate={navigate} />}
                {currentScreen === 'tracking' && <Tracking key="tracking" onNavigate={navigate} />}
                {currentScreen === 'completed' && <Completed key="completed" onNavigate={navigate} />}
                {currentScreen === 'orders' && <Orders key="orders" onNavigate={navigate} />}
                {currentScreen === 'profile' && <Profile key="profile" onNavigate={navigate} />}
              </AnimatePresence>
            </div>

            {/* Home Indicator Mock */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full z-50 pointer-events-none transition-colors duration-300"></div>
          </div>
        </div>
      )}
      </LanguageProvider>
    </AppProvider>
  );
}
