import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5zDLFRw-9RZBrC_4KCqHkuTrG1iKouKU",
  authDomain: "job-tracker-169f2.firebaseapp.com",
  projectId: "job-tracker-169f2",
  storageBucket: "job-tracker-169f2.firebasestorage.app",
  messagingSenderId: "371415396058",
  appId: "1:371415396058:web:7e25ce794fed3bf1c77fe3",
  measurementId: "G-HQ8ML32VE3"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();