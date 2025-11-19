import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBGLgOaZmtH9iiTcX_iGnifdReXjQVCEJs",
  authDomain: "attendance-app-befe2.firebaseapp.com",
  projectId: "attendance-app-befe2",
  storageBucket: "attendance-app-befe2.firebasestorage.app",
  messagingSenderId: "622856075508",
  appId: "1:622856075508:web:05c1f04df7e070265646a1",
  measurementId: "G-HBC9FGNPSQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Auth instance
export const auth = getAuth(app);

// Functions you actually use
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);
