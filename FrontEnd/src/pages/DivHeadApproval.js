// FrontEnd/src/pages/DivHeadApproval.js
import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import "../styles/request.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = localStorage.getItem("role");
  const userDivision = localStorage.getItem("division");

  // --------------------------------------------------------------------
  // PDF EXPORT HELPER (same as MyRequest)
  // --------------------------------------------------------------------
  async function exportPDF(type, id, filename) {
    const selector = `.request-card[data-type="${type}"][data-id="${id}"]`;
    const element = document.querySelector(selector);

    if (!element) {
      console.error("PDF Export: element not found", selector);
      return;
    }

    const clone = element.cloneNode(true);
    clone.querySelectorAll(".pdf-btn").forEach((btn) => btn.remove());

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = element.offsetWidth + "px";
    container.appendChild(clone);
    document.body.appendChild(container);

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save(filename + ".pdf");

    document.body.removeChild(container);
  }

  // --------------------------------------------------------------------
  // LOAD ALL REQUESTS (HRD sees all)
  // --------------------------------------------------------------------
  async function load() {
    try {
      if (userRole !== "div_head") {
        setRequests([]);
        return;
      }

      const pribadi = await api.get("/private/by-division");
      const cuti = await api.get("/cuti/by-division");
      const dalam = await api.get("/dinasDalamKota/by-division");
      const luar = await api.get("/dinasLuarKota/by-division");

      const combined = [
        ...pribadi.data.map((r) => ({ ...r, _type: "pribadi" })),
        ...cuti.data.map((r) => ({ ...r, _type: "cuti" })),
        ...dalam.data.map((r) => ({ ...r, _type: "dalam" })),
        ...luar.data.map((r) => ({ ...r, _type: "luar" })),
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

  // --------------------------------------------------------------------
  // CAN APPROVE
  // HRD (div_head of HRD & GA) can approve ALL
  // --------------------------------------------------------------------
  function isHRD() {
    return userDivision?.toUpperCase() === "HRD & GA";
  }

  function canApprove(item) {
    if (isHRD()) return true; // HRD sees all
    return userRole === "div_head" && item.division === userDivision;
  }

  // -------------------------------------------------------
  // PERMISSION CHECK
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

  // --------------------------------------------------------------------
  function translateFormType(t) {
    return (
      {
        pribadi: "Izin Pribadi",
        cuti: "Cuti",
        dalam: "Dinas Dalam Kota",
        luar: "Dinas Luar Kota",
      }[t] || t
    );
  }

  // --------------------------------------------------------------------
  if (loading) return <h2>Loading...</h2>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Approval Kepala Divisi — {userDivision}</h2>

        {requests.length === 0 && <p>Tidak ada request.</p>}

        <div className="card-list">
          {requests.map((r) => (
            <div
              className="request-card"
              key={r._type + "-" + r.id}
              data-type={r._type}
              data-id={r.id}
            >
              <div className="card-header">
                <h3>{translateFormType(r._type)}</h3>
                <button
                  className="pdf-btn"
                  onClick={() =>
                    exportPDF(r._type, r.id, `${translateFormType(r._type)}-${r.name}`)
                  }
                >
                  Download PDF
                </button>
              </div>

              {/* MAIN INFO (cuti has special fields) */}
              <div className="request-table">
                <b>Nama</b> <span>{r.name}</span>
                <b>Divisi</b> <span>{r.division}</span>

                {r._type === "cuti" && (
                  <>
                    <b>Jenis Cuti</b> <span>{r.cuti_type}</span>
                    <b>Tanggal</b> <span>{r.date_start} — {r.date_end}</span>
                    <b>Durasi</b> <span>{r.duration} hari</span>
                    <b>Keperluan</b> <span>{r.purpose}</span>
                    <b>Alamat</b> <span>{r.address}</span>
                    <b>No. Telp</b> <span>{r.phone}</span>
                    <b>Catatan</b> <span>{r.notes}</span>
                    <b>Cuti Tersisa</b> <span>{r.leave_days}</span>
                    <b>Cuti Setelah</b> <span>{r.leave_days - r.duration}</span>
                  </>
                )}

                {r._type === "dalam" && (
                  <>
                    <b>Tujuan</b> <span>{r.purpose}</span>
                    <b>Waktu</b> <span>{r.time_start} — {r.time_end}</span>
                  </>
                )}

                {r._type === "luar" && (
                  <>
                    <b>Tujuan</b> <span>{r.destination}</span>
                    <b>Keperluan</b> <span>{r.purpose}</span>
                  </>
                )}

                {r._type === "pribadi" && (
                  <>
                    <b>Judul</b> <span>{r.title}</span>
                    <b>Tipe</b> <span>{r.request_type}</span>
                  </>
                )}
              </div>

              {/* STATUS */}
              <div className="approval-status">
                <div><b>Status Kepala Divisi:</b> {r.approval_div_head || "—"}</div>
                <div><b>Status HRD:</b> {r.approval_hrd || "—"}</div>
                <div><b>Status Akhir:</b> {r.approval_status}</div>
              </div>

              {/* ACTION BUTTONS */}
              {canApprove(r) && (
                <div style={{ marginTop: 20 }}>
                  <button className="approve-btn" onClick={() => doAction(r, "approve")}>
                    Approve
                  </button>
                  <button className="deny-btn" onClick={() => doAction(r, "deny")}>
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
