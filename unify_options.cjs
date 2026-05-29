const fs = require('fs');

function processFile(path) {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');

  // Change "hover:underline flex items-center gap-1" to just a nice badge style, or eliminate text
  // Let's replace:
  // <button
  // type="button"
  // onClick={() => {
  //   setIsMapOpenQuoteTarget('manual_pickup');
  //   setIsMapOpen(true);
  // }}
  // className="text-[9px] font-bold text-[#1452D1] hover:underline flex items-center gap-1"
  // >
  // <Map className="w-3 h-3" /> Pin on Map
  // </button>

  // Replace all the Pin on map labels
  content = content.replace(/<Map className="w-3 h-3" \/> Pin on Map/g, '<Map className="w-3 h-3" /> Select Map');
  
  // Actually the prompt says "instead of thsis stupid pin location link ugly ugly"
  // Let's replace the link style with a button style.
  content = content.replace(/hover:underline flex items-center gap-1/g, 'bg-zinc-100 hover:bg-zinc-200 px-2 py-1 flex items-center gap-1 rounded-md transition-colors');
  content = content.replace(/hover:underline flex items-center gap-1/g, 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2 py-1 flex items-center gap-1 rounded-md transition-colors');

  // Remove USend on-demand fleet from shipping options.
  // Look for the block containing key: 'usend', label: 'USend On-Demand Local Fleet'
  const usendFleetRegex = /\{\s*key:\s*'usend',\s*label:\s*'USend On-Demand Local Fleet'[\s\S]*?\},/g;
  content = content.replace(usendFleetRegex, '');

  fs.writeFileSync(path, content);
}

processFile('src/screens/user/UserIndividualOrder.tsx');
processFile('src/screens/merchant/MerchantIndividualOrder.tsx');

// GuestOrderWidget removal
const guestPath = 'src/components/GuestOrderWidget.tsx';
if (fs.existsSync(guestPath)) {
  let guest = fs.readFileSync(guestPath, 'utf8');
  const usendGuestRegex = /\{\/\* USend Local \*\/\}.*?(?=\{\/\* Aramex \*\/})/s;
  guest = guest.replace(usendGuestRegex, '');
  
  // Since it was a radio button list, maybe we have another format:
  // <label className="group relative">
  //     <input type="radio" name="courier" value="usend"
  
  const usendInputRegex = /<\!-- USend Local -->[\s\S]*?<\!-- Aramex -->/i;
  // Actually wait, let's just match the USend label block.
  // Since the code in GuestOrderWidget is:
  //                 {/* USend Local */}
  //                 <label className="group relative">
  //                   <input type="radio" name="courier" value="usend" ... />
  //                   ...
  //                 </label>
  
  const usendLabelRegex = /\{\/\* USend Local \*\/\}\s*<label className="group relative">[\s\S]*?<h4 className="font-bold text-sm text-zinc-900 leading-none mb-1 text-left">USend Local Fleet<\/h4>[\s\S]*?<\/label>/;
  guest = guest.replace(usendLabelRegex, '');

  fs.writeFileSync(guestPath, guest);
}
