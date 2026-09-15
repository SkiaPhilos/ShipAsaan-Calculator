import * as XLSX from "xlsx";
import {
  TariffDomestic,
  TariffInternational,
  WorkspaceType,
  CalculationDomesticResult,
  CalculationInternationalResult,
  CalculationHistoryRecord,
} from "../types";

/**
 * Excel Exporter Utility for Ship Asaan Tariff Intelligence
 * Provides deterministic workbook generation with clean formatting and column widths.
 */

// Format date helper
const getFormattedDate = () => {
  const d = new Date();
  return d.toISOString().split("T")[0];
};

/**
 * Exports a single domestic or international tariff to an Excel workbook (.xlsx)
 */
export const exportSingleTariffToExcel = (
  tariff: TariffDomestic | TariffInternational,
  isDomestic: boolean
) => {
  const wb = XLSX.utils.book_new();
  const dateStr = getFormattedDate();

  if (isDomestic) {
    const dom = tariff as TariffDomestic;

    // 1. Meta / Overview sheet
    const metaData = [
      ["SHIP ASAAN TARIFF INTELLIGENCE - DOMESTIC MASTER RATE CARD"],
      ["Generated Date", dateStr],
      ["Tariff ID", dom.id],
      ["Courier / Partner", dom.partnerName],
      ["Service Name", dom.service],
      ["Rate Card Name", dom.name],
      ["Effective Date", dom.effectiveFrom],
      ["Version", `v${dom.currentVersion}`],
      ["Review Status", dom.reviewStatus],
      ["Currency", dom.currency || "PKR"],
      [""],
      ["COMMERCIAL CHARGES & TAXES"],
      ["Fuel Adjustment Charge (FAC %)", `${dom.fuelPercentage}%`],
      ["General Sales Tax (GST %)", `${dom.gstPercentage}%`],
      ["Cash on Delivery (COD %)", `${dom.codPercentage}%`],
      ["COD Minimum Flat Fee (PKR)", dom.codFixedMinimum || 0],
      [""],
      ["NOTES & CLAUSES"],
      ["Contract Notes", dom.notes || "Standard carrier contract schedule"],
    ];

    const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
    wsMeta["!cols"] = [{ wch: 30 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, "Overview");

    // 2. Base Rates sheet
    const ratesHeader = [
      "Origin Sector",
      "Destination Sector",
      "First Kg Rate (PKR)",
      "Additional Kg Rate (PKR)",
      "Expected Transit",
    ];

    const ratesRows = (dom.rates || []).map((r) => [
      r.origin,
      r.destination,
      r.firstKgRate,
      r.additionalKgRate,
      r.expectedTransitDays || "N/A",
    ]);

    const wsRates = XLSX.utils.aoa_to_sheet([ratesHeader, ...ratesRows]);
    wsRates["!cols"] = [
      { wch: 22 },
      { wch: 25 },
      { wch: 20 },
      { wch: 24 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRates, "Rate Matrix");

    // 3. Surcharges sheet
    if (dom.surcharges && dom.surcharges.length > 0) {
      const surHeader = [
        "Surcharge Name",
        "Original Carrier Name",
        "Type",
        "Value",
        "Applicability",
        "Notes",
      ];
      const surRows = dom.surcharges.map((s) => [
        s.name,
        s.originalName || s.name,
        s.type,
        s.value,
        s.applicability,
        s.notes || "",
      ]);
      const wsSur = XLSX.utils.aoa_to_sheet([surHeader, ...surRows]);
      wsSur["!cols"] = [
        { wch: 22 },
        { wch: 22 },
        { wch: 15 },
        { wch: 12 },
        { wch: 18 },
        { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSur, "Surcharges");
    }

    const safeFilename = `Tariff_${dom.partnerName.replace(/[^a-z0-9]/gi, "_")}_${dom.service.replace(/[^a-z0-9]/gi, "_")}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, safeFilename);
  } else {
    // International Tariff
    const intl = tariff as TariffInternational;

    const metaData = [
      ["SHIP ASAAN TARIFF INTELLIGENCE - INTERNATIONAL MASTER RATE CARD"],
      ["Generated Date", dateStr],
      ["Tariff ID", intl.id],
      ["Courier / Carrier", intl.partnerName],
      ["Service Name", intl.service],
      ["Rate Card Name", intl.name],
      ["Effective Date", intl.effectiveFrom],
      ["Version", `v${intl.currentVersion}`],
      ["Review Status", intl.reviewStatus],
      ["Currency", intl.currency || "PKR"],
      ["Volumetric Divisor", intl.volumetricDivisor || 5000],
      ["Fuel Surcharge (%)", `${intl.fuelPercentage}%`],
      ["Remote Area Fee (PKR)", intl.remoteAreaFee || 0],
      ["Security / Emergency Fee (PKR)", intl.securityFee || 0],
      ["Customs Clearance Fee (PKR)", intl.customsClearanceFee || 0],
    ];

    const wsMeta = XLSX.utils.aoa_to_sheet(metaData);
    wsMeta["!cols"] = [{ wch: 30 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, wsMeta, "Overview");

    // Rate Matrix or Rates list
    if (intl.rateMatrix && intl.rateMatrix.rows && intl.rateMatrix.rows.length > 0) {
      const cols = intl.rateMatrix.columns || [];
      const headerRow = ["Weight Slab", ...cols.map((c) => c.label || c.key)];
      const matrixRows = intl.rateMatrix.rows.map((r) => [
        r.weightLabel || `${r.weightFrom} – ${r.weightTo} kg`,
        ...cols.map((c) => (r.rates[c.key] !== undefined ? r.rates[c.key] : "-")),
      ]);

      const wsRates = XLSX.utils.aoa_to_sheet([headerRow, ...matrixRows]);
      wsRates["!cols"] = [{ wch: 22 }, ...cols.map(() => ({ wch: 16 }))];
      XLSX.utils.book_append_sheet(wb, wsRates, "Rate Matrix");
    } else if (intl.rates && intl.rates.length > 0) {
      const headerRow = [
        "Zone / Sector",
        "Service Tier",
        "Weight From (kg)",
        "Weight To (kg)",
        "Pricing Type",
        "Rate (PKR)",
        "Est. Transit",
      ];
      const rateRows = intl.rates.map((r) => [
        r.zone,
        r.service,
        r.weightFrom,
        r.weightTo,
        r.pricingType || (r.flatRate !== undefined ? "flat" : "per_kg"),
        r.flatRate !== undefined ? r.flatRate : r.ratePerKg || 0,
        r.transitDays || "N/A",
      ]);

      const wsRates = XLSX.utils.aoa_to_sheet([headerRow, ...rateRows]);
      wsRates["!cols"] = [
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 15 },
        { wch: 16 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(wb, wsRates, "Zone Rates");
    }

    const safeFilename = `Tariff_Intl_${intl.partnerName.replace(/[^a-z0-9]/gi, "_")}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, safeFilename);
  }
};

/**
 * Exports all active tariffs in the current workspace into a single consolidated Excel workbook
 */
export const exportAllTariffsToExcel = (
  tariffs: (TariffDomestic | TariffInternational)[],
  workspace: WorkspaceType
) => {
  const wb = XLSX.utils.book_new();
  const dateStr = getFormattedDate();

  if (workspace === "domestic") {
    const domTariffs = tariffs as TariffDomestic[];

    // Summary sheet
    const summaryHeader = [
      "Tariff ID",
      "Carrier / Partner",
      "Service",
      "Rate Card Name",
      "Status",
      "Version",
      "Effective From",
      "Fuel %",
      "GST %",
      "COD %",
      "Within City (1st Kg)",
      "Same Province (1st Kg)",
      "Diff Province (1st Kg)",
      "Add'l Kg Rate",
    ];

    const summaryRows = domTariffs.map((t) => {
      const withinCity =
        t.rates?.find((r) => r.destination.toLowerCase().includes("within"))
          ?.firstKgRate || "-";
      const sameProv =
        t.rates?.find((r) => r.destination.toLowerCase().includes("same"))
          ?.firstKgRate || "-";
      const diffProv =
        t.rates?.find((r) => r.destination.toLowerCase().includes("diff"))
          ?.firstKgRate || "-";
      const addKg = t.rates?.[0]?.additionalKgRate || "-";

      return [
        t.id,
        t.partnerName,
        t.service,
        t.name,
        t.status,
        `v${t.currentVersion}`,
        t.effectiveFrom,
        `${t.fuelPercentage}%`,
        `${t.gstPercentage}%`,
        `${t.codPercentage}%`,
        withinCity,
        sameProv,
        diffProv,
        addKg,
      ];
    });

    const wsSummary = XLSX.utils.aoa_to_sheet([
      ["SHIP ASAAN MASTER DOMESTIC TARIFF CONSOLIDATED AUDIT"],
      [`Export Date: ${dateStr}`, `Total Active Contracts: ${domTariffs.length}`],
      [""],
      summaryHeader,
      ...summaryRows,
    ]);

    wsSummary["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 18 },
      { wch: 28 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Domestic Master Tariffs");

    XLSX.writeFile(wb, `ShipAsaan_Domestic_Master_Tariffs_${dateStr}.xlsx`);
  } else {
    // International
    const intlTariffs = tariffs as TariffInternational[];

    const summaryHeader = [
      "Tariff ID",
      "Carrier",
      "Service",
      "Name",
      "Effective From",
      "Fuel %",
      "Divisor",
      "Remote Fee",
      "Active Coverage / Zones",
    ];

    const summaryRows = intlTariffs.map((t) => [
      t.id,
      t.partnerName,
      t.service,
      t.name,
      t.effectiveFrom,
      `${t.fuelPercentage}%`,
      t.volumetricDivisor,
      t.remoteAreaFee,
      t.rateMatrix?.columns?.map((c) => c.key).join(", ") ||
        `${t.rates?.length || 0} Rate Tiers`,
    ]);

    const wsSummary = XLSX.utils.aoa_to_sheet([
      ["SHIP ASAAN MASTER INTERNATIONAL TARIFF CONSOLIDATED AUDIT"],
      [`Export Date: ${dateStr}`, `Total Active Contracts: ${intlTariffs.length}`],
      [""],
      summaryHeader,
      ...summaryRows,
    ]);

    wsSummary["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 28 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 18 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "International Master Tariffs");

    XLSX.writeFile(wb, `ShipAsaan_International_Master_Tariffs_${dateStr}.xlsx`);
  }
};

/**
 * Exports a formal customer logistics rate quotation to Excel
 */
export const exportQuotationSlipToExcel = (params: {
  quoteRef: string;
  isDomestic: boolean;
  origin: string;
  destination: string;
  actualWeightKg: number;
  chargeableWeightKg: number;
  dimensions?: { length: number; width: number; height: number };
  codAmount?: number;
  selectedResult: CalculationDomesticResult | CalculationInternationalResult;
  allResults?: (CalculationDomesticResult | CalculationInternationalResult)[];
}) => {
  const wb = XLSX.utils.book_new();
  const {
    quoteRef,
    isDomestic,
    origin,
    destination,
    actualWeightKg,
    chargeableWeightKg,
    dimensions,
    codAmount = 0,
    selectedResult,
    allResults = [],
  } = params;

  const tariffLabel =
    selectedResult.sourceDocName ||
    `${selectedResult.partnerName} Master Rate Card (v${selectedResult.tariffVersion})`;

  const quoteSheetData: any[][] = [
    ["SHIP ASAAN LOGISTICS - OFFICIAL FREIGHT QUOTATION"],
    ["Quotation Reference", quoteRef],
    ["Issue Date", new Date().toLocaleString()],
    ["Scope", isDomestic ? "Pakistan Domestic Delivery" : "International Air Express"],
    [""],
    ["CONSIGNMENT SPECIFICATIONS"],
    ["Origin / Shipper Station", origin],
    ["Destination Station", destination],
    ["Actual Scale Weight", `${actualWeightKg.toFixed(2)} kg`],
    ["Chargeable Weight", `${chargeableWeightKg.toFixed(2)} kg`],
    [
      "Dimensions (L × W × H)",
      dimensions
        ? `${dimensions.length} × ${dimensions.width} × ${dimensions.height} cm`
        : "Standard",
    ],
    ["Declared COD Amount", codAmount > 0 ? `PKR ${codAmount.toLocaleString()}` : "None"],
    [""],
    ["RECOMMENDED CARRIER & TARIFF DETAILS"],
    ["Selected Carrier", selectedResult.partnerName],
    ["Service Tier", selectedResult.service],
    ["Effective Tariff", tariffLabel],
    ["Total Payable", `PKR ${selectedResult.totalPayable.toLocaleString()}`],
    [""],
    ["ITEMIZED CHARGE BREAKDOWN"],
    ["Charge Component", "Rate / Calculation Applied", "Amount (PKR)"],
    ...selectedResult.chargesBreakdown.map((item) => [
      item.name,
      item.rateApplied,
      item.amount,
    ]),
    ["TOTAL PAYABLE FREIGHT", "Final Inclusive Amount", selectedResult.totalPayable],
    [""],
  ];

  // If there are other compared couriers, append them as a benchmarking table
  if (allResults.length > 1) {
    quoteSheetData.push(
      ["CARRIER BENCHMARK COMPARISON"],
      ["Carrier", "Service Tier", "Estimated Transit", "Total Payable (PKR)", "Cost Difference"],
      ...allResults.map((r) => {
        const diff = r.totalPayable - selectedResult.totalPayable;
        const diffStr =
          diff === 0 ? "Cheapest Option" : `+PKR ${diff.toLocaleString()}`;
        const estTransit =
          (r as any).expectedTransitDays ||
          (isDomestic ? "24-48 Hours" : "3-5 Business Days");

        return [
          r.partnerName,
          r.service,
          estTransit,
          r.totalPayable,
          diffStr,
        ];
      })
    );
  }

  const ws = XLSX.utils.aoa_to_sheet(quoteSheetData);
  ws["!cols"] = [{ wch: 28 }, { wch: 35 }, { wch: 20 }, { wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, "Quotation Slip");

  const safeOrigin = origin.replace(/[^a-z0-9]/gi, "_");
  const safeDest = destination.replace(/[^a-z0-9]/gi, "_");
  XLSX.writeFile(wb, `Quotation_${quoteRef}_${safeOrigin}_to_${safeDest}.xlsx`);
};

/**
 * Exports calculation history records to Excel for logistics auditing
 */
export const exportHistoryToExcel = (
  history: CalculationHistoryRecord[],
  workspace: WorkspaceType
) => {
  const wb = XLSX.utils.book_new();
  const dateStr = getFormattedDate();

  const header = [
    "Date & Time",
    "Scope",
    "Origin",
    "Destination",
    "Chargeable Weight (kg)",
    "Recommended Courier",
    "Service Tier",
    "Total Payable (PKR)",
    "COD Amount (PKR)",
  ];

  const rows = history.map((h) => [
    h.timestamp,
    h.workspace,
    h.origin,
    h.destination,
    h.weightKg,
    h.partnerName,
    h.service,
    h.totalPayable,
    h.inputSnapshot?.codAmountPkr || 0,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    [`SHIP ASAAN CALCULATION AUDIT TRAIL (${workspace.toUpperCase()})`],
    [`Export Date: ${dateStr}`, `Total Records: ${history.length}`],
    [""],
    header,
    ...rows,
  ]);

  ws["!cols"] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Audit History");

  XLSX.writeFile(wb, `ShipAsaan_Audit_History_${workspace}_${dateStr}.xlsx`);
};
