// src/pages/MyPribadiRequests.js
import React, { useEffect, useState } from "react";
import { getData } from "../api/api";
import "../styles/request.css";

export default function MyPribadiRequests() {
  const [requests, setRequests] = useState([]);

  // TODO: replace with real login
  const userName = "John Doe";

  async function load() {
    const data = await getData(`/private/my?name=${userName}`, "staff");
    setRequests(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page-container">
      <h2>My Private Requests</h2>

      <div className="card-list">
        {requests.map((req) => (
          <div className="card" key={req.id}>
            <h3>{req.name}</h3>
            <p><strong>Title:</strong> {req.title}</p>
            <p><strong>Type:</strong> {req.request_type}</p>

            {req.date && <p><strong>Date Off:</strong> {req.date}</p>}
            {req.short_hour && <p><strong>Short Hour:</strong> {req.short_hour}</p>}
            {req.come_late_date && (
              <p><strong>Come Late:</strong> {req.come_late_date} at {req.come_late_hour}</p>
            )}

            <p><strong>Status:</strong> {req.approval_status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
