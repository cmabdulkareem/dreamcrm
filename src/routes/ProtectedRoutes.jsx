import { AuthContext } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { isManager, isAccountant } from "../utils/roleHelpers";

function ProtectedRoutes({ children, requireAdmin = false, requireManager = false, requireAccountant = false, redirectTo = "/signin" }) {
    const { isLoggedIn, isAdmin, loading, user } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // If not logged in, redirect to signin
    if (!isLoggedIn) {
        return <Navigate to={redirectTo} />;
    }

    // If admin is required and user is not admin, redirect to signin
    if (requireAdmin && !isAdmin) {
        return <Navigate to="/signin" />;
    }

    // If manager is required and user is not manager, redirect to signin
    if (requireManager && !isManager(user)) {
        return <Navigate to="/signin" />;
    }

    // If accountant is required
    if (requireAccountant && !isAccountant(user)) {
        return <Navigate to="/signin" />;
    }

    return <>{children}</>;
}

export default ProtectedRoutes