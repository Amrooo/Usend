import React from 'react';

export default function LogoIcon({ className = 'h-9 w-auto', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <div className="flex items-center gap-2">
      <svg className={`${className} text-[#2563EB] shrink-0`} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="#2563EB" />
        <path d="M25 11L11 18L17 20L19 26L25 11Z" fill="white" />
      </svg>
    </div>
  );
}
