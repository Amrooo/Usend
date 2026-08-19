import os

files = ["src/screens/LandingPage.tsx", "src/screens/AboutUs.tsx", "src/screens/ContactUs.tsx"]

for f in files:
    with open(f, "r") as file:
        content = file.read()
        
    content = content.replace(
        '<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />',
        '<ArrowRight className={`w-3 h-3 transition-transform ${isRTL ? \'rotate-180 group-hover:-translate-x-1\' : \'group-hover:translate-x-1\'}`} />'
    )
    
    content = content.replace(
        '<ArrowRight className="w-4 h-4" />',
        '<ArrowRight className={`w-4 h-4 ${isRTL ? \'rotate-180\' : \'\'}`} />'
    )
    
    with open(f, "w") as file:
        file.write(content)
        
print("Arrows fixed")
