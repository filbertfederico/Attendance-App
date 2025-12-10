// FrontEnd/src/components/ProtectedRoute.js

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/api";

export default function ProtectedRoute({ allowedRoles, children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const me = res.data;

        // Update localStorage
        localStorage.setItem("role", me.role);
        localStorage.setItem("division", me.division);
        localStorage.setItem("name", me.name);

        const role = me.role;
        const division = me.division;

        if (role === "staff" && division.toUpperCase() === "HRD & GA") {
          setAllowed(true);
          return;
        }

        if (!allowedRoles || allowedRoles.includes(me.role)) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      } catch (e) {
        console.error("ProtectedRoute error:", e);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [allowedRoles]);

  if (loading) return <div>Loading...</div>;

  return allowed ? children : <Navigate to="/home" replace />;
}
