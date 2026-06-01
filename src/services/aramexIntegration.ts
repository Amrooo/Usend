import { USendRequest } from '../context/AppContext';
import { courierIntegrationService, defaultAramexCreds } from './courierIntegration';

export const aramexService = {
  createDeliveryJob: async (request: USendRequest): Promise<{ success: boolean; externalTrackingNumber?: string; error?: string }> => {
    try {
      // Parse numeric cash on delivery from orderAmount (e.g. "150 AED")
      let numericCod = 0;
      if (request.orderAmount) {
        const parsed = parseInt(request.orderAmount.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
          numericCod = parsed;
        }
      }

      const result = await courierIntegrationService.createShipment('aramex', {
        credentials: defaultAramexCreds,
        senderName: "USend Central Depot",
        senderPhone: "+971500000000",
        senderCity: "Dubai",
        senderCountry: "AE",
        senderAddress: "Jebel Ali Area Node A",
        receiverName: request.name || "Recipient Buyer",
        receiverPhone: "+971520000000",
        receiverCity: request.toDestination || "Abu Dhabi",
        receiverCountry: "AE",
        receiverAddress: request.address || request.toDestination || "Corniche Street Apt 4",
        goodsDescription: request.description || request.itemType || "E-Commerce Delivery Order Cargo",
        weightKg: 1.5,
        codAmountAED: numericCod,
        printFormat: request.printFormat
      });
      return {
        success: result.success,
        externalTrackingNumber: result.trackingNumber,
        error: result.error
      };
    } catch (e: any) {
      return { success: false, error: e.message || String(e) };
    }
  },
  
  handleExternalWebhook: (reqBody: any) => {
    console.log('Received update from external portal payload:', reqBody);
  }
};
