// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: "taskmanager-d9d42.firebaseapp.com",
  projectId: "taskmanager-d9d42",
  storageBucket: "taskmanager-d9d42.firebasestorage.app",
  messagingSenderId: "193866029469",
  appId: "1:193866029469:web:f23b4735e8d62cbc8bb774"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);