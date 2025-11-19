// FrontEnd/src/pages/PribadiRequest.js
import React, { useState } from "react";
import { api } from "../api/api";
import "../styles/form.css";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";

export default function PribadiRequest() {
  const userName = localStorage.getItem("name");

  const [form, setForm] = useState({
    title: "",
    requestType: "",
    dayLabel: "",
    date: "",
    shortHour: "",
    comeLateDate: "",
    comeLateHour: "",
    tempLeaveDay: "",
    tempLeaveDate: "",
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
        requestType: form.requestType,
        date: form.date,
        shortHour: form.shortHour,
        comeLateDate: form.comeLateDate,
        comeLateHour: form.comeLateHour,
        tempLeaveDay: form.tempLeaveDay,
        tempLeaveDate: form.tempLeaveDate,
      };

      await api.post("/private/", payload);

      Swal.fire({
        icon: "success",
        title: "Request Submitted",
        text: "Your private request has been submitted.",
        timer: 1500,
        showConfirmButton: false,
      });

      setForm({
        title: "",
        requestType: "",
        date: "",
        shortHour: "",
        comeLateDate: "",
        comeLateHour: "",
        tempLeaveDay: "",
        tempLeaveDate: "",
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
        <h2>Izin Pribadi</h2>

        <form onSubmit={handleSubmit}>
          <p><b>Name:</b> {userName}</p>

          <label>Title:</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Request Type:</label>
          <select
            name="requestType"
            value={form.requestType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select --</option>
            <option value="time_off">Tidak masuk kerja</option>
            <option value="leave_early">Pulang lebih awal</option>
            <option value="come_late">Telat</option>
            <option value="temp_leave">Meninggalkan pekerjaan sementara</option>
          </select>

          {/* TIME OFF */}
          {form.requestType === "time_off" && (
            <>
              <label>Day (e.g. Monday):</label>
              <input
                type="text"
                name="dayLabel"
                value={form.dayLabel}
                onChange={handleChange}
                placeholder="e.g. Monday"
                required
              />

              <label>Date:</label>
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
              <label>Leave Early Hour:</label>
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
              <label>Come Late Date:</label>
              <input
                type="date"
                name="comeLateDate"
                value={form.comeLateDate}
                onChange={handleChange}
              />

              <label>Come Late Hour:</label>
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
              <label>Temporary Leave Day Label:</label>
              <input
                type="text"
                name="tempLeaveDay"
                value={form.tempLeaveDay}
                onChange={handleChange}
              />

              <label>Temporary Leave Date:</label>
              <input
                type="date"
                name="tempLeaveDate"
                value={form.tempLeaveDate}
                onChange={handleChange}
              />
            </>
          )}

          <button type="submit">Submit</button>
        </form>
      </div>
    </>
  );
}
