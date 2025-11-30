// FrontEnd/src/api/api.js
import axios from "axios";
import { linkWithCredential } from "firebase/auth";

export const api = axios.create({
  // DEPLOY
  baseURL: process.env.REACT_APP_API_URL,
  WithCredential:true
});

// Firebase token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export async function getData(path) {
  const res = await api.get(path);
  return res.data
} 