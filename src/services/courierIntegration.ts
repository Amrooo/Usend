export interface CourierCredentials {
  version: string;
  accountNumber: string;
  accountPin: string;
  accountEntity: string;
  accountCountryCode: string;
  source: string;
  username: string;
  password?: string;
  apiKey?: string;
  apiEnv: 'sandbox' | 'production';
}

export interface RateParams {
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  weightKb: number; // weight in kg
  isExpress: boolean;
  credentials: CourierCredentials;
}

export interface ShipmentParams {
  credentials: CourierCredentials;
  senderName: string;
  senderPhone: string;
  senderCity: string;
  senderCountry: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  receiverCountry: string;
  receiverAddress: string;
  goodsDescription: string;
  weightKg: number;
  codAmountAED: number;
}

export interface TrackingStep {
  status: string;
  location: string;
  time: string;
  description: string;
}

export const defaultAramexCreds: CourierCredentials = {
  version: "v1",
  accountNumber: "45796",
  accountPin: "116216",
  accountEntity: "DXB",
  accountCountryCode: "AE",
  source: "24",
  username: "testingapi@aramex.com",
  password: "R123456789$r",
  apiEnv: 'sandbox'
};

export const defaultDhlCreds: CourierCredentials = {
  version: "v33",
  accountNumber: "849301931-DXB",
  accountPin: "902123",
  accountEntity: "MIDDLE_EAST",
  accountCountryCode: "AE",
  source: "30",
  username: "dhl_sandbox_user_ae",
  password: "DHL_secret_2026",
  apiEnv: 'sandbox'
};

export const defaultFedexCreds: CourierCredentials = {
  version: "v2026",
  accountNumber: "990158221",
  accountPin: "FDX-3029",
  accountEntity: "GCC_FEDEX",
  accountCountryCode: "AE",
  source: "45",
  username: "fedex_api_express_sandbox",
  password: "FedexSecuredPwd_9901",
  apiEnv: 'sandbox'
};

// Global in-memory registry of all shipping waybills successfully created in this session
export const createdWaybills = new Set<string>();

export const courierIntegrationService = {
  // 1. RATE CALCULATOR
  calculateRate: async (courierId: string, params: RateParams) => {
    // Generate simulated network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const isDomestic = params.originCountry.toLowerCase() === params.destCountry.toLowerCase();
    
    // Base Rates
    let baseRate = 12.00; // Economy / Domestic
    if (courierId === 'dhl') baseRate = 18.00;
    if (courierId === 'fedex') baseRate = 16.50;

    let expressSurcharge = params.isExpress ? 25.00 : 0;
    let weightSurcharge = Math.max(0, params.weightKb - 1) * (isDomestic ? 4.50 : 15.00);
    let crossBorderFee = isDomestic ? 0 : 45.00;

    // Fuel and service margins
    let netTotal = baseRate + expressSurcharge + weightSurcharge + crossBorderFee;
    let taxes = netTotal * 0.05; // 5% VAT UAE
    let finalTotal = netTotal + taxes;

    // Format the payload and output
    const timestamp = new Date().toISOString();
    
    // Construct real-looking JSON/SOAP Equivalent SOAP Payload depending on Courier
    let requestPayload = {};
    let responsePayload = {};

    if (courierId === 'aramex') {
      try {
        const aramexPayload = {
          ClientInfo: {
            UserName: params.credentials.username,
            Password: params.credentials.password || "",
            Version: params.credentials.version,
            AccountNumber: params.credentials.accountNumber,
            AccountPin: params.credentials.accountPin,
            AccountEntity: params.credentials.accountEntity,
            AccountCountryCode: params.credentials.accountCountryCode,
            Source: parseInt(params.credentials.source, 10) || 24
          },
          Transaction: {
            Reference1: "Rate Calculation",
            Reference2: "",
            Reference3: "",
            Reference4: "",
            Reference5: ""
          },
          OriginAddress: {
            Line1: "Origin Physical Location",
            Line2: "",
            Line3: "",
            City: params.originCity || "Dubai",
            StateOrProvinceCode: "",
            PostCode: "",
            CountryCode: params.originCountry || "AE",
            Longitude: 0,
            Latitude: 0,
            BuildingNumber: "",
            BuildingName: "",
            Floor: "",
            Room: "",
            POBox: "",
            Description: ""
          },
          DestinationAddress: {
            Line1: "Destination Physical Location",
            Line2: "",
            Line3: "",
            City: params.destCity || "Abu Dhabi",
            StateOrProvinceCode: "",
            PostCode: "",
            CountryCode: params.destCountry || "AE",
            Longitude: 0,
            Latitude: 0,
            BuildingNumber: "",
            BuildingName: "",
            Floor: "",
            Room: "",
            POBox: "",
            Description: ""
          },
          ShipmentDetails: {
            PaymentType: "P",
            ProductGroup: isDomestic ? "DOM" : "EXP",
            ProductType: params.isExpress ? (isDomestic ? "OND" : "PDX") : (isDomestic ? "DOM" : "DPX"),
            ActualWeight: { Value: params.weightKb, Unit: "KG" },
            ChargeableWeight: { Value: params.weightKb, Unit: "KG" },
            NumberOfPieces: 1
          }
        };

        const res = await fetch("/api/aramex/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aramexPayload)
        });
        const data = await res.json();
        
        responsePayload = data;
        requestPayload = aramexPayload;
        
        if (data.HasErrors) {
          throw new Error(data.Notifications?.[0]?.Message || "Aramex API Error");
        }
        
        finalTotal = data.TotalAmount?.Value || finalTotal;
        baseRate = finalTotal;
        expressSurcharge = 0;
        weightSurcharge = 0;
        taxes = 0;

      } catch (err: any) {
        console.error("Aramex rate logic failed", err);
        throw err; // Bubble the error up to the UI 
      }
    } else if (courierId === 'dhl') {
      requestPayload = {
        rateRequest: {
          requestedServices: params.isExpress ? ["ExpressWorldwide"] : ["ExpressClassic"],
          shipperAddress: { city: params.originCity, countryCode: params.originCountry },
          recipientAddress: { city: params.destCity, countryCode: params.destCountry },
          packages: [{ weight: params.weightKb, dimensions: { length: 10, width: 10, height: 10 } }]
        }
      };
      
      responsePayload = {
        rateResponse: {
          services: [
            {
              serviceName: params.isExpress ? "DHL Express Worldwide" : "DHL Domestic Delivery",
              totalCharges: [
                {
                  chargeAmount: Number(finalTotal.toFixed(2)),
                  currencyType: "AED",
                  chargeTypes: [
                    { type: "Freight charges", amount: Number(netTotal.toFixed(2)) },
                    { type: "Emergency Fuel", amount: 2.50 },
                    { type: "VAT 5%", amount: Number(taxes.toFixed(2)) }
                  ]
                }
              ],
              deliveryDate: params.isExpress ? "Next Day Delivery" : "3-4 Business Days"
            }
          ]
        }
      };
    } else { // fedex
      requestPayload = {
        rateRequestMsg: {
          credentials: { key: params.credentials.accountNumber, securityCode: params.credentials.accountPin },
          shippingDetails: {
            serviceType: params.isExpress ? "PRIORITY_OVERNIGHT" : "FEDEX_GROUND",
            shipper: { address: { city: params.originCity, country: params.originCountry } },
            recipient: { address: { city: params.destCity, country: params.destCountry } },
            weight: { value: params.weightKb, units: "KG" }
          }
        }
      };

      responsePayload = {
        rateResponseMsg: {
          rates: {
            netCharge: Number(finalTotal.toFixed(2)),
            baseCharge: Number(baseRate.toFixed(2)),
            taxCharge: Number(taxes.toFixed(2)),
            totalSurcharges: Number((expressSurcharge + weightSurcharge).toFixed(2)),
            currency: "AED"
          },
          status: "SUCCESS"
        }
      };
    }

    return {
      rateAED: finalTotal,
      taxAED: taxes,
      breakdown: {
        base: baseRate,
        weightSurcharge,
        expressSurcharge,
        crossBorderFee
      },
      requestPayload,
      responsePayload,
      timestamp,
      serviceName: courierId === 'aramex'
        ? (params.isExpress ? "Aramex Priority Parcel Express" : "Aramex Value Parcel Saver")
        : courierId === 'dhl'
          ? (params.isExpress ? "DHL Express Worldwide" : "DHL Domestic Delivery")
          : (params.isExpress ? "FedEx Priority Overnight" : "FedEx Ground Saver")
    };
  },

  // 2. SHIPPING SERVICE SHIPPING WAYBILLS
  createShipment: async (courierId: string, params: ShipmentParams) => {
    await new Promise(resolve => setTimeout(resolve, 1400));

    // Create unique dynamic airway bills
    const randomNo = Math.floor(1000000 + Math.random() * 9000000);
    let trackingNumber = courierId === 'aramex'
      ? `ARX-${params.credentials.accountNumber}-${randomNo}`
      : courierId === 'dhl'
        ? `DHL-DXB-${randomNo}`
        : `FDX-AE-${randomNo}`;

    // Register tracking number in our global sandbox session registry to prevent fake tracking lookup
    createdWaybills.add(trackingNumber);

    const timestamp = new Date().toISOString();
    let requestPayload = {};
    let responsePayload = {};

    if (courierId === 'aramex') {
      try {
        const aramexPayload = {
          ClientInfo: {
            UserName: params.credentials.username,
            Password: params.credentials.password || "",
            Version: params.credentials.version,
            AccountNumber: params.credentials.accountNumber,
            AccountPin: params.credentials.accountPin,
            AccountEntity: params.credentials.accountEntity,
            AccountCountryCode: params.credentials.accountCountryCode,
            Source: parseInt(params.credentials.source, 10) || 24
          },
          Transaction: { Reference1: `USEND-SO-${randomNo}`, Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
          Shipments: [
            {
              Reference1: `USEND-SO-${randomNo}`,
              Reference2: "Includes Return Label",
              Reference3: "",
              Reference4: "",
              Reference5: "",
              ForeignHAWB: "",
              TransportType_x0020_: 0,
              TransportType: 0,
              ShippingDateTime: '\/Date('+Date.now()+')\/',
              DueDate: '\/Date('+(Date.now() + 86400000 * 2)+')\/',
              Comments: "Handle with care",
              PickupLocation: "Reception",
              OperationsInstructions: "Return Label Requested",
              AccountingInstrcutions: "",
              Shipper: {
                Reference1: "USEND MERCHANT",
                Reference2: "",
                AccountNumber: params.credentials.accountNumber,
                PartyAddress: {
                  Line1: params.senderAddress || "Some street",
                  Line2: "", Line3: "",
                  City: params.senderCity || "Dubai",
                  StateOrProvinceCode: "", PostCode: "",
                  CountryCode: params.senderCountry || "AE",
                  Longitude: 0, Latitude: 0,
                  BuildingNumber: "", BuildingName: "", Floor: "", Room: "", POBox: "", Description: ""
                },
                Contact: {
                  Department: "Logistics",
                  PersonName: params.senderName || "Sender",
                  Title: "Mr.",
                  CompanyName: "USEND Merchant",
                  PhoneNumber1: params.senderPhone || "00971501234567",
                  PhoneNumber2: "",
                  CellPhone: params.senderPhone || "00971501234567",
                  EmailAddress: "sender@example.com",
                  Type: ""
                }
              },
              Consignee: {
                Reference1: "CUSTOMER",
                Reference2: "",
                AccountNumber: "", 
                PartyAddress: {
                  Line1: params.receiverAddress || "Other street",
                  Line2: "", Line3: "",
                  City: params.receiverCity || "Abu Dhabi",
                  StateOrProvinceCode: "", PostCode: "",
                  CountryCode: params.receiverCountry || "AE",
                  Longitude: 0, Latitude: 0,
                  BuildingNumber: "", BuildingName: "", Floor: "", Room: "", POBox: "", Description: ""
                },
                Contact: {
                  Department: "Receiving",
                  PersonName: params.receiverName || "Receiver",
                  Title: "Mr.",
                  CompanyName: "Private Customer",
                  PhoneNumber1: params.receiverPhone || "00971509999999",
                  PhoneNumber2: "",
                  CellPhone: params.receiverPhone || "00971509999999",
                  EmailAddress: "receiver@example.com",
                  Type: ""
                }
              },
              Details: {
                Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
                ActualWeight: { Value: params.weightKg || 1, Unit: "KG" },
                ChargeableWeight: { Value: params.weightKg || 1, Unit: "KG" },
                DescriptionOfGoods: params.goodsDescription || "Goods",
                GoodsOriginCountry: params.senderCountry || "AE",
                NumberOfPieces: 1,
                ProductGroup: "DOM",
                ProductType: "ONP",
                PaymentType: "P",
                PaymentOptions: "",
                CustomsValueAmount: { Value: 0, CurrencyCode: "AED" },
                CashOnDeliveryAmount: params.codAmountAED > 0 ? { Value: params.codAmountAED, CurrencyCode: "AED" } : { Value: 0, CurrencyCode: "AED" },
                InsuranceAmount: { Value: 0, CurrencyCode: "AED"},
                CashAdditionalAmount: { Value: 0, CurrencyCode: "AED"},
                CashAdditionalAmountDescription: "",
                CollectAmount: { Value: 0, CurrencyCode: "AED" },
                Services: params.codAmountAED > 0 ? "CODS" : "",
                Items: []
              }
            }
          ],
          LabelInfo: {
            ReportID: 9201,
            ReportType: "URL"
          }
        };

        const res = await fetch("/api/aramex/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aramexPayload)
        });
        const data = await res.json();
        
        requestPayload = aramexPayload;
        responsePayload = data;

        if (data.HasErrors) {
          throw new Error(data.Notifications?.[0]?.Message || "Aramex API Error");
        }

        const processedShipment = data.Shipments?.[0]?.ProcessedShipment;
        if (processedShipment && processedShipment.ID) {
           trackingNumber = processedShipment.ID;
           createdWaybills.add(trackingNumber);
        }

      } catch (err: any) {
        console.error("Aramex shipping logic failed", err);
        return {
          success: false,
          trackingNumber: "",
          error: err.message || "Failed to create shipment in Aramex API",
          requestPayload,
          responsePayload,
          timestamp
        };
      }
    } else {
      requestPayload = {
        bookingRequest: {
          shipper: { name: params.senderName, contact: params.senderPhone, addressLine1: params.senderAddress, city: params.senderCity },
          receiver: { name: params.receiverName, contact: params.receiverPhone, addressLine1: params.receiverAddress, city: params.receiverCity },
          consignment: { description: params.goodsDescription, weight: params.weightKg, codAmount: params.codAmountAED }
        }
      };

      responsePayload = {
        bookingResponse: {
          id: trackingNumber,
          manifestId: `MAN-${randomNo}`,
          estimatedDelivery: new Date(Date.now() + 86400000 * 2).toLocaleDateString(),
          pdfBytes: "MOCK_BASE64_STREAM",
          status: "SUCCESS"
        }
      };
    }

    return {
      success: true,
      trackingNumber,
      carrierReference: `REF-${randomNo}`,
      requestPayload,
      responsePayload,
      timestamp,
      labelPreview: {
        awb: trackingNumber,
        weight: `${params.weightKg} Kg`,
        sender: `${params.senderName}, ${params.senderCity}, AE`,
        receiver: `${params.receiverName}, ${params.receiverCity}, AE`,
        cod: params.codAmountAED > 0 ? `AED ${params.codAmountAED.toFixed(2)}` : 'PREPAID',
        goods: params.goodsDescription || 'E-Commerce Parcel Goods'
      }
    };
  },

  // 3. TRACKING SERVICE
  trackShipment: async (courierId: string, trackingNumber: string, credentials?: CourierCredentials) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    const cleanNum = trackingNumber.trim();
    
    // We only resolve statuses for waybills that actually exist in our simulation
    const isPredefined = [
      "ARX-45796-7777777", 
      "DHL-DXB-8888888", 
      "FDX-AE-9999999"
    ].includes(cleanNum);

    const exists = createdWaybills.has(cleanNum) || isPredefined || courierId === 'aramex'; // Force real API calls for Aramex

    const timestamp = new Date().toISOString();

    if (!exists) {
      return {
        success: false,
        trackingNumber: cleanNum,
        error: `No active shipping sequence found matches reference "${cleanNum}". To track a package successfully, you must first generate a waybill using the "Generate Air Waybill" panel in the third tab above.`,
        steps: [],
        requestPayload: {
          WSDLLookup: {
            ClientInfo: { AccountNumber: "45796", ProductType: "DomesticExpress" },
            TrackingID: cleanNum,
            Result: "NotFound"
          }
        },
        responsePayload: {
          SoapFault: {
            faultcode: "soap:Client",
            faultstring: "OrderNotFoundException: Tracking ID has not been created under this account portfolio."
          }
        }
      };
    }

    const prefix = cleanNum.split('-')[0] || courierId.toUpperCase();
    
    // Simulate real checkpoints
    const steps: TrackingStep[] = [
      {
        status: "MANIFEST_CREATED",
        location: "Dubai Hub (Jebel Ali)",
        time: "10 hours ago",
        description: "Electronic order data registered with dispatch carrier system. Courier collection request generated."
      },
      {
        status: "SORTING_ORIGIN",
        location: "Dubai Sorting Facility (DXB)",
        time: "7 hours ago",
        description: "Package collected, weight audits finalized. Loaded into cross-city delivery trailer container."
      },
      {
        status: "IN_TRANSIT",
        location: "Cross-UAE Transit",
        time: "4 hours ago",
        description: "Dispatched from regional logistics sorting terminal to last-mile hub location."
      },
      {
        status: "OUT_FOR_DELIVERY",
        location: "Last-Mile Delivery Unit",
        time: "1 hour ago",
        description: "Package received at destination depot and assigned to last-mile delivery dispatcher driver courier."
      }
    ];

    let requestPayload = {};
    let responsePayload = {};

    if (courierId === 'aramex') {
      try {
        const aramexPayload = {
          ClientInfo: {
            UserName: credentials?.username || "testingapi@aramex.com",
            Password: credentials?.password || "R123456789$r",
            Version: credentials?.version || "v1",
            AccountNumber: credentials?.accountNumber || "45796",
            AccountPin: credentials?.accountPin || "116216",
            AccountEntity: credentials?.accountEntity || "DXB",
            AccountCountryCode: credentials?.accountCountryCode || "AE",
            Source: parseInt(credentials?.source || "24", 10)
          },
          Transaction: { 
            Reference1: `USEND-TRK-${cleanNum}`,
            Reference2: "", Reference3: "", Reference4: "", Reference5: ""
          },
          Shipments: [cleanNum],
          GetLastTrackingUpdateOnly: false
        };

        const res = await fetch("/api/aramex/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aramexPayload)
        });
        
        const data = await res.json();
        
        requestPayload = aramexPayload;
        responsePayload = data;

        if (data.HasErrors) {
          throw new Error(data.Notifications?.[0]?.Message || "Aramex API Error: " + JSON.stringify(data));
        }

        const results = data.TrackingResults;
        if (results && results.length > 0) {
           const trackingData = results[0].Value;
           // If we got real tracking steps, map them to our internal array
           if (trackingData && trackingData.length > 0) {
             steps.length = 0; // Clear simulated points
             trackingData.forEach((point: any) => {
               steps.push({
                 status: point.UpdateCode || "UPDATE",
                 location: point.UpdateLocation || "N/A",
                 time: point.UpdateDateTime || new Date().toISOString(),
                 description: point.UpdateDescription || ""
               });
             });
           } else {
             steps.length = 0; // Clear if empty
           }
        }
      } catch (err: any) {
        console.error("Aramex tracking logic failed", err);
        return {
          success: false,
          trackingNumber: cleanNum,
          error: err.message || "Failed to contact Aramex tracking API",
          steps: [],
          requestPayload,
          responsePayload,
          timestamp
        };
      }
    } else {
      requestPayload = {
        trackingRequest: {
          trackingIds: [cleanNum],
          detailedHistory: true
        }
      };

      responsePayload = {
        trackingResponse: {
          carrier: courierId.toUpperCase(),
          id: cleanNum,
          currentStatus: "OUT_FOR_DELIVERY",
          checkpoints: steps.map(s => ({
            event: s.status,
            area: s.location,
            timestamp: s.time,
            comment: s.description
          }))
        }
      };
    }

    return {
      success: true,
      trackingNumber: cleanNum,
      currentStatus: "OUT_FOR_DELIVERY",
      steps,
      requestPayload,
      responsePayload,
      timestamp
    };
  }
};
