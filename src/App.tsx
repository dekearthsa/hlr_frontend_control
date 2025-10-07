import { useState } from "react";
import { motion } from "framer-motion";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import SideBar from "./components/SideBar";
import { ChevronLeft, ChevronRight } from "lucide-react";
const SIDEBAR_WIDTH = 460;

function App() {
  const [open, setOpen] = useState(true);

  return (
    <div className="font-mono w-full bg-black">
      <BrowserRouter>
        {/* Sidebar (fixed + slide in/out) */}
        <div>
          <motion.aside
            className="fixed left-0 top-0 z-50 h-screen bg-white/0" // bg ตามต้องการ
            initial={false}
            animate={{ x: open ? 0 : -SIDEBAR_WIDTH }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="h-full shadow-lg">
              <SideBar />
            </div>
          </motion.aside>
          <button
            onClick={() => setOpen((v) => !v)}
            className="fixed  left-0 top-0 z-50  transform mt-5 ml-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition"
            aria-label="toggle sidebar"
          >
            {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
