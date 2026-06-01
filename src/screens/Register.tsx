import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, UserPlus, ArrowRight, AlertCircle, Loader2, Phone, ChevronLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from '../types';
import LogoIcon from '../components/LogoIcon';

interface RegisterProps {
  onNavigate: (screen: Screen) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { t, isRTL } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+971 ');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        phoneNumber: phone,
        createdAt: new Date().toISOString(),
        role: 'user'
      });

      onNavigate('onboarding');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#030612] text-white font-sans overflow-hidden relative flex flex-col ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(20,82,209,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing_page')}>
          <LogoIcon className="w-auto h-16" variant="dark" />
        </div>
        
        <button 
          onClick={() => onNavigate('login')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-8 pb-12">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-[12px] font-black uppercase tracking-widest text-brand mb-6">
                Registration Phase
              </div>
              <h2 className="text-3xl font-display font-medium uppercase tracking-tight">Initialize Profile</h2>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30 px-6">
                  Full Name
                </label>
                <div className="relative">
                  <User className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-6' : 'left-6'} w-4 h-4 text-white/20`} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`w-full h-14 bg-white/5 border border-white/5 focus:border-brand/40 focus:bg-white/10 outline-none rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-white placeholder:text-white/10 transition-all text-sm`}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30 px-6">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-6' : 'left-6'} w-4 h-4 text-white/20`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full h-14 bg-white/5 border border-white/5 focus:border-brand/40 focus:bg-white/10 outline-none rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-white placeholder:text-white/10 transition-all text-sm`}
                    placeholder="email@usend.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30 px-6">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-6' : 'left-6'} w-4 h-4 text-white/20`} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('+971 ')) {
                         if (val.length < 5) val = '+971 ';
                         else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
                      } else {
                         val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
                      }
                      if (val.length > 14) val = val.slice(0, 14);
                      setPhone(val);
                    }}
                    required
                    className={`w-full h-14 bg-white/5 border border-white/5 focus:border-brand/40 focus:bg-white/10 outline-none rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-white placeholder:text-white/10 transition-all text-sm font-mono tracking-widest`}
                    placeholder="+971 50 1234567"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-black uppercase tracking-[0.2em] text-white/30 px-6">
                  Cipher Key
                </label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-6' : 'left-6'} w-4 h-4 text-white/20`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className={`w-full h-14 bg-white/5 border border-white/5 focus:border-brand/40 focus:bg-white/10 outline-none rounded-2xl ${isRTL ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-white placeholder:text-white/10 transition-all text-sm`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-500 text-xs font-bold flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-16 bg-brand hover:bg-brand/90 disabled:bg-brand/50 text-white rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand/20 transition-all active:scale-[0.98] mt-8"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Initialize Account</span>
                    <UserPlus className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-white/30 text-xs font-medium">
              Already a member?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-brand font-bold hover:underline ml-1"
              >
                Authorize Access
              </button>
            </p>
          </motion.div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center border-t border-white/5">
        <p className="text-[12px] font-black text-white/10 uppercase tracking-[0.5em]">USend Infrastructure • 2024</p>
      </footer>
    </div>
  );
};

export default Register;
