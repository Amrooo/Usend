import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Package, Truck, ArrowRight, CheckCircle2, Bike, Car, Loader2, AlertCircle } from 'lucide-react';
import { Screen } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { courierIntegrationService } from '../services/courierIntegration';

interface ConfirmProps {
  key?: string;
  onNavigate: (screen: Screen) => void;
}

export default function Confirm({ onNavigate }: ConfirmProps) {
  const [selectedVehicle, setSelectedVehicle] = useState('moto');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('apple_pay');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const { t, isRTL } = useLanguage();
  const { addRequest, currentRequest, courierConfigs } = useApp();

  const vehicles = [
    { id: 'moto', name: t('motorcycle'), icon: <Bike className="w-6 h-6" />, price: 12.50, eta: `8 ${t('eta')}`, tag: t('fastest') },
    { id: 'van', name: t('cargo_van'), icon: <Car className="w-6 h-6" />, price: 24.00, eta: `15 ${t('eta')}`, tag: t('best_medium') },
    { id: 'truck', name: t('moving_truck'), icon: <Truck className="w-6 h-6" />, price: 45.00, eta: `24 ${t('eta')}`, tag: t('heavy_duty') },
  ];

  const paymentMethods = [
    {
      id: 'apple_pay',
      name: t('apple_pay'),
      icon: <div className="w-10 h-6 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black text-[12px] font-bold transition-colors duration-300">Pay</div>
    },
    {
      id: 'card',
      name: t('mastercard'),
      icon: <div className="w-10 h-6 bg-zinc-100 dark:bg-zinc-800 rounded flex items-center justify-center transition-colors duration-300"><div className="flex -space-x-1"><div className="w-3 h-3 rounded-full bg-red-500 mix-blend-multiply dark:mix-blend-screen"></div><div className="w-3 h-3 rounded-full bg-yellow-500 mix-blend-multiply dark:mix-blend-screen"></div></div></div>
    }
  ];

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);

  /**
   * Attempts to dispatch the order to the configured courier (Noon by default for UAE hyperlocal).
   * Returns tracking info on success, or null if no courier is reachable (order stays pending).
   */
  const attemptCourierDispatch = async (orderId: string) => {
    try {
      // Use Noon as default hyperlocal courier for UAE; Aramex as fallback for international
      const noonConfig = courierConfigs?.noon;
      const aramexConfig = courierConfigs?.aramex;

      // Prefer Noon (hyperlocal) if active; fallback to Aramex
      const activeCourier = (noonConfig?.status === 'Active') ? 'noon'
        : (aramexConfig?.status === 'Active') ? 'aramex'
        : null;

      if (!activeCourier) {
        console.warn('[Confirm] No active courier configured. Order saved as pending manual dispatch.');
        return null;
      }

      const config = activeCourier === 'noon' ? noonConfig! : aramexConfig!;
      const isProduction = config.currentMode === 'production';
      const creds = {
        ...(isProduction ? config.productionCreds : config.sandboxCreds),
        apiEnv: config.currentMode,
      };

      // Build shipment payload from currentRequest (set by Details.tsx) or fall back to defaults
      const senderName = currentRequest?.name || 'USend Hub';
      const senderPhone = currentRequest?.phone || '+971500000000';
      const fromAddr = currentRequest?.fromDestination || currentRequest?.pickupAddress || 'Dubai, UAE';
      const toAddr = currentRequest?.toDestination || currentRequest?.address || 'Dubai, UAE';

      const result = await courierIntegrationService.createShipment(activeCourier, {
        credentials: creds as any,
        senderName,
        senderPhone,
        senderCity: 'Dubai',
        senderCountry: 'AE',
        senderAddress: fromAddr,
        receiverName: currentRequest?.name || 'Recipient',
        receiverPhone: currentRequest?.phone || '+971520000000',
        receiverCity: 'Dubai',
        receiverCountry: 'AE',
        receiverAddress: toAddr,
        goodsDescription: currentRequest?.description || currentRequest?.itemType || 'Goods',
        weightKg: 1,
        codAmountAED: 0,
        orderId,
      });

      if (result.success && result.trackingNumber) {
        console.log(`[Confirm] Courier dispatch SUCCESS — ${activeCourier} tracking: ${result.trackingNumber}`);
        return { courier: activeCourier, trackingNumber: result.trackingNumber, noonTaskId: result.noonTaskId };
      } else {
        console.warn(`[Confirm] Courier dispatch returned error: ${result.error}`);
        return null;
      }
    } catch (err: any) {
      console.error('[Confirm] Courier dispatch failed (non-blocking):', err.message);
      return null;
    }
  };

  const handleConfirmOrder = async () => {
    if (isDispatching) return;
    setIsDispatching(true);
    setDispatchError(null);

    try {
      const orderId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const selectedV = selectedVehicleData;

      // 1. Attempt real courier dispatch (non-blocking — failure still creates order)
      const dispatchResult = await attemptCourierDispatch(orderId);

      // 2. Create the order in local state (and Firestore via addRequest)
      addRequest({
        id: orderId,
        name: currentRequest?.name || 'Guest Customer',
        channel: 'Mobile App',
        date: new Date().toLocaleString(),
        status: 'Pending',
        address: currentRequest?.address || currentRequest?.toDestination || '',
        itemType: currentRequest?.itemType || 'Package',
        description: currentRequest?.description || selectedV?.name || 'Delivery',
        photoUrl: currentRequest?.photoUrl || '',
        amountType: 'packages',
        paymentMethod: selectedPaymentMethod === 'apple_pay' ? 'Apple Pay' : 'Credit Card',
        orderAmount: `AED ${(selectedV?.price ?? 0).toFixed(2)}`,
        applicantType: 'Individual User',
        fromDestination: currentRequest?.fromDestination || currentRequest?.pickupAddress || '',
        toDestination: currentRequest?.toDestination || currentRequest?.address || '',
        etaTime: selectedV?.eta || '18 mins',
        phone: currentRequest?.phone || '',
        pickupAddress: currentRequest?.pickupAddress || currentRequest?.fromDestination || '',
        // Attach tracking data if courier dispatch succeeded
        ...(dispatchResult ? {
          carrier: dispatchResult.courier,
          externalTrackingNumber: dispatchResult.trackingNumber,
          noonTaskId: dispatchResult.noonTaskId,
          status: 'IN_TRANSIT' as const,
        } : {
          dispatchError: 'Courier dispatch pending — will be assigned manually',
        }),
      });

      onNavigate('success');
    } catch (err: any) {
      console.error('[Confirm] Order creation failed:', err);
      setDispatchError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-zinc-50 flex flex-col transition-colors duration-300"
    >
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between bg-zinc-50/80 backdrop-blur-md z-10 transition-colors duration-300">
        <button
          onClick={() => onNavigate('details')}
          disabled={isDispatching}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-zinc-900 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </button>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 transition-colors duration-300">{t('confirm_delivery')}</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-6 space-y-8 pb-40 pt-4">
        {/* Delivery Summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[12px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase">{t('delivery_summary')}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors duration-300">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {currentRequest?.itemType || 'Package'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {currentRequest?.description || selectedVehicleData?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#113f36] flex-shrink-0"></div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {currentRequest?.fromDestination || currentRequest?.pickupAddress || 'Pickup location'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f5502c] flex-shrink-0"></div>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {currentRequest?.toDestination || currentRequest?.address || 'Delivery location'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Select Vehicle */}
        <section>
          <h3 className="text-[12px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-4">{t('select_vehicle')}</h3>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id)}
                disabled={isDispatching}
                className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 active:scale-[0.98] relative disabled:opacity-60 ${
                  selectedVehicle === v.id
                    ? 'border-[#f5502c] bg-[#f5502c]/5 dark:bg-[#f5502c]/10 shadow-sm'
                    : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-colors duration-300 ${
                  selectedVehicle === v.id ? 'bg-[#f5502c]/10 text-[#f5502c]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}>
                  {v.icon}
                </div>
                <div className="flex-1 text-left rtl:text-right">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{v.name}</h4>
                      <span className="text-[12px] font-bold tracking-widest text-[#f5502c] bg-[#f5502c]/10 px-2 py-0.5 rounded-full uppercase">{v.eta}</span>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">AED {v.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={selectedVehicle === v.id ? 'text-[#f5502c] font-black' : 'text-zinc-500 dark:text-zinc-400'}>
                      {v.tag}
                    </span>
                  </div>
                </div>
                {selectedVehicle === v.id && (
                  <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} text-[#f5502c]`}>
                    <CheckCircle2 className="w-5 h-5 fill-current text-white dark:text-zinc-950" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Payment Method */}
        <section>
          <h3 className="text-[12px] font-bold tracking-widest text-zinc-500 dark:text-zinc-400 uppercase mb-4">{t('payment_method')}</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors duration-300">
            {paymentMethods.map((method, index) => (
              <button
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                disabled={isDispatching}
                className={`w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors duration-300 disabled:opacity-60 ${
                  index !== paymentMethods.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {method.icon}
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{method.name}</span>
                </div>
                {selectedPaymentMethod === method.id && (
                  <CheckCircle2 className="w-5 h-5 text-[#f5502c]" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Error banner */}
        {dispatchError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{dispatchError}</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="absolute bottom-0 inset-x-0 p-6 bg-white border-t border-zinc-100 z-20 transition-colors duration-300">
        <div className="flex items-end justify-between mb-4">
          <div className="text-left rtl:text-right">
            <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('total_fare')}</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              AED {(selectedVehicleData?.price ?? 0).toFixed(2)}
            </p>
          </div>
          <div className={isRTL ? 'text-left' : 'text-right'}>
            <p className="text-[12px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-1">{t('est_time')}</p>
            <p className="text-sm font-bold text-[#f5502c]">{selectedVehicleData?.eta}</p>
          </div>
        </div>
        <button
          id="confirm-order-btn"
          onClick={handleConfirmOrder}
          disabled={isDispatching}
          className="w-full h-16 bg-[#f5502c] rounded-2xl flex items-center justify-center gap-2 text-white font-semibold text-lg shadow-[0_8px_30px_rgb(245,80,44,0.4)] dark:shadow-none transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isDispatching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Dispatching...</span>
            </>
          ) : (
            <>
              {t('confirm_pay')}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
