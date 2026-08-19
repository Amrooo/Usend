import re

def extract():
    with open('src/screens/LandingPage.tsx', 'r') as f:
        code = f.read()
        
    # Extract Header block
    header_start = code.find('<header')
    header_end = code.find('</header>') + len('</header>')
    header_code = code[header_start:header_end]
    
    # Extract Mobile Nav block
    mobile_nav_start = code.find('<div \n        id="mobile-nav-overlay"')
    if mobile_nav_start == -1:
        mobile_nav_start = code.find('<div \n        id="mobile-nav-overlay')
        if mobile_nav_start == -1:
             mobile_nav_start = code.find('<div \n        id="mobile-nav')
             if mobile_nav_start == -1:
                 mobile_nav_start = code.find('id="mobile-nav-overlay"')
                 mobile_nav_start = code.rfind('<div', 0, mobile_nav_start)
    
    # Let's find mobile nav safely using regex
    mobile_nav_match = re.search(r'<div[^>]*id="mobile-nav-overlay"[^>]*>.*?(?=      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-4 pb-0">)', code, re.DOTALL)
    if mobile_nav_match:
        mobile_nav_code = mobile_nav_match.group(0)
    else:
        print("Could not extract mobile nav")
        mobile_nav_code = ""
        
    # Combine header and mobile nav
    full_header_code = header_code + "\n\n      {/* ── Mobile Nav Overlay ── */}\n      " + mobile_nav_code
    
    # Footer block
    footer_start = code.find('{/* WATERMARK FOOTER SECTION - Full Width */}')
    footer_end = code.find('</footer>') + len('</footer>')
    footer_code = code[footer_start:footer_end]
    
    return full_header_code, footer_code

h, f = extract()
print("Header length:", len(h))
print("Footer length:", len(f))

