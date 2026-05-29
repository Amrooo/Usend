const fs = require('fs');

let file = fs.readFileSync('src/screens/user/UserOrders.tsx', 'utf8');

file = file.replace(
  `            ))}
          </div>`,
  `            )) : (
              <div className="col-span-full p-20 text-center text-zinc-400 italic">No previous orders found.</div>
            )}
          </div>`
);

fs.writeFileSync('src/screens/user/UserOrders.tsx', file);
