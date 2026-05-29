const fs = require('fs');

let file = fs.readFileSync('src/screens/user/UserOrders.tsx', 'utf8');

// replace the dummy data with useApp() myRequests
file = file.replace(
  `const { t, isRTL } = useLanguage();`,
  `const { t, isRTL } = useLanguage();
  const { activeRequests, user } = require('../../context/AppContext').useApp();
  const myRequests = activeRequests.filter((req: any) => 
    (user?.uid && req.userId === user.uid) || 
    (!user?.uid && (req.applicantType === 'Individual User' || req.applicantType === 'User'))
  );
  `
);

// We need to change `previousOrders` usage to `myRequests.filter(req => req.status === 'delivered')`
const prevOrdersRegex = /const previousOrders: OrderRecord\[\] = \[[\s\S]*?\];/m;
file = file.replace(prevOrdersRegex, `
  const previousOrders = myRequests.filter((req: any) => req.status === 'delivered');
  const [searchTerm, setSearchTerm] = useState('');
  const filteredOrders = previousOrders.filter((req: any) => req.id.toLowerCase().includes(searchTerm.toLowerCase()) || (req.name || req.toDestination || '').toLowerCase().includes(searchTerm.toLowerCase()));
`);

// also add a way to update the input `searchTerm`
file = file.replace(
  `placeholder="Search orders..."`,
  `placeholder="Search orders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}`
);

// Map over filteredOrders instead of previousOrders
file = file.replace(
  `{previousOrders.map((order, i) => (`,
  `{filteredOrders.length > 0 ? filteredOrders.map((order: any, i: number) => (`
);

// replace recipient with name
file = file.replace(/order\.recipient/g, "order.name || order.toDestination");

file = file.replace(
  `</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>`,
  `</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full p-20 text-center text-zinc-400 italic">No previous orders found.</div>
            )}
          </div>`
);

fs.writeFileSync('src/screens/user/UserOrders.tsx', file);
