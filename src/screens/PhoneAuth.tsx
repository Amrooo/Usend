import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, ArrowRight, X, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';

interface PhoneAuthProps {
  onNavigate: (screen: Screen) => void;
}

export default function PhoneAuth({ onNavigate }: PhoneAuthProps) {
  const { t, isRTL } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp' | 'verifying'>('phone');
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: number;
    if (step === 'otp' && countdown > 0) {
      timer = window.setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 9) {
      setStep('otp');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Submit if complete
    if (newOtp.every(digit => digit !== '') && index === 3) {
      handleVerify();
    }
  };

  const handleVerify = () => {
    setStep('verifying');
    setTimeout(() => {
      onNavigate('home');
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="absolute inset-0 bg-white flex flex-col p-8 pt-16 transition-colors duration-300"
    >
      {/* Back Button */}
      <button 
        onClick={() => setStep(step === 'otp' ? 'phone' : 'phone')}
        className="absolute top-8 left-8 p-2 rounded-full bg-zinc-100 border border-zinc-200"
      >
        <X className="w-5 h-5 text-zinc-500" />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-12">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Logo />
        </motion.div>

        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            {step === 'phone' ? 'Welcome Back' : 'Verify Identity'}
          </h2>
          <p className="text-zinc-500 text-sm font-medium leading-relaxed">
            {step === 'phone' 
              ? 'Enter your mobile number to request a delivery. No password needed.'
              : `We've sent a code to +218 ${phoneNumber}. It expires in ${countdown}s.`}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' && (
            <motion.form
              key="phone-form"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              onSubmit={handlePhoneSubmit}
              className="w-full space-y-4"
            >
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 pr-3">
                  <span className="text-sm font-bold text-zinc-400">🇦🇪 +971</span>
                </div>
                <input
                  type="tel"
                  placeholder="50 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full h-16 pl-24 pr-4 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 focus:border-emerald-600 outline-none text-lg font-bold tracking-wider transition-all placeholder:font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={phoneNumber.length < 9}
                className="w-full h-16 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-3xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-zinc-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
              >
                Get Verification Code
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.form>
          )}

          {step === 'otp' && (
            <motion.div
              key="otp-form"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full space-y-8"
            >
              <div className="flex justify-between gap-3 px-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="number"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-16 h-20 text-center text-3xl font-black rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 focus:border-emerald-600 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => { setCountdown(30); setOtp(['','','','']); }}
                  disabled={countdown > 0}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest disabled:opacity-50"
                >
                  Resend Code
                </button>
                <div className="flex items-center gap-2 text-[12px] uppercase font-black text-zinc-400 tracking-tighter">
                   <ShieldCheck className="w-3 h-3" /> Secure Verification by USend
                </div>
              </div>
            </motion.div>
          )}

          {step === 'verifying' && (
            <motion.div
              key="verifying"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
                 <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100 animate-pulse">Authenticating...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 w-full">
           <div className="flex items-center gap-3 text-zinc-400 text-xs">
              <MessageSquare className="w-4 h-4" />
              <p>We'll send you a 4-digit code to verify your phone number. Standard rates apply.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
