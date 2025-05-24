"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ▸ minimal schema
const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function AuthPage({ variant }: { variant: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // pick callbackUrl from ?callbackUrl=... or default
  const callbackUrl = searchParams.get("callbackUrl") || "/rooms";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const authRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (authRes?.error) {
        setError(
          authRes.error === "CredentialsSignin"
            ? "Invalid email or password"
            : authRes.error
        );
      } else if (authRes?.url) {
        // Prefetch the next page before navigation
        await router.prefetch(authRes.url);

        try {
          await router.push(authRes.url);
          router.refresh();
        } catch {
          setError("Navigation failed. Please try again.");
          setIsLoading(false);
        }
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 px-4">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden bg-gray-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />

          <div className="relative p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                {variant === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="mt-2 text-gray-400">
                {variant === "login"
                  ? "Sign in to continue to your account"
                  : "Sign up to start creating music"}
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          className="bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-gray-100 placeholder:text-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-gray-800/50 border-gray-700 focus:border-indigo-500 text-gray-100 placeholder:text-gray-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-2.5"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Please wait...</span>
                    </div>
                  ) : variant === "login" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-gray-400">
              {variant === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent(
                      callbackUrl
                    )}`}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      callbackUrl
                    )}`}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
