const fs = require('fs');
let content = fs.readFileSync('src/components/OrderWizard.tsx', 'utf-8');

// 1. Remove automatic Aramex push
content = content.replace(
  `      if (shipmentData.courier === 'aramex') {
        const aramexRes = await aramexService.createDeliveryJob(reqPayload);
        if (aramexRes.success === false) { 
          console.error("Aramex failed (non-blocking for USend UI)", aramexRes.error);
        }
      }`,
  ``
);

// 2. Add state variables for Aramex
content = content.replace(
  `  const [noonTestingLoading, setNoonTestingLoading] = useState(false);`,
  `  const [noonTestingLoading, setNoonTestingLoading] = useState(false);
  const [aramexTestingLoading, setAramexTestingLoading] = useState(false);
  const [aramexTestingSuccess, setAramexTestingSuccess] = useState<boolean | null>(null);
  const [aramexTestingLogs, setAramexTestingLogs] = useState<{request: any, response: any} | null>(null);`
);

// 3. Add handlePushToAramexStaging
const noonHandle = `const handlePushToNoonStaging = async () => {`;
const aramexHandle = `const handlePushToAramexStaging = async () => {
    if (!createdOrderId) return;
    setAramexTestingLoading(true);
    setAramexTestingLogs(null);
    setAramexTestingSuccess(null);

    try {
      const targetOrder = activeRequests.find(r => r.id === createdOrderId);
      if (!targetOrder) {
        alert("Error: Order not found in system state.");
        setAramexTestingLoading(false);
        return;
      }
      
      const reqPayload = { ...targetOrder };
      const logTimestamp = new Date().toISOString();
      const res = await aramexService.createDeliveryJob(reqPayload);

      setAramexTestingLogs({
        request: reqPayload,
        response: res
      });

      if (res.success) {
        setAramexTestingSuccess(true);
      } else {
        setAramexTestingSuccess(false);
      }
    } catch (err: any) {
      setAramexTestingSuccess(false);
      setAramexTestingLogs({
        request: { error: "Client-side Exception" },
        response: { error: err.message }
      });
    } finally {
      setAramexTestingLoading(false);
    }
  };

  `;

content = content.replace(noonHandle, aramexHandle + noonHandle);

fs.writeFileSync('src/components/OrderWizard.tsx', content);
