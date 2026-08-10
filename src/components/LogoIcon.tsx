import React from 'react';
import logo from '../assets/usend-logo.png';

export default function LogoIcon({ className = 'h-9 w-auto', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <div className="flex items-center gap-2">
      <img 
        src={logo} 
        alt="USend Logo" 
        className={`${className} object-contain`} 
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
