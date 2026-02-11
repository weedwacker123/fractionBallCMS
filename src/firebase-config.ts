// Firebase configuration for Fraction Ball CMS
// Uses environment variables with fallbacks for local development
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAelVAxdAl9C_UxRqc2lWZNABDRNt1kPNo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fractionball-lms.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fractionball-lms",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fractionball-lms.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "110595744029",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:110595744029:web:c66d6c0cdc0df3cf33c1f4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LXELEY5CP8"
};
