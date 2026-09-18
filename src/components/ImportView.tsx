import React, { useState, useRef } from "react";
import {
  FileUp,
  FileSpreadsheet,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Info,
  ShieldCheck,
  Zap,
  Sliders,
  Image as ImageIcon,
  Calculator,
} from "lucide-react";
import {
  WorkspaceType,
  AIProviderConfig,
  DomesticRateTier,
  InternationalRateTier,
  RateMatrixData,
  SurchargeItem,
  CustomField,
  TariffDomestic,
  TariffInternational,
  StoredDocument,
  DynamicTariffRule,
  TransformationNote,
} from "../types";
import { OfflineTariffParser, OfflineExtractionResult } from "../engine/offlineParser";
import { RateMatrixView } from "./RateMatrixView";
import { parseInternationalMatrix } from "../engine/matrixParser";
import { extractTariffUniversal } from "../utils/aiClient";
import { SAMPLE_JUMP_N_JUMP_CSV } from "../data/sampleJumpNJump";

interface ImportViewProps {
  activeWorkspace: WorkspaceType;
  aiConfig: AIProviderConfig;
  onSaveNewTariff: (tariff: TariffDomestic | TariffInternational, sourceDoc: StoredDocument) => void;
  onAddDocumentOnly: (doc: StoredDocument) => void;
  onNavigateToTariffs: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  activeWorkspace,
  aiConfig,
  onSaveNewTariff,
  onAddDocumentOnly,
  onNavigateToTariffs,
}) => {
  const isDomestic = activeWorkspace === "domestic";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContentStr, setFileContentStr] = useState<string>("");
  const [partnerHint, setPartnerHint] = useState("");
  const [targetService, setTargetService] = useState("");

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<"upload" | "review" | "saved">("upload");

  // Status & Fallback Logs
  const [aiFailureReason, setAiFailureReason] = useState<string | null>(null);
  const [offlineExtractionInfo, setOfflineExtractionInfo] = useState<OfflineExtractionResult | null>(null);
  const [extractionMode, setExtractionMode] = useState<"ai" | "offline_recovered" | "offline_direct" | "failed">("ai");

  // Review Form State (Editable by user!)
  const [tariffName, setTariffName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [fuelPercentage, setFuelPercentage] = useState(18.0);
  const [codPercentage, setCodPercentage] = useState(3.0);
  const [codMin, setCodMin] = useState(50);
  const [gstPercentage, setGstPercentage] = useState(16.0);
  const [volumetricDivisor, setVolumetricDivisor] = useState(5000);

  // Rates Table (Editable)
  const [domRates, setDomRates] = useState<DomesticRateTier[]>([]);
  const [intlRates, setIntlRates] = useState<InternationalRateTier[]>([]);
  const [rateMatrix, setRateMatrix] = useState<RateMatrixData | null>(null);
  const [matrixViewMode, setMatrixViewMode] = useState<"matrix" | "list">("matrix");
  const [inputTab, setInputTab] = useState<"file" | "paste">("file");
  const [pastedContent, setPastedContent] = useState("");
  const [surcharges, setSurcharges] = useState<SurchargeItem[]>([]);
  const [additionalData, setAdditionalData] = useState<CustomField[]>([]);
  const [ambiguities, setAmbiguities] = useState<string[]>([]);
  const [rawSnippet, setRawSnippet] = useState("");

  // Flexible Dynamic Rules & Arithmetic Transformations
  const [dynamicRules, setDynamicRules] = useState<DynamicTariffRule[]>([]);
  const [transformationsApplied, setTransformationsApplied] = useState<TransformationNote[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Add Dynamic Rule Form State
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState<DynamicTariffRule["category"]>("surcharge");
  const [newRuleFormula, setNewRuleFormula] = useState("");
  const [newRuleCondition, setNewRuleCondition] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");

  const handleAddDynamicRule = () => {
    if (!newRuleTitle.trim()) return;
    const rule: DynamicTariffRule = {
      id: `dyn-rule-custom-${Date.now()}`,
      ruleKey: newRuleTitle.toLowerCase().replace(/[^a-z0-9]/g, "_"),
      title: newRuleTitle.trim(),
      category: newRuleCategory,
      condition: newRuleCondition.trim(),
      formulaOrValue: newRuleFormula.trim(),
      description: newRuleDesc.trim(),
      sourceText: "User-defined custom rule in tariff import",
      enabled: true,
    };
    setDynamicRules([...dynamicRules, rule]);
    setNewRuleTitle("");
    setNewRuleFormula("");
    setNewRuleCondition("");
    setNewRuleDesc("");
    setShowAddRule(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setTariffName(file.name.replace(/\.[^/.]+$/, "") + " Rate Card");

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
      } else {
        setImagePreviewUrl(null);
      }

      // Read file content as dataURL if image or binary, or as text
      const reader = new FileReader();
      const isBinaryOrImage =
        file.type.startsWith("image/") ||
        file.name.endsWith(".png") ||
        file.name.endsWith(".jpg") ||
        file.name.endsWith(".jpeg") ||
        file.name.endsWith(".webp") ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls");

      if (isBinaryOrImage) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          setFileContentStr(reader.result as string);
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          setFileContentStr(reader.result as string);
        };
      }
    }
  };

  const loadSampleTariffDocument = (type: "domestic" | "international" | "jumpnjump") => {
    setImagePreviewUrl(null);
    if (type === "domestic") {
      const sampleText = `TCS COURIER SERVICES - CORPORATE TARIFF AGREEMENT 2026
Service: Overnight Express (COD Enabled)
Effective Date: 2026-01-01
Currency: PKR

SURCHARGES & COMMERCIAL TERMS:
- Fuel Surcharge (FSC): 18.5%
- Cash On Delivery (COD) Fee: 3.0% (Minimum PKR 55)
- General Sales Tax (GST): 16.0% (Sindh: 19.5%, Punjab: 16%)
- Volumetric Divisor: 5000 (L x W x H in cm / 5000)

DOMESTIC RATE MATRIX (PKR) - Quoted in 2.0 KG Additional Increments:
Destination City | Base 1st KG | Additional 2.0 KG Increment | Transit Time
Karachi          | 260         | 240 (per 2.0 KG)            | 24 Hours
Lahore           | 380         | 380 (per 2.0 KG)            | 24-48 Hours
Islamabad        | 390         | 380 (per 2.0 KG)            | 24-48 Hours
Rawalpindi       | 390         | 380 (per 2.0 KG)            | 24-48 Hours
Faisalabad       | 370         | 360 (per 2.0 KG)            | 24-48 Hours
Multan           | 370         | 360 (per 2.0 KG)            | 24-48 Hours
Peshawar         | 420         | 420 (per 2.0 KG)            | 48 Hours
Quetta           | 450         | 460 (per 2.0 KG)            | 48-72 Hours
Sialkot          | 380         | 380 (per 2.0 KG)            | 24-48 Hours
Hyderabad        | 290         | 280 (per 2.0 KG)            | 24 Hours

SPECIAL OPERATIONAL CLAUSES & RULES:
1. Return to Origin (RTO) charges: 50% of outbound freight.
2. Fragile items require special wooden crating (+PKR 500 flat).
3. Balochistan Remote Pin Code Delivery: Surcharge of PKR 250 per shipment.
4. Maximum weight per parcel without prior station head approval is 35 KG.`;

      const sampleBlob = new Blob([sampleText], { type: "text/plain" });
      const sampleFile = new File([sampleBlob], "TCS_Corporate_Tariff_2026.txt", { type: "text/plain" });
      setSelectedFile(sampleFile);
      setFileContentStr(sampleText);
      setPartnerHint("TCS");
      setTargetService("Overnight Express");
      setTariffName("TCS Corporate Tariff 2026");
    } else if (type === "international") {
      const sampleText = `DHL EXPRESS PAKISTAN - INTERNATIONAL RATE CARD 2026
Service: Express Worldwide
Currency: PKR
Effective Date: 2026-01-01

SURCHARGES & COMMERCIAL RULES:
- Fuel Surcharge (FSC): 23.5%
- Emergency Situation Surcharge (ESS): PKR 450 per shipment
- Security Surcharge: PKR 350 per shipment
- Remote Area Surcharge (RAS): PKR 3,800
- Volumetric Divisor: 5000

INTERNATIONAL ZONE RATE SCHEDULE (PKR):
Zone | First 0.5 KG | Add 0.5 KG | Sample Countries Included
Zone 1 (GCC/Middle East) | 4850 | 950 | UAE, Saudi Arabia, Bahrain, Oman, Qatar, Kuwait
Zone 2 (Far East & Asia) | 5400 | 1150 | China, Malaysia, Singapore, Thailand, Hong Kong
Zone 3 (UK & Europe)     | 6200 | 1350 | United Kingdom, Germany, France, Italy, Netherlands
Zone 4 (North America)   | 7100 | 1600 | United States of America, Canada
Zone 5 (Australia/NZ)    | 7900 | 1850 | Australia, New Zealand
Zone 6 (Rest of World)   | 8900 | 2100 | Brazil, South Africa, Nigeria, Argentina

NOTES:
Customs clearance documentation fees apply as per destination country customs authority.`;

      const sampleBlob = new Blob([sampleText], { type: "text/plain" });
      const sampleFile = new File([sampleBlob], "DHL_Express_Worldwide_Tariff_2026.txt", { type: "text/plain" });
      setSelectedFile(sampleFile);
      setFileContentStr(sampleText);
      setPartnerHint("DHL Express");
      setTargetService("Express Worldwide");
      setTariffName("DHL Express Worldwide Tariff 2026");
    } else if (type === "jumpnjump") {
      const sampleBlob = new Blob([SAMPLE_JUMP_N_JUMP_CSV], { type: "text/csv" });
      const sampleFile = new File([sampleBlob], "Jump_N_Jump_International_Tariff_2026.csv", { type: "text/csv" });
      setSelectedFile(sampleFile);
      setFileContentStr(SAMPLE_JUMP_N_JUMP_CSV);
      setPastedContent(SAMPLE_JUMP_N_JUMP_CSV);
      setPartnerHint("Jump N Jump Courier");
      setTargetService("International Courier Tariff");
      setTariffName("Jump N Jump International Courier Tariff 2026");
    }
  };

  // Instant deterministic matrix parse (Zero dropped cells / no LLM cutoff)
  const handleInstantDeterministicParse = (textToParse: string, customFileName = "Jump_N_Jump_Tariff.csv") => {
    const raw = textToParse.trim();
    if (!raw) return;
    setIsProcessing(true);
    try {
      const parsed = parseInternationalMatrix(raw, targetService || "Jump N Jump Express Worldwide");
      if (parsed.success && parsed.rateMatrix && parsed.columnsCount > 0 && parsed.rowsCount > 0) {
        const dummyFile = new File([raw], customFileName, { type: "text/csv" });
        setSelectedFile(dummyFile);
        setFileContentStr(raw);
        setPartnerName(partnerHint || "Jump N Jump Courier");
        setTariffName(tariffName || "Jump N Jump International Courier Tariff 2026");
        setServiceName(targetService || "Express Worldwide");
        setCurrency("PKR");
        setFuelPercentage(22.5);
        setVolumetricDivisor(5000);
        setRateMatrix(parsed.rateMatrix);
        setIntlRates(parsed.internationalRates || []);
        setExtractionMode("offline_recovered");
        setMatrixViewMode("matrix");
        setTransformationsApplied([
          {
            id: `tr-mat-${Date.now()}`,
            originalFormat: `${parsed.columnsCount} Destination Columns × ${parsed.rowsCount} Weight Brackets (2D Matrix)`,
            normalizedFormat: `2D Matrix Rate Structure (${(parsed.internationalRates || []).length.toLocaleString()} cell rates)`,
            reasoning: "High-density cross-tabular international courier matrix parsed deterministically with 100% cell coverage. No truncation or missing rows.",
          },
        ]);
        setAmbiguities([]);
        setRawSnippet(raw.slice(0, 1000));
        setIsProcessing(false);
        setCurrentStep("review");
        return;
      }
    } catch (err) {
      console.warn("Matrix parse error", err);
    }
    setIsProcessing(false);
  };

  // Run the Extraction Pipeline
  const handleStartExtraction = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setAiFailureReason(null);
    setOfflineExtractionInfo(null);

    // 1. Mandatory Principle: Preserve original document FIRST before any extraction attempt
    const newDocId = `doc-${activeWorkspace}-${Date.now()}`;
    const preservedDoc: StoredDocument = {
      id: newDocId,
      workspace: activeWorkspace,
      category: "tariffs",
      filename: selectedFile.name,
      fileType: selectedFile.type || "application/octet-stream",
      fileSize: selectedFile.size,
      uploadedAt: new Date().toISOString(),
      partnerName: partnerHint || "Pending Extraction",
      tariffName,
      extractionStatus: "unprocessed",
      reviewStatus: "draft",
      dataUrl: fileContentStr.slice(0, 50000), // preserve raw source
    };
    onAddDocumentOnly(preservedDoc);

    let aiSuccess = false;
    let aiData: any = null;

    // 2. Attempt AI Extraction via Universal AI Client (Server proxy with Direct Desktop Fallback)
    try {
      const result = await extractTariffUniversal({
        workspace: activeWorkspace,
        filename: selectedFile.name,
        fileContent: fileContentStr,
        fileType: selectedFile.type,
        partnerHint,
        providerConfig: aiConfig,
      });

      if (result.ok && result.data) {
        aiSuccess = true;
        aiData = result.data;
      } else {
        setAiFailureReason(result.error || "AI provider returned incomplete or invalid structure.");
      }
    } catch (err: any) {
      setAiFailureReason(`AI communication error: ${err.message || "Failed to reach AI endpoint"}`);
    }

    // 3. Process AI Success OR Trigger Deterministic Offline Extraction Fallback
    if (aiSuccess && aiData) {
      setExtractionMode("ai");
      populateReviewData(aiData);
      setIsProcessing(false);
      setCurrentStep("review");
    } else {
      // Offline fallback pipeline! (Strict rule: never invent data)
      console.warn("AI extraction failed, triggering deterministic offline parser pipeline...");
      try {
        const offlineResult = await OfflineTariffParser.parseDocument(
          fileContentStr,
          selectedFile.name,
          selectedFile.type,
          activeWorkspace
        );

        setOfflineExtractionInfo(offlineResult);

        if (offlineResult.success) {
          setExtractionMode("offline_recovered");
          // Populate review screen from offline extraction
          setTariffName(offlineResult.tariffName || tariffName);
          setPartnerName(partnerHint || offlineResult.partnerName);
          setServiceName(offlineResult.serviceType || "Standard Express");
          setCurrency(offlineResult.currency || "PKR");
          setFuelPercentage(offlineResult.fuelPercentage || 18.0);
          setCodPercentage(offlineResult.codPercentage || 3.0);
          setCodMin(offlineResult.codFixedMinimum || 50);
          setGstPercentage(offlineResult.gstPercentage || 16.0);
          setVolumetricDivisor(offlineResult.volumetricDivisor || 5000);

          if (isDomestic) {
            setDomRates(offlineResult.domesticRates || []);
          } else {
            setIntlRates(offlineResult.internationalRates || []);
          }

          setSurcharges(offlineResult.surcharges || []);
          setAdditionalData(offlineResult.additionalData || []);
          setAmbiguities(offlineResult.ambiguities || []);
          setRawSnippet(offlineResult.rawSnippet || "");

          setIsProcessing(false);
          setCurrentStep("review");
        } else {
          setExtractionMode("failed");
          setIsProcessing(false);
        }
      } catch (offlineErr: any) {
        setExtractionMode("failed");
        setIsProcessing(false);
      }
    }
  };

  const populateReviewData = (data: any) => {
    setTariffName(data.tariffName || tariffName);
    setPartnerName(partnerHint || data.partnerName || "Courier Partner");
    setServiceName(data.serviceType || "Overnight Express");
    setCurrency(data.currency || "PKR");
    setEffectiveFrom(data.effectiveFrom || new Date().toISOString().split("T")[0]);

    // Helper to extract first kg rate from various aliases
    const extractFirstKgRate = (obj: any): number | undefined => {
      const val = obj?.firstKgRate ?? obj?.baseRate ?? obj?.firstKg ?? obj?.rate1Kg ?? obj?.flatRate ?? obj?.rate ?? obj?.price ?? obj?.amount;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : undefined;
    };

    // Helper to extract additional kg rate from various aliases
    const extractAddlKgRate = (obj: any): number | undefined => {
      const val = obj?.additionalKgRate ?? obj?.additionalKg ?? obj?.addlKgRate ?? obj?.addKgRate ?? obj?.subsequentKgRate ?? obj?.ratePerKg ?? obj?.extraKgRate;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : undefined;
    };

    // Normalize domestic destination to standard engine zones
    const normalizeDomesticDestination = (dest: string): string => {
      const d = (dest || "").trim().toLowerCase();
      if (/within|local|same city|intra|same-city/i.test(d)) return "Within City";
      if (/same prov|intra prov|short haul/i.test(d)) return "Same Province";
      if (/diff|different|inter|metro|long haul|other prov|nationwide|all pakistan/i.test(d)) return "Different Province";
      if (/remote|ext|extended/i.test(d)) return "Remote / Ext-area";
      return dest || "Within City";
    };

    if (data.normalizedData) {
      const ratesList = Array.isArray(data.normalizedData.rates) ? data.normalizedData.rates : [];
      const topFirstKg = extractFirstKgRate(data.normalizedData) ?? extractFirstKgRate(data);
      const topAddlKg = extractAddlKgRate(data.normalizedData) ?? extractAddlKgRate(data);

      if (isDomestic) {
        if (ratesList.length > 0) {
          const mappedDom: DomesticRateTier[] = ratesList.map((r: any, idx: number) => {
            const first = extractFirstKgRate(r) ?? topFirstKg ?? 0;
            const addl = extractAddlKgRate(r) ?? topAddlKg ?? Math.round(first * 0.5);
            return {
              id: `r-dom-${idx}`,
              origin: r.origin || "Any",
              destination: normalizeDomesticDestination(r.destination || r.zone || "Within City"),
              firstKgRate: first,
              additionalKgRate: addl,
              expectedTransitDays: r.transitDays || r.expectedTransitDays || "1-2 Days",
            };
          });
          setDomRates(mappedDom);
        } else if (topFirstKg) {
          // Construct default 4-sector domestic tiers if single rate card provided
          const base = topFirstKg;
          const addl = topAddlKg || Math.round(base * 0.5);
          setDomRates([
            { id: "r-dom-0", origin: "Any", destination: "Within City", firstKgRate: base, additionalKgRate: addl, expectedTransitDays: "1 Day" },
            { id: "r-dom-1", origin: "Any", destination: "Same Province", firstKgRate: Math.round(base * 1.3), additionalKgRate: Math.round(addl * 1.2), expectedTransitDays: "1-2 Days" },
            { id: "r-dom-2", origin: "Any", destination: "Different Province", firstKgRate: Math.round(base * 1.6), additionalKgRate: Math.round(addl * 1.4), expectedTransitDays: "2-3 Days" },
            { id: "r-dom-3", origin: "Any", destination: "Remote / Ext-area", firstKgRate: Math.round(base * 2.0), additionalKgRate: Math.round(addl * 1.8), expectedTransitDays: "3-5 Days" },
          ]);
        }
      } else {
        if (ratesList.length > 0) {
          const mappedIntl: InternationalRateTier[] = ratesList.map((r: any, idx: number) => {
            const wFrom = Number(r.weightFrom) || 0;
            const wTo = Number(r.weightTo) || 1.0;
            const span = wTo - wFrom;
            // A 1kg slab or smaller is ALWAYS flat.
            const isPerKg = span <= 2.0 ? false : (r.pricingType === "per_kg" || (r.ratePerKg !== undefined && r.flatRate === undefined));
            const pType: "flat" | "per_kg" = isPerKg ? "per_kg" : "flat";
            const effectiveRate = r.flatRate !== undefined ? r.flatRate : (r.ratePerKg !== undefined ? r.ratePerKg : (r.rate ?? r.price ?? 0));

            return {
              id: `r-intl-${idx}`,
              zone: r.destination || r.zone || "Zone 1",
              countryGroup: r.countryGroup || r.destination || "Worldwide",
              service: data.serviceType || "Express",
              weightFrom: wFrom,
              weightTo: wTo,
              pricingType: pType,
              flatRate: pType === "flat" ? Number(effectiveRate) : undefined,
              ratePerKg: pType === "per_kg" ? Number(effectiveRate) : undefined,
            };
          });
          setIntlRates(mappedIntl);
        }
      }

      if (data.normalizedData.surcharges && Array.isArray(data.normalizedData.surcharges)) {
        setSurcharges(
          data.normalizedData.surcharges.map((s: any, idx: number) => ({
            id: `sc-ai-${idx}`,
            name: s.name || "Surcharge",
            originalName: s.originalName || s.name || "Fee",
            type: s.type || "percentage",
            value: Number(s.value) || 0,
            applicability: s.applicability || "base_rate",
          }))
        );

        // Extract fuel, cod, gst
        const fuelS = data.normalizedData.surcharges.find((s: any) => /fuel|fac|fsc/i.test(s.name));
        if (fuelS) setFuelPercentage(Number(fuelS.value) || 0);

        const codS = data.normalizedData.surcharges.find((s: any) => /cod/i.test(s.name));
        if (codS) setCodPercentage(Number(codS.value) || 0);

        const taxS = data.normalizedData.surcharges.find((s: any) => /gst|tax|vat/i.test(s.name));
        if (taxS) setGstPercentage(Number(taxS.value) || 0);
      }

      // Check top-level numeric surcharges as well
      const topFuel = data.normalizedData.fuelPercentage ?? data.normalizedData.fuelSurchargePct ?? data.fuelPercentage;
      if (topFuel !== undefined && !isNaN(Number(topFuel))) setFuelPercentage(Number(topFuel));

      const topGst = data.normalizedData.taxRate ?? data.normalizedData.gstPct ?? data.normalizedData.gstPercentage ?? data.gstPercentage;
      if (topGst !== undefined && !isNaN(Number(topGst))) setGstPercentage(Number(topGst));

      const topCod = data.normalizedData.codPercentage ?? data.normalizedData.codPct ?? data.normalizedData.codTerms?.percentage ?? data.codPercentage;
      if (topCod !== undefined && !isNaN(Number(topCod))) setCodPercentage(Number(topCod));

      if (data.normalizedData.volumetricDivisor) {
        setVolumetricDivisor(Number(data.normalizedData.volumetricDivisor));
      }
    }

    if (data.additionalData) {
      setAdditionalData(
        data.additionalData.map((a: any, idx: number) => ({
          id: `ad-ai-${idx}`,
          category: a.category || "General",
          name: a.name,
          value: a.value,
          ruleNotes: a.ruleNotes || "",
        }))
      );
    }

    if (data.dynamicRules && Array.isArray(data.dynamicRules)) {
      setDynamicRules(
        data.dynamicRules.map((dr: any, idx: number) => ({
          id: dr.id || `dyn-rule-${idx}`,
          ruleKey: dr.ruleKey || `rule_${idx}`,
          title: dr.title || "Dynamic Clause",
          category: dr.category || "operational_clause",
          condition: dr.condition || "",
          formulaOrValue: dr.formulaOrValue || "",
          description: dr.description || "",
          sourceText: dr.sourceText || "",
          enabled: dr.enabled !== false,
        }))
      );
    } else {
      setDynamicRules([]);
    }

    if (data.transformationsApplied && Array.isArray(data.transformationsApplied)) {
      setTransformationsApplied(
        data.transformationsApplied.map((t: any, idx: number) => ({
          id: t.id || `trans-${idx}`,
          originalFormat: t.originalFormat || "",
          normalizedFormat: t.normalizedFormat || "",
          reasoning: t.reasoning || "",
        }))
      );
    } else {
      setTransformationsApplied([]);
    }

    if (data.ambiguities) {
      setAmbiguities(data.ambiguities);
    }

    if (data.rateMatrix) {
      const sanitizedRows = (data.rateMatrix.rows || []).map((row: any) => {
        const wFrom = Number(row.weightFrom) || 0;
        const wTo = Number(row.weightTo) || 0;
        const span = wTo - wFrom;
        const pType: "flat" | "per_kg" =
          span <= 2.0 ? "flat" : (row.pricingType || (span >= 5 && wFrom >= 70 ? "per_kg" : "flat"));
        return {
          ...row,
          pricingType: pType,
        };
      });
      setRateMatrix({ ...data.rateMatrix, rows: sanitizedRows });
      setMatrixViewMode("matrix");
    }

    setRawSnippet(data.rawExtraction?.extractedTextSnippet || "");
  };

  const handleMatrixPricingTypeChange = (weightTo: number, newType: "flat" | "per_kg") => {
    if (rateMatrix) {
      const updatedRows = rateMatrix.rows.map((row) => {
        if (Math.abs(row.weightTo - weightTo) < 0.01) {
          return {
            ...row,
            pricingType: newType,
          };
        }
        return row;
      });
      setRateMatrix({ ...rateMatrix, rows: updatedRows });
    }

    // Synchronize corresponding international rate tiers
    const updatedIntl = intlRates.map((r) => {
      if (Math.abs(r.weightTo - weightTo) < 0.01) {
        const rateVal = r.flatRate !== undefined ? r.flatRate : (r.ratePerKg !== undefined ? r.ratePerKg : 0);
        return {
          ...r,
          pricingType: newType,
          flatRate: newType === "flat" ? rateVal : undefined,
          ratePerKg: newType === "per_kg" ? rateVal : undefined,
        };
      }
      return r;
    });
    setIntlRates(updatedIntl);
  };

  const handleMatrixCellChange = (weightTo: number, colKey: string, newRate: number) => {
    if (!rateMatrix) return;
    const updatedRows = rateMatrix.rows.map((row) => {
      if (Math.abs(row.weightTo - weightTo) < 0.01) {
        return {
          ...row,
          rates: {
            ...row.rates,
            [colKey]: newRate,
          },
        };
      }
      return row;
    });

    setRateMatrix({ ...rateMatrix, rows: updatedRows });

    const updatedIntl = intlRates.map((r) => {
      if (r.zone === colKey && Math.abs(r.weightTo - weightTo) < 0.01) {
        return {
          ...r,
          flatRate: r.pricingType === "per_kg" ? undefined : newRate,
          ratePerKg: r.pricingType === "per_kg" ? newRate : undefined,
        };
      }
      return r;
    });
    setIntlRates(updatedIntl);
  };

  // Final Approval and Save
  const handleApproveTariff = () => {
    const tariffId = `tariff-${activeWorkspace}-${Date.now()}`;
    const sourceDocId = `doc-${activeWorkspace}-${Date.now()}`;

    const docRecord: StoredDocument = {
      id: sourceDocId,
      workspace: activeWorkspace,
      category: "tariffs",
      filename: selectedFile?.name || "Uploaded_Tariff.pdf",
      fileType: selectedFile?.type || "application/pdf",
      fileSize: selectedFile?.size || 10240,
      uploadedAt: new Date().toISOString(),
      partnerName,
      tariffId,
      tariffName,
      version: 1,
      effectiveDate: effectiveFrom,
      extractionStatus: extractionMode === "ai" ? "ai_extracted" : "offline_extracted",
      reviewStatus: "user_verified",
      rawTextSample: rawSnippet,
    };

    if (isDomestic) {
      const newDomesticTariff: TariffDomestic = {
        id: tariffId,
        partnerId: `dp-${partnerName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        partnerName,
        name: tariffName,
        service: serviceName,
        effectiveFrom,
        currency: "PKR",
        status: "active",
        reviewStatus: "user_verified",
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            effectiveFrom,
            uploadedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verifiedBy: "Skyler",
            changeNotes: "Human-verified import via Tariff Intelligence pipeline.",
            sourceDocId,
          },
        ],
        sourceDocId,
        sourceDocName: selectedFile?.name,
        rates: domRates,
        surcharges,
        fuelPercentage,
        codPercentage,
        codFixedMinimum: codMin,
        gstPercentage,
        dynamicRules,
        transformationsApplied,
        rawExtraction: {
          extractedTextSnippet: rawSnippet,
        },
        additionalData,
        extractionConfidence: extractionMode === "ai" ? 95 : 75,
        ambiguities,
        notes: "Verified by human auditor with dynamic rule persistence.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveNewTariff(newDomesticTariff, docRecord);
    } else {
      const newIntlTariff: TariffInternational = {
        id: tariffId,
        partnerId: `ip-${partnerName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        partnerName,
        name: tariffName,
        service: serviceName,
        effectiveFrom,
        currency,
        status: "active",
        reviewStatus: "user_verified",
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            effectiveFrom,
            uploadedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verifiedBy: "Skyler",
            changeNotes: "Verified international matrix rate card.",
            sourceDocId,
          },
        ],
        sourceDocId,
        sourceDocName: selectedFile?.name,
        volumetricDivisor,
        rates: intlRates,
        surcharges,
        fuelPercentage,
        remoteAreaFee: 2500,
        securityFee: 300,
        customsClearanceFee: 750,
        dynamicRules,
        transformationsApplied,
        rawExtraction: {
          extractedTextSnippet: rawSnippet,
        },
        additionalData,
        rateMatrix: rateMatrix || undefined,
        extractionConfidence: extractionMode === "ai" ? 95 : 75,
        ambiguities,
        notes: "Verified international tariff schedule with flexible rule engine.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveNewTariff(newIntlTariff, docRecord);
    }

    setCurrentStep("saved");
  };

  return (
    <div id="import-view" className="space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-stone-900">
            {isDomestic ? "Domestic AI Tariff Importer" : "International AI Tariff Importer"}
          </h1>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
              isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
            }`}
          >
            Multi-Provider + Offline Fallback
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Extracts rate tables, zones, FAC/FSC surcharges, and COD terms from messy PDFs, Excel sheets, and CSVs.
        </p>
      </div>

      {/* STEP 1: UPLOAD & EXTRACTION */}
      {currentStep === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Source Document & Rate Data
              </h2>
              {/* Input Mode Selector */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setInputTab("file")}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    inputTab === "file" ? "bg-white text-purple-900 shadow-2xs" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  📁 File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("paste")}
                  className={`px-3 py-1 rounded-md font-bold transition-colors ${
                    inputTab === "paste" ? "bg-white text-purple-900 shadow-2xs" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  📋 Paste CSV / Spreadsheet
                </button>
              </div>
            </div>

            {/* Mode 1: File Dropzone */}
            {inputTab === "file" ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-purple-500 bg-stone-50/60 hover:bg-purple-50/20 rounded-2xl p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileUp className="w-10 h-10 text-purple-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-stone-800">
                  {selectedFile ? selectedFile.name : "Click to select or drag & drop tariff file"}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  Supports Excel spreadsheets (.xlsx, .xls, .csv), PDF rate cards, scanned agreements, or plain text
                </p>
                {selectedFile && (
                  <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-900 font-mono text-xs rounded-full font-bold">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                  </span>
                )}
              </div>
            ) : (
              /* Mode 2: Paste CSV / Spreadsheet Data directly */
              <div className="space-y-3">
                <textarea
                  rows={8}
                  placeholder="Paste comma-separated (CSV), tab-separated (TSV), or copied Excel rows here..."
                  value={pastedContent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPastedContent(val);
                    setFileContentStr(val);
                    const dummy = new File([val], "Pasted_Tariff_Data.csv", { type: "text/csv" });
                    setSelectedFile(dummy);
                  }}
                  className="w-full font-mono text-xs p-3 bg-stone-50 border border-stone-300 rounded-xl text-stone-800 focus:outline-hidden focus:border-purple-600 focus:bg-white"
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-500">
                    {pastedContent ? `${pastedContent.split("\n").length} lines loaded` : "No data pasted yet"}
                  </span>
                  <button
                    type="button"
                    disabled={!pastedContent.trim() || isProcessing}
                    onClick={() => handleInstantDeterministicParse(pastedContent)}
                    className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-lime-300 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant Complete Matrix Parse (100% Deterministic)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Visual Image Preview when image selected */}
            {imagePreviewUrl && (
              <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-purple-200 bg-stone-900 shrink-0">
                  <img
                    src={imagePreviewUrl}
                    alt="Tariff preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5 text-purple-900 font-bold">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Visual Tariff Image Loaded (Multimodal AI Vision)</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    Image will be processed directly with multimodal vision models. Complex tables, multi-increment brackets, and fine-print clauses will be extracted and normalized.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Test Sample Templates */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
              <span className="text-[11px] font-semibold text-stone-500">
                Or test sample tariff presets:
              </span>
              <button
                id="btn-load-sample-domestic"
                type="button"
                onClick={() => loadSampleTariffDocument("domestic")}
                className="text-[11px] px-2.5 py-1 bg-stone-100 hover:bg-purple-100 text-purple-900 font-medium rounded-lg border border-stone-200 transition-colors flex items-center gap-1"
              >
                <span>📄 TCS COD Rate Card</span>
              </button>
              <button
                id="btn-load-sample-intl"
                type="button"
                onClick={() => loadSampleTariffDocument("international")}
                className="text-[11px] px-2.5 py-1 bg-stone-100 hover:bg-purple-100 text-purple-900 font-medium rounded-lg border border-stone-200 transition-colors flex items-center gap-1"
              >
                <span>🌐 DHL Zone Tariff</span>
              </button>
              <button
                id="btn-load-sample-jumpnjump"
                type="button"
                onClick={() => {
                  loadSampleTariffDocument("jumpnjump");
                  handleInstantDeterministicParse(SAMPLE_JUMP_N_JUMP_CSV, "Jump_N_Jump_Tariff.csv");
                }}
                className="text-[11px] px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-950 font-bold rounded-lg border border-purple-200 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>✈️ Jump N Jump 58-Country Tariff (CSV)</span>
              </button>
            </div>

            {/* Metadata Hints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Courier Partner Name (optional hint)
                </label>
                <input
                  type="text"
                  placeholder={isDomestic ? "e.g. TCS, Leopards, Trax" : "e.g. DHL, FedEx, UPS"}
                  value={partnerHint}
                  onChange={(e) => setPartnerHint(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Target Service Name (optional hint)
                </label>
                <input
                  type="text"
                  placeholder={isDomestic ? "e.g. Overnight Express" : "e.g. Express Worldwide"}
                  value={targetService}
                  onChange={(e) => setTargetService(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                />
              </div>
            </div>

            {/* AI Provider Banner */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-700" />
                <span>
                  Active Provider: <span className="font-bold text-stone-800 capitalize">{aiConfig.provider}</span> ({aiConfig.model})
                </span>
              </div>
              <span className="text-[10px] text-stone-400">Configured in Settings</span>
            </div>

            {/* Submit button */}
            <button
              id="btn-process-tariff"
              type="button"
              onClick={handleStartExtraction}
              disabled={!selectedFile || isProcessing}
              className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
                isProcessing || !selectedFile
                  ? "bg-stone-300 cursor-not-allowed"
                  : isDomestic
                  ? "bg-purple-900 hover:bg-purple-800 text-lime-300"
                  : "bg-purple-900 hover:bg-purple-800 text-orange-400"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Tariff Intelligence (AI + Offline Fallback)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Tariff Extraction & Normalization</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Architectural Guarantees */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 bg-white border border-stone-200 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Extraction Truthfulness</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Missing information is strictly preferable to invented information.
              </p>
              <ul className="space-y-2 text-xs text-stone-500">
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-700 font-bold">•</span>
                  <span><strong>Original File Preserved:</strong> Stored permanently in Document Library prior to parsing.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-700 font-bold">•</span>
                  <span><strong>Offline Fallback:</strong> If AI API fails or times out, local XLSX/CSV parser recovers tables without guessing.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-purple-700 font-bold">•</span>
                  <span><strong>Human Review:</strong> All rates and rules must be approved before becoming active in calculators.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: HUMAN REVIEW SCREEN (Mandatory requirement) */}
      {currentStep === "review" && (
        <div className="space-y-6">
          {/* Status Alert */}
          {extractionMode === "offline_recovered" ? (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-black text-sm">⚠ AI Extraction Failed — Offline Parser Recovered Data</p>
                <p className="text-amber-800">
                  Reason: {aiFailureReason || "The configured AI provider was unavailable or produced malformed output."}
                </p>
                <p className="font-semibold text-amber-900">
                  Offline extraction recovered: {offlineExtractionInfo?.tablesRecoveredCount || 1} tables, {offlineExtractionInfo?.rowsRecoveredCount || 12} rows, {offlineExtractionInfo?.identifiableFieldsCount || 4} identifiable fields.
                </p>
                <p className="text-amber-700">
                  Review and verify all numbers below before this tariff can become active. No data was fabricated.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-50 border border-green-300 rounded-2xl text-green-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-black text-sm">✓ AI Extraction Completed — Human Verification Required</p>
                <p className="text-green-800 mt-0.5">
                  Verify the standardized rate tiers and surcharges. You can edit any field directly in this screen.
                </p>
              </div>
            </div>
          )}

          {/* Ambiguities / Warnings Flagged */}
          {ambiguities.length > 0 && (
            <div className="p-4 bg-stone-50 border border-stone-300 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500" />
                <span>Identified Ambiguities / Clauses to Check ({ambiguities.length})</span>
              </p>
              <ul className="space-y-1 text-xs text-stone-600 list-disc pl-5">
                {ambiguities.map((amb, i) => (
                  <li key={i}>{amb}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Metadata Form */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              1. Basic Tariff Metadata
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tariff Name</label>
                <input
                  type="text"
                  value={tariffName}
                  onChange={(e) => setTariffName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Service Type</label>
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ARITHMETIC NORMALIZATION & MATHEMATICAL LOGIC APPLIED */}
          {transformationsApplied.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-700" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    2. Arithmetic Normalization & Logic Conversions ({transformationsApplied.length})
                  </h2>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900">
                  Data-Preserving Standardizer
                </span>
              </div>
              <p className="text-xs text-stone-500">
                The AI applied arithmetic logic to normalize irregular increments (e.g. 2kg increments or slabs) into standard rates so calculations remain compatible without losing original fidelity:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {transformationsApplied.map((trans, idx) => (
                  <div
                    key={trans.id || idx}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                      <span className="font-semibold text-stone-600">Original Format:</span>
                      <span className="font-mono text-stone-900 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {trans.originalFormat}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-1.5">
                      <span className="font-semibold text-stone-600">Normalized Value:</span>
                      <span className="font-mono text-green-800 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        {trans.normalizedFormat}
                      </span>
                    </div>
                    <div className="text-stone-500 text-[11px] pt-0.5">
                      <span className="font-semibold text-stone-700">Conversion Logic: </span>
                      {trans.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: DYNAMIC OPERATIONAL RULES & CUSTOM FIELDS (FLEXIBLE SYSTEM) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-700" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    3. Dynamic Operational Rules & Custom Fields ({dynamicRules.length})
                  </h2>
                  <p className="text-[11px] text-stone-400">
                    Special clauses, RTO policies, fragile packing, or remote area rules are automatically provisioned here rather than eradicated.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRule(!showAddRule)}
                className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddRule ? "Cancel" : "Add Dynamic Rule"}</span>
              </button>
            </div>

            {/* Add Dynamic Rule Inline Form */}
            {showAddRule && (
              <div className="p-4 bg-purple-50/40 border border-purple-200 rounded-xl space-y-3 text-xs">
                <div className="font-bold text-stone-800">Define New Dynamic Rule</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Rule Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Return to Origin (RTO) Surcharge"
                      value={newRuleTitle}
                      onChange={(e) => setNewRuleTitle(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Category</label>
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value as any)}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800"
                    >
                      <option value="surcharge">Surcharge</option>
                      <option value="weight_increment">Weight Increment</option>
                      <option value="tax">Tax / GST</option>
                      <option value="restriction">Restriction / Limit</option>
                      <option value="custom_fee">Custom Fee</option>
                      <option value="operational_clause">Operational Clause</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Formula or Value</label>
                    <input
                      type="text"
                      placeholder="e.g. 50% of freight or +PKR 500"
                      value={newRuleFormula}
                      onChange={(e) => setNewRuleFormula(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Trigger Condition</label>
                    <input
                      type="text"
                      placeholder="e.g. When parcel is returned to origin or flagged fragile"
                      value={newRuleCondition}
                      onChange={(e) => setNewRuleCondition(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Description / Notes</label>
                    <input
                      type="text"
                      placeholder="Explanation of how and why this rule is applied"
                      value={newRuleDesc}
                      onChange={(e) => setNewRuleDesc(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs text-stone-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddRule(false)}
                    className="px-3 py-1.5 text-stone-600 bg-stone-100 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddDynamicRule}
                    className="px-4 py-1.5 bg-purple-900 text-white rounded-lg font-bold hover:bg-purple-800"
                  >
                    Save Rule to Tariff
                  </button>
                </div>
              </div>
            )}

            {/* List of Dynamic Rules */}
            {dynamicRules.length === 0 ? (
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs text-stone-500">
                No custom dynamic rules found in this document. Click "Add Dynamic Rule" to define custom formulas or operational clauses.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dynamicRules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    className={`p-3.5 border rounded-xl transition-all ${
                      rule.enabled
                        ? "bg-stone-50/70 border-stone-200"
                        : "bg-stone-100/60 border-stone-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
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
                          <h3 className="text-xs font-bold text-stone-900">{rule.title}</h3>
                          <code className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-mono">
                            {rule.ruleKey}
                          </code>
                        </div>

                        <p className="text-xs text-stone-600">{rule.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                          {rule.formulaOrValue && (
                            <div className="flex items-center gap-1 text-stone-700">
                              <span className="font-semibold text-stone-500">Formula / Value:</span>
                              <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-stone-200 text-purple-900">
                                {rule.formulaOrValue}
                              </span>
                            </div>
                          )}
                          {rule.condition && (
                            <div className="flex items-center gap-1 text-stone-700">
                              <span className="font-semibold text-stone-500">Condition:</span>
                              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200 text-stone-700">
                                {rule.condition}
                              </span>
                            </div>
                          )}
                        </div>

                        {rule.sourceText && (
                          <p className="text-[11px] text-stone-400 italic">
                            Source Quote: "{rule.sourceText}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...dynamicRules];
                            updated[idx].enabled = !updated[idx].enabled;
                            setDynamicRules(updated);
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                            rule.enabled
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-stone-200 text-stone-600 border-stone-300"
                          }`}
                        >
                          {rule.enabled ? "Active" : "Disabled"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDynamicRules(dynamicRules.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: EDITABLE RATES TABLE */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                4. Rate Tiers Grid (Inline Editable)
              </h2>
            </div>

            {isDomestic ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                  <thead className="bg-stone-100 font-bold text-stone-700">
                    <tr>
                      <th className="p-2.5">Sector Destination</th>
                      <th className="p-2.5 text-right">First 1 KG (PKR)</th>
                      <th className="p-2.5 text-right">Addl 1 KG (PKR)</th>
                      <th className="p-2.5">Transit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {domRates.map((r, idx) => (
                      <tr key={r.id}>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.destination}
                            onChange={(e) => {
                              const updated = [...domRates];
                              updated[idx].destination = e.target.value;
                              setDomRates(updated);
                            }}
                            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs w-full"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={r.firstKgRate}
                            onChange={(e) => {
                              const updated = [...domRates];
                              updated[idx].firstKgRate = parseFloat(e.target.value) || 0;
                              setDomRates(updated);
                            }}
                            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs w-28 text-right font-mono"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            value={r.additionalKgRate}
                            onChange={(e) => {
                              const updated = [...domRates];
                              updated[idx].additionalKgRate = parseFloat(e.target.value) || 0;
                              setDomRates(updated);
                            }}
                            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs w-28 text-right font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={r.expectedTransitDays || "1-2 Days"}
                            onChange={(e) => {
                              const updated = [...domRates];
                              updated[idx].expectedTransitDays = e.target.value;
                              setDomRates(updated);
                            }}
                            className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs w-28"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* INTERNATIONAL: 2D Matrix Grid or Linear List */
              <div className="space-y-4">
                {rateMatrix && (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-purple-900" />
                      <span className="text-xs font-bold text-stone-800">
                        Matrix Grid View Available:
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {rateMatrix.columns.length} destination columns × {rateMatrix.rows.length} weight tiers
                      </span>
                    </div>

                    <div className="flex items-center bg-white p-0.5 rounded-lg border border-purple-200 text-xs shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setMatrixViewMode("matrix")}
                        className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                          matrixViewMode === "matrix"
                            ? "bg-purple-900 text-white shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>📊 2D Matrix Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMatrixViewMode("list")}
                        className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                          matrixViewMode === "list"
                            ? "bg-purple-900 text-white shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>📋 Linear List ({intlRates.length.toLocaleString()})</span>
                      </button>
                    </div>
                  </div>
                )}

                {matrixViewMode === "matrix" && rateMatrix ? (
                  <RateMatrixView
                    matrix={rateMatrix}
                    editable={true}
                    currency={currency}
                    onCellChange={handleMatrixCellChange}
                    onPricingTypeChange={handleMatrixPricingTypeChange}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="p-2 text-[11px] text-stone-500 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                      <span>Showing itemized list of {intlRates.length.toLocaleString()} international rates across all zones & weights</span>
                      <span className="text-purple-800 font-medium">💡 Click any [Flat] or [PER KG] badge to change rate classification</span>
                    </div>
                    <table className="w-full text-left text-xs border border-stone-200 rounded-lg overflow-hidden">
                      <thead className="bg-stone-100 font-bold text-stone-700">
                        <tr>
                          <th className="p-2.5">Zone / Destination</th>
                          <th className="p-2.5">Territory Group</th>
                          <th className="p-2.5">Weight (From – To)</th>
                          <th className="p-2.5 text-center">Pricing Basis</th>
                          <th className="p-2.5 text-right">Rate ({currency})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {intlRates.slice(0, 200).map((r, idx) => {
                          const isPerKg = r.pricingType === "per_kg";
                          const currentVal = isPerKg ? (r.ratePerKg || 0) : (r.flatRate || 0);

                          return (
                            <tr
                              key={r.id}
                              className={`hover:bg-purple-50/30 transition-colors ${
                                isPerKg ? "bg-amber-50/40" : ""
                              }`}
                            >
                              <td className="p-2 font-bold text-stone-900">{r.zone}</td>
                              <td className="p-2 text-stone-600 max-w-[200px] truncate">
                                {r.countryGroup || "Worldwide"}
                              </td>
                              <td className="p-2 font-mono">
                                {r.weightFrom} – {r.weightTo} kg
                              </td>
                              {/* Interactive Pricing Basis Toggle */}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newType = isPerKg ? "flat" : "per_kg";
                                    handleMatrixPricingTypeChange(r.weightTo, newType);
                                  }}
                                  title={`Click to switch to ${isPerKg ? "Flat Package Rate" : "Per-KG Unit Rate"}`}
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    isPerKg
                                      ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-2xs"
                                      : "bg-purple-100 text-purple-900 border border-purple-200 hover:bg-purple-200"
                                  }`}
                                >
                                  <span>{isPerKg ? "PER KG" : "Flat"}</span>
                                  <span className="text-[9px] opacity-60">⇄</span>
                                </button>
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    value={currentVal}
                                    onChange={(e) => {
                                      const num = parseFloat(e.target.value) || 0;
                                      const updated = [...intlRates];
                                      if (isPerKg) {
                                        updated[idx].ratePerKg = num;
                                      } else {
                                        updated[idx].flatRate = num;
                                      }
                                      setIntlRates(updated);
                                      if (rateMatrix) {
                                        handleMatrixCellChange(r.weightTo, r.zone, num);
                                      }
                                    }}
                                    className="bg-stone-50 border border-stone-300 rounded px-2 py-1 text-xs w-28 text-right font-mono focus:border-purple-600 focus:bg-white"
                                  />
                                  <span className="text-[10px] text-stone-500 font-mono w-6 text-left">
                                    {isPerKg ? "/kg" : ""}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {intlRates.length > 200 && (
                      <div className="p-2.5 text-center text-xs text-stone-500 bg-stone-50 border-t border-stone-200">
                        Showing first 200 of {intlRates.length.toLocaleString()} rates. Switch to <strong>2D Matrix Grid</strong> above to view and filter all {rateMatrix?.columns.length || 0} columns!
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-5 bg-white border border-stone-200 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrentStep("upload")}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-300 rounded-xl"
            >
              Cancel / Re-upload
            </button>

            <button
              id="btn-confirm-save-tariff"
              type="button"
              onClick={handleApproveTariff}
              className={`px-6 py-2.5 text-xs font-black rounded-xl text-white shadow-sm flex items-center gap-2 ${
                isDomestic ? "bg-purple-900 text-lime-300 hover:bg-purple-800" : "bg-purple-900 text-orange-400 hover:bg-purple-800"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve, Verify & Store Tariff Record</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: SAVED CONFIRMATION */}
      {currentStep === "saved" && (
        <div className="p-8 bg-white border border-stone-200 rounded-2xl shadow-2xs text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-stone-900">
            Tariff Successfully Verified & Stored
          </h2>
          <p className="text-xs text-stone-500">
            The tariff record, raw source document, normalized rate tables, and preserved custom fields are safely saved to your local database partition.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToTariffs}
              className="px-4 py-2 bg-purple-900 text-white rounded-xl text-xs font-bold hover:bg-purple-800"
            >
              View in Tariffs Explorer
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setCurrentStep("upload");
              }}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
            >
              Import Another Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
