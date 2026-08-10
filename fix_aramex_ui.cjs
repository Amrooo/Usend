const fs = require('fs');
let content = fs.readFileSync('src/components/OrderWizard.tsx', 'utf-8');

const noonUI = `{/* Noon Integration Testing Suite */}`;
const aramexUI = `              {/* Aramex Integration Testing Suite */}
              {shipmentData.courier === 'aramex' && (
                <div className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 text-left space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black tracking-tight text-red-800 lowercase font-sans">aramex <span className="font-light text-zinc-500">API</span></span>
                      <span className="text-[9px] bg-red-200/50 text-red-800 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">STAGING INTEGRATION SUITE</span>
                    </div>
                    <Server className="w-5 h-5 text-red-600" />
                  </div>

                  <p className="text-xs text-red-950/80 font-medium leading-relaxed">
                    Test your Aramex Staging environment integration immediately! Click below to send a live, authentic delivery request payload to Aramex Sandbox.
                  </p>

                  <div className="bg-red-100/50 border border-red-200 rounded-xl p-3">
                    <span className="text-[10px] text-red-800 font-bold block uppercase tracking-wider">STAGING REST ENDPOINT</span>
                    <span className="text-xs font-mono font-bold text-red-950 block select-all break-all mt-0.5">
                      POST /api/aramex/create-job → https://ws.dev.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments
                    </span>
                  </div>

                  <button
                    onClick={handlePushToAramexStaging}
                    disabled={aramexTestingLoading}
                    className="w-full bg-[#113f36] hover:bg-zinc-950 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aramexTestingLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>{aramexTestingLoading ? "Sending Staging API Request..." : "Push Dispatch Payload to Aramex"}</span>
                  </button>

                  {aramexTestingLogs && (
                    <div className="space-y-3 pt-2">
                      <div className={\`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 \${aramexTestingSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}\`}>
                        <div className={\`w-2.5 h-2.5 rounded-full \${aramexTestingSuccess ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse\`} />
                        <span>
                          {aramexTestingSuccess 
                            ? \`SUCCESS: Aramex generated tracking ID: \${aramexTestingLogs.response?.tracking_id || aramexTestingLogs.response?.data?.tracking_id || 'Unknown'}\`
                            : \`FAILED: Staging response failed\`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-zinc-950 text-zinc-300 rounded-xl p-4 font-mono text-[10px] overflow-auto max-h-48 leading-relaxed">
                          <p className="text-red-400 font-bold border-b border-zinc-800 pb-1 mb-2">SENT REQUEST PAYLOAD</p>
                          <pre>{JSON.stringify(aramexTestingLogs.request, null, 2)}</pre>
                        </div>
                        <div className="bg-zinc-950 text-zinc-300 rounded-xl p-4 font-mono text-[10px] overflow-auto max-h-48 leading-relaxed">
                          <p className="text-red-400 font-bold border-b border-zinc-800 pb-1 mb-2">RECEIVED RESPONSE</p>
                          <pre>{JSON.stringify(aramexTestingLogs.response, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
`;

content = content.replace(noonUI, aramexUI + noonUI);
fs.writeFileSync('src/components/OrderWizard.tsx', content);
