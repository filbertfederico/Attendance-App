// FrontEnd/pages/CutiRequest.js
import React, { useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import "../styles/cuti.css";

export default function CutiRequest() {
  const name = localStorage.getItem("name");
  const role = localStorage.getItem("role");
  const division = localStorage.getItem("division");

  const [form, setForm] = useState({
    cuti_type: "",
    date_start: "",
    date_end: "",
    duration: "",
    purpose: "",
    address: "",
    phone: "",
    notes: "",
    leave_days: "",
    leave_remaining: "",
  });

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit() {
    try {
      await api.post("/cuti", {
        ...form,
        name: name,
        division: division,
      });
      Swal.fire("Success", "Cuti submitted", "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.detail || "Failed", "error");
    }
  }

  return (
    <>
      <Navbar />
      <div className="cuti-container">

        <h2 className="cuti-title">PERMOHONAN CUTI</h2>

        {/* FORM START */}
        <form className="cuti-form">

          {/* NAME */}
          <div className="cuti-row">
            <label>Nama</label>
            <span>:</span>
            <input value={name} disabled className="cuti-input" />
          </div>

          {/* JABATAN */}
          <div className="cuti-row">
            <label>Jabatan</label>
            <span>:</span>
            <input value={role} disabled className="cuti-input" />
          </div>

          {/* DEPARTMENT */}
          <div className="cuti-row">
            <label>Department</label>
            <span>:</span>
            <input value={division} disabled className="cuti-input" />
          </div>

          {/* JENIS CUTI */}
          <div className="cuti-row">
            <label>Jenis Cuti</label>
            <span>:</span>

            <div className="cuti-type-box">
              <label className="cuti-type-option">
                <input
                  type="radio"
                  name="cuti_type"
                  value="yearly"
                  onChange={updateField}
                />
                <span className="cuti-option-box">T</span> Tahunan
              </label>

              <label className="cuti-type-option">
                <input
                  type="radio"
                  name="cuti_type"
                  value="pregnancy"
                  onChange={updateField}
                />
                <span className="cuti-option-box">H</span> Hamil
              </label>

              <label className="cuti-type-option">
                <input
                  type="radio"
                  name="cuti_type"
                  value="unpaid"
                  onChange={updateField}
                />
                <span className="cuti-option-box">U</span> Unpaid
              </label>
            </div>
          </div>

          {/* DATE RANGE */}
          <div className="cuti-row">
            <label>Tanggal</label>
            <span>:</span>

            <div className="cuti-date-range">
              <input
                type="date"
                name="date_start"
                onChange={updateField}
                className="cuti-input"
              />
              <span className="cuti-date-to">Sampai Dengan</span>
              <input
                type="date"
                name="date_end"
                onChange={updateField}
                className="cuti-input"
              />
            </div>
          </div>

          {/* DURATION */}
          <div className="cuti-row">
            <label>Selama</label>
            <span>:</span>

            <div className="cuti-duration-box">
              <input
                type="number"
                name="duration"
                onChange={updateField}
                className="cuti-input-small"
              />
              <span> Hari</span>
            </div>
          </div>

          {/* PURPOSE */}
          <div className="cuti-row textarea-row">
            <label>Untuk Keperluan</label>
            <span>:</span>
            <textarea
              name="purpose"
              onChange={updateField}
              className="cuti-textarea"
            ></textarea>
          </div>

          {/* ADDRESS */}
          <div className="cuti-row textarea-row">
            <label>Alamat selama cuti</label>
            <span>:</span>
            <textarea
              name="address"
              onChange={updateField}
              className="cuti-textarea"
            ></textarea>
          </div>

          {/* PHONE */}
          <div className="cuti-row">
            <label>No. Telp</label>
            <span>:</span>
            <input
              name="phone"
              onChange={updateField}
              className="cuti-input"
            />
          </div>

          {/* NOTES */}
          <div className="cuti-row textarea-row">
            <label>Catatan Personalia</label>
            <span>:</span>
            <textarea
              name="notes"
              onChange={updateField}
              className="cuti-textarea"
            ></textarea>
          </div>

          {/* LEAVE DAYS */}
          <div className="cuti-row">
            <label>Hak Cuti</label>
            <span>:</span>
            <div className="cuti-duration-box">
              <input
                type="number"
                name="leave_days"
                onChange={updateField}
                className="cuti-input-small"
              />
              <span> Hari</span>
            </div>
          </div>

          {/* REMAINING DAYS */}
          <div className="cuti-row">
            <label>Sisa Cuti</label>
            <span>:</span>
            <div className="cuti-duration-box">
              <input
                type="number"
                name="leave_remaining"
                onChange={updateField}
                className="cuti-input-small"
              />
              <span> Hari</span>
            </div>
          </div>

          <button className="cuti-submit-btn" onClick={submit}>
            Submit Cuti
          </button>
        </form>
      </div>
    </>
  );
}
