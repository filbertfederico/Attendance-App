// FrontEnd/src/pages/DivHeadApproval.js

import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import Swal from "sweetalert2";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import IMS_logo from "../assets/IMS_logo.png";
import "../styles/request.css";

// -------------------------
// Shared Helper Functions
// -------------------------
function formatReadableDateTime(raw) {
  if (!raw) return "";
  const date = new Date(raw);
  const day = date.toLocaleDateString("id-ID", { weekday: "long" });
  return (
    `${day}, ${date.getDate()} ` +
    date.toLocaleDateString("id-ID", { month: "long" }) +
    ` ${date.getFullYear()} — `
  );
}

function formatDate(raw) {
  if (!raw) return "-";
  const d = new Date(raw);
  const weekday = d.toLocaleDateString("id-ID", { weekday: "long" });
  return `${weekday} (${raw})`;
}

function formatTime(t) {
  if (!t) return "-";
  return t.slice(0, 5);
}

// -------------------------
// PDF Export (same as MyRequest)
// -------------------------
async function exportPDF(type, id, filename) {
  const selector = `.request-card[data-type="${type}"][data-id="${id}"]`;
  const el = document.querySelector(selector);
  if (!el) return;

  const clone = el.cloneNode(true);
  clone.querySelectorAll(".pdf-btn",".approve-btn",".deny-btn").forEach((b) => b.remove());

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.appendChild(clone);
  document.body.appendChild(container);

  const canvas = await html2canvas(clone, { scale: 2 });
  const img = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const width = 210;
  const height = (canvas.height * width) / canvas.width;
  pdf.addImage(img, "PNG", 0, 0, width, height);
  pdf.save(filename + ".pdf");

  document.body.removeChild(container);
}

// -------------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------------
export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const userRole = localStorage.getItem("role");
  const userDivision = localStorage.getItem("division");
  const isHRD = userDivision?.toUpperCase() === "HRD & GA";

  // -----------------------------------------
  // Load all forms filtered by division
  // -----------------------------------------
  async function load() {
    try {
      if (userRole !== "div_head") return;

      const pribadi = await api.get("/private/by-division");
      const cuti = await api.get("/cuti/by-division");
      const dalam = await api.get("/dinasDalamKota/by-division");
      const luar = await api.get("/dinasLuarKota/by-division");

      const combined = [
        ...pribadi.data.map((x) => ({ ...x, _type: "pribadi" })),
        ...cuti.data.map((x) => ({ ...x, _type: "cuti" })),
        ...dalam.data.map((x) => ({ ...x, _type: "dalam" })),
        ...luar.data.map((x) => ({ ...x, _type: "luar" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(combined);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------------------
  // Permissions
  // -----------------------------------------
  function canApprove(r) {
    const role = localStorage.getItem("role");
    const division = localStorage.getItem("division")?.toUpperCase();

    const isDivHead = role === "div_head";
    const isHRDHead = isDivHead && division === "HRD & GA";

    // ---------------------------
    // 1️⃣ Stage 1 — Division Head Approval
    // ---------------------------
    if (r.approval_div_head == null && r.approval_status === "pending") {
      // Normal division head must match division
      if (!isHRDHead) {
        return isDivHead && r.division.toUpperCase() === division;
      }
      // HRD head sees all
      return isHRDHead;
    }

    // ---------------------------
    // 2️⃣ Stage 2 — HRD Approval
    // ---------------------------
    if (
      r.approval_div_head === "approved" &&
      r.approval_hrd == null &&
      r.approval_status === "pending_hrd"
    ) {
      return isHRDHead;
    }

    return false;
  }



  // -----------------------------------------
  // Approval logic
  // -----------------------------------------
  async function doAction(item, action) {
    const type = item._type;
    const id = item.id;

    let endpoint = "";

    // CUTI has 2-stage approval
    if (type === "cuti") {
      // Stage 1
      if (item.approval_div_head == null) {
        endpoint = `/cuti/${id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }
      // Stage 2 (HRD)
      else if (item.approval_div_head === "approved" && item.approval_hrd == null) {
        endpoint = `/cuti/${id}/${action === "approve" ? "hrd-approve" : "hrd-deny"}`;
      }
    } 
    else {
      // Other forms are 1-stage only
      const map = {
        pribadi: "private",
        cuti: "cuti",
        dalam: "dinasDalamKota",
        luar: "dinasLuarKota",
      };
      const base = map[type];
      endpoint = `/${base}/${id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
    }

    try {
      await api.put(endpoint);
      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Approved" : "Rejected",
        timer: 1200,
        showConfirmButton: false,
      });
      load();
    } catch (e) {
      Swal.fire("Error", e.response?.data?.detail ?? "Failed", "error");
    }
  }

  // -----------------------------------------
  // Filter Logic
  // -----------------------------------------
  function matchFilters(item) {
    const txt = search.toLowerCase();

    const matchText =
      item.name?.toLowerCase().includes(txt) ||
      item.purpose?.toLowerCase().includes(txt) ||
      item.destination?.toLowerCase().includes(txt) ||
      item.title?.toLowerCase().includes(txt);

    const matchStatus =
      filterStatus === "" ? true : item.approval_status === filterStatus;

    const matchType =
      filterType === "" ? true : item._type === filterType;

    return matchText && matchStatus && matchType;
  }

  // -----------------------------------------
  // Component UI
  // -----------------------------------------
  return (
    <>
      <Navbar />

      <div className="page-container">
        <h2>Approval Kepala Divisi — {userDivision}</h2>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Cari nama / tujuan / alasan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="dalam">Dinas Dalam Kota</option>
            <option value="luar">Dinas Luar Kota</option>
            <option value="pribadi">Izin Pribadi</option>
            <option value="cuti">Cuti</option>
          </select>
        </div>

        {/* CARD LIST */}
        <div className="card-list">
          {requests.filter(matchFilters).map((r) => (
            <div
              key={r._type + "-" + r.id}
              className="request-card"
              data-id={r.id}
              data-type={r._type}
            >
              {/* HEADER */}
              <div className="card-header-container">
                <img src={IMS_logo} className="card-logo" alt="logo" />
                <div className="card-header">
                  <h3>
                    {r._type === "pribadi"
                      ? "FORM IZIN MENINGGALKAN PEKERJAAN"
                      : r._type === "cuti"
                      ? "FORM CUTI"
                      : r._type === "dalam"
                      ? "FORM DINAS DALAM KOTA"
                      : "SURAT PERINTAH PERJALANAN DINAS"}
                  </h3>
                </div>
                <div className="card-header-spacer"></div>
              </div>

              {/* BODY TABLE */}
              <div className="request-table">
                <b>Nama</b> <span>{r.name}</span>
                <b>Divisi</b> <span>{r.division}</span>

                {/* ------------ CUTI ------------ */}
                {r._type === "cuti" && (
                  <>
                    <b>Jenis Cuti</b> <span>{r.cuti_type}</span>
                    <b>Mulai</b> <span>{formatReadableDateTime(r.date_start)}</span>
                    <b>Selesai</b> <span>{formatReadableDateTime(r.date_end)}</span>
                    <b>Durasi</b> <span>{r.duration} hari</span>
                    <b>Keperluan</b> <span>{r.purpose}</span>
                    <b>Alamat</b> <span>{r.address}</span>
                    <b>No. Telp</b> <span>{r.phone}</span>
                    <b>Catatan</b> <span>{r.notes}</span>
                    <b>Cuti Tersisa</b> <span>{r.leave_days}</span>
                    <b>Sisa Setelah</b> <span>{r.leave_days - r.duration}</span>
                  </>
                )}

                {/* ------------ PRIBADI ------------ */}
                {r._type === "pribadi" && (
                  <>
                    <b>Judul</b> <span>{r.title}</span>
                    <b>Tipe</b> <span>{r.request_type}</span>

                    {r.request_type === "time_off" && (
                      <>
                        <b>Tanggal</b> <span>{formatDate(r.date)}</span>
                        <b>Hari</b> <span>{r.day_label ?? "-"}</span>
                      </>
                    )}

                    {r.request_type === "leave_early" && (
                      <>
                        <b>Pulang Lebih Awal</b>
                        <span>{formatTime(r.short_hour)}</span>
                      </>
                    )}

                    {r.request_type === "come_late" && (
                      <>
                        <b>Hari</b> <span>{r.come_late_day ?? "-"}</span>
                        <b>Tanggal</b> <span>{formatDate(r.come_late_date)}</span>
                        <b>Jam Terlambat</b> <span>{formatTime(r.come_late_hour)}</span>
                      </>
                    )}

                    {r.request_type === "temp_leave" && (
                      <>
                        <b>Mulai</b> <span>{formatReadableDateTime(r.temp_leave_start)}</span>
                        <b>Sampai</b> <span>{formatReadableDateTime(r.temp_leave_end)}</span>
                      </>
                    )}

                    <b>Catatan</b> <span>{r.notes ?? "-"}</span>
                  </>
                )}

                {/* ------------ DINAS DALAM KOTA ------------ */}
                {r._type === "dalam" && (
                  <>
                    <b>Tujuan</b> <span>{r.purpose}</span>
                    <b>Waktu Mulai</b> <span>{formatReadableDateTime(r.time_start)}</span>
                    <b>Waktu Selesai</b> <span>{formatReadableDateTime(r.time_end)}</span>
                    <b>Status Form</b> <span>{r.status}</span>
                    <b>Catatan</b> <span>{r.notes ?? "-"}</span>
                  </>
                )}

                {/* ------------ DINAS LUAR KOTA ------------ */}
                {r._type === "luar" && (
                  <>
                    <b>Tujuan</b> <span>{r.destination}</span>
                    <b>Keperluan</b> <span>{r.purpose}</span>
                    <b>Kebutuhan</b> <span>{r.needs ?? "-"}</span>
                    <b>Pengikut</b> <span>{r.companions ?? "-"}</span>
                    <b>Keperluan Pengikut</b> <span>{r.companion_purpose ?? "-"}</span>
                    <b>Tanggal Berangkat</b> <span>{formatDate(r.depart_date)}</span>
                    <b>Tanggal Kembali</b> <span>{formatDate(r.return_date)}</span>
                    <b>Angkutan</b> <span>{r.transport_type}</span>
                    <b>Barang Dibawa</b> <span>{r.items_brought ?? "-"}</span>
                  </>
                )}

                <b>Dikumpulkan</b>
                <span>{formatReadableDateTime(r.created_at)}</span>
              </div>

              {/* STATUS */}
              <div
                className={`approval-status ${
                  r.approval_status === "approved"
                    ? "status-approved"
                    : r.approval_status === "rejected"
                    ? "status-rejected"
                    : "status-pending"
                }`}
              >
                Status: {r.approval_status}
              </div>

              {/* ACTION BUTTONS */}
              <div className="action-row">
                <button
                  className="pdf-btn"
                  onClick={() => exportPDF(r._type, r.id, `${r._type}_${r.id}`)}
                >
                  Download PDF
                </button>

                {canApprove(r) && (
                  <>
                    <button className="approve-btn" onClick={() => doAction(r, "approve")}>
                      Approve
                    </button>
                    <button className="deny-btn" onClick={() => doAction(r, "deny")}>
                      Reject
                    </button>
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
