// FrontEnd/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// STAFF PAGES
import DinasDalamKotaRequest from "./pages/DinasDalamKotaRequest";
import DinasLuarKotaRequest from "./pages/DinasLuarKotaRequest";
import DinasSwitching from "./pages/DinasSwitching";
import PribadiRequest from "./pages/PribadiRequest";
import MyRequest from "./pages/MyRequest";
import DivHeadApproval from "./pages/DivHeadApproval";
import CutiRequest from "./pages/CutiRequest";

// ADMIN PAGES
import AdminRequest from "./pages/admin/AdminRequest";
import AdminDashboard from "./pages/admin/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* HOME */}
        <Route path="/home" element={<Dashboard />} />

        {/* STAFF ROUTES (no restriction needed, login required only) */}
        <Route path="/dinas-dalam-kota-request" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <DinasDalamKotaRequest />
          </ProtectedRoute>
        }/>

        <Route path="/dinas-luar-kota-request" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <DinasLuarKotaRequest />
          </ProtectedRoute>
        }/>

        <Route path="/pribadi-request" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <PribadiRequest />
          </ProtectedRoute>
        }/>

        <Route path="/my-requests" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <MyRequest />
          </ProtectedRoute>
        }/>

        <Route path="/switching" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <DinasSwitching />
          </ProtectedRoute>
        }/>

        <Route path="/cuti-request" element={
          <ProtectedRoute allowedRoles={["staff", "div_head", "admin"]}>
            <CutiRequest />
          </ProtectedRoute>
        }/>

        {/* DIV HEAD ROUTE */}
        <Route path="/div-head-approval"
          element={
            <ProtectedRoute allowedRoles={["div_head"]}>
                <DivHeadApproval />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route path="/admin/all-requests" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminRequest />
          </ProtectedRoute>
        }/>

        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }/>

      </Routes>
    </Router>
  );
}

export default App;
