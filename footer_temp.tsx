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

      {/* FLOAT CHATBOT DIALOGUE - USend AI */}
      <AnimatePresence>
        {botOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-24 ${isRTL ? 'left-4 md:left-8' : 'right-4 md:right-8'} z-50 w-[330px] md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col`}
          >
             {/* Header */}
             <div className="bg-slate-900 p-5 text-white flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#113f36]/10 flex items-center justify-center border border-[#113f36]/20 text-[#113f36] animate-bounce">
                    <AiFace3DIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs uppercase tracking-wide font-sans">{isRTL ? 'يو سند الدعم الفني' : 'USend AI Support'}</h3>
                    <p className="text-[12px] text-cyan-400 font-bold uppercase tracking-widest font-mono">{isRTL ? 'الحالة: نشط' : 'Status: active'}</p>
                  </div>
                </div>
                <button onClick={() => setBotOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors text-slate-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
             </div>
             
             {/* Chat Messages */}
             <div className="flex-1 p-5 max-h-[300px] overflow-y-auto bg-slate-50 space-y-4">
               {botMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div 
                     className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-semibold leading-relaxed ${
                       msg.sender === 'user' 
                         ? 'bg-[#113f36] text-white rounded-br-none' 
                         : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs'
                     }`}
                     style={{ whiteSpace: 'pre-line' }}
                   >
                     {msg.text}
                   </div>
                 </div>
               ))}
             </div>

             {/* Input form */}
             <form onSubmit={handleBotSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                <input 
                  type="text" 
                  value={botInput}
                  onChange={(e) => setBotInput(e.target.value)}
                  placeholder="Enter order REQ-... or ask standard rates"
                  className="flex-1 outline-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#113f36] transition-all font-semibold"
                />
                <button type="submit" className="w-11 h-11 bg-slate-900 hover:bg-[#113f36] text-white rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0">
                  <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Buttons layout */}
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-40 flex items-center gap-3`}>
        
        {/* Toggle bot button */}
        <button
          onClick={() => setBotOpen(!botOpen)}
          className="px-5 py-3 rounded-full bg-slate-900 hover:bg-[#113f36] text-white border border-slate-700 shadow-xl items-center gap-2.5 transition-all text-[13px] font-black uppercase tracking-widest flex hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer"
          id="docked-bot-trigger"
        >
          <AiFace3DIcon className="w-6 h-6 text-[#6d8c55] rotate-12" />
        </button>

        {/* Back To Top Button */}
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-md text-slate-850 flex items-center justify-center hover:bg-[#113f36] hover:text-white transition-all select-none cursor-pointer"
              title="Back To Top"
              id="back-to-top-btn"
            >
              <ArrowUp className="w-4.5 h-4.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        defaultRole={loginRole} 
        onNavigate={onNavigate} 
      />
    </div>
  );
};

export default LandingPage;