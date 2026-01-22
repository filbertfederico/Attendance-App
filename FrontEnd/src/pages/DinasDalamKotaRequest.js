// FrontEnd/src/pages/DinasDalamKotaRequest.js
import React, { useState } from "react";
import { api } from "../api/api";
import "../styles/form.css";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

function formatDisplay(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d)) return raw;

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}


export default function DinasDalamKotaRequest() {
  const userName = localStorage.getItem("name");
  const division = localStorage.getItem("division");

  const [form, setForm] = useState({
    division: "",
    purpose: "",
    timeStart: "",
    timeEnd: "",
    status: "return",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (new Date(form.timeEnd) < new Date(form.timeStart)) {
      Swal.fire({
        icon: "error",
        title: "Tanggal Tidak Valid",
        text: "Waktu selesai tidak boleh lebih awal dari waktu mulai.",
      });
      return;
    }

    try {
      const payload = {
        name: userName,
        division: form.division,
        purpose: form.purpose,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        status: form.status,
      };

      await api.post("/dinasDalamKota/", payload);

      Swal.fire({
        icon: "success",
        title: "Izin Terkumpulkan",
        text: "Izin dinas Anda telah diajukan.",
        timer: 1500,
        showConfirmButton: false,
      });

      // reset form
      setForm({
        division: "",
        purpose: "",
        timeStart: "",
        timeEnd: "",
        status: "return",
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Izin",
        text: "Terjadi masalah. Coba lagi.",
      });
    }
  }

  return (
    <>
      <Navbar />
      <div className="form-container">
        <h2>FORM DINAS DALAM KOTA</h2>

        <form onSubmit={handleSubmit}>
          <p><b>Nama:</b> {userName}</p>

          <label>Divisi:</label>
          <input
            type="text"
            name="division"
            value={division}
            onChange={handleChange}
            required
          />

          <label>Tujuan:</label>
          <input
            type="text"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            required
          />

          <label>Waktu Berangkat:</label>
          <input 
            type="datetime-local"
            name="timeStart"
            value={form.timeStart}
            onChange={handleChange}
            required
          />

          <label>Waktu Kembali:</label>
          <input 
            type="datetime-local"
            name="timeEnd"
            value={form.timeEnd}
            onChange={handleChange}
            required
          />

          <label>Status:</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="return">Kembali ke Kantor</option>
            <option value="not_return">Tidak Kembali ke Kantor</option>
          </select>

          <button type="submit">Ajukan!</button>
        </form>
      </div>
    </>
  );
}
