import logo from '../assets/usend-logo.svg';

export default function Logo({ className = '' }: { className?: string }) {
  return (
      <div className={`flex items-center justify-center ${className}`}>
        <img 
          src={logo} 
          alt="USend Logo" 
          className="w-28 h-28 md:w-32 md:h-32 object-contain" 
        />
      </div>
  );
}
