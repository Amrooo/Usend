import React, { useState, useRef, ChangeEvent } from 'react';
import { Truck, MapPin, Phone, Lock, CheckCircle2, ArrowRight, Plane, Camera, AlertCircle, Map, UploadCloud, User, DollarSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import { aramexService } from '../services/aramexIntegration';
import MapPicker from './MapPicker';
import Modal from './Modal';
import { countriesAndCities } from '../data';
import { notificationService } from '../services/notificationService';
import { fedexService } from '../services/fedexService';

interface OrderWizardProps {
  onNavigate: (s: Screen) => void;
  onRequestLogin?: () => void;
  isGuest?: boolean;
}

export default function OrderWizard({ onNavigate, onRequestLogin, isGuest = true }: OrderWizardProps) {
  const { isRTL, t, language } = useLanguage();
  const { addRequest, user, addNotification } = useApp();

  const [wizardStep, setWizardStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [shipmentType, setShipmentType] = useState<'domestic' | 'international' | null>(null);
  
  // Shipper details
  const [shipperData, setShipperData] = useState({
    name: user?.name || '', 
    email: user?.email || '', 
    country: 'United Arab Emirates', 
    phone: user?.phoneNumber || '', 
    city: 'Dubai', 
    street: '', 
    building: '', 
    landmark: '',
    position: null as [number, number] | null
  });

  // Receiver details
  const [receiverData, setReceiverData] = useState({
    name: '', phone: '+971 ', country: 'United Arab Emirates', city: 'Dubai', street: '', position: null as [number, number] | null
  });

  // Shipment details
  const [shipmentData, setShipmentData] = useState({
    weight: '1', description: '', quantity: '1', photo: null as string | null, courier: 'usend' as 'usend' | 'aramex' | 'fedex', declaredValue: ''
  });

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // Maps
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<'shipper' | 'receiver' | null>(null);

  // Flow control
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  
  const validatePhone = (phone: string) => {
    // Exact UAE phone format: +971 followed by 9 digits
    return /^\+971 \d{9}$/.test(phone);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneChange = (setter: React.Dispatch<React.SetStateAction<any>>, field: string = 'phone') => (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+971 ')) {
       if (val.length < 5) val = '+971 ';
       else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
    } else {
       val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
    }
    if (val.length > 14) val = val.slice(0, 14);
    setter((p: any) => ({ ...p, [field]: val }));
  };

  const handleSelectType = (type: 'domestic' | 'international') => {
    setShipmentType(type);
    setWizardStep(1);
    if (type === 'international') {
      setReceiverData(p => ({ ...p, country: 'Saudi Arabia', city: 'Riyadh' }));
    } else {
      setReceiverData(p => ({ ...p, country: 'United Arab Emirates', city: 'Dubai' }));
      setShipperData(p => ({ ...p, country: 'United Arab Emirates', city: 'Dubai' }));
    }
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShipmentData(prev => ({ ...prev, photo: reader.result as string }));
        // Mock AI Recognition delay
        setTimeout(() => {
          setShipmentData(prev => ({
            ...prev,
            description: prev.description || 'Auto-detected Package',
            weight: '5'
          }));
        }, 1500);
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
    if (wizardStep === 1) {
      if (!validatePhone(shipperData.phone)) {
        alert(isRTL ? "يرجى إدخال رقم هاتف صحيح للمرسل" : "Please enter a valid phone number for the shipper.");
        return;
      }
      if (!validateEmail(shipperData.email)) {
        alert(isRTL ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email address.");
        return;
      }
    }
    if (wizardStep === 2) {
      if (!validatePhone(receiverData.phone)) {
        alert(isRTL ? "يرجى إدخال رقم هاتف صحيح للمستلم" : "Please enter a valid phone number for the receiver.");
        return;
      }
    }

    if (wizardStep < 4) {
      setWizardStep((prev) => (prev + 1) as 1|2|3|4|5);
    } else {
      setLoading(true);
      
      const submitOrder = async () => {
        const newOrderId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const totalAmount = calculateTotal();
        
        const reqPayload = {
          id: newOrderId,
          name: shipperData.name || (isGuest ? (isRTL ? 'مستخدم ضيف' : 'Guest User') : user?.name || 'User'),
          userId: isGuest ? undefined : user?.uid, // Tie to user if logged in
          phone: shipperData.phone || '+971',
          channel: isGuest ? 'Guest Flow' : 'User Portal',
          date: new Date().toLocaleDateString(),
          status: 'Pending' as const,
          address: receiverData.city ? `${receiverData.street}, ${receiverData.city}, ${receiverData.country}` : 'Dubai, UAE',
          fromDestination: shipperData.city ? `${shipperData.street}, ${shipperData.city}, ${shipperData.country}` : 'Sharjah, UAE',
          toDestination: receiverData.city ? `${receiverData.street}, ${receiverData.city}, ${receiverData.country}` : 'Dubai, UAE',
          position: receiverData.position,
          itemType: 'Package',
          description: `${shipmentData.quantity}x ${shipmentData.description} (${shipmentData.weight}kg)`,
          amountType: 'single item' as const,
          paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card',
          orderAmount: `${totalAmount} AED`,
          applicantType: isGuest ? 'Guest' as const : 'User' as const,
          etaTime: 'Pending',
          courier: shipmentData.courier === 'aramex' ? 'Aramex' : shipmentData.courier === 'fedex' ? 'FedEx' : 'USend Fleet',
        };
        
        await addRequest(reqPayload);

        // Guest order tracker in localstorage
        if (isGuest) {
          const storedGuest = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          storedGuest.push({ id: newOrderId, phone: shipperData.phone });
          localStorage.setItem('guestOrders', JSON.stringify(storedGuest));
        }
        
        if (shipmentData.courier === 'aramex') {
          try {
            const aramexRes = await aramexService.createDeliveryJob(reqPayload);
            if (aramexRes.success === false) {
               throw new Error(aramexRes.error || "Aramex API failed to create shipment.");
            }
          } catch (err: any) {
            console.error("Aramex Dispatch failed", err);
            setLoading(false);
            window.dispatchEvent(new CustomEvent('app_toast', { detail: { title: 'Aramex Integration Error', message: err.message, type: 'error' } }));
            return;
          }
        } else if (shipmentData.courier === 'fedex') {
          try {
            const fedexRes = await fedexService.createFedexJob(reqPayload);
            if (!fedexRes.success) throw new Error("FedEx API failed");
          } catch (err: any) {
             console.error("FedEx Dispatch failed", err);
             setLoading(false);
             return;
          }
        }
        
        // Dispatch Email and SMS Notifications
        try {
          const notificationData = {
            orderId: newOrderId,
            amount: `${totalAmount} AED`,
            items: `${shipmentData.quantity}x ${shipmentData.description}`,
            courier: shipmentData.courier === 'aramex' ? 'Aramex' : shipmentData.courier === 'fedex' ? 'FedEx' : 'USend Fleet'
          };
          
          await Promise.all([
            notificationService.sendOrderConfirmationEmail(shipperData.email, notificationData),
            notificationService.sendInvoiceEmail(shipperData.email, notificationData, paymentMethod === 'cod' ? 'Cash on Delivery' : 'Credit Card'),
            notificationService.sendOrderSMS(shipperData.phone, notificationData, 'sender'),
            notificationService.sendOrderSMS(receiverData.phone, notificationData, 'receiver')
          ]);
        } catch (err) {
          console.error("Failed to send some notifications:", err);
        }

        setCreatedOrderId(newOrderId);
        setLoading(false);
        setWizardStep(5);
        
        addNotification({
          title: `Order Created (${shipmentData.courier === 'aramex' ? 'Aramex' : shipmentData.courier === 'fedex' ? 'FedEx' : 'USend Fleet'})`,
          message: `Your shipment ${newOrderId} has been confirmed successfully.`,
          type: 'success'
        });
        
        window.dispatchEvent(new CustomEvent('app_toast', {
          detail: {
            title: "Order Confirmed",
            message: `Your invoice and tracking details (${newOrderId}) have been sent to ${shipperData.email} and via SMS.`
          }
        }));
      };
      
      submitOrder();
    }
  };

  const handlePrevStep = () => {
    if (wizardStep > 0) setWizardStep((prev) => (prev - 1) as 0|1|2|3|4|5);
  };

  const handleMapSelect = (addr: string, pos: [number, number]) => {
    if (mapTarget === 'shipper') {
      setShipperData(p => ({ ...p, street: addr, position: pos }));
    } else {
      setReceiverData(p => ({ ...p, street: addr, position: pos }));
    }
    setIsMapOpen(false);
  };

  const renderProgressBar = () => {
    const steps = [
      { id: 1, label: isRTL ? 'المرسل' : 'Shipper' },
      { id: 2, label: isRTL ? 'المستلم' : 'Receiver' },
      { id: 3, label: isRTL ? 'الشحنة' : 'Shipment' },
      { id: 4, label: isRTL ? 'الدفع' : 'Payment' },
    ];
    if (wizardStep === 0 || wizardStep === 5) return null;
    return (
      <div className="w-full mb-10 px-4">
        <div className="flex items-center justify-between relative" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 -z-10" />
          {steps.map((s) => {
            const isActive = wizardStep === s.id;
            const isCompleted = wizardStep > s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-2 relative bg-white dark:bg-zinc-950 md:bg-transparent">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-white dark:bg-zinc-900 transition-all ${isActive ? 'border-brand text-brand' : isCompleted ? 'border-zinc-300 text-zinc-400' : 'border-zinc-300 dark:border-zinc-700 text-zinc-400'}`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-zinc-400" /> : s.id}
                </div>
                <span className={`text-[13px] md:text-xs font-semibold absolute -bottom-6 w-24 text-center ${isActive ? 'text-brand' : 'text-zinc-400'}`}>
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
    <div className={`w-full bg-white dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 rounded-[2.5rem] ${isGuest ? 'shadow-2xl' : 'shadow-none'} p-6 md:p-10 text-slate-800 dark:text-zinc-100`} dir={isRTL ? "rtl" : "ltr"}>
      <Modal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} title="Select Location on Map">
         <MapPicker onSelect={handleMapSelect} onClose={() => setIsMapOpen(false)} />
      </Modal>

      <div className={`text-center space-y-4 mb-4 ${wizardStep !== 0 ? 'hidden' : ''}`}>
        <h3 className="text-2xl md:text-3xl font-black uppercase text-brand tracking-tight">
          {isRTL ? "إنشاء طلب شحن جديد" : (isGuest ? "Fast Guest Send" : "New Dispatch Order")}
        </h3>
        <p className="text-sm font-semibold text-brand">
          {isRTL ? "قم بإدخال تفاصيل شحنتك المباشرة" : "Book your delivery dynamically via UI or map."}
        </p>
      </div>

      {wizardStep === 0 && (
        <div className="py-2 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
            <button onClick={() => handleSelectType('domestic')} className="bg-white dark:bg-zinc-900 border-[3px] border-zinc-100 dark:border-zinc-800 hover:border-brand active:bg-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm transition-all group">
              <Truck className="w-16 h-16 text-zinc-400 group-hover:text-brand transition-colors stroke-[1.5]" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{isRTL ? "شحنة محلية" : "Internal (inside UAE)"}</h3>
              </div>
            </button>
            <button onClick={() => handleSelectType('international')} className="bg-white dark:bg-zinc-900 border-[3px] border-zinc-100 dark:border-zinc-800 hover:border-brand active:bg-zinc-50 rounded-3xl p-10 flex flex-col items-center justify-center gap-6 shadow-sm transition-all group">
              <Plane className="w-16 h-16 text-zinc-400 group-hover:text-brand transition-colors stroke-[1.5]" />
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{isRTL ? "شحنة دولية" : "International"}</h3>
              </div>
            </button>
          </div>
        </div>
      )}

      {renderProgressBar()}

      {wizardStep === 1 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in mt-16 pb-4">
          <h3 className="text-xl font-bold dark:text-zinc-100 mb-2 uppercase tracking-tight">{isRTL ? "بيانات المرسل" : "Shipper Details"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className={`space-y-2 md:col-span-2`}>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Name *</label>
              <input required type="text" value={shipperData.name} onChange={e => setShipperData(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Email (Notifications & Invoice) *</label>
              <input required type="email" value={shipperData.email} onChange={e => setShipperData(p => ({...p, email: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Phone *</label>
              <input required type="tel" value={shipperData.phone} onChange={handlePhoneChange(setShipperData, 'phone')} placeholder="+971 50 1234567" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none font-mono tracking-widest transition-colors" dir="ltr" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Country *</label>
              <select value={shipperData.country} onChange={e => setShipperData(p => ({...p, country: e.target.value, city: countriesAndCities[e.target.value as keyof typeof countriesAndCities]?.[0] || ''}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none">
                {Object.keys(countriesAndCities).filter(c => shipmentType === 'domestic' ? c === 'United Arab Emirates' : true).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">City *</label>
              <select value={shipperData.city} onChange={e => setShipperData(p => ({...p, city: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none">
                {(countriesAndCities[shipperData.country as keyof typeof countriesAndCities] || []).map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2 relative">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Address / Street *</label>
                <button type="button" onClick={() => { setMapTarget('shipper'); setIsMapOpen(true); }} className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 flex items-center gap-1 rounded-md mb-1"><Map className="w-3 h-3"/> Map Picker</button>
              </div>
              <input required type="text" value={shipperData.street} onChange={e => setShipperData(p => ({...p, street: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none transition-colors pr-10" placeholder="Street, Building, etc." />
            </div>
          </div>
          <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
        </form>
      )}

      {wizardStep === 2 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in mt-16 pb-4">
          <h3 className="text-xl font-bold dark:text-zinc-100 mb-2 uppercase tracking-tight">{isRTL ? "بيانات المستلم" : "Receiver Details"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Name *</label>
              <input required type="text" value={receiverData.name} onChange={e => setReceiverData(p => ({...p, name: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Phone *</label>
              <input required type="tel" value={receiverData.phone} onChange={handlePhoneChange(setReceiverData, 'phone')} placeholder="+971 50 1234567" className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none font-mono tracking-widest" dir="ltr" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Country *</label>
              <select value={receiverData.country} onChange={e => setReceiverData(p => ({...p, country: e.target.value, city: countriesAndCities[e.target.value as keyof typeof countriesAndCities]?.[0] || ''}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none">
                {Object.keys(countriesAndCities).filter(c => shipmentType === 'domestic' ? c === 'United Arab Emirates' : true).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">City *</label>
              <select value={receiverData.city} onChange={e => setReceiverData(p => ({...p, city: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none">
                {(countriesAndCities[receiverData.country as keyof typeof countriesAndCities] || []).map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Dropoff Address *</label>
                <button type="button" onClick={() => { setMapTarget('receiver'); setIsMapOpen(true); }} className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 flex items-center gap-1 rounded-md mb-1"><Map className="w-3 h-3"/> Map Picker</button>
              </div>
              <input required type="text" value={receiverData.street} onChange={e => setReceiverData(p => ({...p, street: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none" />
            </div>
          </div>
          <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
        </form>
      )}

      {wizardStep === 3 && (
        <form onSubmit={handleNextStep} className="space-y-6 animate-in fade-in mt-16 pb-4">
          <h3 className="text-xl font-bold dark:text-zinc-100 mb-2 uppercase tracking-tight">{isRTL ? "تفاصيل الشحنة" : "Shipment Details"}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Weight (kg) *</label>
              <input required type="number" step="0.1" min="0.1" value={shipmentData.weight} onChange={e => setShipmentData(p => ({...p, weight: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Quantity *</label>
              <input required type="number" min="1" value={shipmentData.quantity} onChange={e => setShipmentData(p => ({...p, quantity: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Description *</label>
              <input required type="text" value={shipmentData.description} onChange={e => setShipmentData(p => ({...p, description: e.target.value}))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-brand rounded-xl px-4 py-3 outline-none" />
              <p className="text-[10px] text-zinc-400">You can manually edit this field after photo auto-detection.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Cargo Photo (Optional - AI Extraction)</label>
              <label className="w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand hover:bg-brand/5">
                {shipmentData.photo ? <img src={shipmentData.photo} className="h-full object-contain p-2"/> : <><UploadCloud className="w-8 h-8 text-zinc-400 mb-2"/><span className="text-xs font-bold">Snap or attach an image</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
              </label>
            </div>
            
            {!isGuest && (
              <div className="space-y-4 md:col-span-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">Advanced Courier Routing</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`p-4 rounded-xl border-2 cursor-pointer ${shipmentData.courier === 'usend' ? 'border-brand bg-brand/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                    <input type="radio" value="usend" checked={shipmentData.courier === 'usend'} onChange={() => setShipmentData(p =>({...p, courier: 'usend'}))} className="hidden"/>
                    <h4 className="font-bold text-sm">USend Fleet Delivery</h4>
                  </label>
                  <label className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${shipmentData.courier === 'aramex' ? 'border-brand bg-brand/5' : 'border-zinc-200 hover:border-brand/30'}`}>
                    <input type="radio" value="aramex" checked={shipmentData.courier === 'aramex'} onChange={() => setShipmentData(p =>({...p, courier: 'aramex'}))} className="hidden"/>
                    <div className="font-bold text-zinc-900 mb-1">Aramex Express</div>
                    <div className="text-xs text-zinc-500">Premium courier service.</div>
                  </label>
                  <label className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${shipmentData.courier === 'fedex' ? 'border-brand bg-brand/5' : 'border-zinc-200 hover:border-brand/30'}`}>
                    <input type="radio" value="fedex" checked={shipmentData.courier === 'fedex'} onChange={() => setShipmentData(p =>({...p, courier: 'fedex'}))} className="hidden"/>
                    <div className="font-bold text-zinc-900 mb-1">FedEx (Test Sandbox)</div>
                    <div className="text-xs text-zinc-500">Simulated integration for testing.</div>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" className="flex-1 py-3.5 rounded-xl bg-brand text-white font-bold uppercase tracking-widest text-xs shadow-lg">Next</button></div>
        </form>
      )}

      {wizardStep === 4 && (
        <form onSubmit={handleNextStep} className="space-y-8 animate-in fade-in mt-16 pb-4">
          <h3 className="text-xl font-bold dark:text-zinc-100 mb-2 uppercase tracking-tight">{isRTL ? "مراجعة الطلب" : "Summary & Payment"}</h3>
          
          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 mb-6">
             <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-zinc-800 mb-4">
               <div><p className="text-[10px] uppercase font-bold text-zinc-500">From</p><p className="font-bold text-sm">{shipperData.city}</p></div>
               <ArrowRight className="text-zinc-300 w-5 h-5"/>
               <div className="text-right"><p className="text-[10px] uppercase font-bold text-zinc-500">To</p><p className="font-bold text-sm">{receiverData.city}</p></div>
             </div>
             <div className="flex justify-between items-center text-sm font-semibold mb-2"><span>Base Rate</span><span>{shipmentType === 'international' ? '120' : '30'} AED</span></div>
             <div className="flex justify-between items-center text-xl font-black text-brand pt-4 border-t border-slate-200 dark:border-zinc-800"><span>Total</span><span>{calculateTotal()} AED</span></div>
          </div>
          
          {isGuest && (
            <div className="bg-brand/10 text-brand px-4 py-3 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4"/>
              An invoice will be automatically sent to {shipperData.email} upon confirmation.
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <label className="flex items-center gap-4 p-5 border-2 border-brand bg-brand/5 rounded-2xl cursor-pointer">
               <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 accent-brand" />
               <div><span className="font-bold uppercase text-sm block">Cash on Delivery</span><span className="text-xs text-zinc-500">Pay on pickup or dropoff</span></div>
             </label>
             <label className="flex items-center gap-4 p-5 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer">
               <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="w-5 h-5 accent-brand" />
               <div><span className="font-bold uppercase text-sm block">Card Payment</span><span className="text-xs text-zinc-500">Visa / Mastercard</span></div>
             </label>
          </div>

          <div className="flex gap-4 pt-6"><button type="button" onClick={handlePrevStep} className="px-8 py-3.5 rounded-xl border border-zinc-300 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-widest text-xs">Back</button><button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-xl bg-zinc-900 dark:bg-brand text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">{loading ? 'Processing...' : 'Confirm Order'}</button></div>
        </form>
      )}

      {wizardStep === 5 && (
        <div className="text-center py-10 space-y-6 max-w-sm mx-auto">
          <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center mx-auto text-brand"><CheckCircle2 className="w-12 h-12" /></div>
          <h4 className="text-3xl font-black uppercase">Order Created</h4>
          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4">
             <p className="text-[10px] font-black uppercase text-slate-500">Tracking Code</p>
             <p className="text-2xl font-mono font-bold text-brand">{createdOrderId}</p>
          </div>
          <p className="text-sm text-slate-500">{isGuest ? "Your guest order has been placed. You can track it here." : "Your delivery has been scheduled."}</p>
          <div className="pt-8">
            <button onClick={() => isGuest && onRequestLogin ? onRequestLogin() : onNavigate('user_tracking')} className="w-full py-4 rounded-xl bg-brand text-white font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2">
               {isGuest ? "Login / Track" : "View Tracking"} <ArrowRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
