import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Search,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Move,
} from "lucide-react";

interface TwoDDocumentViewerProps {
  filename?: string;
  fileContent?: string; // Data URL or text
  fileType?: string;
  imagePreviewUrl?: string | null;
  rawSnippet?: string;
  className?: string;
  compact?: boolean;
}

interface ParsedSheet {
  name: string;
  rows: any[][];
  maxCols: number;
}

export const TwoDDocumentViewer: React.FC<TwoDDocumentViewerProps> = ({
  filename = "Document",
  fileContent = "",
  fileType = "auto",
  imagePreviewUrl = null,
  rawSnippet = "",
  className = "",
  compact = false,
}) => {
  // Determine primary display mode: image, spreadsheet, pdf, or text
  const isImage = useMemo(() => {
    if (imagePreviewUrl) return true;
    if (fileContent.startsWith("data:image/")) return true;
    return Boolean(filename.match(/\.(png|jpe?g|webp|gif|svg|bmp)$/i));
  }, [imagePreviewUrl, fileContent, filename]);

  const isSpreadsheet = useMemo(() => {
    if (fileContent.startsWith("data:application/vnd.openxmlformats-officedocument.spreadsheetml") ||
        fileContent.startsWith("data:application/vnd.ms-excel")) {
      return true;
    }
    return Boolean(filename.match(/\.(xlsx|xls|csv|tsv)$/i));
  }, [fileContent, filename]);

  const isPdf = useMemo(() => {
    return fileContent.startsWith("data:application/pdf") || Boolean(filename.match(/\.pdf$/i));
  }, [fileContent, filename]);

  const [activeTab, setActiveTab] = useState<"visual" | "spreadsheet" | "text">(
    isSpreadsheet ? "spreadsheet" : isImage ? "visual" : isPdf ? "visual" : "text"
  );

  // Synchronize tab on file change
  useEffect(() => {
    if (isSpreadsheet) setActiveTab("spreadsheet");
    else if (isImage || isPdf) setActiveTab("visual");
    else setActiveTab("text");
  }, [isSpreadsheet, isImage, isPdf, filename]);

  // Image viewer interactive controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [invertColors, setInvertColors] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Spreadsheet state
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [sheetSearch, setSheetSearch] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  // Text viewer state
  const [copied, setCopied] = useState(false);
  const [textSearch, setTextSearch] = useState("");

  // Parse spreadsheet if applicable
  useEffect(() => {
    if (!isSpreadsheet && !filename.match(/\.(csv|tsv)$/i)) return;

    try {
      let workbook: XLSX.WorkBook;
      if (fileContent.startsWith("data:")) {
        const base64 = fileContent.split(",")[1];
        if (!base64) return;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        workbook = XLSX.read(bytes, { type: "array" });
      } else if (fileContent) {
        workbook = XLSX.read(fileContent, { type: "string" });
      } else {
        return;
      }

      const sheets: ParsedSheet[] = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
        let maxCols = 0;
        rows.forEach((r) => {
          if (Array.isArray(r) && r.length > maxCols) maxCols = r.length;
        });
        return { name, rows, maxCols };
      });

      setParsedSheets(sheets);
      setParseError(null);
    } catch (err: any) {
      console.warn("Failed to parse spreadsheet in 2D viewer:", err);
      setParseError(err.message || "Failed to parse tabular data");
    }
  }, [fileContent, filename, isSpreadsheet]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Mouse pan handlers for image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Text content helper
  const displayText = useMemo(() => {
    if (rawSnippet && rawSnippet.length > 50) return rawSnippet;
    if (fileContent && !fileContent.startsWith("data:")) return fileContent;
    return "Document content is stored as binary or image data. Use the Visual or Spreadsheet view above.";
  }, [rawSnippet, fileContent]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered spreadsheet rows
  const activeSheet = parsedSheets[selectedSheetIndex];
  const filteredSheetRows = useMemo(() => {
    if (!activeSheet) return [];
    if (!sheetSearch.trim()) return activeSheet.rows;
    const q = sheetSearch.toLowerCase();
    return activeSheet.rows.filter((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes(q))
    );
  }, [activeSheet, sheetSearch]);

  const activeImageUrl = imagePreviewUrl || (fileContent.startsWith("data:image/") ? fileContent : null);

  return (
    <div
      ref={containerRef}
      className={`bg-stone-900 text-stone-100 rounded-2xl border border-stone-800 shadow-xl overflow-hidden flex flex-col ${
        isFullscreen
          ? "fixed inset-4 z-50 rounded-2xl max-w-none max-h-none"
          : compact
          ? "h-[500px]"
          : "h-[620px]"
      } ${className}`}
    >
      {/* 2D VIEWER TOP TOOLBAR */}
      <div className="bg-stone-950/90 border-b border-stone-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Left: Document Identity & View Mode Tabs */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-purple-900/60 text-purple-300 rounded-lg border border-purple-700/50">
            {isSpreadsheet ? (
              <FileSpreadsheet className="w-4 h-4" />
            ) : isImage ? (
              <ImageIcon className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-100 truncate max-w-[200px]" title={filename}>
                {filename}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                2D SOURCE VIEWER
              </span>
            </div>
            <p className="text-[10px] text-stone-400">Original Document Audit & Verification Screen</p>
          </div>
        </div>

        {/* Center: Mode Switcher Tabs */}
        <div className="flex items-center bg-stone-900 p-0.5 rounded-lg border border-stone-800 text-xs">
          {(isImage || isPdf) && (
            <button
              type="button"
              onClick={() => setActiveTab("visual")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === "visual"
                  ? "bg-purple-900 text-purple-100 shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Visual 2D</span>
            </button>
          )}

          {parsedSheets.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("spreadsheet")}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === "spreadsheet"
                  ? "bg-purple-900 text-purple-100 shadow-xs"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Spreadsheet ({parsedSheets.length} sheet{parsedSheets.length > 1 ? "s" : ""})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "text"
                ? "bg-purple-900 text-purple-100 shadow-xs"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Raw / OCR Text</span>
          </button>
        </div>

        {/* Right: Interactive Zoom / Contrast / Fullscreen Controls */}
        <div className="flex items-center gap-1.5">
          {activeTab === "visual" && isImage && (
            <>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-40 transition-colors"
                title="Zoom Out (-25%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-stone-300 px-1 font-bold min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 4}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-40 transition-colors"
                title="Zoom In (+25%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Reset Zoom & Pan"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`p-1.5 rounded-lg transition-colors ${
                  highContrast ? "bg-amber-600 text-white" : "bg-stone-800 hover:bg-stone-700 text-stone-300"
                }`}
                title="Enhance Contrast for Faint Text/Scans"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2D VIEWER MAIN CANVAS AREA */}
      <div className="flex-1 min-h-0 bg-stone-950 relative overflow-hidden flex flex-col">
        {/* TAB 1: VISUAL 2D IMAGE / PDF VIEWER */}
        {activeTab === "visual" && (
          <div
            className={`w-full h-full overflow-hidden relative flex items-center justify-center select-none ${
              zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {activeImageUrl ? (
              <div
                className="transition-transform duration-100 ease-out origin-center"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  filter: `${highContrast ? "contrast(180%) brightness(110%)" : ""} ${
                    invertColors ? "invert(100%)" : ""
                  }`,
                }}
              >
                <img
                  src={activeImageUrl}
                  alt="2D Tariff Document"
                  className="max-w-full max-h-[540px] object-contain rounded-lg shadow-2xl pointer-events-none"
                  draggable={false}
                />
              </div>
            ) : isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <iframe
                  src={fileContent}
                  title="2D PDF Viewer"
                  className="w-full h-full rounded-lg border border-stone-800 bg-white"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-stone-600 opacity-60" />
                <p className="text-sm font-semibold">No direct visual raster image available for this file.</p>
                <p className="text-xs text-stone-500">
                  Switch to the <span className="text-purple-400 font-bold">Spreadsheet</span> or{" "}
                  <span className="text-purple-400 font-bold">Raw / OCR Text</span> tab above to inspect the 2D tabular data.
                </p>
              </div>
            )}

            {/* Subtle Zoom/Pan Floating Helper Badge */}
            {zoom > 1 && (
              <div className="absolute bottom-3 right-3 bg-stone-900/90 text-stone-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-stone-700 shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                <Move className="w-3 h-3 text-purple-400" />
                <span>Drag to pan across the 2D document</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE 2D SPREADSHEET TABLE GRID VIEWER */}
        {activeTab === "spreadsheet" && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-900">
            {/* Sheet Tabs Bar & Search */}
            <div className="bg-stone-950 border-b border-stone-800 px-3 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Sheet Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-md pb-0.5">
                {parsedSheets.map((sh, idx) => (
                  <button
                    key={sh.name}
                    type="button"
                    onClick={() => {
                      setSelectedSheetIndex(idx);
                      setSheetSearch("");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      selectedSheetIndex === idx
                        ? "bg-purple-900 text-purple-100 shadow-xs border border-purple-700"
                        : "bg-stone-800 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <span>{sh.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-stone-900/70 rounded font-mono">
                      {sh.rows.length}r × {sh.maxCols}c
                    </span>
                  </button>
                ))}
              </div>

              {/* In-Sheet Search Filter */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search 2D spreadsheet cells..."
                  value={sheetSearch}
                  onChange={(e) => setSheetSearch(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-purple-600 font-mono"
                />
                {sheetSearch && (
                  <button
                    type="button"
                    onClick={() => setSheetSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-stone-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* 2D Spreadsheet Grid Canvas */}
            <div className="flex-1 overflow-auto">
              {activeSheet && activeSheet.rows.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse font-mono">
                  {/* Column Header Letters: A, B, C, D... */}
                  <thead className="sticky top-0 z-20 bg-stone-950 text-stone-400 text-[11px] shadow-sm">
                    <tr className="border-b border-stone-800">
                      <th className="sticky left-0 top-0 z-30 bg-stone-950 px-2.5 py-1.5 border-r border-stone-800 text-stone-500 text-center w-12 shrink-0">
                        #
                      </th>
                      {Array.from({ length: Math.min(activeSheet.maxCols, 50) }).map((_, cIdx) => {
                        const colLetter = String.fromCharCode(65 + (cIdx % 26)) + (cIdx >= 26 ? Math.floor(cIdx / 26) : "");
                        return (
                          <th
                            key={cIdx}
                            className="px-3 py-1.5 border-r border-stone-800/80 font-bold whitespace-nowrap min-w-[100px] text-stone-300"
                          >
                            Col {colLetter}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {filteredSheetRows.map((row, rIdx) => {
                      const isHeaderRow = rIdx === 0 && !sheetSearch;
                      return (
                        <tr
                          key={rIdx}
                          className={`hover:bg-stone-800/40 transition-colors ${
                            isHeaderRow ? "bg-stone-800/60 font-bold text-stone-200" : ""
                          }`}
                        >
                          {/* Row Number */}
                          <td className="sticky left-0 z-10 bg-stone-950 px-2 py-1 border-r border-stone-800 text-stone-500 text-[10px] text-center select-none">
                            {rIdx + 1}
                          </td>

                          {/* Data Cells */}
                          {Array.from({ length: Math.min(activeSheet.maxCols, 50) }).map((_, cIdx) => {
                            const val = row[cIdx] !== undefined ? String(row[cIdx]) : "";
                            const isMatch = sheetSearch && val.toLowerCase().includes(sheetSearch.toLowerCase());
                            return (
                              <td
                                key={cIdx}
                                className={`px-2.5 py-1.5 border-r border-stone-800/60 whitespace-nowrap max-w-[240px] truncate text-[11px] ${
                                  isMatch ? "bg-purple-900/60 text-purple-200 font-bold" : "text-stone-300"
                                }`}
                                title={val}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-stone-400">
                  <p className="text-xs">No spreadsheet data parsed from this file.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MONOSPACE RAW / OCR TEXT VIEWER */}
        {activeTab === "text" && (
          <div className="flex-1 flex flex-col min-h-0 bg-stone-950">
            {/* Search & Copy Header */}
            <div className="bg-stone-900/80 border-b border-stone-800 px-3 py-2 flex items-center justify-between gap-3 shrink-0">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Find text snippet..."
                  value={textSearch}
                  onChange={(e) => setTextSearch(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-1 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-purple-600 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-mono">
                  {displayText.split("\n").length} lines • {displayText.length.toLocaleString()} chars
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-xs px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center gap-1.5 transition-colors font-medium border border-stone-700"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy All"}</span>
                </button>
              </div>
            </div>

            {/* Line-numbered Text Area */}
            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-stone-200">
              <pre className="whitespace-pre-wrap selection:bg-purple-900 selection:text-white">
                {displayText.split("\n").map((line, idx) => {
                  const isMatch = textSearch && line.toLowerCase().includes(textSearch.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 hover:bg-stone-900/80 px-1 rounded ${
                        isMatch ? "bg-purple-950/80 border-l-2 border-purple-500 font-bold" : ""
                      }`}
                    >
                      <span className="text-stone-600 select-none text-[10px] w-8 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{line || " "}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BAR */}
      <div className="bg-stone-950 border-t border-stone-800/80 px-3.5 py-1.5 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-semibold text-stone-300">Grounding Source Inspector Active</span>
        </div>
        <span className="text-[10px] text-stone-500">
          Verify extracted rates against the raw source visual or tabular grid before approval.
        </span>
      </div>
    </div>
  );
};
