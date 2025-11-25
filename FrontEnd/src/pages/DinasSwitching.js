// FrontEnd/src/pages/DinasSwitching.js
import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import "../styles/switch.css";

export default function DinasSwitching() {
  const navigate = useNavigate();
  const [ setUser] = useState(null);
  const [ setLoading] = useState(true); 
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
      navigate("/");
    } finally {
      setLoading(false);
    }};
  
    useEffect(() => {
      loadUser();
    } );
  return (
    <>
      <Navbar />
      <div className="switch-container">
        <h2>Pilih Dinas</h2>
        <div className="switch-grid"></div>
        <a className="switch-btn" href="/dinas-dalam-kota-request">Dinas dalam kota</a>
        <a className="switch-btn" href="/dinas-luar-kota-request">Dinas luar kota</a>
      </div>
    </>
  );

}