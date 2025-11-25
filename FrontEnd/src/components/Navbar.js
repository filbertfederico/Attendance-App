import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const name = localStorage.getItem("name");

  const logout = async () => {
    const auth = getAuth();
    await signOut(auth);

    localStorage.removeItem("firebaseToken");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");

    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left" onClick={() => navigate("/dashboard")}>
        <h2 className="nav-logo">IMS</h2>
      </div>

      <div className="nav-links">

        {/* STAFF LINKS */}
        {role === "staff" && (
          <>
            <a onClick={() => navigate("/home")}>Home</a>
            <a onClick={() => navigate("/switching")}>Dinas</a>
            <a onClick={() => navigate("/pribadi-request")}>Izin</a>
            <a onClick={() => navigate("/my-requests")}>Semua Form</a>
          </>
        )}

        {/* ADMIN LINKS */}
        {role === "admin" && (
          <>
            <a onClick={() => navigate("/dashboard")}>Home</a>
            <a onClick={() => navigate("/admin/all-requests")}>Semua Requests</a>
          </>
        )}

        {/* RIGHT SIDE: USER + LOGOUT */}
        <span className="nav-user">{name}</span>
        <button className="nav-logout" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
} 

