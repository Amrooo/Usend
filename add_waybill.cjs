const fs = require('fs');
let content = fs.readFileSync('src/components/OrderWizard.tsx', 'utf-8');

const aramexSuccessStr = `{aramexTestingSuccess 
                            ? \`SUCCESS: Aramex generated tracking ID: \${aramexTestingLogs.response?.externalTrackingNumber || 'Unknown'}\`
                            : \`FAILED: Staging response failed\`}`;

const newAramexSuccessStr = `{aramexTestingSuccess 
                            ? (
                                <span>
                                  SUCCESS: Aramex generated tracking ID: {aramexTestingLogs.response?.externalTrackingNumber || 'Unknown'}
                                  {aramexTestingLogs.response?.labelUrl && (
                                    <a href={aramexTestingLogs.response.labelUrl} target="_blank" rel="noreferrer" className="ml-3 inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">
                                      View Waybill
                                    </a>
                                  )}
                                </span>
                              )
                            : \`FAILED: Staging response failed\`}`;

content = content.replace(aramexSuccessStr, newAramexSuccessStr);
fs.writeFileSync('src/components/OrderWizard.tsx', content);
