"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";

export default function SignupSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />

          <div className="relative p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-indigo-400" />
              </div>

              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
                  Check Your Email
                </h1>
                <p className="text-zinc-300">
                  We've sent a verification link to:
                </p>
                <p className="text-lg font-medium text-indigo-400">{email}</p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300 space-y-3">
                <p>
                  ✨ Click the verification link in your email to activate your
                  account.
                </p>
                <p>⏰ The link will expire in 24 hours.</p>
                <p>📧 If you don't see the email, check your spam folder.</p>
              </div>

              <div className="text-center space-y-4">
                <p className="text-zinc-400 text-sm">
                  Already verified your email?
                </p>
                <Link
                  href="/login"
                  className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
