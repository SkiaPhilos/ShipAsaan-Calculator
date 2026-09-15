import * as XLSX from "xlsx";
import { parseInternationalMatrix } from "./matrixParser";
import {
  DomesticRateTier,
  InternationalRateTier,
  RateMatrixData,
  RateMatrixColumn,
  RateMatrixRow,
  SurchargeItem,
  CustomField,
  WorkspaceType,
} from "../types";

export interface OfflineExtractionResult {
  success: boolean;
  extractionStatus: "offline_extracted" | "offline_needs_review" | "failed";
  reason?: string;
  tariffName: string;
  partnerName: string;
  serviceType: string;
  currency: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  confidence: number;
  tablesRecoveredCount: number;
  rowsRecoveredCount: number;
  identifiableFieldsCount: number;
  ambiguities: string[];
  rawTables: Array<{ title: string; columns: string[]; rows: any[][] }>;
  domesticRates?: DomesticRateTier[];
  internationalRates?: InternationalRateTier[];
  rateMatrix?: RateMatrixData;
  surcharges: SurchargeItem[];
  additionalData: CustomField[];
  fuelPercentage?: number;
  codPercentage?: number;
  codFixedMinimum?: number;
  gstPercentage?: number;
  volumetricDivisor?: number;
  rawSnippet: string;
}

export class OfflineTariffParser {
  /**
   * Parse text, CSV, or ArrayBuffer / Base64 spreadsheet deterministically
   */
  static async parseDocument(
    content: string | ArrayBuffer,
    filename: string,
    fileType: string,
    workspace: WorkspaceType
  ): Promise<OfflineExtractionResult> {
    const ambiguities: string[] = [];
    let tablesRecovered: Array<{ title: string; columns: string[]; rows: any[][] }> = [];
    let textLines: string[] = [];
    let rowsCount = 0;
    let rawSnippet = "";

    // 1. Try parsing with XLSX if file is binary spreadsheet or CSV
    if (
      filename.endsWith(".xlsx") ||
      filename.endsWith(".xls") ||
      filename.endsWith(".csv") ||
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      fileType.includes("csv")
    ) {
      try {
        let workbook: XLSX.WorkBook;
        if (typeof content === "string") {
          if (content.startsWith("data:")) {
            // Base64 data URL
            const base64Part = content.split(",")[1];
            workbook = XLSX.read(base64Part, { type: "base64" });
          } else {
            // Raw CSV or string text
            workbook = XLSX.read(content, { type: "string" });
          }
        } else {
          workbook = XLSX.read(content, { type: "array" });
        }

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          if (jsonData && jsonData.length > 0) {
            const columns = (jsonData[0] || []).map((c) => String(c || "Col"));
            const dataRows = jsonData.slice(1).filter((r) => r && r.length > 0);
            rowsCount += dataRows.length;
            tablesRecovered.push({
              title: `Sheet: ${sheetName}`,
              columns,
              rows: dataRows,
            });

            // Convert to text lines for pattern matching
            dataRows.forEach((r) => {
              textLines.push(r.join(" | "));
            });
          }
        }
        rawSnippet = textLines.slice(0, 50).join("\n");
      } catch (xlsxErr: any) {
        console.warn("XLSX parsing failed, falling back to text regex:", xlsxErr);
        ambiguities.push(`Spreadsheet binary parser warning: ${xlsxErr.message}`);
      }
    }

    // 2. If no tables from XLSX or content is pure text/markdown
    if (tablesRecovered.length === 0 && typeof content === "string") {
      const cleanStr = content.startsWith("data:")
        ? atob(content.split(",")[1] || "")
        : content;
      textLines = cleanStr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      rawSnippet = textLines.slice(0, 50).join("\n");

      // Check if text has tabular format (e.g. pipe or comma or tab separated)
      const tableRows: any[][] = [];
      let detectedHeaders: string[] = [];

      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        if (line.includes("|") || line.includes(",") || line.includes("\t")) {
          const sep = line.includes("|") ? "|" : line.includes("\t") ? "\t" : ",";
          const cells = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
          if (cells.length >= 2) {
            if (detectedHeaders.length === 0) {
              detectedHeaders = cells;
            } else {
              tableRows.push(cells);
            }
          }
        }
      }

      if (tableRows.length > 0) {
        rowsCount += tableRows.length;
        tablesRecovered.push({
          title: "Extracted Tabular Content",
          columns: detectedHeaders,
          rows: tableRows,
        });
      }
    }

    // If completely empty, return clean explicit failure without fabricating anything
    if (textLines.length === 0 && tablesRecovered.length === 0) {
      return {
        success: false,
        extractionStatus: "failed",
        reason: "Offline extraction could not reliably interpret the document structure. No text or tables recovered.",
        tariffName: filename.replace(/\.[^/.]+$/, "") + " (Offline Incomplete)",
        partnerName: "Unknown Partner",
        serviceType: "Standard",
        currency: "PKR",
        confidence: 0,
        tablesRecoveredCount: 0,
        rowsRecoveredCount: 0,
        identifiableFieldsCount: 0,
        ambiguities: ["Document contains no readable text, spreadsheet cells, or tabular structures."],
        rawTables: [],
        surcharges: [],
        additionalData: [],
        rawSnippet: "",
      };
    }

    // 3. Extract identifiable fields using deterministic regex
    let partnerName = "Courier Partner";
    let serviceType = workspace === "domestic" ? "Overnight Express" : "International Express";
    let currency = "PKR";
    let fuelPercentage = 0;
    let codPercentage = 0;
    let codFixedMinimum = 0;
    let gstPercentage = 16.0;
    let volumetricDivisor = 5000;
    let effectiveFrom = "";
    let identifiableFieldsCount = 0;

    const allText = textLines.join(" ");

    // Partner detection
    if (/tcs/i.test(allText)) {
      partnerName = "TCS Express & Logistics";
      identifiableFieldsCount++;
    } else if (/leopard/i.test(allText)) {
      partnerName = "Leopards Courier Services";
      identifiableFieldsCount++;
    } else if (/trax/i.test(allText)) {
      partnerName = "Trax Online Logistics";
      identifiableFieldsCount++;
    } else if (/call\s*courier/i.test(allText)) {
      partnerName = "Call Courier";
      identifiableFieldsCount++;
    } else if (/dhl/i.test(allText)) {
      partnerName = "DHL Express International";
      identifiableFieldsCount++;
    } else if (/fedex/i.test(allText)) {
      partnerName = "FedEx Express";
      identifiableFieldsCount++;
    } else if (/ups/i.test(allText)) {
      partnerName = "UPS (United Parcel Service)";
      identifiableFieldsCount++;
    } else if (/aramex/i.test(allText)) {
      partnerName = "Aramex International";
      identifiableFieldsCount++;
    }

    // Fuel Surcharge detection
    const fuelMatch = allText.match(/(?:fuel|fac|fsc|fai)\s*(?:surcharge|adjustment)?[:\s=]*(\d+(?:\.\d+)?)\s*%/i);
    if (fuelMatch) {
      fuelPercentage = parseFloat(fuelMatch[1]);
      identifiableFieldsCount++;
    }

    // COD detection
    const codMatch = allText.match(/(?:cod|cash\s*on\s*delivery)\s*(?:commission|fee|handling)?[:\s=]*(\d+(?:\.\d+)?)\s*%/i);
    if (codMatch) {
      codPercentage = parseFloat(codMatch[1]);
      identifiableFieldsCount++;
    }
    const codMinMatch = allText.match(/(?:min|minimum)\s*(?:pkr|rs\.?)?\s*(\d+)/i);
    if (codMinMatch) {
      codFixedMinimum = parseInt(codMinMatch[1], 10);
      identifiableFieldsCount++;
    }

    // GST detection
    const gstMatch = allText.match(/(?:gst|sales\s*tax|pra|srb)[:\s=]*(\d+(?:\.\d+)?)\s*%/i);
    if (gstMatch) {
      gstPercentage = parseFloat(gstMatch[1]);
      identifiableFieldsCount++;
    }

    // Volumetric Divisor
    const divisorMatch = allText.match(/(?:divisor|dimensional\s*factor)[:\s=]*(\d{4})/i);
    if (divisorMatch) {
      volumetricDivisor = parseInt(divisorMatch[1], 10);
      identifiableFieldsCount++;
    }

    // Currency detection
    if (/usd|\$/i.test(allText)) currency = "USD";
    else if (/eur|€/i.test(allText)) currency = "EUR";
    else currency = "PKR";

    const surcharges: SurchargeItem[] = [];
    if (fuelPercentage > 0) {
      surcharges.push({
        id: `sc-off-fuel-${Date.now()}`,
        name: "Fuel Surcharge",
        originalName: "Fuel Adjustment (Offline Parsed)",
        type: "percentage",
        value: fuelPercentage,
        applicability: "base_rate",
      });
    }
    if (codPercentage > 0) {
      surcharges.push({
        id: `sc-off-cod-${Date.now()}`,
        name: "COD Handling Fee",
        originalName: "COD Commission (Offline Parsed)",
        type: "percentage",
        value: codPercentage,
        applicability: "invoice_value",
      });
    }
    if (gstPercentage > 0) {
      surcharges.push({
        id: `sc-off-gst-${Date.now()}`,
        name: "GST / Sales Tax",
        originalName: "Sales Tax (Offline Parsed)",
        type: "percentage",
        value: gstPercentage,
        applicability: "total_rate",
      });
    }

    // 4. Rate extraction based on workspace
    let domesticRates: DomesticRateTier[] | undefined;
    let internationalRates: InternationalRateTier[] | undefined;

    if (workspace === "domestic") {
      domesticRates = [];
      // Look for rate patterns in lines
      const sectors = [
        { label: "Within City", match: /intra|within\s*city|same\s*city|local/i },
        { label: "Same Province", match: /same\s*prov|within\s*prov/i },
        { label: "Different Province", match: /diff\s*prov|inter\s*prov|other\s*prov/i },
        { label: "Remote / Ext-area", match: /remote|ext|oda/i },
      ];

      for (const sector of sectors) {
        let found = false;
        for (const line of textLines) {
          if (sector.match.test(line)) {
            const numbers = line.match(/\b\d{2,4}\b/g);
            if (numbers && numbers.length >= 2) {
              const firstKg = parseInt(numbers[0], 10);
              const addlKg = parseInt(numbers[1], 10);
              domesticRates.push({
                id: `dtr-${sector.label.replace(/\s+/g, "_")}`,
                origin: "Any",
                destination: sector.label,
                firstKgRate: firstKg,
                additionalKgRate: addlKg,
                expectedTransitDays: sector.label === "Within City" ? "1 Day" : "2 Days",
              });
              identifiableFieldsCount += 2;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          // If sector not found, add standard placeholder with warning
          ambiguities.push(`Sector '${sector.label}' was not explicitly identified in offline document text.`);
        }
      }

      // If no rates recovered, provide default empty tier with flag
      if (domesticRates.length === 0) {
        ambiguities.push("No explicit rate rows could be automatically parsed. User review and manual rate entry is required.");
      }
    } else {
      // International Rates
      internationalRates = [];
      let rateMatrixResult: RateMatrixData | undefined = undefined;

      // 1. Check if any recovered table or content is a 2D Rate Matrix (e.g. Jump N Jump, DHL, FedEx)
      // First try directly on raw content string if available
      if (typeof content === "string" && content.length > 50) {
        const directMatrix = parseInternationalMatrix(content, serviceType);
        if (directMatrix.success && directMatrix.rateMatrix && directMatrix.internationalRates) {
          rateMatrixResult = directMatrix.rateMatrix;
          internationalRates = directMatrix.internationalRates;
          identifiableFieldsCount += directMatrix.totalCellsParsed;
          ambiguities.push(...directMatrix.notes);
        }
      }

      // If not yet recovered, try across each recovered table
      if (!rateMatrixResult && tablesRecovered.length > 0) {
        for (const table of tablesRecovered) {
          if (!table.rows || table.rows.length === 0) continue;
          const combinedTableRows = [table.columns, ...table.rows];
          const tableMatrix = parseInternationalMatrix(combinedTableRows, serviceType);
          if (tableMatrix.success && tableMatrix.rateMatrix && tableMatrix.internationalRates) {
            rateMatrixResult = tableMatrix.rateMatrix;
            rateMatrixResult.sourceSheetName = table.title;
            internationalRates = tableMatrix.internationalRates;
            identifiableFieldsCount += tableMatrix.totalCellsParsed;
            ambiguities.push(...tableMatrix.notes);
            break;
          }
        }
      }

      // 2. Fallback to simple zone regex if no 2D matrix found
      if (internationalRates.length === 0) {
        const zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];
        for (const zone of zones) {
          const zoneRegex = new RegExp(`(?:${zone}|zone\\s*0?${zone.replace("Zone ", "")})`, "i");
          for (const line of textLines) {
            if (zoneRegex.test(line)) {
              const numbers = line.match(/\b\d{3,6}\b/g);
              if (numbers && numbers.length > 0) {
                const parsedVal = parseInt(numbers[0], 10);
                internationalRates.push({
                  id: `ir-${zone.replace(/\s+/g, "_")}-05`,
                  zone,
                  service: serviceType,
                  weightFrom: 0,
                  weightTo: 0.5,
                  flatRate: parsedVal,
                });
                identifiableFieldsCount++;
                break;
              }
            }
          }
        }
      }

      if (internationalRates.length === 0) {
        ambiguities.push("No international zone matrix lines could be automatically matched. User review is required.");
      }

      const confidence = Math.min(
        95,
        Math.max(25, 20 + tablesRecovered.length * 15 + identifiableFieldsCount * 3)
      );

      return {
        success: true,
        extractionStatus: confidence > 70 ? "offline_extracted" : "offline_needs_review",
        tariffName: filename.replace(/\.[^/.]+$/, "") + " (Offline Extraction)",
        partnerName,
        serviceType,
        currency,
        effectiveFrom: effectiveFrom || new Date().toISOString().split("T")[0],
        confidence,
        tablesRecoveredCount: tablesRecovered.length,
        rowsRecoveredCount: rowsCount,
        identifiableFieldsCount,
        ambiguities,
        rawTables: tablesRecovered,
        domesticRates,
        internationalRates,
        rateMatrix: rateMatrixResult,
        surcharges,
        additionalData: [
          {
            id: `ad-off-1`,
            category: "Audit",
            name: "Extraction Mode",
            value: "Deterministic Offline Parser",
            ruleNotes: `Recovered ${tablesRecovered.length} tables and ${rowsCount} data rows (${internationalRates.length} international rate tiers).`,
          },
        ],
        fuelPercentage,
        codPercentage,
        codFixedMinimum,
        gstPercentage,
        volumetricDivisor,
        rawSnippet,
      };
    }
  }
}
