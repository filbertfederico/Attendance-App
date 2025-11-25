// FrontEnd/src/api/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://attendance-app-vwy8.onrender.com"
  // baseURL: process.env.REACT_APP_API_URL || "http://localhost:10000"
});

// Firebase token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
