const fs = require('fs');

const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update heroImages to remove heroTruck
content = content.replace(
  "const heroImages = [shipmentImg, heroTruck, ctaCargoShip];",
  "const heroImages = [shipmentImg, ctaCargoShip, sectorContainer];"
);

// 2. Replace the Hero block
const startHero = '{/* ─── HERO ─── */}';
const endHero = '{/* TIMELINE SECTION - Full Width */}';

const startIndex = content.indexOf(startHero);
const endIndex = content.indexOf(endHero);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find section boundaries");
  process.exit(1);
}

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
              onClick={() => setGuestModalOpen(true)}
              className="px-5 py-2 rounded-full bg-[#2563EB] text-white hover:bg-blue-600 font-bold transition-all cursor-pointer shadow-sm"
            >
              {isRTL ? 'طلب تسعيرة' : 'Get a Quote'}
            </button>
          </div>
        </nav>

        {/* ── Header Slider Section ── */}
        <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-8 mt-6">
           <div className="w-full h-[300px] md:h-[500px] rounded-[2rem] overflow-hidden relative shadow-sm">
              <AnimatePresence mode="wait">
                <motion.img
                  key={heroImageIdx}
                  src={heroImages[heroImageIdx]}
                  alt="SwiftMove Freight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                  className="w-full h-full object-cover select-none"
                />
              </AnimatePresence>
              
              <div className="absolute inset-0 bg-slate-900/10 pointer-events-none"></div>
              
              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2 z-20">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroImageIdx(idx)}
                    className={\`w-2 h-2 rounded-full transition-all cursor-pointer \${idx === heroImageIdx ? 'bg-white scale-150' : 'bg-white/50 hover:bg-white/80'}\`}
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
        <div className="relative z-10 flex flex-col items-center text-center px-6 md:px-10 pt-16 pb-0">
          <h1 className="text-3xl sm:text-4xl md:text-[3.5rem] font-black text-slate-950 leading-[1.1] tracking-tight max-w-4xl mx-auto font-sans">
            {isRTL
              ? 'حلول مخصصة لمتطلبات عملك — النقل البري والجوي والبحري موحد على منصة ذكية واحدة.'
              : 'Tailored solutions for your business requirements — road, air, and ocean freight unified on a single platform.'}
          </h1>
          
          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setGuestModalOpen(true)}
              className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {isRTL ? 'ابدأ طلبك الآن' : 'Start your order now'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setGuestModalOpen(true)}
              className="px-8 py-4 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isRTL ? 'احصل على تسعيرة' : 'Get a Quote'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Truck image (Restored) */}
          <div className="w-full max-w-5xl mx-auto mt-16 relative z-10">
            <img
              src={heroTruck}
              alt="SwiftMove Cargo Delivery Truck"
              className="w-full h-auto block select-none"
            />
          </div>
        </div>
      </div>
      
      `;

content = content.substring(0, startIndex) + newHero + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');
console.log('Hero section and slider updated successfully');
