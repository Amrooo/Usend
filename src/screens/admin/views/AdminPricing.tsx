import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp, PlatformSettings } from '../../../context/AppContext';
import { Save, Percent, Truck, Wallet, FileText, CheckCircle2 } from 'lucide-react';

export default function AdminPricing() {
  const { settings, updateSettings } = useApp();
  const [localSettings, setLocalSettings] = useState<PlatformSettings | null>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setSaving(true);
    try {
      await updateSettings(localSettings);
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Settings Saved', message: 'Platform pricing settings updated successfully.', type: 'success' }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Save Failed', message: 'Could not save pricing settings.', type: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof PlatformSettings, value: number | boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [field]: value });
  };

  if (!localSettings) return <div className="p-8">Loading settings...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Pricing & Finance</h1>
          <p className="text-zinc-500 mt-1">Manage platform commissions, base delivery rates, and COD logic.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Merchant & Driver Fees */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Percent className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Platform Commissions</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Merchant Commission (%)</label>
              <input 
                type="number" 
                value={localSettings.merchantCommission}
                onChange={(e) => updateField('merchantCommission', parseFloat(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-xs text-zinc-500 mt-2">Percentage fee charged to merchants per order.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Driver Platform Fee (%)</label>
              <input 
                type="number" 
                value={localSettings.driverPlatformFee}
                onChange={(e) => updateField('driverPlatformFee', parseFloat(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-xs text-zinc-500 mt-2">Percentage fee deducted from driver payouts.</p>
            </div>
          </div>
        </div>

        {/* Base Delivery Rules */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Default Delivery Rates</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Base Delivery Fee (AED)</label>
              <input 
                type="number" 
                value={localSettings.baseDeliveryFee}
                onChange={(e) => updateField('baseDeliveryFee', parseFloat(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-xs text-zinc-500 mt-2">Flat rate charged regardless of distance.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-2">Per KM Rate (AED)</label>
              <input 
                type="number" 
                value={localSettings.perKmRate}
                onChange={(e) => updateField('perKmRate', parseFloat(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
              <p className="text-xs text-zinc-500 mt-2">Additional rate per kilometer applied to deliveries.</p>
            </div>
          </div>
        </div>

        {/* Cash On Delivery Rules */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Cash On Delivery (COD) Rules</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={localSettings.enableCodHandlingFee || false}
                  onChange={(e) => updateField('enableCodHandlingFee', e.target.checked)}
                  className="w-5 h-5 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
                />
                <span className="text-sm font-bold text-zinc-900">Enable COD Handling Fee</span>
              </label>
              <p className="text-xs text-zinc-500 mt-3 pl-8">
                If enabled, a percentage of the COD amount will be charged as a handling fee to the merchant.
              </p>
            </div>

            <div className={localSettings.enableCodHandlingFee ? 'opacity-100' : 'opacity-40 pointer-events-none transition-opacity'}>
              <label className="block text-sm font-bold text-zinc-700 mb-2">COD Handling Fee (%)</label>
              <input 
                type="number" 
                value={localSettings.codHandlingFeePercent || 0}
                onChange={(e) => updateField('codHandlingFeePercent', parseFloat(e.target.value))}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
