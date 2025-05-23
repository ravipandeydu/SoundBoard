import AuthPage from "@/components/auth/auth-page";
import { Suspense } from "react";

export const metadata = { title: "Log in – SoundBoard" };

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading login form…</p>}>
      <AuthPage variant="login" />
    </Suspense>
  );
}
