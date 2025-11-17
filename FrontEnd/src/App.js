import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";

// STAFF PAGES
import DinasRequest from "./pages/DinasRequest";
import PribadiRequest from "./pages/PribadiRequest";
import MyRequest from "./pages/MyRequest";

// ADMIN PAGES
import AdminRequestList from "./pages/admin/AdminRequestList";

function App() {
  return (
    <Router>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<LandingPage />} />

        {/* STAFF ROUTES */}
        <Route path="/dinas-request" element={<DinasRequest />} />
        <Route path="/pribadi-request" element={<PribadiRequest />} />
        <Route path="/my-requests" element={<MyRequest />} />

        {/* ADMIN ROUTE (all requests) */}
        <Route path="/admin/all-requests" element={<AdminRequestList />} />

      </Routes>
    </Router>
  );
}

export default App;
