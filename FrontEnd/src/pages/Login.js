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

  const login = async (e) => {
    e.preventDefault();
    console.log("LOGIN CLICKED!");
    setError("");

    try {
      // Firebase login
      const res = await signInWithEmailAndPassword(auth, email, pw);

      // Get Firebase token
      const token = await res.user.getIdToken();

      // FastAPI verify token
      const meRes = await fetch("http://127.0.0.1:8000/auth/me", {
        
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      console.log("TOKEN SENT:", token);

      if (!meRes.ok) throw new Error("Failed to fetch user role");

      const me = await meRes.json();

      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: `Welcome, ${me.name}!`,
        timer: 1500,
        showConfirmButton: false
      });

      // Save
      localStorage.setItem("token", token);
      localStorage.setItem("role", me.role);
      localStorage.setItem("name", me.name);

      // Redirect based on role
      if (me.role === "admin") {
        navigate("/admin/all-requests");
      } else {
        navigate("/home");
      }

    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div style={{ maxWidth: "320px", margin: "60px auto" }}>
      <h2>Login</h2>

      <form onSubmit={login}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          style={{ width: "100%", marginBottom: "12px" }}
        />

        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          required
          style={{ width: "100%", marginBottom: "12px" }}
        />

        <button type="submit" style={{ width: "100%" }}>
          Login
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
