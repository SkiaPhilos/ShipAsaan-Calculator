import React from "react";
import {
  LayoutDashboard,
  Calculator,
  GitCompare,
  Truck,
  FileSpreadsheet,
  FileUp,
  MapPin,
  Globe2,
  FolderArchive,
  History,
  Settings,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { WorkspaceType } from "../types";

export type NavView =
  | "dashboard"
  | "calculator"
  | "comparison"
  | "partners"
  | "tariffs"
  | "import"
  | "locations"
  | "countries"
  | "documents"
  | "history"
  | "settings";

interface SidebarProps {
  activeWorkspace: WorkspaceType;
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  needsReviewCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeWorkspace,
  currentView,
  onNavigate,
  needsReviewCount,
}) => {
  const isDomestic = activeWorkspace === "domestic";

  const domesticNavItems: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calculator", label: "Rate Calculator", icon: Calculator },
    { id: "comparison", label: "Rate Comparison", icon: GitCompare },
    { id: "partners", label: "Couriers / Partners", icon: Truck },
    { id: "tariffs", label: "Tariffs & Rate Cards", icon: FileSpreadsheet },
    { id: "import", label: "AI Document Import", icon: FileUp, badge: needsReviewCount > 0 ? needsReviewCount : undefined },
    { id: "locations", label: "Locations & Zones", icon: MapPin },
    { id: "documents", label: "Document Library", icon: FolderArchive },
    { id: "history", label: "Calculation History", icon: History },
  ];

  const internationalNavItems: Array<{
    id: NavView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "calculator", label: "Rate Calculator", icon: Calculator },
    { id: "comparison", label: "Rate Comparison", icon: GitCompare },
    { id: "partners", label: "Couriers / Partners", icon: Truck },
    { id: "tariffs", label: "Tariffs & Rate Cards", icon: FileSpreadsheet },
    { id: "import", label: "AI Document Import", icon: FileUp, badge: needsReviewCount > 0 ? needsReviewCount : undefined },
    { id: "countries", label: "Countries & Zones", icon: Globe2 },
    { id: "documents", label: "Document Library", icon: FolderArchive },
    { id: "history", label: "Calculation History", icon: History },
  ];

  const navItems = isDomestic ? domesticNavItems : internationalNavItems;

  return (
    <aside
      id="ship-asaan-sidebar"
      className="w-64 shrink-0 bg-[#FAF8F5] border-r border-stone-200/90 flex flex-col justify-between py-5 px-3 select-none min-h-[calc(100vh-4rem)]"
    >
      <div className="space-y-6">
        {/* Workspace banner indicator */}
        <div
          className={`px-3 py-2.5 rounded-xl border flex items-center gap-2.5 shadow-xs transition-colors ${
            isDomestic
              ? "bg-purple-900/90 border-purple-800 text-white"
              : "bg-purple-950 border-purple-800 text-white"
          }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isDomestic ? "bg-lime-400 animate-pulse" : "bg-orange-500 animate-pulse"
            }`}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">
              Active Workspace
            </p>
            <p
              className={`text-xs font-bold ${
                isDomestic ? "text-lime-300" : "text-orange-400"
              }`}
            >
              {isDomestic ? "Domestic & COD Logistics" : "International Air Courier"}
            </p>
          </div>
        </div>

        {/* Section title */}
        <div>
          <p className="px-3 text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2">
            {isDomestic ? "Domestic Operations" : "International Operations"}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? isDomestic
                        ? "bg-purple-900 text-lime-300 shadow-sm border border-purple-800"
                        : "bg-purple-900 text-orange-400 shadow-sm border border-purple-800"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? isDomestic
                            ? "text-lime-400"
                            : "text-orange-400"
                          : "text-stone-500"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom system links: Settings & Data */}
      <div className="pt-4 border-t border-stone-200/80 space-y-1">
        <button
          id="nav-link-settings"
          type="button"
          onClick={() => onNavigate("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            currentView === "settings"
              ? isDomestic
                ? "bg-purple-900 text-lime-300 border border-purple-800 shadow-sm"
                : "bg-purple-900 text-orange-400 border border-purple-800 shadow-sm"
              : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
          }`}
        >
          <Settings className="w-4 h-4 text-stone-500" />
          <span>Settings & AI Config</span>
        </button>

        <div className="px-3 pt-3">
          <p className="text-[10px] text-stone-600 font-mono">
            Ship Asaan Engine v2.4 • Local DB Active
          </p>
        </div>
      </div>
    </aside>
  );
};
