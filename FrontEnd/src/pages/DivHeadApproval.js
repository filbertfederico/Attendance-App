// FrontEnd/src/pages/DivHeadApproval.js
import React, { useEffect, useState } from "react";
import { api } from "../api/api";
import Navbar from "../components/Navbar";
import "../styles/request.css";
import Swal from "sweetalert2";

export default function DivHeadApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const division = localStorage.getItem("division");

  async function load() {
    try {
      // fetch pending for this division (backend will filter by current user)
      const privateRes = await api.get("/private/by-division");
      const dalamRes = await api.get("/dinasDalamKota/by-division");
      const luarRes = await api.get("/dinasLuarkota/by-division");

      // Normalize results with a type tag
      const list = [
        privateRes.data.map((r) => ({ ...r, _type: "private" })),
        dalamRes.data.map((r) => ({ ...r, _type: "dinasDalamKota" })),
        luarRes.data.map((r) => ({ ...r, _type: "dinasLuarkota" })),
      ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

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

  async function doAction(item, action) {
    // action: approve / deny
    try {
      let url = "";
      // map action & type to endpoints
      if (item._type === "private") {
        url = `/private/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      } else if (item._type === "dinasDalamKota") {
        url = `/dinasDalamKota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
      } else if (item._type === "dinasLuarkota") {
        url = `/dinasLuarkota/${item.id}/${action === "approve" ? "div-head-approve" : "div-head-deny"}`;
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
              <h3>{r._type === "private" ? "Private" : r._type === "dinasDalamKota" ? "Dinas Dalam Kota" : "Dinas Luar Kota"} Request</h3>
              <p><b>Name:</b> {r.name}</p>
              <p><b>Division/Department:</b> {r.division || r.department}</p>
              {r._type === "private" && <p><b>Reason:</b> {r.title}</p>}
              {r._type === "dinasDalamKota" && <p><b>Purpose:</b> {r.purpose}</p>}
              {r._type === "dinasLuarkota" && (
                <>
                  <p><b>Destination:</b> {r.destination}</p>
                  <p><b>Purpose:</b> {r.purpose}</p>
                </>
              )}
              <p><b>Submitted:</b> {r.created_at}</p>

              <div style={{ marginTop: 8 }}>
                <button className="approve-btn" onClick={() => doAction(r, "approve")}>Approve</button>
                <button className="deny-btn" onClick={() => doAction(r, "deny")} style={{ marginLeft: 8 }}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
