// src/pages/DinasRequest.js
import React, { useState } from "react";
import { postData } from "../api/api";
import "../styles/form.css";

export default function DinasRequest() {
  const [form, setForm] = useState({
    name: "",
    division: "",
    purpose: "",
    timeStart: "",
    timeEnd: "",
    status: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitting data:", form);

    const res = await postData("/dinas", form);
    console.log("Backend response:", res);

    alert("Dinas request submitted!");
  }

  return (
    <div className="form-container">
      <h2>Dinas Permission Request</h2>

      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input name="name" value={form.name} onChange={handleChange} required />

        <label>Division:</label>
        <input name="division" value={form.division} onChange={handleChange} required />

        <label>Purpose:</label>
        <input name="purpose" value={form.purpose} onChange={handleChange} required />

        <label>Start Time:</label>
        <input type="datetime-local" name="timeStart" value={form.timeStart} onChange={handleChange} required />

        <label>End Time:</label>
        <input type="datetime-local" name="timeEnd" value={form.timeEnd} onChange={handleChange} required />

        <label>Status:</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="return">Return</option>
          <option value="not return">Not Return</option>
        </select>

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
