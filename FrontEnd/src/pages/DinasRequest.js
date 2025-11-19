// FrontEnd/src/pages/DinasRequest.js
import React, { useState } from "react";
import { api } from "../api/api";
import "../styles/form.css";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";

export default function DinasRequest() {
  const userName = localStorage.getItem("name");

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
    console.log("Submitting data:", form);

    try {
      const payload = {
        name: userName,
        division: form.division,
        purpose: form.purpose,
        timeStart: form.timeStart,
        timeEnd: form.timeEnd,
        status: form.status,
      };

      await api.post("/dinas/", payload);

      Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "Your dinas permission request has been sent.",
        timer: 1500,
        showConfirmButton: false,
      });

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
        title: "Submission Failed",
        text: "Please try again.",
      });
    }
  }

  return (
    <>
      <Navbar />
      <div className="form-container">
        <h2>Request Izin Dinas</h2>

        <form onSubmit={handleSubmit}>
          <p><b>Name:</b> {userName}</p>

          <label>Divisi:</label>
          <input
            name="division"
            value={form.division}
            onChange={handleChange}
            required
          />

          <label>Tujuan:</label>
          <input
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            required
          />

          <label>Jam Mulai:</label>
          <input
            type="datetime-local"
            name="timeStart"
            value={form.timeStart}
            onChange={handleChange}
            required
          />

          <label>Jam Selesai:</label>
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
            <option value="not return">Tidak Kembali ke Kantor</option>
          </select>

          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}
