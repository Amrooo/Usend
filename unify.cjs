import fs from 'fs';
import path from 'path';

// Read GuestOrderWidget and make the new shared OrderWizard
const guestWidgetContent = fs.readFileSync('./src/components/GuestOrderWidget.tsx', 'utf8');

// I will write OrderWizard directly.
