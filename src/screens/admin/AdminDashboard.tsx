import { motion } from 'motion/react';
import { Screen } from '../../types';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LogoIcon from '../../components/LogoIcon';

const createCustomMarker = (colorClass: string, shadowColor: string, delay: string = '0s') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div class="w-2.5 h-2.5 ${colorClass} rounded-full animate-pulse border-2 border-white shadow-[0_0_15px_${shadowColor}]" style="animation-delay: ${delay}"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });
};
const createInteractiveMarker = (colorClass: string, shadowColor: string, label: string) => {
  return L.divIcon({
    className: 'custom-interactive-marker',
    html: `<div class="relative group w-full h-full cursor-pointer">
        <div class="w-5 h-5 ${colorClass} rounded-full border-2 border-white shadow-[0_0_15px_${shadowColor}] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"></div>
        <div class="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white text-zinc-900 text-[12px] font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          ${label}
        </div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

import { 
  BarChart3, Users, Store, Truck, Activity, 
  ShieldAlert, ShieldCheck, Settings, Bell, Search, 
  ChevronRight, BrainCircuit, Zap, Globe,
  ArrowUpRight, ArrowDownRight, MoreVertical,
  LogOut, LayoutDashboard, Database, MessageSquare, DollarSign, Wallet, Percent, CreditCard, ChevronDown, CheckCircle2, XCircle, Clock,
  Inbox, UserCircle2, Building2, MapPin, Code2, Repeat, X,
  Boxes, ClipboardList, FileText, Coins, TrendingUp, Anchor, Plus, Check
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const { activeRequests, merchants } = useApp();

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

  const stats = [
    { label: 'Today\'s Revenue', value: `${todayRevenue.toLocaleString()} AED`, trend: todayRevenue > 0 ? '+100%' : '0%', icon: <DollarSign className="w-5 h-5" />, color: 'text-brand' },
    { label: 'Pending Requests', value: String(pendingRequestsCount), trend: pendingRequestsCount > 0 ? `+${pendingRequestsCount}` : '0', icon: <Clock className="w-5 h-5" />, color: 'text-orange-500' },
    { label: 'Settlements Due', value: `${totalSettlements.toLocaleString()} AED`, trend: '0%', icon: <Wallet className="w-5 h-5" />, color: 'text-purple-600' },
    { label: t('active_merchants') || 'Active Merchants', value: String(activeMerchantsCount), trend: activeMerchantsCount > 0 ? `+${activeMerchantsCount}` : '0', icon: <Store className="w-5 h-5" />, color: 'text-[#3a4a2c]' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Stunning Template Hero Banner Card */}
      <div className="bg-gradient-to-br from-[#7AA08A] via-[#94B8A4] to-[#B1CFBE] rounded-[2.5rem] p-8 lg:p-10 relative overflow-hidden shadow-[0_12px_45px_rgba(110,125,105,0.12)] text-zinc-950 flex flex-col xl:flex-row gap-8 justify-between items-stretch">
        {/* Soft decorative visual wave graphic overlays simulating high-end architecture design */}
        <div className="absolute inset-0 opacity-20 overflow-hidden z-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 0,150 C 300,100 400,300 700,200 C 900,150 1000,250 1000,250 L 1000,400 L 0,400 Z" fill="#3D523A" />
            <path d="M 0,220 C 200,180 500,280 800,210 C 950,180 1000,300 1000,300 L 1000,400 L 0,400 Z" fill="#2E3C2D" />
            <circle cx="800" cy="80" r="120" fill="#EBF1E9" opacity="0.3" />
          </svg>
        </div>

        {/* Banner Main Column */}
        <div className="flex-1 space-y-8 relative z-10 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#243B20] bg-[#D5E2D2]/90 border border-white/20 px-3.5 py-1.5 rounded-full inline-block mb-3.5 shadow-xs">
              Platform Headquarters
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-black text-[#1C2C1E] tracking-tight leading-none uppercase">
              USend Control Center
            </h1>
            <p className="text-[#364935] text-xs font-bold uppercase tracking-wider mt-2.5">
              Platform administration, national logistics mesh, ledger tracking and settlement audits.
            </p>
          </div>

          {/* Stats - floating on top of the wavy architecture gradient banner! */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white/95 backdrop-blur-md rounded-[2rem] p-5 flex flex-col justify-between shadow-xs border border-white/40 h-[125px] group hover:scale-[1.02] hover:bg-white transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#344633]/15 text-[#344633] flex items-center justify-center pointer-events-none">
                      {stat.icon}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#5D6B5A]">
                      {stat.label}
                    </span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-[#3a4a2c] bg-[#3a4a2c]/5' : 'text-red-600 bg-red-50'}`}>{stat.trend}</span>
                </div>
                
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-lg lg:text-xl font-black text-[#1C2C1E] tracking-tight">{stat.value}</h3>
                  <div className="w-7 h-7 rounded-full bg-white shadow-xs border border-zinc-100 flex items-center justify-center text-[#344633]">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner Right Column: Pastel Yellow Action Banner (floating) */}
        <div className="xl:w-[325px] bg-[#EFF2CD]/95 backdrop-blur-md rounded-[2.2rem] p-7 flex flex-col justify-between shadow-md border border-[#E1E7B9] relative z-10 overflow-hidden min-h-[220px]">
          <div>
            <h3 className="text-base font-black text-[#384318] tracking-tight uppercase">
              Admin Actions
            </h3>
            <p className="text-[#5B6D2D] text-[11px] font-semibold mt-1.5 leading-relaxed">
              Expedite network operations, audit ledger logs, or register new merchants.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <button 
              onClick={() => onTabChange('merchants')}
              className="w-full h-11 bg-white hover:bg-zinc-50 text-[#384318] border border-[#CBD7C9] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Building2 className="w-4 h-4 text-[#384318]" />
              + New Merchant
            </button>
            <button 
              onClick={() => onTabChange('finance')}
              className="w-full h-11 bg-[#384318] hover:bg-[#252D10] text-[#EFF2CD] font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Coins className="w-4 h-4" />
              + Settlement Hub
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-[#EBEFE9] rounded-[2.5rem] p-10 overflow-hidden relative shadow-[0_8px_30px_rgb(220,225,235,0.45)]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-display font-semibold uppercase tracking-tight text-slate-900 mb-2">{t('financial_overview') || 'Financial Overview'}</h3>
              <p className="text-xs text-zinc-400 font-medium">{t('revenue_settlements') || 'Revenue vs Settlements (Weekly)'}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#546a40]"></div>
                 <span className="text-[12px] font-bold uppercase tracking-widest text-[#546a40]">{t('revenue') || 'Revenue'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-350"></div>
                 <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">{t('settlements') || 'Settlements'}</span>
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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

        <div 
          onClick={() => onTabChange('requests')}
          className="bg-white border border-[#EBEFE9] rounded-[2.5rem] p-10 relative overflow-hidden shadow-[0_8px_30px_rgb(220,225,235,0.45)] flex flex-col cursor-pointer group/card hover:shadow-xl transition-all"
        >
          <div className="mb-8">
             <h3 className="text-xl font-display font-semibold uppercase tracking-tight text-slate-900 mb-2 group-hover/card:text-[#546a40] transition-colors">{t('uae_ops_map')}</h3>
             <p className="text-xs text-zinc-400 font-medium">{t('live_origin')}</p>
          </div>
          <div className="flex-1 min-h-[250px] bg-zinc-900 rounded-[2rem] relative overflow-hidden group z-0">
             <MapContainer center={[24.2, 54.5]} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%', backgroundColor: '#18181b' }} zoomControl={false} dragging={true}>
               <TileLayer
                 url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
               />
               <Marker position={[25.2048, 55.2708]} icon={createCustomMarker('bg-[#546a40]', '#546a40', '0s')} />
               <Marker position={[24.4539, 54.3773]} icon={createCustomMarker('bg-[#6d8c55]', '#34d399', '0.5s')} />
               <Marker position={[25.3463, 55.4209]} icon={createCustomMarker('bg-[#546a40]', '#546a40', '1s')} />
               <Marker position={[25.7895, 55.9432]} icon={createCustomMarker('bg-orange-400', '#fb923c', '1.5s')} />
             </MapContainer>
             <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none z-10"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8 pointer-events-none">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-[#546a40] rounded-full"></div>
               <span className="text-xs font-bold text-zinc-600">{t('merchant_api')}</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-[#6d8c55] rounded-full"></div>
               <span className="text-xs font-bold text-zinc-600">{t('mobile_apps')}</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
               <span className="text-xs font-bold text-zinc-600">{t('b2b_integrations')}</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
               <span className="text-xs font-bold text-zinc-600">{t('manual_entry')}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useApp } from '../../context/AppContext';

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
  const { activeRequests, updateRequestStatus, addRequest } = useApp();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('All Requests');
  const [channelFilter, setChannelFilter] = useState('All Channels');
  const [carrierFilter, setCarrierFilter] = useState('All Carriers');
  const [expressSearch, setExpressSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
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
    const isExceptionFilter = statusFilter === 'Exceptions';
    const matchesStatus = statusFilter === 'All Requests' || (isExceptionFilter ? (req.status === 'Rejected' || req.status === 'Exceptions') : req.status === statusFilter);
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
      case 'Reviewing': return 'text-indigo-600 bg-indigo-50';
      case 'Approved': return 'text-[#3a4a2c] bg-[#3a4a2c]/5';
      case 'Rejected': return 'text-red-600 bg-red-50';
      case 'assigning': return 'text-[#3a4a2c] bg-[#3a4a2c]/5';
      case 'En-route':
      case 'in_transit': return 'text-purple-600 bg-purple-50';
      case 'delivered': return 'text-[#3a4a2c] bg-[#3a4a2c]/10';
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

  // Handle active status stepper changes manually in admin console (Simulated IoT loops)
  const handleSimulateDispatch = (req: any) => {
    if (req.status === 'Approved') {
      if (!assigningDriverId) {
        triggerToast("Please select a courier before assigning");
        return;
      }
      updateRequestStatus(req.id, 'assigning');
      setSelectedRequest(prev => prev ? { ...prev, status: 'assigning' } : null);
      triggerToast(`Courier assigned successfully to order ${req.id}!`);
    } else if (req.status === 'assigning') {
      updateRequestStatus(req.id, 'in_transit');
      setSelectedRequest(prev => prev ? { ...prev, status: 'in_transit' } : null);
      triggerToast(`Carrier dispatched! Order ${req.id} is now in_transit.`);
    } else if (req.status === 'in_transit') {
      updateRequestStatus(req.id, 'delivered');
      setSelectedRequest(null);
      triggerToast(`Order ${req.id} marked as fully delivered!`);
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

      {/* Business Line Channel Tab Swapper */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-4 p-1.5 bg-zinc-200/50 border border-zinc-200 rounded-[2rem] max-w-lg shadow-sm">
          <button 
            onClick={() => setBusinessLine('express')}
            className={`flex-1 text-center py-3 px-6 rounded-full text-[12px] font-black uppercase tracking-wider transition-all leading-none ${
              businessLine === 'express' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Express & Courier Shipments
          </button>
          <button 
            onClick={() => setBusinessLine('freight')}
            className={`flex-1 text-center py-3 px-6 rounded-full text-[12px] font-black uppercase tracking-wider transition-all leading-none ${
              businessLine === 'freight' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Commercial Freight Cargo
          </button>
        </div>

        {businessLine === 'express' && (
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="px-6 py-3 bg-brand text-white text-[12px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-xl shadow-brand/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Book Delivery
          </button>
        )}
      </div>

      {businessLine === 'freight' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
           {/* Freight KPI Summary widgets */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
                 <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{t('active_containers') || 'Active Containers'}</span>
                 <p className="text-2xl font-bold text-zinc-900">4 Runs</p>
                 <span className="text-[12px] text-zinc-400 mt-2 block">{t('heavy_pipelines') || 'Heavy logistics pipelines active'}</span>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
                 <span className="text-[13px] font-black uppercase tracking-widest text-[#4f95cc] block mb-1">{t('total_payload_weight') || 'Total Payload Weight'}</span>
                 <p className="text-2xl font-bold text-[#4f95cc]">49,000 kg</p>
                 <span className="text-[12px] text-zinc-400 mt-2 block">Across marine & road fleets</span>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
                 <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1">{t('active_pallet_count') || 'Active Pallet Count'}</span>
                 <p className="text-2xl font-bold text-zinc-900">62 Pallets</p>
                 <span className="text-[12px] text-zinc-400 mt-2 block">{t('standard_block_size') || 'Standard block packing size'}</span>
              </div>
              <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
                 <span className="text-[13px] font-black uppercase tracking-widest text-[#3a4a2c] block mb-1">{t('freight_turnovers') || 'Freight Turnovers'}</span>
                 <p className="text-2xl font-bold text-[#3a4a2c]">17,600 AED</p>
                 <span className="text-[12px] text-[#3a4a2c] mt-2 block">{t('gross_billings') || 'Gross commercial billings'}</span>
              </div>
           </div>

           {/* Freight Orders Table */}
           <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm animate-in fade-in">
              <div className="mb-8">
                 <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900">{t('heavy_freight_center') || 'Heavy Freight Operations Center'}</h3>
                 <p className="text-xs text-zinc-500 font-medium">Coordinate, inspect, and approve heavy freight movements and port clearances across the UAE.</p>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                       <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                          <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('shipment_id') || 'Shipment ID'}</th>
                          <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('booked_by') || 'Booked By'}</th>
                          <th className={`p-6 font-mono ${isRTL ? 'text-right' : 'text-left'}`}>{t('cargo_spec_category') || 'Freight Class / Specs'}</th>
                          <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('delivery_path') || 'Delivery Path'}</th>
                          <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('gross_quote') || 'Gross Quote'}</th>
                          <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('transit_status') || 'Transit Status'}</th>
                          <th className="p-6 text-center">{t('clearance_action') || 'Clearance Action'}</th>
                       </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                       {freightList.map((item, idx) => (
                          <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                             <td className="p-6 font-mono text-zinc-900 font-bold text-xs">{item.id}</td>
                             <td className="p-6 font-bold text-zinc-800">{item.merchant}</td>
                             <td className="p-6">
                                <span className="text-zinc-800 block text-xs font-bold font-mono">{item.containerType}</span>
                                <span className="text-[12px] text-zinc-400 mt-0.5 block">{item.pallets} Pallets ({item.weight})</span>
                             </td>
                             <td className="p-6 text-zinc-650 text-xs">{item.route}</td>
                             <td className="p-6 text-brand font-bold">{item.charge}</td>
                             <td className="p-6">
                                <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest ${
                                   item.status.includes('Awaiting') ? 'bg-orange-50 text-orange-600' :
                                   item.status.includes('Inspected') ? 'bg-indigo-50 text-indigo-600' :
                                   item.status.includes('Delivered') ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' :
                                   'bg-purple-50 text-purple-600'
                                }`}>
                                   {item.status}
                                </span>
                             </td>
                             <td className="p-6 text-center">
                                {item.status === 'Awaiting Port Clearance' ? (
                                   <button 
                                      onClick={() => updateFreightStatus(item.id, 'Customs Inspected')}
                                      className="text-[13px] bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest px-3.5 py-2 rounded-xl transition-all"
                                   >
                                      Authorize Port Release
                                   </button>
                                ) : item.status === 'Customs Inspected' ? (
                                   <button 
                                      onClick={() => updateFreightStatus(item.id, 'En-Route Ground Carrier')}
                                      className="text-[13px] bg-brand hover:bg-brand/90 text-white font-black uppercase tracking-widest px-3.5 py-2 rounded-xl transition-all shadow-md shadow-brand/10"
                                   >
                                      Dispatch Heavy Hauler
                                   </button>
                                ) : item.status === 'En-Route Ground Carrier' ? (
                                   <button 
                                      onClick={() => updateFreightStatus(item.id, 'Delivered & Remitted')}
                                      className="text-[13px] bg-[#4d623b] hover:bg-[#3a4a2c] text-white font-black uppercase tracking-widest px-3.5 py-2 rounded-xl transition-all"
                                   >
                                      Confirm Deliver Signoff
                                   </button>
                                ) : (
                                   <span className="text-zinc-400 font-bold text-xs">✓ Cleared</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      ) : (
        <>
        {/* Universal Filter UX */}
        <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-5 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-1.5 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-none">
              <button onClick={() => setStatusFilter('All Requests')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 transition-colors ${statusFilter === 'All Requests' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>All</button>
              <button onClick={() => setStatusFilter('Pending')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'Pending' ? 'bg-orange-50 text-orange-655 ring-1 ring-orange-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>Pending</button>
              <button onClick={() => setStatusFilter('Exceptions')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'Exceptions' ? 'bg-red-50 text-red-650 ring-1 ring-red-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{t('exceptions') || 'Exceptions'}</button>
              <button onClick={() => setStatusFilter('Reviewing')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'Reviewing' ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>Reviewing</button>
              <button onClick={() => setStatusFilter('Approved')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'Approved' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c] ring-1 ring-blue-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-[#6d8c55]"></div>Approved</button>
              <button onClick={() => setStatusFilter('assigning')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'assigning' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c] ring-1 ring-blue-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-[#3a4a2c]"></div>Assigning</button>
              <button onClick={() => setStatusFilter('in_transit')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'in_transit' ? 'bg-purple-50 text-purple-600 ring-1 ring-purple-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>In Transit</button>
              <button onClick={() => setStatusFilter('delivered')} className={`px-4 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${statusFilter === 'delivered' ? 'bg-[#3a4a2c]/5 text-blue-705 ring-1 ring-green-200' : 'text-zinc-500 hover:bg-zinc-100'}`}><div className="w-1.5 h-1.5 rounded-full bg-[#3a4a2c] animate-pulse"></div>Delivered</button>
          </div>
          
          <div className="flex flex-col xl:flex-row flex-wrap gap-2 w-full xl:w-auto items-center xl:justify-end mt-2 xl:mt-0">
               <div className="flex gap-2 w-full md:w-auto">
                 <input 
                    type="date" 
                    value={dateRange.start} 
                    onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))}
                    className="bg-zinc-50 border border-zinc-200 rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 outline-none w-full md:w-auto"
                 />
                 <span className="text-zinc-400 self-center">-</span>
                 <input 
                    type="date" 
                    value={dateRange.end} 
                    onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))}
                    className="bg-zinc-50 border border-zinc-200 rounded-full px-3 py-2 text-xs font-semibold text-zinc-600 outline-none w-full md:w-auto"
                 />
               </div>
               
               <select
                 value={sortOrder}
                 onChange={(e) => setSortOrder(e.target.value as any)}
                 className="bg-zinc-50 flex-1 md:flex-none border border-zinc-200 rounded-full px-4 py-2 text-xs font-bold text-zinc-650 outline-none cursor-pointer hover:bg-zinc-100 transition-colors w-full md:w-auto"
               >
                 <option value="newest">Newest First</option>
                 <option value="oldest">Oldest First</option>
               </select>

               <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
                 <div className="relative w-full md:w-64">
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                   <input 
                     type="text" 
                     placeholder="Search express..."
                     value={expressSearch}
                     onChange={(e) => setExpressSearch(e.target.value)}
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-full py-2 pl-9 pr-4 text-xs font-semibold text-zinc-700 placeholder-zinc-400 outline-none focus:border-brand transition-all"
                   />
                 </div>

                 <select 
                   value={carrierFilter} 
                   onChange={(e) => setCarrierFilter(e.target.value)} 
                   className="bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-xs font-bold text-zinc-650 outline-none cursor-pointer hover:bg-zinc-100 transition-colors w-full md:w-auto"
                 >
                   <option value="All Carriers">{t('all_carriers') || 'All Carriers'}</option>
                   <option value="aramex">Aramex</option>
                   <option value="dhl_express">DHL Express</option>
                   <option value="usend">USend Fleet</option>
                 </select>

                 <select 
                   value={channelFilter} 
                   onChange={(e) => setChannelFilter(e.target.value)} 
                   className="bg-zinc-50 border border-zinc-200 rounded-full px-4 py-2 text-xs font-bold text-zinc-650 outline-none cursor-pointer hover:bg-zinc-100 transition-colors w-full md:w-auto"
                 >
                   <option>All Channels</option>
                   <option>Merchant Portal</option>
                   <option>Mobile App</option>
                   <option>User Portal</option>
                 </select>
               </div>
          </div>
        </div>

      {/* UAE Requests Map (Full Area) */}
      <div className="rounded-[3rem] overflow-hidden relative shadow-sm h-[400px] border border-zinc-200/80 z-0 bg-zinc-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.1)] animate-in fade-in">
         <div className="absolute inset-0">
            <MapContainer center={[25.0, 55.0]} zoom={8} scrollWheelZoom={false} style={{ height: '100%', width: '100%', backgroundColor: '#e4e4e7' }} zoomControl={false}>
               <TileLayer
                 url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
               />
               {filteredRequests.map(req => (
                 <Marker 
                   key={req.id} 
                   position={req.position || [25.0, 55.0]} 
                   icon={createInteractiveMarker(
                     req.status === 'Pending' ? 'bg-orange-400' : req.status === 'Approved' ? 'bg-[#6d8c55]' : req.status === 'Rejected' ? 'bg-red-500' : req.status === 'assigning' ? 'bg-[#6d8c55]' : 'bg-brand',
                     req.status === 'Pending' ? '#fb923c' : req.status === 'Approved' ? '#34d399' : req.status === 'Rejected' ? '#ef4444' : req.status === 'assigning' ? '#60a5fa' : '#3a4a2c',
                     req.id
                   )}
                   eventHandlers={{ click: () => setSelectedRequest(req) }}
                 />
               ))}
            </MapContainer>
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
                          <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mt-0.5">{req.channel}</span>
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
                          <span className={`px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest ${getStatusColor(req.status)}`}>
                             {req.status}
                          </span>
                        </td>
                        <td className="p-6" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                              {req.status === 'Pending' && (
                                <>
                                  <button onClick={() => { updateRequestStatus(req.id, 'Approved'); triggerToast(`Order ${req.id} set to Approved!`); }} className="w-8 h-8 rounded-full bg-[#3a4a2c]/5 text-[#3a4a2c] flex items-center justify-center hover:bg-[#3a4a2c]/10 transition-colors" title="Approve">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => { updateRequestStatus(req.id, 'Rejected'); triggerToast(`Order ${req.id} rejected.`); }} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {req.status === 'Approved' && (
                                <button onClick={() => setSelectedRequest(req)} className="bg-[#4d623b] hover:bg-[#3a4a2c] text-white font-black text-[13px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                                  Assign Driver
                                </button>
                              )}

                              {req.status === 'assigning' && (
                                <button onClick={() => { updateRequestStatus(req.id, 'in_transit'); triggerToast(`Dispatched driver for ${req.id}`); }} className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[13px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
                                  Pickup Dispatch
                                </button>
                              )}

                              {req.status === 'in_transit' && (
                                <button onClick={() => { updateRequestStatus(req.id, 'delivered'); triggerToast(`Order ${req.id} deliver success!`); }} className="bg-[#4d623b] hover:bg-[#3a4a2c] text-white font-black text-[13px] uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">
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
      </>
      )}

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
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Merchant Booking</label>
                <input 
                  type="text" 
                  value={newOrder.merchantName} 
                  onChange={e => setNewOrder({...newOrder, merchantName: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Cargo Spec Category</label>
                <input 
                  type="text" 
                  value={newOrder.itemType} 
                  onChange={e => setNewOrder({...newOrder, itemType: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Transit Channel</label>
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
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Amount Quote (AED)</label>
                <input 
                  type="text" 
                  value={newOrder.orderAmount} 
                  onChange={e => setNewOrder({...newOrder, orderAmount: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div>
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Destination State Node</label>
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
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Dispatch Origin</label>
                <input 
                  type="text" 
                  value={newOrder.fromDest} 
                  onChange={e => setNewOrder({...newOrder, fromDest: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-850 font-semibold outline-none" required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1.5">Instruction Specifications</label>
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

      {/* Slide-out Panel */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
          <motion.div 
            initial={{ x: isRTL ? '-100%' : '100%' }} animate={{ x: 0 }} exit={{ x: isRTL ? '-100%' : '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col"
          >
             <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-display font-medium uppercase tracking-tight">{t('request_details') || 'Request Details'}</h2>
                   <p className="text-zinc-500 text-xs font-bold">{selectedRequest.id}</p>
                 </div>
                 <button onClick={() => setSelectedRequest(null)} className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100">
                   <XCircle className="w-5 h-5" />
                 </button>
             </div>
             
             <div className="p-8 flex-1 overflow-y-auto space-y-8">
               <div>
                  <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t('applicant_info') || 'Applicant Info'} ({selectedRequest.applicantType})</p>
                  <p className="text-lg font-bold text-zinc-900">{selectedRequest.name}</p>
                  <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {selectedRequest.address}</p>
               </div>

               {/* STEPPER STATUS TRACKING PROCESSOR */}
               <div className="bg-zinc-50 border border-zinc-150 rounded-3xl p-5 space-y-4">
                 <p className="text-[13px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">State Transition Stepper</p>
                 <div className="flex justify-between items-center text-xs font-bold text-zinc-550">
                    <span className={selectedRequest.status === 'Pending' ? 'text-orange-600 font-extrabold' : 'text-zinc-400'}>1. Pending</span>
                    <span className="text-zinc-300">➔</span>
                    <span className={selectedRequest.status === 'Approved' ? 'text-[#3a4a2c] font-extrabold' : 'text-zinc-400'}>2. Approved</span>
                    <span className="text-zinc-300">➔</span>
                    <span className={selectedRequest.status === 'assigning' ? 'text-[#3a4a2c] font-extrabold' : 'text-zinc-400'}>3. Assigning</span>
                    <span className="text-zinc-300">➔</span>
                    <span className={(selectedRequest.status === 'in_transit' || selectedRequest.status === 'delivered') ? 'text-purple-600 font-extrabold' : 'text-zinc-400'}>4. Dispatched</span>
                 </div>

                 {/* LIVE CONTROLLER BAR */}
                 {(selectedRequest.status === 'Approved' || selectedRequest.status === 'assigning' || selectedRequest.status === 'in_transit') && (
                   <div className="border-t border-zinc-200 pt-4 space-y-4">
                     {selectedRequest.status === 'Approved' && (
                       <div className="space-y-2">
                         <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block">Select Available Courier</label>
                         <div className="flex gap-2">
                           <select 
                             value={assigningDriverId} 
                             onChange={e => setAssigningDriverId(e.target.value)}
                             className="flex-1 bg-white border border-zinc-250 rounded-xl p-2.5 text-xs font-semibold text-zinc-805 outline-none"
                           >
                             <option value="">-- Choose Courier --</option>
                             <option value="USR-001">Ahmad Yasin (4.8 ★, Near Jebel Ali)</option>
                             <option value="USR-003">Mohammed Ali (4.5 ★, Near Al Barsha)</option>
                             <option value="USR-009">Noora Al Mansoori (4.9 ★, Near SZR)</option>
                           </select>
                           <button 
                             type="button" 
                             onClick={() => handleSimulateDispatch(selectedRequest)}
                             className="px-4 py-2.5 bg-[#4d623b] text-white font-black text-[13px] uppercase tracking-widest rounded-xl hover:bg-[#3a4a2c] hover:scale-102 transition-all shadow-md shadow-[#3a4a2c]/10"
                           >
                             Assign
                           </button>
                         </div>
                       </div>
                     )}

                     {selectedRequest.status === 'assigning' && (
                       <div className="space-y-2">
                         <p className="text-[12px] text-zinc-500 font-medium">Courier is ready at dispatch terminal. Authorize vehicle exit to set order in_transit.</p>
                         <button 
                           type="button" 
                           onClick={() => handleSimulateDispatch(selectedRequest)}
                           className="w-full py-3 bg-purple-600 text-white font-black text-[13px] uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-colors"
                         >
                           Authorize Dispatched Vehicle Exit
                         </button>
                       </div>
                     )}

                     {selectedRequest.status === 'in_transit' && (
                       <div className="space-y-2">
                         <p className="text-[12px] text-zinc-500 font-medium">Vehicle is moving. Click below to signoff on proof of physical handoff.</p>
                         <button 
                           type="button" 
                           onClick={() => handleSimulateDispatch(selectedRequest)}
                           className="w-full py-3 bg-[#4d623b] text-white font-black text-[13px] uppercase tracking-widest rounded-xl hover:bg-[#3a4a2c] transition-colors"
                         >
                           Confirm Physical Delivery Signature
                         </button>
                       </div>
                     )}
                   </div>
                 )}
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('item_type') || 'Item Type'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.itemType}</p>
                 </div>
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('order_amount') || 'Order Amount'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.orderAmount}</p>
                 </div>
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('payment_method') || 'Payment Method'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.paymentMethod}</p>
                 </div>
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('eta') || 'ETA'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.etaTime}</p>
                 </div>
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('channel') || 'Channel'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.channel}</p>
                 </div>
                 <div className="bg-zinc-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-1">{t('date') || 'Date'}</p>
                   <p className="text-sm font-bold text-zinc-900">{selectedRequest.date}</p>
                 </div>
               </div>

               <div>
                 <div className="flex items-center justify-between mb-2">
                   <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400">{t('description') || 'Description'}</p>
                   {selectedRequest.amountType && (
                     <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[12px] uppercase font-bold tracking-widest">{selectedRequest.amountType}</span>
                   )}
                 </div>
                 <p className="text-sm text-zinc-700 bg-zinc-50 p-4 rounded-2xl leading-relaxed">{selectedRequest.description}</p>
               </div>

               {selectedRequest.photoUrl && (
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t('item_photo') || 'Item Photo'}</p>
                    <div className="h-40 w-full rounded-2xl overflow-hidden border border-zinc-200">
                      <img src={selectedRequest.photoUrl} alt="Item" className="w-full h-full object-cover" />
                    </div>
                  </div>
               )}

               {selectedRequest.carrier === 'aramex' && (
                 <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 overflow-hidden">
                    <p className="text-[12px] font-black uppercase tracking-widest text-[#d12421] mb-3 flex items-center gap-2">
                       <Truck className="w-3.5 h-3.5" />
                       Aramex Integration
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                       <div>
                         <span className="text-[13px] uppercase tracking-widest text-zinc-400 font-bold">Tracking Number</span>
                         <p className="text-sm font-black font-mono text-zinc-900">{selectedRequest.externalTrackingNumber || 'N/A'}</p>
                       </div>
                       <div>
                         <span className="text-[13px] uppercase tracking-widest text-zinc-400 font-bold">Pickup Status</span>
                         <p className="text-sm font-black font-mono text-zinc-900">{selectedRequest.aramexLogs?.pickupId || 'Not Booked'}</p>
                       </div>
                    </div>
                    {selectedRequest.aramexLogs?.response?.Notifications?.length > 0 && (
                      <div className="bg-[#d12421]/10 text-[#d12421] p-2 rounded-xl mb-3">
                        <span className="text-[13px] font-black uppercase tracking-widest block mb-1">API Error</span>
                        <p className="text-xs font-bold">{selectedRequest.aramexLogs.response.Notifications[0].Message}</p>
                      </div>
                    )}
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#3a4a2c]/5 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-[#3a4a2c]/70 mb-1">{t('from') || 'From Destination'}</p>
                   <p className="text-sm font-bold text-[#3a4a2c] leading-snug">{selectedRequest.fromDestination}</p>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-2xl">
                   <p className="text-[12px] font-black uppercase tracking-widest text-orange-600/70 mb-1">{t('to') || 'To Destination'}</p>
                   <p className="text-sm font-bold text-orange-900 leading-snug">{selectedRequest.toDestination}</p>
                 </div>
               </div>
               
               <div>
                 <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">{t('location_map') || 'Location on Map'}</p>
                 <div className="h-[200px] w-full rounded-2xl overflow-hidden relative border border-zinc-200 z-0">
                    <MapContainer key={selectedRequest.id} center={selectedRequest.position} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%', backgroundColor: '#f4f4f5' }} zoomControl={false} dragging={false}>
                       <TileLayer
                         url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                       />
                       <Marker
                         position={selectedRequest.position}
                         icon={L.divIcon({
                           className: 'custom-interactive-marker',
                           html: `<div class="relative"><div class="w-4 h-4 bg-brand rounded-full border-2 border-white shadow-[0_0_15px_#3a4a2c] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div><div class="w-4 h-4 bg-brand rounded-full border-2 border-white shadow-[0_0_15px_#3a4a2c] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div></div>`,
                           iconSize: [16, 16],
                           iconAnchor: [8, 8]
                         })}
                       />
                    </MapContainer>
                 </div>
               </div>
             </div>

             <div className="p-8 border-t border-zinc-100 bg-zinc-50 grid grid-cols-2 gap-4">
               <button onClick={() => { updateRequestStatus(selectedRequest.id, 'Rejected'); setSelectedRequest(null); }} className="py-4 rounded-2xl text-red-600 bg-red-100 font-bold text-[12px] uppercase tracking-widest hover:bg-red-200 transition-colors">
                 {t('reject') || 'Reject'}
               </button>
               <button onClick={() => { updateRequestStatus(selectedRequest.id, 'Approved'); setSelectedRequest(null); }} className="py-4 rounded-2xl text-white bg-brand font-bold text-[12px] uppercase tracking-widest hover:bg-brand/90 shadow-xl shadow-brand/20 transition-all">
                 {t('approve') || 'Approve'}
               </button>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function UsersDirectory() {
  const { isRTL } = useLanguage();
  const { users, addUser } = useApp();

  const allExtendedUsers = users;

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', type: 'Customer', phone: '' });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Success toast preview
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.phone.trim()) return;
    addUser({
      name: newUser.name,
      type: newUser.type,
      phone: newUser.phone,
      status: 'Active',
      rating: 5.0,
      deliveries: 0,
    });
    setIsAddingUser(false);
    setNewUser({ name: '', type: 'Customer', phone: '' });
    triggerToast(`Added user ${newUser.name} successfully!`);
  };

  // Filtered list computed efficiently
  const filteredUsers = allExtendedUsers.filter(u => {
    const nameStr = (u.name || '').toLowerCase();
    const idStr = (u.id || '').toLowerCase();
    const phoneStr = (u.phone || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const sTerm = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(sTerm) || idStr.includes(sTerm) || phoneStr.includes(sTerm) || emailStr.includes(sTerm);
    const matchesRole = roleFilter === 'All' || u.type === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate pages
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Toast message helper */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-medium text-xs tracking-wider uppercase animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">Users Directory ({totalItems.toLocaleString()} Total)</h3>
          <p className="text-sm text-zinc-500">Search, monitor and configure all consumers & active dispatchers.</p>
        </div>
        <button onClick={() => setIsAddingUser(true)} className="px-6 py-3 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 self-start md:self-auto">Add User</button>
      </div>

      {/* Advanced Control Console Header */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, email, USR-ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold placeholder-zinc-400 text-zinc-800 outline-none focus:border-brand"
          />
        </div>

        <div>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="All">All Roles / Types</option>
            <option value="Customer">Class: Customer Only</option>
            <option value="Driver">Class: Driver Fleet Only</option>
          </select>
        </div>

        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
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
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="12">12 Items / Page</option>
            <option value="24">24 Items / Page</option>
            <option value="48">48 Items / Page</option>
          </select>
        </div>
      </div>

      {isAddingUser && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900">Add New User</h3>
              <button onClick={() => setIsAddingUser(false)} className="text-zinc-400 hover:text-zinc-650">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-brand" 
                  placeholder="e.g. Abdullah bin Zayed"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                <input 
                  type="text" 
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-brand" 
                  placeholder="+971 50 XXXXXXX"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select 
                  value={newUser.type}
                  onChange={(e) => setNewUser({...newUser, type: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none focus:border-brand appearance-none"
                >
                  <option value="Customer">Customer</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>

              <button 
                onClick={handleAddUser}
                className="w-full mt-4 py-4 rounded-xl bg-brand text-white font-bold text-[12px] uppercase tracking-widest hover:bg-brand/90 transition-colors shadow-lg shadow-brand/20"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {paginatedUsers.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-16 text-center">
          <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h4 className="text-lg font-bold text-zinc-800">No Users Found</h4>
          <p className="text-zinc-500 text-xs mt-1">Adjust your search query or role toggles and try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedUsers.map((user) => (
            <div 
              key={user.id} 
              className="bg-white border border-zinc-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Background design accents */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 rounded-full blur-2xl opacity-80 pointer-events-none group-hover:bg-brand/5 transition-all"></div>
              
              <div className="space-y-5">
                {/* Header profile section */}
                <div className="flex items-start justify-between min-h-[48px]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-12 h-12 rounded-2xl bg-brand/5 border border-zinc-100 flex items-center justify-center text-xs font-black text-brand tracking-widest leading-none shrink-0 uppercase shadow-inner">
                      {(user.name || 'Anonymous User').split(' ').slice(0, 2).map((n: string) => n.charAt(0)).join('')}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-base text-zinc-900 leading-tight group-hover:text-brand transition-colors truncate" title={user.name}>{user.name || 'Anonymous User'}</h4>
                      <p className="text-[12px] text-zinc-450 mt-0.5 truncate leading-none font-mono" title={user.email}>{user.email}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1 ${
                    user.status === 'Active' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-[#3a4a2c]' : 'bg-red-500'}`}></span>
                    {user.status || 'Active'}
                  </span>
                </div>

                {/* Bento statistics / metric displays */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">Rating</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-zinc-900 text-sm leading-none">
                        {((user.rating !== undefined && user.rating !== null) ? Number(user.rating) : 5.0).toFixed(1)}
                      </span>
                      <span className="text-amber-500 text-xs leading-none">★</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                    <span className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] block mb-0.5">Deliveries</span>
                    <span className="font-black text-zinc-900 text-sm leading-none">{user.deliveries ?? 0} orders</span>
                  </div>
                </div>

                {/* Contact Card Details */}
                <div className="space-y-1.5 text-xs text-zinc-500 border-t border-zinc-100 pt-4 font-medium">
                  <div className="flex justify-between items-center bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                    <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Class Type</span>
                    <span className="font-bold text-zinc-805 tracking-wide text-[12px] uppercase">{user.type || 'Customer'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-50/50 p-2.5 rounded-xl border border-zinc-100">
                    <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400">Contact Node</span>
                    <span className="font-mono text-[13px] font-bold text-zinc-800">{user.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => triggerToast(`Keys and roles rebuilt for Node ID: ${user.id}`)}
                  className="flex-1 py-3 border border-zinc-200 rounded-xl text-[13px] font-bold uppercase tracking-wider text-zinc-600 hover:border-brand hover:text-brand hover:bg-zinc-50 transition-all"
                >
                  Regen Keys
                </button>
                <button 
                  onClick={() => triggerToast(`Reset temporary credentials for ${user.name}`)}
                  className="flex-1 py-3 bg-zinc-900 rounded-xl text-[13px] font-bold uppercase tracking-wider text-white hover:bg-zinc-850 transition-all text-center"
                >
                  Credentials
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Bento Page Navigation controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-55 border border-zinc-200 p-5 rounded-[2rem] mt-8">
          <p className="text-xs font-bold text-zinc-500">
            Showing <span className="text-zinc-900 font-black">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span> to <span className="text-zinc-900 font-black">{Math.min(currentPage * pageSize, totalItems).toLocaleString()}</span> of <span className="text-brand font-black">{totalItems.toLocaleString()}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Back
            </button>
            
            {/* Quick numeric range selector */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const start = Math.max(1, currentPage - 1);
                const end = Math.min(totalPages, currentPage + 1);

                if (start > 1) {
                  pages.push(
                    <button key={1} onClick={() => setCurrentPage(1)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === 1 ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>1</button>
                  );
                  if (start > 2) pages.push(<span key="d1" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                }

                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-black ${currentPage === p ? 'bg-brand text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}>{p}</button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="d2" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === totalPages ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>{totalPages}</button>
                  );
                }
                return pages;
              })()}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CouriersDirectory() {
  const { isRTL, t } = useLanguage();
  const { users } = useApp();

  // Load and enhance real drivers
  const [courierList, setCourierList] = useState<any[]>([]);
  useEffect(() => {
    const list = users.filter(u => u.type === 'Driver' || u.role === 'driver');
    const enhanced = list.map((u, i) => {
      const idNum = parseInt(u.id.replace(/\D/g, '')) || i;
      const vehicleVal = idNum % 3 === 0 ? 'sedan' : idNum % 3 === 1 ? 'van' : 'motorcycle';
      const rawCODVal = Math.floor((idNum * 23.4) % 1250);
      const lat = 25.07 + ((idNum % 25) * 0.012) - 0.1;
      const lng = 55.15 + ((idNum % 20) * 0.015) - 0.1;
      const rate = 95.8 + ((idNum * 4) % 3.7);
      return {
        ...u,
        vehicle: vehicleVal,
        rawCOD: rawCODVal,
        position: [lat, lng] as [number, number],
        successRate: rate.toFixed(1),
        currentRoute: idNum % 2 === 0 ? 'Dubai Marina → Downtown' : 'Zayed Port → Al Reem Island',
        activeJobsCount: idNum % 4
      };
    });
    setCourierList(enhanced);
  }, [users]);

  const [selectedCourier, setSelectedCourier] = useState<any>(null);
  const [isAddingCourier, setIsAddingCourier] = useState(false);
  const [newCourier, setNewCourier] = useState({ name: '', phone: '', vehicle: 'motorcycle', email: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddCourier = () => {
    if (!newCourier.name.trim() || !newCourier.phone.trim()) return;
    const cid = `USR-DRV-${String(courierList.length + 1).padStart(3, '0')}`;
    const added = {
      id: cid,
      uid: cid,
      name: newCourier.name,
      type: 'Driver',
      role: 'driver',
      status: 'Active',
      rating: 5.0,
      deliveries: 0,
      phone: newCourier.phone,
      email: newCourier.email || `${newCourier.name.toLowerCase().replace(/\s+/g, '')}@usend.ae`,
      vehicle: newCourier.vehicle,
      rawCOD: 0,
      position: [25.074, 55.132] as [number, number],
      successRate: '100.0',
      currentRoute: 'Ready for dispatch',
      activeDeliveryId: null
    };
    setCourierList(prev => [added, ...prev]);
    setIsAddingCourier(false);
    setNewCourier({ name: '', phone: '', vehicle: 'motorcycle', email: '' });
    triggerToast(`Added Courier ${added.name} successfully!`);
  };

  const handleSettleCash = (cid: string) => {
    setCourierList(prev => prev.map(c => {
      if (c.id === cid) {
        return { ...c, rawCOD: 0 };
      }
      return c;
    }));
    if (selectedCourier && selectedCourier.id === cid) {
      setSelectedCourier((prev: any) => ({ ...prev, rawCOD: 0 }));
    }
    triggerToast(t('cash_settled_success') || 'COD Cash settled!');
  };

  const handleToggleStatus = (cid: string) => {
    setCourierList(prev => prev.map(c => {
      if (c.id === cid) {
        const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    if (selectedCourier && selectedCourier.id === cid) {
      setSelectedCourier((prev: any) => ({ ...prev, status: prev.status === 'Active' ? 'Inactive' : 'Active' }));
    }
    triggerToast(`Courier status updated!`);
  };

  const filteredCouriers = courierList.filter(c => {
    const sTerm = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(sTerm) || 
                          c.id.toLowerCase().includes(sTerm) || 
                          c.phone.toLowerCase().includes(sTerm) || 
                          c.email.toLowerCase().includes(sTerm);
    
    const matchesVehicle = vehicleFilter === 'All' || c.vehicle === vehicleFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const totalItems = filteredCouriers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedCouriers = filteredCouriers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, vehicleFilter, statusFilter, pageSize]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative text-left">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 font-medium text-xs tracking-wider uppercase animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand animate-ping"></span>
          {toastMessage}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">
            {t('couriers_directory') || 'Couriers & Fleet Directory'} ({totalItems.toLocaleString()})
          </h3>
          <p className="text-sm text-zinc-500">
            {t('couriers_desc') || 'Track, monitor, and configure active drivers, vehicle types, and COD cash on hand.'}
          </p>
        </div>
        <button onClick={() => setIsAddingCourier(true)} className="px-6 py-3 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 self-start md:self-auto">
          {t('add_courier') || 'Add Courier'}
        </button>
      </div>

      {/* Control Console */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-[2.5rem] p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search name, phone, courier ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold placeholder-zinc-400 text-zinc-800 outline-none focus:border-brand"
          />
        </div>

        <div>
          <select 
            value={vehicleFilter} 
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="All">{t('all_vehicles') || 'All Vehicles'}</option>
            <option value="motorcycle">{t('courier_motorcycle') || 'Motorcycle'}</option>
            <option value="van">{t('van') || 'Delivery Van'}</option>
            <option value="sedan">{t('sedan') || 'Sedan'}</option>
          </select>
        </div>

        <div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active / On Road</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div>
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-4 text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
          >
            <option value="12">12 Items / Page</option>
            <option value="24">24 Items / Page</option>
          </select>
        </div>
      </div>

      {/* Main Panel split mapping */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Paginated List */}
        <div className={`space-y-6 ${selectedCourier ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {paginatedCouriers.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-[2.5rem] p-16 text-center">
              <Truck className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-zinc-800">No Couriers Registered</h4>
              <p className="text-zinc-500 text-xs mt-1">Refine your active search criteria or add a new driver.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${selectedCourier ? 'sm:grid-cols-1 md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6`}>
              {paginatedCouriers.map((courier) => (
                <div 
                  key={courier.id}
                  onClick={() => setSelectedCourier(courier)}
                  className={`bg-white border cursor-pointer ${selectedCourier?.id === courier.id ? 'border-brand ring-2 ring-brand/10' : 'border-zinc-200'} rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group`}
                >
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 overflow-hidden relative border border-zinc-200">
                          <img src={`https://i.pravatar.cc/100?u=${courier.id}`} alt="Courier" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 group-hover:text-brand transition-colors">{courier.name}</h4>
                          <span className="text-[12px] font-mono font-extrabold text-zinc-400 block mt-0.5">{courier.id}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                        courier.status === 'Active' 
                          ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' 
                          : 'bg-zinc-100 text-zinc-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${courier.status === 'Active' ? 'bg-[#3a4a2c] animate-pulse' : 'bg-zinc-400'}`} />
                        {courier.status}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-2xl text-left">
                      <div>
                        <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Vehicle</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px] font-bold text-zinc-700 capitalize">
                            {courier.vehicle === 'motorcycle' ? '🏍️ Motorcycle' : courier.vehicle === 'van' ? '🚐 Cargo Van' : '🚗 Sedan'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">Rating</span>
                        <span className="text-[12px] font-bold text-zinc-700 flex items-center gap-1">
                          ⭐ {courier.rating}
                        </span>
                      </div>
                    </div>

                    {/* COD & Deliveries Section */}
                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[13px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">{t('total_completed_trips') || 'Deliveries'}</span>
                        <span className="text-xs font-black text-zinc-800">{courier.deliveries} trips</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] font-semibold text-[#3a4a2c] uppercase tracking-widest block mb-0.5">{t('cod_collected_cash') || 'COD Cash'}</span>
                        <span className="text-sm font-black text-zinc-950 font-mono">AED {courier.rawCOD.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside Card */}
                  <div className="mt-5 pt-4 border-t border-zinc-100 grid grid-cols-2 gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSettleCash(courier.id); }}
                      className="py-2 rounded-xl bg-zinc-100 text-zinc-750 font-bold text-[13px] uppercase tracking-widest hover:bg-[#3a4a2c]/10 hover:text-[#3a4a2c] transition"
                    >
                      {t('settle_cash') || 'Settle Cash'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(courier.id); }}
                      className={`py-2 rounded-xl font-bold text-[13px] uppercase tracking-widest transition ${
                        courier.status === 'Active' 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-brand/10 text-brand hover:bg-brand/20'
                      }`}
                    >
                      {courier.status === 'Active' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-zinc-200">
              <span className="text-xs font-semibold text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Courier Profile & Current Status */}
        {selectedCourier && (
          <div className="lg:col-span-4 bg-white border border-zinc-200 rounded-[2.5rem] p-6 shadow-xl space-y-6 animate-in slide-in-from-right-10 duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-100">
              <div>
                <h4 className="font-display font-medium uppercase text-zinc-900 tracking-tight">{t('availability_status') || 'Courier Details'}</h4>
                <p className="text-[12px] uppercase font-bold tracking-wider text-zinc-400">Secure Live Connection</p>
              </div>
              <button 
                onClick={() => setSelectedCourier(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-205 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Highlight */}
            <div className="flex items-center gap-4 text-left">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 overflow-hidden relative border border-zinc-200">
                <img src={`https://i.pravatar.cc/150?u=${selectedCourier.id}`} alt="Courier" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">{selectedCourier.name}</h3>
                <p className="text-xs text-zinc-500 font-medium">{selectedCourier.phone}</p>
                <p className="text-[12px] text-zinc-400 font-semibold">{selectedCourier.email}</p>
              </div>
            </div>

            {/* Quick telemetry indicators */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-zinc-50 p-4 rounded-2xl">
                <span className="text-[13px] font-black uppercase text-zinc-400 block tracking-widest mb-1">Success Rate</span>
                <span className="text-base font-black text-zinc-900">{selectedCourier.successRate}%</span>
              </div>
              <div className="bg-zinc-50 p-4 rounded-2xl">
                <span className="text-[13px] font-black uppercase text-zinc-400 block tracking-widest mb-1">Ongoing Route</span>
                <span className="text-xs font-bold text-zinc-805 line-clamp-1">{selectedCourier.currentRoute || 'Standby'}</span>
              </div>
            </div>

            {/* COD Cash Settle Card */}
            {selectedCourier.rawCOD > 0 && (
              <div className="bg-amber-50 border border-amber-200/50 p-4 font-sans rounded-2xl flex items-center justify-between text-left">
                <div>
                  <span className="text-[13px] font-bold text-amber-800 uppercase block">Pending Settlement</span>
                  <span className="text-lg font-black text-amber-950 font-mono">AED {selectedCourier.rawCOD.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => handleSettleCash(selectedCourier.id)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[13px] uppercase tracking-widest rounded-xl transition"
                >
                  {t('settle_cash') || 'Settle'}
                </button>
              </div>
            )}

            {/* Live Leaflet Map */}
            <div className="space-y-2 text-left">
              <span className="text-[13px] font-black uppercase text-zinc-400 block tracking-widest">{t('tracking_map') || 'Live Courier Map'}</span>
              <div className="h-[240px] w-full rounded-2xl overflow-hidden relative border border-zinc-200 z-0">
                <MapContainer key={selectedCourier.id} center={selectedCourier.position} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%', backgroundColor: '#f4f4f5' }} zoomControl={false} dragging={true}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={selectedCourier.position} icon={createCustomMarker('bg-brand', '#3a4a2c')} />
                </MapContainer>
              </div>
              <span className="text-[12px] text-zinc-400 flex items-center gap-1.5 mt-2 justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                Live GSM GPS Signals: Lat {selectedCourier.position[0].toFixed(4)}, Lng {selectedCourier.position[1].toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Courier Modal */}
      {isAddingCourier && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-zinc-150 pb-4">
              <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900">{t('add_courier') || 'Add Courier'}</h3>
              <button onClick={() => setIsAddingCourier(false)} className="text-zinc-400 hover:text-zinc-650">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Courier Full Name</label>
                <input 
                  type="text" 
                  value={newCourier.name}
                  onChange={(e) => setNewCourier({...newCourier, name: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-xs font-semibold focus:border-brand" 
                  placeholder="e.g. Saeed Al Remeithi"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Active Phone Number</label>
                <input 
                  type="text" 
                  value={newCourier.phone}
                  onChange={(e) => setNewCourier({...newCourier, phone: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-xs font-semibold focus:border-brand" 
                  placeholder="+971 50 123 4567"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Internal Email Address</label>
                <input 
                  type="email" 
                  value={newCourier.email}
                  onChange={(e) => setNewCourier({...newCourier, email: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-xs font-semibold focus:border-brand" 
                  placeholder="name@usend.ae"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">{t('vehicle_type') || 'Vehicle Type'}</label>
                <select 
                  value={newCourier.vehicle}
                  onChange={(e) => setNewCourier({...newCourier, vehicle: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 outline-none text-xs font-semibold focus:border-brand"
                >
                  <option value="motorcycle">🏍️ Motorcycle</option>
                  <option value="van">🚐 Cargo Van</option>
                  <option value="sedan">🚗 Sedan</option>
                </select>
              </div>

              <button 
                onClick={handleAddCourier}
                className="w-full mt-2 py-4 rounded-xl bg-brand text-white font-bold text-[12px] uppercase tracking-widest hover:bg-brand/90 transition shadow-lg shadow-brand/25"
              >
                Register into Fleet
              </button>
            </div>
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
  const [simulatedToken, setSimulatedToken] = useState('');
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenApiKeys = (m: any) => {
    setSelectedApiKeyMerchant(m);
    // Generate a stable simulated token
    setSimulatedToken(`us_live_` + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
  };

  const handleRotateToken = () => {
    setSimulatedToken(`us_live_` + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''));
    triggerToast(`API key successfully rotated for ${selectedApiKeyMerchant.name}!`);
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

  // Reset page if filters change
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">Merchant Directory ({totalItems.toLocaleString()} Total)</h3>
          <p className="text-sm text-zinc-500">Manage active businesses, secure API endpoints, and monitor order volume.</p>
        </div>
        <button 
          onClick={() => triggerToast("Add Merchant form loaded into workspace.")} 
          className="px-6 py-3 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 self-start md:self-auto"
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
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold placeholder-zinc-400 text-zinc-800 outline-none focus:border-brand"
          />
        </div>

        <div>
          <select 
            value={sectorFilter} 
            onChange={(e) => setSectorFilter(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-xs font-semibold text-zinc-750 outline-none cursor-pointer"
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
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-xs font-semibold text-zinc-750 outline-none cursor-pointer"
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
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3 px-3 text-xs font-semibold text-zinc-750 outline-none cursor-pointer"
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
                        <p className="text-xs font-semibold text-zinc-500 truncate">{merchant.sector}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1.5 ${merchant.status === 'Verified' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' : 'bg-orange-50 text-orange-600'}`}>
                    {merchant.status === 'Verified' ? <div className="w-1.5 h-1.5 rounded-full bg-[#3a4a2c]"></div> : <div className="w-1.5 h-1.5 rounded-full bg-orange-55 animate-pulse"></div>}
                    {merchant.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Interface</p>
                    <p className="font-bold text-zinc-800 text-[13px] truncate">{merchant.integration}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100">
                    <p className="text-[12px] font-black uppercase tracking-widest text-[#4f95cc] mb-0.5">Total Runs</p>
                    <p className="font-black text-brand text-[13px]">{merchant.orders.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-100 overflow-hidden">
                    <p className="text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Contact Root</p>
                    <p className="font-medium text-zinc-700 text-[12px] truncate" title={merchant.contact}>{merchant.contact.split('@')[0]}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleOpenApiKeys(merchant)}
                  className="flex-1 py-3.5 rounded-xl border border-zinc-200 text-zinc-650 font-bold text-[13px] uppercase tracking-widest hover:border-brand hover:text-brand bg-white hover:bg-zinc-50 transition-all shadow-sm"
                >
                  Manage API Keys
                </button>
                <button 
                  onClick={() => setSelectedProfileMerchant(merchant)}
                  className="flex-1 py-3.5 rounded-xl bg-zinc-900 text-white font-bold text-[13px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm text-center"
                >
                  Company Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination component footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-55 border border-zinc-200 p-5 rounded-[2rem] mt-8">
          <p className="text-xs font-bold text-zinc-500">
            Showing <span className="text-zinc-900 font-black">{((currentPage - 1) * pageSize + 1).toLocaleString()}</span> to <span className="text-zinc-900 font-black">{Math.min(currentPage * pageSize, totalItems).toLocaleString()}</span> of <span className="text-brand font-black">{totalItems.toLocaleString()}</span> entries
          </p>

          <div className="flex items-center gap-1.5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
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
                    <button key={1} onClick={() => setCurrentPage(1)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === 1 ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>1</button>
                  );
                  if (start > 2) pages.push(<span key="dm1" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                }

                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg text-xs font-black ${currentPage === p ? 'bg-brand text-white shadow-md' : 'hover:bg-zinc-100 text-zinc-600'}`}>{p}</button>
                  );
                }

                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push(<span key="dm2" className="text-zinc-400 px-1 text-xs font-bold">...</span>);
                  pages.push(
                    <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className={`w-8 h-8 rounded-lg text-xs font-bold ${currentPage === totalPages ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-150 text-zinc-600'}`}>{totalPages}</button>
                  );
                }
                return pages;
              })()}
            </div>

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
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
              <button onClick={() => setSelectedApiKeyMerchant(null)} className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-105 flex items-center justify-center text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-50 p-4.5 rounded-2xl border border-zinc-150 space-y-2">
                <label className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block">Live Production Token</label>
                <div className="flex items-center gap-2 select-all bg-white p-3 rounded-lg border border-zinc-200 font-mono text-xs font-bold text-zinc-800 break-all">
                  <Code2 className="w-4 h-4 text-brand shrink-0" />
                  {simulatedToken}
                </div>
              </div>

              <div className="p-4.5 rounded-2xl bg-[#3a4a2c]/5/50 border border-[#3a4a2c]/10 space-y-2">
                <div className="flex items-center gap-2 text-[#3a4a2c] text-xs font-black uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Credentials Health: Optimal
                </div>
                <p className="text-[13px] font-medium leading-relaxed text-zinc-600">This secret client signature provides end-point authorization for heavy bulk freight quotes and live dispatch coordinates mapping.</p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={handleRotateToken}
                className="flex-1 py-4 bg-brand text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/90 hover:scale-102 transition-all shadow-lg shadow-brand/20"
              >
                Rotate Token Signature
              </button>
              <button 
                onClick={() => setSelectedApiKeyMerchant(null)}
                className="px-6 py-4 bg-zinc-100 text-zinc-750 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-150 transition-colors"
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
                <button onClick={() => setSelectedProfileMerchant(null)} className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-105 flex items-center justify-center text-zinc-400">
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
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={successData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3a4a2c" stopOpacity={0.12}/>
                            <stop offset="95%" stopColor="#3a4a2c" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E7" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} />
                        <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A1A1AA', fontWeight: 700 }} />
                        <Tooltip
                          formatter={(value: any) => [`${value}%`, 'Success Rate']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px -3px rgba(0, 0, 0, 0.08)', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="rate" stroke="#3a4a2c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
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
                  className="flex-1 py-4 bg-zinc-900 text-white text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
                >
                  Modify SLA Contract
                </button>
                <button 
                  onClick={() => setSelectedProfileMerchant(null)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 text-[12px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-150 transition-colors text-center"
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
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState(settings || {
    merchantCommission: 2.5,
    driverPlatformFee: 15,
    baseDeliveryFee: 12,
    perKmRate: 2.5
  });

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm">
         <div className="mb-12">
            <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900 mb-2">Platform Fees & Pricing</h3>
            <p className="text-xs text-zinc-500 font-medium">Configure platform commission rates and delivery fees setup.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="space-y-6">
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">Merchant Commission (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.merchantCommission}
                      onChange={(e) => setLocalSettings({...localSettings, merchantCommission: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">Driver Platform Fee (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.driverPlatformFee}
                      onChange={(e) => setLocalSettings({...localSettings, driverPlatformFee: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">Base Delivery Fee (AED)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.baseDeliveryFee}
                      onChange={(e) => setLocalSettings({...localSettings, baseDeliveryFee: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-black uppercase tracking-widest text-zinc-400 mb-3">Per KM Rate (AED)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                      type="number" 
                      value={localSettings.perKmRate}
                      onChange={(e) => setLocalSettings({...localSettings, perKmRate: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-brand font-medium text-zinc-900" 
                    />
                  </div>
                </div>
            </div>
         </div>

         <div className="mt-12 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-10 py-5 rounded-full bg-brand text-white font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20 cursor-pointer"
            >
               Save Configurations
            </button>
         </div>
      </div>
    </div>
  );
}

function AdminIntegrations() {
  const { courierConfigs, updateCourierConfigs } = useApp();
  const [selectedCourierId, setSelectedCourierId] = useState<'aramex' | 'noon' | 'dhl' | 'fedex'>('aramex');
  const [localConfigs, setLocalConfigs] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (courierConfigs) {
      setLocalConfigs(courierConfigs);
    }
  }, [courierConfigs]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  if (!localConfigs) {
    return (
      <div className="flex items-center justify-center p-20 bg-white border border-zinc-200 rounded-[3rem] shadow-sm animate-pulse">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentConfig = localConfigs[selectedCourierId] || {
    id: selectedCourierId,
    name: selectedCourierId.toUpperCase(),
    status: 'Inactive',
    currentMode: 'sandbox',
    sandboxCreds: { username: '', accountNumber: '', accountPin: '', accountEntity: '', accountCountryCode: 'AE', source: '' },
    productionCreds: { username: '', accountNumber: '', accountPin: '', accountEntity: '', accountCountryCode: 'AE', source: '' },
    rates: {
      guest: { baseFee: 0, perKmRate: 0, perKgRate: 0, expressSurcharge: 0, codFee: 0 },
      user: { baseFee: 0, perKmRate: 0, perKgRate: 0, expressSurcharge: 0, codFee: 0 },
      merchant: { baseFee: 0, perKmRate: 0, perKgRate: 0, expressSurcharge: 0, codFee: 0 }
    }
  };

  const handleCredChange = (mode: 'sandbox' | 'production', field: string, value: string) => {
    setLocalConfigs((prev: any) => {
      const targetMode = mode === 'sandbox' ? 'sandboxCreds' : 'productionCreds';
      return {
        ...prev,
        [selectedCourierId]: {
          ...prev[selectedCourierId],
          [targetMode]: {
            ...prev[selectedCourierId][targetMode],
            [field]: value
          }
        }
      };
    });
  };

  const handleRateChange = (userType: 'guest' | 'user' | 'merchant', field: string, value: number) => {
    setLocalConfigs((prev: any) => {
      return {
        ...prev,
        [selectedCourierId]: {
          ...prev[selectedCourierId],
          rates: {
            ...prev[selectedCourierId].rates,
            [userType]: {
              ...prev[selectedCourierId].rates[userType],
              [field]: value
            }
          }
        }
      };
    });
  };

  const handleToggleStatus = () => {
    setLocalConfigs((prev: any) => ({
      ...prev,
      [selectedCourierId]: {
        ...prev[selectedCourierId],
        status: prev[selectedCourierId].status === 'Active' ? 'Inactive' : 'Active'
      }
    }));
  };

  const handleToggleMode = (mode: 'sandbox' | 'production') => {
    setLocalConfigs((prev: any) => ({
      ...prev,
      [selectedCourierId]: {
        ...prev[selectedCourierId],
        currentMode: mode
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCourierConfigs(localConfigs);
      triggerToast(`Saved ${currentConfig.name} configuration successfully!`);
    } catch (err: any) {
      triggerToast(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCreds = currentConfig.currentMode === 'sandbox' ? currentConfig.sandboxCreds : currentConfig.productionCreds;

  const courierLogos: Record<string, string> = {
    aramex: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=100&auto=format&fit=crop',
    noon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100&auto=format&fit=crop',
    dhl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=100&auto=format&fit=crop',
    fedex: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=100&auto=format&fit=crop'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-zinc-800 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
          <span className="text-xs font-bold uppercase tracking-wider">{toastMsg}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-bl-[100px] -z-10 pointer-events-none"></div>

        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-display font-medium uppercase tracking-tight text-zinc-900 mb-2">Courier Integration Gateway</h3>
            <p className="text-sm text-zinc-500 font-medium max-w-2xl">Toggle active environment APIs, verify credentials, and customize rate tables based on applicant user profiles.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer min-w-[200px]"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Check className="w-4 h-4" /> Save Integration Settings
              </>
            )}
          </button>
        </div>

        {/* Courier Select Tabs */}
        <div className="flex flex-wrap gap-4 mb-10 border-b border-zinc-100 pb-8">
          {(Object.keys(localConfigs) as Array<'aramex' | 'noon' | 'dhl' | 'fedex'>).map((id) => {
            const cfg = localConfigs[id];
            const isSelected = selectedCourierId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedCourierId(id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/20 text-orange-950 shadow-sm'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-600'
                }`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                  <img src={courierLogos[id]} alt={cfg.name} className="w-full h-full object-cover grayscale opacity-80" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs uppercase tracking-widest text-zinc-800">{cfg.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.status === 'Active' ? 'bg-[#3a4a2c]' : 'bg-zinc-400'}`}></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{cfg.status}</span>
                    <span className="text-[10px] text-zinc-300">•</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{cfg.currentMode}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* General & Mode Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-zinc-200 rounded-[2rem] p-6 bg-zinc-50/50 space-y-6">
              <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-widest pb-4 border-b border-zinc-200/60">Gateway Status</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-800">Integration Active</p>
                  <p className="text-[11px] text-zinc-400 font-medium">Activate/deactivate this courier channel globally.</p>
                </div>
                <button
                  onClick={handleToggleStatus}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    currentConfig.status === 'Active' ? 'bg-[#3a4a2c]' : 'bg-zinc-300'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                    currentConfig.status === 'Active' ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-800">API Environment</p>
                <div className="grid grid-cols-2 gap-2 bg-zinc-200/60 p-1 rounded-xl">
                  <button
                    onClick={() => handleToggleMode('sandbox')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      currentConfig.currentMode === 'sandbox'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    onClick={() => handleToggleMode('production')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                      currentConfig.currentMode === 'production'
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    Production
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-orange-50/30 border border-orange-100 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center gap-2 text-orange-600">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Sandbox Mock Log</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                When set to <span className="font-bold text-zinc-900">Sandbox</span>, rate calls and airway bill generation dispatch into simulated carrier endpoints. Noon RoD integration is mapped to standard staging structures.
              </p>
            </div>
          </div>

          {/* Credentials Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-zinc-200 rounded-[2rem] p-8 bg-white space-y-6">
              <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-widest pb-4 border-b border-zinc-200/60 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-500" /> API Connection Parameters ({currentConfig.currentMode.toUpperCase()})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">API Username</label>
                  <input
                    type="text"
                    value={activeCreds.username || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'username', e.target.value)}
                    placeholder="Enter API username/email"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">API Password / Secret</label>
                  <input
                    type="password"
                    value={activeCreds.password || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'password', e.target.value)}
                    placeholder="••••••••••••••"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Account Number / client ID</label>
                  <input
                    type="text"
                    value={activeCreds.accountNumber || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'accountNumber', e.target.value)}
                    placeholder="e.g. 45796"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Account Pin / Entity Pin</label>
                  <input
                    type="text"
                    value={activeCreds.accountPin || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'accountPin', e.target.value)}
                    placeholder="e.g. 116216"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Account Entity / Node Code</label>
                  <input
                    type="text"
                    value={activeCreds.accountEntity || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'accountEntity', e.target.value)}
                    placeholder="e.g. DXB"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">Source ID / Channel Ref</label>
                  <input
                    type="text"
                    value={activeCreds.source || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'source', e.target.value)}
                    placeholder="e.g. 24"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pl-1">API Key / Secret Token (Optional)</label>
                  <input
                    type="text"
                    value={activeCreds.apiKey || ''}
                    onChange={(e) => handleCredChange(currentConfig.currentMode, 'apiKey', e.target.value)}
                    placeholder="Enter integration private API key"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Rate Setting Section */}
        <div className="mt-12 border-t border-zinc-100 pt-12">
          <div className="mb-8">
            <h4 className="font-bold text-zinc-900 text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-orange-500" /> Tiered Delivery Rates Matrix
            </h4>
            <p className="text-xs text-zinc-500">Specify exactly the shipping rates to be billed. Charges adapt programmatically when orders are booked by guest accounts, logged-in portal users, or corporate merchants.</p>
          </div>

          <div className="overflow-x-auto border border-zinc-200 rounded-3xl">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest border-b border-zinc-200">
                  <th className="p-5 w-1/3">Price Component Detail</th>
                  <th className="p-5 text-center">Guest Checkout (AED)</th>
                  <th className="p-5 text-center">Standard Portal User (AED)</th>
                  <th className="p-5 text-center">Premium Corporate Merchant (AED)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700">
                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="p-5">
                    <p className="font-bold text-zinc-800">Base Delivery Fee</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Standard baseline collection fee for deliveries.</p>
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.guest.baseFee}
                      onChange={(e) => handleRateChange('guest', 'baseFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.user.baseFee}
                      onChange={(e) => handleRateChange('user', 'baseFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.merchant.baseFee}
                      onChange={(e) => handleRateChange('merchant', 'baseFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                </tr>

                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="p-5">
                    <p className="font-bold text-zinc-800">Per KG Excess Surcharge</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Charged per additional kilogram exceeding standard threshold.</p>
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.guest.perKgRate}
                      onChange={(e) => handleRateChange('guest', 'perKgRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.user.perKgRate}
                      onChange={(e) => handleRateChange('user', 'perKgRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.merchant.perKgRate}
                      onChange={(e) => handleRateChange('merchant', 'perKgRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                </tr>

                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="p-5">
                    <p className="font-bold text-zinc-800">Per KM Distance Surcharge</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Extra transit cost computed per kilometer of route distance.</p>
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.guest.perKmRate}
                      onChange={(e) => handleRateChange('guest', 'perKmRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.user.perKmRate}
                      onChange={(e) => handleRateChange('user', 'perKmRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.merchant.perKmRate}
                      onChange={(e) => handleRateChange('merchant', 'perKmRate', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                </tr>

                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50">
                  <td className="p-5">
                    <p className="font-bold text-zinc-800">Urgent Express Premium</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Additional speed premium applied for priority on-demand runs.</p>
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.guest.expressSurcharge}
                      onChange={(e) => handleRateChange('guest', 'expressSurcharge', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.user.expressSurcharge}
                      onChange={(e) => handleRateChange('user', 'expressSurcharge', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.merchant.expressSurcharge}
                      onChange={(e) => handleRateChange('merchant', 'expressSurcharge', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                </tr>

                <tr className="hover:bg-zinc-50/50">
                  <td className="p-5">
                    <p className="font-bold text-zinc-800">Cash on Delivery (COD) Fee</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Extra collection / bank settlement processing handling fee.</p>
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.guest.codFee}
                      onChange={(e) => handleRateChange('guest', 'codFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.user.codFee}
                      onChange={(e) => handleRateChange('user', 'codFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                  <td className="p-5 text-center">
                    <input
                      type="number"
                      value={currentConfig.rates.merchant.codFee}
                      onChange={(e) => handleRateChange('merchant', 'codFee', parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-orange-500"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnifiedInventoryDesk() {
  const [inventoryCatalog, setInventoryCatalog] = useState([
    { sku: "SKU-IP15-PRO", name: "iPhone 15 Pro Max 256GB", merchant: "Noon E-commerce", stock: 12, site: "Jebel Ali Hub B", threshold: 25, status: "Critical Alert" },
    { sku: "SKU-IK-BILLY", name: "Billy Bookcase White 80x28x202", merchant: "IKEA UAE", stock: 140, site: "Al Quoz Node A", threshold: 30, status: "Healthy" },
    { sku: "SKU-SP-CHIA5", name: "Organic Chia Seeds 500g", merchant: "Spinneys Supermarket", stock: 3, site: "Dubai Marina Node C", threshold: 15, status: "Out Of Stock" },
    { sku: "SKU-AP-M3PRO", name: "Apple MacBook Pro 14' M3", merchant: "Noon E-commerce", stock: 8, site: "Jebel Ali Hub B", threshold: 10, status: "Critical Alert" },
    { sku: "SKU-IK-POANG", name: "Poäng Armchair Birch Veneer", merchant: "IKEA UAE", stock: 55, site: "Al Quoz Node A", threshold: 20, status: "Healthy" }
  ]);

  const [notif, setNotif] = useState("");

  const triggerReplenish = (sku: string) => {
    setInventoryCatalog(prev => prev.map(item => {
      if (item.sku === sku) {
        return { ...item, stock: item.stock + 50, status: "Healthy" };
      }
      return item;
    }));
    setNotif(`Automated stock replenishment order generated and dispatched for ${sku}! +50 units pending delivery.`);
    setTimeout(() => setNotif(""), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">UAE Unified Stock Catalog</h3>
          <p className="text-sm text-zinc-500">Cross-merchant fulfillment dashboard. Spot critical low stock alerts and transfer resources.</p>
        </div>
      </div>

      {notif && (
        <div className="bg-blue-55 bg-[#3a4a2c]/5 border border-[#3a4a2c]/20 text-blue-850 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3a4a2c] animate-ping"></div>
          {notif}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Total Monitored SKUs</span>
          <p className="text-2xl font-bold text-zinc-900">4,812 SKUs</p>
          <span className="text-[12px] text-zinc-400 mt-2 block">Across 14 merchant channels</span>
        </div>
        <div className="bg-red-50 border border-red-105 p-6 rounded-[2rem] shadow-sm col-span-1">
          <span className="text-[13px] font-black uppercase tracking-widest text-red-600 block mb-1">Low Stock Alerts</span>
          <p className="text-2xl font-bold text-red-700">12 Items</p>
          <span className="text-[12px] text-red-500 mt-2 block">Stock level fell below safety threshold</span>
        </div>
        <div className="bg-orange-50 border border-orange-105 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[13px] font-black uppercase tracking-widest text-orange-600 block mb-1">Pending Stock Transits</span>
          <p className="text-2xl font-bold text-orange-700">3 Fleet Runs</p>
          <span className="text-[12px] text-orange-500 mt-2 block">Moving to balance localized demands</span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                <th className="p-6">SKU Code</th>
                <th className="p-6">Product Details</th>
                <th className="p-6">Merchant Partner</th>
                <th className="p-6">Fulfillment Location</th>
                <th className="p-6">Level / Safety</th>
                <th className="p-6 text-center">Operational Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {inventoryCatalog.map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6 font-mono text-zinc-900 font-bold text-xs">{item.sku}</td>
                  <td className="p-6">
                    <span className="text-zinc-800 font-bold block">{item.name}</span>
                    <span className="text-[12px] text-zinc-400 mt-0.5 block">Threshold: {item.threshold} units</span>
                  </td>
                  <td className="p-6 text-zinc-650">{item.merchant}</td>
                  <td className="p-6 text-zinc-500 text-xs">{item.site}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-805">{item.stock}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest leading-none ${
                        item.status === 'Healthy' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' :
                        item.status === 'Critical Alert' ? 'bg-orange-50 text-orange-600 animate-pulse' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {(item.status !== "Healthy") ? (
                      <button 
                        onClick={() => triggerReplenish(item.sku)}
                        className="text-[12px] bg-brand text-white font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-brand/90 hover:scale-105 transition-all shadow-md shadow-brand/10"
                      >
                        Auto-Replenish
                      </button>
                    ) : (
                      <span className="text-[12px] font-bold text-[#3a4a2c] flex items-center justify-center gap-1">
                        ✓ Balanced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CSVBatchControlDesk() {
  const [batchRecords, setBatchRecords] = useState([
    { id: "BATCH-88220", merchant: "Noon E-commerce", fileName: "noon_dxb_deliveries_may22.csv", date: "May 22, 2026", ordersCount: 142, successRate: "99.3%", status: "Completed", manifestNum: "M-AE-9210-C" },
    { id: "BATCH-88219", merchant: "IKEA UAE", fileName: "ikea_heavy_freight_q2.csv", date: "May 21, 2026", ordersCount: 22, successRate: "100%", status: "Processing", manifestNum: "M-AE-1122-C" },
    { id: "BATCH-88218", merchant: "Spinneys Supermarket", fileName: "spinneys_express_transit.csv", date: "May 20, 2026", ordersCount: 88, successRate: "94.5%", status: "Flagged Errors", manifestNum: "M-AE-0531-A" },
    { id: "BATCH-88217", merchant: "Al Futtaim Logistics", fileName: "futtaim_bulk_dispatch.csv", date: "May 19, 2026", ordersCount: 310, successRate: "100%", status: "Completed", manifestNum: "M-AE-3942-B" }
  ]);

  const [notif, setNotif] = useState("");

  const triggerApproveManifest = (id: string) => {
    setBatchRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        return { ...rec, status: "Completed" };
      }
      return rec;
    }));
    setNotif(`CSV Batch ${id} cleared and synced! Waybills synchronized and sent to active driver portals.`);
    setTimeout(() => setNotif(""), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">CSV Batch Dispatches Control</h3>
          <p className="text-sm text-zinc-500">Audit bulk-uploaded dispatch manifests, correct validation errors, and clear logistics queues.</p>
        </div>
      </div>

      {notif && (
        <div className="bg-brand/5 border border-brand/20 text-brand p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-ping"></div>
          {notif}
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                <th className="p-6">Batch ID</th>
                <th className="p-6">Uploader</th>
                <th className="p-6 font-mono">Manifest File</th>
                <th className="p-6">Import Details</th>
                <th className="p-6">Validation Health</th>
                <th className="p-6 text-center">Manifest Num / Run</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {batchRecords.map((rec, idx) => (
                <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6 font-mono text-zinc-900 font-bold text-xs">{rec.id}</td>
                  <td className="p-6 font-bold text-zinc-800">{rec.merchant}</td>
                  <td className="p-6 text-zinc-500 font-mono text-xs max-w-[200px] truncate">{rec.fileName}</td>
                  <td className="p-6">
                    <span className="font-bold text-zinc-900 block">{rec.ordersCount} consignments</span>
                    <span className="text-[12px] text-zinc-400 mt-0.5 block">{rec.date}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-801">{rec.successRate}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[13px] font-black uppercase tracking-widest leading-none ${
                        rec.status === 'Completed' ? 'bg-[#3a4a2c]/5 text-[#3a4a2c]' :
                        rec.status === 'Processing' ? 'bg-indigo-50 text-indigo-650 animate-pulse' :
                        'bg-red-50 text-red-650'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    {rec.status === "Processing" ? (
                      <button 
                        onClick={() => triggerApproveManifest(rec.id)}
                        className="text-[12px] bg-brand text-white font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-brand/90 hover:scale-105 transition-all shadow-md shadow-brand/10"
                      >
                        Approve & Sync Dispatch
                      </button>
                    ) : rec.status === "Flagged Errors" ? (
                      <div className="flex items-center justify-center gap-2 font-mono">
                        <span className="text-[12px] text-red-500 font-bold">Address mismatch</span>
                        <button 
                          onClick={() => triggerApproveManifest(rec.id)}
                          className="text-[13px] bg-zinc-900 text-white font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-black"
                        >
                          Manual Force
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-500 font-mono text-xs">{rec.manifestNum}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WalletManagementDesk() {
  const { t, isRTL } = useLanguage();
  const [ledger, setLedger] = useState([
    { id: "TX-SET-4421", type: "Merchant Settlement", entity: "Noon E-commerce", cycle: "May 15 - May 22", grossAmount: "384,200 AED", feesDeducted: "9,605 AED", netRemittance: "374,595 AED", status: "Pending approval" },
    { id: "TX-SET-4420", type: "Courier Settlement", entity: "Aramex Express", cycle: "May 10 - May 17", grossAmount: "128,400 AED", feesDeducted: "0 AED", netRemittance: "128,400 AED", status: "Settled" },
    { id: "TX-REF-4419", type: "Refund", entity: "Customer (John Doe)", cycle: "N/A", grossAmount: "420 AED", feesDeducted: "0 AED", netRemittance: "420 AED", status: "Settled" },
    { id: "TX-SET-4418", type: "Merchant Settlement", entity: "IKEA UAE", cycle: "Global Monthly Q1", grossAmount: "691,000 AED", feesDeducted: "17,275 AED", netRemittance: "673,725 AED", status: "Under Review" }
  ]);

  const [notif, setNotif] = useState("");

  const triggerRemittance = (id: string) => {
    setLedger(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: "Settled" };
      }
      return item;
    }));
    setNotif(`WPS remittance and ledger transfer authorized successfully.`);
    setTimeout(() => setNotif(""), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">Platform Wallet & Global Ledger</h3>
          <p className="text-sm text-zinc-500">Manage digital wallets, deposits, withdrawals, transfers, refunds, COD and Delivery Company settlements.</p>
        </div>
      </div>

      {notif && (
        <div className="bg-[#3a4a2c]/5 border border-[#3a4a2c]/20 text-[#3a4a2c] p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#3a4a2c] rounded-full animate-ping"></div>
          {notif}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Total Wallets Balance</span>
          <p className="text-2xl font-bold text-zinc-900">4,245,600 AED</p>
          <span className="text-[12px] text-zinc-400 mt-2 block">Customer, Merchant & Driver Funds</span>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[13px] font-black uppercase tracking-widest text-[#4f95cc] block mb-1">Pending COD Settlements</span>
          <p className="text-2xl font-bold text-[#4f95cc]">951,140 AED</p>
          <span className="text-[12px] text-zinc-400 mt-2 block">To be remitted to Merchants</span>
        </div>
        <div className="bg-white border border-zinc-200 p-6 rounded-[2rem] shadow-sm">
          <span className="text-[13px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Courier Payouts Due</span>
          <p className="text-2xl font-bold text-zinc-900">162,280 AED</p>
          <span className="text-[12px] text-zinc-400 mt-2 block">Carrier allocations</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] shadow-sm col-span-1">
          <span className="text-[13px] font-black uppercase tracking-widest text-amber-700 block mb-1">Pending Refunds</span>
          <p className="text-2xl font-bold text-amber-800 font-sans">5,545 AED</p>
          <span className="text-[12px] text-amber-600 mt-2 block">Customer wallet credit reversals</span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                <th className="p-6">Statement Ref</th>
                <th className="p-6">Transaction Type</th>
                <th className="p-6">Beneficiary Entity</th>
                <th className="p-6">Billing Cycle</th>
                <th className="p-6 font-mono">Gross Amount</th>
                <th className="p-6 font-mono">Fees Deducted</th>
                <th className="p-6">Net Remit Amount</th>
                <th className="p-6 text-center">Remit Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {ledger.map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="p-6 font-mono text-zinc-900 font-bold text-xs">{item.id}</td>
                  <td className="p-6"><span className={`px-3 py-1 rounded-full text-[12px] font-bold ${item.type.includes('Refund') ? 'bg-amber-50 text-amber-700' : 'bg-[#3a4a2c]/5 text-[#3a4a2c]'}`}>{item.type}</span></td>
                  <td className="p-6 font-bold text-zinc-800">{item.entity}</td>
                  <td className="p-6 text-zinc-500 font-medium">{item.cycle}</td>
                  <td className="p-6 text-zinc-650 text-xs font-mono">{item.grossAmount}</td>
                  <td className="p-6 text-red-600 text-xs font-mono">{item.feesDeducted}</td>
                  <td className="p-6 text-[#3a4a2c] font-bold text-sm tracking-tight">{item.netRemittance}</td>
                  <td className="p-6 text-center">
                    {item.status === 'Pending approval' ? (
                      <button 
                        onClick={() => triggerRemittance(item.id)}
                        className="text-[12px] bg-[#4d623b] text-white font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-[#3a4a2c] hover:scale-105 transition-all shadow-md shadow-brand/10"
                      >
                        Authorize Payment
                      </button>
                    ) : item.status === 'Under Review' ? (
                      <div className="flex gap-2 items-center justify-center font-mono text-xs">
                        <span className="text-[12px] text-amber-600 uppercase font-black tracking-widest">Auditing...</span>
                        <button 
                          onClick={() => triggerRemittance(item.id)}
                          className="text-[13px] bg-zinc-900 text-white font-black uppercase px-3 py-1.5 rounded-lg hover:bg-black"
                        >
                          Overrule
                        </button>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-widest bg-[#3a4a2c]/5 text-[#3a4a2c] inline-block font-mono">
                        ✓ remitted settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-12 mb-4">
        <div>
          <h3 className="text-xl font-display font-medium text-zinc-900 mb-1 uppercase tracking-tight">{t('financial_reconciliation') || 'Courier Financial Reconciliation'}</h3>
          <p className="text-sm text-zinc-500">{t('financial_reconciliation_desc') || 'Compare estimated quotes vs. actual volumetric billing invoices from couriers to detect margin leaks.'}</p>
        </div>
      </div>
      
      <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 overflow-hidden relative shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
               <tr className="bg-zinc-50 text-zinc-400 text-[12px] font-black uppercase tracking-widest border-b border-zinc-100">
                 <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('tracking_awb') || 'Tracking / AWB'}</th>
                 <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('courier') || 'Courier'}</th>
                 <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('est_weight') || 'Est. Weight'}</th>
                 <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('actual_weight') || 'Actual Volumetric Weight'}</th>
                 <th className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('quoted_price') || 'Quoted Price'}</th>
                 <th className={`p-6 text-red-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('billed_invoice') || 'Billed Invoice'}</th>
                 <th className="p-6 text-center">{t('margin_leak') || 'Margin Leak'}</th>
               </tr>
             </thead>
             <tbody className="text-sm font-medium">
                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                   <td className="p-6 font-mono text-zinc-900 font-bold text-xs">3849102931</td>
                   <td className="p-6 font-bold text-zinc-800">Aramex</td>
                   <td className="p-6 text-zinc-500 text-xs">1.50 Kg</td>
                   <td className="p-6 font-bold text-amber-600 text-xs text-center">4.20 Kg</td>
                   <td className="p-6 text-zinc-500 font-mono text-xs">AED 16.50</td>
                   <td className="p-6 text-red-600 font-bold font-mono text-xs">AED 28.00</td>
                   <td className="p-6 text-center">
                     <span className="px-3 py-1 rounded bg-red-50 text-red-600 font-mono text-xs font-bold">-11.50 AED</span>
                   </td>
                </tr>
                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                   <td className="p-6 font-mono text-zinc-900 font-bold text-xs">3849102932</td>
                   <td className="p-6 font-bold text-zinc-800">Aramex</td>
                   <td className="p-6 text-zinc-500 text-xs">0.50 Kg</td>
                   <td className="p-6 font-bold text-zinc-800 text-xs text-center">0.50 Kg</td>
                   <td className="p-6 text-zinc-500 font-mono text-xs">AED 12.00</td>
                   <td className="p-6 text-zinc-800 font-bold font-mono text-xs">AED 12.00</td>
                   <td className="p-6 text-center">
                     <span className="px-3 py-1 text-blue-505 font-bold font-mono text-[13px] uppercase tracking-widest"><Check className="inline w-3 h-3 -mt-0.5" /> {t('matched') || 'Matched'}</span>
                   </td>
                </tr>
                <tr className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                   <td className="p-6 font-mono text-zinc-900 font-bold text-xs">7498124933</td>
                   <td className="p-6 font-bold text-zinc-800">DHL Express</td>
                   <td className="p-6 text-zinc-500 text-xs">3.00 Kg</td>
                   <td className="p-6 font-bold text-amber-600 text-xs text-center">3.80 Kg</td>
                   <td className="p-6 text-zinc-500 font-mono text-xs">AED 41.50</td>
                   <td className="p-6 text-red-600 font-bold font-mono text-xs">AED 52.00</td>
                   <td className="p-6 text-center">
                     <span className="px-3 py-1 rounded bg-red-50 text-red-600 font-mono text-xs font-bold">-10.50 AED</span>
                   </td>
                </tr>
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'inventory' | 'batches' | 'finance' | 'merchants' | 'users' | 'couriers' | 'integrations' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview onTabChange={setActiveTab} />;
      case 'requests': return <RequestsHub />;
      case 'inventory': return <UnifiedInventoryDesk />;
      case 'batches': return <CSVBatchControlDesk />;
      case 'finance': return <WalletManagementDesk />;
      case 'users': return <UsersDirectory />;
      case 'couriers': return <CouriersDirectory />;
      case 'merchants': return <MerchantDirectory />;
      case 'integrations': return <AdminIntegrations />;
      case 'settings': return <AdminSettings />;
      default: return <AdminOverview onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#EFF3EE] text-zinc-900 font-sans ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Style */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-[500px] h-[500px] bg-[#3a4a2c]/10/20 rounded-full blur-[120px] -translate-y-1/2`}></div>
      </div>

      <div className="flex relative z-10 w-full min-h-screen">
        {/* Modern Sidebar (Redesigned with the same exquisite light theme as the other portals) */}
        <aside className={`w-[290px] lg:w-[330px] h-screen sticky top-0 bg-[#EFF3EE]/95 text-zinc-800 border-${isRTL ? 'l' : 'r'} border-[#E2ECE0] p-6 flex flex-col shrink-0 shadow-sm overflow-hidden select-none`} dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Brand Logo Header */}
          <div className="p-4 pb-5 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing_page')}>
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <LogoIcon className="w-9 h-9" />
              </div>
              <div>
                <h1 className="text-[13px] font-black uppercase tracking-wider text-[#344633] leading-none">USend Portal</h1>
                <span className="text-[11px] text-[#6D7D6A] font-bold uppercase tracking-widest mt-1 block">Platform Admin</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto hide-scrollbar">
            {[
              { id: 'overview', icon: <LayoutDashboard className="w-[17px] h-[17px]" />, label: t('dashboard') || 'Dashboard' },
              { id: 'requests', icon: <Inbox className="w-[17px] h-[17px]" />, label: t('requests_freight') || 'Requests & Freight' },
              { id: 'inventory', icon: <Boxes className="w-[17px] h-[17px]" />, label: t('unified_stock_catalog') || 'Unified Stock Catalog' },
              { id: 'batches', icon: <ClipboardList className="w-[17px] h-[17px]" />, label: t('csv_batch_dispatches') || 'CSV Batch Dispatches' },
              { id: 'finance', icon: <Coins className="w-[17px] h-[17px]" />, label: t('ledger_cod_settling') || 'Platform Wallets & Ledger' },
              { id: 'merchants', icon: <Building2 className="w-[17px] h-[17px]" />, label: t('merchant_directory') || 'Merchant Directory' },
              { id: 'users', icon: <UserCircle2 className="w-[17px] h-[17px]" />, label: t('users_directory') || 'Users Directory' },
              { id: 'couriers', icon: <Truck className="w-[17px] h-[17px]" />, label: t('couriers_directory') || 'Couriers Directory' },
              { id: 'integrations', icon: <Code2 className="w-[17px] h-[17px]" />, label: t('apis_webhooks') || 'APIs & Webhooks' },
              { id: 'settings', icon: <Settings className="w-[17px] h-[17px]" />, label: t('settings') || 'Settings' },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all duration-200 group/btn relative ${isActive ? 'text-right' : ''} ${
                    isActive 
                      ? 'bg-[#D5E2D2] text-[#344633] font-bold shadow-sm' 
                      : 'text-[#5D6B5A] hover:text-[#344633] hover:bg-[#D5E2D2]/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`transition-transform duration-200 ${isActive ? 'text-[#344633] scale-105' : 'text-[#6D7D6A] group-hover/btn:text-[#344633] group-hover/btn:scale-105'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[12px] font-semibold leading-none truncate tracking-wide text-left">{item.label}</span>
                  </div>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#344633] shrink-0 shadow-xs" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-transparent group-hover/btn:bg-[#344633]/30 transition-colors shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="pt-4 space-y-1.5 bg-transparent p-4">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[#5D6B5A] hover:text-[#344633] hover:bg-[#D5E2D2]/40 text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <Globe className="w-4 h-4 text-[#6D7D6A] group-hover:text-[#344633]" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>
            <button
              onClick={() => onNavigate('landing_page')}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('sign_out') || 'Sign Out'}</span>
            </button>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-8 lg:p-12 overflow-y-auto hide-scrollbar overflow-x-hidden">
          {/* Top Bar */}
          <header className={`flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 ${isRTL ? 'text-right' : ''}`}>
            <div>
              <p className={`text-[#546a40] font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4" /> {t('uae_network_control') || 'UAE Network Control'}
              </p>
              <h1 className="text-3xl lg:text-4xl font-display font-semibold uppercase tracking-tight text-slate-900">
                {t('admin_dashboard_center') || 'Admin Dashboard Center'}
              </h1>
            </div>

            <div className={`flex items-center gap-5 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400`} />
                <input 
                   type="text" 
                   placeholder={t('query_records') || 'Query records...'}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className={`bg-white border border-[#EBEFE9] focus:border-[#546a40]/55 focus:bg-white outline-none rounded-full py-4 ${isRTL ? 'pr-14 pl-8' : 'pl-14 pr-8'} text-sm text-zinc-900 placeholder:text-zinc-300 w-[240px] lg:w-[320px] transition-all shadow-sm`}
                />
              </div>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="w-12 h-12 rounded-2xl bg-white border border-[#EBEFE9] flex items-center justify-center text-[#546a40] hover:border-[#546a40] transition-colors cursor-pointer group"
              >
                <div className="flex gap-1 items-center">
                   <span className="text-[12px] font-black uppercase tracking-widest">{language === 'en' ? 'AR' : 'EN'}</span>
                </div>
              </button>
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#EBEFE9] flex items-center justify-center text-zinc-450 hover:bg-zinc-50 transition-colors cursor-pointer relative group">
                  <Bell className="w-5 h-5 text-zinc-500" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#546a40] rounded-full shadow-[0_0_8px_#546a40]"></span>
                </div>
              </div>
              <div className={`flex items-center gap-4 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-zinc-200`}>
                <div className="w-12 h-12 rounded-full border-2 border-[#546a40] p-0.5">
                  <div className="w-full h-full rounded-full bg-zinc-200 overflow-hidden">
                    <img alt="User" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                  </div>
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

