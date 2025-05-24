"use client";

import Link from "next/link";

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <div className="w-full max-w-md p-8">
        <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-8">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">
              Almost There!
            </h1>

            <div className="space-y-4 text-zinc-300">
              <p>We&apos;ve sent a verification email to your inbox.</p>

              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                <p>✨ Click the link in the email to verify your account</p>
                <p>⏰ The link will expire in 24 hours</p>
                <p>
                  📧 If you don&apos;t see the email, check your spam folder
                </p>
              </div>

              <p>Once verified, you&apos;ll be able to start creating music!</p>
            </div>

            <Link
              href="/login"
              className="inline-block mt-6 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Return to Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
