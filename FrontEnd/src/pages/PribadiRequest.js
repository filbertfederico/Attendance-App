// src/pages/PribadiRequest.js
import React, { useState } from "react";
import { postData } from "../api/api";
import "../styles/form.css";

export default function PribadiRequest() {
  const [form, setForm] = useState({
    name: "",
    title: "",
    requestType: "time_off",
    date: "",
    shortHour: "",
    comeLateDate: "",
    comeLateHour: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await postData("/private", form);
    alert("Private request submitted!");
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
          <option value="leave_early">Leave Early (short hour)</option>
          <option value="come_late">Come Late (date & hour)</option>
        </select>

        {form.requestType === "time_off" && (
          <>
            <label>Date:</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required />
          </>
        )}

        {form.requestType === "leave_early" && (
          <>
            <label>Short Hour:</label>
            <input type="time" name="shortHour" value={form.shortHour} onChange={handleChange} required />
          </>
        )}

        {form.requestType === "come_late" && (
          <>
            <label>Day & Date:</label>
            <input type="date" name="comeLateDate" value={form.comeLateDate} onChange={handleChange} required />

            <label>Hour:</label>
            <input type="time" name="comeLateHour" value={form.comeLateHour} onChange={handleChange} required />
          </>
        )}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
