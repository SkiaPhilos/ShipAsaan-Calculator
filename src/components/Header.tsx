import React, { useState } from "react";
import {
  Sparkles,
  Search,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Globe,
  Truck,
  User,
  LogOut,
  RefreshCw,
  Cpu,
  Cloud,
} from "lucide-react";
import { WorkspaceType, AIProviderConfig, AppUser } from "../types";
import { TransparentLogoContainer } from "./TransparentLogoContainer";

interface HeaderProps {
  activeWorkspace: WorkspaceType;
  onWorkspaceChange: (workspace: WorkspaceType) => void;
  aiConfig: AIProviderConfig;
  user?: AppUser;
  onOpenSettings?: (tab?: string) => void;
  onOpenCopilot?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onQuickTestAI?: () => void;
  isTestingAI?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeWorkspace,
  onWorkspaceChange,
  aiConfig,
  user,
  onOpenSettings,
  onOpenCopilot,
  searchQuery = "",
  onSearchChange,
  onQuickTestAI,
  isTestingAI = false,
  onLogout,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [hasCustomLogo, setHasCustomLogo] = useState(false);
  const isDomestic = activeWorkspace === "domestic";

  const currentUser: AppUser = user || {
    id: "u-admin",
    username: "skyler",
    fullName: "Skyler Admin",
    email: "skylerisbusy@gmail.com",
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  return (
    <header
      id="ship-asaan-header"
      className={`border-b sticky top-0 z-40 transition-colors duration-200 ${
        isDomestic
          ? "bg-[#FAF8F5] border-purple-200"
          : "bg-[#FAF8F5] border-purple-200"
      }`}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Far Left: Logo & Brand + Tag + Subtext + Workspace Switcher */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <TransparentLogoContainer onLogoStateChange={setHasCustomLogo} />
              {!hasCustomLogo ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-lg tracking-tight whitespace-nowrap">
                      SHIP ASAAN
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider whitespace-nowrap ${
                        isDomestic
                          ? "bg-lime-100 text-lime-800 border border-lime-300"
                          : "bg-orange-100 text-orange-800 border border-orange-300"
                      }`}
                    >
                      {isDomestic ? "DOMESTIC / COD" : "INTERNATIONAL"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium whitespace-nowrap">
                    Tariff Intelligence & Rate Management
                  </p>
                </div>
              ) : (
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider whitespace-nowrap ${
                        isDomestic
                          ? "bg-lime-100 text-lime-800 border border-lime-300"
                          : "bg-orange-100 text-orange-800 border border-orange-300"
                      }`}
                    >
                      {isDomestic ? "DOMESTIC / COD" : "INTERNATIONAL"}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium whitespace-nowrap mt-0.5">
                    Tariff Intelligence
                  </p>
                </div>
              )}
            </div>

            {/* THE GLOBAL WORKSPACE SWITCHER */}
            <div className="hidden sm:flex items-center">
              <div
                id="global-workspace-switcher"
                className="bg-stone-200/80 p-1 rounded-xl flex items-center shadow-inner border border-stone-300/70"
              >
                <button
                  id="btn-switch-domestic"
                  type="button"
                  onClick={() => onWorkspaceChange("domestic")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isDomestic
                      ? "bg-purple-900 text-lime-300 shadow-sm border border-purple-700"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/50"
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>DOMESTIC / COD</span>
                </button>

                <button
                  id="btn-switch-international"
                  type="button"
                  onClick={() => onWorkspaceChange("international")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    !isDomestic
                      ? "bg-purple-900 text-orange-400 shadow-sm border border-purple-700"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/50"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>INTERNATIONAL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Far Right Action Tools: AI Copilot & User Profile Menu */}
          <div className="flex items-center gap-3 shrink-0 ml-auto">
            {/* Mobile Workspace Switcher Icon */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={() => onWorkspaceChange(isDomestic ? "international" : "domestic")}
                className="p-2 rounded-lg border border-stone-300 bg-white text-xs font-bold flex items-center gap-1 text-purple-950"
              >
                {isDomestic ? <Globe className="w-3.5 h-3.5 text-orange-600" /> : <Truck className="w-3.5 h-3.5 text-lime-600" />}
              </button>
            </div>

            {/* Live Cloud Sync Indicator */}
            <div
              id="cloud-sync-status-indicator"
              title="Connected to Firebase Cloud Firestore: Real-time tariff synchronization across all browsers and devices"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 text-emerald-800 text-[11px] font-semibold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cloud Synced</span>
            </div>

            {/* AI Copilot Button */}
            <button
              id="btn-open-copilot"
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-all"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  isDomestic ? "text-lime-600" : "text-orange-600"
                }`}
              />
              <span>AI Copilot</span>
            </button>

            {/* Current User Info */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <p className="font-semibold text-stone-800">{currentUser.username}</p>
                  <p className="text-[10px] text-stone-400 capitalize">{currentUser.role}</p>
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 text-xs text-stone-700">
                  <div className="px-3 py-2 border-b border-stone-100">
                    <p className="font-bold text-stone-900">{currentUser.fullName}</p>
                    <p className="text-[11px] text-stone-500">{currentUser.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSettings?.("user");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSettings?.("data");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-stone-50 flex items-center gap-2 text-stone-700"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-stone-500" />
                    <span>Data Management</span>
                  </button>
                  <div className="my-1 border-t border-stone-100" />
                  <button
                    id="btn-header-logout"
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout?.();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
