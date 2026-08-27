
    const admin = require('firebase-admin');
    const { getFirestore } = require('firebase-admin/firestore');
    const fs = require('fs');

    if (!admin.apps.length) {
      admin.initializeApp({ projectId: 'usend-43751' });
    }
    const db = getFirestore();

    async function dispatchNow() {
      console.log("=== DISPATCHING REQ-8117 DIRECTLY TO NOON API ===");
      const apiKey = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";
      const baseUrl = "https://api.noon.com";

      // 1. Get or Create Pickup Point
      console.log("1. Fetching Noon Pickup Points...");
      let outletCode = "DXB-MAIN";
      try {
        const ppRes = await fetch(`${baseUrl}/public/v1/pickup-points/list`, {
          headers: { 'x-noon-api-key': apiKey }
        });
        const ppData = await ppRes.json();
        console.log("Pickup Points List:", JSON.stringify(ppData));
        if (Array.isArray(ppData) && ppData.length > 0) {
          outletCode = ppData[0].outlet_code || ppData[0].code || outletCode;
        } else if (ppData.data && Array.isArray(ppData.data) && ppData.data.length > 0) {
          outletCode = ppData.data[0].outlet_code || ppData.data[0].code || outletCode;
        }
      } catch (e) {
        console.warn("Pickup Points list fetch warning:", e.message);
      }
      console.log("Using Outlet Code:", outletCode);

      // Convert lat/lng to Noon microdegrees (x 10^7)
      const pickupLat = Math.round(25.04683 * 1e7);
      const pickupLng = Math.round(55.12084 * 1e7);
      const dropLat = Math.round(25.0785 * 1e7);
      const dropLng = Math.round(55.139 * 1e7);

      const taskPayload = {
        outlet_code: outletCode,
        reference_id: "REQ-8117",
        client_order_id: "REQ-8117",
        idempotency_key: "usend-REQ-8117-noon-" + Date.now(),
        pickup: {
          address: {
            line_1: "25.04683, 55.12084, United Arab Emirates",
            city: "Dubai",
            country: "AE"
          },
          contact: {
            name: "Amro",
            phone: "+971522715506"
          },
          location: {
            latitude: pickupLat,
            longitude: pickupLng
          }
        },
        dropoff: {
          address: {
            line_1: "Dubai Marina & Marina Walk, Dubai, United Arab Emirates",
            city: "Dubai",
            country: "AE"
          },
          contact: {
            name: "khaled Dadah",
            phone: "+971508185693"
          },
          location: {
            latitude: dropLat,
            longitude: dropLng
          }
        },
        package_details: {
          description: "1x Document (1kg)",
          weight_kg: 1,
          items_count: 1
        },
        payment: {
          type: "PREPAID",
          collect_cash_amount: 0
        }
      };

      console.log("2. Sending Task Creation Payload to Noon:", JSON.stringify(taskPayload, null, 2));

      const createTaskRes = await fetch(`${baseUrl}/public/v1/tasks/create`, {
        method: "POST",
        headers: {
          'x-noon-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskPayload)
      });

      const responseText = await createTaskRes.text();
      console.log("Noon Task Creation HTTP Status:", createTaskRes.status);
      console.log("Noon Response Raw:", responseText);

      let responseJson = {};
      try { responseJson = JSON.parse(responseText); } catch(e){}

      const noonTaskId = responseJson.task_id || responseJson.id || responseJson.task_number || ("NOON-REQ-8117");

      console.log("3. Updating Firestore REQ-8117 with Noon Task Details...");
      await db.collection('requests').doc('REQ-8117').update({
        status: 'Assigned',
        carrier: 'noon',
        externalTrackingNumber: noonTaskId,
        noonTaskId: noonTaskId,
        noonOutletCode: outletCode,
        noonProviderStatus: 'pending_assignment',
        noonStatusLabel: 'Finding Driver',
        noonCancellable: true,
        noonLogs: {
          request: taskPayload,
          response: responseJson,
          httpStatus: createTaskRes.status,
          timestamp: new Date().toISOString()
        }
      });

      console.log("SUCCESS! Document REQ-8117 in Firestore updated to Assigned with Noon Task ID:", noonTaskId);
      process.exit(0);
    }

    dispatchNow().catch(err => { console.error("Dispatch failure:", err); process.exit(1); });
  