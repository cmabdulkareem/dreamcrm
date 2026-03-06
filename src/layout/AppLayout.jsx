import { Suspense } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import Footer from "../components/common/Footer";
import InstallPWA from "../components/common/InstallPWA";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ImmediateFollowupAlert from "../components/leadManagement/ImmediateFollowupAlert";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const location = useLocation();
  const isHR = location.pathname.startsWith("/hr");

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white/90">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className={`flex-1 p-4 md:p-6 pb-20 md:pb-24 w-full max-w-full ${isHR ? "ems-theme" : ""}`}>
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </div>
        <Footer />
      </div>
      <InstallPWA />
      <ImmediateFollowupAlert />
      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
