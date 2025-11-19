// FrontEnd/src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// STAFF PAGES
import DinasRequest from "./pages/DinasRequest";
import PribadiRequest from "./pages/PribadiRequest";
import MyRequest from "./pages/MyRequest";

// ADMIN PAGES
import AdminRequestList from "./pages/admin/AdminRequest";

function App() {
  return (
    <Router>
      <Routes>
        {/* login */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* HOME */}
        <Route path="/home" element={<Dashboard />} />

        {/* STAFF ROUTES */}
        <Route path="/dinas-request" element={<DinasRequest />} />
        <Route path="/pribadi-request" element={<PribadiRequest />} />
        <Route path="/my-requests" element={<MyRequest />} />

        {/* ADMIN ROUTE */}
        <Route path="/admin/all-requests" element={<AdminRequestList />} />

      </Routes>
    </Router>
  );
}

export default App;
