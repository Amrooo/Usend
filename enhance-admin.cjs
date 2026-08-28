const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'admin', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove CSVBatchControlDesk function (from "function CSVBatchControlDesk" up to "function WalletManagementDesk")
const csvRegex = /function CSVBatchControlDesk\(\) \{[\s\S]*?(?=function WalletManagementDesk\(\) \{)/;
content = content.replace(csvRegex, '');

// 2. Remove the 'batches' case from renderContent
const caseRegex = /case 'batches': return <CSVBatchControlDesk \/>;\n\s*/;
content = content.replace(caseRegex, '');

// 3. Remove the 'batches' nav link
const navRegex = /\{\s*id:\s*'batches',\s*icon:.*?label:.*?\},\n\s*/;
content = content.replace(navRegex, '');

// 4. Enhance WalletManagementDesk
// We'll replace the existing WalletManagementDesk with an enhanced version.
const walletRegex = /function WalletManagementDesk\(\) \{[\s\S]*?(?=export default function AdminDashboard)/;

const enhancedWallet = `function WalletManagementDesk() {
  const { t } = useLanguage();
  const [financialTab, setFinancialTab] = useState<'ap_merchants' | 'ap_couriers' | 'ar_cod' | 'revenue'>('ap_merchants');
  const [notif, setNotif] = useState("");

  // Accounts Payable: Merchants (COD Remittance)
  const [apMerchants, setApMerchants] = useState([
    { id: "SET-M-8812", merchant: "Noon E-commerce", cycle: "May 15 - May 22", grossCod: 48200, deliveryFees: 1200, commission: 482, netPayable: 46518, status: "Pending Approval" },
    { id: "SET-M-8811", merchant: "IKEA UAE", cycle: "May 10 - May 17", grossCod: 128400, deliveryFees: 4500, commission: 1284, netPayable: 122616, status: "Remitted" },
    { id: "SET-M-8810", merchant: "Spinneys Supermarket", cycle: "May 10 - May 17", grossCod: 14500, deliveryFees: 800, commission: 145, netPayable: 13555, status: "Under Review" }
  ]);

  // Accounts Payable: Couriers (Delivery Fees)
  const [apCouriers, setApCouriers] = useState([
    { id: "INV-C-9021", courier: "Aramex Express", cycle: "May 15 - May 22", deliveries: 412, grossFees: 12450, penalties: 650, netPayable: 11800, status: "Audit Discrepancy" },
    { id: "INV-C-9020", courier: "Noon Hyperlocal", cycle: "May 15 - May 22", deliveries: 188, grossFees: 5640, penalties: 0, netPayable: 5640, status: "Approved" },
    { id: "INV-C-9019", courier: "DHL Express", cycle: "May 10 - May 17", deliveries: 89, grossFees: 8900, penalties: 0, netPayable: 8900, status: "Paid" }
  ]);

  // Accounts Receivable: COD Collection (Cash on Hand)
  const [arCod, setArCod] = useState([
    { id: "AR-COD-110", entity: "Aramex Express", type: "3PL Partner", outstandingCash: 24500, lastDeposit: "May 21, 2026", status: "Pending Deposit" },
    { id: "AR-COD-111", entity: "Saeed Al Remeithi", type: "In-House Driver", outstandingCash: 1250, lastDeposit: "May 22, 2026", status: "Overdue" },
    { id: "AR-COD-112", entity: "Noon Hyperlocal", type: "3PL Partner", outstandingCash: 0, lastDeposit: "May 23, 2026", status: "Reconciled" }
  ]);

  // Platform Revenue Ledger
  const [revenueLedger] = useState([
    { id: "REV-9921", type: "Commission", source: "Noon E-commerce (SET-M-8812)", amount: 482, date: "2026-05-23" },
    { id: "REV-9920", type: "Delivery Margin", source: "Order ORD-1192", amount: 5, date: "2026-05-23" },
    { id: "REV-9919", type: "Delivery Margin", source: "Order ORD-1193", amount: 12, date: "2026-05-22" }
  ]);

  const triggerAction = (message: string) => {
    setNotif(message);
    setTimeout(() => setNotif(""), 4000);
  };

  const handleRemitMerchant = (id: string) => {
    setApMerchants(prev => prev.map(item => item.id === id ? { ...item, status: "Remitted" } : item));
    triggerAction(\`WPS remittance authorized for \${id}.\`);
  };

  const handleApproveCourier = (id: string) => {
    setApCouriers(prev => prev.map(item => item.id === id ? { ...item, status: "Approved" } : item));
    triggerAction(\`Courier invoice \${id} approved for payout.\`);
  };

  const handleReconcileCOD = (id: string) => {
    setArCod(prev => prev.map(item => item.id === id ? { ...item, status: "Reconciled", outstandingCash: 0, lastDeposit: new Date().toLocaleDateString() } : item));
    triggerAction(\`COD cash collection reconciled for \${id}.\`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Remitted': case 'Approved': case 'Paid': case 'Reconciled':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending Approval': case 'Pending Deposit': case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Audit Discrepancy': case 'Overdue':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-black text-zinc-900 tracking-tight flex items-center gap-3">
            Platform Wallets & Ledger
          </h3>
          <p className="text-zinc-500 font-medium mt-1">Reconcile Accounts Payable, COD Receivables, and Platform Revenue seamlessly.</p>
        </div>
      </div>

      {notif && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 shadow-lg shadow-emerald-500/10">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          {notif}
        </motion.div>
      )}

      {/* KPI Cards with Premium UI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-16 h-16 text-[#4f95cc]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#4f95cc] block mb-2 relative z-10">AP: Merchants (COD)</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">182,689 <span className="text-base text-zinc-400 font-bold">AED</span></span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">Pending Remittance</span>
        </div>
        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck className="w-16 h-16 text-[#d12421]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#d12421] block mb-2 relative z-10">AP: Couriers (Fees)</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">26,340 <span className="text-base text-zinc-400 font-bold">AED</span></span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">Pending Approval</span>
        </div>
        <div className="bg-gradient-to-br from-white to-zinc-50 border border-zinc-200/60 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Banknote className="w-16 h-16 text-emerald-600" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block mb-2 relative z-10">AR: COD Cash (Fleet)</span>
          <span className="text-3xl font-display font-black text-zinc-900 relative z-10 block">25,750 <span className="text-base text-zinc-400 font-bold">AED</span></span>
          <span className="text-xs text-zinc-500 font-semibold mt-2 block relative z-10">Outstanding Collection</span>
        </div>
        <div className="bg-gradient-to-br from-[#113f36] to-[#0c2a24] text-white p-6 rounded-[2rem] shadow-xl shadow-[#113f36]/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-200 block mb-2 relative z-10">Platform Revenue YTD</span>
          <span className="text-3xl font-display font-black relative z-10 block">1,842,900 <span className="text-base text-emerald-300 font-bold">AED</span></span>
          <span className="text-xs text-emerald-100/70 font-semibold mt-2 block relative z-10">+12% vs last quarter</span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-wrap border-b border-zinc-100">
          {[
            { id: 'ap_merchants', label: 'Merchants COD Remittance', count: apMerchants.length },
            { id: 'ap_couriers', label: 'Courier Payouts', count: apCouriers.length },
            { id: 'ar_cod', label: 'Fleet COD Collection', count: arCod.length },
            { id: 'revenue', label: 'Platform Revenue Ledger', count: revenueLedger.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFinancialTab(tab.id as any)}
              className={\`flex-1 py-5 px-6 text-[11px] font-black uppercase tracking-widest transition-all relative \${financialTab === tab.id ? 'text-[#113f36] bg-zinc-50/50' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/30'}\`}
            >
              {tab.label}
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 text-[10px]">{tab.count}</span>
              {financialTab === tab.id && (
                <motion.div layoutId="finTabIndicator" className="absolute bottom-0 left-0 right-0 h-1 bg-[#113f36]" />
              )}
            </button>
          ))}
        </div>

        {/* --- Merchants Table --- */}
        {financialTab === 'ap_merchants' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                  <th className="p-5">Settlement ID</th>
                  <th className="p-5">Merchant Name</th>
                  <th className="p-5">Cycle / Period</th>
                  <th className="p-5 font-mono text-right">Gross COD</th>
                  <th className="p-5 font-mono text-right">Fees & Comm.</th>
                  <th className="p-5 font-mono text-right text-emerald-600">Net Payable</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700">
                {apMerchants.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                    <td className="p-5 font-mono text-zinc-900 font-bold">{item.id}</td>
                    <td className="p-5 font-bold text-zinc-800 flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center uppercase">{item.merchant.charAt(0)}</div>
                       {item.merchant}
                    </td>
                    <td className="p-5 text-zinc-500">{item.cycle}</td>
                    <td className="p-5 font-mono text-right">{item.grossCod.toLocaleString()}</td>
                    <td className="p-5 font-mono text-right text-rose-500">{(item.deliveryFees + item.commission).toLocaleString()}</td>
                    <td className="p-5 text-emerald-600 font-bold font-mono text-sm text-right">{item.netPayable.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={\`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider border \${getStatusColor(item.status)}\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {item.status !== 'Remitted' ? (
                        <button onClick={() => handleRemitMerchant(item.id)} className="px-4 py-2 bg-[#113f36] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0c2a24] shadow-md shadow-[#113f36]/10 transition-all opacity-0 group-hover:opacity-100">
                          Authorize WPS
                        </button>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Couriers Table --- */}
        {financialTab === 'ap_couriers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                  <th className="p-5">Invoice ID</th>
                  <th className="p-5">Courier Partner</th>
                  <th className="p-5">Deliveries</th>
                  <th className="p-5 font-mono text-right">Gross Fees</th>
                  <th className="p-5 font-mono text-right">Penalties</th>
                  <th className="p-5 font-mono text-right text-emerald-600">Net Payable</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700">
                {apCouriers.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                    <td className="p-5 font-mono text-zinc-900 font-bold">{item.id}</td>
                    <td className="p-5 font-bold text-zinc-800">{item.courier}</td>
                    <td className="p-5 text-zinc-500 font-mono">{item.deliveries}</td>
                    <td className="p-5 font-mono text-right">{item.grossFees.toLocaleString()}</td>
                    <td className="p-5 font-mono text-right text-rose-500">{item.penalties.toLocaleString()}</td>
                    <td className="p-5 text-emerald-600 font-bold font-mono text-sm text-right">{item.netPayable.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={\`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider border \${getStatusColor(item.status)}\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {item.status !== 'Approved' && item.status !== 'Paid' ? (
                        <button onClick={() => handleApproveCourier(item.id)} className="px-4 py-2 bg-[#d12421] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#a01c19] shadow-md shadow-[#d12421]/10 transition-all opacity-0 group-hover:opacity-100">
                          Approve Payout
                        </button>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- COD Table --- */}
        {financialTab === 'ar_cod' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                  <th className="p-5">Collection ID</th>
                  <th className="p-5">Driver / Entity</th>
                  <th className="p-5">Entity Type</th>
                  <th className="p-5">Last Deposit</th>
                  <th className="p-5 font-mono text-right text-emerald-600">Outstanding Cash</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700">
                {arCod.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors group">
                    <td className="p-5 font-mono text-zinc-900 font-bold">{item.id}</td>
                    <td className="p-5 font-bold text-zinc-800">{item.entity}</td>
                    <td className="p-5 text-zinc-500"><span className="bg-zinc-100 px-2 py-1 rounded text-[10px] uppercase font-black">{item.type}</span></td>
                    <td className="p-5 text-zinc-500">{item.lastDeposit}</td>
                    <td className="p-5 text-emerald-600 font-bold font-mono text-sm text-right">{item.outstandingCash.toLocaleString()}</td>
                    <td className="p-5">
                      <span className={\`px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider border \${getStatusColor(item.status)}\`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {item.status !== 'Reconciled' ? (
                        <button onClick={() => handleReconcileCOD(item.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md shadow-emerald-600/10 transition-all opacity-0 group-hover:opacity-100">
                          Mark Received
                        </button>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Revenue Table --- */}
        {financialTab === 'revenue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50/50 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-100">
                  <th className="p-5">Transaction ID</th>
                  <th className="p-5">Revenue Type</th>
                  <th className="p-5">Source Reference</th>
                  <th className="p-5">Date</th>
                  <th className="p-5 font-mono text-right text-[#113f36]">Amount (AED)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-zinc-700">
                {revenueLedger.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                    <td className="p-5 font-mono text-zinc-900 font-bold">{item.id}</td>
                    <td className="p-5 font-bold text-zinc-800">
                      <span className={\`px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-wider border \${item.type === 'Commission' ? 'bg-[#4f95cc]/10 text-[#4f95cc] border-[#4f95cc]/20' : 'bg-[#113f36]/10 text-[#113f36] border-[#113f36]/20'}\`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-5 text-zinc-650">{item.source}</td>
                    <td className="p-5 text-zinc-500 font-mono">{item.date}</td>
                    <td className="p-5 text-[#113f36] font-bold font-mono text-sm text-right">+{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
`;

content = content.replace(walletRegex, enhancedWallet);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully enhanced AdminDashboard.tsx!');
