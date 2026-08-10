import { Screen } from '../../types';
import MerchantSidebar from '../../components/MerchantSidebar';
import { useLanguage } from '../../context/LanguageContext';
import OrderWizard from '../../components/OrderWizard';

interface MerchantIndividualOrderProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function MerchantIndividualOrder({ onNavigate }: MerchantIndividualOrderProps) {
  const { isRTL } = useLanguage();

  return (
    <div className={`flex h-screen overflow-hidden bg-[#F6F8F6] dark:bg-zinc-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <MerchantSidebar currentScreen="merchant_individual" onNavigate={onNavigate} />
      
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto relative z-10 w-full">
         <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#113f36]/5 to-transparent pointer-events-none -z-10" />
         <div className="max-w-4xl mx-auto relative z-10 pt-4 pb-12">
            <OrderWizard onNavigate={onNavigate} isGuest={false} />
         </div>
      </main>
    </div>
  );
}
