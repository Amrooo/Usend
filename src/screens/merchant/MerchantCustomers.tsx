import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { Search, User, Phone, MapPin, Package, Clock, X, Mail, TrendingUp, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantCustomersProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantCustomers({ onNavigate }: MerchantCustomersProps) {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const customers = [
    {
      id: 'CUST-001',
      name: 'Alex Rivera',
      email: 'alex.rivera@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, Brooklyn, NY',
      totalSpend: 1250.50,
      totalOrders: 12,
      lastOrder: '2024-03-24',
      joinDate: '2023-11-10',
      avgOrder: 104.20
    },
    {
      id: 'CUST-002',
      name: 'Sarah Chen',
      email: 'sarah.c@example.com',
      phone: '+1 (555) 987-6543',
      address: '456 Park Ave, New York, NY',
      totalSpend: 840.00,
      totalOrders: 8,
      lastOrder: '2024-03-22',
      joinDate: '2023-12-15',
      avgOrder: 105.00
    },
    {
      id: 'CUST-003',
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      phone: '+1 (555) 456-7890',
      address: '789 Broadway, NY',
      totalSpend: 2100.00,
      totalOrders: 15,
      lastOrder: '2024-03-20',
      joinDate: '2023-10-05',
      avgOrder: 140.00
    },
    {
      id: 'CUST-004',
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      phone: '+1 (555) 234-5678',
      address: '321 Oak St, NY',
      totalSpend: 450.75,
      totalOrders: 4,
      lastOrder: '2024-03-15',
      joinDate: '2024-01-20',
      avgOrder: 112.68
    }
  ];

  const filteredCustomers = customers.filter(cust => 
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_customers" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900">{t('customers')}</h1>
              <p className="text-zinc-500 mt-1">{t('manage_customers')}</p>
            </div>
            
            <div className="relative">
              <Search className={`w-5 h-5 text-zinc-400 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2`} />
              <input 
                type="text" 
                placeholder={t('search_orders')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`bg-white border border-zinc-200 rounded-xl ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 w-full md:w-64`}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 text-sm">
                    <th className="p-4 font-medium">{t('customer')}</th>
                    <th className="p-4 font-medium">{t('total_spend')}</th>
                    <th className="p-4 font-medium">{t('total_orders')}</th>
                    <th className="p-4 font-medium">{t('last_order')}</th>
                    <th className="p-4 font-medium">{t('join_date')}</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      onClick={() => setSelectedCustomer(customer)}
                      className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{customer.name}</p>
                            <p className="text-xs text-zinc-500">{customer.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-zinc-900" dir="ltr">
                        ${(customer.totalSpend ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-zinc-600">
                        {customer.totalOrders} {t('orders')}
                      </td>
                      <td className="p-4 text-zinc-500">
                        {customer.lastOrder}
                      </td>
                      <td className="p-4 text-zinc-500">
                        {customer.joinDate}
                      </td>
                      <td className="p-4">
                        <ChevronRight className={`w-5 h-5 text-zinc-400 ${isRTL ? 'rotate-180' : ''}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Customer Details Sheet */}
        <AnimatePresence>
          {selectedCustomer && (
            <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: isRTL ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRTL ? '-100%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`relative bg-white w-full max-w-md h-full shadow-2xl border-l border-zinc-200 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                  <h2 className="text-xl font-bold text-zinc-900">{t('customer_details')}</h2>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {/* Profile Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-[#3a4a2c]/10 text-[#3a4a2c] rounded-full flex items-center justify-center text-4xl font-black mb-4">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900">{selectedCustomer.name}</h3>
                    <p className="text-zinc-500">{selectedCustomer.id}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                        <TrendingUp className="w-3 h-3" />
                        {t('total_spend')}
                      </div>
                      <p className="text-xl font-black text-zinc-900" dir="ltr">${(selectedCustomer.totalSpend ?? 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                        <Package className="w-3 h-3" />
                        {t('average_order')}
                      </div>
                      <p className="text-xl font-black text-zinc-900" dir="ltr">${(selectedCustomer.avgOrder ?? 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('personal_info')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <Mail className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{selectedCustomer.email}</p>
                          <p className="text-xs text-zinc-500 italic">Email Address</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <Phone className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-zinc-900" dir="ltr">{selectedCustomer.phone}</p>
                          <p className="text-xs text-zinc-500 italic">Phone Number</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <MapPin className="w-5 h-5 text-zinc-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{selectedCustomer.address}</p>
                          <p className="text-xs text-zinc-500 italic">{t('delivery_address')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">History & Engagement</h4>
                    <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">{t('total_orders_placed')}</span>
                        <span className="font-bold text-zinc-900">{selectedCustomer.totalOrders}</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">{t('last_order')}</span>
                        <span className="font-bold text-zinc-900">{selectedCustomer.lastOrder}</span>
                      </div>
                      <div className="p-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-500">{t('join_date')}</span>
                        <span className="font-bold text-zinc-900">{selectedCustomer.joinDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 bg-[#4d623b] hover:bg-[#3a4a2c] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                      {t('contact_customer')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
