const fs = require('fs');
let content = fs.readFileSync('src/services/aramexIntegration.ts', 'utf-8');

content = content.replace(
  `Promise<{ success: boolean; externalTrackingNumber?: string; error?: string }>`,
  `Promise<{ success: boolean; externalTrackingNumber?: string; error?: string; labelUrl?: string; base64Label?: string }>`
);

content = content.replace(
  `      return {
        success: result.success,
        externalTrackingNumber: result.trackingNumber,
        error: result.error
      };`,
  `      return {
        success: result.success,
        externalTrackingNumber: result.trackingNumber,
        error: result.error,
        labelUrl: result.labelUrl,
        base64Label: result.base64Label
      };`
);

fs.writeFileSync('src/services/aramexIntegration.ts', content);
