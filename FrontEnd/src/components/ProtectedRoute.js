// FrontEnd/src/components/ProtectedRoute.js

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/api";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ allowedRoles, children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        const me = res.data;

        // Store user info
        localStorage.setItem("role", me.role);
        localStorage.setItem("division", me.division);
        localStorage.setItem("name", me.name);

        // Role-based access
        const role = me.role;
        const division = me.division;
        
        // temp all access for HRD & GA staff
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
    });

    return () => unsubscribe();
  }, [allowedRoles]);

  if (loading) return <div>Loading...</div>;

  return allowed ? children : <Navigate to="/home" replace />;
}
