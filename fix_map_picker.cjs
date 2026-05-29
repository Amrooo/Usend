const fs = require('fs');

let file = fs.readFileSync('src/components/MapPicker.tsx', 'utf8');

file = file.replace(
  `onLocationSelected?: (location: { address: string; position: { lat: number; lng: number } }) => void;`,
  `onSelect?: (address: string, position: [number, number]) => void;`
);

file = file.replace(
  `  const handleConfirm = () => {
    if (position && onLocationSelected) {
      onLocationSelected({
        address: address,
        position: { lat: position.lat, lng: position.lng }
      });
    }
    if (onClose) onClose();
  };`,
  `  const handleConfirm = () => {
    if (position && onSelect) {
      onSelect(address, [position.lat, position.lng]);
    }
    if (onClose) onClose();
  };`
);

// We should also look at other `MapPicker` props expected, like `initialAddress`.
file = file.replace(
  `initialPosition?: { lat: number; lng: number };`,
  `initialPosition?: [number, number] | { lat: number; lng: number };\n  initialAddress?: string;`
);

// and update position usage inside the component
file = file.replace(
  `const [position, setPosition] = useState<L.LatLng | null>(initialPosition ? new L.LatLng(initialPosition.lat, initialPosition.lng) : new L.LatLng(25.2048, 55.2708));`,
  `const [position, setPosition] = useState<L.LatLng | null>(initialPosition ? new L.LatLng(Array.isArray(initialPosition) ? initialPosition[0] : initialPosition.lat, Array.isArray(initialPosition) ? initialPosition[1] : initialPosition.lng) : new L.LatLng(25.2048, 55.2708));`
);

file = file.replace(
  `const [address, setAddress] = useState('Dubai, United Arab Emirates');`,
  `const [address, setAddress] = useState(initialAddress || 'Dubai, United Arab Emirates');`
);

file = file.replace(
  `export default function MapPicker({ onLocationSelected, onClose, initialPosition }: MapPickerProps) {`,
  `export default function MapPicker({ onSelect, onClose, initialPosition, initialAddress }: MapPickerProps) {`
);

fs.writeFileSync('src/components/MapPicker.tsx', file);
