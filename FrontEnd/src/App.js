// FrontEnd/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// STAFF PAGES
import DinasDalamKotaRequest from "./pages/DinasDalamKotaRequest";
import DinasLuarKotaRequest from "./pages/DinasLuarKotaRequest";
import DinasSwitching from "./pages/DinasSwitching";
import PribadiRequest from "./pages/PribadiRequest";
import MyRequest from "./pages/MyRequest";

// ADMIN PAGES
import AdminRequestList from "./pages/admin/AdminRequest";
import AdminDashboard from "./pages/admin/AdminDashboard"

function App() {
  return (
    <Router>
      <Routes>
        {/* login */}
        <Route path="/" element={<Login />} />

        {/* HOME */}
        <Route path="/home" element={<Dashboard />} />

        {/* STAFF ROUTES */}
        <Route path="/dinas-dalam-kota-request" element={<DinasDalamKotaRequest />} />
        <Route path="/dinas-luar-kota-request" element={<DinasLuarKotaRequest />} />        
        <Route path="/pribadi-request" element={<PribadiRequest />} />
        <Route path="/my-requests" element={<MyRequest />} />
        <Route path="/switching" element={<DinasSwitching />} />

        {/* ADMIN ROUTE */}
        <Route path="/admin/all-requests" element={<AdminRequestList />} />
        <Route path="/admin/dashboard" element={<AdminDashboard/>} />

      </Routes>
    </Router>
  );
}

export default App;
