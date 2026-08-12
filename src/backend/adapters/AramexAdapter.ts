import {
  CourierAdapter,
  CanonicalRatePayload,
  CanonicalRateResponse,
  CanonicalShipmentPayload,
  CanonicalShipmentResponse,
  CanonicalTrackingResponse,
  CourierCredentials,
  CourierEnvironment
} from './CourierAdapter';

export class AramexAdapter implements CourierAdapter {
  id = 'aramex';
  name = 'Aramex';
  capabilities = ['RATE', 'SHIPMENT', 'TRACKING', 'LABEL'];

  private getBaseUrl(env: CourierEnvironment): string {
    return "https://ws.aramex.net";
  }

  async validateCredentials(credentials: CourierCredentials, environment: CourierEnvironment): Promise<{ success: boolean; error?: string }> {
    const baseUrl = this.getBaseUrl(environment);
    const path = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";

    const payload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password || "",
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || '0', 10) || 0
      },
      Transaction: {
        Reference1: "Connection Verification",
        Reference2: "", Reference3: "", Reference4: "", Reference5: ""
      },
      OriginAddress: { City: "Dubai", CountryCode: "AE" },
      DestinationAddress: { City: "Abu Dhabi", CountryCode: "AE" },
      ShipmentDetails: {
        PaymentType: "P",
        ProductGroup: "DOM",
        ProductType: "OND",
        ActualWeight: { Value: 1, Unit: "KG" },
        ChargeableWeight: { Value: 1, Unit: "KG" },
        NumberOfPieces: 1
      }
    };

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        return { success: false, error: `Aramex returned status code ${response.status}` };
      }
      const data = await response.json();
      if (data.HasErrors) {
        return { success: false, error: data.Notifications?.[0]?.Message || `Aramex API credentials validation failed. Raw response: ${JSON.stringify(data)}` };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error while connecting to Aramex" };
    }
  }

  async calculateRate(payload: CanonicalRatePayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalRateResponse> {
    const baseUrl = this.getBaseUrl(environment);
    const path = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";

    const aramexPayload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || '0', 10) || 0
      },
      Transaction: {
        Reference1: "Rate Calculation",
        Reference2: "", Reference3: "", Reference4: "", Reference5: ""
      },
      OriginAddress: {
        City: payload.originCity,
        CountryCode: payload.originCountry
      },
      DestinationAddress: {
        City: payload.destCity,
        CountryCode: payload.destCountry
      },
      ShipmentDetails: {
        PaymentType: payload.codAmount ? "C" : "P", // C = COD, P = Prepaid
        ProductGroup: payload.originCountry === payload.destCountry ? "DOM" : "EXP",
        ProductType: payload.isExpress ? "PPX" : "OND",
        ActualWeight: { Value: payload.weightKg, Unit: "KG" },
        ChargeableWeight: { Value: payload.weightKg, Unit: "KG" },
        NumberOfPieces: 1,
        Services: payload.codAmount ? "CODS" : ""
      }
    };

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aramexPayload)
      });
      const data = await response.json();
      if (data.HasErrors) {
        return { success: false, error: data.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data)}` };
      }
      return {
        success: true,
        totalAmount: data.TotalAmount?.Value,
        currency: data.TotalAmount?.CurrencyCode,
        serviceName: payload.isExpress ? "Aramex Priority Express" : "Aramex Value Parcel"
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async createShipment(payload: CanonicalShipmentPayload, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalShipmentResponse> {
    const baseUrl = this.getBaseUrl(environment);
    const path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";
    
    const isDomestic = payload.senderCountry === payload.receiverCountry;

    const aramexPayload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || '0', 10) || 0
      },
      Transaction: {
        Reference1: payload.reference || "USend Shipment",
        Reference2: "", Reference3: "", Reference4: "", Reference5: ""
      },
      Shipments: [
        {
          Reference1: payload.reference || "",
          Reference2: "", Reference3: "",
          Shipper: {
            Reference1: "USend Central Depot",
            Reference2: "",
            AccountNumber: credentials.accountNumber,
            PartyAddress: {
              Line1: payload.senderAddress,
              Line2: "", Line3: "",
              City: payload.senderCity,
              CountryCode: payload.senderCountry
            },
            Contact: {
              PersonName: payload.senderName,
              CompanyName: "USend Hub",
              PhoneNumber1: payload.senderPhone,
              EmailAddress: "dispatch@usend.ae"
            }
          },
          Consignee: {
            Reference1: "", Reference2: "",
            AccountNumber: "",
            PartyAddress: {
              Line1: payload.receiverAddress,
              Line2: "", Line3: "",
              City: payload.receiverCity,
              CountryCode: payload.receiverCountry
            },
            Contact: {
              PersonName: payload.receiverName,
              CompanyName: payload.receiverName,
              PhoneNumber1: payload.receiverPhone,
              EmailAddress: ""
            }
          },
          ThirdParty: null,
          Reference4: "", Reference5: "",
          ShippingDateTime: `/Date(${new Date().getTime()})/`,
          DueDate: `/Date(${new Date(new Date().getTime() + 86400000).getTime()})/`,
          Comments: "USend Aggregation Dispatch",
          PickupLocation: "Reception",
          OperationsInstructions: "Handle with care",
          AccountingInstrcutions: "",
          Details: {
            Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
            ActualWeight: { Value: payload.weightKg, Unit: "KG" },
            ChargeableWeight: { Value: payload.weightKg, Unit: "KG" },
            DescriptionOfGoods: payload.goodsDescription,
            GoodsOriginCountry: payload.senderCountry,
            NumberOfPieces: 1,
            ProductGroup: isDomestic ? "DOM" : "EXP",
            ProductType: "OND",
            PaymentType: payload.codAmountAED > 0 ? "C" : "P",
            PaymentOptions: "",
            Services: payload.codAmountAED > 0 ? "CODS" : "",
            CashOnDeliveryAmount: payload.codAmountAED > 0 ? {
              Value: payload.codAmountAED,
              CurrencyCode: "AED"
            } : null,
            CustomsValueAmount: null
          }
        }
      ],
      LabelInfo: {
        ReportID: 9729,
        ReportType: "URL"
      }
    };

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aramexPayload)
      });
      const data = await response.json();
      
      if (data.HasErrors) {
        return { success: false, error: data.Notifications?.[0]?.Message || `Unknown Error. Raw response: ${JSON.stringify(data)}` };
      }
      const shipment = data.Shipments?.[0];
      if (!shipment) {
        return { success: false, error: "No shipment data returned" };
      }

      return {
        success: true,
        trackingNumber: shipment.ID,
        labelUrl: shipment.ShipmentLabel?.LabelURL,
        base64Label: shipment.ShipmentLabel?.LabelFileContents,
        providerStatus: "Generated"
      };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async trackShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<CanonicalTrackingResponse> {
    const baseUrl = this.getBaseUrl(environment);
    const path = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";

    const payload = {
      ClientInfo: {
        UserName: credentials.username,
        Password: credentials.password,
        Version: credentials.version || "v1.0",
        AccountNumber: credentials.accountNumber,
        AccountPin: credentials.accountPin,
        AccountEntity: credentials.accountEntity,
        AccountCountryCode: credentials.accountCountryCode,
        Source: parseInt(credentials.source || '0', 10) || 0
      },
      Transaction: { Reference1: "", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
      Shipments: [trackingId]
    };

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (data.HasErrors) {
        return { success: false, providerStatus: 'Error', usendStatus: 'FAILED', timestamp: new Date().toISOString(), error: data.Notifications?.[0]?.Message || `Tracking Error. Raw response: ${JSON.stringify(data)}` };
      }

      const results = data.TrackingResults;
      if (!results || results.length === 0) {
        return { success: false, providerStatus: 'No Data', usendStatus: 'PENDING', timestamp: new Date().toISOString(), error: "No tracking data found" };
      }

      const updates = results[0].Value;
      if (!updates || updates.length === 0) {
        return { success: true, providerStatus: 'No Updates', usendStatus: 'PENDING', timestamp: new Date().toISOString() };
      }

      const latest = updates[updates.length - 1]; // Assuming Aramex returns them chronologically. Often it's reverse, but we'll use the first one if reversed.
      // Wait, Aramex actually returns newest first typically. Let's use updates[0].
      const newest = updates[0];
      
      return {
        success: true,
        providerStatus: newest.UpdateDescription,
        usendStatus: this.mapStatus(newest.UpdateCode),
        location: newest.UpdateLocation,
        timestamp: newest.UpdateDateTime
      };
    } catch (e: any) {
      return { success: false, providerStatus: 'Error', usendStatus: 'FAILED', timestamp: new Date().toISOString(), error: e.message };
    }
  }

  async cancelShipment(trackingId: string, credentials: CourierCredentials, environment: CourierEnvironment): Promise<boolean> {
    // Aramex API doesn't have a direct cancel API via standard tracking. 
    // Usually it's handled via a separate request or customer support. 
    // We will return false for now indicating it's not supported automatically.
    return false;
  }

  private mapStatus(aramexCode: string): string {
    const code = aramexCode.toUpperCase();
    if (["SH005", "SH006", "SH007", "SH014", "SH164"].includes(code)) return "DELIVERED";
    if (["SH012", "SH069", "SH234"].includes(code)) return "IN_TRANSIT";
    if (["SH047", "SH048", "SH049"].includes(code)) return "FAILED";
    return "PENDING";
  }
}
