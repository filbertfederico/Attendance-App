// FrontEnd/src/api/api.js
import axios from "axios";
import { linkWithCredential } from "firebase/auth";
import { getAuth } from "firebase/auth";

export const api = axios.create({
  // DEPLOY
  baseURL: process.env.REACT_APP_API_URL || "https://attendance-app-vwy8.onrender.com",
  withCredentials: true
});

// Firebase token
api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;

  if (user) {
    const token = await user.getIdToken(); // ✅ cached, auto-refresh
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export async function getData(path) {
  const res = await api.get(path);
  return res.data
} 