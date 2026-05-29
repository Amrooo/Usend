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
  aramexLogs?: { request: any; response: any; timestamp: string };
  phone?: string;
  pickupAddress?: string;
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

interface AppContextType {
  activeRequests: USendRequest[];
  merchants: Merchant[];
  users: USendUser[];
  settings: PlatformSettings | null;
  addRequest: (req: USendRequest) => void;
  updateRequest: (id: string, data: Partial<USendRequest>) => void;
  updateRequestStatus: (id: string, status: RequestStatus, eta?: string) => void;
  updateSettings: (settings: PlatformSettings) => void;
  addUser: (user: Partial<USendUser>) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  user: any;
  currentRequest: USendRequest | null;
  setCurrentRequest: (req: USendRequest | null) => void;
  isLoading: boolean;
  merchantActiveTab: string;
  setMerchantActiveTab: (tab: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_REQUESTS: USendRequest[] = [
  {
     id: "REQ-2041", name: "Al Futtaim Logistics", channel: "Merchant Portal", date: "Today, 10:42 AM", status: "Pending", 
     position: [24.89, 55.08], address: "Dubai Industrial City",
     itemType: "Electronics", description: "10 Pallets of Consumer Electronics. Handle with care, fragile items included. Ensure dry transport.", 
     photoUrl: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&q=80&w=400", 
     amountType: "packages", paymentMethod: "Credit Card", orderAmount: "12,500 AED", applicantType: "Merchant", 
     fromDestination: "Jebel Ali Port", toDestination: "Dubai Mall", etaTime: "2 Hours"
  },
  {  
     id: "REQ-2040", name: "Ahmad Yasin", channel: "Mobile App", date: "Today, 09:12 AM", status: "Reviewing", 
     position: [24.49, 54.40], address: "Abu Dhabi, Al Reem",
     itemType: "Documents", description: "Legal Contracts for real estate closing.", 
     photoUrl: "https://images.unsplash.com/photo-1618044733300-9472054094ee?auto=format&fit=crop&q=80&w=400", 
     amountType: "single item", paymentMethod: "Cash on Delivery", orderAmount: "150 AED", applicantType: "Individual User", 
     fromDestination: "Al Reem Island", toDestination: "Corniche Road", etaTime: "45 Minutes" 
  },
  { 
     id: "REQ-2039", name: "Noon E-commerce", channel: "API Integration", date: "Yesterday", status: "Approved", 
     position: [25.32, 55.40], address: "Sharjah, Industrial Area 3",
     itemType: "Retail Goods", description: "Mixed E-commerce Orders for daily delivery routes.", 
     photoUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&q=80&w=400", 
     amountType: "many items", paymentMethod: "Wallet Balance", orderAmount: "5,400 AED", applicantType: "Merchant", 
     fromDestination: "Sharjah Warehouse", toDestination: "Various UAE", etaTime: "Next Day" 
  },
  { 
     id: "MRSL-9921-X", name: "Alex Rivera", channel: "Mobile App", date: "Today, 11:30 AM", status: "in_transit",
     address: "123 Business Way, DXB", itemType: "Other", description: "Personal delivery", photoUrl: "",
     amountType: "single item", paymentMethod: "Credit Card", orderAmount: "120 AED", applicantType: "Individual User",
     fromDestination: "Central Warehouse", toDestination: "123 Business Way, DXB", etaTime: "10 mins"
  }
];

const INITIAL_MERCHANTS: Merchant[] = [
  { id: 'MER-101', name: 'Al Futtaim Logistics', sector: 'Retail & Automotive', status: 'Verified', integration: 'API', orders: 12450, contact: 'logistics@alfuttaim.com' },
  { id: 'MER-102', name: 'Noon E-commerce', sector: 'E-commerce', status: 'Verified', integration: 'API', orders: 89000, contact: 'partners@noon.com' },
  { id: 'MER-103', name: 'Spinneys Supermarket', sector: 'Grocery', status: 'Pending', integration: 'Portal', orders: 450, contact: 'ops@spinneys.com' },
  { id: 'MER-104', name: 'IKEA UAE', sector: 'Furniture', status: 'Verified', integration: 'API', orders: 3200, contact: 'delivery@ikea.ae' },
];

const INITIAL_USERS: USendUser[] = [
  { id: 'USR-001', uid: 'USR-001', name: 'Ahmad Yasin', type: 'Driver', status: 'Active', rating: 4.8, deliveries: 142, phone: '+971 50 123 4567', email: 'driver1@usend-api.com', role: 'driver' },
  { id: 'USR-002', uid: 'USR-002', name: 'Sarah Smith', type: 'Customer', status: 'Active', rating: 5.0, deliveries: 12, phone: '+971 55 987 6543', email: 'sarah@usend-api.com', role: 'user' },
  { id: 'USR-003', uid: 'USR-003', name: 'Mohammed Ali', type: 'Driver', status: 'Inactive', rating: 4.5, deliveries: 340, phone: '+971 52 333 4444', email: 'driver2@usend-api.com', role: 'driver' },
  { id: 'USR-004', uid: 'USR-004', name: 'Emma Watson', type: 'Customer', status: 'Active', rating: 4.9, deliveries: 5, phone: '+971 54 555 6666', email: 'emma@usend-api.com', role: 'user' },
];

const INITIAL_SETTINGS: PlatformSettings = {
  merchantCommission: 2.5,
  driverPlatformFee: 15,
  baseDeliveryFee: 12,
  perKmRate: 2.5
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeRequests, setActiveRequests] = useState<USendRequest[]>(INITIAL_REQUESTS);
  const [merchants, setMerchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [users, setUsers] = useState<USendUser[]>(INITIAL_USERS);
  const [settings, setSettings] = useState<PlatformSettings | null>(INITIAL_SETTINGS);
  const [currentRequest, setCurrentRequest] = useState<USendRequest | null>(INITIAL_REQUESTS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [merchantActiveTab, setMerchantActiveTab] = useState<string>('dashboard');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      
      if (u) {
        let finalRole = 'user';
        if (u.email?.toLowerCase().includes('merchant')) finalRole = 'merchant';
        else if (u.email?.toLowerCase().includes('admin')) finalRole = 'admin';
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
              email: u.email,
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
          
          setUser({ ...u, role: finalRole, ...userDoc.data() });
        } catch (error) {
          console.warn('Profile DB sync skipped (offline or missing permission):', error);
          setUser({ ...u, role: finalRole });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribeAuth();
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

    return () => {
      unsubscribeRequests();
      unsubscribeMerchants();
      unsubscribeUsers();
      unsubscribeSettings();
    };
  }, [user]);

  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOutUser = async () => {
    await logout();
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
      addRequest, 
      updateRequest,
      updateRequestStatus, 
      updateSettings,
      addUser,
      signIn,
      signOut: signOutUser,
      user,
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
