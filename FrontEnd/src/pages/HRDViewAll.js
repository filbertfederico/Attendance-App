import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { api } from "../api/api";
import "../styles/request.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function HRDViewAll() {
  const [forms, setForms] = useState({
    cuti: [],
    pribadi: [],
    dalam: [],
    luar: [],
  });

  // ----------------------------
  // LOAD DATA (HRD ARCHIVE)
  // ----------------------------
  useEffect(() => {
    async function load() {
      try {
        const [cuti, pribadi, dalam, luar] = await Promise.all([
          api.get("/cuti/by-division"),
          api.get("/private/by-division"),
          api.get("/dinasDalamKota/by-division"),  
          api.get("/dinasLuarKota/by-division"),   
        ]);

        setForms({
          cuti: cuti.data || [],
          pribadi: pribadi.data || [],
          dalam: dalam.data || [],
          luar: luar.data || [],
        });
      } catch (err) {
        console.error("HRDViewAll fetch error:", err);
      }
    }

    load();
  }, []);

  // ----------------------------
  // PDF EXPORT
  // ----------------------------
  async function exportPDF(type, id) {
    const selector = `.request-card[data-type="${type}"][data-id="${id}"]`;
    const element = document.querySelector(selector);
    if (!element) return;

    const clone = element.cloneNode(true);
    clone.querySelectorAll(".pdf-btn").forEach((b) => b.remove());

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
    pdf.save(`${type}-${id}.pdf`);

    document.body.removeChild(container);
  }

  const translateType = (t) => {
    if (t === "pribadi") return "Izin Pribadi";
    if (t === "cuti") return "Cuti";
    if (t === "dalam") return "Dinas Dalam Kota";
    if (t === "luar") return "Dinas Luar Kota";
    return t;
  };

  // ----------------------------
  // CARD RENDERER (READ ONLY)
  // ----------------------------
  const renderCard = (type, r) => (
    <div
      className="request-card"
      key={`${type}-${r.id}`}
      data-type={type}
      data-id={r.id}
    >
      <div className="card-header">
        <h3>{translateType(type).toUpperCase()}</h3>
        <div className="header-sub">Arsip HRD & GA</div>
      </div>

      <div className="request-table">
        <b>Nama</b> <span>{r.name}</span>
        <b>Divisi</b> <span>{r.division}</span>

        {type === "cuti" && (
          <>
            <b>Jenis Cuti</b> <span>{r.cuti_type}</span>
            <b>Tanggal</b> <span>{r.date_start} — {r.date_end}</span>
            <b>Durasi</b> <span>{r.duration} hari</span>
            <b>Status Div Head</b> <span>{r.approval_div_head}</span>
            <b>Status HRD</b> <span>{r.approval_hrd}</span>
            <b>Status Akhir</b> <span>{r.approval_status}</span>
          </>
        )}

        {type === "pribadi" && (
          <>
            <b>Judul</b> <span>{r.title}</span>
            <b>Jenis</b> <span>{r.request_type}</span>
            <b>Status Div Head</b> <span>{r.approval_div_head}</span>
            <b>Status Akhir</b> <span>{r.approval_status}</span>
          </>
        )}

        {type === "dalam" && (
          <>
            <b>Keperluan</b> <span>{r.purpose}</span>
            <b>Mulai</b> <span>{r.time_start}</span>
            <b>Selesai</b> <span>{r.time_end}</span>
            <b>Status Div Head</b> <span>{r.approval_div_head}</span>
            <b>Status Akhir</b> <span>{r.approval_status}</span>
          </>
        )}

        {type === "luar" && (
          <>
            <b>Tujuan</b> <span>{r.destination}</span>
            <b>Keperluan</b> <span>{r.purpose}</span>
            <b>Status Div Head</b> <span>{r.approval_div_head}</span>
            <b>Status HRD</b> <span>{r.approval_hrd}</span>
            <b>Status Finance</b> <span>{r.approval_finance}</span>
            <b>Status Akhir</b> <span>{r.approval_status}</span>
          </>
        )}
      </div>

      <button className="pdf-btn" onClick={() => exportPDF(type, r.id)}>
        Download PDF
      </button>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Arsip Semua Form — HRD & GA</h2>

        <div className="card-list">
          {forms.cuti.map((r) => renderCard("cuti", r))}
          {forms.pribadi.map((r) => renderCard("pribadi", r))}
          {forms.dalam.map((r) => renderCard("dalam", r))}
          {forms.luar.map((r) => renderCard("luar", r))}
        </div>
      </div>
    </>
  );
}
