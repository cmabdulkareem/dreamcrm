import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="SignUp for Dream CRM | Take your first step to lead your business"
        description="Sign up for DreamCRM"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
