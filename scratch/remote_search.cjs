
    async function fetchRequests() {
      console.log("=== FETCHING FIRESTORE REST API (usend-staging-9182) ===");
      try {
        const res = await fetch('https://firestore.googleapis.com/v1/projects/usend-staging-9182/databases/(default)/documents/requests?pageSize=100');
        const data = await res.json();
        console.log("Total docs returned:", data.documents?.length || 0);
        if (data.documents) {
          data.documents.forEach(doc => {
            const path = doc.name;
            const docId = path.split('/').pop();
            const fields = doc.fields || {};
            const str = JSON.stringify({ docId, fields });
            if (docId.includes('8117') || str.includes('8117') || str.includes('NOON')) {
              console.log("MATCH FOUND:", docId, JSON.stringify(fields, null, 2));
            }
          });
        }
      } catch (err) {
        console.error("REST Error:", err);
      }
    }
    fetchRequests();
  