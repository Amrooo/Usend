import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, X, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signInWithGoogle } from '../lib/firebaseUtils';
import { Screen } from '../types';
import { useApp } from '../context/AppContext';
import LogoIcon from './LogoIcon';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'admin' | 'merchant' | 'user' | 'driver';
  onNavigate: (screen: Screen) => void;
}

export default function LoginModal({ isOpen, onClose, defaultRole, onNavigate }: LoginModalProps) {
  const { setUser } = useApp();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedRole(defaultRole);
      setError(null);
      setPassword('');
      setEmail('');
    }
  }, [isOpen, defaultRole]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        let targetRole = selectedRole === 'merchant' ? 'merchant' : 'user';

        try {
          const userDocRef = doc(db, 'users', googleUser.uid);
          await setDoc(userDocRef, {
            uid: googleUser.uid,
            email: googleUser.email,
            displayName: googleUser.displayName || 'Google User',
            role: targetRole,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore user sync warning:", dbErr);
        }

        setUser({
          uid: googleUser.uid,
          email: googleUser.email || '',
          role: targetRole,
          name: googleUser.displayName || googleUser.email || 'Google User',
        });

        let redirectScreen: Screen = 'user_dashboard';
        if (targetRole === 'merchant') redirectScreen = 'merchant_dashboard';
        else redirectScreen = 'user_dashboard';

        onClose();
        onNavigate(redirectScreen);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Authenticate
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user role from Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let targetRole = selectedRole;
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.role) {
          targetRole = data.role;
        }
      }
      let redirectScreen: Screen = 'merchant_dashboard';
      if (targetRole === 'user' || (targetRole as string) === 'Individual' || (targetRole as string) === 'driver') redirectScreen = 'user_dashboard';

      onClose();
      onNavigate(redirectScreen);
    } catch (err: any) {
      console.warn("Authentication error: ", err.message);
      setError(err.message || "Failed to login. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white text-slate-900 border border-slate-200 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative overflow-hidden z-10 select-none animate-in fade-in zoom-in duration-200"
          >
            {/* Elegant Background Light Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#113f36]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header close button */}
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all focus:outline-hidden border border-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Logo & Title block */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <LogoIcon className="h-10 w-auto" />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#113f36]/5 border border-[#113f36]/10 text-[#113f36] text-[11px] font-black uppercase tracking-widest font-sans">
                  USend Shipping Portal
                </span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 pt-1">
                  {defaultRole === 'admin' ? 'Sign In as Administrator' : 'Access Your Portal'}
                </h3>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">
                  Connect your account to coordinate merchant deliveries, manage shipments, or active fleet routes.
                </p>
              </div>
            </div>

            
            {selectedRole !== 'admin' && (
              <div className="flex items-center gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSelectedRole('merchant')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${selectedRole === 'merchant' ? 'bg-white text-[#113f36] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('user')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${selectedRole === 'user' ? 'bg-white text-[#113f36] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  User
                </button>
              </div>
            )}

            {/* Google Quick Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-3 transition-all shadow-xs active:scale-98 cursor-pointer mb-5"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">Or Sign In with Email</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider pl-1.5 block text-zinc-400">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-12.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 focus:ring-2 focus:ring-[#113f36] focus:outline-hidden tracking-normal text-xs font-semibold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-black text-slate-500 uppercase tracking-wider pl-1.5 block text-zinc-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-12.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-11 pr-4 focus:ring-2 focus:ring-[#113f36] focus:outline-hidden tracking-widest text-xs font-semibold transition-all"
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[13px] font-semibold flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 mt-6 bg-[#113f36] hover:bg-slate-900 disabled:bg-slate-300 text-white transition-all duration-300 font-extrabold uppercase tracking-widest text-[13px] rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-[#113f36]/20 active:scale-98 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex justify-between items-center text-[12px] font-bold text-slate-400 tracking-widest">
              <span className="uppercase text-[13px]">Secure Session</span>
              <button 
                onClick={() => {
                  onClose();
                  onNavigate('portal_register');
                }}
                className="text-[#113f36] hover:text-[#113f36]/80 hover:underline uppercase transition-all"
              >
                Create Account
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
