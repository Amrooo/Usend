import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Initialize AI Logic using official Google GenAI SDK
export const aiModel = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'MISSING_API_KEY' 
});

// Create a configured chat model helper
export const systemInstruction = "You are a smart, helpful human-like assistant for USend, an advanced logistics and multi-courier e-commerce shipping gateway in the UAE. Your task is to assist users with their inquiries. You must stick strictly to what the USend platform offers. Do not invent or exaggerate features. Respond in Arabic if the user speaks Arabic, and English if the user speaks English. Be concise, professional, and friendly.";


// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to get a dummy document to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Other errors are ignored as this is just a connection test
  }
}

testConnection();

export default app;
