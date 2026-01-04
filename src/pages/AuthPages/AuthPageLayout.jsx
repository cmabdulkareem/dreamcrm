import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({ children }) {
  return (
    <div className="relative bg-gray-900 z-1 min-h-screen overflow-x-hidden">
      <div className="relative z-10 flex flex-col w-full min-h-screen lg:flex-row">
        <div className="flex flex-col flex-1 bg-white dark:bg-gray-900">
          {children}
        </div>
        <div className="relative hidden lg:flex flex-1 items-center justify-center bg-gray-900 dark:bg-white/5">
          <div className="relative w-full flex items-center justify-center z-1">
            {/* ===== Common Grid Shape Start ===== */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Link to="/" className="block mb-4">
                <img
                  width={231}
                  height={48}
                  src="/images/logo/auth-logo.svg"
                  alt="Logo"
                />
              </Link>
              <p className="text-center text-gray-400 dark:text-white/60">
                "Turning Enquiries into Opportunities, One Lead at a Time."
              </p>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
