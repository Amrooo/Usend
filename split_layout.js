const fs = require('fs');

const code = fs.readFileSync('src/screens/LandingPage.tsx', 'utf8');

// The strategy: PublicLayout is everything from LandingPage EXCEPT the inner sections.
// We will replace the inner sections with {children} in PublicLayout.
// We will replace the outer layout with PublicLayout in LandingPage.

const sectionsStartRegex = /\{\/\* ── HERO SECTION ── \*\/\}/;
const sectionsEndRegex = /\{\/\* WATERMARK FOOTER SECTION - Full Width \*\/\}/;

const startMatch = code.match(sectionsStartRegex);
const endMatch = code.match(sectionsEndRegex);

if (startMatch && endMatch) {
  const startIndex = startMatch.index;
  const endIndex = endMatch.index;

  const beforeSections = code.substring(0, startIndex);
  const sections = code.substring(startIndex, endIndex);
  const afterSections = code.substring(endIndex);

  // 1. Create PublicLayout.tsx
  let publicLayoutCode = code.replace(sections, `\n\n      {/* ── MAIN CONTENT ── */}\n      <main className="flex-1 w-full">\n        {children}\n      </main>\n\n      `);
  
  // Replace export default LandingPage with export default PublicLayout
  publicLayoutCode = publicLayoutCode.replace(/export default LandingPage;/g, 'export default PublicLayout;');
  publicLayoutCode = publicLayoutCode.replace(/const LandingPage = \(\{ onNavigate \}: \{ onNavigate: \(screen: Screen\) => void \}\) => \{/g, 'const PublicLayout = ({ children, onNavigate }: { children: React.ReactNode, onNavigate: (screen: Screen) => void }) => {');
  
  fs.writeFileSync('src/screens/PublicLayout.tsx', publicLayoutCode);

  // 2. Create LandingPage.tsx
  // It should be a simple component that renders PublicLayout and passes the sections as children.
  // Wait, the sections use state variables from the top of LandingPage.tsx!
  // E.g., isRTL, content (landingTranslations), setLoginRole, setLoginModalOpen, etc.
  
  // Actually, we can just extract the components to AboutUs.tsx and ContactUs.tsx.
}
