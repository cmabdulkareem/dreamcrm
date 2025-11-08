import { AuthContext } from "../context/authContext";
import { Navigate } from "react-router";
import { useContext } from "react";

function ProtectedRoutes({ children, requireAdmin = false }) {
    const { isLoggedIn, isAdmin, loading } = useContext(AuthContext);

    if (loading) {
        return <h1>Loading...</h1>
    }

    // If not logged in, redirect to signin
    if (!isLoggedIn) {
        return <Navigate to="/signin" />;
    }

    // If admin is required and user is not admin, redirect to signin
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/signin" />;
    }

    return <>{children}</>;
}

export default ProtectedRoutes