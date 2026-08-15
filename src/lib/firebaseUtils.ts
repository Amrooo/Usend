import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  setDoc, 
  updateDoc, 
  addDoc,
  FirestoreError,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { db, auth } from '../firebase';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/configuration-not-found' || error?.message?.includes('configuration-not-found')) {
      throw new Error('Google Sign-In is disabled in Firebase Console. Enable "Google" under Firebase Console -> Authentication -> Sign-in Method.');
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function getFirestoreErrorInfo(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = getFirestoreErrorInfo(error, operationType, path);
  console.warn('Firestore sync skipped (unauthenticated/permission restriction):', errInfo.error || path);
  throw new Error(JSON.stringify(errInfo));
}

export function subscribeToCollection<T>(
  path: string, 
  callback: (data: T[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  }, (error: FirestoreError) => {
    const errInfo = getFirestoreErrorInfo(error, OperationType.LIST, path);
    const customError = new Error(JSON.stringify(errInfo));
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    if (onError) {
      onError(customError);
    } else {
      throw customError;
    }
  });
}

export async function createDocument(path: string, id: string, data: any) {
  try {
    await setDoc(doc(db, path, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export async function updateDocument(path: string, id: string, data: any) {
  try {
    await updateDoc(doc(db, path, id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
}
