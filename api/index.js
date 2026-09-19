var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => handler,
  maxDuration: () => maxDuration
});
module.exports = __toCommonJS(index_exports);

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var XLSX2 = __toESM(require("xlsx"), 1);

// src/engine/matrixParser.ts
var XLSX = __toESM(require("xlsx"), 1);
var COUNTRY_NAMES_MAP = {
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
  EE: "Estonia"
};
function parseCsvOrTsv(text) {
  const rows = [];
  const lines = text.split(/\r\n|\n|\r/);
  let commaCount = 0;
  let tabCount = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    commaCount += (line.match(/,/g) || []).length;
    tabCount += (line.match(/\t/g) || []).length;
  }
  const delimiter = tabCount > commaCount ? "	" : ",";
  let currentRow = [];
  let currentCell = "";
  let insideQuotes = false;
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        if (insideQuotes && line[c + 1] === '"') {
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
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
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
function parseNumericCell(val) {
  if (val === null || val === void 0) return null;
  const str = String(val).replace(/,/g, "").trim();
  if (!str) return null;
  const num = parseFloat(str);
  return !isNaN(num) && isFinite(num) ? num : null;
}
function parseInternationalMatrix(input, serviceName = "Jump N Jump International") {
  const notes = [];
  let rows = [];
  if (typeof input === "string") {
    try {
      rows = parseCsvOrTsv(input);
    } catch {
      try {
        const workbook = XLSX.read(input, { type: "string" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
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
      notes: ["Insufficient rows to parse tariff matrix."]
    };
  }
  let firstDataRowIdx = -1;
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    const row = rows[r];
    if (!row || row.length < 3) continue;
    const cell0Num = parseNumericCell(row[0]);
    const cell1Num = parseNumericCell(row[1]);
    const cell2Num = parseNumericCell(row[2]);
    let numericCount = 0;
    for (let c = 0; c < row.length; c++) {
      if (parseNumericCell(row[c]) !== null) {
        numericCount++;
      }
    }
    const isCandidateData = (cell0Num !== null || cell1Num !== null && cell2Num !== null) && numericCount >= 3;
    if (isCandidateData) {
      firstDataRowIdx = r;
      break;
    }
  }
  if (firstDataRowIdx === -1) {
    firstDataRowIdx = Math.min(2, rows.length - 1);
  }
  const headerRowIdx = Math.max(0, firstDataRowIdx - 1);
  const headerRow = rows[headerRowIdx] || [];
  let superHeaderRow = null;
  if (headerRowIdx > 0) {
    superHeaderRow = rows[headerRowIdx - 1] || null;
  }
  notes.push(`Identified Header Row at line ${headerRowIdx + 1}, Data starting at line ${firstDataRowIdx + 1}`);
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
  if (c0_r1 !== null && c1_r1 !== null && c0_r1 < c1_r1 && c0_r2 !== null && c1_r2 !== null && c0_r2 < c1_r2) {
    hasDualWeightCols = true;
    weightColFrom = 0;
    weightColTo = 1;
    dataStartCol = 2;
    notes.push(`Detected dual weight columns: Col 0 (From) & Col 1 (To)`);
  } else {
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
  const matrixColumns = [];
  const colIndexMap = [];
  for (let c = dataStartCol; c < headerRow.length; c++) {
    const rawCell = String(headerRow[c] || "").trim().replace(/^"|"$/g, "");
    if (!rawCell || rawCell.toUpperCase() === "COLEND") continue;
    let superZone = "";
    if (superHeaderRow && superHeaderRow[c]) {
      const sVal = String(superHeaderRow[c]).trim().replace(/^"|"$/g, "");
      if (/zone|grp/i.test(sVal)) {
        superZone = sVal.toUpperCase();
      }
    }
    const countryMatches = rawCell.match(/\b[A-Z]{2}\b/g) || [];
    const countryCodes = countryMatches.filter(
      (code) => !["KG", "WT", "ID", "NO", "TO", "LB"].includes(code) || COUNTRY_NAMES_MAP[code]
    );
    let key = "";
    let label = "";
    let zoneNumber = void 0;
    if (superZone) {
      const zoneMatch = superZone.match(/ZONE[-_\s]*([0-9A-Z]+)/i);
      zoneNumber = zoneMatch ? zoneMatch[1] : void 0;
      key = superZone.replace(/[^A-Z0-9]/gi, "_");
      label = `${superZone}: ${countryCodes.slice(0, 4).join(", ")}${countryCodes.length > 4 ? ` (+${countryCodes.length - 4})` : ""}`;
    } else if (/zone/i.test(rawCell)) {
      const zoneMatch = rawCell.match(/ZONE[-_\s]*([0-9A-Z]+)/i);
      zoneNumber = zoneMatch ? zoneMatch[1] : void 0;
      key = rawCell.replace(/[^A-Z0-9]/gi, "_").slice(0, 14);
      label = rawCell;
    } else if (countryCodes.length === 1) {
      const code = countryCodes[0];
      const fullName = COUNTRY_NAMES_MAP[code] || code;
      key = code;
      label = fullName !== code ? `${code} (${fullName})` : code;
    } else if (countryCodes.length > 1 && countryCodes.length <= 3) {
      key = countryCodes.join("_");
      const fullNames = countryCodes.map((c2) => COUNTRY_NAMES_MAP[c2] || c2).join(", ");
      label = `${countryCodes.join(", ")} (${fullNames})`;
    } else if (countryCodes.length > 3) {
      key = `GRP_${countryCodes[0]}_${countryCodes[1]}`;
      label = `Group: ${countryCodes.slice(0, 4).join(", ")} (+${countryCodes.length - 4} countries)`;
    } else {
      key = rawCell.replace(/[^A-Z0-9]/gi, "_").toUpperCase().slice(0, 16);
      label = rawCell;
    }
    let uniqueKey = key;
    let counter = 1;
    while (matrixColumns.some((col) => col.key === uniqueKey)) {
      uniqueKey = `${key}_${counter++}`;
    }
    const colDef = {
      key: uniqueKey,
      label,
      countries: countryCodes.length > 0 ? countryCodes : [uniqueKey],
      zoneNumber
    };
    matrixColumns.push(colDef);
    colIndexMap.push({
      colIdx: c,
      key: uniqueKey,
      label,
      countries: countryCodes,
      zoneNumber
    });
  }
  const matrixRows = [];
  const excessTiers = [];
  const additionalKgRates = {};
  const internationalRates = [];
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
    const rowRates = {};
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
    const span = wTo - wFrom;
    const isWideSpan = span >= 5;
    const prevFlatRate = matrixRows.length > 0 ? matrixRows[matrixRows.length - 1].rates[colIndexMap[0]?.key] || 999999 : 999999;
    const isSignificantPriceDrop = matrixRows.length > 0 && averageRate < prevFlatRate * 0.35;
    const isPerKgBracket = isWideSpan && (wFrom >= 70 && isSignificantPriceDrop || wTo >= 150 || wFrom >= 70 && wTo >= 90);
    const pricingType = isPerKgBracket ? "per_kg" : "flat";
    if (pricingType === "flat") {
      maxFlatWeightKg = Math.max(maxFlatWeightKg, wTo);
    } else {
      excessTiers.push({
        weightFrom: wFrom,
        weightTo: wTo,
        label: `${wFrom} \u2013 ${wTo} kg (Per KG)`,
        rates: { ...rowRates }
      });
      if (Object.keys(additionalKgRates).length === 0) {
        Object.assign(additionalKgRates, rowRates);
      }
    }
    const weightLabel = pricingType === "per_kg" ? `${wFrom} \u2013 ${wTo} kg (Per KG)` : `${wFrom} \u2013 ${wTo} kg`;
    matrixRows.push({
      weightFrom: wFrom,
      weightTo: wTo,
      weightLabel,
      rates: rowRates,
      pricingType
    });
    colIndexMap.forEach((col) => {
      const rateVal = rowRates[col.key];
      if (rateVal !== void 0) {
        internationalRates.push({
          id: `ir-${col.key}-${wTo}-${pricingType}`,
          zone: col.key,
          countryGroup: col.label,
          countryCode: col.countries.length === 1 ? col.countries[0] : void 0,
          service: serviceName,
          weightFrom: wFrom,
          weightTo: wTo,
          pricingType,
          flatRate: pricingType === "flat" ? rateVal : void 0,
          ratePerKg: pricingType === "per_kg" ? rateVal : void 0
        });
      }
    });
  }
  matrixRows.sort((a, b) => a.weightTo - b.weightTo);
  const rateMatrix = {
    columns: matrixColumns,
    rows: matrixRows,
    additionalKgRates: Object.keys(additionalKgRates).length > 0 ? additionalKgRates : void 0,
    excessTiers: excessTiers.length > 0 ? excessTiers : void 0,
    maxFlatWeightKg: maxFlatWeightKg > 0 ? maxFlatWeightKg : void 0,
    unit: "kg",
    origin: "Pakistan",
    service: serviceName
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
    maxFlatWeightKg: maxFlatWeightKg > 0 ? maxFlatWeightKg : void 0,
    detectedZones: matrixColumns.map((c) => c.key),
    notes
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, _res, next) => {
  const orig = (req.originalUrl || req.headers["x-matched-path"] || req.url || "").split("?")[0];
  if (orig.startsWith("/api") && !req.url.startsWith("/api")) {
    req.url = orig + (req.url.includes("?") ? `?${req.url.split("?")[1]}` : "");
  }
  next();
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
var AUTH_STORE_PATH = import_path.default.join(process.cwd(), "data", "auth_store.json");
var authStore = {
  users: [],
  loginAttempts: [],
  notifications: []
};
try {
  if (import_fs.default.existsSync(AUTH_STORE_PATH)) {
    const raw = import_fs.default.readFileSync(AUTH_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.users)) authStore.users = parsed.users;
    if (Array.isArray(parsed.loginAttempts)) authStore.loginAttempts = parsed.loginAttempts;
    if (Array.isArray(parsed.notifications)) authStore.notifications = parsed.notifications;
  }
} catch (err) {
  console.warn("Using in-memory auth store:", err);
}
function saveAuthStore() {
  try {
    const dataDir = import_path.default.join(process.cwd(), "data");
    if (import_fs.default.existsSync(dataDir)) {
      import_fs.default.writeFileSync(AUTH_STORE_PATH, JSON.stringify(authStore, null, 2), "utf-8");
    }
  } catch (err) {
  }
}
async function sendAdminNotificationEmail(subject, bodyText, metadata) {
  const adminEmail = (process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com").trim();
  const fromEmail = (process.env.SMTP_FROM || "notifications@shipasaan.com").trim();
  const record = {
    id: `mail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: "USER_SIGNUP_ALERT",
    to: adminEmail,
    from: fromEmail,
    subject,
    body: bodyText,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    deliveredVia: "system_mailer",
    read: false,
    metadata
  };
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = import_nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: fromEmail,
        to: adminEmail,
        subject,
        text: bodyText
      });
      record.deliveredVia = "smtp";
      authStore.notifications.unshift(record);
      saveAuthStore();
      console.log(`[MAILER] SMTP Email successfully dispatched to admin: ${adminEmail}`);
      return { sent: true, method: "smtp" };
    } catch (smtpErr) {
      console.warn(`[MAILER] SMTP send failed (${smtpErr.message}), falling back to system mailer log.`);
    }
  }
  authStore.notifications.unshift(record);
  saveAuthStore();
  console.log(`
========================================================`);
  console.log(`[SHIP ASAAN SYSTEM MAILER - ADMIN EMAIL DISPATCHED]`);
  console.log(`To: ${adminEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Time: ${record.timestamp}`);
  console.log(`Body:
${bodyText}`);
  console.log(`========================================================
`);
  return { sent: true, method: "system_mailer" };
}
app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body || {};
    const inputId = (emailOrUsername || "").trim().toLowerCase();
    const inputPass = (password || "").trim();
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Browser";
    if (!inputId || !inputPass) {
      return res.status(400).json({ ok: false, error: "Please provide both username/email and password." });
    }
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com").trim().toLowerCase();
    const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || "Philos@2006").trim();
    const isAdminIdentifier = inputId === ADMIN_EMAIL || inputId === "skyler" || inputId === ADMIN_EMAIL.split("@")[0];
    if (isAdminIdentifier && inputPass === ADMIN_PASSWORD) {
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "SUCCESS_ADMIN",
        details: `Administrator session authenticated via secure environment variables.`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.json({
        ok: true,
        user: {
          id: "usr-admin-root",
          username: "skyler",
          fullName: "Skyler \u2014 Logistics Director",
          email: process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com",
          role: "admin",
          status: "active",
          createdAt: "2026-08-01T09:00:00Z"
        }
      });
    }
    if (isAdminIdentifier && inputPass !== ADMIN_PASSWORD) {
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "FAILED_CREDENTIALS",
        details: `Invalid password supplied for Administrator account (${inputId}).`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.status(401).json({
        ok: false,
        error: "Invalid administrator credentials. Please check your password."
      });
    }
    const user = authStore.users.find(
      (u) => u.email.toLowerCase() === inputId || u.username.toLowerCase() === inputId
    );
    if (!user) {
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "FAILED_CREDENTIALS",
        details: `No account exists with username or email "${inputId}".`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.status(401).json({
        ok: false,
        error: "No account found matching this email or username. Please check or sign up."
      });
    }
    if (user.password !== inputPass) {
      user.lastLoginAttempt = (/* @__PURE__ */ new Date()).toISOString();
      user.lastLoginStatus = "FAILED_CREDENTIALS";
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "FAILED_CREDENTIALS",
        details: `Incorrect password attempt for user ${user.fullName} (${user.email}).`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.status(401).json({
        ok: false,
        error: "Invalid password. Please try again or request a password reset."
      });
    }
    if (user.status === "pending_approval") {
      user.lastLoginAttempt = (/* @__PURE__ */ new Date()).toISOString();
      user.lastLoginStatus = "BLOCKED_PENDING_APPROVAL";
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "BLOCKED_PENDING_APPROVAL",
        details: `Login blocked: User ${user.fullName} (${user.email}) is awaiting Administrator approval.`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.status(403).json({
        ok: false,
        status: "pending_approval",
        error: "Your account is currently pending administrator approval. An email notification has been dispatched to the administrator. You will be granted access once your account is approved."
      });
    }
    if (user.status === "rejected") {
      user.lastLoginAttempt = (/* @__PURE__ */ new Date()).toISOString();
      user.lastLoginStatus = "BLOCKED_REJECTED";
      const attempt2 = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        emailOrUsername: inputId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "BLOCKED_REJECTED",
        details: `Login blocked: User ${user.fullName} (${user.email}) registration was declined.`,
        ip: clientIp,
        userAgent
      };
      authStore.loginAttempts.unshift(attempt2);
      saveAuthStore();
      return res.status(403).json({
        ok: false,
        status: "rejected",
        error: "Your account registration has been declined by the system administrator."
      });
    }
    user.lastLoginAttempt = (/* @__PURE__ */ new Date()).toISOString();
    user.lastLoginStatus = "SUCCESS_USER";
    const attempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emailOrUsername: inputId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "SUCCESS_USER",
      details: `User ${user.fullName} (${user.email}) logged in successfully.`,
      ip: clientIp,
      userAgent
    };
    authStore.loginAttempts.unshift(attempt);
    saveAuthStore();
    const { password: _, ...sanitizedUser } = user;
    return res.json({
      ok: true,
      user: sanitizedUser
    });
  } catch (err) {
    console.error("Login route error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error during authentication." });
  }
});
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { fullName, email, username, password, department, role } = req.body || {};
    const cleanFullName = (fullName || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanUsername = (username || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();
    const cleanDept = (department || "Operations").trim();
    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Browser";
    if (!cleanFullName || !cleanEmail || !cleanUsername || !cleanPassword) {
      return res.status(400).json({
        ok: false,
        error: "All fields (Full Name, Email, Username, and Password) are required."
      });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({
        ok: false,
        error: "Password must be at least 6 characters long."
      });
    }
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com").trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL || cleanUsername === "skyler") {
      return res.status(400).json({
        ok: false,
        error: "This email address and username are reserved for primary system administration."
      });
    }
    const existingEmail = authStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingEmail) {
      return res.status(400).json({
        ok: false,
        error: "An account with this email address already exists. Please sign in instead."
      });
    }
    const existingUsername = authStore.users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existingUsername) {
      return res.status(400).json({
        ok: false,
        error: "This username is already taken. Please choose another username."
      });
    }
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: cleanFullName,
      email: cleanEmail,
      username: cleanUsername,
      password: cleanPassword,
      role: (role === "admin" ? "operator" : role) || "operator",
      department: cleanDept,
      status: "pending_approval",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLoginAttempt: "Signup submitted",
      lastLoginStatus: "PENDING_APPROVAL"
    };
    authStore.users.push(newUser);
    const attempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emailOrUsername: cleanEmail,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "SIGNUP_PENDING_APPROVAL",
      details: `New account signup submitted by ${newUser.fullName} (@${newUser.username}). Status: Pending Approval.`,
      ip: clientIp,
      userAgent
    };
    authStore.loginAttempts.unshift(attempt);
    const mailSubject = `\u{1F514} [Ship Asaan] New User Signup Request: ${newUser.fullName} (${newUser.email})`;
    const mailBody = `Hello Administrator,

A new user has registered for access to the Ship Asaan Tariff Intelligence System and is awaiting your approval.

User Profile Details:
\u2022 Full Name: ${newUser.fullName}
\u2022 Email Address: ${newUser.email}
\u2022 Username: @${newUser.username}
\u2022 Department: ${newUser.department}
\u2022 Assigned Role: ${newUser.role}
\u2022 Registered At: ${newUser.createdAt}
\u2022 Current Status: PENDING APPROVAL

Security Notice:
This account is locked in an unapproved state and CANNOT log in or view tariffs until you approve it.

Action Required:
1. Log in to Ship Asaan as Administrator
2. Open Settings -> Access Control & User Management
3. Locate ${newUser.fullName} in "Pending Account Approvals" and click "Approve Account"

Ship Asaan Automated Security Engine`;
    await sendAdminNotificationEmail(mailSubject, mailBody, {
      userId: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role
    });
    saveAuthStore();
    const { password: _, ...sanitizedUser } = newUser;
    return res.status(201).json({
      ok: true,
      message: "Your account has been created and is currently awaiting administrator approval. A notification email has been dispatched to the administrator.",
      user: sanitizedUser
    });
  } catch (err) {
    console.error("Signup route error:", err);
    return res.status(500).json({ ok: false, error: "Failed to register user account." });
  }
});
app.get("/api/admin/users", (_req, res) => {
  const sanitizedUsers = authStore.users.map(({ password: _, ...u }) => u);
  const pendingCount = sanitizedUsers.filter((u) => u.status === "pending_approval").length;
  const activeCount = sanitizedUsers.filter((u) => u.status === "active").length;
  res.json({
    ok: true,
    adminEmail: process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com",
    users: sanitizedUsers,
    pendingCount,
    activeCount
  });
});
app.post("/api/admin/approve-user", async (req, res) => {
  try {
    const { userId, approved } = req.body || {};
    if (!userId) {
      return res.status(400).json({ ok: false, error: "userId is required." });
    }
    const user = authStore.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found." });
    }
    const adminEmail = (process.env.ADMIN_EMAIL || "skylerisbusy@gmail.com").trim();
    user.status = approved ? "active" : "rejected";
    user.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    user.approvedBy = adminEmail;
    const statusLabel = approved ? "APPROVED" : "DECLINED";
    const mailSubject = `${approved ? "\u2705" : "\u{1F6AB}"} [Ship Asaan] User Account ${statusLabel}: ${user.fullName} (${user.email})`;
    const mailBody = `Hello,

The user account for ${user.fullName} (${user.email}, @${user.username}) has been ${statusLabel} by administrator ${adminEmail} on ${user.approvedAt}.

Access Status: ${user.status.toUpperCase()}

Ship Asaan Access Control Engine`;
    await sendAdminNotificationEmail(mailSubject, mailBody, {
      userId: user.id,
      action: statusLabel
    });
    saveAuthStore();
    const { password: _, ...sanitizedUser } = user;
    return res.json({
      ok: true,
      message: `User ${user.fullName} has been ${approved ? "approved and activated" : "declined"}.`,
      user: sanitizedUser
    });
  } catch (err) {
    console.error("Approve user error:", err);
    return res.status(500).json({ ok: false, error: "Failed to update user approval status." });
  }
});
app.post("/api/admin/delete-user", (req, res) => {
  const { userId } = req.body || {};
  if (!userId) {
    return res.status(400).json({ ok: false, error: "userId is required." });
  }
  authStore.users = authStore.users.filter((u) => u.id !== userId);
  saveAuthStore();
  return res.json({ ok: true, message: "User deleted successfully." });
});
app.get("/api/admin/login-attempts", (_req, res) => {
  res.json({
    ok: true,
    attempts: authStore.loginAttempts.slice(0, 100)
  });
});
app.get("/api/admin/notifications", (_req, res) => {
  res.json({
    ok: true,
    notifications: authStore.notifications.slice(0, 50),
    unreadCount: authStore.notifications.filter((n) => !n.read).length
  });
});
app.post("/api/admin/notifications/mark-read", (req, res) => {
  const { id } = req.body || {};
  if (id) {
    const notif = authStore.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  } else {
    authStore.notifications.forEach((n) => n.read = true);
  }
  saveAuthStore();
  res.json({ ok: true });
});
app.post("/api/admin/clear-logs", (_req, res) => {
  authStore.loginAttempts = [];
  saveAuthStore();
  res.json({ ok: true, message: "Login attempts audit cleared." });
});
function getGeminiClient(customApiKey) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server or provided by client.");
  }
  return new import_genai.GoogleGenAI({ apiKey });
}
function normalizeAIModel(provider, rawModel) {
  let m = (rawModel || "").trim();
  if (provider === "gemini") {
    if (!m) return "gemini-3.8-flash";
    if (m.startsWith("models/")) m = m.replace("models/", "");
    const lower = m.toLowerCase();
    if (lower === "3.7" || lower === "3.7-flash" || lower === "3.7 flash" || lower === "gemini-3.7" || lower === "gemini 3.7" || lower === "gemini 3.7 flash" || lower === "gemini-3.7-flash") {
      return "gemini-3.7-flash";
    }
    if (lower === "3.6" || lower === "3.6-flash" || lower === "3.6 flash" || lower === "gemini-3.6" || lower === "gemini 3.6" || lower === "gemini 3.6 flash" || lower === "gemini-3.6-flash") {
      return "gemini-3.6-flash";
    }
    if (lower === "3.5" || lower === "3.5-flash" || lower === "3.5 flash" || lower === "gemini-3.5" || lower === "gemini 3.5" || lower === "gemini 3.5 flash" || lower === "gemini-3.5-flash") {
      return "gemini-3.5-flash";
    }
    if (lower === "3.5-lite" || lower === "3.5 lite" || lower === "3.5-flash-lite" || lower === "3.5 flash lite" || lower === "gemini-3.5-flash-lite" || lower === "gemini 3.5 flash lite") {
      return "gemini-3.5-flash-lite";
    }
    if (lower === "3.8" || lower === "3.8-flash" || lower === "3.8 flash" || lower === "gemini-3.8" || lower === "gemini 3.8" || lower === "gemini 3.8 flash" || lower === "gemini-3.8-flash") {
      return "gemini-3.8-flash";
    }
    if (lower === "3.1" || lower === "3.1 pro" || lower === "gemini 3.1" || lower === "gemini 3.1 pro" || lower === "gemini-3.1" || lower === "gemini-3.1-pro" || lower === "gemini-3.1-pro-preview") {
      return "gemini-3.1-pro-preview";
    }
    if (lower === "3.1 lite" || lower === "3.1 flash lite" || lower === "gemini 3.1 lite" || lower === "gemini 3.1 flash lite" || lower === "gemini-3.1-flash-lite" || lower === "gemini-3.1-flash-lite-preview") {
      return "gemini-3.1-flash-lite";
    }
    if (lower === "2.5" || lower === "2.5 flash" || lower === "gemini 2.5" || lower === "gemini 2.5 flash" || lower === "gemini-2.5" || lower === "gemini-2.5-flash") {
      return "gemini-2.5-flash";
    }
    if (lower === "2.5 pro" || lower === "gemini 2.5 pro" || lower === "gemini-2.5-pro") {
      return "gemini-2.5-pro";
    }
    if (lower === "flash" || lower === "gemini flash" || lower === "gemini-flash") {
      return "gemini-3.8-flash";
    }
    if (lower === "pro" || lower === "gemini pro" || lower === "gemini-pro") {
      return "gemini-3.1-pro-preview";
    }
    if (m.includes(" ")) {
      m = m.toLowerCase().replace(/\s+/g, "-");
    }
    if (/^\d/.test(m)) {
      m = `gemini-${m}`;
      if (!m.includes("flash") && !m.includes("pro")) {
        m = `${m}-flash`;
      }
    }
    return m;
  }
  if (provider === "anthropic") {
    const lower = m.toLowerCase();
    if (lower === "3.7" || lower === "claude 3.7" || lower === "claude 3.7 sonnet" || lower === "3.7 sonnet" || lower === "claude-3.7-sonnet" || lower === "claude-3-7-sonnet") {
      return "claude-3-7-sonnet-20250219";
    }
    if (lower === "3.5" || lower === "claude 3.5" || lower === "claude 3.5 sonnet" || lower === "3.5 sonnet" || lower === "claude-3.5-sonnet") {
      return "claude-3-5-sonnet-20241022";
    }
    if (lower === "haiku" || lower === "claude haiku" || lower === "claude 3.5 haiku" || lower === "claude-3-5-haiku") {
      return "claude-3-5-haiku-20241022";
    }
    return m.replace(/\s+/g, "-");
  }
  if (provider === "openai") {
    const lower = m.toLowerCase();
    if (lower === "4o" || lower === "gpt 4o" || lower === "gpt-4") return "gpt-4o";
    if (lower === "4o mini" || lower === "gpt 4o mini") return "gpt-4o-mini";
    if (lower === "o3" || lower === "o3 mini") return "o3-mini";
    if (lower === "o4" || lower === "o4 mini") return "o4-mini";
    if (lower === "5.4" || lower === "gpt 5.4") return "gpt-5.4";
    if (lower === "5.5" || lower === "gpt 5.5") return "gpt-5.5";
    return m.replace(/\s+/g, "-");
  }
  if (provider === "deepseek") {
    const lower = m.toLowerCase();
    if (lower === "chat" || lower === "v3" || lower === "deepseek") return "deepseek-chat";
    if (lower === "reasoner" || lower === "r1") return "deepseek-reasoner";
    return m.replace(/\s+/g, "-");
  }
  if (provider === "groq") {
    const lower = m.toLowerCase();
    if (lower === "llama" || lower === "llama 3.3" || lower === "llama 70b") return "llama-3.3-70b-versatile";
    if (lower === "deepseek r1" || lower === "r1") return "deepseek-r1-distill-llama-70b";
    return m.replace(/\s+/g, "-");
  }
  return m;
}
app.post("/api/ai/test-connection", async (req, res) => {
  try {
    const body = req.body?.providerConfig || req.body || {};
    const provider = body.provider || "gemini";
    const rawApiKey = body.apiKey;
    const model = body.model;
    const customBaseUrl = body.customBaseUrl || body.customEndpoint;
    const customModel = body.customModel;
    const customAuthHeader = body.customAuthHeader;
    let targetModel = normalizeAIModel(provider, model === "custom" ? customModel : model);
    const startTime = Date.now();
    if (provider === "gemini") {
      const activeKey = rawApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          ok: false,
          error: "No Gemini API key provided. Please enter your API key or configure GEMINI_API_KEY in environment."
        });
      }
      const ai = getGeminiClient(activeKey);
      const chosenModel = targetModel || "gemini-3.8-flash";
      let response = null;
      let finalUsedModel = chosenModel;
      try {
        response = await ai.models.generateContent({
          model: chosenModel,
          contents: "Respond with the single word 'OK' if you can read this."
        });
      } catch (err) {
        const is503 = err.status === 503 || err.code === 503 || String(err.message || "").includes("503") || String(err.message || "").includes("high demand") || String(err.message || "").includes("UNAVAILABLE");
        if (is503) {
          await new Promise((r) => setTimeout(r, 1e3));
          try {
            response = await ai.models.generateContent({
              model: chosenModel,
              contents: "Respond with the single word 'OK' if you can read this."
            });
          } catch (retryErr) {
            const fallbackModel = "gemini-3.1-flash-lite";
            response = await ai.models.generateContent({
              model: fallbackModel,
              contents: "Respond with the single word 'OK' if you can read this."
            });
            finalUsedModel = fallbackModel;
          }
        } else {
          throw err;
        }
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "Google Gemini",
        model: chosenModel,
        effectiveModel: finalUsedModel,
        latencyMs,
        message: finalUsedModel !== chosenModel ? `Connected successfully! (${chosenModel} experienced a temporary Google 503 spike; verified via ${finalUsedModel} in ${latencyMs}ms).` : `Successfully connected to ${chosenModel} (${latencyMs}ms response). Connection verified.`,
        sampleResponse: response.text?.trim()
      });
    }
    if (provider === "openai") {
      if (!rawApiKey) {
        return res.status(400).json({ ok: false, error: "OpenAI API key is required." });
      }
      const chosenModel = targetModel || "gpt-4o-mini";
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${rawApiKey}`
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `OpenAI API error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "OpenAI",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to OpenAI ${chosenModel} (${latencyMs}ms).`
      });
    }
    if (provider === "deepseek") {
      if (!rawApiKey) {
        return res.status(400).json({ ok: false, error: "DeepSeek API key is required." });
      }
      const chosenModel = targetModel || "deepseek-chat";
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${rawApiKey}`
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `DeepSeek API error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "DeepSeek",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to DeepSeek ${chosenModel} (${latencyMs}ms).`
      });
    }
    if (provider === "anthropic") {
      if (!rawApiKey) {
        return res.status(400).json({ ok: false, error: "Anthropic API key is required." });
      }
      const chosenModel = targetModel || "claude-3-5-haiku-20241022";
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": rawApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 10,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }]
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `Anthropic API error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "Anthropic",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to Anthropic API (${latencyMs}ms).`
      });
    }
    if (provider === "openrouter") {
      if (!rawApiKey) {
        return res.status(400).json({ ok: false, error: "OpenRouter API key is required." });
      }
      const chosenModel = targetModel || "meta-llama/llama-3.3-70b-instruct";
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${rawApiKey}`
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `OpenRouter API error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "OpenRouter",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to OpenRouter (${latencyMs}ms).`
      });
    }
    if (provider === "groq") {
      if (!rawApiKey) {
        return res.status(400).json({ ok: false, error: "Groq API key is required." });
      }
      const chosenModel = targetModel || "llama-3.3-70b-versatile";
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${rawApiKey}`
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `Groq API error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "Groq",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to Groq API (${latencyMs}ms).`
      });
    }
    if (provider === "custom") {
      if (!customBaseUrl) {
        return res.status(400).json({ ok: false, error: "Custom Base URL is required." });
      }
      const url = customBaseUrl.endsWith("/") ? `${customBaseUrl}chat/completions` : `${customBaseUrl}/chat/completions`;
      const authHeader = customAuthHeader || (rawApiKey ? `Bearer ${rawApiKey}` : "");
      const headers = { "Content-Type": "application/json" };
      if (authHeader) headers["Authorization"] = authHeader;
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: customModel || "default",
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `Custom Provider error (${resp.status}): ${errText}`
        });
      }
      const latencyMs = Date.now() - startTime;
      return res.json({
        ok: true,
        provider: "Custom Provider",
        model: customModel || "default",
        latencyMs,
        message: `Successfully connected to Custom Provider (${latencyMs}ms).`
      });
    }
    return res.status(400).json({ ok: false, error: `Unknown provider: ${provider}` });
  } catch (err) {
    console.error("Test connection error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to connect to AI provider"
    });
  }
});
app.post("/api/ai/extract-tariff", async (req, res) => {
  try {
    const {
      workspace,
      // 'domestic' | 'international'
      filename,
      fileContent,
      // text content or base64
      fileType,
      // 'text' | 'csv' | 'json' | 'pdf' | 'excel' | 'image'
      partnerHint,
      providerConfig
    } = req.body;
    const provider = providerConfig?.provider || "gemini";
    const userApiKey = providerConfig?.apiKey;
    const defaultModelForProvider = {
      gemini: "gemini-3.8-flash",
      openai: "gpt-4o-mini",
      anthropic: "claude-3-5-haiku-20241022",
      deepseek: "deepseek-chat",
      groq: "llama-3.3-70b-versatile",
      openrouter: "google/gemini-2.5-flash",
      custom: "custom-model"
    };
    let rawModelInput = (providerConfig?.model === "custom" ? providerConfig?.customModel : providerConfig?.model)?.trim() || defaultModelForProvider[provider] || "gemini-3.8-flash";
    let targetModel = normalizeAIModel(provider, rawModelInput);
    let isDataUrl = false;
    let mimeType = "";
    let base64Data = "";
    if (typeof fileContent === "string" && fileContent.startsWith("data:")) {
      const match = fileContent.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        isDataUrl = true;
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    const isSpreadsheet = Boolean(filename?.match(/\.(xlsx|xls|csv|tsv)$/i)) || mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv") || fileType === "excel" || fileType === "csv";
    let spreadsheetTextRepresentation = "";
    let serverDeterministicMatrix = null;
    if (isSpreadsheet && (base64Data || typeof fileContent === "string" && !isDataUrl)) {
      try {
        let workbook;
        if (base64Data) {
          const buffer = Buffer.from(base64Data, "base64");
          workbook = XLSX2.read(buffer, { type: "buffer" });
        } else {
          workbook = XLSX2.read(fileContent, { type: "string" });
        }
        const sheetsSummary = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const rawRows = XLSX2.utils.sheet_to_json(sheet, { header: 1, defval: "" });
          if (rawRows.length > 0) {
            if (!serverDeterministicMatrix) {
              const matrixAttempt = parseInternationalMatrix(rawRows);
              if (matrixAttempt.success) {
                serverDeterministicMatrix = matrixAttempt;
                console.log(`[server.ts] Successfully pre-parsed complete matrix from sheet "${sheetName}": ${matrixAttempt.columnsCount} cols, ${matrixAttempt.rowsCount} rows (${matrixAttempt.totalCellsParsed} cells)`);
              }
            }
            sheetsSummary.push(`
=== SHEET: "${sheetName}" (${rawRows.length} rows, ${(rawRows[0] || []).length} columns) ===`);
            rawRows.slice(0, 150).forEach((row, rIdx) => {
              const rowStr = row.map((c) => String(c ?? "").trim()).join(" 	| ");
              if (rowStr.replace(/[|\t\s]/g, "").length > 0) {
                sheetsSummary.push(`[Row ${rIdx + 1}] ${rowStr}`);
              }
            });
          }
        }
        spreadsheetTextRepresentation = sheetsSummary.join("\n");
        isDataUrl = false;
      } catch (xlsxErr) {
        console.warn("Spreadsheet buffer parse in server.ts warning:", xlsxErr);
      }
    }
    const systemPrompt = `You are the Tariff Intelligence & Rate Normalization Engine for Ship Asaan Logistics.

CRITICAL ARCHITECTURAL DIRECTIVES:
1. NON-DESTRUCTIVE FLEXIBILITY:
   - Never eradicate, omit, or discard clauses, pricing rules, or fields merely because they do not fit traditional tabular molds.
   - If a courier rate card introduces custom rules (e.g. Return to Origin / RTO penalties, fragile packaging fees, holiday delivery surcharges, remote pin-code levies, dimensional restrictions, provincial GST variations), you MUST create a dynamic rule in "dynamicRules" and capture details in "additionalData".
   
2. ARITHMETIC NORMALIZATION:
   - When tariffs provide rates in non-standard weight increments (such as 2 KG increments, 500g / 0.5 KG increments, 5 KG tiers, or piece rates), convert them to standardized 1 KG equivalents so standard calculation engines can operate seamlessly.
   - Example 1: If a tariff lists "Additional 2 KG = Rs. 300", normalize to "additionalKgRate": 150 (since 300 / 2 = 150).
   - Example 2: If a tariff lists "Additional 0.5 KG = Rs. 80", normalize to "additionalKgRate": 160 (since 80 * 2 = 160), and set "additionalHalfKgRate": 80.
   - Always record every arithmetic transformation and normalization rationale in "transformationsApplied".

3. MATRIX RATE CARDS (INTERNATIONAL & MULTI-ZONE TARIFFS - E.G. JUMP N JUMP, DHL, FEDEX, SKYNET):
   - Many rate sheets display a 2D matrix where:
     * Vertical rows are Weights (e.g. 0.5kg, 1.0kg, 1.5kg, 2.0kg ... up to 10kg, 20kg, 30kg, 50kg, 70kg).
     * Horizontal column headers are Destination Zones or Country Codes (e.g. "CA", "AU", "NL", "DE", "Zone 1", "Zone 2", etc.).
     * Arrows (such as "-->" or "==>") point from Weight/Zones across columns to indicate the zone columns.
   - CRITICAL REQUIREMENT FOR COMPLETENESS:
     * YOU MUST EXTRACT EVERY SINGLE ROW IN THE TABLE. NEVER TRUNCATE, NEVER STOP EARLY AFTER 2-3 WEIGHTS, AND DO NOT OMIT ROWS!
     * If the table lists weights up to 10kg, 20kg, 30kg, or 70kg, extract all of them!
     * Use the compact "rateMatrix" structure below so all rows fit comfortably within output tokens without truncation.
     * In addition to "rateMatrix", unpivot the cells into "normalizedData.rates".

4. ACCURACY & TRUTHFULNESS:
   - Do not manufacture random numbers. If something is truly absent or unclear, record it in "ambiguities".
   - Always preserve original labels and raw clauses in "rawExtraction".

WORKSPACE CONTEXT: ${workspace === "domestic" ? "DOMESTIC / COD Logistics (Pakistan - e.g. TCS, Leopards, Trax, PostEx, M&P)" : "INTERNATIONAL Express & Freight (Global - e.g. Jump N Jump, DHL, FedEx, UPS, Aramex, Skynet)"}

You must extract and normalize the courier tariff into a structured JSON response matching this schema:
{
  "tariffName": string,
  "partnerName": string,
  "serviceType": string, // e.g. "Overnight Express", "Second Day", "Express Worldwide", "Economy"
  "currency": string, // e.g. "PKR", "USD", "EUR"
  "effectiveFrom": string (YYYY-MM-DD or empty),
  "effectiveUntil": string (YYYY-MM-DD or empty),
  "confidence": number (0 to 100),
  "ambiguities": string[], // Any conflicting notes, conditions requiring human review
  "transformationsApplied": Array<{
    "id": string,
    "originalFormat": string, // e.g. "Shared in 2kg increments (PKR 300 / 2kg)"
    "normalizedFormat": string, // e.g. "Normalized to 1kg increment (PKR 150 / 1kg)"
    "reasoning": string // e.g. "Divided 2kg rate by 2 to standardize rate calculation"
  }>,
  "dynamicRules": Array<{
    "id": string,
    "ruleKey": string, // e.g. "rto_penalty_50pct", "fragile_crate_pkr_500", "remote_area_pin_code_levy"
    "title": string,
    "category": "weight_increment" | "surcharge" | "tax" | "zone_group" | "restriction" | "custom_fee" | "operational_clause",
    "condition": string, // e.g. "shipment_status == 'return_to_origin'", "item_category == 'fragile'"
    "formulaOrValue": string, // e.g. "50% of outbound freight", "+PKR 500", "Rate / 2"
    "description": string,
    "sourceText": string, // quote from document
    "enabled": boolean
  }>,
  "rateMatrix": {
    "columns": Array<{ "key": string, "label": string, "countries"?: string[] }>, // e.g. [{"key": "CA", "label": "Canada", "countries": ["Canada"]}, {"key": "AU", "label": "Australia"}, {"key": "Zone 1", "label": "GCC Countries"}]
    "rows": Array<{
      "weightFrom": number,
      "weightTo": number,
      "weightLabel"?: string,
      "pricingType": "flat" | "per_kg", // CRITICAL: "flat" for all 0.5kg & 1kg package slabs up to 70kg; "per_kg" ONLY for wide cargo excess tiers (e.g. 70.01-99kg, 71-500kg, 99.01-1000kg)
      "rates": Record<string, number> // key (e.g. "CA", "AU") -> rate number
    }>,
    "additionalKgRates"?: Record<string, number>, // per additional kg rate for each column key
    "unit": "kg"
  },
  "rawExtraction": {
    "extractedTextSnippet": string,
    "detectedHeaders": string[],
    "originalClauses": string[],
    "rawTables": Array<{ title: string, columns: string[], rows: any[][] }>
  },
  "normalizedData": {
    "pricingStructure": "first_additional_kg" | "weight_slabs" | "matrix_zone_weight" | "destination_group" | "flat_tier",
    "rates": Array<{
      "origin": string,
      "destination": string, // Zone key (e.g. "CA", "AU", "Zone 1") or destination city
      "countryGroup"?: string, // e.g. "Canada", "Australia", "Middle East"
      "firstKgRate"?: number,
      "additionalKgRate"?: number,
      "additionalHalfKgRate"?: number,
      "weightFrom"?: number,
      "weightTo"?: number,
      "pricingType"?: "flat" | "per_kg", // CRITICAL: "flat" for package slabs up to 70kg; "per_kg" for broad excess cargo tiers
      "flatRate"?: number,
      "ratePerKg"?: number
    }>,
    "surcharges": Array<{
      "name": string, // e.g. "Fuel Surcharge", "COD Fee", "GST", "Remote Area Fee"
      "originalName": string, // e.g. "FAC", "COD Commission", "PRA Tax"
      "type": "percentage" | "fixed",
      "value": number, // e.g. 18.5 for 18.5%, or 50 for 50 PKR
      "applicability": string // "base_rate" | "total_rate" | "invoice_value" | "flat"
    }>,
    "volumetricDivisor"?: number, // e.g. 5000 or 6000
    "codTerms"?: {
      "percentage"?: number,
      "fixedMinimum"?: number,
      "paymentCycleDays"?: string
    },
    "taxRate"?: number // e.g. 16 for 16% GST
  },
  "additionalData": Array<{
    "category": string,
    "name": string,
    "value": string,
    "ruleNotes": string
  }>,
  "extractionNotes": string
}`;
    const userTextPrompt = `Document Filename: ${filename || "Uploaded Tariff Document"}
File Type: ${fileType || (isDataUrl ? mimeType : "text/spreadsheet")}
Partner Hint: ${partnerHint || "Unspecified"}
${spreadsheetTextRepresentation ? `
PRE-PARSED SPREADSHEET CONTENT:
"""
${spreadsheetTextRepresentation.slice(0, 15e4)}
"""
` : !isDataUrl ? `
Document Text Content:
"""
${(fileContent || "").slice(0, 1e5)}
"""
` : "Please inspect the attached tariff image / document visually."}

Carefully extract, normalize (e.g. convert 2kg or 0.5kg increments to 1kg equivalents and record in transformationsApplied), and provision any dynamicRules for custom conditions.
FOR RATE MATRICES: Make sure to extract ALL weight tiers (do NOT cut off after 2 or 3 weights) and ALL zone/country columns into "rateMatrix" and "normalizedData.rates".
PRICING CLASSIFICATION (FLAT vs PER-KG):
- Every standard package weight slab (e.g. 0.01-0.5, 0.5-1.0... up to 10kg, and 1kg increments like 10-11, 11-12... up to 69-70kg) has pricingType: "flat". Single-kg ranges like 69-70kg are ALWAYS FLAT parcel prices.
- Only broad excess cargo brackets (e.g. 70.01-99kg, 71-500kg, 99.01-1000kg) have pricingType: "per_kg" (unit price per kilogram).
Return ONLY valid, parseable JSON. Do NOT include markdown code blocks or backticks.`;
    let rawOutput = "";
    if (provider === "gemini") {
      const activeKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          ok: false,
          error: "No Gemini API key available. Please configure an API key in Settings -> AI Configuration."
        });
      }
      const ai = getGeminiClient(activeKey);
      const parts = [];
      if (isDataUrl) {
        parts.push({
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data
          }
        });
      }
      parts.push({ text: `${systemPrompt}

${userTextPrompt}` });
      let response = null;
      let effectiveModel = targetModel;
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: [
            { role: "user", parts }
          ],
          config: {
            responseMimeType: "application/json",
            maxOutputTokens: 16384
          }
        });
      } catch (primaryErr) {
        const is503 = primaryErr.status === 503 || primaryErr.code === 503 || String(primaryErr.message || "").includes("503") || String(primaryErr.message || "").includes("high demand") || String(primaryErr.message || "").includes("UNAVAILABLE");
        if (is503) {
          console.warn(`[server.ts] Model ${targetModel} encountered temporary 503 high demand spike. Retrying...`);
          await new Promise((r) => setTimeout(r, 1200));
          try {
            response = await ai.models.generateContent({
              model: targetModel,
              contents: [{ role: "user", parts }],
              config: {
                responseMimeType: "application/json",
                maxOutputTokens: 16384
              }
            });
          } catch (retryErr) {
            const fallbackCandidates = [
              "gemini-3.1-flash-lite",
              "gemini-3.5-flash",
              "gemini-3.8-flash",
              "gemini-3.7-flash",
              "gemini-3.6-flash"
            ].filter((m) => m !== targetModel);
            let fallbackSuccess = false;
            for (const fbModel of fallbackCandidates) {
              try {
                console.warn(`[server.ts] Attempting fallback extraction with ${fbModel}...`);
                response = await ai.models.generateContent({
                  model: fbModel,
                  contents: [{ role: "user", parts }],
                  config: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 16384
                  }
                });
                effectiveModel = fbModel;
                fallbackSuccess = true;
                break;
              } catch (fbErr) {
                console.warn(`[server.ts] Fallback model ${fbModel} also unavailable, trying next...`);
              }
            }
            if (!fallbackSuccess) {
              throw primaryErr;
            }
          }
        } else {
          throw primaryErr;
        }
      }
      rawOutput = response?.text || "";
      targetModel = effectiveModel;
    } else if (provider === "openai" || provider === "deepseek" || provider === "groq" || provider === "openrouter" || provider === "custom") {
      let endpoint = "https://api.openai.com/v1/chat/completions";
      let authHeader = `Bearer ${userApiKey}`;
      if (provider === "deepseek") endpoint = "https://api.deepseek.com/chat/completions";
      if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
      if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
      if (provider === "custom") {
        endpoint = providerConfig?.customBaseUrl?.endsWith("/") ? `${providerConfig.customBaseUrl}chat/completions` : `${providerConfig.customBaseUrl}/chat/completions`;
        authHeader = providerConfig?.customAuthHeader || `Bearer ${userApiKey}`;
      }
      const headers = {
        "Content-Type": "application/json"
      };
      if (authHeader) headers["Authorization"] = authHeader;
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = "https://aistudio.google.com";
        headers["X-Title"] = "Courier Tariff OS";
      }
      let userContentPayload = userTextPrompt;
      if (isDataUrl) {
        userContentPayload = [
          {
            type: "image_url",
            image_url: { url: fileContent }
          },
          {
            type: "text",
            text: userTextPrompt
          }
        ];
      }
      const isReasoner = targetModel.toLowerCase().includes("reasoner") || targetModel.toLowerCase().includes("r1");
      const requestPayload = {
        model: targetModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContentPayload }
        ]
      };
      if (!isReasoner) {
        requestPayload.response_format = { type: "json_object" };
      }
      let resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestPayload)
      });
      if (!resp.ok && requestPayload.response_format) {
        const errorPeek = await resp.clone().text();
        if (resp.status === 400 && (errorPeek.includes("response_format") || errorPeek.includes("schema") || errorPeek.includes("unsupported"))) {
          delete requestPayload.response_format;
          resp = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(requestPayload)
          });
        }
      }
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `AI Provider (${provider}) returned error ${resp.status}: ${errText}`
        });
      }
      const data = await resp.json();
      rawOutput = data.choices?.[0]?.message?.content || "";
    } else if (provider === "anthropic") {
      let userContentPayload = userTextPrompt;
      if (isDataUrl) {
        userContentPayload = [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType || "image/jpeg",
              data: base64Data
            }
          },
          {
            type: "text",
            text: userTextPrompt
          }
        ];
      }
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": userApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userContentPayload }]
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({
          ok: false,
          error: `Anthropic API returned error ${resp.status}: ${errText}`
        });
      }
      const data = await resp.json();
      rawOutput = data.content?.[0]?.text || "";
    }
    let cleanJson = rawOutput.trim();
    cleanJson = cleanJson.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const markdownMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch) {
      cleanJson = markdownMatch[1].trim();
    } else {
      const firstBrace = cleanJson.indexOf("{");
      const lastBrace = cleanJson.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1).trim();
      }
    }
    try {
      const parsedData = JSON.parse(cleanJson);
      if (serverDeterministicMatrix?.success && serverDeterministicMatrix.rateMatrix) {
        const aiMatrixRowCount = parsedData.rateMatrix?.rows?.length || 0;
        const detMatrixRowCount = serverDeterministicMatrix.rateMatrix.rows?.length || 0;
        if (!parsedData.rateMatrix || aiMatrixRowCount < detMatrixRowCount) {
          parsedData.rateMatrix = serverDeterministicMatrix.rateMatrix;
          if (!parsedData.transformationsApplied) parsedData.transformationsApplied = [];
          parsedData.transformationsApplied.push({
            id: `trans-det-matrix-${Date.now()}`,
            originalFormat: `2D Spreadsheet Matrix (${serverDeterministicMatrix.columnsCount} columns \xD7 ${serverDeterministicMatrix.rowsCount} weights)`,
            normalizedFormat: `Complete Rate Matrix with ${serverDeterministicMatrix.totalCellsParsed} rate cells preserved`,
            reasoning: `Bypassed LLM token cutoff: deterministic binary parser preserved 100% of matrix cells (${serverDeterministicMatrix.totalCellsParsed} rates) without omissions.`
          });
        }
        if (serverDeterministicMatrix.internationalRates && (!parsedData.normalizedData?.rates || parsedData.normalizedData.rates.length < serverDeterministicMatrix.internationalRates.length)) {
          if (!parsedData.normalizedData) parsedData.normalizedData = {};
          parsedData.normalizedData.rates = serverDeterministicMatrix.internationalRates;
        }
      }
      if (parsedData.rateMatrix && Array.isArray(parsedData.rateMatrix.rows) && parsedData.rateMatrix.rows.length > 0) {
        parsedData.rateMatrix.rows.forEach((r) => {
          const wTo = Number(r.weightTo) || 0;
          const wFrom = Number(r.weightFrom) || 0;
          const span = wTo - wFrom;
          if (span <= 2) {
            r.pricingType = "flat";
          } else if (r.pricingType !== "flat" && r.pricingType !== "per_kg") {
            r.pricingType = span >= 5 && wFrom >= 70 ? "per_kg" : "flat";
          }
        });
      }
      if ((!parsedData.rateMatrix || !Array.isArray(parsedData.rateMatrix.rows) || parsedData.rateMatrix.rows.length === 0) && parsedData.normalizedData?.rates && Array.isArray(parsedData.normalizedData.rates) && parsedData.normalizedData.rates.length > 0) {
        const ratesArr = parsedData.normalizedData.rates;
        const destMap = /* @__PURE__ */ new Map();
        ratesArr.forEach((r) => {
          const dest = r.destination || r.zone;
          if (dest && !destMap.has(dest)) {
            destMap.set(dest, r.countryGroup || dest);
          }
        });
        const matrixCols = Array.from(destMap.entries()).map(([key, label]) => ({
          key,
          label,
          countries: [key]
        }));
        const rowKeyMap = /* @__PURE__ */ new Map();
        ratesArr.forEach((r) => {
          const wFrom = Number(r.weightFrom) || 0;
          const wTo = Number(r.weightTo) || 0;
          const span = wTo - wFrom;
          const pType = span <= 2 ? "flat" : r.pricingType || (r.ratePerKg && !r.flatRate ? "per_kg" : "flat");
          const rowKey = `${wFrom.toFixed(2)}_${wTo.toFixed(2)}`;
          if (!rowKeyMap.has(rowKey)) {
            rowKeyMap.set(rowKey, {
              weightFrom: wFrom,
              weightTo: wTo,
              pricingType: pType,
              rates: {}
            });
          }
          const targetRow = rowKeyMap.get(rowKey);
          const dest = r.destination || r.zone;
          const rateVal = r.flatRate !== void 0 ? r.flatRate : r.ratePerKg;
          if (dest && rateVal !== void 0 && !isNaN(Number(rateVal))) {
            targetRow.rates[dest] = Number(rateVal);
          }
        });
        const matrixRows = Array.from(rowKeyMap.values()).sort((a, b) => a.weightTo - b.weightTo);
        if (matrixRows.length > 0 && matrixCols.length > 0) {
          parsedData.rateMatrix = {
            columns: matrixCols,
            rows: matrixRows,
            unit: "kg"
          };
        }
      }
      if (parsedData.rateMatrix && Array.isArray(parsedData.rateMatrix.rows) && parsedData.rateMatrix.rows.length > 0) {
        const matrixCols = parsedData.rateMatrix.columns || [];
        const matrixRows = parsedData.rateMatrix.rows || [];
        if (!parsedData.normalizedData) parsedData.normalizedData = {};
        if (!Array.isArray(parsedData.normalizedData.rates)) parsedData.normalizedData.rates = [];
        const totalExpectedRates = matrixRows.length * (matrixCols.length || 1);
        if (parsedData.normalizedData.rates.length < totalExpectedRates * 0.7) {
          const unpivotedRates = [];
          for (const mRow of matrixRows) {
            const wTo = Number(mRow.weightTo) || 0;
            const wFrom = mRow.weightFrom !== void 0 ? Number(mRow.weightFrom) : Math.max(0.01, Number((wTo - 0.5).toFixed(2)));
            const rowRates = mRow.rates || {};
            const span = wTo - wFrom;
            const isPerKg = mRow.pricingType ? mRow.pricingType === "per_kg" : span >= 5 && wFrom >= 70;
            const rowPricingType = isPerKg ? "per_kg" : "flat";
            for (const col of matrixCols) {
              const colKey = typeof col === "string" ? col : col.key || col.label || "Zone";
              const colLabel = typeof col === "object" ? col.label || colKey : colKey;
              const rateVal = rowRates[colKey];
              if (rateVal !== void 0 && rateVal !== null && !isNaN(Number(rateVal))) {
                const numericRate = Number(rateVal);
                unpivotedRates.push({
                  origin: "Pakistan",
                  destination: colKey,
                  countryGroup: colLabel,
                  weightFrom: wFrom,
                  weightTo: wTo,
                  pricingType: rowPricingType,
                  flatRate: rowPricingType === "flat" ? numericRate : void 0,
                  ratePerKg: rowPricingType === "per_kg" ? numericRate : void 0
                });
              }
            }
          }
          if (unpivotedRates.length > 0) {
            parsedData.normalizedData.rates = unpivotedRates;
          }
        }
      }
      return res.json({
        ok: true,
        providerUsed: provider,
        modelUsed: targetModel,
        data: parsedData,
        rawResponse: rawOutput
      });
    } catch (parseErr) {
      console.error("JSON parse error from AI response:", cleanJson);
      return res.status(422).json({
        ok: false,
        error: "AI produced non-JSON or malformed output. Triggering offline fallback option.",
        rawOutput
      });
    }
  } catch (err) {
    console.error("Extract tariff API error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "AI extraction encountered a server-side error"
    });
  }
});
app.post("/api/ai/copilot", async (req, res) => {
  try {
    const { query, workspace, contextData, providerConfig, history } = req.body;
    const provider = providerConfig?.provider || "gemini";
    const userApiKey = providerConfig?.apiKey;
    const rawModel = (providerConfig?.model === "custom" ? providerConfig?.customModel : providerConfig?.model) || "gemini-3.8-flash";
    let targetModel = normalizeAIModel(provider, rawModel);
    const systemInstruction = `You are Ship Asaan's Tariff Intelligence & Logistics AI Copilot.
You have access to the user's active local tariff database, carrier partners, document library, and recent rate calculations for the ${workspace === "domestic" ? "DOMESTIC (Pakistan COD)" : "INTERNATIONAL"} logistics workspace.

CAPABILITIES:
1. Answer specific rate questions (e.g. "Which courier is cheapest for 3kg Karachi to Lahore?", "What is TCS fuel surcharge?", "Compare DHL vs FedEx to USA 5kg").
2. Reference saved tariffs, rules, COD terms, volumetric formulas, and GST rates provided in the Context below.
3. If asked general logistics questions or normal conversation (e.g. "How does COD work?", "What is volumetric weight?", "Hello!"), respond naturally, helpfully, and conversationally like Gemini in the browser.
4. If a calculation is requested, show the transparent step-by-step arithmetic (Base Rate + Fuel Surcharge + COD Fee + GST = Total).
5. If specific local data is requested and not found in context, clarify that no active rate card is stored for that specific route, but offer guidance or advice.

ACTIVE WORKSPACE CONTEXT:
${JSON.stringify(contextData || {}, null, 2)}
`;
    if (provider === "gemini") {
      const activeKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          ok: false,
          error: "No Gemini API key available. Please configure an API key in Settings -> AI Configuration."
        });
      }
      const ai = getGeminiClient(activeKey);
      const conversationContents = [];
      if (Array.isArray(history) && history.length > 0) {
        for (const msg of history.slice(-8)) {
          conversationContents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
          });
        }
      }
      conversationContents.push({
        role: "user",
        parts: [{ text: query }]
      });
      let response = null;
      let effectiveModel = targetModel;
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: conversationContents,
          config: {
            systemInstruction
          }
        });
      } catch (err) {
        const is503 = err.status === 503 || err.code === 503 || String(err.message || "").includes("503") || String(err.message || "").includes("high demand") || String(err.message || "").includes("UNAVAILABLE");
        if (is503) {
          console.warn(`[Copilot] 503 spike on model ${targetModel}, retrying...`);
          await new Promise((r) => setTimeout(r, 1e3));
          try {
            response = await ai.models.generateContent({
              model: targetModel,
              contents: conversationContents,
              config: {
                systemInstruction
              }
            });
          } catch (retryErr) {
            const fallbackCandidates = ["gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"].filter((m) => m !== targetModel);
            for (const fb of fallbackCandidates) {
              try {
                response = await ai.models.generateContent({
                  model: fb,
                  contents: conversationContents,
                  config: {
                    systemInstruction
                  }
                });
                effectiveModel = fb;
                break;
              } catch (e) {
              }
            }
            if (!response) throw err;
          }
        } else {
          throw err;
        }
      }
      return res.json({
        ok: true,
        answer: response.text || "No response text generated.",
        modelUsed: effectiveModel,
        provider: "Google Gemini"
      });
    }
    if (provider === "openai" || provider === "deepseek" || provider === "groq" || provider === "openrouter") {
      let endpoint = "https://api.openai.com/v1/chat/completions";
      if (provider === "deepseek") endpoint = "https://api.deepseek.com/chat/completions";
      if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
      if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";
      const messages = [{ role: "system", content: systemInstruction }];
      if (Array.isArray(history)) {
        for (const msg of history.slice(-8)) {
          messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.content });
        }
      }
      messages.push({ role: "user", content: query });
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userApiKey}`
        },
        body: JSON.stringify({
          model: targetModel,
          messages
        })
      });
      if (!resp.ok) {
        const errText = await resp.text();
        return res.status(resp.status).json({ ok: false, error: `${provider} error: ${errText}` });
      }
      const data = await resp.json();
      return res.json({
        ok: true,
        answer: data.choices?.[0]?.message?.content || "",
        modelUsed: targetModel,
        provider
      });
    }
    return res.json({
      ok: true,
      answer: `AI Copilot query received: "${query}". (Workspace: ${workspace}). Configure Gemini or OpenAI in Settings to enable full natural language responses.`,
      provider
    });
  } catch (err) {
    console.error("AI Copilot error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to process copilot query"
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    let distPath = import_path.default.join(process.cwd(), "dist");
    try {
      if (!import_fs.default.existsSync(distPath)) {
        distPath = import_path.default.join(__dirname, "dist");
      }
      if (!import_fs.default.existsSync(distPath)) {
        distPath = __dirname;
      }
    } catch {
      distPath = import_path.default.join(process.cwd(), "dist");
    }
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ship Asaan Server running on http://0.0.0.0:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;

// api/index.ts
var maxDuration = 60;
function handler(req, res) {
  if (req.query?.__path) {
    const subPath = String(req.query.__path).replace(/^\/+/, "");
    delete req.query.__path;
    req.url = subPath ? `/api/${subPath}` : "/api";
  } else if (req.query?.all) {
    const parts = Array.isArray(req.query.all) ? req.query.all.join("/") : String(req.query.all);
    delete req.query.all;
    req.url = `/api/${parts.replace(/^\/+/, "")}`;
  } else {
    const rawUrl = req.originalUrl || req.headers?.["x-matched-path"] || req.headers?.["x-forwarded-url"] || req.url || "/";
    if (req.url === "/api" || req.url === "/api/index" || req.url === "/api/") {
      if (rawUrl && rawUrl !== "/api" && rawUrl !== "/api/index") {
        req.url = rawUrl;
      }
    }
    if (req.url && !req.url.startsWith("/api")) {
      req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
  }
  return server_default(req, res);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  maxDuration
});
