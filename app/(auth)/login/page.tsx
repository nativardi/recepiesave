// Description: Login page for user authentication

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthFormData } from "@/components/composites/AuthForm";
import { SocialButtons } from "@/components/composites/SocialButtons";
import { ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: AuthFormData) => {
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message || "Failed to sign in. Please check your credentials.");
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Redirect to dashboard on successful login
        router.push("/dashboard");
        router.refresh(); // Refresh to update server-side session
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message || "Failed to sign in with Google.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleAppleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message || "Failed to sign in with Apple.");
      }
    } catch (err) {
      console.error("Apple login error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px] flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-surface rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-2">
            <ChefHat size={48} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-charcoal text-3xl font-bold tracking-tight font-serif">
              SaveIt
            </h1>
            <p className="text-muted text-base">Welcome back to your kitchen.</p>
          </div>
        </div>

        {/* Auth Form */}
        <AuthForm
          mode="login"
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />

        {/* Social Buttons */}
        <SocialButtons
          onGoogleClick={handleGoogleLogin}
          onAppleClick={handleAppleLogin}
        />

        {/* Sign Up Link */}
        <div className="text-center pt-2">
          <p className="text-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
