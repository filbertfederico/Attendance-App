// FrontEnd/src/pages/PribadiRequest.js
//Form izin (pribadi)
import React, { useState } from "react";
import { api } from "../api/api";
import "../styles/form.css";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";

export default function PribadiRequest() {
  const userName = localStorage.getItem("name");
  const division = localStorage.getItem("division");
  const [form, setForm] = useState({
    title: "",
    division: "",
    requestType: "",
    dayLabel: "",
    date: "",
    shortHour: "",
    comeLateDate: "",
    comeLateHour: "",
    tempLeaveStart: "",
    tempLeaveEnd: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const payload = {
        name: userName,
        title: form.title,
        division: form.division,
        requestType: form.requestType,
        date: form.date,
        shortHour: form.shortHour,
        comeLateDate: form.comeLateDate,
        comeLateHour: form.comeLateHour,
        tempLeaveStart: form.tempLeaveStart,
        tempLeaveEnd: form.tempLeaveEnd,
      };

      await api.post("/private/", payload);

      Swal.fire({
        icon: "success",
        title: "Izin Terkumpulkan",
        text: "Izin Anda telah diajukan.",
        timer: 1500,
        showConfirmButton: false,
      });

      setForm({
        title: "",
        requestType: "",
        division: "",
        date: "",
        shortHour: "",
        comeLateDate: "",
        comeLateHour: "",
        tempLeaveStart: "",
        tempLeaveEnd: "",
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Izin",
        text: "Coba lagi.",
      });
    }
  }

  return (
    <>
      <Navbar />

      <div className="form-container">
        <h2>Form Izin</h2>
        <h2>Meninggalkan Pekerjaan</h2>

        <form onSubmit={handleSubmit}>
          <p><b>Nama:</b> {userName}</p>

          <p><b>Divisi:</b><input
            name="division"
            value={division}
            onChange={handleChange}
            required
          /></p>

          <label>Mengajukan permohonan izin:</label>
          <select
            name="requestType"
            value={form.requestType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select --</option>
            <option value="time_off">Tidak masuk kerja</option>
            <option value="leave_early">Pulang lebih awal</option>
            <option value="come_late">Datang terlambat</option>
            <option value="temp_leave">Meninggalkan pekerjaan sementara</option>
          </select>

          {/* TIME OFF */}
          {form.requestType === "time_off" && (
            <>              
              <label>Tanggal:</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </>
          )}

          {/* LEAVE EARLY */}
          {form.requestType === "leave_early" && (
            <>
              <label>Jam:</label>
              <input
                type="time"
                name="shortHour"
                value={form.shortHour}
                onChange={handleChange}
              />
            </>
          )}

          {/* COME LATE */}
          {form.requestType === "come_late" && (
            <>
              <label>Tanggal:</label>
              <input
                type="date"
                name="comeLateDate"
                value={form.comeLateDate}
                onChange={handleChange}
              />

              <label>Jam:</label>
              <input
                type="time"
                name="comeLateHour"
                value={form.comeLateHour}
                onChange={handleChange}
              />
            </>
          )}

          {/* TEMP LEAVE */}
          {form.requestType === "temp_leave" && (
            <>
              <label>Tanggal:</label>
              <input
                type="date"
                name="tempLeaveStart"
                value={form.tempLeaveStart}
                onChange={handleChange}
              />
              <label>Sampai Tanggal:</label>
              <input
                type="date"
                name="tempLeaveEnd"
                value={form.tempLeaveEnd}
                onChange={handleChange}
              />
            </>
          )}
          {/* Alasan */}
          <label>Alasan:</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <button type="submit">Ajukan!</button>
        </form>
      </div>
    </>
  );
}
