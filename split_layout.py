import re

with open("src/screens/LandingPage.tsx", "r") as f:
    code = f.read()

start_pattern = r"\{\/\* ── HERO SECTION ── \*\/\}[\s\S]*?(?=\{\/\* WATERMARK FOOTER SECTION - Full Width \*\/})"
sections = re.search(start_pattern, code)

if sections:
    sections_str = sections.group(0)
    
    # PublicLayout.tsx
    public_layout_code = code.replace(sections_str, "\n      {/* ── MAIN CONTENT ── */}\n      <main className=\"flex-1 w-full\">\n        {children}\n      </main>\n\n")
    public_layout_code = public_layout_code.replace("export default LandingPage;", "export default PublicLayout;")
    public_layout_code = public_layout_code.replace("const LandingPage = ({ onNavigate }: { onNavigate: (screen: Screen) => void }) => {", "const PublicLayout = ({ children, onNavigate }: { children: React.ReactNode, onNavigate: (screen: Screen) => void }) => {")
    
    with open("src/screens/PublicLayout.tsx", "w") as f:
        f.write(public_layout_code)
        
    print("Successfully created PublicLayout.tsx")
else:
    print("Could not find sections")

