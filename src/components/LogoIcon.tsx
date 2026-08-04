import logo from '../assets/usend-logo.png';

export default function LogoIcon({ className = 'w-auto h-16', variant = 'light' }: { className?: string, variant?: 'light' | 'dark' }) {
  return (
    <img 
      src={logo} 
      alt="USend Logo" 
      className={`object-contain ${className}`}
    />
  );
}
