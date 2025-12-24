// Description: Signup page for new user registration

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthForm, AuthFormData } from "@/components/composites/AuthForm";
import { SocialButtons } from "@/components/composites/SocialButtons";
import { ChefHat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: AuthFormData) => {
    setError("");

    if (!data.fullName?.trim() || !data.email.trim() || !data.password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Sign up with email and password
      // Include full_name in metadata so the trigger can create the profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (authError) {
        setError(authError.message || "Failed to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Redirect to dashboard on successful signup
        router.push("/dashboard");
        router.refresh(); // Refresh to update server-side session
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message || "Failed to sign up with Google.");
      }
    } catch (err) {
      console.error("Google signup error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleAppleSignup = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message || "Failed to sign up with Apple.");
      }
    } catch (err) {
      console.error("Apple signup error:", err);
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
              Create Account
            </h1>
            <p className="text-muted text-base">
              Start building your digital cookbook.
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <AuthForm
          mode="signup"
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />

        {/* Social Buttons */}
        <SocialButtons
          onGoogleClick={handleGoogleSignup}
          onAppleClick={handleAppleSignup}
        />

        {/* Login Link */}
        <div className="text-center pt-2">
          <p className="text-muted text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-accent font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-muted">
          By creating an account, you agree to our{" "}
          <Link href="#" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
