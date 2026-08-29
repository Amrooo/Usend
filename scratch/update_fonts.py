import os

files = [
    '/Users/amro/Desktop/Amro\'s PC/Usend/src/screens/admin/AdminDashboard.tsx',
    '/Users/amro/Desktop/Amro\'s PC/Usend/src/components/MerchantSidebar.tsx',
    '/Users/amro/Desktop/Amro\'s PC/Usend/src/components/UserSidebar.tsx',
    '/Users/amro/Desktop/Amro\'s PC/Usend/src/components/PortalSidebar.tsx'
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # AdminDashboard has text-[12.5px]
        content = content.replace('text-[12.5px]', 'text-[15px]')
        
        # The other sidebars might have text-xs font-semibold or similar.
        # Let's just blindly replace text-xs with text-[15px] on the lines with font-semibold
        # or we can be more specific. Let's just do a simple replacement for the others if they have text-xs font-semibold
        content = content.replace('text-xs font-semibold', 'text-[15px] font-semibold')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
