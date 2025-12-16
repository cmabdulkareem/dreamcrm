import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Navigate } from "react-router-dom";
import { useContext } from "react";

function ProtectedRoutes({ children, requireAdmin = false }) {
    const { isLoggedIn, isAdmin, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        );
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