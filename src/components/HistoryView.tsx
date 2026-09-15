import React, { useState } from "react";
import {
  History,
  Trash2,
  Search,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { WorkspaceType, CalculationHistoryRecord } from "../types";
import { exportHistoryToExcel } from "../utils/excelExporter";

interface HistoryViewProps {
  activeWorkspace: WorkspaceType;
  history: CalculationHistoryRecord[];
  onClearHistory: () => void;
  onOpenTariffDetails: (tariffId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  activeWorkspace,
  history,
  onClearHistory,
  onOpenTariffDetails,
}) => {
  const isDomestic = activeWorkspace === "domestic";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = history.filter((h) => {
    return (
      h.summaryTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div id="history-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Calculation History" : "International Calculation History"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              {filteredHistory.length} Saved Calculations
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Audit log of previously generated rate quotes with timestamp, source tariff link, and exact inputs.
          </p>
        </div>

        {history.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => exportHistoryToExcel(history, activeWorkspace)}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export History (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onClearHistory}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search calculation logs by courier or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
          />
        </div>
      </div>

      {/* History Cards */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-stone-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
            <p className="text-sm">No calculation history recorded yet.</p>
            <p className="text-xs text-stone-400 mt-1">
              Use the Rate Calculator to simulate and save rates.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs space-y-2 hover:border-purple-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">{item.summaryTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                      {item.partnerName} ({item.service})
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    Logged: {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-400 font-semibold uppercase mr-1">Total:</span>
                  <span className="text-base font-black text-stone-900 font-mono">
                    {item.currency} {item.totalPayable.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    Tariff: <span className="font-semibold text-stone-700">{item.sourceDocName || item.tariffId}</span> (v{item.tariffVersion})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenTariffDetails(item.tariffId)}
                  className="text-purple-700 hover:underline font-semibold text-left text-xs"
                >
                  Audit Tariff Agreement ➔
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
