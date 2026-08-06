const fs = require('fs');

const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for shipment.png
content = content.replace(
  "import heroTruck from '../assets/hero-truck.png';",
  "import heroTruck from '../assets/hero-truck.png';\nimport shipmentImg from '../assets/shipment.png';"
);

// 2. Add state for image slider
const stateHookPos = content.indexOf('const [botOpen, setBotOpen] = useState(false);');
const sliderState = `  const [heroImageIdx, setHeroImageIdx] = useState(0);\n  const heroImages = [shipmentImg, heroTruck, ctaCargoShip];\n\n  useEffect(() => {\n    const interval = setInterval(() => {\n      setHeroImageIdx(prev => (prev + 1) % heroImages.length);\n    }, 4000);\n    return () => clearInterval(interval);\n  }, [heroImages.length]);\n\n`;
content = content.substring(0, stateHookPos) + sliderState + content.substring(stateHookPos);

// 3. Replace the entire Hero block
const startHero = '{/* ─── HERO ─── Sky outer wrapper + rounded blue card inside (matching reference) */}';
const endHero = '{/* end sky wrapper */}';

const startIndex = content.indexOf(startHero);
const endIndex = content.indexOf(endHero) + endHero.length;

const newHero = `
      {/* ─── HERO ─── */}
      <div className="w-full relative z-10 bg-white pt-4">
        {/* ── NAV inside card ── */}
        <nav className="relative z-50 flex items-center justify-between px-6 md:px-10 py-5 bg-white">
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

        {/* SWIFTMOVE giant watermark behind content */}
        <div className="absolute inset-x-0 bottom-32 text-center select-none pointer-events-none z-0 overflow-hidden leading-none">
          <span
            className="text-[22vw] font-black tracking-widest uppercase block font-sans"
            style={{ color: 'rgba(0,0,0,0.02)' }}
          >
            SWIFTMOVE
          </span>
        </div>

        {/* ── Hero body ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 md:px-10 pt-16 pb-0">
          <h1 className="text-3xl sm:text-4xl md:text-[3rem] font-black text-slate-900 leading-[1.1] tracking-tight max-w-4xl mx-auto font-sans">
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
              className="px-8 py-4 bg-white text-slate-700 hover:text-slate-900 border-2 border-slate-200 hover:border-slate-300 text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isRTL ? 'احصل على تسعيرة' : 'Get a Quote'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Slider image */}
          <div className="w-full max-w-5xl mx-auto mt-16 relative z-10 h-[300px] md:h-[450px] lg:h-[550px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={heroImageIdx}
                src={heroImages[heroImageIdx]}
                alt="SwiftMove Freight"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full h-full object-contain select-none drop-shadow-2xl"
              />
            </AnimatePresence>
            
            {/* Slider Dots */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroImageIdx(idx)}
                  className={\`w-2.5 h-2.5 rounded-full transition-all cursor-pointer \${idx === heroImageIdx ? 'bg-[#2563EB] scale-125' : 'bg-slate-300 hover:bg-slate-400'}\`}
                  aria-label={\`Go to slide \${idx + 1}\`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
`;

content = content.substring(0, startIndex) + newHero + content.substring(endIndex);

fs.writeFileSync(path, content, 'utf8');
console.log('Hero section replaced successfully');
