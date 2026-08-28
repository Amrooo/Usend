import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { 
  Upload, 
  Plus, 
  Trash2, 
  Send, 
  AlertCircle, 
  Download, 
  Truck, 
  Anchor, 
  Compass, 
  Calculator, 
  Sparkles, 
  FileCheck, 
  Clock, 
  Plane, 
  Ship, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useState, useRef } from 'react';
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantBatchOrdersProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

interface OrderRow {
  id: number;
  customer: string;
  phone: string;
  address: string;
  amount: string;
  paymentType: string;
}

interface ValidationErrors {
  [key: number]: {
    customer?: string;
    address?: string;
    amount?: string;
    phone?: string;
  };
}

export default function MerchantBatchOrders({ onNavigate }: MerchantBatchOrdersProps) {
  const { t, isRTL } = useLanguage();
  const { addRequest, merchantActiveTab, setMerchantActiveTab } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tab 1: Standard Batch Rows
  const [orders, setOrders] = useState<OrderRow[]>([
    { id: 1, customer: '', phone: '+971 ', address: '', amount: '', paymentType: 'card' }
  ]);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmittingCSV, setIsSubmittingCSV] = useState(false);
  const [batchCarrier, setBatchCarrier] = useState<'noon' | 'aramex'>('noon');

  // Tab 2: Heavy Freight States
  const [freightData, setFreightData] = useState({
    shipperName: 'Al Futtaim Logistics',
    loadingPort: 'Jebel Ali Port Terminal 2',
    deliveryLocation: 'Al Maktoum International Airport (DWC)',
    cargoType: 'electronics_dangerous', // dry_cargo, reefers, electronics_dangerous
    containerSize: '40hc', // 20gp, 40gp, 40hc, ltl_pallet
    palletQty: '12',
    grossWeight: '8500', // in kg
    unNumber: 'UN 3480 (lithium-ion batteries)',
    carrierLine: 'Maersk Line',
    hazardCertNeeded: true
  });

  const [freightQuoteResponse, setFreightQuoteResponse] = useState<any | null>(null);
  const [isRequestingFreightQuote, setIsRequestingFreightQuote] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "Customer Name,Phone,Delivery Address,Order Amount,Payment Type (card/cash),Notes\nJohn Doe,+971500000000,Dubai Silicon Oasis,150.00,card,Leave at door";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", "usend_batch_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n');
      const newOrders: OrderRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [customerName, phone, address, amount, paymentType] = lines[i].split(',');
        
        // Handle CSV phone
        let parsedPhone = phone?.trim() || '';
        if (parsedPhone && !parsedPhone.startsWith('+')) {
           parsedPhone = '+971 ' + parsedPhone.replace(/^0?5/, '5').replace(/[^0-9]/g, '');
        } else if (parsedPhone && parsedPhone.startsWith('+971')) {
           parsedPhone = '+971 ' + parsedPhone.slice(4).replace(/[^0-9]/g, '');
        }
        if (!parsedPhone) parsedPhone = '+971 ';

        newOrders.push({
          id: Date.now() + i,
          customer: customerName?.trim() || '',
          phone: parsedPhone,
          address: address?.trim() || '',
          amount: amount?.trim() || '',
          paymentType: (paymentType?.trim().toLowerCase() === 'cash' ? 'cash' : 'card')
        });
      }
      if (newOrders.length > 0) {
        setOrders(prev => {
          const filteredPrev = prev.filter(o => o.customer || o.address || o.amount);
          return [...filteredPrev, ...newOrders];
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addOrderRow = () => {
    setOrders([...orders, { id: Date.now(), customer: '', phone: '+971 ', address: '', amount: '', paymentType: 'card' }]);
  };

  const removeOrderRow = (id: number) => {
    if (orders.length > 1) {
      setOrders(orders.filter(o => o.id !== id));
      const newErrors = { ...errors };
      delete newErrors[id];
      setErrors(newErrors);
    }
  };

  const updateOrder = (id: number, field: keyof OrderRow, value: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, [field]: value } : o));
    if (errors[id]?.[field as keyof ValidationErrors[number]]) {
      setErrors({
        ...errors,
        [id]: { ...errors[id], [field]: undefined }
      });
    }
  };

  const updatePhone = (id: number, val: string) => {
    if (!val.startsWith('+971 ')) {
       if (val.length < 5) val = '+971 ';
       else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
    } else {
       val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
    }
    if (val.length > 14) val = val.slice(0, 14);
    updateOrder(id, 'phone', val);
  };

  const validateOrders = () => {
    let isValid = true;
    const newErrors: ValidationErrors = {};

    orders.forEach(order => {
      const orderErrors: ValidationErrors[number] = {};
      
      if (!order.customer.trim()) {
        orderErrors.customer = t('required_field') || 'Required';
        isValid = false;
      }
      if (!order.phone || !/^\+971 \d{9}$/.test(order.phone)) {
        orderErrors.phone = "Invalid UAE phone (e.g. +971 50 XXXXXXX)";
        isValid = false;
      }
      if (!order.address.trim()) {
        orderErrors.address = t('required_field') || 'Required';
        isValid = false;
      }
      if (!order.amount.trim() || isNaN(Number(order.amount)) || Number(order.amount) <= 0) {
        orderErrors.amount = t('required_field') || 'Required';
        isValid = false;
      }

      if (Object.keys(orderErrors).length > 0) {
        newErrors[order.id] = orderErrors;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleDispatchCSV = () => {
    if (validateOrders()) {
      setIsSubmittingCSV(true);
      orders.forEach(order => {
        addRequest({
          id: `REQ-${Math.floor(1000 + Math.random() * 9000).toString()}`,
          name: order.customer,
          channel: 'Batch CSV Upload',
          date: new Date().toLocaleDateString(),
          status: 'Pending',
          position: [25.1 + Math.random() * 0.1, 55.2 + Math.random() * 0.1],
          address: order.address,
          itemType: 'Batch Package',
          description: `Dispatched matching CSV line with target order collect of AED ${order.amount}`,
          amountType: 'many items',
          paymentMethod: order.paymentType === 'card' ? 'Credit Card' : 'Cash on Delivery',
          orderAmount: `${order.amount} AED`,
          applicantType: 'Merchant',
          fromDestination: 'Central Warehouse Depot',
          toDestination: order.address,
          etaTime: 'Next Day SLA'
        });
      });

      setTimeout(() => {
        setIsSubmittingCSV(false);
        onNavigate('merchant_tracking');
      }, 1500);
    }
  };

  // Heavy Freight Calculator Logic
  const handleCalculateFreight = () => {
    setIsRequestingFreightQuote(true);
    setTimeout(() => {
      const mult = freightData.cargoType === 'electronics_dangerous' ? 1.4 : 1.0;
      const cntFee = freightData.containerSize === '40hc' ? 2400 : freightData.containerSize === '40gp' ? 1800 : freightData.containerSize === '20gp' ? 1200 : 750;
      const hazFee = freightData.hazardCertNeeded ? 250 : 0;
      const baseCost = (cntFee * mult) + hazFee;

      setFreightQuoteResponse({
        oceanFreight: Number((baseCost * 0.75).toFixed(2)),
        portDues: 350.00,
        customsClearance: 450.00,
        insurance: 120.00,
        grandTotal: Number((baseCost * 0.75 + 920).toFixed(2)),
        carrier: 'Maersk Liner Services',
        transitTime: '36 Hours (Combined Port-to-Land multimodal)',
        hazClass: freightData.cargoType === 'electronics_dangerous' ? 'Class 9 Dangerous Hazard' : 'General dry cargo status'
      });
      setIsRequestingFreightQuote(false);
    }, 1200);
  };

  const handleDispatchFreight = () => {
    if (!freightQuoteResponse) return;
    setDispatchStatus('dispatching');
    
    setTimeout(() => {
      addRequest({
        id: `FRG-${Math.floor(10000 + Math.random() * 90000).toString()}`,
        name: `${freightData.shipperName} (Freight Cargo)`,
        channel: 'Intermodal Freight',
        date: 'Today, Schedule Locked',
        status: 'Pending',
        position: [24.89, 55.08],
        address: freightData.deliveryLocation,
        itemType: `Heavy Freight [${freightData.containerSize.toUpperCase()}]`,
        description: `High-capacity Cargo shipment from ${freightData.loadingPort}. Weight locked: ${freightData.grossWeight} kg. Carrier: ${freightQuoteResponse.carrier}`,
        amountType: 'packages',
        paymentMethod: 'Invoiced Bill',
        orderAmount: `AED ${freightQuoteResponse.grandTotal}`,
        applicantType: 'Merchant',
        fromDestination: freightData.loadingPort,
        toDestination: freightData.deliveryLocation,
        etaTime: 'Locked: ' + freightQuoteResponse.transitTime
      });
      setDispatchStatus('completed');
      setTimeout(() => {
        onNavigate('merchant_tracking');
      }, 1000);
    }, 1500);
  };

  // Decide current active mode ('freight_orders', 'request_quote', or default batch)
  const isFreightMode = merchantActiveTab === 'freight_orders';
  const isFreightQuoteMode = merchantActiveTab === 'request_quote';

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_batch" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto">
        <motion.div
          key={merchantActiveTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-8"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
            <div>
              <span className="text-[#113f36] font-bold text-[12px] uppercase tracking-[0.4em] block">
                {isFreightMode || isFreightQuoteMode ? 'Container Freight & Port Services' : 'Enterprise Bulk Shipping'}
              </span>
              <h1 className="text-3xl font-display font-medium text-zinc-900 uppercase tracking-tight mt-1">
                {isFreightMode ? 'Heavy Cargo Bookings' : isFreightQuoteMode ? 'Freight Quote Desk' : 'Batch Dispatches (CSV)'}
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                {isFreightMode 
                  ? 'Manage containerized cargo (20GP, 40HC) and heavy logistical freight across major hubs.'
                  : isFreightQuoteMode 
                    ? 'Submit specifications for commercial freight to fetch instant ground courier or local multi-carrier carrier pricing.'
                    : 'Download our manifest spreadsheet template to import hundreds of individual delivery stops concurrently.'}
              </p>
            </div>

            {/* Selector tabs */}
            <div className="bg-zinc-200/50 p-1.5 rounded-2xl flex items-center gap-1 self-start sm:self-center">
              <button 
                onClick={() => setMerchantActiveTab('batch_orders')}
                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  !isFreightMode && !isFreightQuoteMode
                    ? 'bg-white text-zinc-950 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                CSV Upload
              </button>
            </div>
          </div>

          {/* RENDER COMPONENT ON THE BASIS OF SUB-TAB */}
          {!isFreightMode && !isFreightQuoteMode ? (
            /* CSV BATCH DISPATCH LAYOUT */
            <div className="space-y-6">
              {/* Top Template Bar */}
              <div className="bg-white rounded-[2rem] p-8 border border-zinc-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-zinc-800">Need the Standard spreadsheet structure?</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Use our predefined structured layout to guarantee error-free batch ingestion.</p>
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button 
                    onClick={handleDownloadTemplate}
                    className="flex-1 md:flex-none border border-zinc-200 hover:border-zinc-300 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider text-zinc-700 bg-white transition-all whitespace-nowrap"
                  >
                    Download Excel Template
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 md:flex-none bg-[#1a5c4e] hover:bg-[#113f36] text-white font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    Select File & Import
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* Rows layout */}
              <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-50/50">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 block">Review Batch Manifest lines</span>
                    <span className="text-[12px] font-bold text-zinc-500">Select courier integration channel for this batch</span>
                  </div>

                  <div className="flex items-center gap-2">
                     <div className="flex bg-zinc-200/60 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setBatchCarrier('noon')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${batchCarrier === 'noon' ? 'bg-amber-500 text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                          Noon RoD Staging
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchCarrier('aramex')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${batchCarrier === 'aramex' ? 'bg-[#d12421] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'}`}
                        >
                          Aramex Sandbox
                        </button>
                     </div>
                     <button 
                       onClick={addOrderRow}
                       className="flex items-center gap-1 bg-zinc-100/80 hover:bg-zinc-200 text-zinc-800 font-bold px-4 py-2 rounded-xl text-xs tracking-wider border border-zinc-200 cursor-pointer"
                     >
                       <Plus className="w-4 h-4" /> Add Row
                     </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 text-[12px] font-black uppercase tracking-widest">
                        <th className="p-4 pl-6">Customer</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4 w-1/3">Address Dropoff</th>
                        <th className="p-4">Amount (AED)</th>
                        <th className="p-4">COD Settlement</th>
                        <th className="p-4 text-center">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-50/20 group">
                          <td className="p-3 pl-6">
                            <input 
                              type="text" 
                              value={order.customer} 
                              onChange={(e) => updateOrder(order.id, 'customer', e.target.value)}
                              placeholder="Customer Name"
                              className={`w-full bg-transparent px-3 py-2 border rounded-lg text-xs outline-none ${
                                errors[order.id]?.customer ? 'border-red-500 bg-red-50/30' : 'border-zinc-200 focus:border-[#113f36]'
                              }`}
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="tel" 
                              value={order.phone} 
                              onChange={(e) => updatePhone(order.id, e.target.value)}
                              placeholder="+971 50 1234567"
                              className={`w-full bg-transparent px-3 py-2 border rounded-lg text-xs outline-none font-mono tracking-widest ${errors[order.id]?.phone ? 'border-red-500 bg-red-50/30' : 'border-zinc-200 focus:border-[#113f36]'}`}
                              dir="ltr"
                            />
                            {errors[order.id]?.phone && (
                              <p className="text-[10px] text-red-500 mt-1">{errors[order.id]?.phone}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={order.address} 
                              onChange={(e) => updateOrder(order.id, 'address', e.target.value)}
                              placeholder="Dubai Marina / Downtown Boulevard"
                              className={`w-full bg-transparent px-3 py-2 border rounded-lg text-xs outline-none ${
                                errors[order.id]?.address ? 'border-red-500 bg-red-50/30' : 'border-zinc-200 focus:border-[#113f36]'
                              }`}
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="number" 
                              value={order.amount} 
                              onChange={(e) => updateOrder(order.id, 'amount', e.target.value)}
                              placeholder="120.00"
                              className={`w-full bg-transparent px-3 py-2 border rounded-lg text-xs outline-none ${
                                errors[order.id]?.amount ? 'border-red-500 bg-red-50/30' : 'border-zinc-200 focus:border-[#113f36]'
                              }`}
                            />
                          </td>
                          <td className="p-3">
                            <select 
                              value={order.paymentType} 
                              onChange={(e) => updateOrder(order.id, 'paymentType', e.target.value)}
                              className="bg-transparent px-3 py-2 border border-zinc-200 rounded-lg text-xs outline-none focus:border-[#113f36] font-bold"
                            >
                              <option value="card">Prepaid (Card)</option>
                              <option value="cash">Cash collect (COD)</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <button 
                              onClick={() => removeOrderRow(order.id)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Confirm Dispatch Bar */}
                <div className="p-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-50/30">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>Total items lock in manifest: <b>{orders.length} items</b>. Platform fee applied instantly.</span>
                  </div>
                  <button
                    onClick={handleDispatchCSV}
                    disabled={isSubmittingCSV}
                    className="bg-[#1a5c4e] hover:bg-[#113f36] text-white font-bold h-12 px-8 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingCSV ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Confirm and Dispatch batch
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : isFreightMode ? (
            /* FREIGHT ORDERS SECTION */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200/85 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#113f36]/10 text-[#113f36] flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-zinc-900">Commercial Carrier Booking details</h2>
                      <span className="text-[15px] text-zinc-400">Ingest dimensions and coordinates for heavy containerized fleet dispatch</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Origin Port Terminal</label>
                      <input 
                        type="text" 
                        value={freightData.loadingPort}
                        onChange={(e) => setFreightData({...freightData, loadingPort: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-950 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Destination Warehouse/Airport</label>
                      <input 
                        type="text" 
                        value={freightData.deliveryLocation}
                        onChange={(e) => setFreightData({...freightData, deliveryLocation: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-950 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Container Size Class</label>
                      <select 
                        value={freightData.containerSize}
                        onChange={(e) => setFreightData({...freightData, containerSize: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-950 font-bold"
                      >
                        <option value="20gp">20ft General Purpose Standard (20GP)</option>
                        <option value="40gp">40ft General Purpose Standard (40GP)</option>
                        <option value="40hc">40ft High-Cube container (40HC)</option>
                        <option value="ltl_pallet">LTL Less-than-truckload (Pallet cargo)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Pallet Pallet Count</label>
                      <input 
                        type="number" 
                        value={freightData.palletQty}
                        onChange={(e) => setFreightData({...freightData, palletQty: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-950 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-black uppercase tracking-wider text-zinc-400">Gross Weight Lock (Kg)</label>
                      <input 
                        type="number" 
                        value={freightData.grossWeight}
                        onChange={(e) => setFreightData({...freightData, grossWeight: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-950 font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="haz" 
                        checked={freightData.hazardCertNeeded}
                        onChange={(e) => setFreightData({...freightData, hazardCertNeeded: e.target.checked})}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer animate-pulse"
                      />
                      <div>
                        <label htmlFor="haz" className="font-bold text-xs text-zinc-800 cursor-pointer block">Dangerous Goods Manifest & UN classification compliance</label>
                        <span className="text-[12px] text-zinc-400 block">Required for lithium batteries, chemicals, or materials presenting safety hazards during road transport.</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Carrier Quote Summary Side panel */}
              <div className="space-y-6">
                <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-6">
                      <Compass className="w-5 h-5 text-[#113f36]" />
                      <h2 className="font-bold text-base text-zinc-900">Intermodal Dispatch Desk</h2>
                    </div>

                    {!freightQuoteResponse ? (
                      <div className="text-center py-10 text-zinc-400 space-y-3">
                        <Calculator className="w-10 h-10 mx-auto text-zinc-300" />
                        <p className="text-xs">Estimate weight parameters and port inputs to check Maersk & DP World integrated slots.</p>
                        <button
                          onClick={handleCalculateFreight}
                          disabled={isRequestingFreightQuote}
                          className="w-full mt-4 py-3 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                        >
                          {isRequestingFreightQuote ? 'Querying liner...' : 'Query Carrier slots'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-5 bg-zinc-900 text-white rounded-3xl text-center">
                          <span className="text-[12px] text-zinc-400 font-extrabold uppercase tracking-widest block">Invoiced Liner Quote</span>
                          <span className="text-2xl font-mono font-black mt-1 block">AED {freightQuoteResponse.grandTotal}</span>
                        </div>

                        <div className="space-y-2.5 text-xs text-zinc-500 font-bold border-t border-zinc-100 pt-4">
                          <div className="flex justify-between">
                            <span>Port Freight handling</span>
                            <span className="text-zinc-900">AED {freightQuoteResponse.oceanFreight}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customs documentation</span>
                            <span className="text-zinc-900">AED {freightQuoteResponse.customsClearance}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Surcharge hazard category</span>
                            <span className="text-zinc-900">AED {freightQuoteResponse.portDues}</span>
                          </div>
                          <div className="flex justify-between text-[#113f36] font-black border-t border-zinc-50 pt-3">
                            <span>ETA Arrival lock</span>
                            <span>{freightQuoteResponse.transitTime}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {freightQuoteResponse && (
                    <button
                      onClick={handleDispatchFreight}
                      disabled={dispatchStatus === 'dispatching'}
                      className="w-full mt-8 py-4 bg-[#1a5c4e] hover:bg-[#113f36] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#113f36]/20"
                    >
                      {dispatchStatus === 'dispatching' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          Issue Port Cargo Release
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* WAREHOUSE REQUEST EXTRA COOLDOWN FREIGHT QUOTE */
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] border border-zinc-200/80 shadow-md text-left space-y-6">
              <div className="flex items-center gap-4 text-left border-b border-zinc-100 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center">
                  <Anchor className="w-6 h-6 animate-spin" style={{ animationDuration: '30s' }} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-zinc-900">Ocean Commercial Invoice Calculator</h2>
                  <p className="text-xs text-zinc-500">Calculate customs, duty, logistics warehouse demurrage and platform fees up to 10 metric tons.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setFreightData({...freightData, containerSize: '20gp'})}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${freightData.containerSize === '20gp' ? 'border-[#113f36] bg-[#113f36]/5/10' : 'border-zinc-200'}`}
                >
                  <span className="font-black text-xs text-zinc-800 block">Class 20GP container</span>
                  <span className="text-[12px] text-zinc-400 mt-1 block">Standard Dry cargo locker</span>
                </button>
                <button 
                  onClick={() => setFreightData({...freightData, containerSize: '40hc'})}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${freightData.containerSize === '40hc' ? 'border-[#113f36] bg-[#113f36]/5/10' : 'border-zinc-200'}`}
                >
                  <span className="font-black text-xs text-zinc-800 block">Class 40HC container</span>
                  <span className="text-[12px] text-zinc-400 mt-1 block">Extra high volume dry container</span>
                </button>
              </div>

              <div className="space-y-1 text-xs text-zinc-500">
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span>Dubai Port Entry customs bond</span>
                  <span className="font-bold text-zinc-900">AED 350.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span>Logistics clearing flat charge</span>
                  <span className="font-bold text-zinc-900">AED 450.00</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-50">
                  <span>Transit Cargo marine insurance</span>
                  <span className="font-bold text-zinc-900">AED 120.00</span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold text-zinc-800 pt-3">
                  <span>Fixed Broker clearance</span>
                  <span className="text-[#113f36]">AED 920.00</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setFreightQuoteResponse(null);
                  setMerchantActiveTab('freight_orders');
                }}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
              >
                Go to Booking forms
              </button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
