import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Screen } from './types';
import LogoIcon from './LogoIcon';

interface FooterProps {
  onNavigate: (screen: Screen) => void;
  setLoginRole: (role: any) => void;
  setLoginEmail: (email: string) => void;
  setLoginModalOpen: (open: boolean) => void;
  content: any;
}

export default function Footer({ onNavigate, setLoginRole, setLoginEmail, setLoginModalOpen, content }: FooterProps) {
  const { isRTL } = useLanguage();

  return (
    {/* WATERMARK FOOTER SECTION - Full Width */}
        <footer className="w-full bg-white text-slate-900 pt-24 pb-16 px-4 md:px-8 border-t border-slate-200 relative overflow-hidden">
          {/* Large transparent watermark background logo */}
          <div className="absolute inset-x-0 bottom-4 text-center select-none pointer-events-none z-0">
            <span className="text-[15vw] font-black tracking-widest text-slate-900/[0.03] uppercase leading-none block font-sans">
              {isRTL ? 'يوسند' : 'USEND'}
            </span>
          </div>

          <div className="max-w-7xl mx-auto space-y-16 relative z-10">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-start">
              
              <div className="space-y-6 md:col-span-2">
                <div className="flex items-center gap-3">
                  <LogoIcon className="h-12 w-auto" />
                  <div className="flex flex-col text-start">
                    <span className="text-sm font-black tracking-widest text-slate-900 uppercase leading-none">{isRTL ? 'يو سند' : 'USend'}</span>
                    <span className="text-[12px] font-bold uppercase text-slate-700 tracking-wider leading-none mt-1">{isRTL ? 'الشحن الذكي' : 'Smart Shipping'}</span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed max-w-md font-semibold font-sans">
                  {isRTL 
                    ? 'خدمات لوجستية ونقل متكاملة مبنية للشركات التي تطلب السرعة والدقة ومتابعة فورية لسلاسل الإمداد.' 
                    : 'Global logistics and transportation built for businesses that demand speed, precision, and real-time supply chain visibility.'}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-black uppercase text-slate-800 tracking-widest font-sans">{isRTL ? 'بوابات المنظومة' : 'Connect Hubs'}</h4>
                <ul className="space-y-2 text-[13px] font-bold text-slate-600 font-sans">
                  <li>
                    <span 
                      className="hover:text-[#113f36] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('user');
                        setLoginEmail('user@usend.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      {isRTL ? 'بوابة الأفراد' : 'Individual Terminal'}
                    </span>
                  </li>
                  <li>
                    <span 
                      className="hover:text-[#113f36] transition-colors cursor-pointer" 
                      onClick={() => {
                        setLoginRole('merchant');
                        setLoginEmail('merchant@usend.com');
                        setLoginModalOpen(true);
                      }}
                    >
                      {isRTL ? 'لوحة تحكم التجار' : 'Merchant Control Panel'}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[13px] font-black uppercase text-slate-800 tracking-widest font-sans">{isRTL ? 'بوابات الإدارة' : 'Corporate Parameters'}</h4>
                <ul className="space-y-2 text-[13px] font-bold text-slate-600 font-sans">
                  <li><span className="hover:text-[#113f36] transition-colors cursor-pointer" onClick={() => { setLoginRole('admin'); setLoginModalOpen(true); }}>{isRTL ? 'بوابة المسؤول الإقليمي' : 'Zonal Admin Portal'}</span></li>
                  <li><a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'سجلات الأمان' : 'Safety Logs'}</a></li>
                  <li><a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'مفاتيح الربط البرمجي (API)' : 'API Keys'}</a></li>
                </ul>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-200 text-[13px] font-black text-slate-500 uppercase tracking-widest font-sans">
              <p>{content.copyright}</p>
              <div className="flex items-center gap-8">
                <a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
                <a href="#" className="hover:text-[#113f36] transition-colors">{isRTL ? 'شروط الخدمة' : 'Service Terms'}</a>
              </div>
            </div>

          </div>
        </footer>
  );
}
