// FrontEnd/src/pages/Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    console.log("🔐 LOGIN ATTEMPT");

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Firebase login
      const res = await signInWithEmailAndPassword(auth, trimmedEmail, pw);
      const token = await res.user.getIdToken();

      console.log("📤 TOKEN SENT TO BACKEND");

      // Verify with backend
      const meRes = await fetch("https://attendance-app-vwy8.onrender.com", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!meRes.ok) {
        console.error("❌ BACKEND REJECTED TOKEN", await meRes.text());
        throw new Error("Failed to fetch user role");
      }

      const me = await meRes.json();

      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome, ${me.name}!`,
        timer: 1600,
        showConfirmButton: false,
      });

      // Save session
      localStorage.setItem("token", token);
      localStorage.setItem("role", me.role);
      localStorage.setItem("name", me.name);

      // Redirect
      navigate(me.role === "admin" ? "/admin/all-requests" : "/home");

    } catch (err) {
      console.error("🔥 LOGIN ERROR:", err);

      let msg = "Invalid email or password.";

      // Firebase-specific errors
      if (err.code === "auth/user-not-found") msg = "User not found.";
      if (err.code === "auth/wrong-password") msg = "Incorrect password.";
      if (err.code === "auth/invalid-email") msg = "Invalid email format.";
      if (err.code === "auth/network-request-failed") msg = "Network error.";

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: msg,
      });

      setError(msg);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "320px", margin: "60px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>

      <form onSubmit={login}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{
            width: "100%",
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          required
          style={{
            width: "100%",
            marginBottom: "12px",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            background: loading ? "#ccc" : "#007bff",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      {error && (
        <p style={{ color: "red", marginTop: "10px", textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
