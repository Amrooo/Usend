/**
 * Notification Service Layer
 * Simulates integration with Google Cloud compatible providers (SendGrid, Twilio, etc.)
 */

export interface OrderNotificationData {
  orderId: string;
  trackingLink?: string;
  amount: string;
  items: string;
  courier: string;
}

export const notificationService = {
  /**
   * Send Order Confirmation Email (e.g., via SendGrid/Mailjet)
   * Triggered to the Sender/Merchant confirming the dispatch.
   */
  sendOrderConfirmationEmail: async (toEmail: string, orderData: OrderNotificationData) => {
    // In production, this would be a POST to your backend or SendGrid API
    console.log(`%c[Email Sent: Order Confirmation]`, 'color: #1452D1; font-weight: bold;');
    console.log(`To: ${toEmail}`);
    console.log(`Template: "Your Order ${orderData.orderId} is confirmed"`);
    console.log(`Payload:`, orderData);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return { success: true, messageId: `sg-${Date.now()}` };
  },

  /**
   * Send Invoice Email (e.g., via SendGrid/Mailjet)
   * Triggered to the Sender/Merchant with payment details.
   */
  sendInvoiceEmail: async (toEmail: string, orderData: OrderNotificationData, paymentMethod: string) => {
    console.log(`%c[Email Sent: Invoice]`, 'color: #10B981; font-weight: bold;');
    console.log(`To: ${toEmail}`);
    console.log(`Template: "Invoice for Order ${orderData.orderId}"`);
    console.log(`Amount: ${orderData.amount} | Method: ${paymentMethod}`);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    return { success: true, messageId: `sg-inv-${Date.now()}` };
  },

  /**
   * Send SMS Notification (e.g., via Twilio/Unifonic)
   * Triggered to the Receiver with tracking details, and Sender with dispatch confirmation.
   */
  sendOrderSMS: async (toPhone: string, orderData: OrderNotificationData, role: 'sender' | 'receiver') => {
    console.log(`%c[SMS Sent]`, 'color: #F59E0B; font-weight: bold;');
    console.log(`To: ${toPhone} (Role: ${role})`);
    
    let message = '';
    if (role === 'receiver') {
      message = `Hi! A package is on its way to you via ${orderData.courier}. Tracking: ${orderData.trackingLink || orderData.orderId}`;
    } else {
      message = `USend: Your shipment ${orderData.orderId} has been dispatched successfully via ${orderData.courier}.`;
    }
    
    console.log(`Content: "${message}"`);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, messageId: `sm-${Date.now()}` };
  }
};
