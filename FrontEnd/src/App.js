import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DinasRequest from "./pages/DinasRequest";
import PribaadiRequest from "./pages/PribadiRequest";
import LandingPage from "./pages/LandingPage";
import MyDinasRequests from "./pages/myDinasRequests";
import MyPribadiRequests from "./pages/myPribadiRequests";
import RequestList from "./pages/adminRequestList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dinas-request" element={<DinasRequest />} />
        <Route path="/pribadi-request" element={<PribaadiRequest />} />
        <Route path="/my-dinas" element={<MyDinasRequests />} />
        <Route path="/my-private" element={<MyPribadiRequests />} />
        <Route path="/all-requests" element={<RequestList />} />
      </Routes>
    </Router>
  );
}

export default App;
