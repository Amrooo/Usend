const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const endHero = '{/* TIMELINE SECTION - Full Width */}';
const endIndex = content.indexOf(endHero);

const newHero = `
      {/* ─── HERO ─── */}
      <div className="w-full relative z-10 bg-white">
        {/* ── NAV ── */}
        <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 bg-white border-b border-slate-100">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <LogoIcon className="h-7 w-auto" variant="dark" />
            <span className="text-lg font-black text-slate-900 tracking-tight">SwiftMove</span>
          </div>
          
          {/* Links */}
          <div className="hidden md:flex items-center gap-7 text-[13px] font-bold text-slate-600">
            <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-slate-900">{isRTL ? 'الرئيسية' : 'Home'}</a>
            <a href="#services"  onClick={(e) => handleScrollTo(e, 'services')}  className="hover:text-slate-900 transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
            <a href="#solutions" onClick={(e) => handleScrollTo(e, 'solutions')} className="hover:text-slate-900 transition-colors">{isRTL ? 'الحلول' : 'Solutions'}</a>
            <a href="#sectors"   onClick={(e) => handleScrollTo(e, 'sectors')}   className="hover:text-slate-900 transition-colors">{isRTL ? 'الشبكة' : 'Network'}</a>
            <a href="#about"     onClick={(e) => handleScrollTo(e, 'about')}     className="hover:text-slate-900 transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
            <a href="#faq"       onClick={(e) => handleScrollTo(e, 'faq')}       className="hover:text-slate-900 transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-4 text-[13px]">
            <button
              onClick={() => setBotOpen(true)}
              className="hidden sm:block text-slate-600 hover:text-slate-900 transition-colors cursor-pointer font-bold"
            >
              {isRTL ? 'تتبع الشحنة' : 'Track Shipment'}
            </button>
            <button
              onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-5 py-2 rounded-full bg-[#2563EB] text-white hover:bg-blue-600 font-bold transition-all cursor-pointer shadow-sm"
            >
              {isRTL ? 'طلب تسعيرة' : 'Get a Quote'}
            </button>
          </div>
        </nav>

        {/* ── Header Slider Section ── */}
        <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
           <div className="w-full h-[400px] md:h-[550px] rounded-[2.5rem] overflow-hidden relative shadow-sm">
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroSlideIdx}
                  src={heroSlides[heroSlideIdx].image}
                  alt="SwiftMove Freight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="absolute inset-0 w-full h-full object-cover select-none"
                />
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-slate-900/40 pointer-events-none"></div>
              
              {/* Slider Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={heroSlideIdx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="max-w-4xl"
                  >
                    <h1 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black text-white leading-[1.15] tracking-tight font-sans drop-shadow-md">
                      {isRTL ? heroSlides[heroSlideIdx].titleAr : heroSlides[heroSlideIdx].titleEn}
                    </h1>
                    <p className="mt-4 text-white/90 font-medium text-sm md:text-lg max-w-2xl mx-auto drop-shadow-sm">
                      {isRTL ? heroSlides[heroSlideIdx].descAr : heroSlides[heroSlideIdx].descEn}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroSlideIdx(idx)}
                    className={\`w-2.5 h-2.5 rounded-full transition-all cursor-pointer \${idx === heroSlideIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}\`}
                    aria-label={\`Go to slide \${idx + 1}\`}
                  />
                ))}
              </div>
           </div>
        </div>

        {/* SWIFTMOVE giant watermark behind content */}
        <div className="absolute inset-x-0 bottom-64 text-center select-none pointer-events-none z-0 overflow-hidden leading-none">
          <span
            className="text-[22vw] font-black tracking-widest uppercase block font-sans"
            style={{ color: 'rgba(0,0,0,0.02)' }}
          >
            SWIFTMOVE
          </span>
        </div>

        {/* ── Hero body ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 md:px-10 pt-10 pb-0">
          
          {/* Embedded Guest Order Wizard */}
          <div className="w-full max-w-4xl mx-auto mt-16 relative z-10 text-left mb-24" id="order-wizard">
            <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#2563EB] via-indigo-600 to-blue-500"></div>
              <div className="p-6 md:p-10">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{isRTL ? 'إرسال شحنة كضيف' : 'Quick Guest Dispatch'}</h2>
                  <p className="text-slate-500 mt-2 font-medium">{isRTL ? 'لا يلزم تسجيل الدخول، ابدأ الشحن على الفور.' : 'No login required, start shipping instantly.'}</p>
                </div>
                <OrderWizard 
                  onNavigate={onNavigate} 
                  isGuest={true} 
                  onRequestLogin={() => { setLoginRole('user'); setLoginModalOpen(true); }} 
                />
              </div>
            </div>
          </div>
          
          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {isRTL ? 'ابدأ طلبك الآن' : 'Start your order now'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="px-8 py-4 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isRTL ? 'احصل على تسعيرة' : 'Get a Quote'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
`;

const startIndex = content.indexOf('{/* ─── HERO ─── */}');

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newHero + content.substring(endIndex);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Replaced hero top block cleanly.");
} else {
    console.log("Could not find boundaries.");
}
