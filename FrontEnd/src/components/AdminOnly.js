import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminOnly({ children }) {
  const role = localStorage.getItem("role");

  if (role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
