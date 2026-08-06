import { Screen } from '../../types';
import UserSidebar from '../../components/UserSidebar';
import { useLanguage } from '../../context/LanguageContext';
import OrderWizard from '../../components/OrderWizard';

interface UserIndividualOrderProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function UserIndividualOrder({ onNavigate }: UserIndividualOrderProps) {
  const { isRTL } = useLanguage();

  return (
    <div className={`flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <UserSidebar currentScreen="user_individual" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 h-full overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#3a4a2c]/5 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/3 pointer-events-none z-0"></div>
        <div className="max-w-4xl mx-auto relative z-10 pt-4 pb-12">
          <OrderWizard onNavigate={onNavigate} isGuest={false} />
        </div>
      </main>
    </div>
  );
}
