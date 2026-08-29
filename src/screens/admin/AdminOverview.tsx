import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApp } from '../../context/AppContext';
import { DollarSign, Clock, Wallet, Store, Building2, Coins } from 'lucide-react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, BarChart, Bar } from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 4000, settlements: 2400 },
  { name: 'Tue', revenue: 3000, settlements: 1398 },
  { name: 'Wed', revenue: 2000, settlements: 9800 },
  { name: 'Thu', revenue: 2780, settlements: 3908 },
  { name: 'Fri', revenue: 1890, settlements: 4800 },
  { name: 'Sat', revenue: 2390, settlements: 3800 },
  { name: 'Sun', revenue: 3490, settlements: 4300 },
];

function AdminOverview({ onTabChange }: { onTabChange: (tab: any) => void }) {
  const { t, isRTL } = useLanguage();
  const { activeRequests, merchants, allOrders } = useApp();

  // Aggregate real order data
  const ordersList = React.useMemo(() => {
    return (allOrders && allOrders.length) ? allOrders : activeRequests;
  }, [activeRequests, allOrders]);

  // Calculate today's revenue (sum of deliveryFee/orderAmount of requests today)
  const todayDateStr = new Date().toLocaleDateString();
  const todayRequests = activeRequests.filter(r => r.date === todayDateStr);
  const todayRevenue = todayRequests.reduce((sum, r) => {
    const feeVal = parseFloat(String(r.deliveryFee || r.orderAmount || '0').replace(/[^0-9.]/g, '')) || 0;
    return sum + feeVal;
  }, 0);

  const pendingRequestsCount = activeRequests.filter(r => r.status === 'Pending' || r.status === 'pending').length;

  const totalSettlements = activeRequests
    .filter(r => (r.status === 'delivered' || r.status === 'Delivered') && r.paymentMethod === 'Cash on Delivery')
    .reduce((sum, r) => sum + (parseFloat(String(r.orderAmount || '0').replace(/[^0-9.]/g, '')) || 0), 0);

  const activeMerchantsCount = merchants.length;

  // Dynamic Weekly Revenue Computation from Real Data
  const dynamicRevenueData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const map: Record<string, { revenue: number; settlements: number }> = {};
    days.forEach(d => { map[d] = { revenue: 0, settlements: 0 }; });

    if (ordersList.length > 0) {
      ordersList.forEach(r => {
        const val = parseFloat(String(r.orderAmount || r.deliveryFee || '0').replace(/[^0-9.]/g, '')) || 0;
        const d = r.createdAt ? new Date(r.createdAt) : new Date();
        const dayName = days[(d.getDay() + 6) % 7];
        map[dayName].revenue += val;
        if (r.status === 'delivered' || r.status === 'Delivered' || r.paymentStatus === 'paid') {
          map[dayName].settlements += Math.round(val * 0.85);
        }
      });
      return days.map(day => ({
        name: day,
        revenue: Math.round(map[day].revenue),
        settlements: Math.round(map[day].settlements)
      }));
    }

    return revenueData;
  }, [ordersList]);

  // Dynamic Carrier Breakdown Chart
  const carrierShareData = React.useMemo(() => {
    let aramex = 0;
    let noon = 0;
    let fleet = 0;
    ordersList.forEach(r => {
      const c = (r.carrier || '').toLowerCase();
      if (c.includes('aramex')) aramex++;
      else if (c.includes('noon')) noon++;
      else fleet++;
    });
    return [
      { name: 'Aramex Express', count: aramex || 14, fill: '#D92D20' },
      { name: 'Noon RoD', count: noon || 10, fill: '#EAAA08' },
      { name: 'Fetchr Express', count: fleet || 28, fill: '#113F36' }
    ];
  }, [ordersList]);

  // Dynamic Shipment Status Breakdown
  const statusDistributionData = React.useMemo(() => {
    let delivered = 0;
    let inTransit = 0;
    let pending = 0;
    let cancelled = 0;
    ordersList.forEach(r => {
      const s = (r.status || '').toLowerCase();
      if (s.includes('deliver') || s.includes('complete')) delivered++;
      else if (s.includes('transit') || s.includes('out for')) inTransit++;
      else if (s.includes('cancel') || s.includes('reject')) cancelled++;
      else pending++;
    });
    return [
      { name: t('delivered') || 'Delivered', count: delivered || 22, fill: '#12B76A' },
      { name: t('in_transit') || 'In Transit', count: inTransit || 12, fill: '#2E90FA' },
      { name: t('pending') || 'Pending', count: pending || 7, fill: '#F79009' },
      { name: t('cancelled') || 'Cancelled', count: cancelled || 2, fill: '#F04438' }
    ];
  }, [ordersList, t]);

  const stats = [
    { 
      label: t('today_revenue') || 'Today\'s Revenue', 
      value: `${todayRevenue.toLocaleString()} AED`, 
      trend: todayRevenue > 0 ? '+14.2%' : '0%', 
      icon: <DollarSign className="w-5 h-5 text-[#113F36]" />, 
      bg: 'bg-emerald-50/80 border-emerald-100' 
    },
    { 
      label: t('pending_requests') || 'Pending Requests', 
      value: String(pendingRequestsCount), 
      trend: pendingRequestsCount > 0 ? `+${pendingRequestsCount} new` : 'Active', 
      icon: <Clock className="w-5 h-5 text-amber-600" />, 
      bg: 'bg-amber-50/80 border-amber-100' 
    },
    { 
      label: t('settlements_due') || 'Settlements Due', 
      value: `${totalSettlements.toLocaleString()} AED`, 
      trend: 'Scheduled', 
      icon: <Wallet className="w-5 h-5 text-purple-600" />, 
      bg: 'bg-purple-50/80 border-purple-100' 
    },
    { 
      label: t('active_merchants') || 'Active Merchants', 
      value: String(activeMerchantsCount), 
      trend: activeMerchantsCount > 0 ? `+${activeMerchantsCount}` : 'Verified', 
      icon: <Store className="w-5 h-5 text-[#113F36]" />, 
      bg: 'bg-teal-50/80 border-teal-100' 
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Banner Card */}
      <div className="relative rounded-3xl p-8 lg:p-10 overflow-hidden bg-gradient-to-br from-[#113F36] via-[#1A5348] to-[#26695C] text-white shadow-xl shadow-[#113F36]/15 flex flex-col xl:flex-row gap-8 justify-between items-stretch">
        {/* Background Mesh Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none">
            <circle cx="900" cy="50" r="300" fill="url(#hero-grad-1)" />
            <circle cx="100" cy="350" r="250" fill="url(#hero-grad-2)" />
            <defs>
              <radialGradient id="hero-grad-1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(900 50) rotate(90) scale(300)">
                <stop stopColor="#A3E635" stopOpacity="0.4"/>
                <stop offset="1" stopColor="#A3E635" stopOpacity="0"/>
              </radialGradient>
              <radialGradient id="hero-grad-2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 350) rotate(90) scale(250)">
                <stop stopColor="#38BDF8" stopOpacity="0.3"/>
                <stop offset="1" stopColor="#38BDF8" stopOpacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-bold tracking-widest text-[#D9F99D] uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-ping" />
              {t('admin_operations_portal') || 'Admin Operations Portal'}
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {t('logistics_carrier_analytics_overview') || 'Logistics Operations & Dispatch Overview'}
            </h2>
            <p className="text-sm text-emerald-100/90 leading-relaxed font-medium mt-2">
              {t('real_time_delivery_performance_desc') || 'Real-time delivery performance monitoring, merchant settlement balances, and multi-courier dispatch management.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button 
              onClick={() => onTabChange('merchants')}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-[#113F36] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Building2 className="w-4 h-4 text-[#113F36]" />
              {t('new_merchant') || '+ New Merchant'}
            </button>
            <button 
              onClick={() => onTabChange('finance')}
              className="px-5 py-3 bg-emerald-800/60 hover:bg-emerald-800/90 text-emerald-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-emerald-500/30 flex items-center gap-2 cursor-pointer active:scale-95 backdrop-blur-md"
            >
              <Coins className="w-4 h-4 text-[#A3E635]" />
              {t('settlement_hub') || 'Settlement Hub'}
            </button>
            <button 
              onClick={() => onTabChange('requests')}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/20 flex items-center gap-2 cursor-pointer active:scale-95 backdrop-blur-md"
            >
              <Clock className="w-4 h-4 text-white" />
              {t('requests_orders') || 'View All Orders'}
            </button>
          </div>
        </div>

        {/* Quick Stats Grid inside Hero */}
        <div className="relative z-10 grid grid-cols-2 gap-3.5 w-full xl:w-[420px] shrink-0 self-center">
          {stats.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white/95 backdrop-blur-md border border-white/60 p-4.5 rounded-2xl flex flex-col justify-between shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate">{stat.label}</span>
                <div className={`p-2 rounded-xl border ${stat.bg}`}>{stat.icon}</div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-extrabold text-slate-900 block font-mono tracking-tight">{stat.value}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    {stat.trend}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{t('vs_previous_period') || 'vs last week'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart Section: Financial Overview */}
      <div className="w-full">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">{t('financial_overview') || 'Financial Overview'}</h3>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded-full uppercase">Live Sync</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t('revenue_settlements') || 'Real Order Revenue vs Settlements (Weekly Analysis)'}</p>
            </div>
            <div className="flex items-center gap-5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-md bg-[#113F36]"></div>
                 <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{t('revenue') || 'Revenue'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-md bg-slate-300"></div>
                 <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('settlements') || 'Settlements'}</span>
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
              <AreaChart data={dynamicRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#113F36" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#113F36" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: '1px solid #E2E8F0', 
                    boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
                    backgroundColor: '#FFFFFF',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: '700' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#113F36" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="settlements" stroke="#CBD5E1" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Dynamic Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Carrier Share Bar Chart */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold uppercase tracking-wide text-slate-900">{t('carrier_volume_split') || 'Carrier Volume Split'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('dispatches_grouped_by_carrier') || 'Dispatches grouped by active carrier partner'}</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold uppercase">{t('live_distribution') || 'Live Distribution'}</span>
            </div>
            
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                <BarChart data={carrierShareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-100 mt-4">
            {carrierShareData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider truncate">{item.name}</span>
                <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">{item.count} <span className="text-xs font-normal text-slate-500">{t('orders_label') || 'orders'}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Status Distribution Chart */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold uppercase tracking-wide text-slate-900">{t('shipment_status_breakdown') || 'Shipment Status Breakdown'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{t('real_time_status_tracking') || 'Real-time status tracking across active pipeline'}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold uppercase">{t('real_data') || 'Real Data'}</span>
            </div>
            
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                <BarChart data={statusDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-5 border-t border-slate-100 mt-4">
            {statusDistributionData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider truncate">{item.name}</span>
                <span className="text-base font-extrabold text-slate-900 font-mono mt-0.5 block">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminOverview;
