const fs = require('fs');

const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update heroSlides
const oldSlidesStr = `  const heroSlides = [
    {
      image: shipmentImg,
      titleEn: 'Seamless Inter-Emirate Delivery Network.',
      titleAr: 'شبكة توصيل سلسة بين الإمارات.',
      descEn: 'Fast and reliable domestic shipping across all seven Emirates.',
      descAr: 'شحن محلي سريع وموثوق عبر جميع الإمارات السبع.',
    },
    {
      image: ctaCargoShip,
      titleEn: 'Next-Day Business Deliveries in UAE.',
      titleAr: 'توصيل أعمال في اليوم التالي في الإمارات.',
      descEn: 'Optimized logistics for B2B and e-commerce across Dubai, Abu Dhabi, and beyond.',
      descAr: 'لوجستيات محسنة للأعمال والتجارة الإلكترونية عبر دبي وأبوظبي وما بعدهما.',
    }
  ];`;

const newSlidesStr = `  const heroSlides = [
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

content = content.replace(oldSlidesStr, newSlidesStr);

// Update button for "Start your order now"
content = content.replace(
  `onClick={() => setGuestModalOpen(true)}
              className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {isRTL ? 'ابدأ طلبك الآن' : 'Start your order now'}`,
  `onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}
              className="px-8 py-4 bg-[#2563EB] hover:bg-blue-600 text-white text-[13px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {isRTL ? 'ابدأ طلبك الآن' : 'Start your order now'}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Slider content and buttons updated successfully');
