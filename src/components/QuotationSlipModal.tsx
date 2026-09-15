import React, { useRef } from "react";
import {
  Printer,
  FileSpreadsheet,
  X,
  Building2,
  Package,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  CalculationDomesticResult,
  CalculationInternationalResult,
  WorkspaceType,
} from "../types";
import { exportQuotationSlipToExcel } from "../utils/excelExporter";

interface QuotationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationDomesticResult | CalculationInternationalResult;
  allResults?: (CalculationDomesticResult | CalculationInternationalResult)[];
  activeWorkspace?: WorkspaceType;
  clientName?: string;
  isDomestic?: boolean;
  origin?: string;
  destination?: string;
  actualWeightKg?: number;
  chargeableWeightKg?: number;
  dimensions?: { length: number; width: number; height: number };
  codAmount?: number;
}

export const QuotationSlipModal: React.FC<QuotationSlipModalProps> = ({
  isOpen,
  onClose,
  result,
  allResults = [],
  activeWorkspace,
  clientName = "Valued Customer",
  isDomestic: isDomesticProp,
  origin: originProp,
  destination: destinationProp,
  actualWeightKg: actualWeightKgProp,
  chargeableWeightKg: chargeableWeightKgProp,
  dimensions,
  codAmount: codAmountProp,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const isDomestic =
    activeWorkspace !== undefined
      ? activeWorkspace === "domestic"
      : isDomesticProp !== undefined
      ? isDomesticProp
      : "origin" in result && "destination" in result;

  const origin =
    originProp ||
    ("origin" in result
      ? (result as CalculationDomesticResult).origin
      : "Pakistan");

  const destination =
    destinationProp ||
    ("destination" in result
      ? (result as CalculationDomesticResult).destination
      : (result as CalculationInternationalResult).destinationCountry);

  const actualWeightKg = actualWeightKgProp ?? result.actualWeightKg;
  const chargeableWeightKg = chargeableWeightKgProp ?? result.chargeableWeightKg;
  const codAmount =
    codAmountProp ??
    ("codAmount" in result
      ? (result as CalculationDomesticResult).codAmount
      : 0);

  const selectedResult = result;
  const tariffName =
    selectedResult.sourceDocName || `${selectedResult.partnerName} Master Tariff`;
  const transitDays =
    (selectedResult as any).expectedTransitDays ||
    (isDomestic ? "24-48 Hours Delivery" : "3-5 Business Days Air Express");

  const quoteDate = new Date().toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const quoteTime = new Date().toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const quoteRef = `QT-${isDomestic ? "DOM" : "INTL"}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportQuotationSlipToExcel({
      quoteRef,
      isDomestic,
      origin,
      destination,
      actualWeightKg,
      chargeableWeightKg,
      dimensions,
      codAmount,
      selectedResult: result,
      allResults,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden print:max-h-none print:border-none print:shadow-none print:w-full">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-black text-sm shadow-2xs">
              SA
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">Official Quotation Slip</h2>
              <p className="text-[11px] text-stone-500 font-mono">Ref: {quoteRef}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Document */}
        <div
          ref={printContentRef}
          className="p-6 overflow-y-auto space-y-5 text-stone-800 print:p-8 print:overflow-visible"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-stone-900">
                  SHIP ASAAN
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white uppercase tracking-wider">
                  Tariff Intelligence
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Deterministic Logistics & Freight Tariff Computation Engine
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                Official Freight Quote
              </span>
              <p className="text-xs font-mono text-stone-900 font-bold mt-2">
                Ref: {quoteRef}
              </p>
              <p className="text-[11px] text-stone-500">
                {quoteDate} at {quoteTime}
              </p>
            </div>
          </div>

          {/* Client & Route Grid */}
          <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Origin / Consignor
              </span>
              <p className="font-bold text-sm text-stone-900">{origin}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Dispatch Station • {isDomestic ? "Domestic Hub" : "Origin Hub (Pakistan)"}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Destination / Consignee
              </span>
              <p className="font-bold text-sm text-stone-900">{destination}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Delivery Sector: <span className="font-semibold text-stone-700">{selectedResult.destinationZoneType}</span>
              </p>
            </div>
          </div>

          {/* Package Weight & Specifications */}
          <div className="grid grid-cols-4 gap-3 text-center border border-stone-200 rounded-xl p-3 bg-white">
            <div className="p-2 border-r border-stone-100">
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                Actual Weight
              </span>
              <span className="text-sm font-bold font-mono text-stone-900">
                {actualWeightKg.toFixed(2)} kg
              </span>
            </div>

            <div className="p-2 border-r border-stone-100">
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                Carton Dimensions
              </span>
              <span className="text-xs font-semibold font-mono text-stone-800">
                {dimensions && (dimensions.length > 0 || dimensions.width > 0 || dimensions.height > 0)
                  ? `${dimensions.length}×${dimensions.width}×${dimensions.height} cm`
                  : "Standard"}
              </span>
            </div>

            <div className="p-2 border-r border-stone-100">
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                Chargeable Weight
              </span>
              <span className="text-sm font-black font-mono text-purple-700">
                {chargeableWeightKg.toFixed(2)} kg
              </span>
            </div>

            <div className="p-2">
              <span className="text-[10px] font-semibold text-stone-400 uppercase block">
                COD Value
              </span>
              <span className="text-xs font-bold font-mono text-stone-900">
                {codAmount > 0 ? `PKR ${codAmount.toLocaleString()}` : "N/A"}
              </span>
            </div>
          </div>

          {/* Primary Recommended Carrier & Price */}
          <div className="border-2 border-purple-600 rounded-xl p-4 bg-purple-50/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-stone-900">
                    {selectedResult.partnerName}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-600 text-white">
                    {selectedResult.service}
                  </span>
                  <span className="text-[11px] font-medium text-stone-600">
                    ETA: {transitDays}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Tariff Contract: <span className="font-semibold text-stone-700">{tariffName}</span> (v{selectedResult.tariffVersion})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">
                  Total Payable
                </span>
                <span className="text-2xl font-black font-mono text-purple-900">
                  PKR {selectedResult.totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Itemized Transparent Breakdown Table */}
            <div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 text-[10px] uppercase tracking-wider border-b border-purple-100 text-left">
                    <th className="pb-1.5">Charge Component</th>
                    <th className="pb-1.5">Formula / Basis Applied</th>
                    <th className="pb-1.5 text-right">Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100/60">
                  {selectedResult.chargesBreakdown.map((item, idx) => (
                    <tr key={idx} className="py-1.5">
                      <td className="py-1.5 font-semibold text-stone-800">{item.name}</td>
                      <td className="py-1.5 text-stone-600 font-mono text-[11px]">
                        {item.rateApplied}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-stone-900">
                        PKR {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-purple-300 font-bold text-stone-900 text-sm">
                    <td className="pt-2 font-black">Grand Total Payable</td>
                    <td className="pt-2 text-[11px] text-stone-500 font-normal font-sans">
                      Inclusive of base freight, fuel surcharge, COD fee & GST
                    </td>
                    <td className="pt-2 text-right font-mono font-black text-purple-900">
                      PKR {selectedResult.totalPayable.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Carrier Benchmarking Comparison (if multiple results available) */}
          {allResults.length > 1 && (
            <div className="border border-stone-200 rounded-xl p-3.5 space-y-2 bg-stone-50/50">
              <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider block">
                Carrier Benchmark Summary ({allResults.length} couriers evaluated)
              </span>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-stone-400 text-[10px] uppercase border-b border-stone-200 text-left">
                    <th className="pb-1">Carrier</th>
                    <th className="pb-1">Service Tier</th>
                    <th className="pb-1">Est. Transit</th>
                    <th className="pb-1 text-right">Total Payable</th>
                    <th className="pb-1 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/50">
                  {allResults.map((r) => {
                    const diff = r.totalPayable - selectedResult.totalPayable;
                    const isLowest = diff === 0;

                    return (
                      <tr key={r.id} className="py-1">
                        <td className="py-1 font-semibold text-stone-800">{r.partnerName}</td>
                        <td className="py-1 text-stone-600">{r.service}</td>
                        <td className="py-1 text-stone-500">
                          {(r as any).expectedTransitDays || (isDomestic ? "24-48 Hours" : "3-5 Days")}
                        </td>
                        <td className="py-1 text-right font-mono font-bold text-stone-900">
                          PKR {r.totalPayable.toLocaleString()}
                        </td>
                        <td className="py-1 text-right text-[11px] font-mono">
                          {isLowest ? (
                            <span className="text-emerald-700 font-bold">Selected Best</span>
                          ) : (
                            <span className="text-amber-800 font-medium">
                              +PKR {diff.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Quotation Terms & Notes */}
          <div className="text-[10px] text-stone-600 border-t border-stone-200 pt-3 space-y-1">
            <p className="font-bold text-stone-700">Commercial Quotation Terms:</p>
            <p>
              1. Rates are calculated strictly using active carrier master contracts stored in Ship Asaan.
            </p>
            <p>
              2. Chargeable weight is taken as the greater of actual scale weight and volumetric weight (L×W×H / 5000 cm³).
            </p>
            <p>
              3. Quotation valid for 7 days from generation date. Surcharges subject to official carrier fuel index fluctuations.
            </p>
          </div>

          {/* Signature / Authorization Line */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-xs text-stone-500">
            <div>
              <div className="border-b border-stone-300 pb-1 mb-1">
                <span className="font-semibold text-stone-700">Ship Asaan Logistics Desk</span>
              </div>
              <p className="text-[10px]">Verified Tariff Computational Engine</p>
            </div>
            <div className="text-right">
              <div className="border-b border-stone-300 pb-1 mb-1">
                <span className="font-semibold text-stone-700">Customer Acceptance</span>
              </div>
              <p className="text-[10px]">Authorized Signature & Stamp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
