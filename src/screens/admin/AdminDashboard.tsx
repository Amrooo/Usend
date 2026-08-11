import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Map, 
  Truck, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import LogoIcon from '../../components/LogoIcon';

import AdminOverview from './views/AdminOverview';
import AdminOperations from './views/AdminOperations';
import AdminCouriers from './views/AdminCouriers';
import AdminMerchants from './views/AdminMerchants';
import AdminPricing from './views/AdminPricing';
import AdminExceptions from './views/AdminExceptions';
import AdminSettings from './views/AdminSettings';

export type AdminTab = 
  | 'overview' 
  | 'operations' 
  | 'couriers' 
  | 'merchants' 
  | 'pricing' 
  | 'exceptions' 
  | 'settings';

interface AdminDashboardProps {
  onNavigate: (screen: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { handleLogout } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'operations', label: 'Control Tower', icon: <Map className="w-5 h-5" /> },
    { id: 'couriers', label: 'Couriers & Network', icon: <Truck className="w-5 h-5" /> },
    { id: 'merchants', label: 'Merchants & Users', icon: <Users className="w-5 h-5" /> },
    { id: 'pricing', label: 'Pricing & Finance', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'exceptions', label: 'Exceptions', icon: <AlertTriangle className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview />;
      case 'operations': return <AdminOperations />;
      case 'couriers': return <AdminCouriers />;
      case 'merchants': return <AdminMerchants />;
      case 'pricing': return <AdminPricing />;
      case 'exceptions': return <AdminExceptions />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-zinc-900 text-white flex flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3">
          <LogoIcon className="w-8 h-8 text-white" />
          <span className="text-xl font-bold tracking-tight">USend Admin</span>
        </div>
        
        <div className="px-4 pb-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">Logistics Control</div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${activeTab === item.id 
                  ? 'bg-white text-zinc-900 shadow-md' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          <button
            onClick={() => {
              handleLogout();
              onNavigate('landing_page');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-red-500/20 transition-all font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto h-screen bg-zinc-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
