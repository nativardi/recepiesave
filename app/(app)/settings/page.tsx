// Description: Settings page - app settings and preferences with data management

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsListRow } from "@/components/primitives/SettingsListRow";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { mockDataStore } from "@/lib/mocks/MockDataStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  RotateCcw,
  HardDrive,
  AlertTriangle,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/lib/providers/ThemeProvider";

export default function SettingsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageSize, setStorageSize] = useState<number>(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isMetric, setIsMetric] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Calculate storage size on mount
  useEffect(() => {
    setStorageSize(mockDataStore.getStorageSize());
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleExport = () => {
    try {
      const data = mockDataStore.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saveit-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Data exported successfully");
    } catch {
      showToast("Failed to export data", "error");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = mockDataStore.importData(data);
        if (success) {
          queryClient.invalidateQueries();
          setStorageSize(mockDataStore.getStorageSize());
          showToast("Data imported successfully");
        } else {
          showToast("Invalid backup file format", "error");
        }
      } catch {
        showToast("Failed to import data", "error");
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    mockDataStore.resetToDefaults();
    queryClient.invalidateQueries();
    setStorageSize(mockDataStore.getStorageSize());
    setShowResetDialog(false);
    showToast("Data reset to defaults");
  };

  return (
    <AppShell topBar={{ title: "Settings", showBack: true }}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 space-y-6"
      >
        {/* Data Management Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">
            Data Management
          </h2>
          <div className="bg-surface rounded-xl shadow-sm p-4 space-y-4">
            {/* Storage Usage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <HardDrive size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    Storage Used
                  </p>
                  <p className="text-xs text-muted">
                    {formatBytes(storageSize)} / 5 MB
                  </p>
                </div>
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((storageSize / (5 * 1024 * 1024)) * 100, 100)}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Download size={20} />
                <span className="text-xs">Export</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleImportClick}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Upload size={20} />
                <span className="text-xs">Import</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetDialog(true)}
                className="flex flex-col items-center gap-1 h-auto py-3 text-accent hover:bg-red-50"
              >
                <RotateCcw size={20} />
                <span className="text-xs">Reset</span>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>

        {/* Account Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">Account</h2>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100">
            <SettingsListRow
              label="Edit Profile"
              onClick={() => showToast("Coming soon", "info")}
            />
            <SettingsListRow
              label="Change Password"
              onClick={() => showToast("Coming soon", "info")}
            />
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">Appearance</h2>
          <div className="bg-surface rounded-xl shadow-sm p-4">
            <p className="text-sm text-muted mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light" as const, icon: Sun, label: "Light" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
                { value: "system" as const, icon: Monitor, label: "System" },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                    theme === option.value
                      ? "bg-primary text-white"
                      : "bg-background hover:bg-primary/10"
                  }`}
                >
                  <option.icon size={20} />
                  <span className="text-xs font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-charcoal px-2">Preferences</h2>
          <div className="bg-surface rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            <SettingsListRow
              label="Metric System"
              showChevron={false}
              rightContent={
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMetric(!isMetric)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    isMetric ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <motion.div
                    animate={{ x: isMetric ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </motion.button>
              }
            />
            <SettingsListRow
              label="Notifications"
              showChevron={false}
              rightContent={
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${
                    notificationsEnabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <motion.div
                    animate={{ x: notificationsEnabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </motion.button>
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
              onClick={() => showToast("Coming soon", "info")}
            />
            <SettingsListRow
              label="Terms of Service"
              onClick={() => showToast("Coming soon", "info")}
            />
            <SettingsListRow
              label="Version 1.0.0"
              showChevron={false}
              className="text-muted text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowResetDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-surface rounded-2xl p-6 shadow-xl max-w-sm mx-auto"
            >
              <button
                onClick={() => setShowResetDialog(false)}
                className="absolute top-4 right-4 text-muted hover:text-charcoal"
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle size={32} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-2">
                  Reset All Data?
                </h3>
                <p className="text-muted text-sm mb-6">
                  This will delete all your recipes and collections and restore
                  the app to its default state. This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowResetDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-accent hover:bg-red-600"
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
