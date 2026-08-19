import re

files = ["src/screens/LandingPage.tsx", "src/screens/AboutUs.tsx", "src/screens/ContactUs.tsx"]

for filename in files:
    with open(filename, 'r') as f:
        code = f.read()

    # Import Header and Footer
    if "import Header" not in code:
        code = code.replace("import LogoIcon from '../components/LogoIcon';", "import LogoIcon from '../components/LogoIcon';\nimport Header from '../components/Header';\nimport Footer from '../components/Footer';")
    
    # Replace Header
    header_start = code.find('<header')
    mobile_nav_match = re.search(r'<div[^>]*id="mobile-nav-overlay"[^>]*>.*?(?=      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-4 pb-0"|      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-24 pb-24 min-h-\[70vh\])', code, re.DOTALL)
    
    if header_start != -1 and mobile_nav_match:
        header_end = mobile_nav_match.end()
        header_call = "      <Header onNavigate={onNavigate} setLoginRole={setLoginRole} setLoginModalOpen={setLoginModalOpen} content={content} handleScrollTo={handleScrollTo} />\n"
        code = code[:header_start] + header_call + code[header_end:]

    # Replace Footer
    footer_start = code.find('{/* WATERMARK FOOTER SECTION - Full Width */}')
    if footer_start != -1:
        footer_end = code.find('</footer>') + len('</footer>')
        footer_call = "      <Footer onNavigate={onNavigate} setLoginRole={setLoginRole} setLoginEmail={setLoginEmail} setLoginModalOpen={setLoginModalOpen} content={content} />"
        code = code[:footer_start] + footer_call + code[footer_end:]

    with open(filename, 'w') as f:
        f.write(code)

print("Updated screens")
