const fs = require('fs');
let content = fs.readFileSync('src/components/MapPicker.tsx', 'utf-8');

// Replace the fallback text and add async geocoding
content = content.replace(
  `    click(e) {
      setPosition(e.latlng);
      setAddress(\`Selected Location: \${e.latlng.lat.toFixed(4)}, \${e.latlng.lng.toFixed(4)}\`);
    },`,
  `    async click(e) {
      setPosition(e.latlng);
      setAddress(\`\${e.latlng.lat.toFixed(4)}, \${e.latlng.lng.toFixed(4)}\`); // Fallback while loading
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${e.latlng.lat}&lon=\${e.latlng.lng}\`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    },`
);

fs.writeFileSync('src/components/MapPicker.tsx', content);
