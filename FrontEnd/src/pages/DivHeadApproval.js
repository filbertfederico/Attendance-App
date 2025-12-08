// FrontEnd/src/pages/DivHeadApproval.js

import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import "../styles/request.css";

export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = localStorage.getItem("role");
  const userDivision = localStorage.getItem("division");

  // -------------------------------------------------------------------
  // LOAD REQUESTS FOR THIS DIVISION HEAD
  // -------------------------------------------------------------------
  async function load() {
    try {
      if (userRole !== "div_head") {
        setRequests([]);
        return;
      }

      // backend filters by division automatically
      const pribadiRes = await api.get("/private/by-division");
      const cutiRes = await api.get("/cuti/by-division");
      const dalamRes = await api.get("/dinasDalamKota/by-division");
      const luarRes = await api.get("/dinasLuarKota/by-division");

      const combined = [
        ...pribadiRes.data.map((r) => ({ ...r, _type: "pribadi" })),
        ...cutiRes.data.map((r) => ({ ...r, _type: "cuti" })),
        ...dalamRes.data.map((r) => ({ ...r, _type: "dalam" })),
        ...luarRes.data.map((r) => ({ ...r, _type: "luar" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(combined);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -------------------------------------------------------------------
  // PERMISSION CHECK
  // -------------------------------------------------------------------
  function canApprove(item) {
    return userRole === "div_head" && item.division === userDivision;
  }

  // -------------------------------------------------------------------
  // APPROVE / DENY
  // -------------------------------------------------------------------
  async function doAction(item, action) {
    if (!canApprove(item)) {
      Swal.fire("Tidak diizinkan", "Anda tidak bisa menyetujui item ini", "error");
      return;
    }

    try {
      let url = "";

      // PRIBADI
      if (item._type === "pribadi") {
        url = `/private/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      // CUTI
      if (item._type === "cuti") {
        url = `/cuti/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      // DINAS DALAM KOTA
      if (item._type === "dalam") {
        url = `/dinasDalamKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      // DINAS LUAR KOTA
      if (item._type === "luar") {
        url = `/dinasLuarKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      await api.put(url);

      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Approved" : "Rejected",
        timer: 1500,
        showConfirmButton: false,
      });

      load();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.detail || "Failed", "error");
    }
  }

  if (loading) return <h2>Loading...</h2>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Approval Kepala Divisi — {userDivision}</h2>

        {requests.length === 0 && <p>Tidak ada request menunggu.</p>}

        <div className="card-list">
          {requests.map((r) => (
            <div className="card" key={`${r._type}-${r.id}`}>
              <h3>
                {r._type === "pribadi"
                  ? "Izin Pribadi"
                  : r._type === "cuti"
                  ? "Cuti"
                  : r._type === "dalam"
                  ? "Dinas Dalam Kota"
                  : "Dinas Luar Kota"}
              </h3>

              <p><b>Nama:</b> {r.name}</p>
              <p><b>Divisi:</b> {r.division}</p>

              {/* DETAILS FOR EACH TYPE */}
              {r._type === "pribadi" && (
                <>
                  <p><b>Judul:</b> {r.title}</p>
                  <p><b>Tipe:</b> {r.request_type}</p>
                </>
              )}

              {r._type === "cuti" && (
                <>
                  <p><b>Tipe Cuti:</b> {r.cuti_type}</p>
                  <p><b>Dari:</b> {r.date_start}</p>
                  <p><b>Sampai:</b> {r.date_end}</p>
                </>
              )}

              {r._type === "dalam" && (
                <>
                  <p><b>Tujuan:</b> {r.purpose}</p>
                </>
              )}

              {r._type === "luar" && (
                <>
                  <p><b>Tujuan:</b> {r.destination}</p>
                  <p><b>Keperluan:</b> {r.purpose}</p>
                </>
              )}

              <p><b>Status:</b> {r.approval_status}</p>

              {canApprove(r) && (
                <div style={{ marginTop: "10px" }}>
                  <button onClick={() => doAction(r, "approve")} className="approve-btn">Approve</button>
                  <button onClick={() => doAction(r, "deny")} className="deny-btn" style={{ marginLeft: 8 }}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
