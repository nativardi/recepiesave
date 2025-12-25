// Description: Profile page - displays user profile information with stats

"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsListRow } from "@/components/primitives/SettingsListRow";
import { getCurrentUser, User as UserType } from "@/lib/auth/get-user";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useCollections } from "@/lib/hooks/useCollections";
import { useRouter } from "next/navigation";
import {
  User,
  ChefHat,
  Heart,
  BookOpen,
  Video,
} from "lucide-react";

// Platform icons with colors
const platformConfig = {
  tiktok: { label: "TikTok", color: "bg-black", textColor: "text-white" },
  instagram: { label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500", textColor: "text-white" },
  youtube: { label: "YouTube", color: "bg-red-600", textColor: "text-white" },
  facebook: { label: "Facebook", color: "bg-blue-600", textColor: "text-white" },
  other: { label: "Other", color: "bg-gray-500", textColor: "text-white" },
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const { data: recipes = [] } = useRecipes();
  const { data: collections = [] } = useCollections();

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    loadUser();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRecipes = recipes.length;
    const favorites = recipes.filter((r) => r.is_favorite).length;
    const totalCollections = collections.length;

    // Count by platform
    const byPlatform = recipes.reduce(
      (acc, recipe) => {
        const platform = recipe.platform || "other";
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return { totalRecipes, favorites, totalCollections, byPlatform };
  }, [recipes, collections]);

  const statCards = [
    {
      label: "Recipes",
      value: stats.totalRecipes,
      icon: ChefHat,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Favorites",
      value: stats.favorites,
      icon: Heart,
      color: "bg-red-100 text-red-500",
    },
    {
      label: "Cookbooks",
      value: stats.totalCollections,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <AppShell topBar={{ title: "Profile" }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4 space-y-6"
      >
        {/* Profile Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-4 py-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center shadow-lg"
          >
            <User size={48} className="text-white" />
          </motion.div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal">
              {user?.full_name || "User"}
            </h1>
            <p className="text-muted">{user?.email}</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-surface rounded-xl p-4 shadow-sm flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center`}
              >
                <stat.icon size={20} />
              </div>
              <span className="text-2xl font-bold text-charcoal">
                {stat.value}
              </span>
              <span className="text-xs text-muted">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Platform Breakdown */}
        {Object.keys(stats.byPlatform).length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-lg font-bold text-charcoal px-2">
              Recipes by Source
            </h2>
            <div className="bg-surface rounded-xl p-4 shadow-sm space-y-3">
              {Object.entries(stats.byPlatform)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => {
                  const config =
                    platformConfig[platform as keyof typeof platformConfig] ||
                    platformConfig.other;
                  const percentage = Math.round(
                    (count / stats.totalRecipes) * 100
                  );

                  return (
                    <div key={platform} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded ${config.color} flex items-center justify-center`}
                          >
                            <Video size={12} className={config.textColor} />
                          </div>
                          <span className="text-sm font-medium text-charcoal">
                            {config.label}
                          </span>
                        </div>
                        <span className="text-sm text-muted">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full ${config.color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Profile Actions */}
        <motion.div variants={itemVariants}>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
            <SettingsListRow
              icon="settings"
              label="Settings"
              onClick={() => router.push("/settings")}
            />
            <SettingsListRow
              icon="help"
              label="Help & Support"
              onClick={() => {}}
            />
            <SettingsListRow
              icon="logout"
              label="Sign Out"
              variant="destructive"
              onClick={() => router.push("/login")}
            />
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
