import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen } from './types';
import { LanguageProvider } from './context/LanguageContext';
import Splash from './screens/Splash';
import LandingPage from './screens/LandingPage';
import Onboarding from './screens/Onboarding';
import PhoneAuth from './screens/PhoneAuth';
import Hub from './screens/Hub';
import AdminDashboard from './screens/admin/AdminDashboard';
import Home from './screens/Home';
import Details from './screens/Details';
import Confirm from './screens/Confirm';
import Success from './screens/Success';
import Tracking from './screens/Tracking';
import Completed from './screens/Completed';
import Orders from './screens/Orders';
import Profile from './screens/Profile';
import DriverHome from './screens/driver/DriverHome';
import DriverActiveJob from './screens/driver/DriverActiveJob';
import DriverEarnings from './screens/driver/DriverEarnings';
import DriverProfile from './screens/driver/DriverProfile';
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
import UserDashboard from './screens/user/UserDashboard';
import UserIndividualOrder from './screens/user/UserIndividualOrder';
import UserTracking from './screens/user/UserTracking';
import UserPayments from './screens/user/UserPayments';
import UserOrders from './screens/user/UserOrders';

import { AppProvider } from './context/AppContext';

import PortalRegister from './screens/PortalRegister';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing_page');

  const navigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const isMerchantScreen = currentScreen.startsWith('merchant_');
  const isUserScreen = currentScreen.startsWith('user_');
  const isAdminScreen = currentScreen === 'admin_dashboard';
  const isLandingPage = currentScreen === 'landing_page';
  const isHub = currentScreen === 'hub';

  const isPortalRegister = currentScreen === 'portal_register';

  return (
    <AppProvider>
      <LanguageProvider>
      {isLandingPage || isHub || isPortalRegister ? (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 w-full">
           <AnimatePresence mode="wait">
             {currentScreen === 'landing_page' && <LandingPage onNavigate={navigate} />}
             {currentScreen === 'hub' && <Hub onNavigate={navigate} />}
             {currentScreen === 'portal_register' && <PortalRegister onNavigate={navigate} />}
           </AnimatePresence>
        </div>
      ) : isMerchantScreen ? (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 w-full">
          <AnimatePresence mode="wait">
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
      ) : isUserScreen ? (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300 w-full">
          <AnimatePresence mode="wait">
            {currentScreen === 'user_dashboard' && <UserDashboard key="user_dashboard" onNavigate={navigate} />}
            {currentScreen === 'user_individual' && <UserIndividualOrder key="user_individual" onNavigate={navigate} />}
            {currentScreen === 'user_tracking' && <UserTracking key="user_tracking" onNavigate={navigate} />}
            {currentScreen === 'user_payments' && <UserPayments key="user_payments" onNavigate={navigate} />}
            {currentScreen === 'user_orders' && <UserOrders key="user_orders" onNavigate={navigate} />}
          </AnimatePresence>
        </div>
      ) : isAdminScreen ? (
        <AdminDashboard onNavigate={navigate} />
      ) : (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-300">
          {/* Mobile Frame Container */}
          <div className="w-full max-w-[393px] h-[852px] max-h-[95vh] bg-white dark:bg-zinc-950 rounded-[3rem] shadow-2xl overflow-hidden relative border-[8px] border-zinc-900 dark:border-zinc-800 flex flex-col transition-colors duration-300">
            {/* Status Bar Mock */}
            <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-6 z-50 text-xs font-semibold pointer-events-none text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
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
            <div className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-300">
              <AnimatePresence mode="wait">
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
                {currentScreen === 'driver_home' && <DriverHome key="driver_home" onNavigate={navigate} />}
                {currentScreen === 'driver_active_job' && <DriverActiveJob key="driver_active_job" onNavigate={navigate} />}
                {currentScreen === 'driver_earnings' && <DriverEarnings key="driver_earnings" onNavigate={navigate} />}
                {currentScreen === 'driver_profile' && <DriverProfile key="driver_profile" onNavigate={navigate} />}
              </AnimatePresence>
            </div>

            {/* Home Indicator Mock */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full z-50 pointer-events-none transition-colors duration-300"></div>
          </div>
        </div>
      )}
      </LanguageProvider>
    </AppProvider>
  );
}
