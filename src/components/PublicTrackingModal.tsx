import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Package, Truck, Warehouse, ShieldCheck, 
  Lock, AlertTriangle, CheckCircle2, ArrowRight, Loader2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

interface PublicTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
}

type VerifyStep = 'verify' | 'tracking';

export default function PublicTrackingModal({ isOpen, onClose, trackingNumber }: PublicTrackingModalProps) {
  const { t } = useLanguage();
  const { activeRequests } = useApp();
  const [step, setStep] = useState<VerifyStep>('verify');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_SECONDS = 60;

  // Reset state when modal opens with a new tracking number
  useEffect(() => {
    if (isOpen) {
      setStep('verify');
      setVerifyCode('');
      setVerifyError(null);
      setProgress(0);
      // Don't reset attempts/lock — persist across open/close to prevent bypass
    }
  }, [isOpen, trackingNumber]);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => {
      setLockTimer(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          setAttempts(0);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  // Animate progress bar after verification
  useEffect(() => {
    if (step === 'tracking') {
      setProgress(0);
      const timer = setTimeout(() => setProgress(65), 400);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleVerify = useCallback(async () => {
    if (isLocked || !verifyCode.trim()) return;

    setIsVerifying(true);
    setVerifyError(null);

    // Simulate server-side verification delay
    await new Promise(r => setTimeout(r, 1200));

    // Find the request
    const request = activeRequests.find(r => r.id === trackingNumber || r.externalTrackingNumber === trackingNumber);
    
    let isValid = false;
    const cleanCode = verifyCode.trim();

    if (request) {
      isValid = request.phone ? request.phone.endsWith(cleanCode) : cleanCode === '1234';
    } else {
      // Demo fallback if order not found
      isValid = cleanCode === '1234';
    }

    if (isValid) {
      setStep('tracking');
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimer(LOCKOUT_SECONDS);
        setVerifyError(`Too many failed attempts. Please try again in ${LOCKOUT_SECONDS} seconds.`);
      } else {
        setVerifyError(`Verification failed. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
      }
    }
    setIsVerifying(false);
  }, [verifyCode, attempts, isLocked]);

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: 40, scale: 0.96, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── HEADER ─── */}
          <div className="relative p-6 pb-5 border-b border-slate-100">
            {/* Decorative gradient blob */}
            <div className="absolute -top-20 -right-20 w-52 h-52 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2.5">
                  <Package className="w-3 h-3" />
                  {t('shipment_lookup')}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
                  {trackingNumber || 'AWB-000000'}
                </h2>
              </div>
              
              <button 
                onClick={handleClose}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── STEP 1: IDENTITY VERIFICATION ─── */}
          <AnimatePresence mode="wait">
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                {/* Security notice */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 mb-6">
                  <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">{t('identity_verification_required')}</h4>
                    <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                      {t('identity_verification_desc')}
                    </p>
                  </div>
                </div>

                {/* Verification input */}
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                      {t('verification_code')}
                    </span>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => {
                          setVerifyCode(e.target.value);
                          setVerifyError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerify();
                        }}
                        disabled={isLocked}
                        placeholder={t('verify_placeholder')}
                        className={`w-full h-13 pl-11 pr-4 rounded-xl border-2 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium outline-none transition-all ${
                          isLocked
                            ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                            : verifyError
                              ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-100'
                              : 'border-slate-200 bg-white focus:border-[#1452D1] focus:ring-4 focus:ring-blue-100'
                        }`}
                        autoFocus
                      />
                    </div>
                  </label>

                  {/* Error / lockout message */}
                  <AnimatePresence>
                    {verifyError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs font-semibold text-red-700 leading-relaxed">{verifyError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Lockout countdown */}
                  {isLocked && (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold tracking-wider uppercase">
                          {t('locked_retry_in')} {lockTimer}s
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleVerify}
                    disabled={isLocked || isVerifying || !verifyCode.trim()}
                    className={`w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                      isLocked || isVerifying || !verifyCode.trim()
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#1452D1] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('verifying')}
                      </>
                    ) : (
                      <>
                        {t('verify_and_track')}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Lock className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('encrypted')}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-200" />
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('privacy_protected')}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 2: TRACKING RESULTS (masked data) ─── */}
            {step === 'tracking' && (
              <motion.div
                key="tracking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                {/* Verified badge */}
                <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-xl bg-green-50 border border-green-100 w-fit">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-green-700 uppercase tracking-widest">{t('identity_verified')}</span>
                </div>

                {/* Info cards — MASKED DATA */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('recipient')}</span>
                    <span className="text-sm font-bold text-slate-800">J*** D**</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('destination')}</span>
                    <span className="text-sm font-bold text-slate-800">*** Baker St</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{t('est_delivery')}</span>
                    <span className="text-sm font-bold text-slate-800">Today, 2:30 PM</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Status</span>
                    <span className="text-sm font-black text-[#1452D1]">In Transit</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative mb-10 px-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#1452D1] to-blue-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  
                  {/* Step markers */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-1 pointer-events-none">
                    {[0, 50, 100].map(threshold => (
                      <div key={threshold} className={`w-5 h-5 rounded-full border-[3px] border-white shadow-sm transition-colors duration-700 ${progress >= threshold ? 'bg-[#1452D1]' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  
                  <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="text-[#1452D1]">Picked Up</span>
                    <span className={progress >= 50 ? "text-[#1452D1]" : ""}>In Transit</span>
                    <span className={progress >= 100 ? "text-[#1452D1]" : ""}>Delivered</span>
                  </div>
                </div>

                {/* Timeline events */}
                <div className="space-y-1">
                  {[
                    { icon: Truck, title: 'Out for Delivery', desc: 'Package is on its way to destination city.', time: 'Today, 09:15 AM', active: true },
                    { icon: Warehouse, title: 'Arrived at Hub', desc: 'Processed at local distribution center.', time: 'Yesterday, 11:30 PM', active: false },
                    { icon: Package, title: 'Shipment Created', desc: 'Label generated by sender.', time: 'Yesterday, 04:20 PM', active: false },
                  ].map((event, i) => (
                    <div key={i} className={`flex items-start gap-3.5 p-3 rounded-xl transition-colors ${event.active ? 'bg-blue-50/50' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${event.active ? 'bg-[#1452D1] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <event.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <h4 className={`text-sm font-bold ${event.active ? 'text-slate-900' : 'text-slate-500'}`}>{event.title}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">{event.desc}</p>
                        <span className="text-[10px] font-bold text-slate-300 mt-1.5 block tracking-wider uppercase">{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── FOOTER ─── */}
          <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Lock className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure Connection</span>
            </div>
            <button 
              onClick={handleClose} 
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-widest"
            >
              Close
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
