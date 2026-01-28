import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import IMS_logo from "../assets/IMS_logo.png";
import "../styles/request.css";

/* =====================================================
   Helpers
===================================================== */
function formatReadableDateTime(raw) {
  if (!raw) return "-";

  // 👇 Force UTC → browser converts to local (WIB)
  const d = new Date(raw.endsWith("Z") ? raw : raw + "Z");

  return d.toLocaleString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(raw) {
  if (!raw) return "-";

  const d = new Date(raw.endsWith("Z") ? raw : raw + "Z");
  return d.toLocaleDateString("id-ID");
}

function formatTime(raw) {
  if (!raw) return "-";
  return raw.slice(0, 5); // this is already local time text
}


/* =====================================================
   PDF Export
===================================================== */
async function exportPDF(type, id, filename) {
  const el = document.querySelector(
    `.request-card[data-type="${type}"][data-id="${id}"]`
  );
  if (!el) return;

  const clone = el.cloneNode(true);
  clone.querySelectorAll("button").forEach((b) => b.remove());

  const wrap = document.createElement("div");
  wrap.style.position = "fixed";
  wrap.style.top = "-9999px";
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  const canvas = await html2canvas(clone, { scale: 2 });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const width = 210;
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img, "PNG", 0, 0, width, height);
  pdf.save(filename + ".pdf");

  document.body.removeChild(wrap);
}

/* =====================================================
   Main Component
===================================================== */
export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const userRole = localStorage.getItem("role");
  const userDivision = localStorage.getItem("division");

  /* -------------------------------------------------- */
  async function load() {
    try {
      if (userRole !== "div_head" && userRole !== "admin") return;

      const pribadi = await api.get("/private/by-division");
      const cuti = await api.get("/cuti/by-division");
      const dalam = await api.get("/dinasDalamKota/by-division");
      const luar = await api.get("/dinasLuarKota/by-division");

      const merged = [
        ...pribadi.data.map((x) => ({ ...x, _type: "pribadi" })),
        ...cuti.data.map((x) => ({ ...x, _type: "cuti" })),
        ...dalam.data.map((x) => ({ ...x, _type: "dalam" })),
        ...luar.data.map((x) => ({ ...x, _type: "luar" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(merged);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* -------------------------------------------------- */
  function canApprove(r) {
    if (!r) return false;

    const role = userRole?.toLowerCase();
    const div = userDivision?.toUpperCase();

    // ADMIN can approve final stage (handled in backend)
    if (role === "admin") return true;

    // ===== CUTI (MULTI STAGE) =====
    if (r._type === "cuti") {
      // Stage 1: OPS Div Head
      if (
        role === "div_head" &&
        div === r.division?.toUpperCase() &&
        r.approval_div_head == null &&
        r.approval_status === "pending"
      ) return true;

      // Stage 2: HRD
      if (
        role === "div_head" &&
        div === "HRD & GA" &&
        r.approval_div_head === "approved" &&
        r.approval_hrd == null &&
        r.approval_status === "pending"
      ) return true;

      // Stage 3: Finance
      if (
        role === "div_head" &&
        div === "FINANCE" &&
        r.approval_hrd === "approved" &&
        r.approval_finance == null &&
        r.approval_status === "pending"
      ) return true;

      // Stage 4: Admin
      if (
        role === "admin" &&
        r.approval_finance === "approved" &&
        r.approval_admin == null &&
        r.approval_status === "pending"
      ) return true;

      return false;
    }

    // ===== SINGLE STAGE FORMS =====
    // Pribadi, Dinas Dalam, Dinas Luar
    if (
      role === "div_head" &&
      div === r.division?.toUpperCase() &&
      r.approval_div_head == null &&
      r.approval_status === "pending"
    ) {
      return true;
    }

    return false;
  }


  /* -------------------------------------------------- */
  async function doAction(item, action) {
    const id = item.id;
    let endpoint = "";
  
    // ===== CUTI (MULTI STAGE) =====
    if (item._type === "cuti") {
      if (item.approval_div_head == null) {
        endpoint = `/cuti/${id}/div-head-${action}`;
      } else if (item.approval_hrd == null) {
        endpoint = `/cuti/${id}/hrd-${action}`;
      } else if (item.approval_finance == null) {
        endpoint = `/cuti/${id}/finance-${action}`;
      } else {
        endpoint = `/cuti/${id}/admin-${action}`;
      }
    }
    // ===== SINGLE STAGE =====
    else {
      const map = {
        pribadi: "private",
        dalam: "dinasDalamKota",
        luar: "dinasLuarKota",
      };
      endpoint = `/${map[item._type]}/${id}/div-head-${action}`;
    }
  
    if (!endpoint) {
      Swal.fire("Error", "Invalid approval state", "error");
      return;
    }
  
    try {
      await api.put(endpoint);
      Swal.fire("Success", "Updated", "success");
    } catch (e) {
      Swal.fire("Error", e.response?.data?.detail || "Failed", "error");
    } finally {
      load();
    }
  }

  /* -------------------------------------------------- */
  function match(item) {
    const q = search.toLowerCase();
    return (
      (filterType ? item._type === filterType : true) &&
      (filterStatus ? item.approval_status === filterStatus : true) &&
      (
        item.name?.toLowerCase().includes(q) ||
        item.purpose?.toLowerCase().includes(q) ||
        item.destination?.toLowerCase().includes(q)
      )
    );
  }

  function getFormTitle(type) {
    switch (type) {
      case "cuti":
        return "FORM CUTI";
      case "pribadi":
        return "FORM IZIN PRIBADI";
      case "dalam":
        return "FORM DINAS DALAM KOTA";
      case "luar":
        return "FORM DINAS LUAR KOTA";
      default:
        return "FORM PERMOHONAN";
    }
  }

  /* =====================================================
     UI
  ===================================================== */
  return (
    <>
      <Navbar />

      <div className="page-container">
        <h2>Approval Kepala Divisi — {userDivision}</h2>

        {/* FILTERS */}
        <div className="filter-bar">
          <input
            placeholder="Cari nama / tujuan / keperluan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="pribadi">Izin Pribadi</option>
            <option value="cuti">Cuti</option>
            <option value="dalam">Dinas Dalam Kota</option>
            <option value="luar">Dinas Luar Kota</option>
          </select>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* LIST */}
        <div className="card-list">
          {requests.filter(match).map((r) => (
            <div
              key={r._type + r.id}
              className="request-card"
              data-id={r.id}
              data-type={r._type}
            >
              {/* HEADER */}
              <div className="card-header-container">
                <img src={IMS_logo} className="card-logo" alt="logo" />
                <div className="card-header">
                  <h3>{getFormTitle(r._type)}</h3>
                </div>
                <div className="card-header-spacer" />
              </div>

              {/* BODY */}
              <div className="request-table">
                {r._type === "pribadi" && (
                  <>
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                
                    <b>Jenis</b> <span>Izin Pribadi</span>
                    <b>Judul</b> <span>{r.title}</span>
                    <b>Tipe Izin</b> <span>{r.request_type}</span>
                
                    <b>Diajukan</b>
                    <span>{formatReadableDateTime(r.created_at)}</span>
                  </>
                )}

                {r._type === "cuti" && (
                  <>
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                
                    <b>Jenis</b> <span>Cuti</span>
                    <b>Jenis Cuti</b> <span>{r.cuti_type}</span>
                
                    <b>Periode</b>
                    <span>{r.date_start} → {r.date_end}</span>
                
                    <b>Durasi</b> <span>{r.duration} hari</span>
                
                    <b>Diajukan</b>
                    <span>{formatReadableDateTime(r.created_at)}</span>
                  </>
                )}

                {r._type === "dalam" && (
                  <>
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                
                    <b>Jenis</b> <span>Dinas Dalam Kota</span>
                    <b>Keperluan</b> <span>{r.purpose}</span>
                
                    <b>Waktu</b>
                    <span>
                      {formatReadableDateTime(r.time_start)} →{" "}
                      {formatReadableDateTime(r.time_end)}
                    </span>
                
                    <b>Diajukan</b>
                    <span>{formatReadableDateTime(r.created_at)}</span>
                  </>
                )}

                {r._type === "luar" && (
                  <>
                    <b>Nama</b> <span>{r.name}</span>
                    <b>Divisi</b> <span>{r.division}</span>
                
                    <b>Jenis</b> <span>Dinas Luar Kota</span>
                    <b>Tujuan</b> <span>{r.destination}</span>
                
                    <b>Diajukan</b>
                    <span>{formatReadableDateTime(r.created_at)}</span>
                  </>
                )}
              </div>


              {/* STATUS */}
              <div className={`approval-status status-${r.approval_status}`}>
                Status: {r.approval_status}
              </div>

              {/* ACTIONS */}
              <div className="action-row">
                <button
                  className="pdf-btn"
                  onClick={() => exportPDF(r._type, r.id, `${r._type}_${r.id}`)}
                >
                  Download PDF
                </button>

                {canApprove(r) && (
                  <>
                    <button className="approve-btn" onClick={() => doAction(r, "approve")}>Approve</button> 
                    <button className="deny-btn" onClick={() => doAction(r, "deny")}> Reject </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
