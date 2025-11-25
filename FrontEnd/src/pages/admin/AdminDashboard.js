// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import { getData } from "../api/api";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDinas: 0,
    pendingDinas: 0,
    totalPribadi: 0,
    pendingPribadi: 0,
  });

  // ------------------------------------------
  // Load logged-in user from backend
  // ------------------------------------------
  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);

      // Save to localStorage for quick access
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
    } catch (err) {
      console.log("User not logged in → redirecting to login");
      navigate("/");
    }
  };

  // ------------------------------------------
  // Load admin stats
  // ------------------------------------------
  const loadStats = async () => {
    if (!user || user.role !== "admin") return;

    const dinas = await getData("/dinas");
    const pribadi = await getData("/private");

    setStats({
      totalDinas: dinas.length,
      pendingDinas: dinas.filter(d => d.approval_status === "pending").length,
      totalPribadi: pribadi.length,
      pendingPribadi: pribadi.filter(p => p.approval_status === "pending").length,
    });
  };

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  // ------------------------------------------------
  // If user isn't loaded yet, show loading
  // ------------------------------------------------
  if (!user) return <h2>Loading...</h2>;

  // ------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------
  return (
    <div className="dash-container">
      <h1>Welcome, {user.name}</h1>

      {/* STAFF DASHBOARD */}
      {user.role === "staff" && (
        <div className="dash-grid">
          <div className="dash-card">
            <h3>Submit Request Dinas</h3>
            <p>Izin kerja & panggilan dinas</p>
            <a className="dash-btn" href="/dinas-request">Go</a>
          </div>

          <div className="dash-card">
            <h3>Submit Request Pribadi</h3>
            <p>Cuti, telat, pulang awal, dll</p>
            <a className="dash-btn" href="/pribadi-request">Go</a>
          </div>

          <div className="dash-card">
            <h3>My Requests</h3>
            <p>Semua request Dinas dan Pribadi</p>
            <a href="/my-requests" className="dash-btn">Go</a>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {user.role === "admin" && (
        <>
          <h2 style={{ marginTop: "30px" }}>Admin Dashboard</h2>

          <div className="dash-grid">

            <div className="dash-card">
              <h3>Dinas Requests</h3>
              <p>Total: {stats.totalDinas}</p>
              <p>Pending: {stats.pendingDinas}</p>
              <a href="/admin/dinas" className="dash-btn">Review Dinas</a>
            </div>

            <div className="dash-card">
              <h3>Private Requests</h3>
              <p>Total: {stats.totalPribadi}</p>
              <p>Pending: {stats.pendingPribadi}</p>
              <a href="/admin/private" className="dash-btn">Review Private</a>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
