import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import "../styles/request.css";
import Swal from "sweetalert2";

export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const privateRes = await api.get("/private/by-division");
      const dalamRes = await api.get("/dinasDalamKota/by-division");
      const luarRes = await api.get("/dinasLuarKota/by-division");

      const list = [
        ...privateRes.data.map((r) => ({ ...r, _type: "private" })),
        ...dalamRes.data.map((r) => ({ ...r, _type: "dinasDalamKota" })),
        ...luarRes.data.map((r) => ({ ...r, _type: "dinasLuarKota" })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setRequests(list);
    } catch (err) {
      console.error("Failed to load:", err);
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
      let url = "";

      if (item._type === "private") {
        url = `/private/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      } else if (item._type === "dinasDalamKota") {
        url = `/dinasDalamKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      } else if (item._type === "dinasLuarKota") {
        url = `/dinasLuarKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      }

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
      Swal.fire({
        icon: "error",
        title: "Action Failed",
        text: err.response?.data?.detail || "Try again",
      });
    }
  }

  if (loading) return <h2>Loading...</h2>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h2>Division Head Approvals</h2>

        {requests.length === 0 && <p>No pending requests.</p>}

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
              {r._type === "dinasDalamKota" && <p><b>Purpose:</b> {r.purpose}</p>}
              {r._type === "dinasLuarKota" && (
                <>
                  <p><b>Destination:</b> {r.destination}</p>
                  <p><b>Purpose:</b> {r.purpose}</p>
                </>
              )}

              <p><b>Status:</b> {r.approval_status}</p>

              <div style={{ marginTop: 10 }}>
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
