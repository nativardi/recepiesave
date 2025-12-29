// Description: Auth form component - handles login and signup forms with shared structure
// Uses Lucide SVG icons

"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export interface AuthFormData {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthFormProps {
  mode: "login" | "signup";
  onSubmit: (data: AuthFormData) => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function AuthForm({
  mode,
  onSubmit,
  isLoading = false,
  error,
  className,
}: AuthFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      password,
      fullName: mode === "signup" ? fullName : undefined,
    });
  };

  const isSignup = mode === "signup";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-5 w-full", className)}
    >
      {/* Full Name Input (signup only) */}
      {isSignup && (
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <User
              size={20}
              className="text-muted group-focus-within:text-primary transition-colors"
            />
          </div>
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="pl-12 h-14"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Email Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Mail
            size={20}
            className="text-muted group-focus-within:text-primary transition-colors"
          />
        </div>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isSignup ? "Email" : "Email or Username"}
          className="pl-12 h-14"
          disabled={isLoading}
        />
      </div>

      {/* Password Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Lock
            size={20}
            className="text-muted group-focus-within:text-primary transition-colors"
          />
        </div>
        <Input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="pl-12 pr-12 h-14"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-charcoal transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      </div>

      {/* Forgot Password (login only) */}
      {!isSignup && (
        <div className="flex justify-end -mt-1">
          <Link
            href="#"
            className="text-sm font-medium text-accent hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      )}

      {/* Error Message */}
      {error && <p className="text-accent text-sm text-center">{error}</p>}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full h-14 text-lg mt-2"
        disabled={isLoading}
      >
        {isLoading
          ? isSignup
            ? "Creating Account..."
            : "Logging in..."
          : isSignup
            ? "Create Account"
            : "Log In"}
      </Button>
    </form>
  );
}





