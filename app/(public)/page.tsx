// Description: Landing page for unauthenticated users - introduces SaveIt app

import Link from "next/link";
import { HeroCard } from "@/components/composites/HeroCard";
import { ChefHat } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="flex w-full items-center justify-center pt-8 pb-4 px-4 z-10">
        <div className="flex items-center gap-2">
          <ChefHat size={28} className="text-primary" />
          <h1 className="text-primary tracking-tight text-3xl font-serif font-bold leading-none">
            SaveIt
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 w-full max-w-md mx-auto relative pb-24">
        {/* Hero Card */}
        <div className="w-full mt-4 mb-8">
          <HeroCard
            backgroundImage="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800"
            previewTitle="Spicy Thai Basil Noodles"
            previewSource="Saved from TikTok"
            tags={[
              { label: "Thai", variant: "primary" },
              { label: "20 min", variant: "default" },
            ]}
          />
        </div>

        {/* Hero Text */}
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl font-serif font-bold text-charcoal leading-tight">
            Your Personal
            <br />
            <span className="text-primary">Digital Cookbook</span>
          </h2>
          <p className="text-muted text-base max-w-xs mx-auto">
            Save recipes from TikTok, Instagram & YouTube. Extract ingredients
            instantly.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <Link
            href="/signup"
            className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl transition-all shadow-lg flex items-center justify-center"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full h-14 bg-surface border-2 border-primary text-primary font-bold text-lg rounded-xl transition-all flex items-center justify-center hover:bg-primary/5"
          >
            I Have an Account
          </Link>
        </div>
      </main>
    </div>
  );
}
