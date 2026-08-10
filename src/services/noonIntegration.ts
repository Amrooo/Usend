import { USendRequest } from '../context/AppContext';

export interface NoonDropOffAddress {
  address: string;
  lat: number;
  lng: number;
  contact_name: string;
  contact_phone_number: string;
  country_code: string;
}

export interface NoonTaskParams {
  outlet_code: string;
  order_reference: string;
  customer_name: string;
  customer_phone: string;
  drop_off_address: NoonDropOffAddress;
  lat: number;
  lng: number;
  cod_value: number; // in fils
  payment_method: 'COD' | 'PAID';
}

export const noonService = {
  createDeliveryTask: async (params: NoonTaskParams) => {
    try {
      const response = await fetch('/api/noon/create-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await response.json();
      return {
        success: response.status === 200 || response.status === 201 || data.status === 'SUCCESS' || !!data.mp_task_nr,
        status: response.status,
        data
      };
    } catch (e: any) {
      console.error("noonService createDeliveryTask error:", e);
      return { success: false, error: e.message || String(e) };
    }
  },

  getTaskDetails: async (mp_task_nr: string) => {
    try {
      const response = await fetch(`/api/noon/tasks/${mp_task_nr}`);
      const data = await response.json();
      return {
        success: response.status === 200,
        status: response.status,
        data
      };
    } catch (e: any) {
      console.error("noonService getTaskDetails error:", e);
      return { success: false, error: e.message || String(e) };
    }
  },

  cancelTask: async (mp_task_nr: string, reason: string = "Merchant Cancelled") => {
    try {
      const response = await fetch(`/api/noon/tasks/${mp_task_nr}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await response.json();
      return {
        success: response.status === 200,
        status: response.status,
        data
      };
    } catch (e: any) {
      console.error("noonService cancelTask error:", e);
      return { success: false, error: e.message || String(e) };
    }
  },

  getPickupAddresses: async () => {
    try {
      const response = await fetch('/api/noon/pickup-addresses');
      const data = await response.json();
      return {
        success: response.status === 200,
        data
      };
    } catch (e: any) {
      console.error("noonService getPickupAddresses error:", e);
      return { success: false, error: e.message || String(e) };
    }
  }
};
