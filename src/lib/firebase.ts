import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCzS0kGNOaEcKKAWN5Bhk37W8c8i7aZghs",
  authDomain: "holy-counseling-aid.firebaseapp.com",
  projectId: "holy-counseling-aid",
  storageBucket: "holy-counseling-aid.firebasestorage.app",
  messagingSenderId: "177143536754",
  appId: "1:177143536754:web:3b615c13ea9bf13e81f6eb"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
