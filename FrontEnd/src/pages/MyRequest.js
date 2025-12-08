// src/pages/MyRequest.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import "../styles/request.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import IMS_logo from "../assets/IMS_logo.png";

// --------------------------------------
// Helper Functions
// --------------------------------------

function formatReadableDateTime(raw) {
  if (!raw) return "";
  const date = new Date(raw);

  const dayName = date.toLocaleDateString("id-ID", { weekday: "long" });
  const day = date.toLocaleDateString("id-ID", { day: "numeric" });
  const month = date.toLocaleDateString("id-ID", { month: "long" });
  const year = date.getFullYear();

  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${dayName}, ${day} ${month} ${year} — ${time}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dayName = d.toLocaleDateString("id-ID", { weekday: "long" });
  return `${dayName} (${dateStr})`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

// --------------------------------------
// PDF EXPORT
// --------------------------------------

// Robust export: find by data-type & data-id, clone to offscreen container, capture, cleanup.
async function exportPDFByTypeAndId(type, id, filename) {
  const selector = `.request-card[data-type="${type}"][data-id="${id}"]`;
  const element = document.querySelector(selector);

  if (!element) {
    console.error("exportPDFByTypeAndId: element not found", selector);
    return;
  }

  // Create a deep clone of the card so we can remove the button
  const clone = element.cloneNode(true);

  // Remove the download button from the clone
  clone.querySelectorAll(".pdf-btn").forEach((btn) => btn.remove());

  // Create a hidden container for clean export
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = element.offsetWidth + "px";
  container.appendChild(clone);
  document.body.appendChild(container);

  // Render the clone instead of the real card
  const canvas = await html2canvas(clone, { scale: 2, useCORS: true });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const width = 210;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save(filename + ".pdf");

  // cleanup
  document.body.removeChild(container);
}


function translateCutiType(type) {
  switch (type) {
    case "yearly":
      return "Tahunan";
    case "pregnancy":
      return "Hamil";
    case "unpaid":
      return "Unpaid";
    default:
      return type;
  }
}

// --------------------------------------
// MAIN COMPONENT
// --------------------------------------

export default function MyRequest() {
  const [dinasDalamKotaList, setDinasDalamKotaList] = useState([]);
  const [dinasLuarKotaList, setDinasLuarKotaList] = useState([]);
  const [pribadiList, setPribadiList] = useState([]);
  const [cutiList, setCutiList] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  async function loadData() {
    try {
      const ddk = await api.get("/dinasDalamKota/my");
      const dlk = await api.get("/dinasLuarKota/my");
      const pribadi = await api.get("/private/my");
      const cuti = await api.get("/cuti/my");

      setDinasDalamKotaList(ddk.data || []);
      setDinasLuarKotaList(dlk.data || []);
      setPribadiList(pribadi.data || []);
      setCutiList(cuti.data || []);
    } catch (err) {
      console.error("Error loading request data:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtering logic
  function matchFilters(item, type) {
    const text = search.toLowerCase();

    const matchText =
      item.name?.toLowerCase().includes(text) ||
      item.purpose?.toLowerCase().includes(text) ||
      item.destination?.toLowerCase().includes(text) ||
      item.title?.toLowerCase().includes(text);

    const matchStatus =
      filterStatus ? item.approval_status === filterStatus : true;

    const matchType = filterType === "" ? true : filterType === type;

    return matchText && matchStatus && matchType;
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Semua Izin</h2>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <input
            type="text"
            placeholder="Cari nama / tujuan / alasan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Semua Jenis</option>
            <option value="dalam">Dinas Dalam Kota</option>
            <option value="luar">Dinas Luar Kota</option>
            <option value="pribadi">Izin Pribadi</option>
            <option value="cuti">Cuti</option>
          </select>
        </div>

        <div className="card-list">
          {/* ---------------- DINAS DALAM KOTA ---------------- */}
          {dinasDalamKotaList
            .filter((ddk) => matchFilters(ddk, "dalam"))
            .map((ddk) => (
              <div
                className="request-card"  
                key={`ddk-${ddk.id}`}
                id={`card-ddk-${ddk.id}`}
                data-type="dalam"
                data-id={ddk.id}
              >
                {/* Header with LOGO */}
                <div className="card-header-container">
                  <img src={IMS_logo} className="card-logo" alt="logo" />
            
                  <div className="card-header">
                    <h3>FORM DINAS DALAM KOTA</h3>
                    <p className="header-sub">
                      Ruko Alam Sutera Town Center — Pakulonan Serpong
                    </p>
                  </div>
            
                  <div className="card-header-spacer"></div>
                </div>
            
                <div className="request-table">
                  <b>Nama</b> <span>{ddk.name}</span>
                  <b>Divisi</b> <span>{ddk.division}</span>
                  <b>Tujuan</b> <span>{ddk.purpose}</span>
                  <b>Waktu Berangkat</b> <span>{ddk.time_start}</span>
                  <b>Waktu Selesai</b> <span>{ddk.time_end}</span>
                  <b>Status Form</b> <span>{ddk.status}</span>
                  <b>Dikumpulkan</b>
                  <span>{formatReadableDateTime(ddk.created_at)}</span>
                </div>
            
                {/* STATUS BADGE */}
                <div
                  className={`approval-status ${
                    ddk.approval_status === "approved"
                      ? "status-approved"
                      : ddk.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {ddk.approval_status}
                </div>
                
                <button
                  onClick={() =>exportPDFByTypeAndId("dalam", ddk.id, `DinasDalam_${ddk.id}`)}
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))}
        
          {/* ---------------- DINAS LUAR KOTA ---------------- */}
          {dinasLuarKotaList
            .filter((dlk) => matchFilters(dlk, "luar"))
            .map((dlk) => (
              <div
                className="request-card"
                key={`dlk-${dlk.id}`}
                id={`card-dlk-${dlk.id}`}
                data-type="luar"
                data-id={dlk.id}
              >
                <div className="card-header-container">
                  <img src={IMS_logo} className="card-logo" alt="logo" />
            
                  <div className="card-header">
                    <h3>SURAT PERINTAH PERJALANAN DINAS</h3>
                    <p className="header-sub">
                      Nomor SPD: {String(dlk.id).padStart(5, "0")}
                    </p>
                  </div>
            
                  <div className="card-header-spacer"></div>
                </div>
            
                <div className="request-table">
                  <b>Nama</b> <span>{dlk.name}</span>
                  <b>Departemen</b> <span>{dlk.department}</span>
                  <b>Tujuan</b> <span>{dlk.destination}</span>
                  <b>Keperluan</b> <span>{dlk.purpose}</span>
                  <b>Kebutuhan</b> <span>{dlk.needs || "—"}</span>
            
                  <b>Pengikut</b> <span>{dlk.companions || "—"}</span>
                  <b>Keperluan Pengikut</b> <span>{dlk.companion_purpose || "—"}</span>
            
                  <b>Tanggal Berangkat</b>
                  <span>{formatDate(dlk.depart_date)}</span>
                  <b>Tanggal Kembali</b>
                  <span>{formatDate(dlk.return_date)}</span>
            
                  <b>Jenis Angkutan</b> <span>{dlk.transport_type}</span>
                  <b>Barang Dibawa</b> <span>{dlk.items_brought || "—"}</span>
            
                  <b>Dikumpulkan</b>
                  <span>{formatReadableDateTime(dlk.created_at)}</span>
                </div>
            
                <div
                  className={`approval-status ${
                    dlk.approval_status === "approved"
                      ? "status-approved"
                      : dlk.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {dlk.approval_status}
                </div>
                
                <button
                  onClick={() =>exportPDFByTypeAndId("luar", dlk.id, `DinasDalam_${dlk.id}`)}
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))}

          
          {/* ---------------- IZIN PRIBADI ---------------- */}
          {pribadiList
            .filter((p) => matchFilters(p, "pribadi"))
            .map((p) => (
              <div
                className="request-card"
                key={`p-${p.id}`}
                id={`card-pribadi-${p.id}`}
                data-type="pribadi"
                data-id={p.id}
              >
                <div className="card-header-container">
                  <img src={IMS_logo} className="card-logo" alt="logo" />
            
                  <div className="card-header">
                    <h3>FORM IZIN MENINGGALKAN PEKERJAAN</h3>
                  </div>
            
                  <div className="card-header-spacer"></div>
                </div>
            
                <div className="request-table">
                  <b>Nama</b> <span>{p.name}</span>
                  <b>Jabatan</b> <span>{p.division}</span>
            
                  <b>Perincian</b>
                  <span>
                    {p.request_type === "time_off" &&
                      `Tidak masuk pada: ${formatDate(p.date)}`}

                    {p.request_type === "leave_early" &&
                      `Pulang lebih awal pukul: ${formatTime(p.short_hour)}`}

                    {p.request_type === "come_late" &&
                      `Datang terlambat ${formatTime(
                        p.come_late_date
                      )} pukul ${formatTime(p.come_late_hour)}`}

                    {p.request_type === "temp_leave" &&
                      `Meninggalkan pekerjaan sementara:
                      ${formatReadableDateTime(p.temp_leave_start)}
                      sampai ${formatReadableDateTime(p.temp_leave_end)}`}
                  </span>
                    
                  <b>Alasan</b> <span>{p.title}</span>
                    
                  <b>Dikumpulkan</b>
                  <span>{formatReadableDateTime(p.created_at)}</span>
                </div>
                    
                <div
                  className={`approval-status ${
                    p.approval_status === "approved"
                      ? "status-approved"
                      : p.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {p.approval_status}
                </div>
                
                <button
                  onClick={() =>exportPDFByTypeAndId("pribadi", p.id, `Pribadi_${p.id}`)}
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))
          }
          {/* ---------------- CUTI REQUESTS ---------------- */}
          {cutiList
            .filter((c) => matchFilters(c, "cuti"))
            .map((c) => (
              <div
                className="request-card"
                key={`cuti-${c.id}`}
                id={`card-cuti-${c.id}`}
                data-type="cuti"
                data-id={c.id}
              >
                <div className="card-header-container">
                  <img src={IMS_logo} className="card-logo" alt="logo" />
            
                  <div className="card-header">
                    <h3>FORM CUTI</h3>
                  </div>
            
                  <div className="card-header-spacer"></div>
                </div>
            
                <div className="request-table">
                  <b>Nama</b> <span>{c.name}</span>
                  <b>Divisi</b> <span>{c.division}</span>
                  <b>Jenis Cuti</b> <span>{translateCutiType(c.cuti_type)}</span>
                  <b>Mulai</b> <span>{formatReadableDateTime(c.date_start)}</span>
                  <b>Selesai</b> <span>{formatReadableDateTime(c.date_end)}</span>
                  <b>Durasi</b> <span>{c.duration} hari</span>
                  <b>Keperluan</b> <span>{c.purpose}</span>
                  <b>Alamat</b> <span>{c.address}</span>
                  <b>No. Telp</b> <span>{c.phone}</span>
                  <b>Catatan</b> <span>{c.notes}</span>
            
                  <b>Cuti Tersisa</b> <span>{c.leave_days ?? "-"}</span>
                  <b>Cuti Setelah</b> <span>{c.leave_days != null ? c.leave_days - c.duration : "-"}</span>
            
                  <b>Status Kepala Divisi</b> <span>{c.approval_div_head || "—"}</span>
                  <b>Status HRD</b> <span>{c.approval_hrd || "—"}</span>
                  <b>Status Akhir</b> <span>{c.approval_status}</span>
            
                  <b>Dikumpulkan</b>
                  <span>{formatReadableDateTime(c.created_at)}</span>
                </div>
            
                <div
                  className={`approval-status ${
                    c.approval_status === "approved"
                      ? "status-approved"
                      : c.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {c.approval_status}
                </div>
                
                <button
                  onClick={() =>
                    exportPDFByTypeAndId("cuti", c.id, `Cuti_${c.id}`)
                  }
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </>
  );
}