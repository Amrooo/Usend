import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, UserPlus, ArrowRight, AlertCircle, Loader2, Phone, ChevronLeft } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signInWithGoogle } from '../lib/firebaseUtils';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Screen } from '../types';
import LogoIcon from '../components/LogoIcon';

interface RegisterProps {
  onNavigate: (screen: Screen) => void;
}

const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { t, isRTL } = useLanguage();
  const { setUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+971 ');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        let targetRole = 'user';
        try {
          const userDocRef = doc(db, 'users', googleUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.role) {
            targetRole = userDocSnap.data().role;
          } else {
            await setDoc(userDocRef, {
              uid: googleUser.uid,
              email: googleUser.email,
              displayName: googleUser.displayName || 'Google User',
              role: targetRole,
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn("Firestore user sync warning:", dbErr);
        }

        setUser({
          uid: googleUser.uid,
          email: googleUser.email || '',
          role: targetRole,
          name: googleUser.displayName || googleUser.email || 'Google User',
        });

        onNavigate('user_dashboard');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

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
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
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

            {/* Google Quick Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-2xl flex items-center justify-center gap-3 transition-all shadow-md active:scale-98 cursor-pointer mb-6"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isRTL ? 'تسجيل الدخول بواسطة Google' : 'Sign in with Google'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-[#030612] px-3 text-white/40 font-black tracking-widest">{isRTL ? 'أو أنشئ حساب يدوي' : 'Or Register Manually'}</span>
              </div>
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
