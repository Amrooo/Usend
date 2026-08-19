import re

with open("src/screens/LandingPage.tsx", "r") as f:
    code = f.read()

# Replace handleScrollTo with onNavigate for About and Contact in the desktop and mobile navs
# E.g., onClick={(e) => { handleScrollTo(e, 'about'); ... }}
code = re.sub(r"handleScrollTo\(e,\s*'about'\)", "onNavigate('about_us')", code)
code = re.sub(r"handleScrollTo\(e,\s*'faq'\)", "onNavigate('contact_us')", code)
# Also the hrefs
code = code.replace('href="#about"', 'href="#"')
code = code.replace('href="#faq"', 'href="#"')

# For the AboutUs component
about_content = """
      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-24 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-slate-900 mb-6">
          {isRTL ? 'من نحن' : 'About Us'}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          {isRTL 
            ? 'نحن منصة يو سند، بوابتك اللوجستية المتكاملة لربط المتاجر الإلكترونية مع أفضل خدمات التوصيل في الإمارات.' 
            : 'We are USend, your unified logistics gateway connecting e-commerce stores with the best delivery networks across the UAE.'}
        </p>
      </div>
"""

# For the ContactUs component
contact_content = """
      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-24 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-slate-900 mb-6">
          {isRTL ? 'اتصل بنا' : 'Contact Us'}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-12">
          {isRTL 
            ? 'فريق الدعم متاح على مدار الساعة للإجابة على استفساراتكم.' 
            : 'Our support team is available 24/7 to answer your inquiries.'}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl text-start">
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold mb-4">{isRTL ? 'المقر الرئيسي' : 'Headquarters'}</h3>
            <p className="text-slate-500 mb-2">Dubai Silicon Oasis, UAE</p>
            <p className="text-slate-500 mb-2">+971 4 123 4567</p>
            <p className="text-slate-500">support@usend.com</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
            <h3 className="text-xl font-bold mb-4">{isRTL ? 'أرسل رسالة' : 'Send a Message'}</h3>
            <input type="text" placeholder={isRTL ? 'الاسم' : 'Name'} className="w-full mb-4 p-3 rounded-xl border border-slate-200" />
            <input type="email" placeholder={isRTL ? 'البريد الإلكتروني' : 'Email'} className="w-full mb-4 p-3 rounded-xl border border-slate-200" />
            <button className="w-full py-3 bg-[#113f36] text-white rounded-xl font-bold">{isRTL ? 'إرسال' : 'Submit'}</button>
          </div>
        </div>
      </div>
"""

# Find the start of the content to replace
start_idx = code.find('<div className="w-full relative z-10 bg-white px-6 md:px-16 py-4 pb-0">')
end_idx = code.find('<footer')

if start_idx != -1 and end_idx != -1:
    about_code = code[:start_idx] + about_content + code[end_idx:]
    about_code = about_code.replace("const LandingPage =", "const AboutUs =")
    about_code = about_code.replace("export default LandingPage;", "export default AboutUs;")
    
    contact_code = code[:start_idx] + contact_content + code[end_idx:]
    contact_code = contact_code.replace("const LandingPage =", "const ContactUs =")
    contact_code = contact_code.replace("export default LandingPage;", "export default ContactUs;")
    
    # Save the files
    with open("src/screens/AboutUs.tsx", "w") as f:
        f.write(about_code)
    
    with open("src/screens/ContactUs.tsx", "w") as f:
        f.write(contact_code)
        
    print("Created AboutUs.tsx and ContactUs.tsx")
    
    # Update LandingPage.tsx nav links
    with open("src/screens/LandingPage.tsx", "w") as f:
        f.write(code)
    print("Updated LandingPage.tsx nav links")
else:
    print("Could not find start/end bounds")
    
