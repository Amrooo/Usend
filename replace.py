import os
import re

directories = ['src', 'index.html', 'admin.html', 'usendadmin2026/index.html']
base_dir = '/Users/amro/Desktop/Amro\'s PC/Usend'

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        
        # specific replacements
        new_content = new_content.replace('care@trsh.ae', 'care@usend.ae')
        new_content = new_content.replace('TRSH LOGISTICS TECHNOLOGIES', 'USEND LOGISTICS TECHNOLOGIES')
        new_content = new_content.replace('TRSH (FZC)', 'Usend (FZC)')
        
        # General replacements
        new_content = new_content.replace('TRSH', 'Usend')
        new_content = new_content.replace('trsh', 'usend')
        new_content = new_content.replace('Trsh', 'Usend')
        new_content = new_content.replace('تي آر إس إتش', 'يوسند') # Arabic replacement for TRSH
        
        # Font size and logo size tweaks in sidebars
        # AdminDashboard.tsx
        new_content = new_content.replace('text-[13px] font-medium', 'text-[15px] font-medium')
        new_content = new_content.replace('text-sm font-extrabold uppercase', 'text-xl font-extrabold uppercase')
        new_content = new_content.replace('w-10 h-10 rounded-2xl bg-[#113F36]', 'w-14 h-14 rounded-2xl bg-[#113F36]')
        new_content = new_content.replace('<LogoIcon className="w-6 h-6 text-white" />', '<LogoIcon className="w-8 h-8 text-white" />')
        
        # MerchantSidebar / UserSidebar / PortalSidebar
        new_content = new_content.replace('text-[13px]', 'text-[15px]')
        new_content = new_content.replace('w-10 h-10 rounded-2xl bg-white border', 'w-14 h-14 rounded-2xl bg-white border')
        new_content = new_content.replace('text-xs font-bold uppercase tracking-widest', 'text-sm font-bold uppercase tracking-widest')
        new_content = new_content.replace('<LogoIcon className="w-full h-full" />', '<LogoIcon className="w-full h-full p-1" />')

        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        pass

for root, _, files in os.walk(os.path.join(base_dir, 'src')):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.html', '.css', '.js')):
            replace_in_file(os.path.join(root, f))

for f in ['index.html', 'admin.html', 'usendadmin2026/index.html']:
    p = os.path.join(base_dir, f)
    if os.path.exists(p):
        replace_in_file(p)
