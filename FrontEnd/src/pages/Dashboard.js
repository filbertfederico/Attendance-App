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
  const token = localStorage.getItem("token");
    
    if (!token) {
      console.log("No token → redirecting to login");
      navigate("/");
      return;
    }
  
    try {
      const res = await api.get("/auth/me");
    
      setUser(res.data);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
    
    } catch (err) {
      console.log("User not logged in → redirecting to login");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) loadUser();
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
        <h1>Selamat Datang, {user.name}</h1>  
        {/* STAFF ONLY DASHBOARD */}
        {user.role === "staff" && (
          <div className="dash-grid">
            <div className="dash-card">
              <h3>Form Dinas</h3>
              <p>Surat perjalan dinas luar & dalam kota</p>
              <a className="dash-btn" href="/switching">Go</a>
            </div>  
            <div className="dash-card">
              <h3>Form Izin</h3>
              <p>Cuti, kepergian sementara, telat, pulang awal</p>
              <a className="dash-btn" href="/pribadi-request">Go</a>
            </div>  
            <div className="dash-card">
              <h3>Permohonan Cuti</h3>
              <p>Cuti</p>
              <a className="dash-btn" href="/cuti-request">Go</a>
            </div> 
            <div className="dash-card">
              <h3>Semua Izin</h3>
              <p>Lihat semua form dinas & keperluan lainnya</p>
              <a className="dash-btn" href="/my-requests">Go</a>
            </div>
          </div>
        )}
        {/* DIV HEAD DASHBOARD */}
        {user.role === "div_head" && (
          <div className="dash-grid">
            <div className="dash-card">
              <h3>Approval Form Staff</h3>
              <p>Approve Izin, Cuti, Dinas Dalam, Dinas Luar</p>
              <a className="dash-btn" href="/div-head-approval">Go</a>
            </div>
                        <div className="dash-card">
              <h3>Form Dinas</h3>
              <p>Surat perjalan dinas luar & dalam kota</p>
              <a className="dash-btn" href="/switching">Go</a>
            </div>  
            <div className="dash-card">
              <h3>Form Izin</h3>
              <p>Cuti, kepergian sementara, telat, pulang awal</p>
              <a className="dash-btn" href="/pribadi-request">Go</a>
            </div>  
            <div className="dash-card">
              <h3>Permohonan Cuti</h3>
              <p>Cuti</p>
              <a className="dash-btn" href="/cuti-request">Go</a>
            </div> 
            <div className="dash-card">
              <h3>Semua Izin</h3>
              <p>Lihat semua form dinas & keperluan lainnya</p>
              <a className="dash-btn" href="/my-requests">Go</a>
            </div>
          </div>
        )}

      </div>
    </>
  );
};