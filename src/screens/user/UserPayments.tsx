import { motion } from 'motion/react';
import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { CreditCard, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useState } from 'react';

interface UserPaymentsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function UserPayments({ onNavigate }: UserPaymentsProps) {
  const { t, isRTL } = useLanguage();
  const [showAddCard, setShowAddCard] = useState(false);

  const cards = [
    { id: 'card-1', last4: '4242', brand: 'Visa', exp: '12/26', isDefault: true },
    { id: 'card-2', last4: '8888', brand: 'Mastercard', exp: '08/25', isDefault: false },
  ];

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_payments" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100">{t('payments') || 'Payment Methods'}</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t('manage_cards') || 'Manage your saved credit & debit cards.'}</p>
            </div>
            <div className="flex gap-3">
               <button 
                 onClick={() => setShowAddCard(true)}
                 className="bg-brand text-white px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
               >
                 <Plus className="w-5 h-5" />
                 {t('add_card') || 'Add New Card'}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {cards.map(card => (
               <div key={card.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 relative overflow-hidden group">
                 {card.isDefault && (
                   <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'}`}>
                     <span className="bg-blue-50 text-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Primary Card
                     </span>
                   </div>
                 )}
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-14 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                     <CreditCard className="w-6 h-6 text-zinc-400" />
                   </div>
                   <div>
                     <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100">•••• •••• •••• {card.last4}</p>
                     <p className="text-sm font-medium text-zinc-500">{card.brand} — Expires {card.exp}</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   {!card.isDefault && (
                     <button className="flex-1 py-2 font-bold text-sm text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
                       Set as Primary
                     </button>
                   )}
                   <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
               </div>
             ))}
          </div>
        </motion.div>
      </main>

      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddCard(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}
          >
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">{t('add_card') || 'Add New Card'}</h2>
              
              <div className="space-y-4 mt-6">
                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="0000 0000 0000 0000" 
                      className="w-full bg-zinc-50 border-2 border-transparent focus:border-brand rounded-2xl px-4 py-3 outline-none text-zinc-900 font-bold transition-colors"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Expiry</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          className="w-full bg-zinc-50 border-2 border-transparent focus:border-brand rounded-2xl px-4 py-3 outline-none text-zinc-900 font-bold transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">CVV</label>
                        <input 
                          type="password" 
                          placeholder="123" 
                          className="w-full bg-zinc-50 border-2 border-transparent focus:border-brand rounded-2xl px-4 py-3 outline-none text-zinc-900 font-bold transition-colors"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 block">Cardholder Name</label>
                    <input 
                      type="text" 
                      placeholder="Name on card" 
                      className="w-full bg-zinc-50 border-2 border-transparent focus:border-brand rounded-2xl px-4 py-3 outline-none text-zinc-900 font-bold transition-colors"
                    />
                 </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 py-4 font-bold text-zinc-500 hover:bg-zinc-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowAddCard(false)}
                  className="flex-[2] py-4 bg-brand hover:bg-brand/90 text-white rounded-2xl font-bold shadow-lg shadow-brand/20 transition-all active:scale-95"
                >
                  Save Card
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
