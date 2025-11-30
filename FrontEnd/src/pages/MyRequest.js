// src/pages/MyRequest.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import "../styles/request.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import IMS_logo from "../assets/IMS_logo.png"

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

// PDF Export
async function exportPDF(elementId, filename) {
  const element = document.getElementById(elementId);
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const width = 210;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, width, height);
  pdf.save(filename + ".pdf");
}

// --------------------------------------
// MAIN COMPONENT
// --------------------------------------

export default function MyRequest() {
  const [dinasDalamKotaList, setDinasDalamKotaList] = useState([]);
  const [dinasLuarKotaList, setDinasLuarKotaList] = useState([]);
  const [pribadiList, setPribadiList] = useState([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  async function loadData() {
    try {
      const dk = await api.get("/dinasDalamKota/my");
      const dlk = await api.get("/dinasLuarkota/my");
      const pribadi = await api.get("/private/my");

      setDinasDalamKotaList(dk.data || []);
      setDinasLuarKotaList(dlk.data || []);
      setPribadiList(pribadi.data || []);
    } catch (err) {
      console.error("Error loading request data:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filters
  function matchFilters(item, type) {
    const text = search.toLowerCase();

    const matchText =
      item.name?.toLowerCase().includes(text) ||
      item.purpose?.toLowerCase().includes(text) ||
      item.destination?.toLowerCase().includes(text) ||
      item.title?.toLowerCase().includes(text);

    const matchStatus = filterStatus ? item.approval_status === filterStatus : true;
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
          </select>
        </div>

        <div className="card-list">

          {/* ---------------- DINAS DALAM KOTA ---------------- */}
          {dinasDalamKotaList
            .filter((d) => matchFilters(d, "dalam"))
            .map((d) => (
              <div className="request-card" key={`dk-${d.id}`} id={`card-${d.id}`}>

                {/* Header with LOGO */}
                <div className="card-header-container">
                  <img src= {IMS_logo} className="card-logo" alt="logo" />

                  <div className="card-header">
                    <h3>FORM DINAS DALAM KOTA</h3>
                    <p className="header-sub">
                      Ruko Alam Sutera Town Center — Pakulonan Serpong
                    </p>
                  </div>

                  <div className="card-header-spacer"></div>
                </div>

                <div className="request-table">
                  <b>Nama</b> <span>{d.name}</span>
                  <b>Divisi</b> <span>{d.division}</span>
                  <b>Tujuan</b> <span>{d.purpose}</span>
                  <b>Waktu Berangkat</b> <span>{d.time_start}</span>
                  <b>Waktu Selesai</b> <span>{d.time_end}</span>
                  <b>Status Form</b> <span>{d.status}</span>
                  <b>Dikumpulkan</b> <span>{formatReadableDateTime(d.created_at)}</span>
                </div>

                {/* STATUS BADGE */}
                <div
                  className={`approval-status ${
                    d.approval_status === "approved"
                      ? "status-approved"
                      : d.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {d.approval_status}
                </div>

                <button
                  onClick={() => exportPDF(`card-${d.id}`, `DinasDalam_${d.id}`)}
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))}

          {/* ---------------- DINAS LUAR KOTA ---------------- */}
          {dinasLuarKotaList
            .filter((d) => matchFilters(d, "luar"))
            .map((d) => (
              <div className="request-card" key={`dlk-${d.id}`} id={`card-${d.id}`}>

                <div className="card-header-container">
                  <img src= {IMS_logo} className="card-logo" alt="logo" />

                  <div className="card-header">
                    <h3>SURAT PERINTAH PERJALANAN DINAS</h3>
                    <p className="header-sub">Nomor SPD: {String(d.id).padStart(5, "0")}</p>
                  </div>

                  <div className="card-header-spacer"></div>
                </div>

                <div className="request-table">
                  <b>Nama</b> <span>{d.name}</span>
                  <b>Departemen</b> <span>{d.department}</span>
                  <b>Tujuan</b> <span>{d.destination}</span>
                  <b>Keperluan</b> <span>{d.purpose}</span>
                  <b>Kebutuhan</b> <span>{d.needs || "—"}</span>

                  <b>Pengikut</b> <span>{d.companions || "—"}</span>
                  <b>Keperluan Pengikut</b> <span>{d.companion_purpose || "—"}</span>

                  <b>Tanggal Berangkat</b> <span>{formatDate(d.depart_date)}</span>
                  <b>Tanggal Kembali</b> <span>{formatDate(d.return_date)}</span>

                  <b>Jenis Angkutan</b> <span>{d.transport_type}</span>
                  <b>Barang Dibawa</b> <span>{d.items_brought || "—"}</span>

                  <b>Dikumpulkan</b>
                  <span>{formatReadableDateTime(d.created_at)}</span>
                </div>

                <div
                  className={`approval-status ${
                    d.approval_status === "approved"
                      ? "status-approved"
                      : d.approval_status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  Status: {d.approval_status}
                </div>

                <button
                  onClick={() => exportPDF(`card-${d.id}`, `DinasLuar_${d.id}`)}
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
              <div className="request-card" key={`p-${p.id}`} id={`card-${p.id}`}>

                <div className="card-header-container">
                  <img src= {IMS_logo} className="card-logo" alt="logo" />

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
                      `Datang terlambat ${formatTime(p.come_late_date)} pukul ${formatTime(
                        p.come_late_hour
                      )}`}

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
                  onClick={() => exportPDF(`card-${p.id}`, `IzinPribadi_${p.id}`)}
                  className="pdf-btn"
                >
                  Download PDF
                </button>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
