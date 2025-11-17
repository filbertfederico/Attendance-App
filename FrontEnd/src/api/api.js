// src/api/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------
// POST (used by staff forms)
// -----------------------
export async function postData(endpoint, data, role = "staff") {
  const res = await api.post(endpoint, data, {
    headers: {
      "Content-Type": "application/json",
      "x-role": role
    },
  });
  return res.data;
}

// -----------------------
// GET (staff or admin)
// -----------------------
export async function getData(endpoint, role = "staff") {
  const res = await api.get(endpoint, {
    headers: { "x-role": role },
  });
  return res.data;
}

// -----------------------
// PUT (admin approve/deny)
// -----------------------
export async function putData(endpoint, role = "admin") {
  const res = await api.put(
    endpoint,
    {},
    {
      headers: { "x-role": role },
    }
  );
  return res.data;
}
