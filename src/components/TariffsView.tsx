import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  Layers,
  Code,
  Calculator,
  Plus,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Zap,
  Trash2,
} from "lucide-react";
import {
  WorkspaceType,
  TariffDomestic,
  TariffInternational,
} from "../types";
import { RateMatrixView } from "./RateMatrixView";
import {
  exportSingleTariffToExcel,
  exportAllTariffsToExcel,
} from "../utils/excelExporter";

interface TariffsViewProps {
  activeWorkspace: WorkspaceType;
  domesticTariffs: TariffDomestic[];
  internationalTariffs: TariffInternational[];
  onVerifyTariff: (tariffId: string) => void;
  selectedTariffIdModal: string | null;
  onCloseTariffModal: () => void;
  onOpenTariffModal: (tariffId: string) => void;
  onDeleteTariff?: (tariffId: string) => void;
  onAddTariff?: (tariff: TariffDomestic | TariffInternational) => void;
}

export const TariffsView: React.FC<TariffsViewProps> = ({
  activeWorkspace,
  domesticTariffs,
  internationalTariffs,
  onVerifyTariff,
  selectedTariffIdModal,
  onCloseTariffModal,
  onOpenTariffModal,
  onDeleteTariff,
  onAddTariff,
}) => {
  const isDomestic = activeWorkspace === "domestic";

  const [searchFilter, setSearchFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal active tab: 'normalized' | 'dynamic_rules' | 'transformations' | 'raw' | 'calc_model' | 'custom_fields' | 'versions'
  const [modalTab, setModalTab] = useState<"normalized" | "dynamic_rules" | "transformations" | "raw" | "calc_model" | "custom_fields" | "versions">("normalized");

  // Add Rate Card Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardPartner, setCardPartner] = useState("");
  const [cardService, setCardService] = useState("Overnight Express");
  const [cardEffectiveFrom, setCardEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [cardFuel, setCardFuel] = useState<number>(15.5);
  const [cardGst, setCardGst] = useState<number>(16.0);
  const [cardCod, setCardCod] = useState<number>(3.0);
  const [cardDivisor, setCardDivisor] = useState<number>(5000);
  const [cardWithinCity, setCardWithinCity] = useState<number>(200);
  const [cardSameProvince, setCardSameProvince] = useState<number>(260);
  const [cardDiffProvince, setCardDiffProvince] = useState<number>(320);
  const [cardAdditionalKg, setCardAdditionalKg] = useState<number>(160);
  const [cardCurrency, setCardCurrency] = useState<string>("PKR");

  const handleSaveNewRateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim() || !cardPartner.trim()) return;

    const tariffId = `tariff-${Date.now()}`;
    const partnerId = cardPartner.toLowerCase().replace(/\s+/g, "-");

    if (isDomestic) {
      const newTariff: TariffDomestic = {
        id: tariffId,
        partnerId,
        partnerName: cardPartner.trim(),
        name: cardName.trim(),
        service: cardService,
        effectiveFrom: cardEffectiveFrom,
        currency: "PKR",
        status: "active",
        reviewStatus: "user_verified",
        currentVersion: 1,
        fuelPercentage: Number(cardFuel) || 0,
        gstPercentage: Number(cardGst) || 0,
        codPercentage: Number(cardCod) || 0,
        codFixedMinimum: 50,
        rates: [
          {
            id: `${tariffId}-r1`,
            origin: "Any",
            destination: "Within City",
            firstKgRate: Number(cardWithinCity) || 200,
            additionalKgRate: Number(cardAdditionalKg) || 160,
            expectedTransitDays: "1-2 Days",
          },
          {
            id: `${tariffId}-r2`,
            origin: "Any",
            destination: "Same Province",
            firstKgRate: Number(cardSameProvince) || 260,
            additionalKgRate: Number(cardAdditionalKg) || 160,
            expectedTransitDays: "2-3 Days",
          },
          {
            id: `${tariffId}-r3`,
            origin: "Any",
            destination: "Different Province",
            firstKgRate: Number(cardDiffProvince) || 320,
            additionalKgRate: Number(cardAdditionalKg) || 160,
            expectedTransitDays: "3-4 Days",
          },
        ],
        surcharges: [
          {
            id: "sur-fuel",
            name: "Fuel Surcharge",
            originalName: "Fuel Surcharge",
            type: "percentage",
            value: Number(cardFuel) || 0,
            applicability: "base_rate",
          },
          {
            id: "sur-gst",
            name: "GST / Sales Tax",
            originalName: "GST",
            type: "percentage",
            value: Number(cardGst) || 0,
            applicability: "total_rate",
          },
        ],
        versions: [
          {
            versionNumber: 1,
            effectiveFrom: cardEffectiveFrom,
            uploadedAt: new Date().toISOString(),
            changeNotes: "Initial rate card created manually",
            verifiedBy: "Operator",
          },
        ],
        rawExtraction: {
          extractedTextSnippet: "Manually registered rate card in Ship Asaan workspace.",
        },
        additionalData: [],
        dynamicRules: [
          {
            id: "rule-weight-rounding",
            ruleKey: "ceiling_half_kg",
            title: "Weight Rounding Ceiling",
            category: "weight_increment",
            formulaOrValue: "Ceil(weight, 0.5kg)",
            description: "Chargeable weight rounded up to nearest 0.5kg",
            enabled: true,
          },
        ],
        transformationsApplied: [],
        notes: "Direct user entry rate card",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddTariff?.(newTariff);
    } else {
      const newTariff: TariffInternational = {
        id: tariffId,
        partnerId,
        partnerName: cardPartner.trim(),
        name: cardName.trim(),
        service: cardService,
        effectiveFrom: cardEffectiveFrom,
        currency: cardCurrency || "USD",
        status: "active",
        reviewStatus: "user_verified",
        currentVersion: 1,
        fuelPercentage: Number(cardFuel) || 0,
        volumetricDivisor: Number(cardDivisor) || 5000,
        remoteAreaFee: 25,
        securityFee: 5,
        customsClearanceFee: 15,
        rates: [
          {
            id: `${tariffId}-r1`,
            zone: "Zone 1",
            service: cardService,
            weightFrom: 0.1,
            weightTo: 0.5,
            flatRate: 35,
          },
          {
            id: `${tariffId}-r2`,
            zone: "Zone 1",
            service: cardService,
            weightFrom: 0.51,
            weightTo: 100,
            ratePerKg: 18,
          },
          {
            id: `${tariffId}-r3`,
            zone: "Zone 2",
            service: cardService,
            weightFrom: 0.1,
            weightTo: 0.5,
            flatRate: 42,
          },
          {
            id: `${tariffId}-r4`,
            zone: "Zone 2",
            service: cardService,
            weightFrom: 0.51,
            weightTo: 100,
            ratePerKg: 24,
          },
          {
            id: `${tariffId}-r5`,
            zone: "Zone 3",
            service: cardService,
            weightFrom: 0.1,
            weightTo: 0.5,
            flatRate: 50,
          },
          {
            id: `${tariffId}-r6`,
            zone: "Zone 3",
            service: cardService,
            weightFrom: 0.51,
            weightTo: 100,
            ratePerKg: 28,
          },
        ],
        surcharges: [
          {
            id: "sur-fuel",
            name: "Fuel Surcharge",
            originalName: "Fuel Surcharge",
            type: "percentage",
            value: Number(cardFuel) || 0,
            applicability: "base_rate",
          },
        ],
        versions: [
          {
            versionNumber: 1,
            effectiveFrom: cardEffectiveFrom,
            uploadedAt: new Date().toISOString(),
            changeNotes: "Initial international rate card created manually",
            verifiedBy: "Operator",
          },
        ],
        rawExtraction: {
          extractedTextSnippet: "Manually registered international rate card in workspace.",
        },
        additionalData: [],
        dynamicRules: [],
        transformationsApplied: [],
        notes: "Direct user entry rate card",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddTariff?.(newTariff);
    }

    setShowAddModal(false);
    setCardName("");
    setCardPartner("");
  };

  // Filter tariffs
  const filteredTariffs = useMemo(() => {
    const list = isDomestic ? domesticTariffs : internationalTariffs;
    return list.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.partnerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.service.toLowerCase().includes(searchFilter.toLowerCase());

      const matchPartner = partnerFilter === "all" || t.partnerId === partnerFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;

      return matchSearch && matchPartner && matchStatus;
    });
  }, [isDomestic, domesticTariffs, internationalTariffs, searchFilter, partnerFilter, statusFilter]);

  // Find inspected tariff
  const inspectedTariff = useMemo(() => {
    if (!selectedTariffIdModal) return null;
    if (isDomestic) {
      return domesticTariffs.find((t) => t.id === selectedTariffIdModal) || null;
    } else {
      return internationalTariffs.find((t) => t.id === selectedTariffIdModal) || null;
    }
  }, [selectedTariffIdModal, isDomestic, domesticTariffs, internationalTariffs]);

  return (
    <div id="tariffs-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Tariffs & Rate Cards" : "International Master Tariffs"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              Raw + Normalized Intelligence
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit verified tariff tables, raw extraction source logs, deterministic formulas, and version histories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportAllTariffsToExcel(
                isDomestic ? domesticTariffs : internationalTariffs,
                activeWorkspace
              )
            }
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Export all active tariffs in current workspace to Excel workbook"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export All (.xlsx)</span>
          </button>

          {onAddTariff && (
            <button
              id="btn-open-add-rate-card"
              type="button"
              onClick={() => {
                setCardPartner(
                  (isDomestic ? domesticTariffs[0]?.partnerName : internationalTariffs[0]?.partnerName) || "Custom Carrier"
                );
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rate Card</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tariffs by name, courier, or service..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
          >
            <option value="all">All Couriers</option>
            {(isDomestic ? domesticTariffs : internationalTariffs).map((t) => (
              <option key={t.partnerId} value={t.partnerId}>
                {t.partnerName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="needs_review">Needs Review</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Tariffs Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-bold">
                <th className="py-3 px-4">Courier / Partner</th>
                <th className="py-3 px-4">Tariff Name</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4">Surcharges Summary</th>
                <th className="py-3 px-4 text-center">Inspect Intelligence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTariffs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No tariffs match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTariffs.map((tariff) => (
                  <tr key={tariff.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {tariff.partnerName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      <div>{tariff.name}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-stone-400 font-mono">
                          ID: {tariff.id}
                        </span>
                        {tariff.dynamicRules && tariff.dynamicRules.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-800 border border-purple-200 rounded">
                            <Zap className="w-2.5 h-2.5" />
                            {tariff.dynamicRules.length} rules
                          </span>
                        )}
                        {tariff.transformationsApplied && tariff.transformationsApplied.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-800 border border-blue-200 rounded">
                            <Calculator className="w-2.5 h-2.5" />
                            {tariff.transformationsApplied.length} normalized
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                        {tariff.service}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-700">
                      v{tariff.currentVersion}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tariff.reviewStatus === "user_verified"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : tariff.reviewStatus.includes("needs_review")
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {tariff.reviewStatus.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono">
                      {tariff.effectiveFrom}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-stone-500 font-mono">
                      {isDomestic ? (
                        <>
                          FAC: {(tariff as TariffDomestic).fuelPercentage}% • COD: {(tariff as TariffDomestic).codPercentage}% • GST: {(tariff as TariffDomestic).gstPercentage}%
                        </>
                      ) : (
                        <>
                          Fuel: {(tariff as TariffInternational).fuelPercentage}% • Divisor: {(tariff as TariffInternational).volumetricDivisor}
                        </>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenTariffModal(tariff.id)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors ${
                            isDomestic
                              ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                              : "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100"
                          }`}
                        >
                          Inspect Rules
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSingleTariffToExcel(tariff, isDomestic);
                          }}
                          className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Export ${tariff.name} to Excel (.xlsx)`}
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>.xlsx</span>
                        </button>
                        {onDeleteTariff && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete rate card "${tariff.name}"?`)) {
                                onDeleteTariff(tariff.id);
                              }
                            }}
                            className="p-1 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title={`Delete ${tariff.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: RAW VS NORMALIZED VS CALCULATION MODEL INSPECTOR */}
      {inspectedTariff && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-stone-900">
                    {inspectedTariff.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                    v{inspectedTariff.currentVersion}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inspectedTariff.reviewStatus === "user_verified"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {inspectedTariff.reviewStatus.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Courier: <span className="font-semibold text-stone-800">{inspectedTariff.partnerName}</span> • Service: {inspectedTariff.service} • Effective: {inspectedTariff.effectiveFrom}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportSingleTariffToExcel(inspectedTariff, isDomestic)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Export rate sheet to Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export Excel</span>
                </button>
                {onDeleteTariff && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete rate card "${inspectedTariff.name}"?`)) {
                        onDeleteTariff(inspectedTariff.id);
                        onCloseTariffModal();
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                {inspectedTariff.reviewStatus !== "user_verified" && (
                  <button
                    type="button"
                    onClick={() => onVerifyTariff(inspectedTariff.id)}
                    className="px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Verify Tariff</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onCloseTariffModal}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Tab Navigator (Raw vs Normalized vs Calculation Engine) */}
            <div className="flex items-center border-b border-stone-200 px-5 bg-white text-xs font-bold gap-4 select-none overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab("normalized")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "normalized"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Normalized Data Model</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("dynamic_rules")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "dynamic_rules"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>2. Dynamic Rules ({inspectedTariff.dynamicRules?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("transformations")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "transformations"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>3. Normalizations ({inspectedTariff.transformationsApplied?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("raw")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "raw"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>4. Raw Extraction</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("calc_model")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "calc_model"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>5. Calculation Model</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("custom_fields")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "custom_fields"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>6. Preserved Custom Fields ({inspectedTariff.additionalData.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("versions")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  modalTab === "versions"
                    ? isDomestic
                      ? "border-purple-800 text-purple-900"
                      : "border-orange-600 text-orange-900"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>7. Versions ({inspectedTariff.versions.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* TAB 1: NORMALIZED VIEW */}
              {modalTab === "normalized" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Standardized Rate Structure
                    </h3>
                    {isDomestic ? (
                      <table className="w-full text-left border border-stone-200 rounded-lg overflow-hidden">
                        <thead className="bg-stone-100 font-bold text-stone-700">
                          <tr>
                            <th className="p-2.5">Sector / Destination</th>
                            <th className="p-2.5 text-right">First 1 KG</th>
                            <th className="p-2.5 text-right">Addl 1 KG</th>
                            <th className="p-2.5">Transit SLA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {(inspectedTariff as TariffDomestic).rates.map((r) => (
                            <tr key={r.id}>
                              <td className="p-2.5 font-semibold text-stone-800">{r.destination}</td>
                              <td className="p-2.5 text-right font-mono">PKR {r.firstKgRate}</td>
                              <td className="p-2.5 text-right font-mono">PKR {r.additionalKgRate}</td>
                              <td className="p-2.5 text-stone-500">{r.expectedTransitDays || "1-2 Days"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (inspectedTariff as TariffInternational).rateMatrix ? (
                      <RateMatrixView
                        matrix={(inspectedTariff as TariffInternational).rateMatrix!}
                        editable={false}
                        currency={inspectedTariff.currency}
                      />
                    ) : (
                      <table className="w-full text-left border border-stone-200 rounded-lg overflow-hidden">
                        <thead className="bg-stone-100 font-bold text-stone-700">
                          <tr>
                            <th className="p-2.5">Zone</th>
                            <th className="p-2.5">Destination Territory</th>
                            <th className="p-2.5">Weight Range</th>
                            <th className="p-2.5 text-center">Basis</th>
                            <th className="p-2.5 text-right">Rate ({inspectedTariff.currency})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                          {(inspectedTariff as TariffInternational).rates.slice(0, 50).map((r) => {
                            const isPerKg = r.pricingType === "per_kg" || (!r.flatRate && r.ratePerKg !== undefined);
                            return (
                              <tr key={r.id}>
                                <td className="p-2.5 font-bold text-stone-800">{r.zone}</td>
                                <td className="p-2.5 text-stone-600">{r.countryGroup || "Worldwide"}</td>
                                <td className="p-2.5 font-mono">{r.weightFrom} – {r.weightTo} kg</td>
                                <td className="p-2.5 text-center">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    isPerKg
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-purple-100 text-purple-900 border border-purple-200"
                                  }`}>
                                    {isPerKg ? "PER KG" : "Flat"}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                                  {isPerKg
                                    ? `${inspectedTariff.currency} ${(r.ratePerKg || 0).toLocaleString()}/kg`
                                    : `Flat ${inspectedTariff.currency} ${(r.flatRate || 0).toLocaleString()}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Normalized Surcharges */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                      Standardized Surcharges & Fees
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {inspectedTariff.surcharges.map((sc) => (
                        <div key={sc.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                          <p className="font-bold text-stone-800">{sc.name}</p>
                          <p className="text-[10px] text-stone-400">Original: "{sc.originalName}"</p>
                          <p className="text-sm font-mono font-bold text-stone-900 mt-1">
                            {sc.type === "percentage" ? `${sc.value}%` : `Fixed PKR ${sc.value}`}
                          </p>
                          <p className="text-[10px] text-stone-500 mt-0.5">Applies to: {sc.applicability}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC RULES (FLEXIBLE SYSTEM) */}
              {modalTab === "dynamic_rules" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-stone-600 text-[11px]">
                      Dynamic operational rules, custom surcharges, return-to-origin clauses, and condition triggers preserved flexibly:
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                      {inspectedTariff.dynamicRules?.length || 0} Dynamic Rules Configured
                    </span>
                  </div>

                  {!inspectedTariff.dynamicRules || inspectedTariff.dynamicRules.length === 0 ? (
                    <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center text-stone-400 italic">
                      No custom dynamic rules configured for this tariff agreement.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {inspectedTariff.dynamicRules.map((rule, idx) => (
                        <div
                          key={rule.id || idx}
                          className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                  rule.category === "surcharge"
                                    ? "bg-amber-100 text-amber-800"
                                    : rule.category === "restriction"
                                    ? "bg-red-100 text-red-800"
                                    : rule.category === "weight_increment"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {rule.category.replace("_", " ")}
                              </span>
                              <span className="font-bold text-stone-900">{rule.title}</span>
                              <code className="text-[10px] text-stone-400 bg-white px-1.5 py-0.5 rounded font-mono border border-stone-200">
                                {rule.ruleKey}
                              </code>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                rule.enabled !== false
                                  ? "bg-green-100 text-green-800"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {rule.enabled !== false ? "Active" : "Disabled"}
                            </span>
                          </div>

                          <p className="text-xs text-stone-600">{rule.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                            {rule.formulaOrValue && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-stone-500">Formula / Value:</span>
                                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200 text-purple-900">
                                  {rule.formulaOrValue}
                                </span>
                              </div>
                            )}
                            {rule.condition && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-stone-500">Condition:</span>
                                <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-700">
                                  {rule.condition}
                                </span>
                              </div>
                            )}
                          </div>

                          {rule.sourceText && (
                            <p className="text-[10px] text-stone-400 italic pt-0.5">
                              Contract Source: "{rule.sourceText}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TRANSFORMATIONS & NORMALIZATIONS */}
              {modalTab === "transformations" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-stone-600 text-[11px]">
                      Mathematical unit conversions and scale standardizations performed during AI extraction:
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                      {inspectedTariff.transformationsApplied?.length || 0} Normalizations
                    </span>
                  </div>

                  {!inspectedTariff.transformationsApplied || inspectedTariff.transformationsApplied.length === 0 ? (
                    <div className="p-6 bg-stone-50 rounded-xl border border-stone-200 text-center text-stone-400 italic">
                      Standard increment structure. No custom mathematical unit normalizations required.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {inspectedTariff.transformationsApplied.map((trans, idx) => (
                        <div
                          key={trans.id || idx}
                          className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-2 bg-white rounded-lg border border-stone-200">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                                Original Shared Format
                              </span>
                              <span className="font-mono font-bold text-amber-800">
                                {trans.originalFormat}
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-stone-200">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                                Normalized System Standard
                              </span>
                              <span className="font-mono font-bold text-green-800">
                                {trans.normalizedFormat}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-stone-500 pt-1">
                            <span className="font-semibold text-stone-700">Conversion Rationale: </span>
                            {trans.reasoning}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: RAW EXTRACTION */}
              {modalTab === "raw" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <p className="font-bold">Authoritative Raw Extraction Preserved</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      This represents the exact text, tables, and clauses extracted from the source document before normalization.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-stone-700 mb-1">Source Snippet / OCR Text:</p>
                    <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-60">
                      {inspectedTariff.rawExtraction.extractedTextSnippet || "No raw text snippet available."}
                    </pre>
                  </div>
                  {inspectedTariff.rawExtraction.detectedHeaders && inspectedTariff.rawExtraction.detectedHeaders.length > 0 && (
                    <div>
                      <p className="font-bold text-stone-700 mb-1">Detected Headers:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectedTariff.rawExtraction.detectedHeaders.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 bg-stone-200 text-stone-800 rounded font-mono text-[10px]">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CALCULATION MODEL */}
              {modalTab === "calc_model" && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                    <p className="font-bold">Deterministic Calculation Specification</p>
                    <p className="text-[11px] text-purple-800 mt-0.5">
                      How the deterministic mathematical engine evaluates rates under this tariff.
                    </p>
                  </div>
                  <div className="space-y-2 text-stone-700">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <p className="font-bold text-stone-900">1. Base Freight Computation Rule</p>
                      <p className="text-[11px]">
                        {isDomestic
                          ? "Base Rate = FirstKgRate + Math.ceil(ChargeableWeight - 1.0) × AdditionalKgRate"
                          : `ChargeableWeight = Math.max(ScaleWeight, (L × W × H) / ${(inspectedTariff as TariffInternational).volumetricDivisor})`}
                      </p>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <p className="font-bold text-stone-900">2. Surcharges & Taxes Arithmetic</p>
                      <p className="text-[11px]">
                        {isDomestic
                          ? `Fuel = Base × ${(inspectedTariff as TariffDomestic).fuelPercentage}%; COD = Math.max(COD_Amount × ${(inspectedTariff as TariffDomestic).codPercentage}%, ${(inspectedTariff as TariffDomestic).codFixedMinimum}); GST = (Base + Fuel) × ${(inspectedTariff as TariffDomestic).gstPercentage}%`
                          : `Fuel = Base × ${(inspectedTariff as TariffInternational).fuelPercentage}%; Security = Fixed PKR ${(inspectedTariff as TariffInternational).securityFee}; Remote = Fixed PKR ${(inspectedTariff as TariffInternational).remoteAreaFee}`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CUSTOM / UNMAPPED FIELDS */}
              {modalTab === "custom_fields" && (
                <div className="space-y-3">
                  <p className="text-stone-600 text-[11px]">
                    Information extracted from the original tariff that does not fit standard comparison columns is never discarded. It is preserved below:
                  </p>
                  {inspectedTariff.additionalData.length === 0 ? (
                    <p className="text-stone-400 italic">No additional custom fields recorded for this tariff.</p>
                  ) : (
                    <div className="space-y-2">
                      {inspectedTariff.additionalData.map((af) => (
                        <div key={af.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{af.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-200 text-stone-700">
                              {af.category}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-stone-800 mt-1">{af.value}</p>
                          {af.ruleNotes && (
                            <p className="text-[10px] text-stone-500 mt-0.5">{af.ruleNotes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: VERSIONS & AUDIT */}
              {modalTab === "versions" && (
                <div className="space-y-3">
                  <p className="text-stone-600 text-[11px]">
                    Audit trail of all published revisions for this partner tariff agreement:
                  </p>
                  <div className="space-y-2">
                    {inspectedTariff.versions.map((ver) => (
                      <div key={ver.versionNumber} className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">Version {ver.versionNumber}</span>
                          <span className="text-[10px] font-mono text-stone-500">
                            Effective: {ver.effectiveFrom}
                          </span>
                        </div>
                        <p className="text-xs text-stone-700 mt-1">{ver.changeNotes}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-stone-400 font-mono">
                          <span>Uploaded: {ver.uploadedAt}</span>
                          {ver.verifiedBy && <span>Verified by: {ver.verifiedBy}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ADD NEW RATE CARD */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">
                  {isDomestic ? "Add Domestic Rate Card" : "Add International Rate Card"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Register a carrier agreement with customized baseline rates, slabs, and surcharge rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRateCard} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Tariff Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isDomestic ? "e.g. TCS Overnight 2026" : "e.g. DHL Express Worldwide 2026"}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Courier / Partner *
                  </label>
                  <input
                    type="text"
                    required
                    list="partner-suggestions"
                    placeholder="e.g. TCS, Leopards, DHL"
                    value={cardPartner}
                    onChange={(e) => setCardPartner(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <datalist id="partner-suggestions">
                    {(isDomestic ? domesticTariffs : internationalTariffs).map((t) => (
                      <option key={t.id} value={t.partnerName} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Service Level
                  </label>
                  <input
                    type="text"
                    required
                    value={cardService}
                    onChange={(e) => setCardService(e.target.value)}
                    placeholder="e.g. Overnight Express"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    required
                    value={cardEffectiveFrom}
                    onChange={(e) => setCardEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>
              </div>

              {isDomestic ? (
                <>
                  <div className="pt-2 border-t border-stone-100">
                    <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                      Surcharge Defaults
                    </span>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Fuel (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cardFuel}
                          onChange={(e) => setCardFuel(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">GST (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cardGst}
                          onChange={(e) => setCardGst(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">COD (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cardCod}
                          onChange={(e) => setCardCod(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100">
                    <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                      Base Rates (1st kg - PKR)
                    </span>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Within City</label>
                        <input
                          type="number"
                          value={cardWithinCity}
                          onChange={(e) => setCardWithinCity(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Same Province</label>
                        <input
                          type="number"
                          value={cardSameProvince}
                          onChange={(e) => setCardSameProvince(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Diff Province</label>
                        <input
                          type="number"
                          value={cardDiffProvince}
                          onChange={(e) => setCardDiffProvince(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-[11px] text-stone-600 mb-1">
                        Additional kg Rate (PKR / kg)
                      </label>
                      <input
                        type="number"
                        value={cardAdditionalKg}
                        onChange={(e) => setCardAdditionalKg(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-2 border-t border-stone-100">
                    <span className="font-bold text-stone-800 text-[11px] uppercase tracking-wider">
                      International Parameters
                    </span>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Fuel Surcharge (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={cardFuel}
                          onChange={(e) => setCardFuel(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Volumetric Divisor</label>
                        <input
                          type="number"
                          value={cardDivisor}
                          onChange={(e) => setCardDivisor(parseInt(e.target.value, 10) || 5000)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-stone-600 mb-1">Currency</label>
                        <select
                          value={cardCurrency}
                          onChange={(e) => setCardCurrency(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="PKR">PKR (₨)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-900 hover:bg-purple-950 text-white rounded-xl font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  Save Rate Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
