import React, { useState, useMemo } from "react";
import {
  GitCompare,
  ArrowUpDown,
  Check,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  WorkspaceType,
  TariffDomestic,
  TariffInternational,
  DomesticCity,
  InternationalCountryZone,
  CalculationDomesticResult,
  CalculationInternationalResult,
} from "../types";
import { TariffCalculationEngine } from "../engine/calculationEngine";
import { lookupWorldCountry } from "../data/worldCountriesData";

interface ComparisonViewProps {
  activeWorkspace: WorkspaceType;
  domesticTariffs: TariffDomestic[];
  internationalTariffs: TariffInternational[];
  domesticCities: DomesticCity[];
  internationalCountries: InternationalCountryZone[];
  onOpenTariffDetails: (tariffId: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  activeWorkspace,
  domesticTariffs,
  internationalTariffs,
  domesticCities,
  internationalCountries,
  onOpenTariffDetails,
}) => {
  const isDomestic = activeWorkspace === "domestic";

  // Domestic parameters
  const [domOrigin, setDomOrigin] = useState("Lahore");
  const [domDest, setDomDest] = useState("Karachi");
  const [domWeight, setDomWeight] = useState(3.0);
  const [domCod, setDomCod] = useState(4500);

  // International parameters
  const [intlDestCountry, setIntlDestCountry] = useState("United States");
  const [intlWeight, setIntlWeight] = useState(4.0);
  const [intlLength, setIntlLength] = useState(30);
  const [intlWidth, setIntlWidth] = useState(20);
  const [intlHeight, setIntlHeight] = useState(15);
  const [intlRemote, setIntlRemote] = useState(false);

  // Expanded row index for details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calculate domestic comparison items
  const domComparisons: CalculationDomesticResult[] = useMemo(() => {
    if (!isDomestic) return [];
    return domesticTariffs
      .filter((t) => t.status === "active")
      .map((tariff) =>
        TariffCalculationEngine.calculateDomestic(
          tariff,
          {
            originCity: domOrigin,
            destinationCity: domDest,
            actualWeightKg: domWeight,
            codAmountPkr: domCod,
          },
          domesticCities
        )
      )
      .sort((a, b) => a.totalPayable - b.totalPayable);
  }, [isDomestic, domesticTariffs, domOrigin, domDest, domWeight, domCod, domesticCities]);

  // Calculate international comparison items
  const intlComparisons: CalculationInternationalResult[] = useMemo(() => {
    if (isDomestic) return [];
    return internationalTariffs
      .filter((t) => t.status === "active")
      .map((tariff) =>
        TariffCalculationEngine.calculateInternational(tariff, {
          originCountry: "Pakistan",
          destinationCountry: intlDestCountry,
          actualWeightKg: intlWeight,
          lengthCm: intlLength,
          widthCm: intlWidth,
          heightCm: intlHeight,
          isRemoteArea: intlRemote,
        })
      )
      .sort((a, b) => a.totalPayable - b.totalPayable);
  }, [
    isDomestic,
    internationalTariffs,
    intlDestCountry,
    intlWeight,
    intlLength,
    intlWidth,
    intlHeight,
    intlRemote,
    internationalCountries,
  ]);

  return (
    <div id="comparison-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Couriers Fair Comparison" : "International Air Carriers Fair Comparison"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              All Charges Normalized
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Compares true estimated payable amounts (Base + Fuel + COD + Taxes) rather than misleading raw base freight.
          </p>
        </div>
      </div>

      {/* Shipment Control Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
          Configure Test Consignment
        </p>

        {isDomestic ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Origin City / Area ({domesticCities.length})
              </label>
              <select
                value={domOrigin}
                onChange={(e) => setDomOrigin(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
              >
                {domesticCities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.deliveryCode ? `• [${c.deliveryCode}]` : ""} ({c.province})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Destination City / Area ({domesticCities.length})
              </label>
              <select
                value={domDest}
                onChange={(e) => setDomDest(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
              >
                {domesticCities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.deliveryCode ? `• [${c.deliveryCode}]` : ""} ({c.province} - {c.zoneTier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={domWeight}
                onChange={(e) => setDomWeight(parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">COD Amount (PKR)</label>
              <input
                type="number"
                step="500"
                min="0"
                value={domCod}
                onChange={(e) => setDomCod(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Destination Country ({internationalCountries.length} Worldwide)
              </label>
              <select
                value={intlDestCountry}
                onChange={(e) => setIntlDestCountry(e.target.value)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
              >
                {internationalCountries.map((c) => (
                  <option key={c.countryCode} value={c.countryName}>
                    {c.countryName} ({c.countryCode} / {c.alpha3} • ISO {c.numericCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={intlWeight}
                onChange={(e) => setIntlWeight(parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Dimensions (L×W×H cm)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="L"
                  value={intlLength}
                  onChange={(e) => setIntlLength(parseFloat(e.target.value) || 0)}
                  className="w-1/3 text-xs bg-stone-50 border border-stone-300 rounded-lg px-1.5 py-1.5 text-center font-mono"
                />
                <input
                  type="number"
                  placeholder="W"
                  value={intlWidth}
                  onChange={(e) => setIntlWidth(parseFloat(e.target.value) || 0)}
                  className="w-1/3 text-xs bg-stone-50 border border-stone-300 rounded-lg px-1.5 py-1.5 text-center font-mono"
                />
                <input
                  type="number"
                  placeholder="H"
                  value={intlHeight}
                  onChange={(e) => setIntlHeight(parseFloat(e.target.value) || 0)}
                  className="w-1/3 text-xs bg-stone-50 border border-stone-300 rounded-lg px-1.5 py-1.5 text-center font-mono"
                />
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={intlRemote}
                  onChange={(e) => setIntlRemote(e.target.checked)}
                  className="rounded text-purple-700 w-4 h-4"
                />
                <span className="text-xs font-semibold text-stone-700">Remote / Extended Area</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <p className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Ranked Couriers by Total Comparable Amount (Low to High)
          </p>
          <span className="text-[11px] text-stone-500 font-mono">
            {isDomestic ? `${domComparisons.length} Active Domestic Couriers` : `${intlComparisons.length} Active International Carriers`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-bold">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Courier / Partner</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4 text-right">Base Freight</th>
                {isDomestic ? (
                  <>
                    <th className="py-3 px-4 text-right">Fuel (FAC)</th>
                    <th className="py-3 px-4 text-right">COD Fee</th>
                    <th className="py-3 px-4 text-right">Tax (GST)</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-right">Fuel (FSC)</th>
                    <th className="py-3 px-4 text-right">Security / Fees</th>
                    <th className="py-3 px-4 text-right">Clearance</th>
                  </>
                )}
                <th className="py-3 px-4 text-right font-black text-stone-900 bg-stone-100">
                  Total Payable
                </th>
                <th className="py-3 px-4 text-center">Audit / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isDomestic
                ? domComparisons.map((row, idx) => {
                    const isBest = idx === 0;
                    const isExpanded = expandedId === row.id;

                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className={`hover:bg-purple-50/30 transition-colors ${
                            isBest ? "bg-lime-50/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            {isBest ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-lime-400 text-purple-950 font-black text-xs">
                                1
                              </span>
                            ) : (
                              <span className="font-mono text-stone-400 font-bold">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">{row.partnerName}</span>
                              {isBest && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-800">
                                  Lowest
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-400">Sector: {row.destinationZoneType}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium text-[11px]">
                              {row.service}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            PKR {row.baseRate.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {row.fuelAmount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {row.codFee.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {row.gstAmount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-stone-900 bg-stone-50 text-sm">
                            PKR {row.totalPayable.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : row.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Breakdown</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details */}
                        {isExpanded && (
                          <tr className="bg-stone-50 border-b border-stone-200">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-stone-700">Detailed Rate Calculation Log:</span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenTariffDetails(row.tariffId)}
                                    className="text-purple-700 hover:underline font-semibold"
                                  >
                                    Inspect Source Tariff ➔
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                  {row.chargesBreakdown.map((item, bIdx) => (
                                    <div key={bIdx} className="p-2 bg-stone-50 rounded border border-stone-200">
                                      <p className="font-bold text-stone-800">{item.name}</p>
                                      <p className="text-[10px] text-stone-600">{item.rateApplied}</p>
                                      <p className="font-mono font-bold text-stone-900 mt-1">
                                        PKR {item.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                : intlComparisons.map((row, idx) => {
                    const isBest = idx === 0;
                    const isExpanded = expandedId === row.id;

                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          className={`hover:bg-orange-50/30 transition-colors ${
                            isBest ? "bg-lime-50/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            {isBest ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-lime-400 text-purple-950 font-black text-xs">
                                1
                              </span>
                            ) : (
                              <span className="font-mono text-stone-400 font-bold">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">{row.partnerName}</span>
                              {isBest && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-800">
                                  Lowest
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-400">
                              Zone: {row.destinationZone} • Divisor: {row.volumetricDivisorUsed}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium text-[11px]">
                              {row.service}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            PKR {row.baseRate.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {row.fuelSurcharge.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {(row.securityFee + row.remoteAreaSurcharge).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                            PKR {row.customsFee.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-stone-900 bg-stone-50 text-sm">
                            PKR {row.totalPayable.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : row.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-orange-600 hover:text-orange-800 border border-orange-200 rounded-md hover:bg-orange-50 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Breakdown</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-stone-50 border-b border-stone-200">
                            <td colSpan={9} className="p-4">
                              <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-stone-700">Detailed International Air Freight Audit:</span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenTariffDetails(row.tariffId)}
                                    className="text-orange-600 hover:underline font-semibold"
                                  >
                                    Inspect Rate Card ➔
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                  {row.chargesBreakdown.map((item, bIdx) => (
                                    <div key={bIdx} className="p-2 bg-stone-50 rounded border border-stone-200">
                                      <p className="font-bold text-stone-800">{item.name}</p>
                                      <p className="text-[10px] text-stone-600">{item.rateApplied}</p>
                                      <p className="font-mono font-bold text-stone-900 mt-1">
                                        PKR {item.amount.toLocaleString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
