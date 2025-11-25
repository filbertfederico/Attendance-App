// FrontEnd\src\components\ProtectedRoute.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// STAFF PAGES
import DinasRequest from "./pages/DinasRequest";
import PribadiRequest from "./pages/PribadiRequest";
import MyRequest from "./pages/MyRequest";

// ADMIN PAGES
import AdminRequestList from "./pages/admin/AdminRequest";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Login />} />

        {/* STAFF + ADMIN */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* STAFF ONLY */}
        <Route
          path="/dinas-request"
          element={
            <ProtectedRoute role="staff">
              <DinasRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pribadi-request"
          element={
            <ProtectedRoute role="staff">
              <PribadiRequest />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-requests"
          element={
            <ProtectedRoute role="staff">
              <MyRequest />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ONLY */}
        <Route
          path="/admin/all-requests"
          element={
            <ProtectedRoute role="admin">
              <AdminRequestList />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized Page */}
        <Route path="*" element={<h1>Unauthorized</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
