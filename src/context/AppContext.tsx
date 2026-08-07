import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { subscribeToCollection, updateDocument, createDocument, signInWithGoogle, logout } from '../lib/firebaseUtils';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export type RequestStatus = 'Pending' | 'Reviewing' | 'Approved' | 'assigning' | 'in_transit' | 'delivered' | 'Rejected' | 'En-route';

export interface USendRequest {
  id: string;
  name: string; // Customer or Company name
  channel: string; // 'Merchant Portal', 'Mobile App', 'API Integration'
  date: string;
  status: RequestStatus;
  position?: [number, number];
  address: string;
  itemType: string;
  description: string;
  photoUrl?: string;
  amountType: 'single item' | 'many items' | 'packages';
  paymentMethod: string;
  orderAmount: string;
  applicantType: string;
  fromDestination: string;
  toDestination: string;
  etaTime: string;
  driverId?: string;
  userId?: string;
  merchantId?: string;
  carrier?: string;
  externalTrackingNumber?: string;
  awbLabelBase64?: string;
  awbLabelUrl?: string;
  aramexLogs?: { request: any; response: any; timestamp: string, pickupId?: string };
  phone?: string;
  pickupAddress?: string;
  printFormat?: 'PDF' | 'ZPL';
}

export interface Merchant {
  id: string;
  name: string;
  sector: string;
  status: string;
  integration: string;
  orders: number;
  contact: string;
}

export interface PlatformSettings {
  merchantCommission: number;
  driverPlatformFee: number;
  baseDeliveryFee: number;
  perKmRate: number;
}

export interface USendUser {
  id: string;
  uid: string;
  name: string;
  type: string;
  status: string;
  rating: number;
  deliveries: number;
  phone: string;
  email: string;
  role: string;
}

export interface CourierRateDetail {
  baseFee: number;
  perKmRate: number;
  perKgRate: number;
  expressSurcharge: number;
  codFee: number;
}

export interface CourierIntegrationConfig {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  currentMode: 'sandbox' | 'production';
  sandboxCreds: {
    username: string;
    password?: string;
    accountNumber: string;
    accountPin: string;
    accountEntity: string;
    accountCountryCode: string;
    source: string;
    apiKey?: string;
  };
  productionCreds: {
    username: string;
    password?: string;
    accountNumber: string;
    accountPin: string;
    accountEntity: string;
    accountCountryCode: string;
    source: string;
    apiKey?: string;
  };
  rates: {
    guest: CourierRateDetail;
    user: CourierRateDetail;
    merchant: CourierRateDetail;
  };
}

interface AppContextType {
  activeRequests: USendRequest[];
  merchants: Merchant[];
  users: USendUser[];
  settings: PlatformSettings | null;
  courierConfigs: Record<string, CourierIntegrationConfig>;
  addRequest: (req: USendRequest) => void;
  updateRequest: (id: string, data: Partial<USendRequest>) => void;
  updateRequestStatus: (id: string, status: RequestStatus, eta?: string) => void;
  updateSettings: (settings: PlatformSettings) => void;
  updateCourierConfigs: (configs: Record<string, CourierIntegrationConfig>) => Promise<void>;
  addUser: (user: Partial<USendUser>) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  user: any;
  currentRequest: USendRequest | null;
  setCurrentRequest: (req: USendRequest | null) => void;
  isLoading: boolean;
  merchantActiveTab: string;
  setMerchantActiveTab: (tab: string) => void;
  setUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_REQUESTS: USendRequest[] = [];

const INITIAL_MERCHANTS: Merchant[] = [];

const INITIAL_USERS: USendUser[] = [];

const INITIAL_SETTINGS: PlatformSettings = {
  merchantCommission: 2.5,
  driverPlatformFee: 15,
  baseDeliveryFee: 12,
  perKmRate: 2.5
};

const INITIAL_COURIER_CONFIGS: Record<string, CourierIntegrationConfig> = {
  aramex: {
    id: 'aramex',
    name: 'Aramex Express',
    status: 'Active',
    currentMode: 'sandbox',
    sandboxCreds: {
      username: "testingapi@aramex.com",
      password: "R123456789$r",
      accountNumber: "45796",
      accountPin: "116216",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      source: "24"
    },
    productionCreds: {
      username: "",
      password: "",
      accountNumber: "",
      accountPin: "",
      accountEntity: "",
      accountCountryCode: "AE",
      source: "24"
    },
    rates: {
      guest: { baseFee: 30, perKmRate: 0, perKgRate: 5, expressSurcharge: 25, codFee: 10 },
      user: { baseFee: 25, perKmRate: 0, perKgRate: 4, expressSurcharge: 20, codFee: 8 },
      merchant: { baseFee: 15, perKmRate: 0, perKgRate: 2.5, expressSurcharge: 10, codFee: 5 }
    }
  },
  noon: {
    id: 'noon',
    name: 'Noon RoD Staging',
    status: 'Active',
    currentMode: 'sandbox',
    sandboxCreds: {
      username: "noon_sandbox_user",
      password: "NoonPassword_2026",
      accountNumber: "NOON-DXB-9901",
      accountPin: "9901",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      source: "noon_staging",
      apiKey: "noon_secret_key_123"
    },
    productionCreds: {
      username: "",
      password: "",
      accountNumber: "",
      accountPin: "",
      accountEntity: "",
      accountCountryCode: "AE",
      source: "",
      apiKey: ""
    },
    rates: {
      guest: { baseFee: 25, perKmRate: 0, perKgRate: 4.5, expressSurcharge: 20, codFee: 8 },
      user: { baseFee: 20, perKmRate: 0, perKgRate: 3.5, expressSurcharge: 15, codFee: 6 },
      merchant: { baseFee: 12, perKmRate: 0, perKgRate: 2.0, expressSurcharge: 8, codFee: 3 }
    }
  },
  dhl: {
    id: 'dhl',
    name: 'DHL Express',
    status: 'Active',
    currentMode: 'sandbox',
    sandboxCreds: {
      username: "dhl_sandbox_user_ae",
      password: "DHL_secret_2026",
      accountNumber: "849301931-DXB",
      accountPin: "902123",
      accountEntity: "MIDDLE_EAST",
      accountCountryCode: "AE",
      source: "30"
    },
    productionCreds: {
      username: "",
      password: "",
      accountNumber: "",
      accountPin: "",
      accountEntity: "",
      accountCountryCode: "AE",
      source: ""
    },
    rates: {
      guest: { baseFee: 45, perKmRate: 0, perKgRate: 7, expressSurcharge: 30, codFee: 12 },
      user: { baseFee: 35, perKmRate: 0, perKgRate: 6, expressSurcharge: 25, codFee: 10 },
      merchant: { baseFee: 25, perKmRate: 0, perKgRate: 4.5, expressSurcharge: 15, codFee: 6 }
    }
  },
  fedex: {
    id: 'fedex',
    name: 'FedEx GCC',
    status: 'Active',
    currentMode: 'sandbox',
    sandboxCreds: {
      username: "fedex_api_express_sandbox",
      password: "FedexSecuredPwd_9901",
      accountNumber: "990158221",
      accountPin: "FDX-3029",
      accountEntity: "GCC_FEDEX",
      accountCountryCode: "AE",
      source: "45"
    },
    productionCreds: {
      username: "",
      password: "",
      accountNumber: "",
      accountPin: "",
      accountEntity: "",
      accountCountryCode: "AE",
      source: ""
    },
    rates: {
      guest: { baseFee: 40, perKmRate: 0, perKgRate: 6.5, expressSurcharge: 28, codFee: 10 },
      user: { baseFee: 30, perKmRate: 0, perKgRate: 5.5, expressSurcharge: 22, codFee: 8 },
      merchant: { baseFee: 20, perKmRate: 0, perKgRate: 4.0, expressSurcharge: 12, codFee: 5 }
    }
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState<USendRequest[]>(() => {
    const saved = localStorage.getItem('usend_requests');
    let loadedRequests = INITIAL_REQUESTS;
    if (saved) {
      try {
        loadedRequests = JSON.parse(saved);
      } catch (e) {
        loadedRequests = INITIAL_REQUESTS;
      }
    }
    // Always sort by ID (as timestamp surrogate) or missing createdAt so newest is first
    return loadedRequests.sort((a, b) => b.id.localeCompare(a.id));
  });
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [users, setUsers] = useState<USendUser[]>(INITIAL_USERS);
  const [settings, setSettings] = useState<PlatformSettings | null>(INITIAL_SETTINGS);
  const [courierConfigs, setCourierConfigs] = useState<Record<string, CourierIntegrationConfig>>(INITIAL_COURIER_CONFIGS);
  const [currentRequest, setCurrentRequest] = useState<USendRequest | null>(null);
  
  useEffect(() => {
    localStorage.setItem('usend_requests', JSON.stringify(activeRequests));
  }, [activeRequests]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [merchantActiveTab, setMerchantActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      unsubscribeUserDoc();
      
      if (u) {
        let finalRole = 'user';
        if (u.email?.toLowerCase().includes('merchant')) finalRole = 'merchant';
        else if (u.email?.toLowerCase().includes('admin') || u.email?.toLowerCase() === 'octman.sam@gmail.com') finalRole = 'admin';
        else if (u.email?.toLowerCase().includes('driver')) finalRole = 'driver';
        else if (u.email?.toLowerCase().includes('user')) finalRole = 'user';

        try {
          // Automatically ensure user document exists in 'users'
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              id: u.uid,
              uid: u.uid,
              name: u.displayName || 'Anonymous User',
              email: u.email || 'guest@usend.com',
              photoUrl: u.photoURL,
              role: finalRole,
              status: 'Active',
              createdAt: new Date().toISOString()
            });
          } else {
            const data = userDoc.data();
            if (data.role) {
              finalRole = data.role;
            }
          }
          
          if (u.email?.toLowerCase() === 'octman.sam@gmail.com') {
            finalRole = 'admin';
          }
          
          const currentDoc = await getDoc(userDocRef);
          const docData = currentDoc.data() || {};
          setUser({ ...u, ...docData, role: finalRole });

          // real-time onSnapshot tracking of authenticated user doc (wallet balance / transactions etc)
          unsubscribeUserDoc = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setUser((prev: any) => {
                if (!prev) return null;
                if (
                  prev.walletBalance === data.walletBalance &&
                  prev.codPending === data.codPending &&
                  JSON.stringify(prev.transactions) === JSON.stringify(data.transactions) &&
                  prev.role === data.role &&
                  prev.name === data.name
                ) {
                  return prev;
                }
                return { ...prev, ...data, role: data.role || finalRole };
              });
            }
          }, (error) => {
            console.warn('Real-time profile sync skipped:', error.message);
          });

        } catch (error) {
          console.warn('Profile DB sync skipped (offline or missing permission):', error);
          
          if (u.email?.toLowerCase() === 'octman.sam@gmail.com') {
            finalRole = 'admin';
          }
          setUser({ ...u, role: finalRole });
        }

        // Sync guest orders from localStorage to this user account
        try {
          const storedGuest = JSON.parse(localStorage.getItem('guestOrders') || '[]');
          if (storedGuest.length > 0) {
            for (const item of storedGuest) {
              await updateDocument('requests', item.id, {
                userId: u.uid,
                applicantType: 'User'
              });
            }
            localStorage.removeItem('guestOrders');
            // Notify user that their guest orders have been linked
            window.dispatchEvent(new CustomEvent('app_toast', {
              detail: {
                type: 'success',
                title: 'Guest Orders Linked',
                message: `${storedGuest.length} guest order${storedGuest.length > 1 ? 's have' : ' has'} been linked to your account.`
              }
            }));
          }
        } catch (err) {
          console.warn("Failed to sync guest orders to account:", err);
        }
      } else {
        setUser((prev: any) => {
          if (prev?.uid === 'demo-fallback-uid' || prev?.id === 'demo-fallback-uid') {
            return prev;
          }
          return null;
        });
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  useEffect(() => {
    // Only subscribe to collections if the user is authenticated.
    // If user is null, they remain in fallback/offline mode with rich simulated data.
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Subscriptions
    const unsubscribeRequests = subscribeToCollection<USendRequest>(
      'requests', 
      (data) => {
        if (data && data.length > 0) {
          setActiveRequests(data.sort((a, b) => b.id.localeCompare(a.id)));
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Requests Firestore sync skipped (will use fallback mock data):', error.message);
        setIsLoading(false);
      }
    );

    const unsubscribeMerchants = subscribeToCollection<Merchant>(
      'merchants', 
      (data) => {
        if (data && data.length > 0) {
          setMerchants(data);
        }
      },
      (error) => {
        console.warn('Merchants Firestore sync skipped (will use fallback mock data):', error.message);
      }
    );

    const unsubscribeUsers = subscribeToCollection<USendUser>(
      'users', 
      (data) => {
        if (data && data.length > 0) {
          setUsers(data);
        }
      },
      (error) => {
        console.warn('Users Firestore sync skipped (will use fallback mock data):', error.message);
      }
    );

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as PlatformSettings);
      }
    }, (error) => {
      console.warn('Settings Firestore sync skipped (will use fallback mock data):', error.message);
    });

    const unsubscribeCourierConfigs = onSnapshot(doc(db, 'settings', 'courier_configs'), (snapshot) => {
      if (snapshot.exists()) {
        setCourierConfigs(snapshot.data() as Record<string, CourierIntegrationConfig>);
      }
    }, (error) => {
      console.warn('Courier Configs Firestore sync skipped (will use fallback mock data):', error.message);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeMerchants();
      unsubscribeUsers();
      unsubscribeSettings();
      unsubscribeCourierConfigs();
    };
  }, [user?.uid]);



  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOutUser = async () => {
    await logout();
    setUser(null);
  };

  const addRequest = async (req: USendRequest) => {
    const isMerchant = req.applicantType === 'Merchant';
    const requestData: any = {
      ...req,
      createdAt: new Date().toISOString()
    };
    
    if (isMerchant) {
      requestData.merchantId = auth.currentUser?.uid || 'anonymous';
      delete requestData.userId;
    } else {
      requestData.userId = auth.currentUser?.uid || 'anonymous';
      delete requestData.merchantId;
    }
    
    // Strip any remaining undefined values
    Object.keys(requestData).forEach(key => {
      if (requestData[key] === undefined) {
        delete requestData[key];
      }
    });

    setActiveRequests(prev => {
      if (prev.some(r => r.id === req.id)) return prev;
      return [requestData, ...prev];
    });
    try {
      await createDocument('requests', req.id, requestData);
    } catch (e) {
      console.warn('Firestore write skipped/failed, fallback state maintained:', e);
    }
  };

  const updateRequest = async (id: string, data: Partial<USendRequest>) => {
    setActiveRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try {
      await updateDocument('requests', id, data);
    } catch (e) {
      console.warn('Firestore update skipped/failed, fallback state maintained:', e);
    }
  };

  const updateRequestStatus = async (id: string, status: RequestStatus, eta?: string) => {
    const updateData: any = { status };
    if (eta) updateData.etaTime = eta;
    setActiveRequests(prev => prev.map(r => r.id === id ? { ...r, ...updateData } : r));
    try {
      await updateDocument('requests', id, updateData);
    } catch (e) {
      console.warn('Firestore status update skipped/failed, fallback state maintained:', e);
    }
  };

  const updateSettings = async (newSettings: PlatformSettings) => {
    await updateDocument('settings', 'global', newSettings);
  };

  const updateCourierConfigs = async (newConfigs: Record<string, CourierIntegrationConfig>) => {
    setCourierConfigs(newConfigs);
    try {
      await setDoc(doc(db, 'settings', 'courier_configs'), newConfigs);
    } catch (e) {
      console.warn('Firestore courier configs write failed:', e);
    }
  };

  const addUser = async (userData: Partial<USendUser>) => {
    const id = userData.id || userData.uid || `USR-${Math.floor(Math.random() * 1000)}`;
    await createDocument('users', id, {
      ...userData,
      id,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <AppContext.Provider value={{ 
      activeRequests, 
      merchants,
      users,
      settings,
      courierConfigs,
      addRequest, 
      updateRequest,
      updateRequestStatus, 
      updateSettings,
      updateCourierConfigs,
      addUser,
      signIn,
      signOut: signOutUser,
      user,
      setUser,
      currentRequest, 
      setCurrentRequest,
      isLoading,
      merchantActiveTab,
      setMerchantActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
