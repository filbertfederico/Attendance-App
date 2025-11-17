// src/pages/MyDinasRequests.js
import React, { useEffect, useState } from "react";
import { getData } from "../api/api";
import "../styles/request.css";

export default function MyDinasRequests() {
  const [requests, setRequests] = useState([]);

  // TODO: replace with real logged in user
  const userName = "John Doe";

  async function load() {
    const data = await getData(`/dinas/my?name=${userName}`, "staff");
    setRequests(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container">
      <h2>My Dinas Requests</h2>

      <div className="card-list">
        {requests.map((req) => (
          <div className="card" key={req.id}>
            <h3>{req.name}</h3>
            <p><strong>Division:</strong> {req.division}</p>
            <p><strong>Purpose:</strong> {req.purpose}</p>
            <p><strong>Start:</strong> {req.time_start}</p>
            <p><strong>End:</strong> {req.time_end}</p>
            <p><strong>Status:</strong> {req.approval_status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
