import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';
import LogoIcon from '../components/LogoIcon';
import { Paperclip, Calendar, Loader2, User, Briefcase, ChevronLeft } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithGoogle } from '../lib/firebaseUtils';
import { useApp } from '../context/AppContext';

export default function PortalRegister({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const { setUser } = useApp();
  const [role, setRole] = useState<'Company' | 'Individual'>('Company');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Common Registration State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+971 ');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+971 ')) {
       if (val.length < 5) val = '+971 ';
       else val = '+971 ' + val.replace(/^\+?9?7?1?\s*/, '').replace(/[^0-9]/g, '');
    } else {
       val = '+971 ' + val.slice(5).replace(/[^0-9]/g, ''); 
    }
    if (val.length > 14) val = val.slice(0, 14);
    setPhone(val);
  };
  
  // Role specific State
  const [companyName, setCompanyName] = useState('');
  const [trnNumber, setTrnNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const googleUser = await signInWithGoogle();
      if (googleUser) {
        let assignedRole = role === 'Company' ? 'merchant' : 'user';
        try {
          const userDocRef = doc(db, 'users', googleUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data()?.role) {
            assignedRole = userDocSnap.data().role;
          } else {
            await setDoc(userDocRef, {
              uid: googleUser.uid,
              email: googleUser.email,
              displayName: googleUser.displayName || 'Google User',
              role: assignedRole,
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (dbErr) {
          console.warn("Firestore user sync warning:", dbErr);
        }

        setUser({
          uid: googleUser.uid,
          email: googleUser.email || '',
          role: assignedRole,
          name: googleUser.displayName || googleUser.email || 'Google User',
        });

        onNavigate(assignedRole === 'merchant' ? 'merchant_dashboard' : 'user_dashboard');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Determine what role to use
      const assignedRole = role === 'Company' ? 'merchant' : 'user';

      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        phoneNumber: phone,
        role: assignedRole,
        type: role,
        companyName: role === 'Company' ? companyName : '',
        trnNumber: role === 'Company' ? trnNumber : '',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        onNavigate(role === 'Company' ? 'merchant_dashboard' : 'user_dashboard');
      }, 500);
    } catch (err: any) {
      console.error("Portal register error: ", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] font-sans text-slate-800 flex flex-col">
      <header className="p-6 md:p-8 flex items-center justify-between z-10 w-full max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing_page')}>
           <LogoIcon className="h-10 w-auto" variant="dark" />
        </div>
        <button 
           onClick={() => onNavigate('landing_page')}
           className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold uppercase text-[12px] tracking-widest transition-colors cursor-pointer"
        >
           <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
           <div className="md:col-span-5 flex flex-col justify-center">
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Create Account</h1>
             <p className="text-slate-500 font-medium mb-6 leading-relaxed text-sm">
                Join the most advanced shipping and dispatch ecosystem. Sign in with Google or enter your details below.
             </p>
             
             {/* Google Quick Sign-In Button */}
             <button
               type="button"
               onClick={handleGoogleSignIn}
               disabled={loading}
               className="w-full h-13 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-400 text-slate-900 font-extrabold text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm active:scale-98 cursor-pointer mb-5"
             >
               <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                 <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                 <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                 <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                 <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
               </svg>
               <span>Sign in with Google</span>
             </button>

             <div className="relative mb-5">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border-t border-slate-200" />
               </div>
               <div className="relative flex justify-center text-[10px] uppercase">
                 <span className="bg-[#F4F7FA] px-3 text-slate-400 font-black tracking-widest">Or Register Manually</span>
               </div>
             </div>
             
             <form onSubmit={handleRegister} className="space-y-4">
                 <input required type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-semibold" />
                 <input required type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-semibold" />
                 <input required type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-semibold" />
                 <input required type="tel" placeholder="+971 XXXXXX" value={phone} onChange={handlePhoneChange} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all font-semibold font-mono tracking-widest" dir="ltr" />
                 
                 <button disabled={loading || success} type="submit" className="w-full py-4 mt-4 bg-brand hover:bg-[brand/90] text-white font-bold uppercase tracking-widest text-[13px] rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center h-14">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? "Account Created!" : "Register Setup"}
                 </button>
             </form>
           </div>
           
           <div className="md:col-span-7">
               {/* Document Upload Area based on user requirements */}
               <h2 className="text-brand text-3xl font-black mb-6 uppercase tracking-wider">DOCUMENTS</h2>
               
               <div className="flex gap-1 mb-0 relative z-10 w-fit">
                  <button 
                    onClick={() => setRole('Company')}
                    className={`px-8 py-2.5 rounded-t-xl font-bold text-sm tracking-wide transition-all ${role === 'Company' ? 'bg-brand text-white shadow-lg' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                  >
                    Company
                  </button>
                  <button 
                    onClick={() => setRole('Individual')}
                    className={`px-8 py-2.5 rounded-t-xl font-bold text-sm tracking-wide transition-all ${role === 'Individual' ? 'bg-brand text-white shadow-lg' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                  >
                    Individual
                  </button>
               </div>
               
               <div className="bg-white rounded-3xl rounded-tl-none p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-6">
                 <AnimatePresence mode="wait">
                    {role === 'Company' && (
                       <motion.div key="company" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
                          <h3 className="text-brand font-bold text-lg mb-2">Trade License</h3>
                          
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-brand block">Company Name</label>
                             <input type="text" placeholder="Ex: USend Logistics LLC" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full px-5 py-3 border border-[#85AEE0] rounded-full text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand/30 bg-transparent font-medium" />
                          </div>
                          
                          <div className="flex justify-end">
                            <button className="flex items-center gap-2 bg-brand hover:bg-[brand/90] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md whitespace-nowrap active:scale-95">
                               <Paperclip className="w-4 h-4" /> Attach New File
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-brand block">Expiry Date</label>
                             <div className="relative">
                               <input type="text" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} placeholder=" " className="w-full px-5 py-3 border border-[#85AEE0] rounded-full text-slate-700 outline-none focus:ring-2 focus:ring-brand/30 bg-transparent font-medium" />
                               <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                             </div>
                             <p className="text-[12px] font-semibold text-[#85AEE0] pt-1 px-2 uppercase tracking-wide">DD/MM/YYYY</p>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-brand block">TRN Number</label>
                             <input type="text" placeholder="Ex: 1234567890" value={trnNumber} onChange={e => setTrnNumber(e.target.value)} className="w-full px-5 py-3 border border-[#85AEE0] rounded-full text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand/30 bg-transparent font-medium" />
                          </div>
                          
                          <div className="flex justify-end pt-4">
                            <button type="button" className="bg-[#B3D4F5] hover:bg-[#9DC8F1] text-white px-10 py-3 block rounded-full font-bold text-sm transition-all">
                              Save
                            </button>
                          </div>
                       </motion.div>
                    )}
                    
                    {role === 'Individual' && (
                       <motion.div key="individual" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="space-y-6">
                          <h3 className="text-brand font-bold text-lg mb-4">Emirates ID</h3>
                          
                          <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-[brand/90] text-white px-4 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95">
                               <Paperclip className="w-4 h-4" /> Attach Emirates ID (Front)
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-brand hover:bg-[brand/90] text-white px-4 py-3 rounded-full font-bold text-sm transition-all shadow-md active:scale-95">
                               <Paperclip className="w-4 h-4" /> Attach Emirates ID (Back)
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-brand block">Expiry Date</label>
                             <div className="relative">
                               <input type="text" placeholder=" " className="w-full px-5 py-3 border border-[#85AEE0] rounded-full text-slate-700 outline-none focus:ring-2 focus:ring-brand/30 bg-transparent font-medium" />
                               <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                             </div>
                             <p className="text-[12px] font-semibold text-[#85AEE0] pt-1 px-2 uppercase tracking-wide">DD/MM/YYYY</p>
                          </div>
                          
                          <div className="flex justify-end pt-12">
                            <button type="button" className="bg-[#B3D4F5] hover:bg-[#9DC8F1] text-white px-10 py-3 block rounded-full font-bold text-sm transition-all">
                              Save
                            </button>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
               </div>
           </div>
        </div>
      </main>
    </div>
  );
}
