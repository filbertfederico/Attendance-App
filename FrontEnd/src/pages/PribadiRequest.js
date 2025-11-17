// src/pages/PribadiRequest.js
import React, { useState } from "react";
import { postData } from "../api/api";
import "../styles/form.css";

export default function PribadiRequest() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    requestType: "time_off",

    // TIME OFF
    dayLabel: "",
    date: "",

    // LEAVE EARLY
    shortHour: "",

    // COME LATE
    comeLateDay: "",
    comeLateDate: "",
    comeLateHour: "",

    // TEMP LEAVE
    tempLeaveDay: "",
    tempLeaveDate: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitting data:", form);

    await postData("/private", form);
    alert("Private Request submitted!");
  }

  return (
    <div className="form-container">
      <h2>Private Permission Request</h2>

      <form onSubmit={handleSubmit}>

        <label>Name:</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Job Title:</label>
        <input name="title" value={form.title} onChange={handleChange} required />

        <label>Request Type:</label>
        <select name="requestType" value={form.requestType} onChange={handleChange}>
          <option value="time_off">Requesting Time Off (day & date)</option>
          <option value="temp_leave">Leaving Job Temporarily</option>
          <option value="leave_early">Leave Early (hour only)</option>
          <option value="come_late">Come Late (day, date, hour)</option>
        </select>

        {/* ------------------ TIME OFF ------------------ */}
        {form.requestType === "time_off" && (
          <>
            <label>Day:</label>
            <input
              type="text"
              name="dayLabel"
              placeholder="e.g. Monday"
              value={form.dayLabel}
              onChange={handleChange}
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

        {/* ------------------ TEMP LEAVE ------------------ */}
        {form.requestType === "temp_leave" && (
          <>
            <label>Day:</label>
            <input
              type="text"
              name="tempLeaveDay"
              value={form.tempLeaveDay}
              onChange={handleChange}
              required
            />

            <label>Date:</label>
            <input
              type="date"
              name="tempLeaveDate"
              value={form.tempLeaveDate}
              onChange={handleChange}
              required
            />
          </>
        )}

        {/* ------------------ LEAVE EARLY ------------------ */}
        {form.requestType === "leave_early" && (
          <>
            <label>Hour:</label>
            <input
              type="time"
              name="shortHour"
              value={form.shortHour}
              onChange={handleChange}
              required
            />
          </>
        )}

        {/* ------------------ COME LATE ------------------ */}
        {form.requestType === "come_late" && (
          <>
            <label>Day:</label>
            <input
              type="text"
              name="comeLateDay"
              value={form.comeLateDay}
              onChange={handleChange}
              required
            />

            <label>Date:</label>
            <input
              type="date"
              name="comeLateDate"
              value={form.comeLateDate}
              onChange={handleChange}
              required
            />

            <label>Hour:</label>
            <input
              type="time"
              name="comeLateHour"
              value={form.comeLateHour}
              onChange={handleChange}
              required
            />
          </>
        )}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
