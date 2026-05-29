import React, { useState } from 'react';
import { Truck, MapPin, Phone, Lock, CheckCircle2, ArrowRight, Plane, Box, User, ArrowLeft, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import { aramexService } from '../services/aramexIntegration';

export default function GuestOrderWidget({ onNavigate, onRequestLogin }: { onNavigate: (s: Screen) => void, onRequestLogin?: () => void }) {
  const { isRTL, t } = useLanguage();
  const { addRequest } = useApp();

  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0); // 0: Select Type, 1: Shipper, 2: Receiver, 3: Shipment, 4: Payment, 5: Success/Verify
  const [shipmentType, setShipmentType] = useState<'domestic' | 'international' | null>(null);
  
  // Shipper details
  const [shipperData, setShipperData] = useState({
    name: '', email: '', country: '', phone: '', city: '', street: '', building: '', landmark: ''
  });

  // Receiver details
  const [receiverData, setReceiverData] = useState({
    name: '', phone: '', street: '', city: ''
  });

  // Shipment details
  const [shipmentData, setShipmentData] = useState({
    weight: '1', description: '', quantity: '1', photo: null as string | null, courier: 'aramex' as 'usend' | 'aramex'
  });

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Flow control
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  
  const handleSelectType = (type: 'domestic' | 'international') => {
    setShipmentType(type);
    setWizardStep(1);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShipmentData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = () => {
    const baseFee = shipmentType === 'international' ? 120 : 30;
    const additionalWeight = Math.max(0, parseFloat(shipmentData.weight || '1') - 5);
    const weightFee = additionalWeight * 5;
    return baseFee + weightFee;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStep < 4) {
      setWizardStep((prev) => (prev + 1) as 1|2|3|4|5);
    } else {
      setLoading(true);
      
      const submitOrder = async () => {
        const newOrderId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const totalAmount = calculateTotal();
        
        const reqPayload = {
          id: newOrderId,
          name: shipperData.name || (isRTL ? 'مستخدم ضيف' : 'Guest User'),
          channel: 'Guest Flow',
          date: new Date().toLocaleDateString(),
          status: 'Pending' as const,
          address: receiverData.city ? `${receiverData.street}, ${receiverData.city}` : 'Dubai, UAE',
          fromDestination: shipperData.city ? `${shipperData.street}, ${shipperData.city}` : 'Sharjah, UAE',
          toDestination: receiverData.city ? `${receiverData.street}, ${receiverData.city}` : 'Dubai, UAE',
          itemType: 'Package',
          description: `${shipmentData.quantity}x ${shipmentData.description} (${shipmentData.weight}kg)`,
          amountType: 'single item' as const,
          paymentMethod: paymentMethod === 'cod' ? 'Cash (COD)' : 'Card',
          orderAmount: `${totalAmount} AED`,
          applicantType: 'Guest' as const,
          etaTime: 'Pending',
          courier: shipmentData.courier === 'aramex' ? 'Aramex Cargo' : 'USend Fleet',
          phone: shipperData.phone || '+971'
        };
        
        await addRequest(reqPayload);
        
        if (shipmentData.courier === 'aramex') {
          try {
            await aramexService.createDeliveryJob(reqPayload);
          } catch (err) {
            console.error("Aramex Sandbox Dispatch failed", err);
          }
        }
        
        setCreatedOrderId(newOrderId);
        setLoading(false);
        setWizardStep(5);
      };
      
      submitOrder();
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 0) {
      setWizardStep((prev) => (prev - 1) as 0|1|2|3|4|5);
    }
  };

  const renderProgressBar = () => {
    const steps = [
      { id: 1, label: isRTL ? 'بيانات المرسل' : 'Shipper details' },
      { id: 2, label: isRTL ? 'بيانات المستلم' : 'Receiver details' },
      { id: 3, label: isRTL ? 'تفاصيل الشحنة' : 'Shipment details' },
      { id: 4, label: isRTL ? 'خيارات الدفع' : 'Payment options' },
    ];

    if (wizardStep === 0 || wizardStep === 5) return null;

    return (
      <div className="w-full mb-10 px-4">
        <div className="flex items-center justify-between relative" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Connector line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 -z-10" />
          
          {steps.map((s) => {
            const isActive = wizardStep === s.id;
            const isCompleted = wizardStep > s.id;
            
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 relative bg-white md:bg-transparent">
                <div 
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-white transition-all
                    ${isActive ? 'border-brand text-brand' : 
                      isCompleted ? 'border-zinc-300 text-zinc-400' : 'border-zinc-300 text-zinc-400'}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-zinc-400" /> : s.id}
                </div>
                <span className={`text-[11px] md:text-xs font-semibold absolute -bottom-6 w-32 text-center
                  ${isActive ? 'text-brand' : 'text-zinc-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-6 md:p-10 text-slate-800" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`text-center space-y-4 mb-4 ${wizardStep !== 0 ? 'hidden' : ''}`}>
        <h3 className="text-2xl md:text-3xl font-black uppercase text-brand tracking-tight">
          {isRTL ? "شحن المنتجات للضيوف" : "Fast Guest Send"}
        </h3>
        <p className="text-sm font-semibold text-brand">
          {isRTL ? "قم بإرسال طرودك فوراً دون إنشاء حساب" : "Book a delivery instantly. No account required."}
        </p>
      </div>

      {wizardStep === 0 && (
        <div className="py-2 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-center text-zinc-800 mb-8 mt-4 tracking-tight">
             {isRTL ? "هل تقوم بإرسال شحنة" : "Are you sending a"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button 
              onClick={() => handleSelectType('domestic')}
              className="bg-white border-[3px] border-zinc-100 hover:border-brand active:bg-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <Truck className="w-16 h-16 text-zinc-400 group-hover:text-brand transition-colors stroke-[1.5]" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-600 group-hover:text-zinc-900">
                   {isRTL ? "شحنة محلية" : "A domestic"}
                </h3>
                {!isRTL && <h3 className="text-lg font-bold text-zinc-600 group-hover:text-zinc-900">shipment</h3>}
              </div>
            </button>

            <button 
              onClick={() => handleSelectType('international')}
              className="bg-white border-[3px] border-zinc-100 hover:border-brand active:bg-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <Plane className="w-16 h-16 text-zinc-400 group-hover:text-brand transition-colors stroke-[1.5]" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-600 group-hover:text-zinc-900">
                  {isRTL ? "شحنة دولية" : "An international"}
                </h3>
                {!isRTL && <h3 className="text-lg font-bold text-zinc-600 group-hover:text-zinc-900">shipment</h3>}
              </div>
            </button>
          </div>
        </div>
      )}

      {renderProgressBar()}

      {wizardStep === 1 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in duration-300 mt-16 pb-4">
          <h3 className="text-xl font-bold text-zinc-800 mb-2 mt-4 uppercase tracking-tight">
            {isRTL ? "يرجى ملء بيانات المرسل" : "Please fill in the shipper details"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الاسم" : "Name"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={shipperData.name} onChange={e => setShipperData(p => ({...p, name: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "البريد الإلكتروني" : "Email Address"} <span className="text-brand">*</span></label>
              <input 
                required type="email"
                value={shipperData.email} onChange={e => setShipperData(p => ({...p, email: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الدولة" : "Country"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={shipperData.country} onChange={e => setShipperData(p => ({...p, country: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "رقم الهاتف" : "Phone number"} <span className="text-brand">*</span></label>
              <div className="flex items-center gap-2 border-b-2 border-zinc-200 focus-within:border-brand transition-colors">
                <div className="flex items-center gap-1.5 px-1 py-0.5 mt-1" dir="ltr">
                  <span className="text-sm font-bold text-zinc-700">+971</span>
                </div>
                <input 
                  required type="tel"
                  placeholder="50 123 4567" dir="ltr"
                  value={shipperData.phone} onChange={e => setShipperData(p => ({...p, phone: e.target.value}))}
                  className="w-full py-2 outline-none bg-transparent text-sm font-bold font-mono tracking-widest"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "المدينة" : "City"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={shipperData.city} onChange={e => setShipperData(p => ({...p, city: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "اسم الشارع" : "Street name"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={shipperData.street} onChange={e => setShipperData(p => ({...p, street: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "المبنى/الرقم" : "Building Name/Number"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={shipperData.building} onChange={e => setShipperData(p => ({...p, building: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "أقرب معلم" : "Nearest Landmark"}</label>
              <input 
                type="text"
                value={shipperData.landmark} onChange={e => setShipperData(p => ({...p, landmark: e.target.value}))}
                className={`w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold ${isRTL ? "pl-8" : "pr-8"} transition-colors bg-transparent`}
              />
              <AlertCircle className={`w-4 h-4 text-brand absolute top-7 ${isRTL ? 'left-0' : 'right-0'}`} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              type="button" 
              onClick={handlePrevStep}
              className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-50 transition-colors"
            >
              {isRTL ? "تراجع" : "Go Back"}
            </button>
            <button 
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95"
            >
              {isRTL ? "المتابعة" : "Continue"}
            </button>
          </div>
        </form>
      )}

      {wizardStep === 2 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in duration-300 mt-16 pb-4">
          <h3 className="text-xl font-bold text-zinc-800 mb-2 mt-4 uppercase tracking-tight">
             {isRTL ? "يرجى ملء بيانات المستلم" : "Please fill in the receiver details"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "اسم المستلم" : "Receiver Name"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={receiverData.name} onChange={e => setReceiverData(p => ({...p, name: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "رقم هاتف المستلم" : "Receiver Phone number"} <span className="text-brand">*</span></label>
              <div className="flex items-center gap-2 border-b-2 border-zinc-200 focus-within:border-brand transition-colors">
                <input 
                  required type="tel" dir="ltr"
                  placeholder="+971 50 000 0000"
                  value={receiverData.phone} onChange={e => setReceiverData(p => ({...p, phone: e.target.value}))}
                  className="w-full py-2 outline-none bg-transparent text-sm font-bold font-mono tracking-widest"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "مدينة التسليم" : "Drop-off City"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={receiverData.city} onChange={e => setReceiverData(p => ({...p, city: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "عنوان التسليم" : "Drop-off Address"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                value={receiverData.street} onChange={e => setReceiverData(p => ({...p, street: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              type="button" 
              onClick={handlePrevStep}
              className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-50 transition-colors"
            >
              {isRTL ? "تراجع" : "Go Back"}
            </button>
            <button 
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95"
            >
              {isRTL ? "المتابعة" : "Continue"}
            </button>
          </div>
        </form>
      )}

      {wizardStep === 3 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in duration-300 mt-16 pb-4">
          <h3 className="text-xl font-bold text-zinc-800 mb-2 mt-4 uppercase tracking-tight">
            {isRTL ? "تفاصيل القطعة" : "Package details"}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "نوع القطعة" : "Category"} <span className="text-brand">*</span></label>
              <select 
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              >
                 <option>Documents</option>
                 <option>Electronics</option>
                 <option>Clothing & Accessories</option>
                 <option>Food & Beverages</option>
                 <option>Other / General</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "القيمة التقريبية" : "Declared Value (AED)"}</label>
              <input 
                type="number" min="0" placeholder="0.00"
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الوزن (كجم)" : "Weight (kg)"} <span className="text-brand">*</span></label>
              <input 
                required type="number" step="0.1" min="0.1"
                value={shipmentData.weight} onChange={e => setShipmentData(p => ({...p, weight: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "الكمية" : "Quantity"} <span className="text-brand">*</span></label>
              <input 
                required type="number" min="1"
                value={shipmentData.quantity} onChange={e => setShipmentData(p => ({...p, quantity: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "وصف المحتويات" : "Contents description"} <span className="text-brand">*</span></label>
              <input 
                required type="text"
                placeholder={isRTL ? "مستندات، إلكترونيات، إلخ" : "Additional details of items..."}
                value={shipmentData.description} onChange={e => setShipmentData(p => ({...p, description: e.target.value}))}
                className="w-full border-b-2 border-zinc-200 py-2 outline-none focus:border-brand text-sm font-semibold transition-colors bg-transparent"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "إرفاق صورة للقطعة (للأمان والوصف)" : "Attach Item Photo (For better tracking/security)"}</label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-36 border-2 border-zinc-300 border-dashed rounded-2xl cursor-pointer bg-zinc-50 hover:bg-zinc-100/50 hover:border-brand/80 transition-colors relative overflow-hidden group">
                  {shipmentData.photo ? (
                    <img src={shipmentData.photo} alt="Item setup" className="w-full h-full object-contain bg-black/5" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5 text-zinc-500" />
                      </div>
                      <p className="mb-1 text-sm text-zinc-600"><span className="font-bold">{isRTL ? "اضغط لرفع صورة" : "Click to upload image"}</span></p>
                      <p className="text-xs text-zinc-400">JPG, PNG, GIF up to 5MB</p>
                    </div>
                  )}
                  <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

            {/* Courier Selection added here */}
            <div className="space-y-4 md:col-span-2 pt-2 border-t border-zinc-100">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">{isRTL ? "شركة التوصيل الشريكة المتاحة" : "Available Partner Courier"} <span className="text-brand">*</span></label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                

                {/* Aramex */}
                <label className="group relative">
                  <input type="radio" name="courier" value="aramex" 
                    checked={shipmentData.courier === 'aramex'} 
                    onChange={() => setShipmentData(p => ({ ...p, courier: 'aramex' as const }))}
                    className="sr-only" 
                  />
                  <div className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${shipmentData.courier === 'aramex' ? 'border-[#E20000] bg-[#E20000]/5' : 'border-zinc-200 hover:border-[#E20000]/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shipmentData.courier === 'aramex' ? 'border-[#E20000] bg-[#E20000]' : 'border-zinc-300'}`}>
                        {shipmentData.courier === 'aramex' && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-zinc-900 leading-none mb-1 text-left">Aramex Cargo Express</h4>
                        <p className="text-zinc-500 text-xs text-left">Priority tracking</p>
                      </div>
                      <Plane className={`w-6 h-6 ${shipmentData.courier === 'aramex' ? 'text-[#E20000]' : 'text-zinc-400'}`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              type="button" 
              onClick={handlePrevStep}
              className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-50 transition-colors"
            >
              {isRTL ? "تراجع" : "Go Back"}
            </button>
            <button 
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-bold uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95"
            >
              {isRTL ? "المتابعة" : "Continue"}
            </button>
          </div>
        </form>
      )}

      {wizardStep === 4 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in duration-300 mt-16 pb-4">
          <h3 className="text-xl font-bold text-zinc-800 mb-2 mt-4 uppercase tracking-tight">
            {isRTL ? "الملخص والدفع" : "Summary & Payment"}
          </h3>
          
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-200 gap-4">
               <div className="flex-1">
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{isRTL ? "موقع الاستلام" : "Pickup (From)"}</p>
                 <p className="text-sm font-bold text-slate-800">{shipperData.name}</p>
                 <p className="text-xs font-semibold text-slate-600 mt-0.5">{shipperData.city ? `${shipperData.street}, ${shipperData.city}` : "Not set"}</p>
               </div>
               <ArrowRight className={`w-6 h-6 text-brand hidden md:block ${isRTL ? 'rotate-180' : ''}`} />
               <div className="w-px h-12 bg-slate-200 hidden md:block mx-4"></div>
               <div className="flex-1 md:text-right">
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{isRTL ? "موقع التسليم" : "Drop-off (To)"}</p>
                 <p className="text-sm font-bold text-slate-800">{receiverData.name}</p>
                 <p className="text-xs font-semibold text-slate-600 mt-0.5">{receiverData.city ? `${receiverData.street}, ${receiverData.city}` : "Not set"}</p>
               </div>
            </div>
            
            <div className="space-y-3 pb-6 border-b border-slate-200">
               <p className="text-[10px] font-black uppercase text-brand tracking-widest mb-2">{isRTL ? "تفاصيل الطلب" : "Order Breakdown"}</p>
               <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                 <span>{isRTL ? "الشحنة والوصف" : "Shipment Details"}</span>
                 <span className="text-slate-900 font-bold">{shipmentData.quantity}x {shipmentData.description || 'Package'} ({shipmentData.weight}kg)</span>
               </div>
               <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                 <span>{isRTL ? "رسوم الشحن الأساسية" : "Base Delivery Fee"}</span>
                 <span className="text-slate-900 font-bold">{shipmentType === 'international' ? '120.00' : '30.00'} AED</span>
               </div>
               {Math.max(0, parseFloat(shipmentData.weight || '1') - 5) > 0 && (
                 <div className="flex justify-between items-center text-sm font-semibold text-slate-600">
                   <span>{isRTL ? "رسوم الوزن الإضافي" : "Extra Weight Fee"}</span>
                   <span className="text-slate-900 font-bold">{Math.max(0, parseFloat(shipmentData.weight || '1') - 5) * 5}.00 AED</span>
                 </div>
               )}
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-black uppercase text-brand tracking-widest">{isRTL ? "المجموع" : "Total to Pay"}</span>
              <span className="text-3xl font-black text-brand">{calculateTotal()}.00 AED</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <label className="flex items-center gap-4 p-5 border-2 border-brand bg-brand/5 rounded-2xl cursor-pointer shadow-sm transition-all hover:bg-brand/10">
               <input type="radio" name="payment" defaultChecked className="w-5 h-5 text-brand accent-brand cursor-pointer" />
               <div>
                 <span className="font-black uppercase text-sm tracking-wide text-zinc-900 block">{isRTL ? "الدفع عند الاستلام" : "Cash on Delivery (COD)"}</span>
                 <span className="text-xs font-semibold text-zinc-500">{isRTL ? "ادفع نقداً عند وصول المندوب" : "Pay when driver arrives"}</span>
               </div>
             </label>
             <label className="flex items-center gap-4 p-5 border-2 border-zinc-200 bg-white rounded-2xl cursor-not-allowed opacity-50 relative overflow-hidden">
               <input type="radio" name="payment" disabled className="w-5 h-5 text-zinc-300" />
               <div>
                 <span className="font-black uppercase text-sm tracking-wide text-zinc-900 block">{isRTL ? "البطاقة الائتمانية" : "Credit/Debit Card"}</span>
                 <span className="text-xs font-semibold text-zinc-500">{isRTL ? "غير متاح مؤقتاً" : "Processing integration"}</span>
               </div>
               <Lock className={`w-8 h-8 text-zinc-200 absolute ${isRTL ? 'left-4' : 'right-4'}`} />
             </label>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center gap-4 pt-8">
            <button 
              type="button" 
              onClick={handlePrevStep} disabled={loading}
              className="w-full md:w-auto px-8 py-4 rounded-xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-widest text-[11px] hover:bg-zinc-50 transition-colors disabled:opacity-50"
            >
              {isRTL ? "تراجع" : "Go Back"}
            </button>
            <button 
              type="submit" disabled={loading}
              className="w-full flex-1 py-4 rounded-xl bg-slate-900 hover:bg-brand disabled:bg-zinc-400 text-white font-black uppercase tracking-widest text-[11px] shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (isRTL ? "تأكيد وإرسال الطلب" : "Confirm & Send Order")}
            </button>
          </div>
        </form>
      )}

      {wizardStep === 5 && (
        <div className="text-center py-10 space-y-6 animate-in zoom-in-95 duration-500 max-w-sm mx-auto">
          <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto text-brand mb-2 border-4 border-brand/20 relative group">
            <div className="w-full h-full rounded-full absolute bg-brand/20 group-hover:animate-ping opacity-0 transition-opacity" />
            <CheckCircle2 className="w-12 h-12 relative z-10" />
          </div>
          <h4 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
             {isRTL ? "تم إنشاء الطلب بنجاح!" : "Order Secured!"}
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{isRTL ? "رقم التتبع الخاص بك" : "Your Tracking Number"}</p>
             <p className="text-2xl font-mono font-bold text-brand">{createdOrderId}</p>
          </div>
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            {isRTL 
              ? `تم تسجيل طلبك المبدئي بنجاح برقم التتبع في الأعلى. يمكنك تتبع الشحنة من خلال البوابة، يرجى التسجيل أو تسجيل الدخول بنفس الرقم.`
              : `Your guest order is confirmed. To track drivers, view full details, and manage the delivery, please access the tracking portal or login.`}
          </p>
          <div className="pt-8">
            <button 
              onClick={() => {
                if (onRequestLogin) {
                  onRequestLogin();
                } else {
                  onNavigate('user_tracking');
                }
              }}
              className="w-full py-4 rounded-xl bg-brand hover:bg-brand/90 text-white font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl"
            >
              <span>{isRTL ? "تتبع الطلبية أو سجل الدخول" : "Track Order / Login"}</span>
              <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


