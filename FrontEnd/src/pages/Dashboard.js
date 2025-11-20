// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import "../styles/dashboard.css";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------
  // LOAD REAL USER FROM BACKEND
  // -----------------------------------------
  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");

      setUser(res.data);

      // Cache user info
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);

    } catch (err) {
      console.log("User not logged in → redirecting to login");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // -----------------------------------------
  // PREVENT RENDER UNTIL USER LOADED
  // -----------------------------------------
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return null; // failsafe

  // -----------------------------------------
  // STAFF DASHBOARD UI
  // -----------------------------------------
  return (
    <>
      <Navbar />
      <div className="dash-container">
        <h1>Welcome, {user.name}</h1>
        <h3>Role: {user.role.toUpperCase()}</h3>

        {/* STAFF ONLY DASHBOARD */}
        {user.role === "staff" && (
          <div className="dash-grid">
            <div className="dash-card">
              <h3>Submit Request Dinas</h3>
              <p>Izin kerja & tugas dinas</p>
              <a className="dash-btn" href="/dinas-request">Go</a>
            </div>

            <div className="dash-card">
              <h3>Submit Request Pribadi</h3>
              <p>Cuti, izin, telat, pulang awal</p>
              <a className="dash-btn" href="/pribadi-request">Go</a>
            </div>

            <div className="dash-card">
              <h3>All My Requests</h3>
              <p>Lihat semua request Dinas & Pribadi</p>
              <a className="dash-btn" href="/my-requests">Go</a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
