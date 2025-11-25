// src/pages/RequestList.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import "../styles/request.css";

// ---------- Helper Functions ----------
function getDayLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ID", { weekday: "long" });
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
  const [dinasDalamKotaList, setDinasDalamKotaList] = useState([]);
  const [dinasLuarKotaList, setDinasLuarKotaList] = useState([]);
  const [pribadiList, setPribadiList] = useState([]);

  async function loadData() {
    try {
      const dinasDalamKota = await api.get("/dinasDalamKota/my");
      const dinasLuarKota = await api.get("/dinasLuarkota/my");
      const pribadi = await api.get("/private/my");

      setDinasDalamKotaList(Array.isArray(dinasDalamKota.data) ? dinasDalamKota.data : []);
      setDinasLuarKotaList(Array.isArray(dinasLuarKota.data) ? dinasLuarKota.data : []);
      setPribadiList(Array.isArray(pribadi.data) ? pribadi.data : []);

    } catch (err) {
      console.error("Error loading request data:", err);
      setDinasDalamKotaList([]);
      setDinasLuarKotaList([]);
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
        <h2>Semua Izin</h2>

        <div className="card-list">

          {/* ---------- DINAS DALAM KOTA ---------- */}
          {dinasDalamKotaList.map((d) => (
            <div className="card" key={`dk-${d.id}`}>
              <h3>Form Dinas Dalam Kota</h3>

              <p><b>Nama:</b> {d.name}</p>
              <p><b>Divisi:</b> {d.division}</p>
              <p><b>Tujuan:</b> {d.purpose}</p>
              <p><b>Waktu:</b> {d.time_start} → {d.time_end}</p>
              <p><b>Status Form:</b> {d.status}</p>
              <p><b>Status Persetujuan:</b> {d.approval_status}</p>
              <p><b>Dikumpulkan pada:</b> {d.created_at}</p>
            </div>
          ))}

          {/* ---------- DINAS LUAR KOTA ---------- */}
          {dinasLuarKotaList.map((d) => (
            <div className="card" key={`dlk-${d.id}`}>
              <h3>Form Dinas Luar Kota</h3>

              <p><b>Nama:</b> {d.name}</p>
              <p><b>Departemen:</b> {d.department}</p>
              <p><b>Tujuan:</b> {d.destination}</p>
              <p><b>Keperluan:</b> {d.purpose}</p>
              <p><b>Kebutuhan Tambahan:</b> {d.needs || "—"}</p>

              <p><b>Pengikut:</b> {d.companions || "—"}</p>
              <p><b>Keperluan Pengikut:</b> {d.companion_purpose || "—"}</p>

              <p><b>Tanggal Berangkat:</b> {formatDate(d.depart_date)}</p>
              <p><b>Tanggal Kembali:</b> {formatDate(d.return_date)}</p>

              <p><b>Jenis Angkutan:</b> {d.transport_type}</p>
              <p><b>Barang Dibawa:</b> {d.items_brought || "—"}</p>

              <p><b>Status Persetujuan:</b> {d.approval_status}</p>
              <p><b>Dikumpulkan pada:</b> {d.created_at}</p>
            </div>
          ))}

          {/* ---------- IZIN PRIBADI ---------- */}
          {pribadiList.map((p) => (
            <div className="card" key={`p-${p.id}`}>
              <h3>Form Izin</h3>

              <p><b>Nama:</b> {p.name}</p>
              <p><b>Jabatan:</b> {p.division}</p>

              <p><b>Perincian:</b>{" "}
                {p.request_type === "time_off" && (
                  <>Tidak masuk kerja pada hari dan tanggal: {formatDate(p.date)}</>
                )}
                {p.request_type === "leave_early" && (
                  <>Pulang lebih awal pada pukul: {formatTime(p.short_hour)}</>
                )}
                {p.request_type === "come_late" && (
                  <>Datang terlambat pada: {formatDate(p.come_late_date)}, pukul: {formatTime(p.come_late_hour)}</>
                )}
                {p.request_type === "temp_leave" && (
                  <>Meninggalkan pekerjaan sementara: {formatDate(p.temp_leave_start)}</>
                )}
              </p>

              <p><b>Alasan:</b> {p.title}</p>
              <p><b>Status:</b> {p.approval_status}</p>
            </div>
          ))}

        </div>
      </div>
    </>
  );
}
