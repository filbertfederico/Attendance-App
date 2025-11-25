// src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { api } from "../../api/api";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalDalam: 0,
    pendingDalam: 0,
    totalLuar: 0,
    pendingLuar: 0,
    totalPribadi: 0,
    pendingPribadi: 0,
  });

  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);

      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
    } catch (err) {
      console.log("User not logged in → redirecting");
      navigate("/");
    }
  };

  const loadStats = async () => {
    if (!user || user.role !== "admin") return;

    const dalam = (await api.get("/dinasDalamKota/")).data;
    const luar = (await api.get("/dinasLuarkota/")).data;
    const pribadi = (await api.get("/private/all")).data;

    setStats({
      totalDalam: dalam.length,
      pendingDalam: dalam.filter(d => d.approval_status === "pending").length,

      totalLuar: luar.length,
      pendingLuar: luar.filter(d => d.approval_status === "pending").length,

      totalPribadi: pribadi.length,
      pendingPribadi: pribadi.filter(p => p.approval_status === "pending").length,
    });
  };

  useEffect(() => loadUser(), []);
  useEffect(() => { if (user) loadStats(); }, [user]);

  if (!user) return <h2>Loading...</h2>;

  return (
    <div className="dash-container">
      <h1>Welcome, {user.name}</h1>

      {user.role === "admin" && (
        <>
          <h2 style={{ marginTop: "30px" }}>Admin Dashboard</h2>
          <div className="dash-grid">

            <div className="dash-card">
              <h3>Dinas Dalam Kota</h3>
              <p>Total: {stats.totalDalam}</p>
              <p>Pending: {stats.pendingDalam}</p>
              <a href="/admin/dinas-dalam" className="dash-btn">Review</a>
            </div>

            <div className="dash-card">
              <h3>Dinas Luar Kota</h3>
              <p>Total: {stats.totalLuar}</p>
              <p>Pending: {stats.pendingLuar}</p>
              <a href="/admin/dinas-luar" className="dash-btn">Review</a>
            </div>

            <div className="dash-card">
              <h3>Izin Pribadi</h3>
              <p>Total: {stats.totalPribadi}</p>
              <p>Pending: {stats.pendingPribadi}</p>
              <a href="/admin/private" className="dash-btn">Review</a>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
