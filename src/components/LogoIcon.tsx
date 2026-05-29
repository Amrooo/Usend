import newSvg from '../assets/usend-logo.svg';

export default function LogoIcon({ className = 'w-auto h-16', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <img 
      src={newSvg} 
      alt="USend Logo" 
      className={`object-contain default-logo-shadow transition-all duration-300 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:drop-shadow-[0_4px_16px_rgba(34,197,94,0.18)] ${className}`} 
    />
  );
}
