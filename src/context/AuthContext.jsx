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
        // Check if user has admin role or isAdmin flag is true
        const isAdminUser = user.isAdmin || (Array.isArray(role) && role.includes('Admin')) || (typeof role === 'string' && role === 'Admin');
        setIsAdmin(isAdminUser);
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
    // Check if user has admin role or isAdmin flag is true
    const isAdminUser = userData.isAdmin || (Array.isArray(role) && role.includes('Admin')) || (typeof role === 'string' && role === 'Admin');
    setIsAdmin(isAdminUser);
    setLoading(false);
  }

  function logout() {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, isAdmin, loading, setLoading, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
export { AuthContext };