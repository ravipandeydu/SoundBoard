import SignupForm from "@/components/auth/signup-form";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="text-center py-20">Loading…</p>}>
      <SignupForm />
    </Suspense>
  );
}
