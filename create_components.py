import re

with open('src/screens/LandingPage.tsx', 'r') as f:
    code = f.read()

# --- Extract Footer ---
footer_start = code.find('{/* WATERMARK FOOTER SECTION - Full Width */}')
footer_end = code.find('</footer>') + len('</footer>')
footer_code = code[footer_start:footer_end]

footer_component = f"""import React from 'react';
import {{ useLanguage }} from '../context/LanguageContext';
import {{ Screen }} from './types';
import LogoIcon from './LogoIcon';

interface FooterProps {{
  onNavigate: (screen: Screen) => void;
  setLoginRole: (role: any) => void;
  setLoginEmail: (email: string) => void;
  setLoginModalOpen: (open: boolean) => void;
  content: any;
}}

export default function Footer({{ onNavigate, setLoginRole, setLoginEmail, setLoginModalOpen, content }}: FooterProps) {{
  const {{ isRTL }} = useLanguage();

  return (
    {footer_code}
  );
}}
"""
with open('src/components/Footer.tsx', 'w') as f:
    f.write(footer_component)

# --- Extract Header ---
header_start = code.find('<header')
header_end = code.find('</header>') + len('</header>')
header_code = code[header_start:header_end]

mobile_nav_match = re.search(r'<div[^>]*id="mobile-nav-overlay"[^>]*>.*?(?=      <div className="w-full relative z-10 bg-white px-6 md:px-16 py-4 pb-0">)', code, re.DOTALL)
mobile_nav_code = mobile_nav_match.group(0) if mobile_nav_match else ""

header_component = f"""import React, {{ useState, useEffect }} from 'react';
import {{ motion, AnimatePresence }} from 'motion/react';
import {{ Globe2, ChevronDown, Bell, LogOut, ArrowUpRight, Menu, X, ArrowRight }} from 'lucide-react';
import {{ Screen }} from './types';
import {{ useAppContext }} from '../context/AppContext';
import {{ useLanguage }} from '../context/LanguageContext';
import LogoIcon from './LogoIcon';

interface HeaderProps {{
  onNavigate: (screen: Screen) => void;
  setLoginRole: (role: any) => void;
  setLoginModalOpen: (open: boolean) => void;
  content: any;
  handleScrollTo: (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => void;
}}

export default function Header({{ onNavigate, setLoginRole, setLoginModalOpen, content, handleScrollTo }}: HeaderProps) {{
  const {{ user, signOut }} = useAppContext();
  const {{ language, setLanguage, isRTL }} = useLanguage();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  // Mock notifications
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  const [clearedNotifIds, setClearedNotifIds] = useState<string[]>([]);
  
  const mockNotifs = [
    {{ id: '1', title: isRTL ? 'تحديث النظام' : 'System Update', time: isRTL ? 'قبل ساعتين' : '2h ago', read: false }},
    {{ id: '2', title: isRTL ? 'تنبيه شحنة جديدة' : 'New Shipment Alert', time: isRTL ? 'قبل 5 ساعات' : '5h ago', read: false }},
    {{ id: '3', title: isRTL ? 'رسالة ترحيبية' : 'Welcome Message', time: isRTL ? 'قبل يوم' : '1d ago', read: true }},
  ];

  const notifications = mockNotifs
    .filter(n => !clearedNotifIds.includes(n.id))
    .map(n => ({{ ...n, read: n.read || readNotifIds.includes(n.id) }}));

  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markAllNotifsAsRead = () => {{
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    setReadNotifIds(prev => [...prev, ...unreadIds]);
  }};

  const clearAllNotifications = () => {{
    setClearedNotifIds(mockNotifs.map(n => n.id));
    setNotifDropdownOpen(false);
  }};

  useEffect(() => {{
    const handleScroll = () => {{
      setIsScrolled(window.scrollY > 20);
    }};
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }}, []);

  return (
    <>
      {header_code}
      {mobile_nav_code}
    </>
  );
}}
"""
with open('src/components/Header.tsx', 'w') as f:
    f.write(header_component)

print("Created Footer.tsx and Header.tsx")
