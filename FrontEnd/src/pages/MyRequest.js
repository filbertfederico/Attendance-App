// src/pages/RequestList.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import "../styles/request.css";

// ---------- Helper Functions ----------
function getDayLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return `${getDayLabel(dateStr)} (${dateStr})`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export default function RequestList() {
  // REAL user (from login)
  const user = {
    name: localStorage.getItem("name"),
    role: localStorage.getItem("role"),
  };

  const [dinasList, setDinasList] = useState([]);
  const [pribadiList, setPribadiList] = useState([]);

  async function loadData() {
    try {
      const dinas = await api.get("/dinas/my");
      const pribadi = await api.get("/private/my");

      console.log("Dinas Response:", dinas.data);
      console.log("Pribadi Response:", pribadi.data);

      setDinasList(Array.isArray(dinas.data) ? dinas.data : []);
      setPribadiList(Array.isArray(pribadi.data) ? pribadi.data : []);
    } catch (err) {
      console.error("Error loading request data:", err);
      setDinasList([]);
      setPribadiList([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>All My Requests</h2>

        <div className="card-list">

          {/* ---------- DINAS REQUESTS ---------- */}
          {dinasList.map((d) => (
            <div className="card" key={`d-${d.id}`}>
              <h3>Dinas Request</h3>

              <p><b>Name:</b> {d.name}</p>
              <p><b>Division:</b> {d.division}</p>
              <p><b>Purpose:</b> {d.purpose}</p>
              <p><b>Time:</b> {d.time_start} → {d.time_end}</p>
              <p><b>Status:</b> {d.status}</p>
              <p><b>Approval Status:</b> {d.approval_status}</p>
              <p><b>Submitted At:</b> {d.created_at}</p>
            </div>
          ))}

          {/* ---------- PRIVATE REQUESTS ---------- */}
          {pribadiList.map((p) => (
            <div className="card" key={`p-${p.id}`}>
              <h3>Private Request</h3>

              <p><b>Name:</b> {p.name}</p>
              <p><b>Type:</b> {p.request_type}</p>
              <p><b>Status:</b> {p.approval_status}</p>

              <p><b>Details:</b>{" "}

                {p.request_type === "time_off" && (
                  <>Day Off: {formatDate(p.date)}</>
                )}

                {p.request_type === "leave_early" && (
                  <>Leave Early: {formatTime(p.short_hour)}</>
                )}

                {p.request_type === "come_late" && (
                  <>Come Late: {formatDate(p.come_late_date)} at {formatTime(p.come_late_hour)}</>
                )}

                {p.request_type === "temp_leave" && (
                  <>Temporary Leave: {formatDate(p.temp_leave_date)}</>
                )}

              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
