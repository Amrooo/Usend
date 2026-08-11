import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Save,
  Shield,
  Activity,
  Webhook
} from 'lucide-react';
import { useApp, CourierIntegrationConfig } from '../../../context/AppContext';

export default function AdminCouriers() {
  const { courierConfigs, updateCourierConfigs } = useApp();
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [saving, setSaving] = useState(false);
  
  // Local state for editing credentials before saving
  const [localConfigs, setLocalConfigs] = useState<Record<string, CourierIntegrationConfig>>(courierConfigs);

  const handleTestConnection = async (provider: string) => {
    setTesting(provider);
    try {
      const config = localConfigs[provider];
      const response = await fetch('http://localhost:3001/api/courier/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          config
        })
      });
      const data = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: response.ok,
          message: data.message || (response.ok ? 'Connection successful' : 'Connection failed')
        }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: err instanceof Error ? err.message : 'Network error occurred'
        }
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async (provider: string) => {
    setSaving(true);
    try {
      const updatedConfigs = {
        ...courierConfigs,
        [provider]: localConfigs[provider]
      };
      await updateCourierConfigs(updatedConfigs);
      
      // Dispatch success toast
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Configuration Saved', message: `${provider} settings updated successfully.`, type: 'success' }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app_toast', {
        detail: { title: 'Save Failed', message: 'Could not update courier settings.', type: 'error' }
      }));
    } finally {
      setSaving(false);
    }
  };

  const updateLocalConfig = (provider: string, field: string, value: any) => {
    setLocalConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const updateCredentials = (provider: string, field: string, value: string) => {
    setLocalConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        credentials: {
          ...prev[provider]?.credentials,
          [field]: value
        }
      }
    }));
  };

  const renderCourierCard = (provider: string, title: string, logoUrl?: string) => {
    const config = localConfigs[provider] || { isActive: false, mode: 'test', credentials: {} };
    const testResult = testResults[provider];

    return (
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm mb-6" key={provider}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl border border-zinc-200 flex items-center justify-center p-2 shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={title} className="max-w-full max-h-full object-contain" />
              ) : (
                <Server className="w-6 h-6 text-zinc-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-zinc-400'}`}></span>
                  {config.isActive ? 'Active' : 'Disabled'}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.mode === 'live' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                  {config.mode === 'live' ? 'Production' : 'Sandbox'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTestConnection(provider)}
              disabled={testing === provider}
              className="px-4 py-2 bg-zinc-100 text-zinc-700 font-semibold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {testing === provider ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              Test Connection
            </button>
            <button
              onClick={() => handleSave(provider)}
              disabled={saving}
              className="px-4 py-2 bg-zinc-900 text-white font-semibold rounded-xl hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Config
            </button>
          </div>
        </div>

        {/* Test Results Banner */}
        {testResult && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 text-sm font-medium ${testResult.success ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'}`}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
            {testResult.message}
          </div>
        )}

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-zinc-400" />
              Integration Settings
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Status</label>
                <select 
                  value={config.isActive ? 'true' : 'false'}
                  onChange={(e) => updateLocalConfig(provider, 'isActive', e.target.value === 'true')}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                >
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Environment</label>
                <select 
                  value={config.mode}
                  onChange={(e) => updateLocalConfig(provider, 'mode', e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                >
                  <option value="test">Sandbox (Test)</option>
                  <option value="live">Production (Live)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">API Key / Username</label>
                <input 
                  type="text" 
                  value={config.credentials?.apiKey || ''}
                  onChange={(e) => updateCredentials(provider, 'apiKey', e.target.value)}
                  placeholder="Enter API Key"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Secret Key / Password</label>
                <input 
                  type="password" 
                  value={config.credentials?.apiSecret || ''}
                  onChange={(e) => updateCredentials(provider, 'apiSecret', e.target.value)}
                  placeholder="Enter Secret Key"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                />
              </div>
              
              {provider === 'aramex' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Account Number</label>
                    <input 
                      type="text" 
                      value={config.credentials?.accountNumber || ''}
                      onChange={(e) => updateCredentials(provider, 'accountNumber', e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Account Pin</label>
                    <input 
                      type="password" 
                      value={config.credentials?.accountPin || ''}
                      onChange={(e) => updateCredentials(provider, 'accountPin', e.target.value)}
                      placeholder="e.g. 112233"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Account Entity</label>
                    <input 
                      type="text" 
                      value={config.credentials?.accountEntity || ''}
                      onChange={(e) => updateCredentials(provider, 'accountEntity', e.target.value)}
                      placeholder="e.g. DXB"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Webhooks & API Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Webhook className="w-4 h-4 text-zinc-400" />
              Webhooks & Network
            </h4>

            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
              <h5 className="text-xs font-bold text-zinc-500 mb-2">WEBHOOK ENDPOINT</h5>
              <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
                Configure this URL in the {title} developer portal to receive real-time status updates for shipments.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-900 text-green-400 px-3 py-2 rounded-lg text-xs font-mono break-all selection:bg-green-400/30">
                  https://api.usend.com/webhooks/{provider}
                </code>
                <button 
                  onClick={() => navigator.clipboard.writeText(`https://api.usend.com/webhooks/${provider}`)}
                  className="shrink-0 p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
              <h5 className="text-xs font-bold text-blue-800 mb-2">CONNECTION GUIDELINES</h5>
              <ul className="text-xs text-blue-700 space-y-2 list-disc list-inside">
                <li>Never use Production keys in Sandbox mode.</li>
                <li>Test the connection before enabling the provider globally.</li>
                <li>Changes take effect immediately across all active merchant nodes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Couriers & Network</h1>
        <p className="text-zinc-500 mt-1">Manage integration endpoints, API credentials, and webhook receivers.</p>
      </div>

      <div className="space-y-6">
        {renderCourierCard('aramex', 'Aramex Express', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Aramex_logo.svg/2560px-Aramex_logo.svg.png')}
        {renderCourierCard('noon', 'Noon Logistics', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Noon_logo_yellow.svg/2560px-Noon_logo_yellow.svg.png')}
      </div>
    </motion.div>
  );
}
