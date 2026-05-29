const fs = require('fs');
let user = fs.readFileSync('src/screens/user/UserDashboard.tsx', 'utf8');

user = user.replace(
  `{previousOrders.map((order, i) => (`,
  `{previousOrders.length > 0 ? previousOrders.map((order: any, i) => (`
);

user = user.replace(
  `To: {order.recipient}`,
  `To: {order.recipient || order.toDestination || 'N/A'}`
);

user = user.replace(
  `</button>
                  </div>
                </div>
              ))}
            </div>`,
  `</button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full p-20 text-center text-zinc-400 italic">No previous orders found.</div>
              )}
            </div>`
);

fs.writeFileSync('src/screens/user/UserDashboard.tsx', user);
