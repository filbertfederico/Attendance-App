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

  // -------------------------------------------------------
  // LOAD REQUESTS FOR THIS DIVISION
  // -------------------------------------------------------
  async function load() {
    try {
      if (userRole !== "div_head") {
        setRequests([]);
        return;
      }

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

  // -------------------------------------------------------
  // PERMISSION CHECK
  // -------------------------------------------------------
  function canApprove(item) {
    return userRole === "div_head" && item.division === userDivision;
  }

  // -------------------------------------------------------
  // ACTION HANDLER
  // -------------------------------------------------------
  async function doAction(item, action) {
    if (!canApprove(item)) {
      Swal.fire("Tidak diizinkan", "Anda tidak bisa menyetujui item ini", "error");
      return;
    }

    try {
      let url = "";

      if (item._type === "pribadi") {
        url = `/private/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      if (item._type === "cuti") {
        url = `/cuti/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      if (item._type === "dalam") {
        url = `/dinasDalamKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      if (item._type === "luar") {
        url = `/dinasLuarKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

      await api.put(url);

      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Approved" : "Rejected",
        showConfirmButton: false,
        timer: 1500,
      });

      load();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.detail || "Failed", "error");
    }
  }

  function translateFormType(type) {
    switch (type) {
      case "pribadi": return "Izin Pribadi";
      case "cuti": return "Cuti";
      case "dalam": return "Dinas Dalam Kota";
      case "luar": return "Dinas Luar Kota";
      default: return type;
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
            <div key={r._type + "-" + r.id}>              
              {r._type === "cuti" && (
                <div className="request-card">

                  {/* HEADER */}
                  <div className="card-header">
                    <h3>PERMOHONAN CUTI</h3>
                    <div className="header-sub">Form Digital</div>
                  </div>

                  {/* MAIN TABLE */}
                  <div className="request-table">
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                    <b>Jenis Cuti</b> <span>{r.cuti_type}</span>

                    <b>Tanggal</b>
                    <span>
                      {r.date_start} — {r.date_end}
                    </span>

                    <b>Durasi</b> <span>{r.duration} hari</span>

                    <b>Untuk Keperluan</b> <span>{r.purpose || "—"}</span>
                    <b>Alamat Selama Cuti</b> <span>{r.address || "—"}</span>
                    <b>No. Telp</b> <span>{r.phone || "—"}</span>
                    <b>Catatan</b> <span>{r.notes || "—"}</span>

                    <b>Cuti Tersisa</b> <span>{r.leave_days ?? "-"}</span>
                    <b>Cuti Setelah</b>
                    <span>
                      {r.leave_days != null ? r.leave_days - r.duration : "-"}
                    </span>
                  </div>

                  {/* STATUS */}
                  <div className="approval-status">
                    <div><b>Status Kepala Divisi:</b> {r.approval_div_head || "—"}</div>
                    <div><b>Status HRD:</b> {r.approval_hrd || "—"}</div>
                    <div><b>Status Akhir:</b> {r.approval_status}</div>
                  </div>

                  {/* ACTION BUTTONS */}
                  {canApprove(r) && (
                    <div style={{ marginTop: "20px" }}>
                      <button className="approve-btn" onClick={() => doAction(r, "approve")}>Approve</button>
                      <button className="deny-btn" style={{ marginLeft: 8 }} onClick={() => doAction(r, "deny")}>Reject</button>
                    </div>
                  )}

                </div>
              )}

              {/* ========= OTHER FORM TYPES REMAIN AS THEY ARE ========= */}
              {r._type !== "cuti" && (
                <div className="request-card">
                  <div className="card-header">
                    <h3>{translateFormType(r._type)}</h3>
                  </div>

                  <div className="request-table">
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                  </div>

                  {canApprove(r) && (
                    <div style={{ marginTop: 20 }}>
                      <button className="approve-btn" onClick={() => doAction(r, "approve")}>Approve</button>
                      <button className="deny-btn" style={{ marginLeft: 8 }} onClick={() => doAction(r, "deny")}>Reject</button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </>
  );
}
