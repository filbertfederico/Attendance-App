import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, children }) {
  // YOUR actual Firebase token name
  const token = localStorage.getItem("firebaseToken");

  const userRole = localStorage.getItem("role");       // "staff" or "admin"
  const division = localStorage.getItem("division");   // "DIV_HEAD_OPS", "OPS"

  const isDivHead = division?.startsWith("DIV_HEAD_");

  // Not logged in -> send to login
  if (!token) return <Navigate to="/" />;

  // staff-only routes:
  if (role === "staff" && userRole !== "staff") {
    return <Navigate to="/" />;
  }

  // admin-only routes:
  if (role === "admin" && userRole !== "admin") {
    return <Navigate to="/" />;
  }

  // division head-only routes:
  if (role === "div_head" && !isDivHead) {
    return <Navigate to="/" />;
  }

  return children;
}
