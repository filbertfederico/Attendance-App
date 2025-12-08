// FrontEnd/src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  // YOUR actual Firebase token name
  const token = localStorage.getItem("firebaseToken");

  const userRole = localStorage.getItem("role");       // "staff" or "admin"

  // Not logged in
  if (!token) return <Navigate to="/" />;
  
  // staff-only
  if (role === "staff" && userRole !== "staff") return <Navigate to="/" />;
  
  // admin-only
  if (role === "admin" && userRole !== "admin") return <Navigate to="/" />;
  
  // division head-only
  if (role === "div_head" && userRole !== "div_head") return <Navigate to="/" />;

  return children;
}
