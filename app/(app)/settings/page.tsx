// Description: Settings page - app settings and preferences

"use client";

import { AppShell } from "@/components/layout/AppShell";
import { SettingsListRow } from "@/components/primitives/SettingsListRow";

export default function SettingsPage() {
  return (
    <AppShell topBar={{ title: "Settings", showBack: true }}>
      <div className="p-4 space-y-6">
        {/* Account Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">Account</h2>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
            <SettingsListRow
              label="Edit Profile"
              onClick={() => console.log("Edit Profile clicked")}
            />
            <SettingsListRow
              label="Change Password"
              onClick={() => console.log("Change Password clicked")}
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">Preferences</h2>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
            <SettingsListRow
              label="Metric System"
              showChevron={false}
              rightContent={
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
              }
            />
            <SettingsListRow
              label="Notifications"
              showChevron={false}
              rightContent={
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
              }
            />
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">About</h2>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
            <SettingsListRow
              label="Privacy Policy"
              onClick={() => console.log("Privacy Policy clicked")}
            />
            <SettingsListRow
              label="Terms of Service"
              onClick={() => console.log("Terms of Service clicked")}
            />
            <SettingsListRow
              label="Version 1.0.0"
              showChevron={false}
              className="text-muted text-sm"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
