export const fedexService = {
  createFedexJob: async (payload: any) => {
    console.log(`%c[FedEx Sandbox API Simulated Call]`, 'color: #4D148C; font-weight: bold;');
    console.log('Payload:', payload);

    // Simulate network delay of 1.5 seconds
    await new Promise(resolve => setTimeout(resolve, 1500));

    const trackingNumber = `FDX-TEST-${Math.floor(100000000 + Math.random() * 900000000)}`;

    return {
      success: true,
      trackingNumber,
      awbUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Mock PDF
      message: 'FedEx Test Shipment created successfully.'
    };
  }
};
