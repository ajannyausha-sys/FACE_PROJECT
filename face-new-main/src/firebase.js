import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuUmT67vbiZSmJdy8naMRSPAzwrPQUAx8",
  authDomain: "face-app-new-e4f3a.firebaseapp.com",
  projectId: "face-app-new-e4f3a",
  storageBucket: "face-app-new-e4f3a.firebasestorage.app",
  messagingSenderId: "630424175011",
  appId: "1:630424175011:web:a3aab5137344891e6d5a16",
  measurementId: "G-47VTE7EFTH"
};

// console.log debug temporarily disabled to fix ReferenceError
// console.log('🔍 Firebase Debug:', { 
//   apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.slice(0,10)+'...' : 'MISSING',
//   authDomain: firebaseConfig.authDomain || 'MISSING',
//   projectId: firebaseConfig.projectId || 'MISSING',
//   isConfigured: isFirebaseConfigured 
// });

const requiredValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId
];

export const isFirebaseConfigured = requiredValues.every(Boolean);

console.log('🔍 Firebase Config Ready:', isFirebaseConfigured);

let app;
let auth;
let db;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
