// FrontEnd/src/pages/admin/AdminRequest.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { api } from "../../api/api";
import "../../styles/request.css";

export default function AdminRequest() {
  const [combined, setCombined] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") {
      navigate("/home");
    }
  }, []);

  async function load() {
    const dalam = await api.get("/dinasDalamKota/");
    const luar = await api.get("/dinasLuarKota/");
    const pribadi = await api.get("/private/all");
    const cuti = (await api.get("/cuti/all")).data;

    const list = [

      // ====== DINAS DALAM KOTA =======
      ...dalam.data.map((d) => ({
        formType: "Dinas Dalam Kota",
        rawId: d.id,
        id: `DDK-${d.id}`,
        category: "dalam",
        name: d.name,
        detail1: `Division: ${d.division}`,
        detail2: `Purpose: ${d.purpose}`,
        detail3: `Time: ${d.time_start} → ${d.time_end}`,
        status: d.approval_status,
        created_at: d.created_at,
      })),

      // ====== DINAS LUAR KOTA =======
      ...luar.data.map((d) => ({
        formType: "Dinas Luar Kota",
        rawId: d.id,
        id: `DLK-${d.id}`,
        category: "luar",
        name: d.name,
        detail1: `Department: ${d.division}`,
        detail2: `Destination: ${d.destination}`,
        detail3: `Depart: ${d.depart_date} → Return: ${d.return_date}`,
        status: d.approval_status,
        created_at: d.created_at,
      })),

      // ====== IZIN PRIBADI =======
      ...pribadi.data.map((p) => ({
        formType: "Izin Pribadi",
        rawId: p.id,
        id: `P-${p.id}`,
        category: "private",
        name: p.name,
        detail1: `Reason: ${p.title}`,
        detail2: `Type: ${p.request_type}`,
        detail3:
          p.request_type === "time_off"
            ? `Day Off: ${p.date}`
            : p.request_type === "leave_early"
            ? `Leave Early Hour: ${p.short_hour}`
            : p.request_type === "come_late"
            ? `Come Late: ${p.come_late_date} — ${p.come_late_hour}`
            : `Temporary Leave: ${p.temp_leave_start}`,
        status: p.approval_status,
        created_at: p.created_at,
      })),

      // ====== CUTI =======
      ...cuti.map((c) => ({
        formType: "Cuti",
        rawId: c.id,
        id: `C-${c.id}`,
        category: "cuti",
        name: c.name,
        detail1: `Tipe: ${c.cuti_type}`,
        detail2: `Tanggal: ${c.date_start} - ${c.date_end}`,
        detail3: `Selama: ${c.duration} hari`,
        detail4: `Keperluan: ${c.purpose}`,
        detail5: `Alamat: ${c.address}`,
        detail6: `No. HP: ${c.phone}`,
        detail7: `Catataan: ${c.notes}`,
        detail8: `Total Cuti: ${c.leave_days}`,
        detail9: `Sisa Cuti: ${c.leave_remaining}`,
        status: c.approval_status,
        created_at: c.created_at,
      })),

    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setCombined(list);
  }

  // APPROVE
  async function approve(item) {
    if (item.category === "dalam") {
      await api.put(`/dinasDalamKota/${item.rawId}/approve`);
    } else if (item.category === "luar") {
      await api.put(`/dinasLuarKota/${item.rawId}/approve`);
    } else {
      await api.put(`/private/${item.rawId}/approve`);
    }
    load();
  }

  // DENY
  async function deny(item) {
    if (item.category === "dalam") {
      await api.put(`/dinasDalamKota/${item.rawId}/deny`);
    } else if (item.category === "luar") {
      await api.put(`/dinasLuarKota/${item.rawId}/deny`);
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
              <h3>{req.formType}</h3>

              <p><b>Name:</b> {req.name}</p>
              <p>{req.detail1}</p>
              <p>{req.detail2}</p>
              <p>{req.detail3}</p>

              <p><b>Status:</b> {req.status}</p>

              {/* Approve / Deny Buttons */}
              {req.status === "pending" ? (
                <div className="admin-buttons">
                  <button className="approve-btn" onClick={() => approve(req)}>
                    Approve
                  </button>
                  <button className="deny-btn" onClick={() => deny(req)}>
                    Deny
                  </button>
                </div>
              ) : (
                <p><i>Already {req.status}</i></p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
