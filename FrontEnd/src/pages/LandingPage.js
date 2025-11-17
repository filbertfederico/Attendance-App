// src/pages/LandingPage.js
import React, { useEffect, useState } from "react";
import { getData } from "../api/api";
import "../styles/dashboard.css";

export default function LandingPage() {
  // TODO: replace with real login later
  
  //user temp
  // const [user] = useState({ name: "John Doe", role: "staff" });
  
  //admin temp
  const [user] = useState({ name: "Admin", role: "admin" });


  const [stats, setStats] = useState({
    totalDinas: 0,
    pendingDinas: 0,
    totalPribadi: 0,
    pendingPribadi: 0,
  });

  async function loadStats() {
    if (user.role !== "admin") return;

    const dinas = await getData("/dinas", "admin");
    const pribadi = await getData("/private", "admin");

    setStats({
      totalDinas: dinas.length,
      pendingDinas: dinas.filter(d => d.approval_status === "pending").length,
      totalPribadi: pribadi.length,
      pendingPribadi: pribadi.filter(p => p.approval_status === "pending").length,
    });
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="dash-container">
      <h1>Welcome, {user.name}</h1>
      <h3>Role: {user.role.toUpperCase()}</h3>

      {/* STAFF DASHBOARD */}
      {user.role === "staff" && (
        <div className="dash-grid">
            <div className="dash-card">
                <h3>Submit Dinas Request</h3>
                <p>Request official leave or work-related permission.</p>
                <a className="dash-btn" href="/dinas-request">Go</a>
            </div>

            <div className="dash-card">
              <h3>Submit Private Request</h3>
              <p>Request time off, leave early, or come late.</p>
              <a className="dash-btn" href="/private-request">Go</a>
            </div>

            <div className="dash-card">
              <h3>All Requests</h3>
              <p>View every Dinas and Private request in a single page.</p>
              <a href="/all-requests" className="dash-btn">View All</a>
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
