// Description: Profile page - displays user profile information

"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsListRow } from "@/components/primitives/SettingsListRow";
import { getCurrentUser, User as UserType } from "@/lib/auth/get-user";
import { User } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
    loadUser();
  }, []);

  return (
    <AppShell topBar={{ title: "Profile" }}>
      <div className="p-4">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={48} className="text-charcoal" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal">
              {user?.full_name || "User"}
            </h1>
            <p className="text-muted">{user?.email}</p>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
          <SettingsListRow
            icon="settings"
            label="Settings"
            onClick={() => console.log("Settings clicked")}
          />
          <SettingsListRow
            icon="help"
            label="Help & Support"
            onClick={() => console.log("Help clicked")}
          />
          <SettingsListRow
            icon="logout"
            label="Sign Out"
            variant="destructive"
            onClick={() => console.log("Sign Out clicked")}
          />
        </div>
      </div>
    </AppShell>
  );
}
