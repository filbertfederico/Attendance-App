// FrontEnd/src/pages/DivHeadApproval.js
import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import "../styles/request.css";
import Swal from "sweetalert2";

export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // LOAD ALL REQUEST TYPES
  // -----------------------------
  async function load() {
    try {
      const [privateRes, dalamRes, luarRes] = await Promise.all([
        api.get("/private/by-division"),
        api.get("/dinasDalamKota/by-division"),
        api.get("/dinasLuarKota/by-division")
      ]);

      const list = [
        ...privateRes.data.map((r) => ({ ...r, _type: "private" })),
        ...dalamRes.data.map((r) => ({ ...r, _type: "dinasDalamKota" })),
        ...luarRes.data.map((r) => ({ ...r, _type: "dinasLuarKota" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(list);
    } catch (err) {
      console.error("Failed to load approvals", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -----------------------------
  // APPROVE / DENY HANDLER
  // -----------------------------
  async function doAction(item, action) {
    try {
      const type = item._type;

      const url =
        type === "private"
          ? `/private/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`
          : type === "dinasDalamKota"
          ? `/dinasDalamKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`
          : `/dinasLuarKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;

      const res = await api.put(url);

      Swal.fire({
        icon: "success",
        title: action === "approve" ? "Approved" : "Denied",
        text: res.data?.message || "",
        timer: 1500,
        showConfirmButton: false,
      });

      load();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: err.response?.data?.detail || "Try again",
      });
    }
  }

  if (loading) return <h2>Loading approvals...</h2>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Division Head Approvals</h2>

        {requests.length === 0 && <p>No pending requests for your division.</p>}

        <div className="card-list">
          {requests.map((r) => (
            <div className="card" key={`${r._type}-${r.id}`}>
              <h3>
                {r._type === "private"
                  ? "Private Request"
                  : r._type === "dinasDalamKota"
                  ? "Dinas Dalam Kota"
                  : "Dinas Luar Kota"}
              </h3>

              <p><b>Name:</b> {r.name}</p>
              <p><b>Division:</b> {r.division || r.department}</p>

              {r._type === "private" && <p><b>Reason:</b> {r.title}</p>}
              {r._type !== "private" && <p><b>Purpose:</b> {r.purpose}</p>}
              {r._type === "dinasLuarKota" && <p><b>Destination:</b> {r.destination}</p>}

              <p><b>Submitted:</b> {new Date(r.created_at).toLocaleString()}</p>

              <div style={{ marginTop: 8 }}>
                <button className="approve-btn" onClick={() => doAction(r, "approve")}>Approve</button>
                <button className="deny-btn" onClick={() => doAction(r, "deny")} style={{ marginLeft: 8 }}>
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
