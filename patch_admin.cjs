const fs = require('fs');
const file = 'src/screens/admin/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add firebase imports
if (!content.includes('import { db }')) {
  content = content.replace(
    "import { useApp, CourierConnectionStatus } from '../../context/AppContext';",
    "import { useApp, CourierConnectionStatus } from '../../context/AppContext';\nimport { db } from '../../firebase';\nimport { doc, getDoc, setDoc } from 'firebase/firestore';"
  );
}

// 2. Modify CouriersIntegrationsHub
const hubStart = content.indexOf('function CouriersIntegrationsHub() {');
const hubEndStr = '  return (\n    <div className="flex h-screen bg-zinc-50 overflow-hidden text-zinc-900 font-sans">';
const hubEnd = content.indexOf(hubEndStr, hubStart);

let hubCode = content.substring(hubStart, hubEnd);

// Replace useEffect to fetch private credentials
hubCode = hubCode.replace(
  /useEffect\(\(\) => \{\n    if \(courierConfigs\) \{\n      setLocalConfigs\(courierConfigs\);\n    \}\n  \}, \[courierConfigs\]\);/g,
  `useEffect(() => {
    const fetchConfigs = async () => {
      if (!courierConfigs) return;
      try {
        const privateSnap = await getDoc(doc(db, 'private_settings', 'courier_credentials'));
        const privateCreds = privateSnap.exists() ? privateSnap.data() : {};
        
        // Merge public configs with private creds
        const merged = { ...courierConfigs };
        for (const [id, config] of Object.entries(merged)) {
          if (privateCreds[id]) {
            merged[id] = {
              ...config,
              sandboxCreds: privateCreds[id].sandboxCreds || config.sandboxCreds,
              productionCreds: privateCreds[id].productionCreds || config.productionCreds
            };
          }
        }
        setLocalConfigs(merged);
      } catch (err) {
        console.error('Failed to fetch private courier credentials:', err);
        setLocalConfigs(courierConfigs); // fallback
      }
    };
    fetchConfigs();
  }, [courierConfigs]);`
);

// Replace handleSave to split and save both
hubCode = hubCode.replace(
  /const handleSave = async \(\) => \{\n    setIsSaving\(true\);\n    try \{\n      await updateCourierConfigs\(localConfigs\);\n      triggerToast\(`Saved \$\{currentConfig.name\} configuration successfully!`\);\n    \} catch \(err: any\) \{\n      triggerToast\(`Error: \$\{err.message \|\| 'Failed to save settings'\}`\);\n    \} finally \{\n      setIsSaving\(false\);\n    \}\n  \};/g,
  `const handleSave = async () => {
    setIsSaving(true);
    try {
      const publicConfigs = {};
      const privateCreds = {};
      
      for (const [id, config] of Object.entries(localConfigs)) {
        publicConfigs[id] = {
          id: config.id,
          name: config.name,
          status: config.status,
          currentMode: config.currentMode,
          baseUrlUat: config.baseUrlUat,
          baseUrlProd: config.baseUrlProd,
          connectionStatus: config.connectionStatus,
          rates: config.rates
        };
        privateCreds[id] = {
          sandboxCreds: config.sandboxCreds || {},
          productionCreds: config.productionCreds || {}
        };
      }
      
      await updateCourierConfigs(publicConfigs);
      await setDoc(doc(db, 'private_settings', 'courier_credentials'), privateCreds);
      
      triggerToast(\`Saved \${currentConfig.name} configuration successfully!\`);
    } catch (err: any) {
      triggerToast(\`Error: \${err.message || 'Failed to save settings'}\`);
    } finally {
      setIsSaving(false);
    }
  };`
);

// Replace the Credentials UI to handle Noon appropriately
// The original code has a grid of 6 text inputs. We will conditionally render them.
const credsStart = hubCode.indexOf('{/* Credentials Fields */}');
const credsEnd = hubCode.indexOf('{/* RIGHT: Rate Matrix */}');
let credsCode = hubCode.substring(credsStart, credsEnd);

credsCode = `{/* Credentials Fields */}
                <div className="grid grid-cols-2 gap-4">
                  {isNoon ? (
                    <>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">API Key</label>
                        <input type="password" value={creds?.apiKey || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'apiKey', e.target.value)}
                          placeholder="Noon Secret Key" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Store ID (Optional)</label>
                        <input type="text" value={creds?.storeId || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'storeId', e.target.value)}
                          placeholder="e.g. STORE_123" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Username / Email</label>
                        <input type="text" value={creds?.username || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'username', e.target.value)}
                          placeholder="API username" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Password / Secret</label>
                        <input type="password" value={creds?.password || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'password', e.target.value)}
                          placeholder="••••••••••••" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Account Number</label>
                        <input type="text" value={creds?.accountNumber || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'accountNumber', e.target.value)}
                          placeholder="e.g. 154454" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Account PIN</label>
                        <input type="text" value={creds?.accountPin || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'accountPin', e.target.value)}
                          placeholder="e.g. 115216" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Entity / Node</label>
                        <input type="text" value={creds?.accountEntity || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'accountEntity', e.target.value)}
                          placeholder="e.g. DXB" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Country Code</label>
                        <input type="text" value={creds?.accountCountryCode || ''} onChange={(e) => handleCredChange(cfg.currentMode, 'accountCountryCode', e.target.value)}
                          placeholder="e.g. AE" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-500 text-zinc-800" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              `;

hubCode = hubCode.substring(0, credsStart) + credsCode + hubCode.substring(credsEnd);

content = content.substring(0, hubStart) + hubCode + content.substring(hubEnd);
fs.writeFileSync(file, content);
console.log('Successfully updated AdminDashboard.tsx');
