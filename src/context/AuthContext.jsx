import { createContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();
const BACKEND_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL_PRODUCTION || "https://dreamcrm.onrender.com/api"
  : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(() => {
    // Initialize from localStorage or default to null
    const saved = localStorage.getItem("selectedBrand");
    return saved ? JSON.parse(saved) : null;
  });

  // Axios interceptor to add x-brand-id header
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      if (selectedBrand && selectedBrand._id) {
        config.headers["x-brand-id"] = selectedBrand._id;
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
        const res = await axios.get(`${BACKEND_URL}/users/auth`, {
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
          rolesArray.includes('Owner') ||
          rolesArray.includes('Admin');
        setIsAdmin(isAdminUser);

        // If no brand selected, and user has brands, select the first one (or 'all' for admin)
        if (!selectedBrand && user.brands && user.brands.length > 0) {
          // Optional: default logic here if needed
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

  function login(userData, role) {
    setUser(userData);
    setIsLoggedIn(true);
    // Check if user has admin role (Owner or Admin) or isAdmin flag is true
    const userRoles = userData.roles || role || [];
    const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
    const isAdminUser = userData.isAdmin ||
      rolesArray.includes('Owner') ||
      rolesArray.includes('Admin');
    setIsAdmin(isAdminUser);
    setLoading(false);
  }

  function logout() {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setSelectedBrand(null);
    localStorage.removeItem("selectedBrand");
    setLoading(false);
  }

  function selectBrand(brand) {
    setSelectedBrand(brand);
    if (brand) {
      localStorage.setItem("selectedBrand", JSON.stringify(brand));
    } else {
      localStorage.removeItem("selectedBrand");
    }
    // Optional: reload page to refresh all data immediately
    window.location.reload();
  }

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
        selectBrand
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
export { AuthContext };