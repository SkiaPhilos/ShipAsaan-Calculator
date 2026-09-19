/**
 * Ship Asaan - Tariff Intelligence & Rate Management System
 * Core TypeScript Interfaces and Enums
 */

export type WorkspaceType = "domestic" | "international";

export type AIProviderType = "gemini" | "openai" | "anthropic" | "openrouter" | "groq" | "deepseek" | "custom";

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  customBaseUrl?: string;
  customEndpoint?: string;
  customModel?: string;
  customAuthHeader?: string;
  lastTestedAt?: string;
  testStatus?: "success" | "failed" | "untested";
  testMessage?: string;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: "admin" | "operator" | "auditor";
  status?: "active" | "pending_approval" | "rejected";
  department?: string;
  approvedAt?: string;
  approvedBy?: string;
  lastLoginAttempt?: string;
  lastLoginStatus?: string;
  password?: string; // stored for local desktop app verification
  createdAt: string;
}

export interface LoginAttemptRecord {
  id: string;
  emailOrUsername: string;
  timestamp: string;
  status: "SUCCESS_ADMIN" | "SUCCESS_USER" | "BLOCKED_PENDING_APPROVAL" | "BLOCKED_REJECTED" | "FAILED_CREDENTIALS" | "SIGNUP_PENDING_APPROVAL";
  details: string;
  ip?: string;
  userAgent?: string;
}

export interface AdminEmailNotification {
  id: string;
  type: "USER_SIGNUP_ALERT" | "USER_APPROVED_ALERT" | "SECURITY_ALERT";
  to: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  deliveredVia: "smtp" | "system_mailer";
  read: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityAuditRecord {
  id: string;
  action: "DELETE_ALL_DATA" | "BACKUP_RESTORE" | "USER_LOGIN" | "CONFIG_UPDATE" | "TARIFF_VERIFY" | "TARIFF_DELETE";
  user: string;
  timestamp: string;
  result: "Successful" | "Failed";
  details: string;
  ipOrDevice?: string;
}

// -------------------------------------------------------------
// PARTNERS
// -------------------------------------------------------------
export interface PartnerDomestic {
  id: string;
  name: string;
  code: string;
  contactName: string;
  phone: string;
  email: string;
  services: string[]; // e.g. ['Overnight Express', 'Second Day', 'COD Standard']
  coverageCities: string[]; // e.g. ['Karachi', 'Lahore', 'Islamabad', 'Peshawar']
  provincesCovered: string[];
  accountNo: string;
  contractRef: string;
  effectiveDate: string;
  status: "active" | "inactive";
  notes: string;
  createdAt: string;
}

export interface PartnerInternational {
  id: string;
  name: string;
  code: string;
  contactName: string;
  phone: string;
  email: string;
  services: string[]; // e.g. ['Express Worldwide', 'Priority Parcel', 'Economy']
  countriesCovered: number; // e.g. 220
  zonesCovered: number; // e.g. 8
  volumetricDivisor: number; // e.g. 5000 or 6000
  currency: string; // 'PKR', 'USD', etc.
  accountNo: string;
  contractRef: string;
  effectiveDate: string;
  status: "active" | "inactive";
  notes: string;
  createdAt: string;
}

// -------------------------------------------------------------
// TARIFFS & RATE CARDS
// -------------------------------------------------------------
export type TariffStatus = "active" | "draft" | "needs_review" | "expired";

export type ReviewStatus =
  | "ai_extracted"
  | "ai_extracted_needs_review"
  | "offline_extracted"
  | "offline_needs_review"
  | "user_verified"
  | "draft";

export interface SurchargeItem {
  id: string;
  name: string; // Normalized category, e.g. "Fuel Surcharge", "COD Fee", "GST / Sales Tax"
  originalName: string; // Raw terminology, e.g. "FAC", "COD Handling", "PRA GST"
  type: "percentage" | "fixed";
  value: number; // 18.5 for 18.5%, or 50 for 50 PKR
  applicability: "base_rate" | "total_rate" | "invoice_value" | "flat";
  notes?: string;
}

export interface CustomField {
  id: string;
  category: string;
  name: string;
  value: string;
  ruleNotes: string;
}

export interface DynamicTariffRule {
  id: string;
  ruleKey: string; // e.g. "two_kg_increment_rule", "fragile_surcharge", "rto_penalty", "remote_pincode_fee"
  title: string;
  category: "weight_increment" | "surcharge" | "tax" | "zone_group" | "restriction" | "custom_fee" | "operational_clause";
  condition?: string; // e.g. "weight > 5kg", "destination == Remote Area", "Return to Origin"
  formulaOrValue: string; // e.g. "PKR 150 / 1kg", "50% of outbound freight", "+PKR 500 flat"
  description: string;
  sourceText?: string;
  enabled: boolean;
}

export interface TransformationNote {
  id: string;
  originalFormat: string; // e.g. "Shared in 2kg increments (PKR 300 / 2kg)"
  normalizedFormat: string; // e.g. "Normalized to 1kg increment (PKR 150 / 1kg)"
  reasoning: string;
}

// Domestic Rate Structure: First kg + Additional kg or slabs
export interface DomesticRateTier {
  id: string;
  origin: string; // "Karachi", "Lahore", "Same Province", "Any"
  destination: string; // "Within City", "Same Province", "Different Province", "Remote / Ext-area"
  firstKgRate: number;
  additionalKgRate: number;
  additionalHalfKgRate?: number;
  minimumWeightKg?: number;
  expectedTransitDays?: string;
}

// International Rate Structure: Matrix of Zone × Weight Slab or Country Groups
export interface RateMatrixColumn {
  key: string; // e.g. "CA", "AU", "Zone 1"
  label: string; // e.g. "Canada", "Australia", "Zone 1 (Middle East)"
  countries?: string[]; // e.g. ["Canada"], ["United Arab Emirates", "Saudi Arabia"]
  zoneNumber?: number | string;
}

export interface RateMatrixExcessTier {
  weightFrom: number;
  weightTo: number; // e.g. 99, 1000
  label: string; // e.g. "70.01 – 99 kg"
  rates: Record<string, number>; // key -> per-kg rate
}

export interface RateMatrixRow {
  weightFrom: number;
  weightTo: number;
  weightLabel?: string; // "0.01 – 0.5 kg", "10.01 – 11 kg"
  rates: Record<string, number>; // key -> rate in currency
  pricingType?: "flat" | "per_kg"; // distinguishes flat slab from per-kg tier
}

export interface RateMatrixData {
  columns: RateMatrixColumn[];
  rows: RateMatrixRow[];
  additionalKgRates?: Record<string, number>; // key -> primary additional per kg rate
  excessTiers?: RateMatrixExcessTier[]; // all per-kg tiers above base slabs (e.g. 70.01-99, 99.01-1000)
  maxFlatWeightKg?: number; // threshold weight where flat pricing ends (e.g. 70 kg)
  unit: "kg" | "g";
  origin?: string;
  service?: string;
  sourceSheetName?: string;
}

export interface InternationalRateTier {
  id: string;
  zone: string; // "Zone 1", "Zone 2", "CA", "AU", etc.
  countryGroup?: string; // e.g. "GCC", "North America", "Europe", "Canada"
  countryCode?: string; // e.g. "CA", "AU", "NL", "DE"
  service: string; // "Express", "Economy"
  weightFrom: number;
  weightTo: number;
  flatRate?: number; // for flat package slabs
  ratePerKg?: number; // for per-kg tiers
  pricingType?: "flat" | "per_kg"; // distinguishes flat package slab from per-kg tier
  transitDays?: string;
}

export interface RawExtractionRecord {
  extractedTextSnippet?: string;
  detectedHeaders?: string[];
  originalClauses?: string[];
  rawTables?: Array<{
    title: string;
    columns: string[];
    rows: any[][];
  }>;
}

export interface TariffVersion {
  versionNumber: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  changeNotes: string;
  sourceDocId?: string;
}

export interface TariffDomestic {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  service: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  currency: "PKR";
  status: TariffStatus;
  reviewStatus: ReviewStatus;
  currentVersion: number;
  versions: TariffVersion[];
  sourceDocId?: string;
  sourceDocName?: string;
  rates: DomesticRateTier[];
  surcharges: SurchargeItem[];
  codPercentage: number;
  codFixedMinimum: number;
  gstPercentage: number;
  fuelPercentage: number;
  rawExtraction: RawExtractionRecord;
  additionalData: CustomField[];
  rateMatrix?: RateMatrixData;
  dynamicRules?: DynamicTariffRule[];
  transformationsApplied?: TransformationNote[];
  extractionConfidence?: number;
  ambiguities?: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface TariffInternational {
  id: string;
  partnerId: string;
  partnerName: string;
  name: string;
  service: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  currency: string; // "PKR" | "USD"
  status: TariffStatus;
  reviewStatus: ReviewStatus;
  currentVersion: number;
  versions: TariffVersion[];
  sourceDocId?: string;
  sourceDocName?: string;
  volumetricDivisor: number; // 5000 or 6000
  rates: InternationalRateTier[];
  surcharges: SurchargeItem[];
  fuelPercentage: number;
  remoteAreaFee: number;
  securityFee: number;
  customsClearanceFee: number;
  rawExtraction: RawExtractionRecord;
  additionalData: CustomField[];
  rateMatrix?: RateMatrixData;
  dynamicRules?: DynamicTariffRule[];
  transformationsApplied?: TransformationNote[];
  extractionConfidence?: number;
  ambiguities?: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// -------------------------------------------------------------
// DOCUMENTS REPOSITORY
// -------------------------------------------------------------
export type DocumentCategory = "agreements" | "tariffs" | "contracts" | "rate_cards" | "other";

export interface StoredDocument {
  id: string;
  workspace: WorkspaceType;
  category: DocumentCategory;
  filename: string;
  fileType: string;
  fileSize: number; // in bytes
  uploadedAt: string;
  partnerId?: string;
  partnerName?: string;
  tariffId?: string;
  tariffName?: string;
  version?: number;
  effectiveDate?: string;
  expiryDate?: string;
  extractionStatus:
    | "unprocessed"
    | "ai_extracted"
    | "ai_failed_offline_recovered"
    | "offline_extracted"
    | "failed";
  reviewStatus: ReviewStatus;
  notes?: string;
  tags?: string[];
  rawTextSample?: string;
  dataUrl?: string; // for previewing or re-parsing
}

// -------------------------------------------------------------
// CALCULATION MODELS & RESULTS
// -------------------------------------------------------------
export interface CalculationDomesticInput {
  originCity: string;
  destinationCity: string;
  actualWeightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  codAmountPkr: number;
  serviceType?: string;
  partnerId?: string; // optional: compute for one or all
}

export interface CalculationChargeDetail {
  name: string;
  originalLabel: string;
  type: "base" | "fuel" | "cod" | "tax" | "surcharge" | "fee";
  rateApplied: string; // e.g. "18.5% on PKR 350" or "PKR 50 (min)"
  amount: number;
}

export interface CalculationDomesticResult {
  id: string;
  partnerId: string;
  partnerName: string;
  tariffId: string;
  tariffVersion: number;
  sourceDocName?: string;
  service: string;
  origin: string;
  destination: string;
  destinationZoneType: "Within City" | "Same Province" | "Different Province" | "Remote / Ext-area";
  chargeableWeightKg: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  baseRate: number;
  fuelAmount: number;
  codAmount: number;
  codFee: number;
  gstAmount: number;
  otherSurchargesTotal: number;
  totalPayable: number;
  chargesBreakdown: CalculationChargeDetail[];
  currency: "PKR";
  calculatedAt: string;
  isCovered: boolean;
  uncoveredReason?: string;
}

export interface CalculationInternationalInput {
  originCountry: string; // Default: Pakistan
  destinationCountry: string; // e.g. "United States"
  destinationZone?: string; // e.g. "Zone 3"
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  isRemoteArea?: boolean;
  serviceType?: string;
  partnerId?: string;
}

export interface CalculationInternationalResult {
  id: string;
  partnerId: string;
  partnerName: string;
  tariffId: string;
  tariffVersion: number;
  sourceDocName?: string;
  service: string;
  destinationCountry: string;
  destinationZone: string;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  volumetricDivisorUsed: number;
  baseRate: number;
  fuelSurcharge: number;
  remoteAreaSurcharge: number;
  securityFee: number;
  customsFee: number;
  otherSurchargesTotal: number;
  totalPayable: number;
  chargesBreakdown: CalculationChargeDetail[];
  currency: string;
  calculatedAt: string;
  isCovered: boolean;
  uncoveredReason?: string;
}

export interface CalculationHistoryRecord {
  id: string;
  workspace: WorkspaceType;
  timestamp: string;
  summaryTitle: string;
  origin: string;
  destination: string;
  weightKg: number;
  partnerName: string;
  service: string;
  totalPayable: number;
  currency: string;
  tariffId: string;
  tariffVersion: number;
  sourceDocName?: string;
  inputSnapshot: any;
  resultSnapshot: any;
}

// -------------------------------------------------------------
// LOCATIONS & ZONES
// -------------------------------------------------------------
export interface DomesticCity {
  id: string;
  name: string;
  province: "Sindh" | "Punjab" | "KPK" | "Balochistan" | "ICT" | "AJK" | "Gilgit-Baltistan";
  isHub: boolean;
  zoneTier: "Major City" | "Secondary City" | "Remote / Out of Delivery Area";
  areaGroup?: string;
  deliveryCode?: string;
  tehsilDistrict?: string;
}

export interface InternationalCountryZone {
  countryCode: string; // ISO 3166-1 Alpha-2, e.g. "US", "AE", "GB", "CN", "PK"
  alpha3: string; // ISO 3166-1 Alpha-3, e.g. "USA", "ARE", "GBR", "CHN", "PAK"
  numericCode: string; // ISO 3166-1 Numeric, e.g. "840", "784", "826", "156", "586"
  countryName: string;
  region: string; // e.g. "North America", "Middle East", "Western Europe"
  defaultZone: string; // e.g. "Zone 3"
  isRemoteDefault: boolean;
  aliases?: string[]; // Alternate names, synonyms, and ISO codes
}
