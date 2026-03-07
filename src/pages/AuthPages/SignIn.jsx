import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | CDC International"
        description="Sign in to your CDC International account"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
