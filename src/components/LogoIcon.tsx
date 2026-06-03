import newSvg from '../assets/usend-logo.svg';

export default function LogoIcon({ className = 'w-auto h-16', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <img 
      src={newSvg} 
      alt="USend Logo" 
      className={`object-contain ${className}`}
    />
  );
}
