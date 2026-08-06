const fs = require('fs');
const path = 'src/screens/LandingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the truck image block
const startTruck = '{/* Truck image (Restored) */}';
const truckIdx = content.indexOf(startTruck);
if (truckIdx !== -1) {
  const endDiv = '</div>';
  const afterTruckIdx = content.indexOf(endDiv, content.indexOf(endDiv, truckIdx) + endDiv.length);
  if (afterTruckIdx !== -1) {
    content = content.substring(0, truckIdx) + content.substring(afterTruckIdx + endDiv.length);
  }
}

// 2. Add the guest order wizard below the hero slider and text, 
// replacing the truck image spot with the OrderWizard wrapped in a nice container.
const replacePoint = '{/* Buttons */}';
const embedWizard = `
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
          
          {/* Buttons */}`;

content = content.replace('{/* Buttons */}', embedWizard);

// 3. Update 'Start your order now' button to scroll to the embedded wizard instead of opening a modal
content = content.replace(
  "onClick={() => { setLoginRole('user'); setLoginModalOpen(true); }}",
  "onClick={() => { document.getElementById('order-wizard')?.scrollIntoView({ behavior: 'smooth' }); }}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated guest order layout");
