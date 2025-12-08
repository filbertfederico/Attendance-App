// FrontEnd/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"
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
import AdminRequestList from "./pages/AdminRequestList";
import AdminDashboard from "./pages/AdminDashboard";

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
        <Route path="/cuti-request" element={<CutiRequest />}/>

        {/* DIV_HEAD */}
        <Route path="/div-head-approval" element={<ProtectedRoute role={"div_head"}><DivHeadApproval/></ProtectedRoute>} />

        {/* ADMIN ROUTE */}
        <Route path="/admin/all-requests" element={<ProtectedRoute role={"admin"}><AdminRequestList /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute role={"admin"}><AdminDashboard/></ProtectedRoute>} />

      </Routes>
    </Router>
  );
}

export default App;
