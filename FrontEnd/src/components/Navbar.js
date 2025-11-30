import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");
  const division = localStorage.getItem("division");

  const isDivHead = [
    "DIV_HEAD_FINANCE",
    "DIV_HEAD_HRD",
    "DIV_HEAD_HSE",
    "DIV_HEAD_OPS",
    "DIV_HEAD_MARKETING",
  ].includes(division);

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);

    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left" onClick={() => navigate("/dashboard")}>
        <h2 className="nav-logo">IMS</h2>
        <h3>{role}</h3>
      </div>

      <div className="nav-links">

        {/* STAFF */}
        {role === "staff" && !isDivHead && (
          <>
            <a onClick={() => navigate("/home")}>Home</a>
            <a onClick={() => navigate("/switching")}>Dinas</a>
            <a onClick={() => navigate("/pribadi-request")}>Izin</a>
            <a onClick={() => navigate("/my-requests")}>Semua Form</a>
          </>
        )}

        {/* DIVISION HEAD */}
        {isDivHead && (
          <>
            <a onClick={() => navigate("/home")}>Home</a>
            <a onClick={() => navigate("/switching")}>Dinas</a>
            <a onClick={() => navigate("/pribadi-request")}>Izin</a>
            <a onClick={() => navigate("/div-head-approval")}>Form Staff</a>
            <a onClick={() => navigate("/my-requests")}>Semua Form</a>
          </>
        )}

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <a onClick={() => navigate("/dashboard")}>Home</a>
            <a onClick={() => navigate("/admin/all-requests")}>Semua Requests</a>
          </>
        )}

        {/* USER + LOGOUT */}
        <span className="nav-user">{name}</span>
        <button className="nav-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
