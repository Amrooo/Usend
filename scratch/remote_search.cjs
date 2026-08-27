
    async function checkNoonProductionTask() {
      const apiKey = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";
      const baseUrl = "https://api.noon.com";

      console.log("=== QUERYING PRODUCTION NOON API (https://api.noon.com) ===");
      const candidates = ["NOON-REQ-8117", "REQ-8117", "8117"];

      for (const id of candidates) {
        try {
          const res = await fetch(`${baseUrl}/v1/tasks/${id}`, {
            headers: {
              'x-noon-api-key': apiKey,
              'Content-Type': 'application/json'
            }
          });
          const status = res.status;
          const body = await res.json().catch(() => ({}));
          console.log(`Task ${id} -> HTTP ${status}:`, JSON.stringify(body, null, 2));
        } catch (e) {
          console.error(`Task ${id} Error:`, e.message);
        }
      }
      process.exit(0);
    }
    checkNoonProductionTask();
  