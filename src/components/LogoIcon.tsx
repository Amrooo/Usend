import React from 'react';

export default function LogoIcon({ className = 'h-9 w-auto', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <div className="flex items-center gap-2">
      <svg 
        viewBox="0 0 100 100" 
        className={`${className} object-contain`} 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Isometric Box Paths */}
        {/* Top Face */}
        <path d="M 50,20 L 85,37.5 L 50,55 L 15,37.5 Z" fill="#cca073" stroke="#b78b5c" strokeWidth="0.75" />
        
        {/* Left Face */}
        <path d="M 15,37.5 L 50,55 L 50,87.5 L 15,70 Z" fill="#b78b5c" stroke="#967049" strokeWidth="0.75" />
        
        {/* Right Face */}
        <path d="M 50,55 L 85,37.5 L 85,70 L 50,87.5 Z" fill="#a07a50" stroke="#8c683f" strokeWidth="0.75" />
        
        {/* Tape / Flaps lines */}
        <path d="M 50,20 L 50,55" stroke="#113f36" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        <path d="M 15,37.5 L 50,55" stroke="#113f36" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        <path d="M 85,37.5 L 50,55" stroke="#113f36" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
        
        {/* The word "usend" in black letters on the left side of the box (isometric projection) */}
        <g transform="translate(19, 56) skewY(26.5) scale(0.9, 1)">
          <text 
            x="0" 
            y="0" 
            fill="#000000" 
            fontSize="10" 
            fontWeight="900" 
            fontFamily="system-ui, sans-serif" 
            letterSpacing="-0.5"
          >
            usend
          </text>
        </g>
      </svg>
    </div>
  );
}
