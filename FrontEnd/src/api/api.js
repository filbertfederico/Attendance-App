// FrontEnd/src/api/api.js
import axios from "axios";

export const api = axios.create({
  // DEPLOY
  // baseURL: process.env.REACT_APP_API_URL || "https://attendance-app-vwy8.onrender.com"
  // LOCAL
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:10000/"
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