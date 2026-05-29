import { motion } from 'motion/react';
import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { User, Building2, CreditCard, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantSettingsProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantSettings({ onNavigate }: MerchantSettingsProps) {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'bank'>('profile');

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_settings" onNavigate={onNavigate} />
      
      <main className="flex-1 p-4 md:p-8 h-full overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100">{t('settings') || 'Settings & Verification'}</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">{t('settings_desc') || 'Manage your store profile, KYC documents, and bank details.'}</p>
          </div>

          {/* Custom Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            {[
              { id: 'profile', icon: Building2, label: t('store_profile') || 'Store Profile' },
              { id: 'kyc', icon: ShieldCheck, label: t('kyc_documents') || 'KYC Documents' },
              { id: 'bank', icon: CreditCard, label: t('bank_details') || 'Bank Details' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'profile' | 'kyc' | 'bank')}
                className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">{t('store_info') || 'Store Information'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('store_name') || 'Store Name'}</label>
                      <input type="text" defaultValue="USend Electronic Store" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('phone')}</label>
                      <input type="text" defaultValue="+971 50 123 4567" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('address') || 'Business Address'}</label>
                      <input type="text" defaultValue="Dubai Silicon Oasis, UAE" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold">{t('save_changes') || 'Save Changes'}</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'kyc' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center py-12">
                   <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-4">
                     <CheckCircle2 className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('kyc_verified') || 'Account Verified'}</h3>
                   <p className="text-zinc-500 dark:text-zinc-400 max-w-sm">{t('kyc_verified_desc') || 'Your Commercial License and Emirates ID have been successfully verified.'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                         <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{t('commercial_license') || 'Commercial License'}</h4>
                         <p className="text-xs text-zinc-500 mt-1">Uploaded on 12 Jan 2026</p>
                      </div>
                      <div className="text-blue-500 flex items-center gap-1 text-sm font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg">
                         <CheckCircle2 className="w-4 h-4" /> Verified
                      </div>
                   </div>
                   <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <div>
                         <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{t('owner_id') || 'Emirates ID (Owner)'}</h4>
                         <p className="text-xs text-zinc-500 mt-1">Uploaded on 12 Jan 2026</p>
                      </div>
                      <div className="text-blue-500 flex items-center gap-1 text-sm font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg">
                         <CheckCircle2 className="w-4 h-4" /> Verified
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bank' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">{t('bank_account_details') || 'Bank Account Details'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('bank_name') || 'Bank Name'}</label>
                      <input type="text" defaultValue="Emirates NBD" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('account_name') || 'Account Holder Name'}</label>
                      <input type="text" defaultValue="USend Electronic LLC" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('iban') || 'IBAN'}</label>
                      <input type="text" defaultValue="AE00 0000 0000 0000 0000 000" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('swift_code') || 'SWIFT Code'}</label>
                      <input type="text" defaultValue="EBIZAEAD" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">{t('account_number') || 'Account Number'}</label>
                      <input type="text" defaultValue="1010101010" className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-xl px-4 py-3 outline-none text-zinc-900 dark:text-zinc-100 font-mono" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-xl font-bold">{t('update_bank') || 'Update Bank Details'}</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
