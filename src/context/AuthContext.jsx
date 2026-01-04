import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { updateBrandTheme, ALL_BRANDS_THEME_COLOR } from "../utils/brandColors";

const AuthContext = createContext();
import API from "../config/api";
import { hasRole, isManager, isOwner } from "../utils/roleHelpers";

function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(() => {
    // Initialize from localStorage or default to null
    const saved = localStorage.getItem("selectedBrand");
    const brand = saved ? JSON.parse(saved) : null;
    if (brand && brand.themeColor) {
      updateBrandTheme(brand.themeColor);
    } else {
      updateBrandTheme(ALL_BRANDS_THEME_COLOR);
    }
    return brand;
  });

  // Axios interceptor to add x-brand-id and Authorization headers
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      // Add Brand ID
      if (selectedBrand && (selectedBrand._id || selectedBrand.id)) {
        config.headers["x-brand-id"] = selectedBrand._id || selectedBrand.id;
        if (selectedBrand.themeColor) {
          updateBrandTheme(selectedBrand.themeColor);
        }
      } else {
        updateBrandTheme(ALL_BRANDS_THEME_COLOR);
      }


      // Add Authorization Token (Fallback for cookies)
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [selectedBrand]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API}/users/auth`, {
          withCredentials: true,
          // Add timeout to prevent hanging requests
          timeout: 10000
        });
        const { user, role } = res.data;
        setUser(user);
        setIsLoggedIn(true);
        // Check if user has admin role (Owner or Admin) or isAdmin flag is true
        const userRoles = user.roles || role || [];
        const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
        const isAdminUser = user.isAdmin ||
          rolesArray.includes('Owner');
        setIsAdmin(isAdminUser);

        // Auto-select brand for single-brand users if none selected
        if (!selectedBrand && user.brands && user.brands.length === 1) {
          const firstBrand = user.brands[0];
          // Use selectBrand to ensure indices/themes/reload are handled
          selectBrand(firstBrand);
        }


      } catch (err) {
        console.error("Auth check error:", err);
        // If it's a 403 error (account not approved), still set the user but not logged in
        if (err.response && err.response.status === 403) {
          // Account not approved yet
          setUser(null);
          setIsLoggedIn(false);
          setIsAdmin(false);
        } else {
          // Other errors (not authenticated)
          setUser(null);
          setIsLoggedIn(false);
          setIsAdmin(false);
          // Only clear token if we are sure auth failed (401)
          if (err.response && err.response.status === 401) {
            localStorage.removeItem("accessToken");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  function updateUser(userData) {
    setUser(userData);
  }

  function login(userData, role, token) {
    setUser(userData);
    setIsLoggedIn(true);

    // Save token to localStorage for fallback persistence
    if (token) {
      localStorage.setItem("accessToken", token);
    }

    // Check if user has admin role (Owner or Admin) or isAdmin flag is true
    const userRoles = userData.roles || role || [];
    const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
    const isAdminUser = userData.isAdmin ||
      rolesArray.includes('Owner') ||
      rolesArray.includes('Academic Coordinator');
    setIsAdmin(isAdminUser);

    // Auto-select brand for users with only one brand if none selected
    if (!selectedBrand && userData.brands && userData.brands.length === 1) {
      const firstBrand = userData.brands[0];
      // We must ensure the token is saved BEFORE selectBrand reloads the page
      selectBrand(firstBrand);
      return; // selectBrand will handle the reload
    }


    setLoading(false);
  }

  function logout() {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setSelectedBrand(null);
    localStorage.removeItem("selectedBrand");
    localStorage.removeItem("accessToken"); // Clear token
    setLoading(false);
  }

  function selectBrand(brand) {
    setSelectedBrand(brand);
    if (brand) {
      localStorage.setItem("selectedBrand", JSON.stringify(brand));
    } else {
      localStorage.removeItem("selectedBrand");
      updateBrandTheme(ALL_BRANDS_THEME_COLOR);
    }
    // Optional: reload page to refresh all data immediately
    window.location.reload();
  }

  // Mark tutorial as seen
  const markTutorialSeen = async () => {
    try {
      await axios.put(`${API}/users/tutorial-complete`, {}, {
        withCredentials: true
      });

      // Update local user state
      if (user) {
        setUser({
          ...user,
          hasSeenCounsellorTutorial: true
        });
      }
    } catch (error) {
      console.error("Error marking tutorial as seen:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        loading,
        setLoading,
        user,
        setUser,
        login,
        logout,
        updateUser,
        selectedBrand,
        selectBrand,
        markTutorialSeen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
export { AuthContext };
export function useAuth() {
  return useContext(AuthContext);
}