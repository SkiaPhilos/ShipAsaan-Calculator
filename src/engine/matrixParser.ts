import * as XLSX from "xlsx";
import { RateMatrixData, RateMatrixColumn, RateMatrixRow, RateMatrixExcessTier, InternationalRateTier, DomesticRateTier } from "../types";

export interface MatrixParseResult {
  success: boolean;
  rateMatrix?: RateMatrixData;
  internationalRates?: InternationalRateTier[];
  totalCellsParsed: number;
  columnsCount: number;
  rowsCount: number;
  headerRowIndex: number;
  weightColumnFromIndex: number;
  weightColumnToIndex: number;
  hasDualWeightCols: boolean;
  maxFlatWeightKg?: number;
  detectedZones: string[];
  notes: string[];
}

export const COUNTRY_NAMES_MAP: Record<string, string> = {
  US: "United States",
  PR: "Puerto Rico",
  CA: "Canada",
  AU: "Australia",
  NL: "Netherlands",
  DE: "Germany",
  GB: "United Kingdom",
  BE: "Belgium",
  FR: "France",
  CH: "Switzerland",
  AT: "Austria",
  IT: "Italy",
  SE: "Sweden",
  ES: "Spain",
  NO: "Norway",
  DK: "Denmark",
  MX: "Mexico",
  IN: "India",
  OM: "Oman",
  SA: "Saudi Arabia",
  BH: "Bahrain",
  KW: "Kuwait",
  TR: "Turkey",
  EG: "Egypt",
  LU: "Luxembourg",
  IE: "Ireland",
  PT: "Portugal",
  HK: "Hong Kong",
  CN: "China",
  PL: "Poland",
  SG: "Singapore",
  TW: "Taiwan",
  KR: "South Korea",
  MY: "Malaysia",
  JP: "Japan",
  PH: "Philippines",
  ZA: "South Africa",
  LK: "Sri Lanka",
  KE: "Kenya",
  QA: "Qatar",
  DZ: "Algeria",
  GR: "Greece",
  RU: "Russia",
  TH: "Thailand",
  CY: "Cyprus",
  MT: "Malta",
  IL: "Israel",
  NZ: "New Zealand",
  ET: "Ethiopia",
  GH: "Ghana",
  MD: "Moldova",
  MZ: "Mozambique",
  TZ: "Tanzania",
  UG: "Uganda",
  ZM: "Zambia",
  AE: "United Arab Emirates",
  PK: "Pakistan",
  BD: "Bangladesh",
  AF: "Afghanistan",
  BT: "Bhutan",
  ID: "Indonesia",
  VN: "Vietnam",
  KH: "Cambodia",
  LA: "Laos",
  MM: "Myanmar",
  NP: "Nepal",
  MV: "Maldives",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  PE: "Peru",
  HU: "Hungary",
  CZ: "Czech Republic",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  BG: "Bulgaria",
  HR: "Croatia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
};

/**
 * Robust RFC 4180-compliant CSV and TSV tokenizer
 */
function parseCsvOrTsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r\n|\n|\r/);
  
  // Detect delimiter: check tabs vs commas in first 5 non-empty lines
  let commaCount = 0;
  let tabCount = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    commaCount += (line.match(/,/g) || []).length;
    tabCount += (line.match(/\t/g) || []).length;
  }
  const delimiter = tabCount > commaCount ? "\t" : ",";

  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    
    for (let c = 0; c < line.length; c++) {
      const char = line[c];

      if (char === '"') {
        if (insideQuotes && line[c + 1] === '"') {
          // Escaped quote
          currentCell += '"';
          c++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else {
        currentCell += char;
      }
    }

    if (!insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      // Only add non-empty rows
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      // Newline inside quotes
      currentCell += "\n";
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Safely parse a cell to a positive number
 */
function parseNumericCell(val: any): number | null {
  if (val === null || val === undefined) return null;
  const str = String(val).replace(/,/g, "").trim();
  if (!str) return null;
  const num = parseFloat(str);
  return !isNaN(num) && isFinite(num) ? num : null;
}

/**
 * Parses any tabular input (CSV text, XLSX array, TSV) into a structured 2D matrix
 * and calculates all flat and per-kg tiers.
 */
export function parseInternationalMatrix(
  input: string | any[][],
  serviceName: string = "Jump N Jump International"
): MatrixParseResult {
  const notes: string[] = [];
  let rows: any[][] = [];

  if (typeof input === "string") {
    // First try our custom RFC 4180 parser
    try {
      rows = parseCsvOrTsv(input);
    } catch {
      // Fallback to SheetJS
      try {
        const workbook = XLSX.read(input, { type: "string" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: "" });
      } catch (e) {
        notes.push(`Error reading tabular input: ${String(e)}`);
      }
    }
  } else if (Array.isArray(input)) {
    rows = input;
  }

  if (!rows || rows.length < 2) {
    return {
      success: false,
      totalCellsParsed: 0,
      columnsCount: 0,
      rowsCount: 0,
      headerRowIndex: -1,
      weightColumnFromIndex: -1,
      weightColumnToIndex: -1,
      hasDualWeightCols: false,
      detectedZones: [],
      notes: ["Insufficient rows to parse tariff matrix."],
    };
  }

  // 1. Identify First Data Row & Header Row(s)
  // A data row is the first row where the first 1-2 columns are numeric weights,
  // and multiple subsequent columns have numeric prices.
  let firstDataRowIdx = -1;

  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row || row.length < 3) continue;

    const cell0Num = parseNumericCell(row[0]);
    const cell1Num = parseNumericCell(row[1]);
    const cell2Num = parseNumericCell(row[2]);

    // Check how many cells in this row are numeric
    let numericCount = 0;
    for (let c = 0; c < row.length; c++) {
      if (parseNumericCell(row[c]) !== null) {
        numericCount++;
      }
    }

    // A data row will typically have at least 4 numeric rate cells
    const isCandidateData =
      (cell0Num !== null || (cell1Num !== null && cell2Num !== null)) && numericCount >= 3;

    if (isCandidateData) {
      firstDataRowIdx = r;
      break;
    }
  }

  if (firstDataRowIdx === -1) {
    firstDataRowIdx = Math.min(2, rows.length - 1);
  }

  // The primary header row is the row directly preceding the first data row
  const headerRowIdx = Math.max(0, firstDataRowIdx - 1);
  const headerRow = rows[headerRowIdx] || [];

  // Super-header row (for zones like ZONE-2, ZONE-3 spanning columns) if available
  let superHeaderRow: any[] | null = null;
  if (headerRowIdx > 0) {
    superHeaderRow = rows[headerRowIdx - 1] || null;
  }

  notes.push(`Identified Header Row at line ${headerRowIdx + 1}, Data starting at line ${firstDataRowIdx + 1}`);

  // 2. Identify Weight Column Structure
  // Check whether we have Dual Weight Columns (From & To) or Single Weight Column
  let hasDualWeightCols = false;
  let weightColFrom = 0;
  let weightColTo = 0;
  let dataStartCol = 1;

  const sampleRow1 = rows[firstDataRowIdx] || [];
  const sampleRow2 = rows[firstDataRowIdx + 1] || [];

  const c0_r1 = parseNumericCell(sampleRow1[0]);
  const c1_r1 = parseNumericCell(sampleRow1[1]);
  const c0_r2 = parseNumericCell(sampleRow2[0]);
  const c1_r2 = parseNumericCell(sampleRow2[1]);

  if (
    c0_r1 !== null &&
    c1_r1 !== null &&
    c0_r1 < c1_r1 &&
    c0_r2 !== null &&
    c1_r2 !== null &&
    c0_r2 < c1_r2
  ) {
    // Both row 1 and row 2 have col 0 < col 1 (e.g. 0.01 < 0.5 and 0.51 < 1.0)
    hasDualWeightCols = true;
    weightColFrom = 0;
    weightColTo = 1;
    dataStartCol = 2;
    notes.push(`Detected dual weight columns: Col 0 (From) & Col 1 (To)`);
  } else {
    // Single weight column at Col 0 or Col 1
    if (c0_r1 !== null) {
      hasDualWeightCols = false;
      weightColFrom = 0;
      weightColTo = 0;
      dataStartCol = 1;
      notes.push(`Detected single weight column: Col 0 (Weight Slab Upper Bound)`);
    } else if (c1_r1 !== null) {
      hasDualWeightCols = false;
      weightColFrom = 1;
      weightColTo = 1;
      dataStartCol = 2;
      notes.push(`Detected single weight column: Col 1`);
    }
  }

  // 3. Extract Destination Columns
  const matrixColumns: RateMatrixColumn[] = [];
  const colIndexMap: Array<{
    colIdx: number;
    key: string;
    label: string;
    countries: string[];
    zoneNumber?: string;
  }> = [];

  for (let c = dataStartCol; c < headerRow.length; c++) {
    const rawCell = String(headerRow[c] || "").trim().replace(/^"|"$/g, "");
    if (!rawCell || rawCell.toUpperCase() === "COLEND") continue;

    // Check if superHeaderRow had a zone name above this column (e.g. ZONE-2, ZONE-3)
    let superZone = "";
    if (superHeaderRow && superHeaderRow[c]) {
      const sVal = String(superHeaderRow[c]).trim().replace(/^"|"$/g, "");
      if (/zone|grp/i.test(sVal)) {
        superZone = sVal.toUpperCase();
      }
    }

    // Extract ISO country codes (2-letter capital codes)
    const countryMatches = rawCell.match(/\b[A-Z]{2}\b/g) || [];
    const countryCodes = countryMatches.filter(
      (code) => !["KG", "WT", "ID", "NO", "TO", "LB"].includes(code) || COUNTRY_NAMES_MAP[code]
    );

    let key = "";
    let label = "";
    let zoneNumber: string | undefined = undefined;

    if (superZone) {
      const zoneMatch = superZone.match(/ZONE[-_\s]*([0-9A-Z]+)/i);
      zoneNumber = zoneMatch ? zoneMatch[1] : undefined;
      key = superZone.replace(/[^A-Z0-9]/gi, "_");
      label = `${superZone}: ${countryCodes.slice(0, 4).join(", ")}${countryCodes.length > 4 ? ` (+${countryCodes.length - 4})` : ""}`;
    } else if (/zone/i.test(rawCell)) {
      const zoneMatch = rawCell.match(/ZONE[-_\s]*([0-9A-Z]+)/i);
      zoneNumber = zoneMatch ? zoneMatch[1] : undefined;
      key = rawCell.replace(/[^A-Z0-9]/gi, "_").slice(0, 14);
      label = rawCell;
    } else if (countryCodes.length === 1) {
      const code = countryCodes[0];
      const fullName = COUNTRY_NAMES_MAP[code] || code;
      key = code;
      label = fullName !== code ? `${code} (${fullName})` : code;
    } else if (countryCodes.length > 1 && countryCodes.length <= 3) {
      key = countryCodes.join("_");
      const fullNames = countryCodes.map((c) => COUNTRY_NAMES_MAP[c] || c).join(", ");
      label = `${countryCodes.join(", ")} (${fullNames})`;
    } else if (countryCodes.length > 3) {
      key = `GRP_${countryCodes[0]}_${countryCodes[1]}`;
      label = `Group: ${countryCodes.slice(0, 4).join(", ")} (+${countryCodes.length - 4} countries)`;
    } else {
      key = rawCell.replace(/[^A-Z0-9]/gi, "_").toUpperCase().slice(0, 16);
      label = rawCell;
    }

    // Ensure unique keys
    let uniqueKey = key;
    let counter = 1;
    while (matrixColumns.some((col) => col.key === uniqueKey)) {
      uniqueKey = `${key}_${counter++}`;
    }

    const colDef: RateMatrixColumn = {
      key: uniqueKey,
      label,
      countries: countryCodes.length > 0 ? countryCodes : [uniqueKey],
      zoneNumber,
    };

    matrixColumns.push(colDef);
    colIndexMap.push({
      colIdx: c,
      key: uniqueKey,
      label,
      countries: countryCodes,
      zoneNumber,
    });
  }

  // 4. Extract Data Rows and Classify Flat vs Per-KG Tiers
  const matrixRows: RateMatrixRow[] = [];
  const excessTiers: RateMatrixExcessTier[] = [];
  const additionalKgRates: Record<string, number> = {};
  const internationalRates: InternationalRateTier[] = [];
  let totalCells = 0;
  let prevWeightTo = 0;
  let maxFlatWeightKg = 0;

  for (let r = firstDataRowIdx; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const cell0Str = String(row[0] || "").trim().toUpperCase();
    if (cell0Str.startsWith("ROWEND") || cell0Str.startsWith("TOTAL")) {
      break;
    }

    let wFrom = 0;
    let wTo = 0;

    if (hasDualWeightCols) {
      const fromVal = parseNumericCell(row[weightColFrom]);
      const toVal = parseNumericCell(row[weightColTo]);
      if (toVal === null || toVal <= 0) continue;
      wFrom = fromVal !== null ? fromVal : prevWeightTo + 0.01;
      wTo = toVal;
    } else {
      const toVal = parseNumericCell(row[weightColTo]);
      if (toVal === null || toVal <= 0) {
        // Try parsing string range e.g. "0.01 - 0.5"
        const rangeMatch = String(row[weightColTo] || "").match(/([0-9.]+)\s*[-–to/]\s*([0-9.]+)/i);
        if (rangeMatch) {
          wFrom = parseFloat(rangeMatch[1]);
          wTo = parseFloat(rangeMatch[2]);
        } else {
          continue;
        }
      } else {
        wTo = toVal;
        wFrom = prevWeightTo > 0 ? Number((prevWeightTo + 0.01).toFixed(2)) : 0.01;
      }
    }

    prevWeightTo = wTo;

    // Read rates for each destination column
    const rowRates: Record<string, number> = {};
    let ratesSum = 0;
    let ratesCount = 0;

    colIndexMap.forEach((col) => {
      const numVal = parseNumericCell(row[col.colIdx]);
      if (numVal !== null && numVal > 0) {
        rowRates[col.key] = numVal;
        ratesSum += numVal;
        ratesCount++;
        totalCells++;
      }
    });

    if (ratesCount === 0) continue;

    const averageRate = ratesSum / ratesCount;

    // 5. Intelligent Flat vs Per-KG Excess Classification
    // A bracket is NEVER per-kg if its span is 1kg or 0.5kg (e.g. 69.01 - 70.00 kg or 69 - 70 kg is 100% FLAT).
    // Excess per-kg brackets are heavy cargo spans with wide ranges (e.g. 70.01-99kg, 71-500kg, 99.01-1000kg)
    // where prices drop to unit per-kg rates (e.g. ~2,500 - 3,500 PKR/kg).
    const span = wTo - wFrom;
    const isWideSpan = span >= 5;
    const prevFlatRate = matrixRows.length > 0 ? (matrixRows[matrixRows.length - 1].rates[colIndexMap[0]?.key] || 999999) : 999999;
    const isSignificantPriceDrop = matrixRows.length > 0 && averageRate < prevFlatRate * 0.35;

    const isPerKgBracket =
      isWideSpan &&
      ((wFrom >= 70 && isSignificantPriceDrop) || wTo >= 150 || (wFrom >= 70 && wTo >= 90));

    const pricingType: "flat" | "per_kg" = isPerKgBracket ? "per_kg" : "flat";

    if (pricingType === "flat") {
      maxFlatWeightKg = Math.max(maxFlatWeightKg, wTo);
    } else {
      // Record excess tier
      excessTiers.push({
        weightFrom: wFrom,
        weightTo: wTo,
        label: `${wFrom} – ${wTo} kg (Per KG)`,
        rates: { ...rowRates },
      });

      // Populate primary additionalKgRates map for fallback compatibility
      if (Object.keys(additionalKgRates).length === 0) {
        Object.assign(additionalKgRates, rowRates);
      }
    }

    const weightLabel =
      pricingType === "per_kg"
        ? `${wFrom} – ${wTo} kg (Per KG)`
        : `${wFrom} – ${wTo} kg`;

    matrixRows.push({
      weightFrom: wFrom,
      weightTo: wTo,
      weightLabel,
      rates: rowRates,
      pricingType,
    });

    // Unpivot to InternationalRateTier
    colIndexMap.forEach((col) => {
      const rateVal = rowRates[col.key];
      if (rateVal !== undefined) {
        internationalRates.push({
          id: `ir-${col.key}-${wTo}-${pricingType}`,
          zone: col.key,
          countryGroup: col.label,
          countryCode: col.countries.length === 1 ? col.countries[0] : undefined,
          service: serviceName,
          weightFrom: wFrom,
          weightTo: wTo,
          pricingType,
          flatRate: pricingType === "flat" ? rateVal : undefined,
          ratePerKg: pricingType === "per_kg" ? rateVal : undefined,
        });
      }
    });
  }

  // Sort matrix rows by weight ascending
  matrixRows.sort((a, b) => a.weightTo - b.weightTo);

  const rateMatrix: RateMatrixData = {
    columns: matrixColumns,
    rows: matrixRows,
    additionalKgRates: Object.keys(additionalKgRates).length > 0 ? additionalKgRates : undefined,
    excessTiers: excessTiers.length > 0 ? excessTiers : undefined,
    maxFlatWeightKg: maxFlatWeightKg > 0 ? maxFlatWeightKg : undefined,
    unit: "kg",
    origin: "Pakistan",
    service: serviceName,
  };

  notes.push(
    `Parsed ${matrixColumns.length} destination columns and ${matrixRows.length} weight brackets (${totalCells} rate cells).`
  );
  if (maxFlatWeightKg > 0) {
    notes.push(`Base flat parcel slabs up to ${maxFlatWeightKg} kg. Detected ${excessTiers.length} excess per-kg tier(s).`);
  }

  return {
    success: matrixColumns.length > 0 && matrixRows.length > 0,
    rateMatrix,
    internationalRates,
    totalCellsParsed: totalCells,
    columnsCount: matrixColumns.length,
    rowsCount: matrixRows.length,
    headerRowIndex: headerRowIdx,
    weightColumnFromIndex: weightColFrom,
    weightColumnToIndex: weightColTo,
    hasDualWeightCols,
    maxFlatWeightKg: maxFlatWeightKg > 0 ? maxFlatWeightKg : undefined,
    detectedZones: matrixColumns.map((c) => c.key),
    notes,
  };
}

/**
 * Constructs a complete 2D RateMatrixData structure from DomesticRateTier[]
 * so that domestic tariffs can also be viewed, inspected, and edited in the 2D matrix viewer.
 */
export function buildDomesticRateMatrix(
  rates: DomesticRateTier[],
  serviceName: string = "Domestic Overnight Express"
): RateMatrixData {
  if (!rates || rates.length === 0) {
    return {
      columns: [],
      rows: [],
      unit: "kg",
      service: serviceName,
    };
  }

  // Generate destination columns
  const columns: RateMatrixColumn[] = rates.map((r) => ({
    key: r.destination,
    label: r.destination,
    countries: [r.destination],
  }));

  // Standard domestic weight tiers: 0.5kg, 1.0kg, 2.0kg, 3.0kg, 4.0kg, 5.0kg, 10.0kg, 15.0kg, 20.0kg, 25.0kg, 30.0kg, 35.0kg
  const weightBrackets = [
    { from: 0.01, to: 0.5, label: "0.01 – 0.5 kg" },
    { from: 0.51, to: 1.0, label: "0.51 – 1.0 kg" },
    { from: 1.01, to: 2.0, label: "1.01 – 2.0 kg" },
    { from: 2.01, to: 3.0, label: "2.01 – 3.0 kg" },
    { from: 3.01, to: 4.0, label: "3.01 – 4.0 kg" },
    { from: 4.01, to: 5.0, label: "4.01 – 5.0 kg" },
    { from: 5.01, to: 10.0, label: "5.01 – 10.0 kg" },
    { from: 10.01, to: 15.0, label: "10.01 – 15.0 kg" },
    { from: 15.01, to: 20.0, label: "15.01 – 20.0 kg" },
    { from: 20.01, to: 25.0, label: "20.01 – 25.0 kg" },
    { from: 25.01, to: 30.0, label: "25.01 – 30.0 kg" },
    { from: 30.01, to: 35.0, label: "30.01 – 35.0 kg" },
  ];

  const additionalKgRates: Record<string, number> = {};
  rates.forEach((r) => {
    additionalKgRates[r.destination] = r.additionalKgRate;
  });

  const rows: RateMatrixRow[] = weightBrackets.map((wb) => {
    const rowRates: Record<string, number> = {};
    rates.forEach((r) => {
      if (wb.to <= 1.0) {
        rowRates[r.destination] = wb.to <= 0.5 && r.additionalHalfKgRate ? r.additionalHalfKgRate : r.firstKgRate;
      } else {
        const addlWeight = wb.to - 1.0;
        const total = r.firstKgRate + addlWeight * r.additionalKgRate;
        rowRates[r.destination] = Math.round(total * 100) / 100;
      }
    });

    return {
      weightFrom: wb.from,
      weightTo: wb.to,
      weightLabel: wb.label,
      rates: rowRates,
      pricingType: "flat",
    };
  });

  return {
    columns,
    rows,
    additionalKgRates,
    maxFlatWeightKg: 35,
    unit: "kg",
    origin: "Pakistan",
    service: serviceName,
  };
}
