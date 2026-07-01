import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const firebaseConfig2 = {
    apiKey: "AIzaSyAGUO-j3VlYhQM3UDs0FIb1UoVpn3pGxbA",
    authDomain: "telegrambot-991ab.firebaseapp.com",
    projectId: "telegrambot-991ab",
    storageBucket: "telegrambot-991ab.firebasestorage.app",
    messagingSenderId: "1049608530319",
    appId: "1:1049608530319:web:4bcf6288fd6813d25103fa",
    measurementId: "G-CP4VCG1FN0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances to use across components
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
