// FrontEnd/src/pages/admin/AdminRequest.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { api } from "../../api/api";
import "../../styles/request.css";

export default function AdminRequestList() {
  const [combined, setCombined] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin"){
      navigate("/home");
    }
  }, []);

  async function load() {
    const dinas = await api.get("/dinas");
    const pribadi = await api.get("/private");

    const list = [
      ...dinas.data.map((d) => ({
        rawId: d.id,
        id: `D-${d.id}`,
        type: "dinas",
        name: d.name,
        detail1: `Division: ${d.division}`,
        detail2: `Purpose: ${d.purpose}`,
        detail3: `Time: ${d.time_start} → ${d.time_end}`,
        status: d.approval_status,
        created_at: d.created_at
      })),
      ...pribadi.data.map((p) => ({
        rawId: p.id,
        id: `P-${p.id}`,
        type: "private",
        name: p.name,
        detail1: `Title: ${p.title}`,
        detail2: `Type: ${p.request_type}`,
        detail3:
          p.request_type === "time_off"
            ? `Day Off: ${p.date}`
            : p.request_type === "leave_early"
            ? `Leave Early Hour: ${p.short_hour}`
            : p.request_type === "come_late"
            ? `Come Late: ${p.come_late_date} — ${p.come_late_hour}`
            : `Temporary Leave: ${p.temp_leave_date}`,
        status: p.approval_status,
        created_at: p.created_at
      })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setCombined(list);
  }

  // Approve request
  async function approve(item) {
    if (item.type === "dinas") {
      await api.put(`/dinas/${item.rawId}/approve`);
    } else {
      await api.put(`/private/${item.rawId}/approve`);
    }
    load(); // refresh list
  }

  // Deny request
  async function deny(item) {
    if (item.type === "dinas") {
      await api.put(`/dinas/${item.rawId}/deny`);
    } else {
      await api.put(`/private/${item.rawId}/deny`);
    }
    load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>All Requests (Admin Review)</h2>

        <div className="card-list">
          {combined.map((req) => (
            <div className="card" key={req.id}>
              <h3>{req.type === "dinas" ? "Dinas Request" : "Private Request"}</h3>

              <p><b>Name:</b> {req.name}</p>
              <p>{req.detail1}</p>
              <p>{req.detail2}</p>
              <p>{req.detail3}</p>

              <p><b>Status:</b> {req.status}</p>

              {/* APPROVE / DENY BUTTONS */}
              {req.status === "pending" && (
                <div className="admin-buttons">
                  <button className="approve-btn" onClick={() => approve(req)}>
                    Approve
                  </button>
                  <button className="deny-btn" onClick={() => deny(req)}>
                    Deny
                  </button>
                </div>
              )}

              {req.status !== "pending" && (
                <p><i>Already {req.status}</i></p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
