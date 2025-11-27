import React, { useState } from "react";
import { api } from "../api/api";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";

export default function DinasLuarKotaRequest() {
  const userName = localStorage.getItem("name");

  const [form, setForm] = useState({
    name: userName,

    division: "",
    destination: "",
    purpose: "",
    needs: "",

    companions: "",
    companion_purpose: "",

    depart_date: "",
    return_date: "",

    transport_type: "",
    items_brought: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/dinasLuarkota/", form);

      Swal.fire({
        icon: "success",
        title: "Form Terkirim",
        text: "Pengajuan dinas luar kota berhasil diajukan.",
      });

      setForm({
        name: userName,
        division: "",
        destination: "",
        purpose: "",
        needs: "",
        companions: "",
        companion_purpose: "",
        depart_date: "",
        return_date: "",
        transport_type: "",
        items_brought: "",
      });

    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim",
        text: "Silakan coba lagi.",
      });
    }
  }

  return (
    <>
      <Navbar />

      <div className="form-container">
        <h2>SURAT PERINTAH PERJALANAN DINAS</h2>

        <form onSubmit={handleSubmit}>
          <p><b>Nama:</b> {userName}</p>

          <label>Departemen:</label>
          <input 
            name="division"
            value={form.division}
            onChange={handleChange}
            required
          />

          <label>Tujuan:</label>
          <input 
            name="destination"
            value={form.destination}
            onChange={handleChange}
            required
          />

          <label>Keperluan:</label>
          <input 
            name="needs"
            value={form.needs}
            onChange={handleChange}
            required
          />

          <label>Pengikut:</label>
          <input 
            name="companions"
            value={form.companions}
            onChange={handleChange}
            placeholder="Nama Pengikut (opsional)"
          />

          <label>Keperluan Pengikut:</label>
          <input 
            name="companion_purpose"
            value={form.companion_purpose}
            onChange={handleChange}
          />

          <label>Tanggal Berangkat:</label>
          <input 
            type="date"
            name="depart_date"
            value={form.depart_date}
            onChange={handleChange}
            required
          />

          <label>Tanggal Kembali:</label>
          <input 
            type="date"
            name="return_date"
            value={form.return_date}
            onChange={handleChange}
            required
          />

          <label>Jenis Angkutan:</label>
          <input 
            name="transport_type"
            value={form.transport_type}
            onChange={handleChange}
            required
          />

          <label>Barang yang Dibawa:</label>
          <input 
            name="items_brought"
            value={form.items_brought}
            onChange={handleChange}
          />

          <button type="submit">Ajukan</button>
        </form>
      </div>
    </>
  );
}
