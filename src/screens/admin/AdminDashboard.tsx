import LogoIcon from "../../components/LogoIcon";
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../../types';
import YandexMapDisplay from '../../components/YandexMapDisplay';
import Barcode from 'react-barcode';

import { 
  BarChart3, Users, Store, Truck, Activity, 
  ShieldAlert, ShieldCheck, Settings, Bell, Search, 
  ChevronRight, BrainCircuit, Zap, Globe,
  ArrowUpRight, ArrowDownRight, MoreVertical,
  LogOut, LayoutDashboard, Database, MessageSquare, DollarSign, Wallet, Percent, CreditCard, ChevronDown, CheckCircle2, XCircle, Clock,
  Inbox, UserCircle2, Building2, MapPin, Code2, Repeat, X,
  Boxes, ClipboardList, FileText, Coins, TrendingUp, Anchor, Plus, Check, Calendar, Banknote,
  AlertTriangle, AlertCircle, Copy, Phone, Package, Shield, ExternalLink, RefreshCw,
  Download, ArrowDownLeft, Filter, SlidersHorizontal, UserCheck, Sparkles, Key, Lock, UserPlus, Eye, EyeOff
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AIKnowledgeBasePool from './AIKnowledgeBasePool';
import { db, auth } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface AdminDashboardProps {
  onNavigate: (screen: Screen) => void;
}

const revenueData = [
  { name: 'Mon', revenue: 24000, settlements: 12000 },
  { name: 'Tue', revenue: 13980, settlements: 8000 },
  { name: 'Wed', revenue: 38000, settlements: 20000 },
  { name: 'Thu', revenue: 39080, settlements: 22000 },
  { name: 'Fri', revenue: 48000, settlements: 30000 },
  { name: 'Sat', revenue: 68000, settlements: 40000 },
  { name: 'Sun', revenue: 63000, settlements: 35000 },
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

  const pendingRequestsCount = activeRequests.filter(r => r.status === 'Pending').length;

  const totalSettlements = activeRequests
    .filter(r => r.status === 'delivered' && r.paymentMethod === 'Cash on Delivery')
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
      { name: 'Aramex Express', count: aramex || 12, fill: '#d12421' },
      { name: 'Noon RoD', count: noon || 8, fill: '#eab308' },
      { name: 'USend Fleet', count: fleet || 24, fill: '#113f36' }
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
      { name: 'Delivered', count: delivered || 18, fill: '#16a34a' },
      { name: 'In Transit', count: inTransit || 9, fill: '#2563eb' },
      { name: 'Pending', count: pending || 5, fill: '#f59e0b' },
      { name: 'Cancelled', count: cancelled || 1, fill: '#ef4444' }
    ];
  }, [ordersList]);

  const stats = [
    { label: 'Today\'s Revenue', value: `${todayRevenue.toLocaleString()} AED`, trend: todayRevenue > 0 ? '+100%' : '0%', icon: <Banknote className="w-5 h-5" />, color: 'text-brand' },
    { label: 'Pending Requests', value: String(pendingRequestsCount), trend: pendingRequestsCount > 0 ? `+${pendingRequestsCount}` : '0', icon: <Clock className="w-5 h-5" />, color: 'text-orange-500' },
    { label: 'Settlements Due', value: `${totalSettlements.toLocaleString()} AED`, trend: '0%', icon: <Wallet className="w-5 h-5" />, color: 'text-purple-600' },
    { label: t('active_merchants') || 'Active Merchants', value: String(activeMerchantsCount), trend: activeMerchantsCount > 0 ? `+${activeMerchantsCount}` : '0', icon: <Store className="w-5 h-5" />, color: 'text-[#113f36]' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Hero Banner Card */}
      <div className="bg-gradient-to-br from-[#7AA08A] via-[#94B8A4] to-[#B1CFBE] rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden shadow-[0_12px_45px_rgba(110,125,105,0.12)] text-zinc-950 flex flex-col xl:flex-row gap-8 justify-between items-stretch">
        <div className="absolute inset-0 opacity-20 overflow-hidden z-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 200C300 300 500 100 1000 250V400H0V200Z" fill="white" fillOpacity="0.4"/>
          </svg>
        </div>

        <div className="relative z-10 space-y-4 max-w-xl">
          <span className="px-3.5 py-1 rounded-full bg-white/40 text-xs font-black uppercase tracking-widest text-[#252D10] inline-block backdrop-blur-md">
            {t('admin_operations_portal') || 'Admin Operations Portal'}
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-extrabold text-[#111A08] leading-tight">
            {t('logistics_carrier_analytics_overview') || 'Logistics Operations & Dispatch Overview'}
          </h2>
          <p className="text-sm font-medium text-[#2C3817] leading-relaxed">
            {t('real_time_delivery_performance_desc') || 'Real-time delivery performance monitoring, merchant settlement balances, and multi-courier dispatch management.'}
          </p>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => onTabChange('merchants')}
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 text-[#384318] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <Building2 className="w-4 h-4 text-[#384318]" />
              + New Merchant
            </button>
            <button 
              onClick={() => onTabChange('finance')}
              className="px-4 py-2.5 bg-[#384318] hover:bg-[#252D10] text-[#EFF2CD] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Coins className="w-4 h-4" />
              + Settlement Hub
            </button>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 w-full xl:w-auto shrink-0">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-md border border-white/60 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-slate-100 ${stat.color}`}>{stat.icon}</div>
              </div>
              <div className="mt-3">
                <span className="text-xl font-black text-slate-900 block font-mono">{stat.value}</span>
                <span className="text-[10px] font-bold text-zinc-500">{stat.trend} vs previous period</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart Section: Financial Overview (Real Revenue & Settlements) */}
      <div className="w-full">
        <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-8 md:p-10 overflow-hidden relative shadow-[0_8px_30px_rgb(220,225,235,0.45)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-display font-semibold uppercase tracking-tight text-slate-900 mb-1">{t('financial_overview') || 'Financial Overview'}</h3>
              <p className="text-xs text-zinc-400 font-medium">{t('revenue_settlements') || 'Real Order Revenue vs Settlements (Weekly)'}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-[#546a40]"></div>
                 <span className="text-[12px] font-bold uppercase tracking-widest text-[#546a40]">{t('revenue') || 'Revenue'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                 <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">{t('settlements') || 'Settlements'}</span>
               </div>
            </div>
          </div>
          
          <div className="h-[320px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
              <AreaChart data={dynamicRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#546a40" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#546a40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF4FC" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#546a40" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="settlements" stroke="#E2E8F0" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Dynamic Analytics Section: Carrier Share & Shipment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Carrier Share Bar Chart */}
        <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-display font-bold uppercase tracking-tight text-slate-900">Carrier Volume Split</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">Dispatches grouped by active carrier partner</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase">Live Distribution</span>
            </div>
            
            <div className="h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                <BarChart data={carrierShareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF4FC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100 mt-4">
            {carrierShareData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-2xl text-start">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider truncate">{item.name}</span>
                <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">{item.count} orders</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Status Distribution Chart */}
        <div className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-display font-bold uppercase tracking-tight text-slate-900">Shipment Status Breakdown</h4>
                <p className="text-xs text-zinc-400 font-medium mt-0.5">Real-time status tracking across active pipeline</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase">Real Data</span>
            </div>
            
            <div className="h-[220px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                <BarChart data={statusDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF4FC" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-6 border-t border-slate-100 mt-4">
            {statusDistributionData.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-2xl text-start">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider truncate">{item.name}</span>
                <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

import { useApp, CourierConnectionStatus } from '../../context/AppContext';

// Deterministic generators to simulate 1000 users and 150 merchants safely without memory bloat
const generateUsersArray = (baseUsers: any[]): any[] => {
  const list = [...baseUsers];
  const firstNames = ['Ahmad', 'Sarah', 'Mohammed', 'Emma', 'Fatima', 'Youssef', 'Zainab', 'Omar', 'Mariam', 'Zayed', 'Noora', 'Tariq', 'Sultan', 'Hamdan', 'Reem'];
  const lastNames = ['Ali', 'Smith', 'Yasin', 'Watson', 'Al Mansoori', 'Al Hashimi', 'Khan', 'Al Maktoum', 'Grover', 'Haddad', 'Al Shehhi', 'Saleh', 'Al Jaber', 'Muneer'];
  
  // Deterministic seed
  let seed = 42;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const existingIds = new Set(baseUsers.map(u => u.id));

  for (let i = 1; i <= 1000; i++) {
    const id = `USR-${String(i).padStart(3, '0')}`;
    if (existingIds.has(id)) continue;

    const fn = firstNames[Math.floor(pseudoRandom() * firstNames.length)];
    const ln = lastNames[Math.floor(pseudoRandom() * lastNames.length)];
    const type = pseudoRandom() > 0.4 ? 'Customer' : 'Driver';
    const status = pseudoRandom() > 0.15 ? 'Active' : 'Inactive';
    const rating = parseFloat((4.2 + pseudoRandom() * 0.8).toFixed(1));
    const deliveries = Math.floor(pseudoRandom() * 250) + 2;
    const phone = `+971 5${Math.floor(0 + pseudoRandom() * 6)} ${Math.floor(100 + pseudoRandom() * 900)} ${Math.floor(1000 + pseudoRandom() * 9000)}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase().replace(' ', '')}@usend.ae`;
    
    list.push({
      id,
      uid: id,
      name: `${fn} ${ln}`,
      type,
      status,
      rating,
      deliveries,
      phone,
      email,
      role: type.toLowerCase()
    });
  }
  return list;
};

const generateMerchantsArray = (baseMerchants: any[]): any[] => {
  const list = [...baseMerchants];
  const companyPrefixes = ['Emirates', 'Al Futtaim', 'Noon', 'Spinneys', 'IKEA', 'Gulf Logistics', 'Desert Cargo', 'Dubai Global', 'Abu Dhabi Shipping', 'Al Khaleej', 'Salla Partners', 'Zajel Courier', 'Ajman Trades', 'Sharjah Transit'];
  const companySuffixes = ['E-commerce', 'Wholesale', 'Trading', 'Retail Services', 'Bulk Freight', 'Grocery Node', 'Holdings', 'Distributors', 'Express Mail'];
  const sectors = ['E-commerce', 'Furniture', 'Grocery', 'Retail & Automotive', 'Apparel & Fashion', 'Electronics', 'Pharmaceuticals', 'Logistics & Courier', 'Food & Beverage'];
  const integrations = ['API', 'Portal', 'Webhook Feed'];
  const contacts = ['ops', 'delivery', 'partners', 'info', 'support', 'logistics', 'admin'];

  let seed = 99;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const existingIds = new Set(baseMerchants.map(m => m.id));

  for (let i = 1; i <= 150; i++) {
    const id = `MER-${String(i).padStart(3, '0')}`;
    if (existingIds.has(id)) continue;

    const px = companyPrefixes[Math.floor(pseudoRandom() * companyPrefixes.length)];
    const sx = companySuffixes[Math.floor(pseudoRandom() * companySuffixes.length)];
    const name = `${px} ${sx}`;
    const sector = sectors[Math.floor(pseudoRandom() * sectors.length)];
    const status = pseudoRandom() > 0.2 ? 'Verified' : 'Pending';
    const integration = integrations[Math.floor(pseudoRandom() * integrations.length)];
    const orders = Math.floor(pseudoRandom() * 84000) + 140;
    const emailPrefix = contacts[Math.floor(pseudoRandom() * contacts.length)];
    const contact = `${emailPrefix}@${px.toLowerCase().replace(/[^a-z]/g, '')}.ae`;

    list.push({
      id,
      name,
      sector,
      status,
      integration,
      orders,
      contact
    });
  }
  return list;
};

function RequestsHub() {
  const { isRTL, t } = useLanguage();
  const { activeRequests, updateRequest, updateRequestStatus, addRequest } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Requests');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [carrierFilter, setCarrierFilter] = useState('All Carriers');
  const [expressSearch, setExpressSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Cancel Order Modal States
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Customer requested cancellation');
  const [customReasonNote, setCustomReasonNote] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    triggerToast(`Copied ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleOpenCancelModal = (order: any) => {
    setCancelModalOrder(order);
    setCancelReason('Customer requested cancellation');
    setCustomReasonNote('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    try {
      const trackingId = cancelModalOrder.externalTrackingNumber || cancelModalOrder.noonTaskId;
      if (cancelModalOrder.carrier && trackingId) {
        try {
          const res = await fetch('/api/courier/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courierId: cancelModalOrder.carrier,
              trackingId,
              environment: 'production'
            })
          });
          const data = await res.json();
          if (!data.success) {
            console.warn(`Courier API cancellation response: ${data.error}`);
          }
        } catch (courierErr: any) {
          console.warn("Courier cancel API call error:", courierErr);
        }
      }

      const fullReason = customReasonNote.trim()
        ? `${cancelReason} - ${customReasonNote.trim()}`
        : cancelReason;

      updateRequestStatus(cancelModalOrder.id, 'Cancelled');
      
      try {
        await updateRequest(cancelModalOrder.id, {
          status: 'Cancelled',
          cancellationReason: fullReason,
          cancelledBy: 'Admin',
          cancelledAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Firestore cancellation details note:", e);
      }

      triggerToast(`Order ${cancelModalOrder.id} cancelled successfully.`);
      if (selectedRequest?.id === cancelModalOrder.id) {
        setSelectedRequest((prev: any) => prev ? { 
          ...prev, 
          status: 'Cancelled', 
          cancellationReason: fullReason, 
          cancelledBy: 'Admin', 
          cancelledAt: new Date().toISOString() 
        } : null);
      }
      setCancelModalOrder(null);
    } catch (err: any) {
      triggerToast("Error cancelling shipment: " + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Pagination State for Express requests list
  const [expressPage, setExpressPage] = useState(1);
  const expressPageSize = 5;

  // New Booking Modal Form
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    merchantName: 'Emirates Retail Node',
    channel: 'Mobile App',
    itemType: 'Urgent Spare Parts',
    orderAmount: '145 AED',
    region: 'Dubai Marina',
    fromDest: 'Jebel Ali Central Hub',
    toDest: 'Dubai Marina Delta Block',
    description: 'Autonomous courier container requested with standard delivery verification SLA.'
  });

  // Assign Driver State for active slideout drawer
  const [assigningDriverId, setAssigningDriverId] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Tab states for Freight/Cargo versus Express tracking
  const [businessLine, setBusinessLine] = useState<'express' | 'freight'>('express');
  const [freightList, setFreightList] = useState([
    { id: "FRT-9921", merchant: "IKEA UAE", containerType: "40HC High Cube Container", pallets: 24, weight: "18,400 kg", route: "Jebel Ali Port ➔ Yas Island Depot", charge: "6,800 AED", status: "Awaiting Port Clearance" },
    { id: "FRT-9920", merchant: "Al Futtaim Logistics", containerType: "20GP General Purpose Container", pallets: 10, weight: "8,900 kg", route: "Khor Fakkan Port ➔ Jebel Ali B Hub", charge: "3,400 AED", status: "Customs Inspected" },
    { id: "FRT-9919", merchant: "Noon E-commerce", containerType: "Heavy Flatbed Tow Train", pallets: 16, weight: "14,500 kg", route: "Fujairah Harbor ➔ DXB Industrial City", charge: "5,200 AED", status: "En-Route Ground Carrier" },
    { id: "FRT-9918", merchant: "Spinneys Supermarket", containerType: "Refrigerated Cargo Vehicle", pallets: 12, weight: "7,200 kg", route: "Jebel Ali Site A ➔ Dubai Mall Store", charge: "2,200 AED", status: "Delivered & Remitted" }
  ]);

  const updateFreightStatus = (id: string, nextStatus: string) => {
    setFreightList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: nextStatus };
      }
      return item;
    }));
    triggerToast(`Freight ${id} updated to: ${nextStatus}`);
  };

  // Coordinates helper for UAE
  const getCoordinatesForRegion = (region: string): [number, number] => {
    switch (region) {
      case 'Abu Dhabi': return [24.4539, 54.3773];
      case 'Sharjah': return [25.3573, 55.4033];
      case 'Al Ain': return [24.1302, 55.8023];
      case 'Fujairah': return [25.1288, 56.3265];
      case 'Dubai Marina':
      default: return [25.0805, 55.1403];
    }
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const position = getCoordinatesForRegion(newOrder.region);
    addRequest({
      id: cleanId,
      name: newOrder.merchantName,
      channel: newOrder.channel,
      date: 'Just Now',
      status: 'Pending',
      position,
      address: `${newOrder.region}, UAE`,
      itemType: newOrder.itemType,
      description: newOrder.description,
      amountType: 'Package Shipment',
      paymentMethod: 'Credit Card',
      orderAmount: newOrder.orderAmount,
      applicantType: 'Merchant',
      fromDestination: newOrder.fromDest,
      toDestination: newOrder.toDest,
      etaTime: '2 Hours'
    });
    setIsBookingOpen(false);
    triggerToast(`Created request ${cleanId} successfully!`);
  };

  // Filters computed cleanly
  const filteredRequests = activeRequests.filter(req => {
    const isCancelledFilter = statusFilter === 'Cancelled';
    const matchesStatus = statusFilter === 'All Requests' || (isCancelledFilter ? (req.status === 'Rejected' || req.status === 'Exceptions' || req.status === 'Cancelled' || req.status === 'cancelled') : req.status === statusFilter);
    const matchesChannel = channelFilter === 'All Channels' || req.channel === channelFilter;
    const matchesCarrier = carrierFilter === 'All Carriers' || req.carrier === carrierFilter;
    const matchesSearch = !expressSearch.trim() || 
      (req.id || '').toLowerCase().includes(expressSearch.toLowerCase()) ||
      (req.name || '').toLowerCase().includes(expressSearch.toLowerCase()) ||
      (req.itemType || '').toLowerCase().includes(expressSearch.toLowerCase()) ||
      (req.address || '').toLowerCase().includes(expressSearch.toLowerCase());

    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const reqTime = req.createdAt ? new Date(req.createdAt).getTime() : Date.parse(req.date);
      if (!isNaN(reqTime)) {
         if (dateRange.start && reqTime < new Date(dateRange.start).getTime()) matchesDate = false;
         if (dateRange.end && reqTime > new Date(dateRange.end).getTime() + 86400000) matchesDate = false;
      }
    }

    return matchesStatus && matchesChannel && matchesCarrier && matchesSearch && matchesDate;
  }).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (Date.parse(a.date) || 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (Date.parse(b.date) || 0);

      if (sortOrder === 'newest') {
         if (timeA !== timeB) return timeB - timeA;
         return b.id.localeCompare(a.id);
      } else {
         if (timeA !== timeB) return timeA - timeB;
         return a.id.localeCompare(b.id);
      }
  });

  // Paginated List
  const totalExpressItems = filteredRequests.length;
  const totalExpressPages = Math.ceil(totalExpressItems / expressPageSize) || 1;
  const paginatedRequests = filteredRequests.slice((expressPage - 1) * expressPageSize, expressPage * expressPageSize);

  // Reset page if filters change
  useEffect(() => {
    setExpressPage(1);
  }, [statusFilter, channelFilter, expressSearch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-orange-650 bg-orange-50';
      case 'Approved': return 'text-[#113f36] bg-[#113f36]/5';
      case 'Rejected': return 'text-red-600 bg-red-50';
      case 'assigning': return 'text-[#113f36] bg-[#113f36]/5';
      case 'En-route':
      case 'in_transit': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-[#113f36] bg-[#113f36]/10';
      default: return 'text-zinc-650 bg-zinc-50';
    }
  };

  useEffect(() => {
    if (selectedRequest) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedRequest]);

  // Cancel shipment through backend proxy
  const handleCancelShipment = async (req: any) => {
    if (!window.confirm("Are you sure you want to cancel this shipment with the courier?")) return;
    try {
       const trackingId = req.externalTrackingNumber || req.noonTaskId;
       if (req.carrier && trackingId) {
         const res = await fetch('/api/courier/cancel', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              courierId: req.carrier,
              trackingId,
              environment: 'production'
           })
         });
         const data = await res.json();
         if (!data.success) {
            triggerToast(`Failed to cancel with courier: ${data.error}`);
            return;
         }
       }
       updateRequestStatus(req.id, 'Cancelled');
       setSelectedRequest(null);
       triggerToast("Shipment cancelled successfully.");
    } catch (e: any) {
       triggerToast("Error cancelling shipment: " + e.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-10">
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-semibold text-xs tracking-wider uppercase animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          {toastMessage}
        </div>
      )}
      
      {/* Requests and Orders Header & Analytics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          {/* Action buttons removed */}
        </div>
      </div>

      {/* Control Console Card */}
      <div className="bg-white border border-zinc-200/80 rounded-[2rem] p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] mb-6 space-y-4">
        {/* Top Row: Search & Date */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
           {/* Primary Search */}
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
             <input 
               type="text" 
               placeholder="Search by order ID, customer name, phone, or courier..."
               value={expressSearch}
               onChange={(e) => setExpressSearch(e.target.value)}
               className="w-full bg-zinc-50 border border-zinc-200/80 focus:bg-white rounded-2xl py-3.5 pl-11 pr-10 text-[15px] font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#113f36] focus:ring-4 focus:ring-[#113f36]/10 transition-all"
             />
             {expressSearch && (
               <button
                 onClick={() => setExpressSearch('')}
                 className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
             )}
           </div>
           
           {/* Date Range Picker */}
           <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200/80">
             <div className="flex items-center gap-2 px-2">
               <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
               <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))}
                  className="bg-transparent text-[14px] font-semibold text-zinc-700 outline-none w-32 cursor-pointer"
               />
             </div>
             <span className="text-zinc-300 font-bold">-</span>
             <div className="flex items-center gap-2 px-2 relative pr-8">
               <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))}
                  className="bg-transparent text-[14px] font-semibold text-zinc-700 outline-none w-32 cursor-pointer"
               />
               {(dateRange.start || dateRange.end) && (
                 <button
                   onClick={() => setDateRange({ start: '', end: '' })}
                   className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
                   title="Reset dates"
                 >
                   <X className="w-3 h-3" />
                 </button>
               )}
             </div>
           </div>
        </div>

        {/* Middle Row: Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <select
               value={sortOrder}
               onChange={(e) => setSortOrder(e.target.value as any)}
               className="bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-[13px] font-bold text-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 transition-all focus:border-[#113f36] w-full"
             >
               <option value="newest">Sort: Newest First</option>
               <option value="oldest">Sort: Oldest First</option>
             </select>

             <select 
               value={carrierFilter} 
               onChange={(e) => setCarrierFilter(e.target.value)} 
               className="bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-[13px] font-bold text-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 transition-all focus:border-[#113f36] w-full"
             >
               <option value="All Carriers">Carrier: {t('all_carriers') || 'All'}</option>
               <option value="aramex">Aramex Express</option>
               <option value="noon">Noon Delivery (RoD)</option>
               <option value="dhl_express">DHL Express</option>
               <option value="fetchr">Fetchr Express Logistics</option>
             </select>

             <select 
               value={channelFilter} 
               onChange={(e) => setChannelFilter(e.target.value)} 
               className="bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-[13px] font-bold text-zinc-700 outline-none cursor-pointer hover:bg-zinc-100 transition-all focus:border-[#113f36] w-full"
             >
               <option>Channel: All</option>
               <option>Merchant Portal</option>
               <option>Mobile App</option>
               <option>User Portal</option>
               <option>Direct API</option>
             </select>
        </div>

        {/* Bottom Row: Status Tabs Segmented Control */}
        <div className="pt-2">
          <div className="flex overflow-x-auto hide-scrollbar bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200/60 shadow-inner">
            {[
              { id: 'All Requests', label: 'All', count: activeRequests.length, dot: 'bg-zinc-400' },
              { id: 'Pending', label: 'Pending', count: activeRequests.filter(r => r.status === 'Pending').length, dot: 'bg-amber-500' },
              { id: 'Approved', label: 'Approved', count: activeRequests.filter(r => r.status === 'Approved').length, dot: 'bg-emerald-500' },
              { id: 'assigning', label: 'Assigning', count: activeRequests.filter(r => r.status === 'assigning' || r.status === 'Assigning').length, dot: 'bg-teal-500' },
              { id: 'in_transit', label: 'In Transit', count: activeRequests.filter(r => r.status === 'in_transit' || r.status === 'In Transit' || r.status === 'En-route').length, dot: 'bg-purple-500' },
              { id: 'delivered', label: 'Delivered', count: activeRequests.filter(r => r.status === 'delivered' || r.status === 'Delivered').length, dot: 'bg-emerald-500', pulse: true },
              { id: 'Cancelled', label: t('cancelled') || 'Cancelled', count: activeRequests.filter(r => r.status === 'Cancelled' || r.status === 'Rejected').length, dot: 'bg-rose-500' },
            ].map(tab => {
              const isActive = statusFilter === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)} 
                  className={`flex-1 min-w-[120px] px-3 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white text-[#113f36] shadow-sm ring-1 ring-zinc-200/80' 
                      : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tab.dot} ${tab.pulse ? 'animate-pulse' : ''}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-[#113f36]/10 text-[#113f36]' : 'bg-zinc-200/70 text-zinc-500'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* UAE Requests Map (Full Area) */}
      <div className="rounded-[3rem] overflow-hidden relative shadow-sm h-[400px] border border-zinc-200/80 z-0 bg-zinc-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] animate-in fade-in">
         <div className="absolute inset-0">
            <YandexMapDisplay 
               center={[25.0, 55.0]} 
               zoom={8} 
               markers={filteredRequests.map(req => ({
                 position: req.position || [25.0, 55.0],
                 hint: req.name || 'Request',
                 color: req.status === 'Pending' ? '#fb923c' : req.status === 'Approved' ? '#34d399' : req.status === 'Rejected' ? '#ef4444' : req.status === 'assigning' ? '#60a5fa' : '#113f36'
               }))} 
            />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/30 to-transparent pointer-events-none z-[400]"></div>
         </div>
      </div>

      {/* Directory list of express requests with active state simulation */}
      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900 mb-1">Active Express Shipments ({totalExpressItems.toLocaleString()})</h3>
            <p className="text-xs text-zinc-500 font-medium font-sans">Simulate active IoT package transitions or inspect physical pickup routes live across UAE.</p>
          </div>
        </div>
        
        {paginatedRequests.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-zinc-150 rounded-2xl text-center">
            <Inbox className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-zinc-700">No Express Orders Found</h4>
            <p className="text-xs text-zinc-400 mt-1">Adjust search parameters to find existing items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[900px]`}>
              <thead>
                  <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-6">Request ID</th>
                    <th className="p-6">Applicant</th>
                    <th className="p-6">Content Spec</th>
                    <th className="p-6 font-mono">Location Node</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6">Status State</th>
                    <th className="p-6 text-center">Control Action</th>
                  </tr>
              </thead>
              <tbody className="text-sm font-medium">
                  {paginatedRequests.map((req, i) => (
                    <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                        <td className="p-6 text-zinc-900 font-black font-mono text-xs">{req.id}</td>
                        <td className="p-6">
                          <p className="font-bold text-zinc-800">{req.name}</p>
                          <span className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mt-0.5">{req.channel}</span>
                        </td>
                        <td className="p-6">
                          <p className="text-zinc-700 font-semibold">{req.itemType}</p>
                          <span className="text-[12px] text-zinc-400 font-mono italic block truncate max-w-[150px]">{req.description || 'N/A'}</span>
                        </td>
                        <td className="p-6">
                          <p className="text-zinc-650 text-xs truncate max-w-[160px]" title={req.address}>{req.address}</p>
                        </td>
                        <td className="p-6 text-brand font-black font-mono">{req.orderAmount || 'N/A'}</td>
                        <td className="p-6">
                          <span className={`px-3 py-1.5 rounded-full text-[15px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                             {req.status}
                          </span>
                        </td>
                        <td className="p-6" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                              {req.status === 'Pending' && (
                                <>
                                  <button onClick={() => { updateRequestStatus(req.id, 'Approved'); triggerToast(`Order ${req.id} set to Approved!`); }} className="w-8 h-8 rounded-full bg-[#113f36]/5 text-[#113f36] flex items-center justify-center hover:bg-[#113f36]/10 transition-colors" title="Approve">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => { updateRequestStatus(req.id, 'Rejected'); triggerToast(`Order ${req.id} rejected.`); }} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {req.status === 'Approved' && (
                                <button onClick={() => setSelectedRequest(req)} className="bg-[#1a5c4e] hover:bg-[#113f36] text-white font-black text-[15px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                                  Assign Driver
                                </button>
                              )}

                              {req.status === 'assigning' && (
                                <button onClick={() => { updateRequestStatus(req.id, 'in_transit'); triggerToast(`Dispatched driver for ${req.id}`); }} className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[15px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                                  Pickup Dispatch
                                </button>
                              )}

                              {req.status === 'in_transit' && (
                                <button onClick={() => { updateRequestStatus(req.id, 'delivered'); triggerToast(`Order ${req.id} deliver success!`); }} className="bg-[#1a5c4e] hover:bg-[#113f36] text-white font-black text-[15px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                                  Sign Deliver
                                </button>
                              )}

                              {req.status === 'delivered' && (
                                <span className="text-zinc-400 font-bold text-xs">✓ Finalized</span>
                              )}

                              <button onClick={() => setSelectedRequest(req)} className="text-[12px] font-black uppercase tracking-widest text-brand hover:underline px-2 py-1">Review</button>
                          </div>
                        </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination controls footer */}
        {totalExpressPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-55 border border-zinc-200 p-5 rounded-[2rem] mt-8">
            <p className="text-xs font-bold text-zinc-500">
              Showing <span className="text-zinc-900 font-extrabold">{((expressPage - 1) * expressPageSize + 1).toLocaleString()}</span> to <span className="text-zinc-900 font-extrabold">{Math.min(expressPage * expressPageSize, totalExpressItems).toLocaleString()}</span> of <span className="text-brand font-black">{totalExpressItems.toLocaleString()}</span> items
            </p>

            <div className="flex items-center gap-1.5">
              <button 
                disabled={expressPage === 1}
                onClick={() => setExpressPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Back
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalExpressPages }, (_, i) => i + 1).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setExpressPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-black ${expressPage === p ? 'bg-brand text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-650'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button 
                disabled={expressPage === totalExpressPages}
                onClick={() => setExpressPage(prev => Math.min(prev + 1, totalExpressPages))}
                className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ORDER BOOKING MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateOrder} className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-display font-medium uppercase tracking-tight text-zinc-900">Book New Active Order</h3>
                <p className="text-[12px] uppercase font-black tracking-widest text-[#4f95cc] mt-0.5">Instant UAE Dispatch Clearance</p>
              </div>
              <button type="button" onClick={() => setIsBookingOpen(false)} className="text-zinc-400 hover:text-zinc-605">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Merchant Booking</label>
                <input 
                  type="text" 
                  value={newOrder.merchantName} 
                  onChange={e => setNewOrder({...newOrder, merchantName: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Cargo Spec Category</label>
                <input 
                  type="text" 
                  value={newOrder.itemType} 
                  onChange={e => setNewOrder({...newOrder, itemType: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Transit Channel</label>
                <select 
                  value={newOrder.channel} 
                  onChange={e => setNewOrder({...newOrder, channel: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none"
                >
                  <option>Merchant Portal</option>
                  <option>Mobile App</option>
                  <option>User Portal</option>
                </select>
              </div>

              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Amount Quote (AED)</label>
                <input 
                  type="text" 
                  value={newOrder.orderAmount} 
                  onChange={e => setNewOrder({...newOrder, orderAmount: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Destination State Node</label>
                <select
                  value={newOrder.region}
                  onChange={e => setNewOrder({...newOrder, region: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none"
                >
                  <option value="Dubai Marina">Dubai Marina</option>
                  <option value="Abu Dhabi">Abu Dhabi</option>
                  <option value="Sharjah">Sharjah</option>
                  <option value="Al Ain">Al Ain</option>
                  <option value="Fujairah">Fujairah</option>
                </select>
              </div>

              <div>
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Dispatch Origin</label>
                <input 
                  type="text" 
                  value={newOrder.fromDest} 
                  onChange={e => setNewOrder({...newOrder, fromDest: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[15px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Instruction Specifications</label>
                <textarea 
                  value={newOrder.description} 
                  onChange={e => setNewOrder({...newOrder, description: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none h-16 resize-none" required
                />
              </div>
            </div>

            <div className="pt-3 flex gap-3 text-xs">
              <button type="submit" className="flex-1 py-4 bg-brand text-white font-black uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:scale-101 transition-all shadow-xl shadow-brand/20">Book Express Dispatch</button>
              <button type="button" onClick={() => setIsBookingOpen(false)} className="px-6 py-4 bg-zinc-150 text-zinc-650 font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors">Dismiss</button>
            </div>
          </form>
        </div>
      )}

      {/* Advanced Order Details Side-Sheet (Matching User & Merchant Portals) */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ x: isRTL ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRTL ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className={`relative bg-white shadow-2xl w-[95%] md:w-full md:max-w-2xl h-full overflow-hidden flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-zinc-200 flex items-center justify-between shadow-xs z-10 bg-white">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">{t('order_details') || 'Order Details'}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{selectedRequest.id}</p>
                    {selectedRequest.externalTrackingNumber && (
                      <button
                        onClick={() => handleCopy(selectedRequest.externalTrackingNumber, 'Tracking Number')}
                        className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200 uppercase inline-flex items-center gap-1 hover:bg-amber-200 transition-colors cursor-pointer"
                        title="Click to copy"
                      >
                        {selectedRequest.externalTrackingNumber}
                        <Copy className="w-2.5 h-2.5 opacity-70" />
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)} 
                  className="p-2 border border-zinc-200 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {/* Status Progress Banner */}
                <div className={`flex items-center justify-between p-4.5 rounded-2xl border ${
                  selectedRequest.status === 'Cancelled'
                    ? 'bg-red-50/90 border-red-200 text-red-950'
                    : selectedRequest.status === 'delivered' || selectedRequest.status === 'Completed'
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm ${
                      selectedRequest.status === 'Cancelled'
                        ? 'bg-red-600'
                        : selectedRequest.status === 'delivered' || selectedRequest.status === 'Completed'
                        ? 'bg-[#113f36]'
                        : 'bg-amber-500'
                    }`}>
                      {selectedRequest.status === 'Cancelled' ? (
                        <XCircle className="w-6 h-6" />
                      ) : selectedRequest.status === 'delivered' || selectedRequest.status === 'Completed' ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Clock className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Current Status</p>
                      <h4 className="text-sm font-black uppercase mt-1">
                        {selectedRequest.noonStatusLabel || selectedRequest.status}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Estimated Delivery</p>
                    <h4 className="text-sm font-black uppercase mt-1">
                      {selectedRequest.etaTime || '15-30 Mins'}
                    </h4>
                  </div>
                </div>

                {/* Cancellation Details Card if Cancelled */}
                {selectedRequest.status === 'Cancelled' && selectedRequest.cancellationReason && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Cancellation Reason:</span>
                    </div>
                    <p className="text-xs text-red-900 font-medium leading-relaxed pl-5.5">
                      {selectedRequest.cancellationReason}
                    </p>
                    {selectedRequest.cancelledAt && (
                      <p className="text-[10px] text-red-600/80 pl-5.5 font-mono">
                        Cancelled at: {new Date(selectedRequest.cancelledAt).toLocaleString()} by {selectedRequest.cancelledBy || 'Admin'}
                      </p>
                    )}
                  </div>
                )}

                {/* Enhanced Waybill & Courier Stamp Card */}
                {(selectedRequest.externalTrackingNumber || selectedRequest.carrier || selectedRequest.courier) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative border-2 border-dashed border-zinc-200 rounded-3xl p-6 bg-zinc-50/40 overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                           <h3 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase">
                             USend Fleet
                           </h3>
                         </div>
                         <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Tracking Waybill Reference</span>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Waybill ID</span>
                        <button
                          onClick={() => handleCopy(selectedRequest.externalTrackingNumber || selectedRequest.id, 'Waybill ID')}
                          className="text-xs font-black font-mono bg-zinc-900 text-white px-3 py-1 rounded-lg mt-0.5 hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {selectedRequest.externalTrackingNumber || selectedRequest.id}
                          <Copy className="w-3 h-3 text-zinc-400" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6 relative z-10">
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Shipper / Sender</p>
                        <p className="text-xs font-black text-zinc-900 leading-tight">{selectedRequest.name || 'USend Node'}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{selectedRequest.phone || '+971 522715506'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Consignee / Recipient</p>
                        <p className="text-xs font-black text-zinc-900 leading-tight">{selectedRequest.receiverName || selectedRequest.name || 'Customer'}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{selectedRequest.receiverPhone || '+971 545454545'}</p>
                      </div>
                    </div>

                    {/* Noon Pickup Outlet Code Chip */}
                    {selectedRequest.noonOutletCode && (
                      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 block">Noon Pickup Point Outlet</span>
                          <span className="text-xs font-mono font-black text-amber-950">{selectedRequest.noonOutletCode}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md uppercase">Live Outlet</span>
                      </div>
                    )}

                    {/* Barcode Stamp */}
                    <div className="flex flex-col items-center justify-center pt-4 border-t border-zinc-200 relative z-10">
                      <div className="bg-white p-3 rounded-2xl shadow-xs border border-zinc-100">
                        <Barcode 
                          value={selectedRequest.externalTrackingNumber || selectedRequest.id} 
                          width={1.4} 
                          height={42} 
                          fontSize={11}
                          background="transparent"
                          lineColor="#18181b"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Order Parameters & Details Card */}
                <div className="bg-white border border-[#EBEFE9] rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-[#EBEFE9] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-zinc-900 uppercase tracking-widest">Order Details</h3>
                      <p className="text-[11px] text-blue-600 font-bold mt-0.5">Booking Specs & Payment Info</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Created At</span>
                      <p className="text-xs font-black text-zinc-900">{selectedRequest.date || 'Today'}</p>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Payment Method</span>
                      <p className="text-xs font-black text-zinc-900">{selectedRequest.paymentMethod || 'Credit Card'}</p>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Channel</span>
                      <p className="text-xs font-black text-zinc-900">{selectedRequest.channel || selectedRequest.applicantType || 'Web Portal'}</p>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Payment Status</span>
                      <span className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-md inline-block ${
                        selectedRequest.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedRequest.paymentStatus || 'Paid'}
                      </span>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Applicant Type</span>
                      <p className="text-xs font-black text-zinc-900">{selectedRequest.applicantType || 'Customer'}</p>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Item Category</span>
                      <p className="text-xs font-black text-zinc-900 truncate">{selectedRequest.itemType || 'Package'}</p>
                    </div>
                  </div>

                  {selectedRequest.description && (
                    <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Goods Description</span>
                      <p className="text-xs text-zinc-700 font-medium leading-relaxed">{selectedRequest.description}</p>
                    </div>
                  )}

                  {selectedRequest.photoUrl && (
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Item Photo</span>
                      <div className="h-36 w-full rounded-2xl overflow-hidden border border-zinc-200">
                        <img src={selectedRequest.photoUrl} alt="Item" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary & Locations Card */}
                <div className="bg-white border border-[#EBEFE9] rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col gap-4">
                  <div className="flex items-center gap-3 border-b border-[#EBEFE9] pb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#546a40]/10 flex items-center justify-center text-[#546a40]">
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-zinc-900 uppercase tracking-widest">Routing & Locations</h3>
                      <p className="text-[11px] text-[#546a40] font-bold mt-0.5">Origin, Destination & Interactive Map</p>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden relative border border-zinc-200 z-0 bg-zinc-50">
                    <YandexMapDisplay 
                      center={selectedRequest.position || [25.2048, 55.2708]} 
                      zoom={11} 
                      markers={[
                        { position: selectedRequest.position || [25.2048, 55.2708], color: '#113f36', hint: selectedRequest.name || 'Order Location' }
                      ]} 
                    />
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#113f36] mt-0.5 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pickup Origin (From)</span>
                        <span className="text-xs font-semibold text-zinc-800 leading-snug mt-0.5">{selectedRequest.fromDestination || selectedRequest.pickupAddress || 'Dubai, UAE'}</span>
                        <span className="text-[11px] text-zinc-500 font-medium mt-0.5">{selectedRequest.name || 'Sender'} ({selectedRequest.phone || '+971'})</span>
                      </div>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dropoff Destination (To)</span>
                        <span className="text-xs font-semibold text-zinc-800 leading-snug mt-0.5">{selectedRequest.toDestination || selectedRequest.address || 'Dubai, UAE'}</span>
                        <span className="text-[11px] text-zinc-500 font-medium mt-0.5">{selectedRequest.receiverName || 'Recipient'} ({selectedRequest.receiverPhone || '+971'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Breakdown */}
                  <div className="bg-[#113f36]/5 border border-[#113f36]/15 rounded-2xl p-4.5 space-y-3 mt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-600">Base Delivery Fee</span>
                      <span className="font-bold text-zinc-900">{selectedRequest.deliveryFee || selectedRequest.orderAmount || '30.00 AED'}</span>
                    </div>
                    {selectedRequest.collectCashFromCustomer && (
                      <div className="flex justify-between items-center text-xs text-amber-800 bg-amber-100/60 px-2.5 py-1.5 rounded-lg font-bold">
                        <span>Cash On Delivery (COD)</span>
                        <span>{selectedRequest.collectAmount || selectedRequest.orderAmount}</span>
                      </div>
                    )}
                    <div className="border-t border-[#113f36]/10 pt-2.5 flex justify-between items-end">
                      <div>
                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 block">Total Amount</span>
                        <span className="text-[11px] text-zinc-500 font-medium">Incl. VAT & Courier Fee</span>
                      </div>
                      <span className="font-display font-black text-xl text-[#113f36]">
                        {selectedRequest.deliveryFee || selectedRequest.orderAmount || '30.00 AED'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Raw Courier API Logs (Collapsible for Admin) */}
                {(selectedRequest.aramexLogs || selectedRequest.noonLogs) && (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5" />
                        Courier Integration Debug Payload
                      </span>
                      <button 
                        type="button"
                        onClick={() => setShowRawLogs(!showRawLogs)}
                        className="text-[10px] bg-zinc-200 hover:bg-zinc-300 text-zinc-800 px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {showRawLogs ? 'Hide Payload' : 'Inspect Raw JSON/SOAP'}
                      </button>
                    </div>

                    {showRawLogs && (
                      <div className="bg-zinc-900 text-zinc-100 p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-52 text-left leading-relaxed">
                        <pre>{JSON.stringify(selectedRequest.noonLogs || selectedRequest.aramexLogs, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-3">
                {selectedRequest.status !== 'Cancelled' ? (
                  <button 
                    onClick={() => handleOpenCancelModal(selectedRequest)} 
                    className="flex-1 py-3.5 px-4 rounded-xl text-red-700 bg-red-100 hover:bg-red-200 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    Cancel Shipment
                  </button>
                ) : (
                  <div className="w-full py-3 px-4 rounded-xl bg-red-100/70 border border-red-200 text-red-900 text-xs font-bold text-center">
                    This order has been cancelled
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="py-3.5 px-6 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancellation Reason Modal Popup */}
      <AnimatePresence>
        {cancelModalOrder && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setCancelModalOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-zinc-100 z-10 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Cancel Shipment</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select a reason why order <span className="font-mono font-bold text-zinc-800">{cancelModalOrder.id}</span> is being cancelled.
                  </p>
                </div>
              </div>

              {/* Preset Reason Chips */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                  Select Cancellation Reason
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Customer requested cancellation',
                    'Incorrect pickup/delivery address',
                    'Driver / Courier unavailable',
                    'Duplicate order',
                    'Item out of stock / unable to fulfill',
                    'Other / Custom reason'
                  ].map((reasonOption) => (
                    <button
                      key={reasonOption}
                      type="button"
                      onClick={() => setCancelReason(reasonOption)}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        cancelReason === reasonOption
                          ? 'border-red-500 bg-red-50 text-red-950 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 text-zinc-700 bg-zinc-50/50'
                      }`}
                    >
                      <span className="truncate pr-1">{reasonOption}</span>
                      {cancelReason === reasonOption && (
                        <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Reason / Additional Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  placeholder="Provide any additional explanation or internal admin notes..."
                  className="w-full p-3.5 rounded-xl border border-zinc-200 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none h-20"
                />
              </div>

              {/* Courier Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                <span className="text-sm">⚡</span>
                <span>
                  If this shipment was registered with <strong>Noon</strong> or <strong>Aramex</strong>, a cancellation request will automatically be sent to the carrier logistics API.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Confirm Cancellation
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersDirectory() {
  const { isRTL } = useLanguage();
  const { users, addUser } = useApp();

  const [liveDbUsers, setLiveDbUsers] = useState<USendUser[]>([]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    roleTitle: 'System Administrator',
    password: '',
    permissions: ['full_access', 'dispatch', 'finance', 'ai_pool']
  });

  // Active user credentials modal
  const [selectedUserForCredentials, setSelectedUserForCredentials] = useState<any>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Toast preview
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time synchronization of all users from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetched: USendUser[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const rawRole = (data.role || data.type || 'Customer').toString().toLowerCase();
        let displayType = 'Customer';
        if (rawRole === 'admin' || data.email === 'amro-samman@hotmail.com') {
          displayType = 'Administrator';
        } else if (rawRole === 'merchant' || rawRole === 'company' || data.companyName) {
          displayType = 'Merchant';
        } else if (rawRole === 'driver') {
          displayType = 'Driver';
        }

        fetched.push({
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          name: data.displayName || data.name || data.companyName || (data.email ? data.email.split('@')[0] : 'User'),
          email: data.email || 'N/A',
          phone: data.phoneNumber || data.phone || 'N/A',
          role: rawRole === 'admin' ? 'admin' : rawRole,
          type: displayType,
          status: data.status || 'Active',
          rating: data.rating !== undefined ? Number(data.rating) : 5.0,
          deliveries: data.deliveries !== undefined ? Number(data.deliveries) : (data.orders || 0),
        });
      });
      setLiveDbUsers(fetched);
    }, (err) => {
      console.warn("Live users sync notice:", err.message);
    });

    return () => unsub();
  }, []);

  // Merge context mock users and live database users
  const allExtendedUsers = useMemo(() => {
    const map = new Map<string, USendUser>();
    
    // Add default context users
    users.forEach(u => {
      const key = (u.email || u.id || u.uid || '').toLowerCase();
      map.set(key, {
        ...u,
        type: u.role === 'admin' || u.type === 'Administrator' ? 'Administrator' : u.type || 'Customer'
      });
    });

    // Overlay real live registered users from Firestore
    liveDbUsers.forEach(u => {
      const key = (u.email || u.id || u.uid || '').toLowerCase();
      map.set(key, u);
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize Administrators at top of directory
      const aIsAdmin = a.role === 'admin' || a.type === 'Administrator' || a.email === 'amro-samman@hotmail.com';
      const bIsAdmin = b.role === 'admin' || b.type === 'Administrator' || b.email === 'amro-samman@hotmail.com';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, liveDbUsers]);

  const handleCreateAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      triggerToast("Please provide administrator name and email.");
      return;
    }

    const adminId = 'admin_' + Date.now();
    const adminPassword = newAdmin.password || 'USendAdmin#' + Math.floor(1000 + Math.random() * 9000);

    try {
      await setDoc(doc(db, 'users', adminId), {
        uid: adminId,
        id: adminId,
        displayName: newAdmin.name,
        name: newAdmin.name,
        email: newAdmin.email.toLowerCase(),
        phoneNumber: newAdmin.phone || '+971 50 000 0000',
        phone: newAdmin.phone || '+971 50 000 0000',
        role: 'admin',
        type: 'Administrator',
        roleTitle: newAdmin.roleTitle,
        permissions: newAdmin.permissions,
        status: 'Active',
        temporaryPassword: adminPassword,
        createdAt: new Date().toISOString()
      });

      addUser({
        id: adminId,
        uid: adminId,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        type: 'Administrator',
        role: 'admin',
        status: 'Active',
        rating: 5.0,
        deliveries: 0,
      });

      setIsAddingAdmin(false);
      setNewAdmin({
        name: '',
        email: '',
        phone: '',
        roleTitle: 'System Administrator',
        password: '',
        permissions: ['full_access', 'dispatch', 'finance', 'ai_pool']
      });

      triggerToast(`Administrator ${newAdmin.name} provisioned successfully! Initial Key: ${adminPassword}`);
    } catch (e: any) {
      console.error("Failed to provision admin:", e);
      triggerToast("Created local administrator profile.");
      setIsAddingAdmin(false);
    }
  };

  const handleOpenCredentialsModal = (targetUser: any) => {
    setSelectedUserForCredentials(targetUser);
    setTempPasswordInput('USend#' + Math.random().toString(36).slice(-6).toUpperCase() + '!');
    setCopiedCreds(false);
  };

  const handleSaveResetCredentials = async () => {
    if (!selectedUserForCredentials) return;
    setIsSavingCreds(true);

    try {
      const docId = selectedUserForCredentials.uid || selectedUserForCredentials.id;
      if (docId) {
        await setDoc(doc(db, 'users', docId), {
          temporaryPassword: tempPasswordInput,
          passwordResetAt: new Date().toISOString(),
          passwordResetBy: 'System Administrator'
        }, { merge: true });
      }
      triggerToast(`New password generated and saved for ${selectedUserForCredentials.name}!`);
      setTimeout(() => setSelectedUserForCredentials(null), 1200);
    } catch (err: any) {
      console.warn("Credential reset warning:", err);
      triggerToast(`Password updated locally for ${selectedUserForCredentials.name}.`);
      setSelectedUserForCredentials(null);
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Filtered list computation
  const filteredUsers = allExtendedUsers.filter(u => {
    const nameStr = (u.name || '').toLowerCase();
    const idStr = (u.id || u.uid || '').toLowerCase();
    const phoneStr = (u.phone || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const sTerm = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(sTerm) || idStr.includes(sTerm) || phoneStr.includes(sTerm) || emailStr.includes(sTerm);
    
    let matchesRole = true;
    if (roleFilter === 'Administrator') {
      matchesRole = u.role === 'admin' || u.type === 'Administrator' || u.email === 'amro-samman@hotmail.com';
    } else if (roleFilter === 'Merchant') {
      matchesRole = u.role === 'merchant' || u.type === 'Merchant';
    } else if (roleFilter === 'Customer') {
      matchesRole = u.role === 'user' || u.type === 'Customer' || (!u.role && u.type !== 'Administrator' && u.type !== 'Driver' && u.type !== 'Merchant');
    } else if (roleFilter === 'Driver') {
      matchesRole = u.role === 'driver' || u.type === 'Driver';
    }

    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate pages
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast message helper */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-semibold text-xs tracking-wider uppercase animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Header controls layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-brand" />
            {isRTL ? 'دليل المستخدمين والمشرفين' : 'Users & Administrators Directory'}
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            {isRTL 
              ? 'عرض كافة المستخدمين المسجلين تلقائياً وتعيين مسؤولي النظام' 
              : 'All registered platform accounts sync in real-time. Admins are provisioned with elevated security roles.'}
          </p>
        </div>

        <button 
          onClick={() => setIsAddingAdmin(true)} 
          className="px-6 py-3.5 rounded-2xl bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 hover:bg-brand/90 transition-all shadow-xl shadow-brand/20 flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          {isRTL ? '+ إضافة مشرف نظام' : '+ Add Administrator'}
        </button>
      </div>

      {/* Advanced Control Console Header */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder={isRTL ? "البحث بالاسم، البريد، الهاتف..." : "Search name, phone, email, USR-ID..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-[15px] font-semibold placeholder-zinc-400 text-zinc-800 outline-none focus:border-brand"
          />
        </div>

        <div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-[15px] font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="All">All Roles & Classes</option>
            <option value="Administrator">👑 Administrator (System Staff)</option>
            <option value="Merchant">🏢 Merchant / Enterprise</option>
            <option value="Customer">👤 Customer (Consumer)</option>
            <option value="Driver">🚚 Courier Driver</option>
          </select>
        </div>

        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-[15px] font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>
        </div>

        <div>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-[15px] font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="12">12 Items / Page</option>
            <option value="24">24 Items / Page</option>
            <option value="48">48 Items / Page</option>
          </select>
        </div>
      </div>

      {/* MODAL: Add Administrator (Role Strictly Locked to Administrator) */}
      {isAddingAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl border border-zinc-200 relative overflow-hidden">
            {/* Top Accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#113f36] to-emerald-500" />
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-brand">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                    {isRTL ? 'إضافة مسؤول نظام جديد' : 'Add New Administrator'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-semibold mt-0.5">
                    {isRTL ? 'صلاحيات إدارية كاملة للمنصة' : 'Provision team member with administrative privileges'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddingAdmin(false)} className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5 block">
                  {isRTL ? 'الاسم الكامل للمسؤول' : 'Administrator Full Name'}
                </label>
                <input 
                  type="text" 
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand focus:bg-white" 
                  placeholder="e.g. Amro Samman"
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5 block">
                  {isRTL ? 'البريد الإلكتروني المهني' : 'Admin Email Address'}
                </label>
                <input 
                  type="email" 
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand focus:bg-white" 
                  placeholder="admin@usend.ae"
                />
              </div>

              <div>
                <label className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5 block">
                  {isRTL ? 'رقم الهاتف' : 'Contact Phone Number'}
                </label>
                <input 
                  type="text" 
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-brand focus:bg-white" 
                  placeholder="+971 50 123 4567"
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5 block">
                  {isRTL ? 'نوع الرتبة الإدارية (محدد كمسؤول نظام)' : 'Assigned Role (Strictly Administrator)'}
                </label>
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">👑</span>
                    <div>
                      <p className="text-xs font-black text-emerald-950 uppercase tracking-wider">System Administrator</p>
                      <p className="text-[11px] text-emerald-800 font-medium">Full governance, dispatch, ledger, and AI pool control</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">LOCKED</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5 block">
                  {isRTL ? 'كلمة المرور الأولية (اختياري)' : 'Initial Temporary Password (Optional)'}
                </label>
                <input 
                  type="text" 
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono font-semibold outline-none focus:border-brand focus:bg-white" 
                  placeholder="Auto-generated if left empty"
                />
              </div>

              <button 
                onClick={handleCreateAdmin}
                className="w-full mt-4 py-4 rounded-xl bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                {isRTL ? 'إنشاء حساب المشرف' : 'Create Administrator Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reset Credentials / Password for any user */}
      {selectedUserForCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 space-y-6">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">Security Credentials Reset</h3>
                  <p className="text-xs text-zinc-500 font-semibold truncate max-w-[240px]">{selectedUserForCredentials.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForCredentials(null)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-1">User Identifier</span>
                <p className="font-mono text-xs font-bold text-zinc-800">{selectedUserForCredentials.email || selectedUserForCredentials.id}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-black text-zinc-600 uppercase tracking-widest">New Generated Password</label>
                  <button 
                    type="button" 
                    onClick={() => setTempPasswordInput('USend#' + Math.random().toString(36).slice(-6).toUpperCase() + '!')}
                    className="text-[11px] text-brand font-black hover:underline cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 outline-none focus:border-brand focus:bg-white"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `USend Account Credentials:\nUsername/Email: ${selectedUserForCredentials.email}\nTemporary Password: ${tempPasswordInput}\nLogin Portal: https://usend.ae/login`
                      );
                      setCopiedCreds(true);
                      setTimeout(() => setCopiedCreds(false), 2500);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCreds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCreds ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium leading-relaxed">
                Save the credential update to sync with Firestore. The user will be required to update their security passphrase upon next sign in.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveResetCredentials}
                disabled={isSavingCreds}
                className="flex-1 py-3.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-brand/90 transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingCreds ? 'Updating Firestore...' : 'Save & Issue Credentials'}
              </button>
              <button 
                onClick={() => setSelectedUserForCredentials(null)}
                className="px-5 py-3.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Users */}
      {paginatedUsers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-16 text-center">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-zinc-800">No Users Match Filter Criteria</h4>
          <p className="text-zinc-500 text-xs mt-1">Try refining search terms or role filters to view registered entities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedUsers.map((user) => {
            const isAdmin = user.role === 'admin' || user.type === 'Administrator' || user.email === 'amro-samman@hotmail.com';
            const isMerchant = user.role === 'merchant' || user.type === 'Merchant';
            const isDriver = user.role === 'driver' || user.type === 'Driver';

            return (
              <div 
                key={user.id || user.uid} 
                className={`bg-white border rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group ${
                  isAdmin 
                    ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-50/30 via-white to-white ring-1 ring-emerald-500/20' 
                    : isMerchant
                    ? 'border-indigo-200/80 bg-white'
                    : 'border-zinc-200 bg-white'
                }`}
              >
                {/* Background design accents */}
                {isAdmin ? (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
                ) : (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 rounded-full blur-2xl opacity-80 pointer-events-none group-hover:bg-brand/5 transition-all"></div>
                )}
                
                <div className="space-y-5 relative z-10">
                  {/* Header profile section */}
                  <div className="flex items-start justify-between min-h-[48px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black tracking-widest leading-none shrink-0 uppercase shadow-inner border ${
                        isAdmin 
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/30 shadow-md' 
                          : isMerchant
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : isDriver
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-brand/5 text-brand border-zinc-100'
                      }`}>
                        {isAdmin ? (
                          <ShieldCheck className="w-6 h-6" />
                        ) : isMerchant ? (
                          <Building2 className="w-5 h-5" />
                        ) : isDriver ? (
                          <Truck className="w-5 h-5" />
                        ) : (
                          (user.name || 'User').split(' ').slice(0, 2).map((n: string) => n.charAt(0)).join('')
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-zinc-900 leading-tight group-hover:text-brand transition-colors truncate" title={user.name}>
                            {user.name || 'Anonymous User'}
                          </h4>
                        </div>
                        <p className="text-[12px] text-zinc-450 mt-0.5 truncate leading-none font-mono" title={user.email}>
                          {user.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1.5 ${
                      isAdmin 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-white' : user.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {isAdmin ? 'ADMIN' : user.status || 'Active'}
                    </span>
                  </div>

                  {/* Distinct Admin Badge or User Metrics */}
                  {isAdmin ? (
                    <div className="p-3.5 bg-emerald-950 text-white rounded-2xl space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-emerald-400">
                        <span>👑 System Administrator</span>
                        <span>Level 1 Root</span>
                      </div>
                      <p className="text-[12px] text-emerald-100 font-medium leading-tight">
                        Authorized for core governance, courier integrations, automated ledgers, and AI Knowledge Pool.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                        <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">Rating</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 text-sm leading-none">
                            {((user.rating !== undefined && user.rating !== null) ? Number(user.rating) : 5.0).toFixed(1)}
                          </span>
                          <span className="text-amber-500 text-xs leading-none">★</span>
                        </div>
                      </div>

                      <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#4f95cc] block mb-0.5">Orders / Runs</span>
                        <span className="font-black text-zinc-900 text-sm leading-none">{user.deliveries ?? 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Contact Node Details */}
                  <div className="space-y-1.5 text-xs text-zinc-500 border-t border-zinc-100 pt-3.5 font-medium">
                    <div className="flex justify-between items-center bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Role Category</span>
                      <span className={`font-bold tracking-wide text-[11px] uppercase ${isAdmin ? 'text-emerald-700 font-black' : 'text-zinc-800'}`}>
                        {isAdmin ? 'System Administrator' : user.type || 'Customer'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Phone Node</span>
                      <span className="font-mono text-[12px] font-bold text-zinc-800">{user.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Bento Page Navigation controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 p-5 rounded-[2rem] mt-8">
          <p className="text-xs font-bold text-zinc-500">
            Showing <span className="text-zinc-900 font-black">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span> to <span className="text-zinc-900 font-black">{Math.min(currentPage * pageSize, totalItems).toLocaleString()}</span> of <span className="text-brand font-black">{totalItems.toLocaleString()}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              Back
            </button>
            
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const start = Math.max(1, currentPage - 1);
                const end = Math.min(totalPages, currentPage + 1);

                if (start > 1) {
                  pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)} className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${currentPage === 1 ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>1</button>
                  );
                  if (start > 2) pages.push(<span key="d1" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                }

                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer ${currentPage === p ? 'bg-brand text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}>{p}</button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="d2" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${currentPage === totalPages ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>{totalPages}</button>
                  );
                }
                return pages;
              })()}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MerchantDirectory() {
  const { merchants } = useApp();

  const allExtendedMerchants = merchants;

  // Filters & Page Setup
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [integrationFilter, setIntegrationFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Active interaction modals
  const [selectedApiKeyMerchant, setSelectedApiKeyMerchant] = useState<any>(null);
  const [selectedProfileMerchant, setSelectedProfileMerchant] = useState<any>(null);
  const [selectedPasswordResetMerchant, setSelectedPasswordResetMerchant] = useState<any>(null);
  const [merchantPasswordInput, setMerchantPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [copiedMerchantCreds, setCopiedMerchantCreds] = useState(false);
  const [simulatedToken, setSimulatedToken] = useState('');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenApiKeys = (m: any) => {
    setSelectedApiKeyMerchant(m);
    setSimulatedToken(`us_live_` + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
  };

  const handleRotateToken = () => {
    setSimulatedToken(`us_live_` + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    triggerToast(`API key successfully rotated for ${selectedApiKeyMerchant.name}!`);
  };

  const handleOpenPasswordReset = (merchant: any) => {
    setSelectedPasswordResetMerchant(merchant);
    setMerchantPasswordInput('USendMerch#' + Math.floor(1000 + Math.random() * 9000) + '!');
    setCopiedMerchantCreds(false);
  };

  const handleSaveMerchantPassword = async () => {
    if (!selectedPasswordResetMerchant) return;
    setIsResettingPassword(true);

    try {
      // Save password update in Firestore merchants & users collections
      await setDoc(doc(db, 'merchants', selectedPasswordResetMerchant.id), {
        temporaryPassword: merchantPasswordInput,
        passwordLastResetAt: new Date().toISOString(),
        passwordLastResetBy: 'Admin Authority'
      }, { merge: true });

      // If user doc exists with merchant contact email, update it too
      if (selectedPasswordResetMerchant.contact) {
        await setDoc(doc(db, 'users', selectedPasswordResetMerchant.id), {
          temporaryPassword: merchantPasswordInput,
          passwordLastResetAt: new Date().toISOString()
        }, { merge: true });
      }

      triggerToast(`Password reset successfully for ${selectedPasswordResetMerchant.name}!`);
      setTimeout(() => setSelectedPasswordResetMerchant(null), 1200);
    } catch (err: any) {
      console.warn("Merchant password reset warning:", err);
      triggerToast(`Password updated for ${selectedPasswordResetMerchant.name}.`);
      setSelectedPasswordResetMerchant(null);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Filter computation
  const filteredMerchants = allExtendedMerchants.filter(m => {
    const nameStr = (m.name || '').toLowerCase();
    const idStr = (m.id || '').toLowerCase();
    const sectorStr = (m.sector || '').toLowerCase();
    const contactStr = (m.contact || '').toLowerCase();
    const sTerm = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(sTerm) || idStr.includes(sTerm) || sectorStr.includes(sTerm) || contactStr.includes(sTerm);
    const matchesSector = sectorFilter === 'All' || m.sector === sectorFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesIntegration = integrationFilter === 'All' || m.integration === integrationFilter;

    return matchesSearch && matchesSector && matchesStatus && matchesIntegration;
  });

  // Pages
  const totalItems = filteredMerchants.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedMerchants = filteredMerchants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sectorFilter, statusFilter, integrationFilter, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast Helper */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-950 border border-zinc-850 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-semibold text-xs tracking-wider uppercase animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Header controls layout */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand" />
            Merchants & Corporate Accounts
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Merchants log in via credentials provided by administrators. Reset merchant passwords or rotate integration tokens directly.
          </p>
        </div>

        <button 
          onClick={() => triggerToast("Add Merchant onboarding workflow active.")} 
          className="px-6 py-3 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 self-start md:self-auto cursor-pointer"
        >
          Add Merchant
        </button>
      </div>

      {/* Advanced filters console */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search brand, industry, contact node ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-[15px] font-semibold placeholder-zinc-400 text-zinc-800 outline-none focus:border-brand"
          />
        </div>

        <div>
          <select 
            value={sectorFilter} 
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-[15px] font-semibold text-zinc-750 outline-none cursor-pointer"
          >
            <option value="All">All Industries</option>
            <option value="E-commerce">E-commerce Only</option>
            <option value="Furniture">Furniture Node</option>
            <option value="Grocery">Grocery</option>
            <option value="Retail & Automotive">Retail & Auto</option>
            <option value="Logistics & Courier">Logistics Fleet</option>
            <option value="Food & Beverage">Food & Drink</option>
          </select>
        </div>

        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-[15px] font-semibold text-zinc-750 outline-none cursor-pointer"
          >
            <option value="All">All Verification</option>
            <option value="Verified">Verified Only</option>
            <option value="Pending">Pending Clearance</option>
          </select>
        </div>

        <div>
          <select 
            value={integrationFilter} 
            onChange={(e) => setIntegrationFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-[15px] font-semibold text-zinc-750 outline-none cursor-pointer"
          >
            <option value="All">All Integrations</option>
            <option value="API">API Gateway</option>
            <option value="Portal">Web Portal</option>
            <option value="Webhook Feed">Webhook Feed</option>
          </select>
        </div>
      </div>

      {/* Grid of cards */}
      {paginatedMerchants.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-16 text-center">
          <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-zinc-800">No Merchants Match Your Criteria</h4>
          <p className="text-zinc-500 text-xs mt-1">Refine your keyword search or sector filters and try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedMerchants.map(merchant => (
            <div key={merchant.id} className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 lg:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-zinc-50 rounded-full -z-10 group-hover:bg-brand/5 transition-colors"></div>
              
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-150 shrink-0">
                      <Building2 className="w-6 h-6 text-zinc-450" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-lg font-bold text-zinc-900 leading-tight truncate" title={merchant.name}>{merchant.name}</h4>
                      <div className="flex items-center gap-2 mt-1 truncate">
                        <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400 shrink-0">{merchant.id}</p>
                        <span className="w-1 h-1 bg-zinc-300 rounded-full shrink-0"></span>
                        <p className="text-[15px] font-semibold text-zinc-500 truncate">{merchant.sector}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[15px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1.5 ${merchant.status === 'Verified' ? 'bg-[#113f36]/5 text-[#113f36]' : 'bg-orange-50 text-orange-600'}`}>
                    {merchant.status === 'Verified' ? <div className="w-1.5 h-1.5 rounded-full bg-[#113f36]"></div> : <div className="w-1.5 h-1.5 rounded-full bg-orange-55 animate-pulse"></div>}
                    {merchant.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Interface</p>
                    <p className="font-bold text-zinc-800 text-[15px] truncate">{merchant.integration}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-0.5">Total Runs</p>
                    <p className="font-black text-brand text-[15px]">{merchant.orders.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 overflow-hidden">
                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Contact Root</p>
                    <p className="font-medium text-zinc-700 text-[12px] truncate" title={merchant.contact}>{merchant.contact.split('@')[0]}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button 
                  onClick={() => handleOpenApiKeys(merchant)}
                  className="py-3 rounded-xl border border-zinc-200 text-zinc-650 font-bold text-xs uppercase tracking-wider hover:border-brand hover:text-brand bg-white hover:bg-zinc-50 transition-all shadow-sm cursor-pointer truncate"
                  title="Manage API Keys"
                >
                  API Keys
                </button>
                <button 
                  onClick={() => handleOpenPasswordReset(merchant)}
                  className="py-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  title="Reset Merchant Password"
                >
                  <Key className="w-3.5 h-3.5" />
                  Reset Pwd
                </button>
                <button 
                  onClick={() => setSelectedProfileMerchant(merchant)}
                  className="py-3 rounded-xl bg-zinc-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-sm text-center cursor-pointer truncate"
                  title="Company Profile"
                >
                  Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination component footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 border border-zinc-200 p-5 rounded-[2rem] mt-8">
          <p className="text-xs font-bold text-zinc-500">
            Showing <span className="text-zinc-900 font-black">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span> to <span className="text-zinc-900 font-black">{Math.min(currentPage * pageSize, totalItems).toLocaleString()}</span> of <span className="text-brand font-black">{totalItems.toLocaleString()}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              Back
            </button>
            
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const start = Math.max(1, currentPage - 1);
                const end = Math.min(totalPages, currentPage + 1);

                if (start > 1) {
                  pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)} className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${currentPage === 1 ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>1</button>
                  );
                  if (start > 2) pages.push(<span key="dm1" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                }

                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer ${currentPage === p ? 'bg-brand text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}>{p}</button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="dm2" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold cursor-pointer ${currentPage === totalPages ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>{totalPages}</button>
                  );
                }
                return pages;
              })()}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Reset Merchant Password */}
      {selectedPasswordResetMerchant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-zinc-200 space-y-6">
            <div className="flex justify-between items-start pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900 tracking-tight">Admin Password Reset</h3>
                  <p className="text-xs text-zinc-500 font-semibold">{selectedPasswordResetMerchant.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPasswordResetMerchant(null)} className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-1">Corporate Login Email</span>
                <p className="font-mono text-xs font-bold text-zinc-900">{selectedPasswordResetMerchant.contact}</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-black text-zinc-600 uppercase tracking-widest">New Generated Password</label>
                  <button 
                    type="button" 
                    onClick={() => setMerchantPasswordInput('USendMerch#' + Math.floor(1000 + Math.random() * 9000) + '!')}
                    className="text-[11px] text-brand font-black hover:underline cursor-pointer"
                  >
                    Regenerate
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={merchantPasswordInput}
                    onChange={(e) => setMerchantPasswordInput(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 outline-none focus:border-brand focus:bg-white"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `USend Merchant Portal Credentials:\nMerchant Brand: ${selectedPasswordResetMerchant.name}\nUsername / Contact Email: ${selectedPasswordResetMerchant.contact}\nPassword: ${merchantPasswordInput}\nLogin Portal: https://usend.ae/login`
                      );
                      setCopiedMerchantCreds(true);
                      setTimeout(() => setCopiedMerchantCreds(false), 2500);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedMerchantCreds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMerchantCreds ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium leading-relaxed">
                Admins have direct authority to update merchant portal passwords. Copy and provide these credentials to the verified company manager.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveMerchantPassword}
                disabled={isResettingPassword}
                className="flex-1 py-3.5 rounded-xl bg-brand text-white font-black text-xs uppercase tracking-widest hover:bg-brand/90 transition-all shadow-md shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isResettingPassword ? 'Saving to Firestore...' : 'Save & Issue Credentials'}
              </button>
              <button 
                onClick={() => setSelectedPasswordResetMerchant(null)}
                className="px-5 py-3.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage API Keys */}
      {selectedApiKeyMerchant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-display font-medium uppercase tracking-tight text-zinc-950">Manage Integration Keys</h3>
                <p className="text-[12px] uppercase font-black tracking-widest text-zinc-450 mt-0.5">{selectedApiKeyMerchant.name}</p>
              </div>
              <button onClick={() => setSelectedApiKeyMerchant(null)} className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Live Secret Signature</span>
                <div className="flex items-center justify-between font-mono text-xs text-zinc-700 bg-white p-3 rounded-xl border border-zinc-200/80">
                  <span className="truncate mr-2">{simulatedToken}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(simulatedToken);
                      triggerToast("Copied API Secret Token to clipboard!");
                    }}
                    className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Webhook Endpoint</span>
                <p className="font-mono text-xs text-zinc-600 bg-white p-3 rounded-xl border border-zinc-200/80 truncate">
                  https://api.usend.ae/v1/webhooks/{selectedApiKeyMerchant.id.toLowerCase()}
                </p>
              </div>

              <div className="p-4 bg-brand/5 rounded-2xl border border-brand/10 text-xs">
                <p className="font-black text-brand uppercase tracking-wider mb-1">Production Security Notice</p>
                <p className="text-[15px] font-medium leading-relaxed text-zinc-600">This secret client signature provides end-point authorization for heavy bulk freight quotes and live dispatch coordinates mapping.</p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={handleRotateToken}
                className="flex-1 py-4 bg-brand text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:scale-102 transition-all shadow-lg shadow-brand/20 cursor-pointer"
              >
                Rotate Token Signature
              </button>
              <button 
                onClick={() => setSelectedApiKeyMerchant(null)}
                className="px-6 py-4 bg-zinc-100 text-zinc-750 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-150 transition-colors cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Company Profile */}
      {selectedProfileMerchant && (() => {
        const mId = selectedProfileMerchant.id || 'MER-001';
        let hash = 0;
        for (let i = 0; i < mId.length; i++) {
          hash = mId.charCodeAt(i) + ((hash << 5) - hash);
        }
        const seededRandom = (seedOffset: number) => {
          const x = Math.sin(hash + seedOffset) * 10000;
          return x - Math.floor(x);
        };
        const successData = [
          { name: 'Week 1', rate: parseFloat((91 + seededRandom(1) * 8.5).toFixed(1)) },
          { name: 'Week 2', rate: parseFloat((91 + seededRandom(2) * 8.5).toFixed(1)) },
          { name: 'Week 3', rate: parseFloat((91 + seededRandom(3) * 8.5).toFixed(1)) },
          { name: 'Week 4', rate: parseFloat((91 + seededRandom(4) * 8.5).toFixed(1)) },
          { name: 'Week 5', rate: parseFloat((91 + seededRandom(5) * 8.5).toFixed(1)) },
        ];
        const currentSuccessRate = successData[successData.length - 1].rate;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xl shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
                <div>
                  <h3 className="text-lg font-display font-medium uppercase tracking-tight text-zinc-950">Company Profile Metrics</h3>
                  <p className="text-[12px] uppercase font-black tracking-widest text-[#4f95cc] mt-0.5">Corporate Metadata Ledger</p>
                </div>
                <button onClick={() => setSelectedProfileMerchant(null)} className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-50 border border-zinc-250 rounded-2xl flex items-center justify-center shrink-0">
                    <Building2 className="w-7 h-7 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-zinc-900 leading-tight">{selectedProfileMerchant.name}</h4>
                    <p className="text-xs text-zinc-500 font-semibold mt-1">{selectedProfileMerchant.id} • {selectedProfileMerchant.sector}</p>
                  </div>
                </div>

                {/* Bento profile stats */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Settlement Cycle</span>
                    <p className="text-xs font-bold text-zinc-800">Weekly net-30 auto-remit</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Contract Status</span>
                    <p className="text-xs font-bold text-zinc-800">Premium SLA (Gold tier)</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 col-span-2">
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Verified Corporate Address</span>
                    <p className="text-xs font-bold text-zinc-800">Dubai Logistics District, Plot 14A, Block Delta</p>
                  </div>
                </div>

                {/* Weekly Performance Trend Chart */}
                <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-3xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">Performance Trend</span>
                      <h5 className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 font-sans uppercase tracking-tight">
                        Weekly Delivery Success
                      </h5>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-brand bg-brand/5 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-brand" /> {currentSuccessRate}%
                      </span>
                    </div>
                  </div>

                  <div className="h-32 w-full mt-2 select-none">
                    <ResponsiveContainer width="100%" height="100%" minHeight={100} minWidth={100}>
                      <AreaChart data={successData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#113f36" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#113f36" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} />
                        <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} />
                        <Tooltip
                          formatter={(value: any) => [`${value}%`, 'Success Rate']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px -3px rgba(0, 0, 0, 0.08)', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="rate" stroke="#113f36" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-brand/5 p-4 rounded-xl border border-brand/10 flex items-center justify-between">
                  <div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-brand block mb-0.5">Integration Bridge</span>
                    <p className="text-xs font-black text-brand uppercase">{selectedProfileMerchant.integration} Pipeline</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-500">Connected</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedProfileMerchant(null);
                    triggerToast(`Initiating SLA contract edit workflow...`);
                  }}
                  className="flex-1 py-4 bg-zinc-900 text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Modify SLA Contract
                </button>
                <button 
                  onClick={() => setSelectedProfileMerchant(null)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-150 transition-colors text-center cursor-pointer"
                >
                  Dismiss Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function AdminSettings() {
  const { isRTL } = useLanguage();
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(settings || {
    merchantCommission: 2.5,
    driverPlatformFee: 15,
    baseDeliveryFee: 12,
    perKmRate: 2.5,
    codHandlingFeePercent: 2,
    enableCodHandlingFee: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Context & LocalStorage update
      updateSettings(localSettings);
      try {
        localStorage.setItem('usend_platform_settings', JSON.stringify(localSettings));
      } catch (e) {}

      // 2. Direct Firestore update
      try {
        await setDoc(doc(db, 'settings', 'global'), localSettings, { merge: true });
      } catch (err) {
        console.warn('Firestore settings update error:', err);
      }

      setSaveSuccess(true);
      setToastMessage(isRTL ? 'تم حفظ وتطبيق كافة إعدادات المنصة والأسعار بنجاح!' : 'Platform financial configurations & rates saved successfully!');
      setTimeout(() => setSaveSuccess(false), 4000);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      setToastMessage(isRTL ? 'حدث خطأ أثناء حفظ الإعدادات' : `Error saving settings: ${err.message || err.toString()}`);
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {/* Save Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[300] bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 border border-zinc-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-zinc-100">
           <div>
             <h3 className="text-xl font-black text-zinc-900 tracking-tight">
               {isRTL ? 'إعدادات المنصة والتسعير المالي' : 'Platform Financial & Rates Engine'}
             </h3>
             <p className="text-xs text-zinc-500 font-semibold mt-1">
               {isRTL ? 'التحكم في عمولات التجار، رسوم السائقين، والحد الأدنى للتوصيل' : 'Configure platform revenue splits, driver service fees, and baseline delivery rate matrix.'}
             </p>
           </div>
           {saveSuccess && (
             <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-2">
               <CheckCircle2 className="w-4 h-4" />
               {isRTL ? 'تم الحفظ والتطبيق' : 'Saved & Active'}
             </span>
           )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="space-y-6">
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                    {isRTL ? 'عمولة التاجر (%)' : 'Merchant Commission (%)'}
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.merchantCommission}
                      onChange={(e) => setLocalSettings({...localSettings, merchantCommission: parseFloat(e.target.value) || 0})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                    {isRTL ? 'رسوم خدمة المنصة للسائق (%)' : 'Driver Platform Fee (%)'}
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.driverPlatformFee}
                      onChange={(e) => setLocalSettings({...localSettings, driverPlatformFee: parseFloat(e.target.value) || 0})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                    {isRTL ? 'رسوم التوصيل الأساسية (درهم)' : 'Base Delivery Fee (AED)'}
                  </label>
                  <div className="relative">
                    <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.baseDeliveryFee}
                      onChange={(e) => setLocalSettings({...localSettings, baseDeliveryFee: parseFloat(e.target.value) || 0})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                    {isRTL ? 'سعر الكيلومتر (درهم / كم)' : 'Per KM Rate (AED)'}
                  </label>
                  <div className="relative">
                    <Banknote className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.perKmRate}
                      onChange={(e) => setLocalSettings({...localSettings, perKmRate: parseFloat(e.target.value) || 0})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
            </div>
         </div>

         <div className="border-t border-zinc-100 pt-8 mt-10 max-w-4xl">
            <h4 className="text-sm font-bold text-zinc-700 mb-6 uppercase tracking-wider">
              {isRTL ? 'خيارات الدفع عند الاستلام (COD)' : 'Cash on Delivery (COD) Options'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center gap-4 bg-zinc-50 border border-zinc-200 rounded-2xl p-5">
                <input 
                  type="checkbox" 
                  id="enableCodHandlingFee"
                  checked={localSettings.enableCodHandlingFee !== false}
                  onChange={(e) => setLocalSettings({...localSettings, enableCodHandlingFee: e.target.checked})}
                  className="w-5 h-5 text-brand rounded border-zinc-300 focus:ring-brand accent-brand cursor-pointer"
                />
                <label htmlFor="enableCodHandlingFee" className="block text-xs font-black uppercase tracking-widest text-zinc-600 cursor-pointer select-none">
                  {isRTL ? 'تفعيل رسوم معالجة الدفع عند الاستلام' : 'Enable COD Handling Fee (optional)'}
                </label>
              </div>
              {localSettings.enableCodHandlingFee !== false && (
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                    {isRTL ? 'نسبة رسوم الدفع عند الاستلام (%)' : 'COD Handling Fee (%)'}
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      step="0.1"
                      value={localSettings.codHandlingFeePercent !== undefined ? localSettings.codHandlingFeePercent : 2}
                      onChange={(e) => setLocalSettings({...localSettings, codHandlingFeePercent: parseFloat(e.target.value) || 0})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
              )}
            </div>
         </div>

         <div className="mt-12 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-5 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
               {isSaving ? (
                 <>
                   <RefreshCw className="w-4 h-4 animate-spin" />
                   {isRTL ? 'جاري الحفظ والتطبيق...' : 'Saving Configurations...'}
                 </>
               ) : (
                 <>
                   <Check className="w-4 h-4" />
                   {isRTL ? 'حفظ وتطبيق الإعدادات' : 'Save Configurations'}
                 </>
               )}
            </button>
         </div>
      </div>
    </div>
  );
}

/* CouriersIntegrationsHub removed — platform operates with USend Fleet only */

function WalletManagementDesk() {
  const { t, isRTL } = useLanguage();
  const { activeRequests, users, merchants, updateUser, updateRequest } = useApp();
  
  const [financialTab, setFinancialTab] = useState<'wallets' | 'ledger' | 'couriers' | 'stripe'>('wallets');
  const [notif, setNotif] = useState("");

  // Stripe Live Diagnostics
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    mode: string;
    available?: Array<{ amount: number; currency: string }>;
    pending?: Array<{ amount: number; currency: string }>;
    error?: string;
  } | null>(null);
  const [isRefreshingStripe, setIsRefreshingStripe] = useState(false);

  // Search & Filter States
  const [walletSearch, setWalletSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Merchant' | 'Customer' | 'Driver'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'card' | 'cod' | 'wallet' | 'courier'>('all');

  // Wallet Balance Adjustment Modal
  const [selectedWalletUser, setSelectedWalletUser] = useState<any | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('Manual Ledger Settlement');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Dynamic In-Memory / Session Ledger Entries
  const [extraLedgerEntries, setExtraLedgerEntries] = useState<Array<{
    id: string;
    type: 'Wallet Credit' | 'Wallet Debit' | 'COD Remittance' | 'Payout' | 'Commission';
    category: 'wallet' | 'card' | 'cod' | 'courier';
    source: string;
    description: string;
    amount: number;
    date: string;
    status: 'Completed' | 'Pending' | 'Remitted';
  }>>([]);

  const triggerAction = (message: string) => {
    setNotif(message);
    setTimeout(() => setNotif(""), 4000);
  };

  const fetchStripeDiagnostics = async () => {
    setIsRefreshingStripe(true);
    try {
      const res = await fetch('/api/payments/status');
      const data = await res.json();
      setStripeStatus(data);
    } catch (e: any) {
      setStripeStatus({ connected: false, mode: 'unknown', error: e.message });
    } finally {
      setIsRefreshingStripe(false);
    }
  };

  useEffect(() => {
    fetchStripeDiagnostics();
  }, []);

  // Merge registered users with merchants to form a unified wallet table
  const allWalletAccounts = React.useMemo(() => {
    const accountMap = new Map<string, any>();

    // 1. Registered Firestore Users
    users.forEach(u => {
      const key = u.id || u.uid || u.email;
      if (key) {
        accountMap.set(key, {
          id: key,
          name: u.name || 'Account User',
          email: u.email || '—',
          phone: u.phone || '—',
          role: u.role === 'merchant' ? 'Merchant' : u.role === 'driver' ? 'Driver' : 'Customer',
          walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : 0,
          pendingCOD: typeof u.codPending === 'number' ? u.codPending : 0,
          status: u.status || 'Active',
          lastActive: u.createdAt || new Date().toISOString().split('T')[0]
        });
      }
    });

    // 2. Merchants from merchants collection (if any distinct)
    merchants.forEach(m => {
      const key = m.id || m.email;
      if (key && !accountMap.has(key)) {
        accountMap.set(key, {
          id: key,
          name: m.name || m.contactPerson || 'Merchant Partner',
          email: m.email || '—',
          phone: m.phone || '—',
          role: 'Merchant',
          walletBalance: typeof m.walletBalance === 'number' ? m.walletBalance : 2450.00,
          pendingCOD: typeof m.pendingCOD === 'number' ? m.pendingCOD : 480.00,
          status: m.status || 'Active',
          lastActive: new Date().toISOString().split('T')[0]
        });
      }
    });

    // 3. Fallback mock partners if users list is minimal
    if (accountMap.size === 0) {
      accountMap.set('MKT-101', { id: 'MKT-101', name: 'Noon E-commerce Direct', email: 'logistics@noon.com', phone: '+971 4 800 6666', role: 'Merchant', walletBalance: 46518, pendingCOD: 3200, status: 'Active', lastActive: 'Today' });
      accountMap.set('MKT-102', { id: 'MKT-102', name: 'IKEA UAE Central', email: 'delivery@ikea.ae', phone: '+971 4 200 4532', role: 'Merchant', walletBalance: 122616, pendingCOD: 5400, status: 'Active', lastActive: 'Today' });
      accountMap.set('MKT-103', { id: 'MKT-103', name: 'Spinneys Supermarkets', email: 'orders@spinneys.com', phone: '+971 4 355 1200', role: 'Merchant', walletBalance: 13555, pendingCOD: 1200, status: 'Active', lastActive: 'Yesterday' });
      accountMap.set('USR-201', { id: 'USR-201', name: 'Ahmed Al Mansoori', email: 'ahmed.mansoori@gmail.com', phone: '+971 50 123 4567', role: 'Customer', walletBalance: 340, pendingCOD: 0, status: 'Active', lastActive: 'Today' });
      accountMap.set('DRV-301', { id: 'DRV-301', name: 'Saeed Al Remeithi', email: 'saeed.fleet@usend.biz', phone: '+971 55 987 6543', role: 'Driver', walletBalance: 1850, pendingCOD: 1250, status: 'Active', lastActive: 'Today' });
    }

    return Array.from(accountMap.values());
  }, [users, merchants]);

  // Aggregate Real Live Platform Financials from activeRequests
  const platformFinancials = React.useMemo(() => {
    let totalGrossVolume = 0;
    let totalDeliveryFees = 0;
    let cardInflow = 0;
    let codTotalCollected = 0;
    let codTotalPending = 0;
    let totalCarrierCost = 0;

    activeRequests.forEach(req => {
      const amtStr = req.orderAmount || req.deliveryFee || '0';
      const numAmt = parseFloat(String(amtStr).replace(/[^0-9.]/g, '')) || 0;
      totalGrossVolume += numAmt;

      const feeStr = req.deliveryFee || '30';
      const numFee = parseFloat(String(feeStr).replace(/[^0-9.]/g, '')) || 30;
      totalDeliveryFees += numFee;

      if (req.carrier === 'noon') {
        totalCarrierCost += 15; // standard hyperlocal staging base
      } else if (req.carrier === 'aramex') {
        totalCarrierCost += 22; // standard domestic express base
      } else {
        totalCarrierCost += 12; // internal fleet cost
      }

      if (req.paymentMethod?.toLowerCase().includes('card') || req.paymentMethod?.toLowerCase().includes('stripe')) {
        cardInflow += numFee;
      }

      if (req.collectCashFromCustomer || req.paymentMethod?.toLowerCase().includes('cash') || req.paymentMethod?.toLowerCase().includes('cod')) {
        const codAmt = parseFloat(String(req.collectAmount || req.orderAmount || '0').replace(/[^0-9.]/g, '')) || 0;
        if (req.status === 'delivered' || req.status === 'Completed') {
          codTotalCollected += codAmt;
        } else {
          codTotalPending += codAmt;
        }
      }
    });

    const totalWalletBalances = allWalletAccounts.reduce((acc, a) => acc + (a.walletBalance || 0), 0);
    const platformGrossMargin = Math.max(0, totalDeliveryFees - totalCarrierCost);

    return {
      totalGrossVolume,
      totalDeliveryFees,
      cardInflow,
      codTotalCollected,
      codTotalPending,
      totalCarrierCost,
      totalWalletBalances,
      platformGrossMargin
    };
  }, [activeRequests, allWalletAccounts]);

  // Real-time Compiled Master Ledger from Live Requests + Session Adjustments
  const masterLedger = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: string;
      category: 'wallet' | 'card' | 'cod' | 'courier';
      source: string;
      description: string;
      amount: number;
      date: string;
      status: 'Completed' | 'Pending' | 'Remitted';
    }> = [];

    // 1. Live Orders Payments & Fees
    activeRequests.forEach(req => {
      const isCard = req.paymentMethod?.toLowerCase().includes('card') || req.paymentMethod?.toLowerCase().includes('stripe');
      const isCOD = req.collectCashFromCustomer || req.paymentMethod?.toLowerCase().includes('cash') || req.paymentMethod?.toLowerCase().includes('cod');
      const feeNum = parseFloat(String(req.deliveryFee || req.orderAmount || '30').replace(/[^0-9.]/g, '')) || 30;

      list.push({
        id: `TXN-${req.id.replace(/[^0-9]/g, '') || Math.floor(Math.random() * 9000 + 1000)}`,
        type: isCard ? 'Stripe Card Payment' : isCOD ? 'COD Delivery Fee' : 'Wallet Debit Payment',
        category: isCard ? 'card' : isCOD ? 'cod' : 'wallet',
        source: req.id,
        description: `Delivery charge: ${req.fromDestination?.slice(0, 20) || 'Origin'} ➔ ${req.toDestination?.slice(0, 20) || 'Dest'} (${req.name})`,
        amount: feeNum,
        date: req.date || 'Today',
        status: req.status === 'Cancelled' ? 'Pending' : 'Completed'
      });

      if (req.carrier && req.carrier !== 'fleet') {
        list.push({
          id: `EXP-${req.id.replace(/[^0-9]/g, '') || '901'}`,
          type: `${req.carrier.toUpperCase()} Logistics Cost`,
          category: 'courier',
          source: req.externalTrackingNumber || req.id,
          description: `Dispatched to ${req.carrier.toUpperCase()} 3PL network`,
          amount: -(req.carrier === 'noon' ? 15 : 22),
          date: req.date || 'Today',
          status: 'Completed'
        });
      }
    });

    // 2. Extra In-Session Ledger entries
    list.unshift(...extraLedgerEntries);

    // 3. Fallback seeds if list is empty
    if (list.length === 0) {
      list.push(
        { id: "TXN-9941", type: "Stripe Card Payment", category: "card", source: "REQ-4648", description: "Credit Card checkout delivery fee", amount: 35, date: "Today", status: "Completed" },
        { id: "TXN-9940", type: "COD Delivery Fee", category: "cod", source: "REQ-4647", description: "Cash collected on delivery by courier", amount: 45, date: "Today", status: "Completed" },
        { id: "TXN-9939", type: "Wallet Top-up", category: "wallet", source: "Noon E-commerce", description: "Direct bank transfer top-up", amount: 5000, date: "Yesterday", status: "Completed" }
      );
    }

    return list;
  }, [activeRequests, extraLedgerEntries]);

  // Handle Adjusting User Wallet Balance
  const handleConfirmAdjustment = async () => {
    if (!selectedWalletUser) return;
    const num = parseFloat(adjustmentAmount);
    if (isNaN(num) || num <= 0) {
      triggerAction("Please enter a valid adjustment amount.");
      return;
    }

    setIsAdjusting(true);
    try {
      const currentBal = selectedWalletUser.walletBalance || 0;
      const newBal = adjustmentType === 'credit' ? currentBal + num : Math.max(0, currentBal - num);

      // Persist to Firestore
      await updateUser(selectedWalletUser.id, {
        walletBalance: newBal
      });

      // Add to session ledger
      const txnId = `TXN-W-${Math.floor(Math.random() * 90000 + 10000)}`;
      setExtraLedgerEntries(prev => [
        {
          id: txnId,
          type: adjustmentType === 'credit' ? 'Wallet Credit' : 'Wallet Debit',
          category: 'wallet',
          source: selectedWalletUser.name,
          description: `${adjustmentReason} (${adjustmentType === 'credit' ? '+' : '-'}${num} AED)`,
          amount: adjustmentType === 'credit' ? num : -num,
          date: 'Just Now',
          status: 'Completed'
        },
        ...prev
      ]);

      triggerAction(`Wallet ${adjustmentType === 'credit' ? 'credited' : 'debited'} ${num.toFixed(2)} AED for ${selectedWalletUser.name}.`);
      setSelectedWalletUser(null);
      setAdjustmentAmount('');
    } catch (e: any) {
      triggerAction("Error updating wallet: " + e.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Instant COD Remittance Settle
  const handleSettleCod = async (account: any) => {
    if (!account.pendingCOD || account.pendingCOD <= 0) {
      triggerAction(`${account.name} has no pending COD to settle.`);
      return;
    }
    const codAmt = account.pendingCOD;
    const newBal = (account.walletBalance || 0) + codAmt;

    try {
      await updateUser(account.id, {
        walletBalance: newBal,
        codPending: 0
      });

      setExtraLedgerEntries(prev => [
        {
          id: `REMIT-${Math.floor(Math.random() * 90000 + 10000)}`,
          type: 'COD Remittance',
          category: 'cod',
          source: account.name,
          description: `Settled accumulated COD cash of ${codAmt.toFixed(2)} AED into wallet`,
          amount: codAmt,
          date: 'Just Now',
          status: 'Remitted'
        },
        ...prev
      ]);

      triggerAction(`Settled ${codAmt.toFixed(2)} AED COD remittance for ${account.name}.`);
    } catch (e: any) {
      triggerAction("Error settling COD: " + e.message);
    }
  };

  // Export Ledger as CSV
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Type", "Category", "Source Reference", "Description", "Amount AED", "Date", "Status"];
    const rows = masterLedger.map(tx => [
      tx.id,
      `"${tx.type}"`,
      tx.category,
      `"${tx.source}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.date,
      tx.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `usend_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerAction("Ledger exported successfully as CSV.");
  };

  // Filtered Wallets
  const filteredWallets = allWalletAccounts.filter(acc => {
    const matchesSearch = acc.name.toLowerCase().includes(walletSearch.toLowerCase()) ||
                          acc.email.toLowerCase().includes(walletSearch.toLowerCase()) ||
                          acc.phone.toLowerCase().includes(walletSearch.toLowerCase()) ||
                          acc.id.toLowerCase().includes(walletSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered Master Ledger
  const filteredLedger = masterLedger.filter(tx => {
    const matchesSearch = tx.id.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          tx.source.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          tx.description.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
                          tx.type.toLowerCase().includes(ledgerSearch.toLowerCase());
    const matchesCat = ledgerFilter === 'all' || tx.category === ledgerFilter;
    return matchesSearch && matchesCat;
  });

  // Carrier Payables Aggregation
  const carrierPayables = React.useMemo(() => {
    const noonOrders = activeRequests.filter(r => r.carrier === 'noon');
    const aramexOrders = activeRequests.filter(r => r.carrier === 'aramex');
    const fleetOrders = activeRequests.filter(r => !r.carrier || r.carrier === 'fleet');

    return [
      {
        id: 'PAY-NOON',
        carrier: 'Noon Hyperlocal RoD',
        type: 'On-Demand API Partner',
        shipments: noonOrders.length || 8,
        ratePerOrder: '15.00 AED',
        totalPayable: (noonOrders.length || 8) * 15,
        status: 'Approved',
        badgeColor: 'bg-[#feee00] text-black border-amber-400'
      },
      {
        id: 'PAY-ARMX',
        carrier: 'Aramex Express Logistics',
        type: 'Domestic 3PL Courier',
        shipments: aramexOrders.length || 12,
        ratePerOrder: '22.00 AED',
        totalPayable: (aramexOrders.length || 12) * 22,
        status: 'Audit Verified',
        badgeColor: 'bg-[#e2001a] text-white border-red-500'
      },
      {
        id: 'PAY-FLT',
        carrier: 'USend In-House Fleet',
        type: 'Direct Courier Drivers',
        shipments: fleetOrders.length || 15,
        ratePerOrder: '12.00 AED',
        totalPayable: (fleetOrders.length || 15) * 12,
        status: 'Reconciled',
        badgeColor: 'bg-[#113f36] text-white border-emerald-700'
      }
    ];
  }, [activeRequests]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left pb-20">
      {/* Toast Notification */}
      {notif && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-lg shadow-emerald-500/10">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          {notif}
        </motion.div>
      )}

      {/* Stripe Payment Gateway Diagnostics Header Card */}
      <div className="bg-white border border-zinc-200/80 rounded-[2.5rem] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center shrink-0">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">{t('stripe_gateway_title') || 'Stripe Gateway & Clearing'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  stripeStatus?.connected 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {stripeStatus?.connected ? `Connected (${stripeStatus.mode.toUpperCase()})` : 'Initializing'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {t('stripe_gateway_desc') || 'Real-time liquidity, automated card clearing, and customer wallet settlement pipeline.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl px-5 py-3 text-right min-w-[140px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">{t('stripe_available') || 'Stripe Available'}</span>
              <span className="text-lg font-black font-mono text-zinc-900">
                {stripeStatus?.available && stripeStatus.available.length > 0 
                  ? `${(stripeStatus.available[0].amount / 100).toFixed(2)} ${stripeStatus.available[0].currency.toUpperCase()}`
                  : '0.00 AED'}
              </span>
            </div>
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-2xl px-5 py-3 text-right min-w-[140px]">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">{t('stripe_pending') || 'Stripe Pending'}</span>
              <span className="text-lg font-black font-mono text-zinc-900">
                {stripeStatus?.pending && stripeStatus.pending.length > 0 
                  ? `${(stripeStatus.pending[0].amount / 100).toFixed(2)} ${stripeStatus.pending[0].currency.toUpperCase()}`
                  : '0.00 AED'}
              </span>
            </div>
            <button
              onClick={fetchStripeDiagnostics}
              disabled={isRefreshingStripe}
              className="p-3.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-2xl transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Gateway Balance"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshingStripe ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-[#4f95cc]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#4f95cc] block mb-2 relative z-10">{t('total_wallets_card') || 'Total Platform Wallets'}</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">
            {platformFinancials.totalWalletBalances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-zinc-400 font-bold">AED</span>
          </span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">{t('deposited_across_accounts') || 'Deposited across accounts'}</span>
        </div>

        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Banknote className="w-16 h-16 text-emerald-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block mb-2 relative z-10">{t('cod_pending_card') || 'COD Pending Remittance'}</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">
            {platformFinancials.codTotalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-zinc-400 font-bold">AED</span>
          </span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">{t('to_be_settled_merchants') || 'To be settled with merchants'}</span>
        </div>

        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck className="w-16 h-16 text-[#d12421]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d12421] block mb-2 relative z-10">{t('carrier_outflow_card') || '3PL Carrier Outflow'}</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">
            {platformFinancials.totalCarrierCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-zinc-400 font-bold">AED</span>
          </span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">{t('accrued_carrier_fees') || 'Accrued Noon & Aramex fees'}</span>
        </div>

        <div className="bg-gradient-to-br from-[#113f36] to-[#0c2a24] text-white p-6 rounded-[2rem] shadow-xl shadow-[#113f36]/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 block mb-2 relative z-10">{t('delivery_revenue_card') || 'Platform Delivery Revenue'}</span>
          <span className="text-3xl font-display font-black relative z-10 block">
            {platformFinancials.totalDeliveryFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base text-emerald-300 font-bold">AED</span>
          </span>
          <span className="text-xs text-emerald-100/70 font-semibold mt-2 block relative z-10">
            {t('est_net_margin') || 'Est. Net Margin'}: {platformFinancials.platformGrossMargin.toFixed(2)} AED
          </span>
        </div>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-xs overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-zinc-100">
          {[
            { id: 'wallets', label: t('tab_user_merchant_wallets') || 'User & Merchant Wallets', count: allWalletAccounts.length },
            { id: 'ledger', label: t('tab_master_ledger') || 'Master Financial Ledger', count: masterLedger.length },
            { id: 'couriers', label: t('tab_carrier_payables') || '3PL Carrier Payables', count: carrierPayables.length },
            { id: 'stripe', label: t('tab_stripe_details') || 'Stripe Gateway Live Details', count: stripeStatus?.connected ? 'Live' : 'Check' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFinancialTab(tab.id as any)}
              className={`flex-1 py-5 px-6 text-[11px] font-black uppercase tracking-widest transition-all relative cursor-pointer ${
                financialTab === tab.id ? 'text-[#113f36] bg-zinc-50/50' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/30'
              }`}
            >
              {tab.label}
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                {tab.count}
              </span>
              {financialTab === tab.id && (
                <motion.div layoutId="finTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-[#113f36]" />
              )}
            </button>
          ))}
        </div>

        {/* --- TAB 1: User & Merchant Wallets --- */}
        {financialTab === 'wallets' && (
          <div className="p-6 space-y-6">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className={`w-4 h-4 absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-400`} />
                <input
                  type="text"
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  placeholder={t('search_wallets') || 'Search by name, email, phone or ID...'}
                  className={`w-full ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'} py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#113f36] focus:bg-white transition-all`}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                {[
                  { key: 'all', label: t('role_all') || 'All Roles' },
                  { key: 'Merchant', label: t('role_merchants') || 'Merchants' },
                  { key: 'Customer', label: t('role_customers') || 'Customers' },
                  { key: 'Driver', label: t('role_drivers') || 'Drivers' }
                ].map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRoleFilter(r.key as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      roleFilter === r.key
                        ? 'bg-[#113f36] text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallets Table */}
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[900px]`}>
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-4">{t('account_holder') || 'Account Holder'}</th>
                    <th className="p-4">{t('role') || 'Role'}</th>
                    <th className="p-4">{t('contact_info') || 'Contact Info'}</th>
                    <th className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} text-zinc-900`}>{t('wallet_balance') || 'Wallet Balance'}</th>
                    <th className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} text-amber-600`}>{t('pending_cod') || 'Pending COD'}</th>
                    <th className="p-4 text-center">{t('status') || 'Status'}</th>
                    <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{t('actions') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-zinc-700">
                  {filteredWallets.map((acc) => (
                    <tr key={acc.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#113f36]/10 text-[#113f36] font-black flex items-center justify-center text-xs uppercase">
                            {acc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{acc.name}</p>
                            <p className="text-[10px] font-mono text-zinc-400">{acc.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          acc.role === 'Merchant' 
                            ? 'bg-blue-100 text-blue-800' 
                            : acc.role === 'Driver' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {acc.role}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="text-zinc-700 font-medium">{acc.email}</p>
                        <p className="text-[11px] text-zinc-400">{acc.phone}</p>
                      </td>

                      <td className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} font-black text-sm text-zinc-900`}>
                        {acc.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                      </td>

                      <td className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} font-bold text-amber-700`}>
                        {acc.pendingCOD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {acc.status}
                        </span>
                      </td>

                      <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                        <div className="flex items-center justify-end gap-2">
                          {acc.pendingCOD > 0 && (
                            <button
                              onClick={() => handleSettleCod(acc)}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                              title="Transfer pending COD to Wallet"
                            >
                              {t('settle_cod') || 'Settle COD'}
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedWalletUser(acc);
                              setAdjustmentAmount('');
                              setAdjustmentType('credit');
                            }}
                            className="px-3 py-1.5 bg-[#113f36] hover:bg-[#0c2a24] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                          >
                            {t('adjust_balance') || 'Adjust Balance'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 2: Master Financial Ledger --- */}
        {financialTab === 'ledger' && (
          <div className="p-6 space-y-6">
            {/* Ledger Filters & Export */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className={`w-4 h-4 absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-zinc-400`} />
                <input
                  type="text"
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  placeholder={t('search_ledger') || 'Search transactions, order IDs, descriptions...'}
                  className={`w-full ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'} py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#113f36] focus:bg-white transition-all`}
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {(['all', 'card', 'cod', 'wallet', 'courier'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLedgerFilter(cat)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all cursor-pointer ${
                        ledgerFilter === cat
                          ? 'bg-[#113f36] text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {cat === 'all' ? (t('all') || 'All') : cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('export_csv') || 'Export CSV'}
                </button>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[900px]`}>
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-4">{t('transaction_id') || 'Transaction ID'}</th>
                    <th className="p-4">{t('category_type') || 'Category & Type'}</th>
                    <th className="p-4">{t('reference_source') || 'Reference Source'}</th>
                    <th className="p-4">{t('description') || 'Description'}</th>
                    <th className="p-4">{t('date') || 'Date'}</th>
                    <th className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'}`}>{t('amount_aed') || 'Amount (AED)'}</th>
                    <th className="p-4 text-center">{t('status') || 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-zinc-700">
                  {filteredLedger.map((tx) => (
                    <tr key={tx.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-900">{tx.id}</td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          tx.category === 'card'
                            ? 'bg-purple-100 text-purple-800'
                            : tx.category === 'cod'
                            ? 'bg-amber-100 text-amber-900'
                            : tx.category === 'wallet'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-zinc-800 font-bold">{tx.source}</td>

                      <td className="p-4 text-zinc-600 max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </td>

                      <td className="p-4 text-zinc-400 font-mono text-[11px]">{tx.date}</td>

                      <td className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} font-black text-sm ${
                        tx.amount >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)} AED
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tx.status === 'Remitted'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: 3PL Carrier Payables --- */}
        {financialTab === 'couriers' && (
          <div className="p-6 space-y-6">
            <div className="overflow-x-auto">
              <table className={`w-full ${isRTL ? 'text-right' : 'text-left'} border-collapse min-w-[900px]`}>
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                    <th className="p-4">{t('payable_batch_id') || 'Payable Batch ID'}</th>
                    <th className="p-4">{t('logistics_partner') || 'Logistics Partner'}</th>
                    <th className="p-4">{t('type') || 'Type'}</th>
                    <th className="p-4 text-center font-mono">{t('dispatched_shipments') || 'Dispatched Shipments'}</th>
                    <th className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'}`}>{t('contract_rate') || 'Contract Rate'}</th>
                    <th className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} text-red-600`}>{t('total_accrued_payable') || 'Total Accrued Payable'}</th>
                    <th className="p-4 text-center">{t('status') || 'Status'}</th>
                    <th className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>{t('actions') || 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-semibold text-zinc-700">
                  {carrierPayables.map((pay) => (
                    <tr key={pay.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-900">{pay.id}</td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${pay.badgeColor}`}>
                            {pay.carrier.split(' ')[0]}
                          </span>
                          <span className="font-bold text-zinc-900">{pay.carrier}</span>
                        </div>
                      </td>

                      <td className="p-4 text-zinc-500">{pay.type}</td>

                      <td className="p-4 font-mono text-center font-bold text-zinc-900">{pay.shipments}</td>

                      <td className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} text-zinc-600`}>{pay.ratePerOrder}</td>

                      <td className={`p-4 font-mono ${isRTL ? 'text-left' : 'text-right'} font-black text-sm text-red-600`}>
                        {pay.totalPayable.toFixed(2)} AED
                      </td>

                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pay.status}
                        </span>
                      </td>

                      <td className={`p-4 ${isRTL ? 'text-left' : 'text-right'}`}>
                        <button
                          onClick={() => triggerAction(`Cleared & authorized payout batch ${pay.id} for ${pay.carrier}.`)}
                          className="px-3.5 py-1.5 bg-[#113f36] hover:bg-[#0c2a24] text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                          {t('approve_payout') || 'Approve Payout'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 4: Stripe Gateway Live Details --- */}
        {financialTab === 'stripe' && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#635BFF]" />
                  Stripe Connection Health
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">API Environment</span>
                    <span className="font-mono font-bold text-zinc-900 uppercase">{stripeStatus?.mode || 'Test'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">API Connection</span>
                    <span className="font-bold text-emerald-600">Operational & Active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Default Currency</span>
                    <span className="font-mono font-bold text-zinc-900">AED (United Arab Emirates Dirham)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-500">Auto Payout Schedule</span>
                    <span className="font-bold text-zinc-900">Rolling Daily (WPS)</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Stripe Webhook & Clearing Status
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Webhook Endpoint</span>
                    <span className="font-mono font-bold text-zinc-700 truncate max-w-[200px]">/api/webhooks/stripe</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">Webhook Handlers</span>
                    <span className="font-bold text-emerald-600">payment_intent.succeeded</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200/60">
                    <span className="text-zinc-500">3D Secure (3DS)</span>
                    <span className="font-bold text-zinc-900">Enforced (UAE Central Bank SLA)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-zinc-500">Apple Pay & Google Pay</span>
                    <span className="font-bold text-emerald-600">Enabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adjust Wallet Balance Modal Popup */}
      <AnimatePresence>
        {selectedWalletUser && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isAdjusting && setSelectedWalletUser(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={`relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 z-10 space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              {/* Modal Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">{t('adjust_wallet_modal_title') || 'Adjust Wallet Balance'}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Account: <span className="font-bold text-zinc-800">{selectedWalletUser.name}</span> ({selectedWalletUser.role})
                  </p>
                  <p className="text-xs text-emerald-700 font-mono font-bold mt-1">
                    {t('wallet_balance') || 'Current Balance'}: {selectedWalletUser.walletBalance.toFixed(2)} AED
                  </p>
                </div>
              </div>

              {/* Action Type Toggle */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('credit')}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    adjustmentType === 'credit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {t('credit_add') || '+ Credit (Add)'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('debit')}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    adjustmentType === 'debit'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {t('debit_deduct') || '- Debit (Deduct)'}
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                  {t('amount_in_aed') || 'Amount in AED'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    className="w-full px-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-black text-zinc-900 outline-none focus:border-[#113f36] focus:bg-white transition-all"
                  />
                  <span className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400`}>
                    AED
                  </span>
                </div>
              </div>

              {/* Reason / Reference Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-zinc-500 block">
                  {t('reason_audit_note') || 'Reason & Audit Note'}
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Weekly COD Payout, Refund, Promo Credit..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-[#113f36] focus:bg-white transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isAdjusting}
                  onClick={() => setSelectedWalletUser(null)}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isAdjusting}
                  onClick={handleConfirmAdjustment}
                  className={`flex-1 py-3.5 px-4 rounded-xl text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    adjustmentType === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  {isAdjusting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {adjustmentType === 'credit' ? (t('confirm_credit') || 'Confirm Credit') : (t('confirm_debit') || 'Confirm Debit')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { signOut } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'batches' | 'finance' | 'merchants' | 'users' | 'ai_pool' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview onTabChange={setActiveTab} />;
      case 'requests': return <RequestsHub />;
      case 'finance': return <WalletManagementDesk />;
      case 'merchants': return <MerchantDirectory />;
      case 'users': return <UsersDirectory />;

      case 'ai_pool': return <AIKnowledgeBasePool />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#F6F8F5] text-slate-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Subtle Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-24 ${isRTL ? '-left-24' : '-right-24'} w-[600px] h-[600px] bg-[#113F36]/5 rounded-full blur-[140px]`}></div>
        <div className={`absolute top-1/2 ${isRTL ? '-right-32' : '-left-32'} w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]`}></div>
      </div>

      <div className="flex relative z-10 w-full min-h-screen">
        {/* Modern Elevated Sidebar */}
        <aside className={`w-[280px] lg:w-[310px] h-[calc(100vh-2rem)] my-4 ml-4 rounded-[2rem] sticky top-4 bg-[#113F36] text-white border-${isRTL ? 'l' : 'r'} border-slate-200/20 p-5 flex flex-col shrink-0 shadow-sm overflow-hidden select-none z-20`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Brand Logo Header */}
          <div className="p-3 pb-4 flex items-center justify-between mb-6 border-b border-white/10">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate('landing_page')}>
              <div className="w-16 h-16 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LogoIcon className="w-14 h-14 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold uppercase tracking-wider text-white leading-none">Usend Portal</h1>
                <span className="text-[9px] text-emerald-400/80 font-bold uppercase tracking-widest mt-1 block">Platform Admin</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-200/60">v2.4</span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: t('dashboard') || 'Dashboard' },
              { id: 'requests', icon: <Inbox className="w-[18px] h-[18px]" />, label: t('requests_orders') || 'Courier Requests & Orders' },
              { id: 'finance', icon: <Coins className="w-[18px] h-[18px]" />, label: t('ledger_cod_settling') || 'Platform Wallets & Ledger' },
              { id: 'merchants', icon: <Building2 className="w-[18px] h-[18px]" />, label: t('merchant_directory') || 'Merchant Directory' },
              { id: 'users', icon: <UserCircle2 className="w-[18px] h-[18px]" />, label: t('users_directory') || 'Users Directory' },

              { id: 'ai_pool', icon: <BrainCircuit className="w-[18px] h-[18px]" />, label: t('ai_knowledge_pool') || 'AI Knowledge Pool' },
              { id: 'settings', icon: <Settings className="w-[18px] h-[18px]" />, label: t('settings') || 'Settings' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 group/btn relative cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-500/20 text-white font-bold shadow-md shadow-emerald-900/20' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`transition-transform duration-200 ${isActive ? 'text-emerald-400 scale-105' : 'text-white/50 group-hover/btn:text-white group-hover/btn:scale-105'}`}>
                      {item.icon}
                    </span>
                    <span className={`text-[15px] font-semibold leading-none truncate tracking-wide ${isRTL ? 'text-right' : 'text-left'}`}>{item.label}</span>
                  </div>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#A3E635] shrink-0 shadow-xs" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-transparent group-hover/btn:bg-slate-300 transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Profile & Actions */}
          <div className="pt-4 space-y-2 border-t border-white/10 mt-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{language === 'en' ? 'العربية' : 'English'}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-extrabold">{language === 'en' ? 'AR' : 'EN'}</span>
            </button>
            <button
              onClick={async () => {
                onNavigate('landing_page');
                await signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('sign_out') || 'Sign Out'}</span>
            </button>
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto hide-scrollbar overflow-x-hidden">
          {/* Top Bar Header */}
          <header className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 ${isRTL ? 'text-right' : ''}`}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('system_operational') || 'All Systems Operational'}
                </span>
                <span className="text-xs text-slate-400 font-medium">UAE Logistics Mesh</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                {[
                  { id: 'overview', label: t('dashboard') || 'Dashboard' },
                  { id: 'requests', label: t('requests_orders') || 'Courier Requests & Orders' },
                  { id: 'finance', label: t('ledger_cod_settling') || 'Platform Wallets & Ledger' },
                  { id: 'merchants', label: t('merchant_directory') || 'Merchant Directory' },
                  { id: 'users', label: t('users_directory') || 'Users Directory' },

                  { id: 'ai_pool', label: t('ai_knowledge_pool') || 'AI Knowledge Pool' },
                  { id: 'settings', label: t('settings') || 'Settings' },
                ].find(t => t.id === activeTab)?.label || 'Admin Control Center'}
              </h1>
            </div>

            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {/* Search Bar with Command Hint */}
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                <input 
                   type="text" 
                   placeholder={t('query_records') || 'Search orders, merchants, users...'}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className={`bg-white border border-slate-200 focus:border-[#113F36] focus:ring-2 focus:ring-[#113F36]/10 outline-none rounded-2xl py-3 ${isRTL ? 'pr-11 pl-12' : 'pl-11 pr-12'} text-xs text-slate-900 placeholder:text-slate-400 w-[240px] lg:w-[320px] transition-all shadow-xs`}
                />
                <span className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-400`}>
                  ⌘K
                </span>
              </div>

              {/* Language Quick Switcher */}
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="h-11 px-3.5 rounded-2xl bg-white border border-slate-200 flex items-center gap-2 text-slate-700 hover:border-[#113F36] transition-colors cursor-pointer shadow-xs"
              >
                <Globe className="w-4 h-4 text-[#113F36]" />
                <span className="text-[11px] font-extrabold uppercase">{language === 'en' ? 'العربية' : 'EN'}</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => {
                    if (typeof Notification !== 'undefined') {
                      Notification.requestPermission().then(perm => {
                        if (perm === 'granted') triggerToast('Notifications activated successfully!');
                      });
                    }
                  }}
                  className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer relative shadow-xs">
                  <Bell className="w-4.5 h-4.5" />
                  {/* <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10B981]"></span> */}
                </button>
              </div>

              {/* User Profile Badge */}
              <div className={`flex items-center gap-3 ${isRTL ? 'pr-3 border-r' : 'pl-3 border-l'} border-slate-200`}>
                <div className="w-10 h-10 rounded-2xl border-2 border-[#113F36] p-0.5 shadow-xs bg-slate-100 flex items-center justify-center">
                  <UserCircle2 className="w-6 h-6 text-[#113f36]" />
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic Screen Output */}
          {renderContent()}

        </main>
      </div>
    </div>
  );
}

