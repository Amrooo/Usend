const fs = require('fs');

let c = fs.readFileSync('src/screens/merchant/MerchantIntegrations.tsx', 'utf8');

const regex = /const couriersList = \[\s*\{\s*id: 'aramex',[\s\S]*?description: ".*?"\s*\}\s*\];/m;

const replacement = `const couriersList = [
    {
      id: 'aramex',
      name: 'Aramex',
      logo: (
        <span className="text-4xl font-extrabold tracking-tight text-[#d12421] lowercase font-sans select-none">aramex</span>
      ),
      description: "Aramex is a global shipping and logistics company that provides a wide range of transportation services to businesses and individuals worldwide."
    },
    {
      id: 'dhl',
      name: 'DHL',
      logo: (
        <div className="flex items-center gap-[1px] select-none">
          <span className="text-4xl font-black italic tracking-widest text-[#d01c10] font-sans uppercase leading-none">DHL</span>
          <div className="flex flex-col gap-[3px] ml-1.5 justify-center">
            <div className="w-8 h-[2px] bg-[#d01c10]"></div>
            <div className="w-12 h-[2px] bg-[#d01c10]"></div>
            <div className="w-6 h-[2px] bg-[#d01c10]"></div>
          </div>
        </div>
      ),
      description: "DHL is the world's leading logistics company offering shipping solutions raging from domestic and international deliveries."
    },
    {
      id: 'fedex',
      name: 'FedEx',
      logo: (
        <span className="text-3xl font-black tracking-tight font-sans select-none">
          <span className="text-[#49169a]">Fed</span><span className="text-[#ff6605]">Ex</span><span className="text-xs font-bold text-[#ff6605] align-super ml-0.5">&reg;</span>
        </span>
      ),
      description: "FedEx has the largest air cargo fleet in the world which makes them leaders in the express transportation method."
    }
  ];`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/screens/merchant/MerchantIntegrations.tsx', c);
