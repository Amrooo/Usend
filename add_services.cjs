const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

const anchor = '{/* TIMELINE SECTION - Full Width */}';
const newSection = `
        {/* Air Services Theme Section */}
        <div className="w-full bg-white py-16 flex flex-col items-center px-4 relative z-20">
          <div className="flex justify-center mb-6">
             <span className="bg-[#ea580c] text-white text-[11px] font-bold px-4 py-1.5 rounded-full">
               {isRTL ? 'خدماتنا الجوية' : 'Air Services'}
             </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.05] text-center mb-16">
             {isRTL ? 'خدمات الشحن الجوي لدينا' : 'Our air cargo services'}
          </h2>
          <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-50 rounded-[2rem] p-8 md:p-12 flex flex-col justify-center">
               <h3 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">
                 {isRTL ? 'خدمات الشحن الجوي القياسية' : 'Standard air freight services'}
               </h3>
               <ul className="space-y-4 mb-8">
                 <li className="flex items-start gap-3 font-bold text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                   {isRTL ? 'ضمان وصول شحنتك في الموعد المحدد.' : 'Ensures your cargo reaches its destination on schedule.'}
                 </li>
                 <li className="flex items-start gap-3 font-bold text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                   {isRTL ? 'المساعدة في الوثائق والتخليص.' : 'Assistance with documentation and clearance.'}
                 </li>
                 <li className="flex items-start gap-3 font-bold text-slate-700">
                   <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-2 shrink-0"></span>
                   {isRTL ? 'يربط بين المطارات الرئيسية والمراكز التجارية عالمياً.' : 'Connects to major airports and trade hubs worldwide.'}
                 </li>
               </ul>
               <div>
                 <button 
                   className="bg-slate-950 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors w-fit"
                   onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}
                 >
                   {isRTL ? 'اشحن الآن' : 'Ship now'} <ArrowUpRight className="w-4 h-4" />
                 </button>
               </div>
             </div>
             <div className="h-full min-h-[300px] md:min-h-[400px] rounded-[2rem] overflow-hidden">
               <img src="https://images.unsplash.com/photo-1540835334791-0309ce3b72c4?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Air Cargo" />
             </div>
          </div>
        </div>
        
      {/* TIMELINE SECTION - Full Width */}`;

if (content.indexOf(anchor) !== -1) {
    content = content.replace(anchor, newSection);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Added air services section successfully");
} else {
    console.log("Anchor not found");
}
