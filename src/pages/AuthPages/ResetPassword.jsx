import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    if (token) {
      setResetToken(token);
    }
  }, [token]);

  return (
    <>
      <PageMeta
        title="Reset Password | CRM System"
        description="Set a new password for your CRM System account"
      />
      <AuthLayout>
        <ResetPasswordForm token={resetToken} />
      </AuthLayout>
    </>
  );
}