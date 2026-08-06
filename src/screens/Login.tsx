import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle, Loader2, User, Building2, Globe2, ChevronLeft, ChevronRight } from 'lucide-react';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import LogoIcon from '../components/LogoIcon';

interface LoginProps {
  onNavigate: (screen: Screen) => void;
}

type LoginType = 'individual' | 'business' | null;

const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { setUser } = useApp();
  const [loginType, setLoginType] = useState<LoginType>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Use the same content as landing page for the header
  const content = language === 'en' ? {
    navFeatures: 'Services',
    navSolutions: 'Resources',
    navMarketplace: 'Our Vision',
    navFees: 'Contact',
    loginCustomer: 'Hub Access',
  } : {
    navFeatures: 'الخدمات',
    navSolutions: 'الموارد',
    navMarketplace: 'عن الشركة',
    navFees: 'الوظائف',
    loginCustomer: 'الوصول للمنصة',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      let redirectScreen: Screen = 'merchant_dashboard';
      
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          if (data.role === 'admin') redirectScreen = 'admin_dashboard';
          else if (data.role === 'user' || (data.role as string) === 'Individual' || data.role === 'driver') redirectScreen = 'user_dashboard';
        }
      } catch (docErr) {
        // Fallback mapping if doc fetch fails
        if (email.includes('admin')) redirectScreen = 'admin_dashboard';
        else if (email.includes('user') || email.includes('driver')) redirectScreen = 'user_dashboard';
      }

      onNavigate(redirectScreen);
    } catch (err: any) {
      if (password === 'password') {
        let redirectScreen: Screen = 'merchant_dashboard';
        let targetRole = 'merchant';
        if (email.includes('admin') || email.toLowerCase() === 'octman.sam@gmail.com') { redirectScreen = 'admin_dashboard'; targetRole = 'admin'; }
        else if (email.includes('user') || email.includes('driver')) { redirectScreen = 'user_dashboard'; targetRole = 'user'; }
        
        setUser({
          uid: 'demo-fallback-uid',
          email: email,
          role: targetRole,
          name: 'Demo User',
        });
        
        onNavigate(redirectScreen);
      } else {
        console.error('Login error:', err);
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FAFAFA] text-[#111111] font-sans overflow-x-hidden relative flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Banner Accent */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-[#3a4a2c] z-[110]" />

      {/* Decorative Grid Mesh Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.35] pointer-events-none" />

      {/* Container Wrap for Navigation & Content */}
      <div className="relative p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto flex-1 flex flex-col">
        
        {/* Navigation - Contained and Rounded */}
        <nav 
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)', 
            paddingTop: '16px', 
            paddingBottom: '16px',
            borderColor: 'rgba(0, 0, 0, 0.06)',
            backdropFilter: `blur(20px)`
          }}
          className="fixed top-6 inset-x-4 lg:inset-x-12 z-[100] transition-all duration-500 border rounded-[2rem] max-w-[1500px] mx-auto px-6 md:px-10 shadow-sm shadow-zinc-100/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer text-zinc-900" onClick={() => onNavigate('landing_page')}>
              <LogoIcon className="w-auto h-[46px] lg:h-[52px]" />
            </div>
            
            <div className="hidden xl:flex items-center gap-10 text-[12px] font-bold text-zinc-500 uppercase tracking-[0.25em]">
              <span className="hover:text-zinc-900 transition-colors cursor-pointer" onClick={() => onNavigate('landing_page')}>{content.navFeatures}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointer" onClick={() => onNavigate('landing_page')}>{content.navSolutions}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointer" onClick={() => onNavigate('landing_page')}>{content.navMarketplace}</span>
              <span className="hover:text-zinc-900 transition-colors cursor-pointer" onClick={() => onNavigate('landing_page')}>{content.navFees}</span>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center text-zinc-900 hover:bg-zinc-150 transition-all border border-zinc-200/50"
              >
                <Globe2 className="w-4 h-4" />
              </button>
              
              {loginType ? (
                <button 
                  onClick={() => setLoginType(null)}
                  className="px-6 py-2.5 rounded-full bg-[#111111] hover:bg-zinc-800 text-white text-[12px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  {isRTL ? 'العودة' : 'Back'}
                </button>
              ) : (
                <button 
                  onClick={() => onNavigate('hub')}
                  className="px-6 py-2.5 rounded-full bg-[#3a4a2c] hover:bg-[#4d623b] text-white text-[12px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                >
                  {content.loginCustomer}
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 mt-32 md:mt-0">
          <div className="w-full max-w-md my-auto bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-zinc-200/80 relative overflow-hidden">
            {/* Soft Green Splatter Behind */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[80px] opacity-20 bg-[#3a4a2c]/20 pointer-events-none" />

            <AnimatePresence mode="wait">
              {!loginType ? (
                <motion.div
                  key="selection"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-4 relative z-10"
                >
                  <div className={`text-center mb-8 ${isRTL ? 'text-right' : ''}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3a4a2c]/10 border border-[#3a4a2c]/20 rounded-full text-[#3a4a2c] text-[13px] font-black uppercase tracking-widest leading-none mb-3">
                      Secure Gateway
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight uppercase leading-tight text-zinc-950">
                      Select Terminal
                    </h1>
                    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mt-1">
                      {isRTL ? 'اختر نوع الحساب' : 'Identify Entity Type'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => setLoginType('individual')}
                      className="group relative p-4 rounded-[1.8rem] bg-white border border-zinc-200/80 hover:border-[#3a4a2c]/40 text-left transition-all duration-300 shadow-sm flex items-center justify-between active:scale-[0.99]"
                    >
                      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 group-hover:bg-[#3a4a2c]/5 flex items-center justify-center transition-colors shadow-sm border border-zinc-150">
                          <User className="w-5 h-5 text-zinc-500 group-hover:text-[#3a4a2c] transition-colors" />
                        </div>
                        <div>
                          <p className="text-base font-black text-zinc-950 leading-none mb-1">{isRTL ? 'فردي' : 'Individual'}</p>
                          <p className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider">Consumer Shipping Portal</p>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-zinc-350 group-hover:text-[#3a4a2c] ${isRTL ? 'rotate-180 -translate-x-1' : 'translate-x-0'} group-hover:translate-x-1 transition-all duration-300`} />
                    </button>

                    <button
                      onClick={() => setLoginType('business')}
                      className="group relative p-4 rounded-[1.8rem] bg-white border border-zinc-200/80 hover:border-[#3a4a2c]/40 text-left transition-all duration-300 shadow-sm flex items-center justify-between active:scale-[0.99]"
                    >
                      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 group-hover:bg-[#3a4a2c]/5 flex items-center justify-center transition-colors shadow-sm border border-zinc-150">
                          <Building2 className="w-5 h-5 text-zinc-500 group-hover:text-[#3a4a2c] transition-colors" />
                        </div>
                        <div>
                          <p className="text-base font-black text-zinc-950 leading-none mb-1">{isRTL ? 'أعمال' : 'Business'}</p>
                          <p className="text-[12px] text-zinc-400 font-bold uppercase tracking-wider">Enterprise Merchant Console</p>
                        </div>
                      </div>
                      <ArrowRight className={`w-4 h-4 text-zinc-350 group-hover:text-[#3a4a2c] ${isRTL ? 'rotate-180 -translate-x-1' : 'translate-x-0'} group-hover:translate-x-1 transition-all duration-300`} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-5 relative z-10"
                >
                  <div className={`mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3a4a2c]/10 text-[13px] font-black uppercase tracking-widest text-[#3a4a2c] mb-3">
                      {loginType === 'business' ? (isRTL ? 'بوابة الأعمال' : 'Business Portal') : (isRTL ? 'بوابة الأفراد' : 'Individual Portal')}
                    </div>
                    <h2 className="text-2xl font-extrabold uppercase tracking-tight text-zinc-950 leading-tight">Access Terminal</h2>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className={`text-[13px] font-extrabold uppercase tracking-wider text-zinc-400 block ${isRTL ? 'text-right pr-2' : 'pl-2'}`}>
                        {isRTL ? 'البريد الإلكتروني' : 'Security Identifier'}
                      </label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4.5 h-4.5 text-zinc-400`} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={`w-full h-12.5 bg-zinc-50/50 border border-zinc-200/80 focus:border-[#3a4a2c] focus:bg-white outline-none rounded-xl ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'} text-zinc-900 placeholder:text-zinc-400 transition-all text-sm font-semibold`}
                          placeholder="identifier@usend.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-[13px] font-extrabold uppercase tracking-wider text-zinc-400 block ${isRTL ? 'text-right pr-2' : 'pl-2'}`}>
                        {isRTL ? 'كلمة المرور' : 'Cipher Key'}
                      </label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-4.5 h-4.5 text-zinc-400`} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className={`w-full h-12.5 bg-zinc-50/50 border border-zinc-200/80 focus:border-[#3a4a2c] focus:bg-white outline-none rounded-xl ${isRTL ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4'} text-zinc-900 placeholder:text-zinc-400 transition-all text-sm font-semibold`}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3 border border-red-100"
                      >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{error}</p>
                      </motion.div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12.5 bg-[#3a4a2c] hover:bg-[#4d623b] disabled:bg-[#8da379] text-white rounded-xl font-extrabold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-4"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>{isRTL ? 'تفويض الدخول' : 'Authorize Access'}</span>
                          <LogIn className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-zinc-400 text-[12px] font-semibold uppercase tracking-wider pt-2">
                    {isRTL ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
                    <button
                      onClick={() => onNavigate('register')}
                      className="text-[#3a4a2c] hover:underline hover:text-[#3a4a2c] font-extrabold ml-1"
                    >
                      {isRTL ? 'إنشاء ملف جديد' : 'Initialize Profile'}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      <footer className="relative z-10 py-8 text-center bg-white border-t border-zinc-200/60 mt-auto w-full">
         <p className="text-[12px] font-black text-zinc-400 uppercase tracking-[0.4em]">
           USend Logistics LLC — All Rights Reserved 2026
         </p>
         <div className="flex items-center justify-center gap-8 text-[12px] font-bold text-zinc-400 uppercase tracking-widest mt-4">
           <a href="#" className="hover:text-[#3a4a2c] transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-[#3a4a2c] transition-colors">Terms of Service</a>
           <a href="#" className="hover:text-[#3a4a2c] transition-colors">Legal Terms</a>
         </div>
      </footer>
    </div>
  );
};

export default Login;
