import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { Package, TrendingUp, Clock, DollarSign, ArrowUpRight, ArrowDownRight, CheckCircle2, PlusCircle, Search, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';

interface MerchantDashboardProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantDashboard({ onNavigate }: MerchantDashboardProps) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, user } = useApp();

  const merchantRequests = activeRequests.filter(req => 
    (user?.uid && req.merchantId === user.uid) || 
    (!user?.uid && req.applicantType === 'Merchant')
  );

  const totalRev = merchantRequests.reduce((sum, req) => sum + parseFloat(req.orderAmount?.replace(/[^0-9.]/g, '') || '0'), 0);
  const platformFees = totalRev * 0.05;

  const stats = [
    { label: t('total_orders'), value: merchantRequests.length.toLocaleString(), change: '+12%', isPositive: true, icon: Package },
    { label: t('active_deliveries'), value: merchantRequests.filter(o => o.status !== 'delivered').length.toString(), change: '+4', isPositive: true, icon: Clock },
    { label: t('total_revenue'), value: `AED ${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '+8.5%', isPositive: true, icon: TrendingUp },
    { label: t('platform_fees'), value: `AED ${platformFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, change: '-2.1%', isPositive: false, icon: DollarSign },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 text-zinc-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_dashboard" onNavigate={onNavigate} />
      
      <main className="flex-1 p-8 lg:p-12 h-full overflow-y-auto hide-scrollbar overflow-x-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none z-0"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto space-y-12 relative z-10"
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <p className="text-brand font-black text-[9px] uppercase tracking-[0.5em] mb-3">Merchant Intelligence</p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium tracking-tight uppercase leading-tight text-zinc-900">
                {t('dashboard')}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => onNavigate('merchant_individual')}
                className="h-14 px-8 rounded-2xl bg-white border border-zinc-200 hover:border-brand/40 text-zinc-900 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                {t('individual_order')}
              </button>
              <button 
                onClick={() => onNavigate('merchant_batch')}
                className="h-14 px-8 rounded-2xl bg-brand text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                {t('create_batch_orders')}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] hover:shadow-xl hover:border-brand/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${stat.isPositive ? 'text-blue-600 bg-blue-50' : 'text-red-500 bg-red-50'} px-3 py-1 rounded-full`}>
                    {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span dir="ltr">{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-3xl lg:text-4xl font-display font-medium mb-2 tracking-tight text-zinc-900" dir="ltr">{stat.value}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white border border-zinc-200 rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900">{t('recent_orders')}</h2>
              <button 
                onClick={() => onNavigate('merchant_tracking')}
                className="text-brand font-black text-[10px] uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                {t('view_all_orders')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[800px]`}>
                <thead>
                  <tr className="bg-zinc-50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-8 font-black">{t('order_id')}</th>
                    <th className="p-8 font-black">{t('customer')}</th>
                    <th className="p-8 font-black">{t('status')}</th>
                    <th className="p-8 font-black">{t('amount')}</th>
                    <th className="p-8 font-black">{t('platform_fees')}</th>
                    <th className="p-8 font-black text-center">{t('time')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {merchantRequests.length > 0 ? merchantRequests.map((order, i) => (
                    <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                      <td className="p-8 text-zinc-900 font-bold">{order.id}</td>
                      <td className="p-8 text-zinc-500">{order.name}</td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'delivered' ? 'bg-blue-50 text-blue-600' :
                          order.status === 'in_transit' || order.status === 'En-route' ? 'bg-blue-50 text-brand' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          {order.status === 'delivered' && <CheckCircle2 className="w-3 h-3" />}
                          {(order.status === 'in_transit' || order.status === 'En-route') && <Clock className="w-3 h-3" />}
                          {order.status === 'delivered' ? t('delivered') : (order.status === 'in_transit' || order.status === 'En-route') ? t('in_transit') : order.status}
                        </span>
                      </td>
                      <td className="p-8 text-zinc-900 font-bold" dir="ltr">{order.orderAmount}</td>
                      <td className="p-8 text-red-500 opacity-60" dir="ltr">-AED {((parseFloat(order.orderAmount?.replace(/[^0-9.]/g, '') || '0')) * 0.05).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                      <td className="p-8 text-zinc-400 text-center">{order.date}</td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={6} className="p-20 text-center text-zinc-300 italic font-medium">
                          No active data found in current session.
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
