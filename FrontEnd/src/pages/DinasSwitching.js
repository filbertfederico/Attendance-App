// FrontEnd/src/pages/DinasSwitching.js
import React from "react";
import Navbar from "../components/Navbar";
import "../styles/switch.css";

export default function DinasSwitching() {
  return (
    <>
      <Navbar />

      <div className="switch-container">
        <h2>Pilih Jenis Dinas</h2>

        <div className="switch-grid">
          <a className="switch-btn" href="/dinas-dalam-kota-request">
            Dinas Dalam Kota
          </a>

          <a className="switch-btn" href="/dinas-luar-kota-request">
            Dinas Luar Kota
          </a>
        </div>
      </div>
    </>
  );
}
