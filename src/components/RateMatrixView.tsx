import React, { useState, useMemo } from "react";
import { RateMatrixData } from "../types";
import { Search, Filter, Download, ArrowUpDown, Globe } from "lucide-react";

interface RateMatrixViewProps {
  matrix: RateMatrixData;
  editable?: boolean;
  currency?: string;
  onCellChange?: (weightTo: number, colKey: string, newRate: number) => void;
  onPricingTypeChange?: (weightTo: number, newType: "flat" | "per_kg") => void;
}

export const RateMatrixView: React.FC<RateMatrixViewProps> = ({
  matrix,
  editable = false,
  currency = "PKR",
  onCellChange,
  onPricingTypeChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortByWeightAsc, setSortByWeightAsc] = useState(true);

  // Group columns for quick category filtering
  const filteredColumns = useMemo(() => {
    let cols = matrix.columns || [];

    if (activeCategory === "americas") {
      cols = cols.filter((c) =>
        c.countries.some((code) => ["US", "PR", "CA", "MX", "BR", "AR", "CL"].includes(code))
      );
    } else if (activeCategory === "europe") {
      cols = cols.filter((c) =>
        c.countries.some((code) =>
          ["GB", "DE", "FR", "NL", "BE", "CH", "AT", "IT", "SE", "ES", "NO", "DK", "PL", "IE", "PT", "GR"].includes(code)
        )
      );
    } else if (activeCategory === "gcc") {
      cols = cols.filter((c) =>
        c.countries.some((code) => ["SA", "AE", "QA", "KW", "BH", "OM", "EG", "TR", "JO", "LB"].includes(code))
      );
    } else if (activeCategory === "asia") {
      cols = cols.filter((c) =>
        c.countries.some((code) =>
          ["CN", "JP", "KR", "SG", "MY", "HK", "TW", "TH", "IN", "PH", "AU", "NZ"].includes(code)
        )
      );
    } else if (activeCategory === "zones") {
      cols = cols.filter((c) => /zone|grp/i.test(c.key) || c.countries.length > 2);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      cols = cols.filter(
        (c) =>
          c.key.toLowerCase().includes(q) ||
          c.label.toLowerCase().includes(q) ||
          c.countries.some((code) => code.toLowerCase().includes(q))
      );
    }

    return cols;
  }, [matrix.columns, activeCategory, searchTerm]);

  // Sort rows by weight
  const sortedRows = useMemo(() => {
    const rows = [...(matrix.rows || [])];
    return rows.sort((a, b) =>
      sortByWeightAsc ? a.weightTo - b.weightTo : b.weightTo - a.weightTo
    );
  }, [matrix.rows, sortByWeightAsc]);

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const headers = ["Weight From (kg)", "Weight To (kg)", ...matrix.columns.map((c) => c.label)];
    const csvRows = [headers.join(",")];

    for (const row of matrix.rows) {
      const line = [
        row.weightFrom,
        row.weightTo,
        ...matrix.columns.map((c) => row.rates[c.key] ?? ""),
      ];
      csvRows.push(line.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tariff_Rate_Matrix_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRatesCount = (matrix.rows?.length || 0) * (matrix.columns?.length || 0);

  return (
    <div className="space-y-3 bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
      {/* Matrix Controls & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-900 rounded-xl border border-purple-200">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                2D Express Rate Matrix
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 text-lime-900 border border-lime-300">
                {matrix.columns?.length || 0} Destination Columns × {matrix.rows?.length || 0} Weight Slabs
              </span>
              {matrix.maxFlatWeightKg && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Base Slabs: 0.01–{matrix.maxFlatWeightKg}kg + Excess Tiers
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {totalRatesCount.toLocaleString()} total rates parsed with exact row-by-column cross-tabular precision ({currency})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortByWeightAsc(!sortByWeightAsc)}
            className="text-xs px-2.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 flex items-center gap-1.5 transition-colors font-medium"
            title="Sort weights ascending/descending"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortByWeightAsc ? "Ascending (0.5 → 70kg)" : "Descending (70 → 0.5kg)"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="text-xs px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-lg flex items-center gap-1.5 transition-colors font-bold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search destination input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search column (e.g. CA, US, Germany, Zone 2)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-purple-600 focus:bg-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Region Filter Chips */}
        {matrix.columns?.some((c) => c.countries && c.countries.length > 0 && c.countries[0] !== c.key) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {[
              { id: "all", label: `All (${matrix.columns?.length || 0})` },
              { id: "americas", label: "Americas" },
              { id: "europe", label: "Europe" },
              { id: "gcc", label: "Middle East" },
              { id: "asia", label: "Asia Pacific" },
              { id: "zones", label: "Grouped Zones" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-purple-900 text-white font-bold"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2D Interactive Grid */}
      <div className="relative border border-stone-200 rounded-xl overflow-hidden shadow-inner">
        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Sticky Table Header */}
            <thead className="bg-stone-100/95 backdrop-blur-xs sticky top-0 z-30 shadow-xs">
              <tr className="border-b border-stone-200 text-stone-700">
                {/* Fixed Sticky Weight Column */}
                <th className="sticky left-0 top-0 z-40 bg-stone-200/95 backdrop-blur-xs px-3.5 py-2.5 text-left font-extrabold text-stone-900 min-w-[145px] border-r border-stone-300 tracking-tight text-[11px]">
                  WEIGHT FROM – TO (KG)
                </th>

                {/* Destination Column Headers */}
                {filteredColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-right font-bold min-w-[110px] border-r border-stone-200 whitespace-nowrap bg-stone-100/90"
                    title={col.label}
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-purple-950 font-bold tracking-tight">
                        {col.key}
                      </span>
                      <span className="text-[10px] font-normal text-stone-500 max-w-[120px] truncate">
                        {col.label}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Matrix Body */}
            <tbody className="divide-y divide-stone-200 font-mono">
              {sortedRows.map((row, rIdx) => {
                const span = row.weightTo - row.weightFrom;
                // If row.pricingType is explicitly specified, respect it completely.
                // Otherwise, only classify as per_kg if span >= 5 AND weightFrom >= 70.
                // A 1kg increment (like 69-70kg) has span <= 1.05 and is ALWAYS Flat.
                const isPerKg = row.pricingType
                  ? row.pricingType === "per_kg"
                  : span >= 5 && row.weightFrom >= 70;

                return (
                  <tr
                    key={rIdx}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      isPerKg ? "bg-amber-50/60" : rIdx % 2 === 0 ? "bg-white" : "bg-stone-50/30"
                    }`}
                  >
                    {/* Sticky Weight Range Header */}
                    <td className="sticky left-0 z-20 px-3 py-1.5 font-bold text-stone-900 bg-stone-100/95 border-r border-stone-300 whitespace-nowrap shadow-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs tracking-tight">
                          {row.weightFrom.toFixed(2)} – {row.weightTo.toFixed(2)} kg
                        </span>
                        {/* Interactive or static pricing badge */}
                        <button
                          type="button"
                          disabled={!editable || !onPricingTypeChange}
                          onClick={() => {
                            if (editable && onPricingTypeChange) {
                              onPricingTypeChange(row.weightTo, isPerKg ? "flat" : "per_kg");
                            }
                          }}
                          title={
                            editable && onPricingTypeChange
                              ? `Click to toggle this row to ${isPerKg ? "Flat" : "PER KG"}`
                              : isPerKg
                              ? "Per-Kilogram Unit Rate"
                              : "Flat Package Slab Rate"
                          }
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all flex items-center gap-1 ${
                            isPerKg
                              ? "bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs"
                              : "bg-stone-200/80 text-stone-700 border border-stone-300/60"
                          } ${
                            editable && onPricingTypeChange
                              ? "cursor-pointer hover:scale-105 active:scale-95 hover:border-purple-400"
                              : ""
                          }`}
                        >
                          <span>{isPerKg ? "PER KG" : "Flat"}</span>
                          {editable && onPricingTypeChange && (
                            <span className="text-[8px] opacity-50">⇄</span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Rate Cells */}
                    {filteredColumns.map((col) => {
                      const val = row.rates[col.key];
                      const hasVal = val !== undefined && val !== null;

                      return (
                        <td
                          key={col.key}
                          className={`px-2.5 py-1 text-right border-r border-stone-200/60 ${
                            isPerKg ? "text-amber-950 font-medium" : "text-stone-800"
                          }`}
                        >
                          {editable && onCellChange ? (
                            <input
                              type="number"
                              value={hasVal ? val : ""}
                              placeholder="—"
                              onChange={(e) => {
                                const num = parseFloat(e.target.value) || 0;
                                onCellChange(row.weightTo, col.key, num);
                              }}
                              className="w-full text-right bg-transparent hover:bg-white focus:bg-white border border-transparent focus:border-purple-600 rounded px-1.5 py-0.5 text-xs font-mono text-stone-800"
                            />
                          ) : hasVal ? (
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-xs">
                                {val.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                              {isPerKg && (
                                <span className="text-[8px] text-amber-700 font-sans tracking-tight">/kg</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-300 select-none">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matrix Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-900 inline-block"></span>
            <span>Flat Package Slabs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Per-KG Excess Tiers</span>
          </div>
          {editable && onPricingTypeChange && (
            <span className="text-[10px] text-purple-900 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 font-medium">
              💡 Click any [Flat] or [PER KG] badge to toggle pricing mode
            </span>
          )}
        </div>
        <span>
          Showing {filteredColumns.length} of {matrix.columns.length} destination columns
        </span>
      </div>
    </div>
  );
};
