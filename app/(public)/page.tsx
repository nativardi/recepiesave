// Description: Landing page for unauthenticated users - introduces SaveIt app

import Link from "next/link";
import { HeroCard } from "@/components/composites/HeroCard";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="flex w-full items-center justify-center pt-8 pb-4 px-4 z-10">
        <div className="relative w-48 h-16">
          <Image
            src="/logo.png"
            alt="Savory"
            fill
            className="object-contain"
            priority
          />
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
          <h2 className="text-2xl font-semibold text-slate-700 -mb-1 leading-tight">
            Your Personal
            <br />
            <span className="text-primary font-bold text-4xl">Digital Cookbook</span>
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
            className="w-full h-14 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 flex items-center justify-center"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full h-14 bg-surface border-2 border-primary text-primary font-bold text-lg rounded-xl transition-all flex items-center justify-center hover:bg-primary/5"
          >
            Log In
          </Link>
        </div>
      </main>
    </div>
  );
}
