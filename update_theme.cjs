const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSlidesStr = `  const heroSlides = [
    {
      image: ctaCargoShip,
      titleEn: 'Tailored solutions for your business requirements.',
      titleAr: 'حلول مخصصة لمتطلبات عملك.',
      descEn: 'Road, air, and ocean freight unified on a single platform adapted for UAE business.',
      descAr: 'النقل البري والجوي والبحري موحد على منصة ذكية واحدة مخصصة للأعمال في الإمارات.',
    },
    {
      image: shipmentImg,
      titleEn: 'Seamless Inter-Emirate Delivery Network.',
      titleAr: 'شبكة توصيل سلسة بين الإمارات.',
      descEn: 'Fast and reliable domestic shipping across all seven Emirates.',
      descAr: 'شحن محلي سريع وموثوق عبر جميع الإمارات السبع.',
    }
  ];`;

const newSlidesStr = `  const heroSlides = [
    {
      image: ctaCargoShip,
      titleEn: 'Taking your cargo further, faster, and more securely',
      titleAr: 'نأخذ شحنتك إلى أبعد من ذلك، أسرع، وبأمان أكبر',
      descEn: 'We are your dependable partner for delivering your precious items and ensuring your products reach their destination safely.',
      descAr: 'نحن شريكك الموثوق به لتسليم أغراضك الثمينة وضمان وصول منتجاتك إلى وجهتها بأمان.',
    },
    {
      image: shipmentImg,
      titleEn: 'Seamless Inter-Emirate Delivery Network',
      titleAr: 'شبكة توصيل سلسة بين الإمارات',
      descEn: 'Fast and reliable domestic shipping across all seven Emirates.',
      descAr: 'شحن محلي سريع وموثوق عبر جميع الإمارات السبع.',
    }
  ];`;

content = content.replace(oldSlidesStr, newSlidesStr);


const startHero = '{/* ─── HERO ─── */}';
const endHero = '{/* TIMELINE SECTION - Full Width */}';
const startIndex = content.indexOf(startHero);
const endIndex = content.indexOf(endHero);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find section boundaries");
  process.exit(1);
}

const newHero = `      {/* ─── HERO ─── */}
      <div className="w-full relative z-10 bg-white p-2 md:p-4 pb-0">
        <div className="relative w-full h-[600px] md:h-[750px] rounded-[2rem] overflow-hidden shadow-sm">
          
          {/* Background Slider */}
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
          
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent pointer-events-none"></div>
          
          {/* ── FLOATING NAV ── */}
          <nav className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 py-6">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <LogoIcon className="h-7 w-auto text-white" variant="light" />
              <span className="text-lg font-black text-white tracking-tight">SwiftMove</span>
            </div>
            
            {/* Pill Links */}
            <div className="hidden md:flex items-center gap-6 text-[13px] font-medium text-white bg-white/10 backdrop-blur-md px-8 py-3 rounded-full border border-white/20">
              <a href="#landing-root" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#fbbf24] transition-colors">{isRTL ? 'الرئيسية' : 'Home'}</a>
              <a href="#services"  onClick={(e) => handleScrollTo(e, 'services')}  className="hover:text-[#fbbf24] transition-colors">{isRTL ? 'الخدمات' : 'Services'}</a>
              <a href="#solutions" onClick={(e) => handleScrollTo(e, 'solutions')} className="hover:text-[#fbbf24] transition-colors">{isRTL ? 'الحلول' : 'Resources'}</a>
              <a href="#about"     onClick={(e) => handleScrollTo(e, 'about')}     className="hover:text-[#fbbf24] transition-colors">{isRTL ? 'من نحن' : 'About'}</a>
              <a href="#faq"       onClick={(e) => handleScrollTo(e, 'faq')}       className="hover:text-[#fbbf24] transition-colors">{isRTL ? 'اتصل بنا' : 'Contact'}</a>
            </div>

            {/* Right CTA */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="px-6 py-2.5 rounded-lg bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold transition-all cursor-pointer shadow-sm text-[13px] flex items-center gap-2"
              >
                {isRTL ? 'طلب تسعيرة' : 'Get Started'}
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </nav>

          {/* ── Hero Content ── */}
          <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-24 z-10 max-w-5xl pt-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlideIdx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-[5rem] font-light text-white leading-[1.05] tracking-tight font-sans drop-shadow-lg">
                  {isRTL ? heroSlides[heroSlideIdx].titleAr : heroSlides[heroSlideIdx].titleEn}
                </h1>
                <p className="mt-6 text-white font-bold text-base md:text-xl max-w-2xl drop-shadow-md">
                  {isRTL ? heroSlides[heroSlideIdx].descAr : heroSlides[heroSlideIdx].descEn}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 mt-10">
                  <button
                    onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="bg-[#ea580c] hover:bg-[#c2410c] text-white px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors shadow-lg cursor-pointer"
                  >
                    {isRTL ? 'ابدأ طلبك الآن' : 'Air Schedule'}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setBotOpen(true)}
                    className="bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-900 px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 transition-colors shadow-lg cursor-pointer"
                  >
                    {isRTL ? 'تتبع الشحنة' : 'Air Tracking'}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Slider Dots */}
            <div className="absolute bottom-10 left-6 md:left-24 flex items-center gap-2 z-20">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroSlideIdx(idx)}
                  className={\`w-12 h-1.5 rounded-full transition-all cursor-pointer \${idx === heroSlideIdx ? 'bg-[#ea580c]' : 'bg-white/30 hover:bg-white/50'}\`}
                  aria-label={\`Go to slide \${idx + 1}\`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Partners Section */}
        <div className="w-full bg-white py-14 flex flex-col items-center">
          <p className="text-slate-500 font-medium text-[15px] mb-10">{isRTL ? 'شركاء الشركات العالمية الرائدة' : 'Partners of world leading companies'}</p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-20 opacity-70 grayscale select-none">
            <span className="text-3xl font-black tracking-tighter text-slate-800">Ferrari</span>
            <span className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-2">
               <Globe2 className="w-8 h-8"/> TOYOTA
            </span>
            <span className="text-3xl font-black tracking-widest text-slate-800">T E S L A</span>
            <span className="text-3xl font-black italic text-slate-800">HIGER</span>
            <span className="text-3xl font-bold text-slate-800">Marcopolo</span>
          </div>
        </div>

        {/* Guest Order Wizard Styled for Theme */}
        <div className="w-full bg-white py-16 px-4 md:px-8 relative z-20" id="order-wizard">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            
            <div className="flex justify-center mb-6">
               <span className="bg-[#ea580c] text-white text-[11px] font-bold px-4 py-1.5 rounded-full">
                 {isRTL ? 'نظرة عامة على الخدمة' : 'Service Overview'}
               </span>
            </div>
            
            <div className="text-center mb-16">
               <h2 className="text-4xl md:text-[3.5rem] font-light text-slate-900 tracking-tight leading-[1.05]">
                 {isRTL ? 'نقل سلس لكل حاجة' : 'Seamless transport for every need'}
               </h2>
               <p className="text-slate-900 mt-6 font-bold max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                 {isRTL ? 'تسليم سريع وموثوق. لا يلزم تسجيل الدخول لبدء الشحن.' : 'Uthao\\'s Air Cargo Solutions deliver speed, reliability, and transparency moving critical cargo.'}
               </p>
               <p className="text-slate-900 mt-4 font-bold max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
                 {isRTL ? 'احصل على شريك مخصص يضمن رحلة سلسة وموثوقة.' : 'With Uthao air freight, you get a dedicated partner ensuring a smooth, reliable cargo journey from start to finish.'}
               </p>
               <button 
                  className="mt-8 bg-slate-950 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mx-auto hover:bg-slate-800 transition-colors"
                  onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}
                >
                 Ship now <ArrowUpRight className="w-4 h-4" />
               </button>
            </div>
            
            {/* Actually, let's keep the Order Wizard here but wrap it nicely */}
            <div className="w-full bg-slate-50/50 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden relative mt-8">
              <div className="p-2 md:p-6">
                <OrderWizard 
                  onNavigate={onNavigate} 
                  isGuest={true} 
                  onRequestLogin={() => { setLoginRole('user'); setLoginModalOpen(true); }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
`;

content = content.substring(0, startIndex) + newHero + content.substring(endIndex);
fs.writeFileSync(path, content, 'utf8');
console.log("Updated hero and theme");
