import { useSelector } from "react-redux";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileSidebar from "./MobileSidebar";

const Layout = () => {
  const { user } = useSelector((state) => state.auth);

  const location = useLocation();

  // Temporarily allow access for testing - remove this later
  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="w-full md:w-1/5 h-screen bg-white sticky top-0 md:block hidden">
        <Sidebar />
      </div>

      {/* Mobile Sidebar - overlay */}
      <MobileSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="overflow-visible relative">
          <Navbar />
        </div>

        <div className="p-4 2xl:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
