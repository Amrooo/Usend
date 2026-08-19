with open("src/components/Header.tsx", "r") as f:
    code = f.read()

code = code.replace("import { useAppContext } from '../context/AppContext';", "import { useApp } from '../context/AppContext';")
code = code.replace("const { user, signOut } = useAppContext();", "const { user, signOut } = useApp();")

mock_notifs = """
  const mockNotifs = [
    {
      id: '1',
      type: 'order',
      titleEn: 'System Update', titleAr: 'تحديث النظام',
      descEn: 'We have updated our terms of service.', descAr: 'لقد قمنا بتحديث شروط الخدمة الخاصة بنا.',
      timeEn: '2h ago', timeAr: 'قبل ساعتين',
      read: false
    },
    {
      id: '2',
      type: 'wallet',
      titleEn: 'New Shipment Alert', titleAr: 'تنبيه شحنة جديدة',
      descEn: 'Your shipment #12345 has been delivered.', descAr: 'تم توصيل شحنتك رقم 12345.',
      timeEn: '5h ago', timeAr: 'قبل 5 ساعات',
      read: false
    },
    {
      id: '3',
      type: 'api',
      titleEn: 'Welcome Message', titleAr: 'رسالة ترحيبية',
      descEn: 'Welcome to USEND logistics platform.', descAr: 'مرحبا بك في منصة يوسند اللوجستية.',
      timeEn: '1d ago', timeAr: 'قبل يوم',
      read: true
    }
  ];
"""

import re
code = re.sub(r'const mockNotifs = \[.*?\];', mock_notifs.strip(), code, flags=re.DOTALL)

# toggleNotifRead is missing!
code = code.replace('const clearAllNotifications = () => {', 'const toggleNotifRead = (id: string) => {\n    if (!readNotifIds.includes(id)) {\n      setReadNotifIds(prev => [...prev, id]);\n    }\n  };\n\n  const clearAllNotifications = () => {')

# Add missing icons
code = code.replace("import { Globe2, ChevronDown, Bell, LogOut, ArrowUpRight, Menu, X, ArrowRight } from 'lucide-react';", "import { Globe2, ChevronDown, Bell, LogOut, ArrowUpRight, Menu, X, ArrowRight, Truck, Calculator, Bot, Shield } from 'lucide-react';")

with open("src/components/Header.tsx", "w") as f:
    f.write(code)

print("Header fixed.")
