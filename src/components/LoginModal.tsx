import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, X, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
      const isAdmin = targetRole === 'admin' || cred.user.email?.toLowerCase() === 'amro-samman@hotmail.com';
      
      if (isAdmin) {
        // Admin credentials can access merchant dashboard or admin dashboard
        redirectScreen = selectedRole === 'merchant' ? 'merchant_dashboard' : 'admin_dashboard';
      } else if (targetRole === 'user' || (targetRole as string) === 'Individual' || (targetRole as string) === 'driver') {
        redirectScreen = 'user_dashboard';
      } else {
        redirectScreen = 'merchant_dashboard';
      }

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-white text-slate-900 border border-slate-200 rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden z-10 select-none"
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

            
            {selectedRole !== 'admin' && defaultRole !== 'admin' && (
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
                  className="p-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[15px] font-semibold flex items-start gap-2.5"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <p className="leading-relaxed">{error}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 mt-6 bg-[#113f36] hover:bg-slate-900 disabled:bg-slate-300 text-white transition-all duration-300 font-extrabold uppercase tracking-widest text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-[#113f36]/20 active:scale-98 cursor-pointer"
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
              <span className="uppercase text-[15px]">Secure Session</span>
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
