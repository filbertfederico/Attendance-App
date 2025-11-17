// src/pages/RequestList.js
import React, { useEffect, useState } from "react";
import { getData } from "../../api/api";
import "../../styles/request.css";

export default function AdminRequestList() {
  // TODO: Replace with real login
  const [user] = useState({ name: "ADMIN", role: "admin" });

  const [combined, setCombined] = useState([]);

  async function loadRequests() {
    // GET staff’s dinas
    const dinas = await getData(`/dinas/${user.name}`, "staff");

    // GET staff’s private
    const pribadi = await getData(`/private/${user.name}`, "staff");

    // Format objects for unified display
    const formattedDinas = dinas.map((d) => ({
      id: `D-${d.id}`,
      type: "Dinas",
      name: d.name,
      detail1: `Division: ${d.division}`,
      detail2: `Purpose: ${d.purpose}`,
      detail3: `Time: ${d.time_start} → ${d.time_end}`,
      status: d.approval_status,
      created_at: d.created_at || "N/A",
    }));

    const formattedPribadi = pribadi.map((p) => ({
      id: `P-${p.id}`,
      type: "Private",
      name: p.name,
      detail1: `Title: ${p.title}`,
      detail2: `Type: ${p.request_type}`,
      detail3:
        p.request_type === "time_off"
          ? `Day Off: ${p.date}`
          : p.request_type === "leave_early"
          ? `Leave Early: ${p.short_hour}`
          : p.request_type === "come_late"
          ? `Come Late: ${p.come_late_date} at ${p.come_late_hour}`
          : "Temporary Leave",
      status: p.approval_status,
      created_at: p.created_at || "N/A",
    }));

    // Combine + sort by date descending
    const merged = [...formattedDinas, ...formattedPribadi].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setCombined(merged);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="page-container">
      <h2>All Requests</h2>

      <div className="card-list">
        {combined.map((req) => (
          <div className="card" key={req.id}>
            <h3>{req.type} Request</h3>

            <p><b>Name:</b> {req.name}</p>

            <p>{req.detail1}</p>
            <p>{req.detail2}</p>
            <p>{req.detail3}</p>

            <p><b>Status:</b> {req.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
