import React from "react";
import {
  Truck,
  Globe,
  FileSpreadsheet,
  FolderArchive,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  WorkspaceType,
  PartnerDomestic,
  PartnerInternational,
  TariffDomestic,
  TariffInternational,
  StoredDocument,
} from "../types";
import { NavView } from "./Sidebar";

interface DashboardViewProps {
  activeWorkspace: WorkspaceType;
  onNavigate: (view: NavView) => void;
  domesticPartners: PartnerDomestic[];
  domesticTariffs: TariffDomestic[];
  domesticDocs: StoredDocument[];
  internationalPartners: PartnerInternational[];
  internationalTariffs: TariffInternational[];
  internationalDocs: StoredDocument[];
  onOpenTariffDetails: (tariffId: string) => void;
  onQuickRouteSelect: (origin: string, dest: string, weight: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeWorkspace,
  onNavigate,
  domesticPartners,
  domesticTariffs,
  domesticDocs,
  internationalPartners,
  internationalTariffs,
  internationalDocs,
  onOpenTariffDetails,
  onQuickRouteSelect,
}) => {
  const isDomestic = activeWorkspace === "domestic";

  // Compute operational stats
  const activePartnersCount = isDomestic
    ? domesticPartners.filter((p) => p.status === "active").length
    : internationalPartners.filter((p) => p.status === "active").length;

  const activeTariffsCount = isDomestic
    ? domesticTariffs.filter((t) => t.status === "active").length
    : internationalTariffs.filter((t) => t.status === "active").length;

  const needsReviewCount = isDomestic
    ? domesticTariffs.filter((t) => t.reviewStatus.includes("needs_review") || t.status === "needs_review").length
    : internationalTariffs.filter((t) => t.reviewStatus.includes("needs_review") || t.status === "needs_review").length;

  const docsCount = isDomestic ? domesticDocs.length : internationalDocs.length;

  return (
    <div id="dashboard-view" className="space-y-6">
      {/* Top Banner / Hero */}
      <div
        className={`p-6 rounded-2xl border shadow-xs transition-colors ${
          isDomestic
            ? "bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white border-purple-800"
            : "bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white border-purple-800"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isDomestic
                    ? "bg-lime-400 text-purple-950"
                    : "bg-orange-400 text-purple-950"
                }`}
              >
                {isDomestic ? "Domestic COD Intelligence" : "International Courier Intelligence"}
              </span>
              <span className="text-xs text-purple-200">
                Partition Isolated • Local DB Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isDomestic ? "Pakistan Domestic Logistics Center" : "Global Cross-Border Express Matrix"}
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              {isDomestic
                ? "Normalized first-kg and additional-kg tariff management, fuel adjustments (FAC), COD remittance tracking, and provincial GST calculations across Pakistan's top couriers."
                : "Comprehensive country-to-zone matrices, volumetric divisors, slab weight pricing, fuel surcharges, and customs documentation across global express carriers."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-quick-calc"
              type="button"
              onClick={() => onNavigate("calculator")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                isDomestic
                  ? "bg-lime-400 text-purple-950 hover:bg-lime-300"
                  : "bg-orange-500 text-white hover:bg-orange-400"
              }`}
            >
              <span>Launch Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-quick-import"
              type="button"
              onClick={() => onNavigate("import")}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-colors flex items-center gap-2"
            >
              <span>Import Tariff Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards (Anti-Slop: clean mathematical padding and proportional sizing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-500">
              {isDomestic ? "Domestic Couriers" : "International Carriers"}
            </p>
            <Truck className={`w-4 h-4 ${isDomestic ? "text-lime-600" : "text-orange-600"}`} />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{activePartnersCount}</p>
          <p className="text-[11px] text-stone-600 mt-1">
            {isDomestic
              ? "TCS, Leopards, Trax, Call Courier"
              : "DHL, FedEx, UPS, Aramex"}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-500">Active Tariffs</p>
            <FileSpreadsheet className={`w-4 h-4 ${isDomestic ? "text-lime-600" : "text-orange-600"}`} />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{activeTariffsCount}</p>
          <p className="text-[11px] text-stone-600 mt-1">Verified deterministic schedules</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-500">
              {isDomestic ? "Cities & Hubs" : "Countries Covered"}
            </p>
            <Globe className={`w-4 h-4 ${isDomestic ? "text-lime-600" : "text-orange-600"}`} />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">
            {isDomestic ? "16 Major Hubs" : "220 Destinations"}
          </p>
          <p className="text-[11px] text-stone-600 mt-1">
            {isDomestic ? "All 4 provinces + ICT" : "8 standard international zones"}
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white border border-stone-200 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-500">Document Records</p>
            <FolderArchive className={`w-4 h-4 ${isDomestic ? "text-lime-600" : "text-orange-600"}`} />
          </div>
          <p className="text-2xl font-black text-stone-900 mt-2">{docsCount}</p>
          <p className="text-[11px] text-stone-600 mt-1">
            {needsReviewCount > 0 ? (
              <span className="text-amber-600 font-bold">{needsReviewCount} needs review</span>
            ) : (
              <span className="text-green-600 font-medium">All tariffs audited</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid: Popular Corridors & Active Tariffs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Popular Shipping Corridors with 1-click Quick Run */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900">
                {isDomestic ? "Popular Domestic Corridors" : "Primary Global Trade Lanes"}
              </h2>
              <p className="text-xs text-stone-600">
                {isDomestic
                  ? "Frequent e-commerce shipping routes in Pakistan. Click to simulate rate."
                  : "High-volume air freight corridors. Click to simulate rate."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("comparison")}
              className={`text-xs font-semibold flex items-center gap-1 ${
                isDomestic ? "text-purple-700 hover:text-purple-900" : "text-orange-600 hover:text-orange-800"
              }`}
            >
              <span>Full Comparison</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {isDomestic ? (
              <>
                {/* Route 1 */}
                <div
                  onClick={() => onQuickRouteSelect("Karachi", "Lahore", 2.0)}
                  className="p-3 bg-stone-50 hover:bg-purple-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs">
                      KL
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-purple-950">
                        Karachi ➔ Lahore
                      </p>
                      <p className="text-[11px] text-stone-600">Different Province • 2.0 kg COD parcel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">~PKR 540–620</span>
                    <p className="text-[10px] text-stone-600">1–2 Transit Days</p>
                  </div>
                </div>

                {/* Route 2 */}
                <div
                  onClick={() => onQuickRouteSelect("Lahore", "Islamabad", 1.5)}
                  className="p-3 bg-stone-50 hover:bg-purple-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold text-xs">
                      LI
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-purple-950">
                        Lahore ➔ Islamabad / Rawalpindi
                      </p>
                      <p className="text-[11px] text-stone-600">Inter-Provincial Hub • 1.5 kg express</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">~PKR 460–510</span>
                    <p className="text-[10px] text-stone-600">Overnight Express</p>
                  </div>
                </div>

                {/* Route 3 */}
                <div
                  onClick={() => onQuickRouteSelect("Karachi", "Karachi", 1.0)}
                  className="p-3 bg-stone-50 hover:bg-purple-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-lime-100 text-lime-900 flex items-center justify-center font-bold text-xs">
                      KK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-purple-950">
                        Karachi ➔ Karachi (Intra-city)
                      </p>
                      <p className="text-[11px] text-stone-600">Within City • 1.0 kg standard delivery</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-lime-800">~PKR 180–220</span>
                    <p className="text-[10px] text-stone-600">Same-Day / Next-Day</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Intl Route 1 */}
                <div
                  onClick={() => onQuickRouteSelect("Pakistan", "United States", 4.0)}
                  className="p-3 bg-stone-50 hover:bg-orange-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs">
                      US
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-orange-950">
                        Pakistan ➔ United States (Zone 3)
                      </p>
                      <p className="text-[11px] text-stone-600">North America • 4.0 kg commercial carton</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">~PKR 18,500–21,000</span>
                    <p className="text-[10px] text-stone-600">3–4 Transit Days</p>
                  </div>
                </div>

                {/* Intl Route 2 */}
                <div
                  onClick={() => onQuickRouteSelect("Pakistan", "United Arab Emirates", 2.0)}
                  className="p-3 bg-stone-50 hover:bg-orange-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs">
                      AE
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-orange-950">
                        Pakistan ➔ United Arab Emirates / Dubai (Zone 1)
                      </p>
                      <p className="text-[11px] text-stone-600">GCC Corridor • 2.0 kg express priority</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">~PKR 8,200–9,800</span>
                    <p className="text-[10px] text-stone-600">2 Transit Days</p>
                  </div>
                </div>

                {/* Intl Route 3 */}
                <div
                  onClick={() => onQuickRouteSelect("Pakistan", "United Kingdom", 3.0)}
                  className="p-3 bg-stone-50 hover:bg-orange-50/50 border border-stone-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-900 flex items-center justify-center font-bold text-xs">
                      GB
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-900 group-hover:text-orange-950">
                        Pakistan ➔ United Kingdom & Germany (Zone 2)
                      </p>
                      <p className="text-[11px] text-stone-600">Western Europe • 3.0 kg sample parcel</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">~PKR 14,000–16,500</span>
                    <p className="text-[10px] text-stone-600">3 Transit Days</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Col: Active Tariffs & Audit Status */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-stone-900">
              {isDomestic ? "Domestic Master Tariffs" : "International Master Tariffs"}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("tariffs")}
              className={`text-xs font-semibold ${
                isDomestic ? "text-purple-700 hover:text-purple-900" : "text-orange-600 hover:text-orange-800"
              }`}
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {isDomestic
              ? domesticTariffs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTariffDetails(t.id)}
                    className="p-3 border border-stone-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-900">{t.partnerName}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-800">
                        v{t.currentVersion} Active
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{t.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400 font-mono">
                      <span>FAC: {t.fuelPercentage}%</span>
                      <span>COD: {t.codPercentage}%</span>
                      <span>GST: {t.gstPercentage}%</span>
                    </div>
                  </div>
                ))
              : internationalTariffs.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onOpenTariffDetails(t.id)}
                    className="p-3 border border-stone-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-stone-900">{t.partnerName}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-800">
                        v{t.currentVersion} Active
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">{t.name}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400 font-mono">
                      <span>Divisor: {t.volumetricDivisor}</span>
                      <span>Fuel: {t.fuelPercentage}%</span>
                      <span>Zones: 8</span>
                    </div>
                  </div>
                ))}
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-stone-800">Source Auditability Enforced</p>
              <p className="text-stone-500 mt-0.5">
                Every calculation links directly back to the verified tariff version and stored source document.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
