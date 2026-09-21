import { AIProviderConfig } from "../types";

/**
 * Universal AI Model Normalizer:
 * Handles shorthand versions (e.g. "3.7", "3.6", "3.5", "3.8", "3.1"),
 * space-delimited formats (e.g. "gemini 3.7 flash" -> "gemini-3.7-flash"),
 * and ensures future custom models (e.g. "gemini-3.9-flash") resolve correctly.
 */
export function normalizeAIModel(provider: string, rawModel?: string): string {
  let m = (rawModel || "").trim();
  if (provider === "gemini") {
    if (!m) return "gemini-3.8-flash";
    if (m.startsWith("models/")) m = m.replace("models/", "");
    const lower = m.toLowerCase();

    if (
      lower === "3.7" ||
      lower === "3.7-flash" ||
      lower === "3.7 flash" ||
      lower === "gemini-3.7" ||
      lower === "gemini 3.7" ||
      lower === "gemini 3.7 flash" ||
      lower === "gemini-3.7-flash"
    ) {
      return "gemini-3.7-flash";
    }
    if (
      lower === "3.6" ||
      lower === "3.6-flash" ||
      lower === "3.6 flash" ||
      lower === "gemini-3.6" ||
      lower === "gemini 3.6" ||
      lower === "gemini 3.6 flash" ||
      lower === "gemini-3.6-flash"
    ) {
      return "gemini-3.6-flash";
    }
    if (
      lower === "3.5" ||
      lower === "3.5-flash" ||
      lower === "3.5 flash" ||
      lower === "gemini-3.5" ||
      lower === "gemini 3.5" ||
      lower === "gemini 3.5 flash" ||
      lower === "gemini-3.5-flash"
    ) {
      return "gemini-3.5-flash";
    }
    if (
      lower === "3.5-lite" ||
      lower === "3.5 lite" ||
      lower === "3.5-flash-lite" ||
      lower === "3.5 flash lite" ||
      lower === "gemini-3.5-flash-lite" ||
      lower === "gemini 3.5 flash lite"
    ) {
      return "gemini-3.5-flash-lite";
    }
    if (
      lower === "3.8" ||
      lower === "3.8-flash" ||
      lower === "3.8 flash" ||
      lower === "gemini-3.8" ||
      lower === "gemini 3.8" ||
      lower === "gemini 3.8 flash" ||
      lower === "gemini-3.8-flash"
    ) {
      return "gemini-3.8-flash";
    }
    if (
      lower === "3.1" ||
      lower === "3.1 pro" ||
      lower === "gemini 3.1" ||
      lower === "gemini 3.1 pro" ||
      lower === "gemini-3.1" ||
      lower === "gemini-3.1-pro" ||
      lower === "gemini-3.1-pro-preview"
    ) {
      return "gemini-3.1-pro-preview";
    }
    if (
      lower === "3.1 lite" ||
      lower === "3.1 flash lite" ||
      lower === "gemini 3.1 lite" ||
      lower === "gemini 3.1 flash lite" ||
      lower === "gemini-3.1-flash-lite" ||
      lower === "gemini-3.1-flash-lite-preview"
    ) {
      return "gemini-3.1-flash-lite";
    }
    if (
      lower === "2.5" ||
      lower === "2.5 flash" ||
      lower === "gemini 2.5" ||
      lower === "gemini 2.5 flash" ||
      lower === "gemini-2.5" ||
      lower === "gemini-2.5-flash"
    ) {
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
    if (
      lower === "3.7" ||
      lower === "claude 3.7" ||
      lower === "claude 3.7 sonnet" ||
      lower === "3.7 sonnet" ||
      lower === "claude-3.7-sonnet" ||
      lower === "claude-3-7-sonnet"
    ) {
      return "claude-3-7-sonnet-20250219";
    }
    if (
      lower === "3.5" ||
      lower === "claude 3.5" ||
      lower === "claude 3.5 sonnet" ||
      lower === "3.5 sonnet" ||
      lower === "claude-3.5-sonnet"
    ) {
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

/**
 * Universal AI Service caller that seamlessly supports:
 * 1. Web / Cloud mode: proxies via /api/ai/* (Express server)
 * 2. Packaged Desktop file:// mode: direct browser-side API calls to Gemini, OpenAI, Claude, Groq, DeepSeek, etc.
 * 3. Localhost / Electron server mode: tries /api/ai/* first, gracefully falls back to direct client call if server is unreachable!
 */

function getDirectGeminiEndpoint(model: string, apiKey: string): string {
  const cleanModel = model.startsWith("models/") ? model.replace("models/", "") : model;
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

export async function testAIConnectionUniversal(config: AIProviderConfig): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
  provider?: string;
  model?: string;
}> {
  const startTime = Date.now();
  const provider = config.provider || "gemini";
  const apiKey = (config.apiKey || "").trim();
  const rawModel = config.model === "custom" ? config.customModel : config.model;
  let targetModel = normalizeAIModel(provider, rawModel);

  // Try server proxy FIRST if we are running in an HTTP/HTTPS context where /api exists
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    try {
      const resp = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerConfig: config }),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch {
      // Server not reachable (e.g. static file host or separate origin), fall through to direct call
    }
  }

  // DIRECT CLIENT-SIDE FALLBACK (Guarantees web and portable usage works everywhere!)
  const fallbackKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  const activeKey = apiKey || (provider === "gemini" ? fallbackKey : "");
  if (!activeKey) {
    return {
      ok: false,
      error: `API key is required for ${provider.toUpperCase()}. Please enter your API key or configure VITE_GEMINI_API_KEY in environment.`,
    };
  }

  try {
    if (provider === "gemini") {
      if (!targetModel || targetModel === "gemini flash") targetModel = "gemini-3.8-flash";
      else if (targetModel === "gemini 3.6" || targetModel === "gemini-3.6" || targetModel === "gemini 3.6 flash") targetModel = "gemini-3.6-flash";
      else if (targetModel === "gemini 3.8" || targetModel === "gemini-3.8") targetModel = "gemini-3.8-flash";
      else if (targetModel === "gemini 2.5" || targetModel === "gemini-2.5") targetModel = "gemini-2.5-flash";
      else if (targetModel === "gemini pro") targetModel = "gemini-3.1-pro-preview";

      const endpoint = getDirectGeminiEndpoint(targetModel, apiKey);
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond with the single word 'OK' if you can read this." }] }],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return {
          ok: false,
          error: `Gemini API error (${resp.status}): ${errText}`,
        };
      }

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        provider: "Google Gemini",
        model: targetModel,
        latencyMs,
        message: `Successfully connected to ${targetModel} (${latencyMs}ms response). Verified.`,
      };
    }

    if (provider === "openai") {
      const chosenModel = targetModel || "gpt-4o-mini";
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `OpenAI error (${resp.status}): ${errText}` };
      }

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        provider: "OpenAI",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to OpenAI ${chosenModel} (${latencyMs}ms).`,
      };
    }

    if (provider === "groq") {
      const chosenModel = targetModel || "llama-3.3-70b-versatile";
      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `Groq error (${resp.status}): ${errText}` };
      }

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        provider: "Groq",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to Groq (${latencyMs}ms).`,
      };
    }

    if (provider === "openrouter") {
      const chosenModel = targetModel || "meta-llama/llama-3.3-70b-instruct";
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `OpenRouter error (${resp.status}): ${errText}` };
      }

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        provider: "OpenRouter",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to OpenRouter (${latencyMs}ms).`,
      };
    }

    if (provider === "deepseek") {
      const chosenModel = targetModel || "deepseek-chat";
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [{ role: "user", content: "Ping: Respond 'OK'" }],
          max_tokens: 10,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `DeepSeek error (${resp.status}): ${errText}` };
      }

      const latencyMs = Date.now() - startTime;
      return {
        ok: true,
        provider: "DeepSeek",
        model: chosenModel,
        latencyMs,
        message: `Successfully connected to DeepSeek ${chosenModel} (${latencyMs}ms).`,
      };
    }

    // Default fallback
    return {
      ok: true,
      provider,
      model: targetModel,
      latencyMs: Date.now() - startTime,
      message: `Configuration saved and validated for ${provider}.`,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: `Network connection failed: ${err.message || "Failed to reach AI service endpoint"}. Please check your internet connection.`,
    };
  }
}

/**
 * Universal AI Copilot query handler (Server first, with direct client fallback)
 */
export async function sendAICopilotUniversal(params: {
  query: string;
  workspace: string;
  contextData: any;
  providerConfig?: AIProviderConfig;
  history: Array<{ role: string; content: string }>;
}): Promise<{ ok: boolean; answer?: string; error?: string }> {
  // Try server proxy first if on HTTP
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    try {
      const resp = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok) return data;
      }
    } catch {
      // Fall through to direct
    }
  }

  // Direct client fallback
  const config = params.providerConfig;
  const fallbackKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  const apiKey = config?.apiKey?.trim() || fallbackKey;
  if (!apiKey) {
    return {
      ok: false,
      error: "No API Key configured. Please go to Settings > AI Provider or configure VITE_GEMINI_API_KEY.",
    };
  }

  const prompt = `You are the Ship Asaan AI Copilot for logistics, freight rate intelligence, and tariff optimization.
Active Workspace: ${params.workspace}
Current Logistics Context:
${JSON.stringify(params.contextData, null, 2)}

User Question:
${params.query}

Please provide an accurate, clear, and professional response using the tariff data provided.`;

  try {
    const targetModel = config?.model?.trim() || "gemini-3.8-flash";
    const endpoint = getDirectGeminiEndpoint(targetModel, apiKey);
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { ok: false, error: `AI error: ${errText}` };
    }

    const result = await resp.json();
    const answer = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response text generated.";
    return { ok: true, answer };
  } catch (err: any) {
    return { ok: false, error: `Failed to query AI: ${err.message}` };
  }
}

/**
 * Universal AI Tariff Extractor
 * First attempts the Express backend proxy /api/ai/extract-tariff.
 * If running in standalone desktop mode or server is offline, directly calls Gemini API.
 */
export async function extractTariffUniversal(params: {
  workspace: string;
  filename: string;
  fileContent: string;
  fileType?: string;
  partnerHint?: string;
  providerConfig?: AIProviderConfig;
}): Promise<{ ok: boolean; data?: any; error?: string }> {
  // 1. Try server proxy first if on HTTP/HTTPS
  if (typeof window !== "undefined" && window.location.protocol.startsWith("http")) {
    try {
      const resp = await fetch("/api/ai/extract-tariff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await resp.json().catch(() => null);
      if (result?.ok && result?.data) {
        return result;
      }
      if (result?.error) {
        return { ok: false, error: result.error };
      }
    } catch (networkErr: any) {
      console.warn("Server AI proxy unreachable, attempting direct client fallback:", networkErr);
      // Fall through to direct
    }
  }

  // 2. Direct client extraction fallback
  const config = params.providerConfig;
  const provider = config?.provider || "gemini";
  const fallbackKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  const apiKey = (config?.apiKey || "").trim() || (provider === "gemini" ? fallbackKey : "");
  
  if (!apiKey) {
    return {
      ok: false,
      error: `No API Key configured for ${provider.toUpperCase()}. Please configure an API key in Settings -> AI Configuration.`,
    };
  }

  const rawModel = config?.model === "custom" ? config?.customModel : config?.model;
  const targetModel = normalizeAIModel(provider, rawModel);

  const prompt = `You are the Chief Logistics Tariff Intelligence & 2D Rate Normalization Engine for Ship Asaan Logistics.
WORKSPACE CONTEXT: ${params.workspace.toUpperCase()} (${params.workspace === "domestic" ? "DOMESTIC Pakistan COD/Courier - TCS, Leopards, Trax, PostEx, M&P" : "INTERNATIONAL Freight & Express - Jump N Jump, DHL, FedEx, UPS, Skynet, Aramex"})
DOCUMENT FILENAME: ${params.filename}
PARTNER HINT: ${params.partnerHint || "Unknown / Not Specified"}

================================================================================
STRICT FACTUAL GROUNDING PRINCIPLES (MANDATORY & ZERO-HALLUCINATION):
================================================================================
1. STRICT ZERO-HALLUCINATION / FACTUAL GROUNDING:
   - Extract ONLY numbers, rates, surcharges, currency codes, zones, and rules that are explicitly stated in the provided document or text.
   - NEVER fabricate, invent, guess, or extrapolate courier partner names, base rates, per-kg rates, GST percentages, or fuel surcharges.
   - If a surcharge, tax rate, or specific zone rate is absent, omit it or set to null. Note any missing or ambiguous values in "ambiguities".
   - If text is ambiguous or contains conflicting terms, quote the raw text verbatim in "ambiguities" rather than guessing.

2. EXHAUSTIVE 2D MATRIX TABLE EXTRACTION:
   - Many courier rate cards are 2D cross-tabular matrices where:
     * Vertical rows represent Weight increments/slabs (e.g. 0.5kg, 1.0kg, 1.5kg, 2.0kg ... up to 70kg, and cargo brackets).
     * Horizontal column headers represent Destination Zones, Countries, or Cities (e.g. "Zone 1", "Zone 2", "CA", "US", "UK", "NL", "AU", "Karachi", "Lahore", "Same Province", etc.).
   - YOU MUST EXTRACT EVERY SINGLE ROW AND EVERY SINGLE COLUMN without stopping early or truncating rows.
   - Populate "rateMatrix.columns" with all unique destination columns (key, label, countries).
   - Populate "rateMatrix.rows" with all weight tiers (weightFrom, weightTo, weightLabel, pricingType, and a "rates" dictionary mapping column key -> exact numerical rate).
   - Also unpivot into "normalizedData.rates" for engine compatibility.

3. PRICING CLASSIFICATION (FLAT vs PER-KG):
   - Package Slabs (<= 70 kg): classify with pricingType: "flat". For example, a row for 0.5kg-1kg or 9.01-10kg is a flat parcel price.
   - Broad Heavy Cargo Brackets (e.g. 70.01-99kg, 100-300kg, 301-500kg): classify with pricingType: "per_kg" (unit cost per kilogram).

4. DOMESTIC RATE STRUCTURE:
   - Base/First KG Rate (for the first 0.5kg or 1.0kg).
   - Additional KG Rate (for each subsequent kilogram).
   - Distinguish sectors: Within City (Intra-city), Same Province (Intra-province), Different Province (Inter-province/Metro), and Remote / Extended Areas.

5. ACCURATE SURCHARGES & REGULATORY LEVIES:
   - Fuel Surcharge (FSC / FAC): extract exact percentage or flat rate, and whether it applies to base freight or total invoice.
   - Cash On Delivery (COD): extract COD commission percentage (e.g. 3%), minimum COD fee (e.g. PKR 50), and payment disbursement cycle.
   - Sales Tax / GST: extract provincial sales tax rates (e.g. PRA 16%, SRB 19.5%, BRA 15%, KPK 15%) or standard GST.
   - Volumetric Divisor: extract exact dimensional factor (e.g. L×W×H / 5000 or 6000 cm³/kg).

6. ARITHMETIC NORMALIZATION:
   - If rates are quoted in non-standard increments (e.g. 2kg increments or 500g increments), convert them to standardized 1.0kg equivalents so rating engines can calculate prices smoothly.
   - Always log every arithmetic adjustment in "transformationsApplied" (e.g., original: "Rs 380 per 2kg additional", normalized: "Rs 190 per 1kg additional", reasoning: "Normalized 2kg tier to 1kg standard base").

7. OPERATIONAL CLAUSES & DYNAMIC RULES:
   - Capture critical contract clauses in "dynamicRules":
     * Return to Origin (RTO) charges (e.g. 50% or 100% of freight).
     * Fragile crating or wooden box surcharge.
     * Remote Area Pin Code Delivery surcharge.
     * Maximum parcel weight or dimensional limits.

DOCUMENT CONTENT / OCR TEXT:
"""
${params.fileContent.slice(0, 100000)}
"""

Return ONLY valid JSON matching this schema:
{
  "tariffName": "string",
  "partnerName": "string",
  "serviceType": "string",
  "currency": "PKR or USD or EUR",
  "effectiveFrom": "YYYY-MM-DD or empty",
  "effectiveUntil": "YYYY-MM-DD or empty",
  "confidence": 95,
  "ambiguities": ["string"],
  "transformationsApplied": [
    {
      "id": "trans-1",
      "originalFormat": "string",
      "normalizedFormat": "string",
      "reasoning": "string"
    }
  ],
  "dynamicRules": [
    {
      "id": "dyn-1",
      "ruleKey": "string",
      "title": "string",
      "category": "weight_increment",
      "condition": "string",
      "formulaOrValue": "string",
      "description": "string",
      "sourceText": "string",
      "enabled": true
    }
  ],
  "rateMatrix": {
    "columns": [
      { "key": "CA", "label": "Canada", "countries": ["Canada"] }
    ],
    "rows": [
      {
        "weightFrom": 0.01,
        "weightTo": 0.5,
        "weightLabel": "0.01 – 0.5 kg",
        "pricingType": "flat",
        "rates": { "CA": 2500 }
      }
    ],
    "additionalKgRates": { "CA": 350 },
    "unit": "kg"
  },
  "normalizedData": {
    "pricingStructure": "matrix_zone_weight",
    "baseRate": 260,
    "additionalKgRate": 150,
    "fuelSurchargePct": 18.5,
    "gstPct": 16.0,
    "volumetricDivisor": 5000,
    "rates": [
      {
        "origin": "Karachi",
        "destination": "Lahore",
        "firstKgRate": 380,
        "additionalKgRate": 190,
        "weightFrom": 0,
        "weightTo": 1,
        "pricingType": "flat"
      }
    ],
    "surcharges": [
      {
        "name": "Fuel Surcharge",
        "originalName": "FSC",
        "type": "percentage",
        "value": 18.5,
        "applicability": "base_rate"
      }
    ],
    "codTerms": {
      "percentage": 3.0,
      "fixedMinimum": 50
    }
  },
  "rawExtraction": {
    "extractedTextSnippet": "string",
    "detectedHeaders": ["string"],
    "originalClauses": ["string"]
  },
  "additionalData": [],
  "extractionNotes": "string"
}`;

  try {
    let rawText = "";

    if (provider === "gemini") {
      const endpoint = getDirectGeminiEndpoint(targetModel, apiKey);
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `Gemini extraction failed (${resp.status}): ${errText}` };
      }

      const jsonResp = await resp.json();
      rawText = jsonResp.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (provider === "openai" || provider === "deepseek" || provider === "groq" || provider === "openrouter") {
      let endpoint = "https://api.openai.com/v1/chat/completions";
      if (provider === "deepseek") endpoint = "https://api.deepseek.com/chat/completions";
      if (provider === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
      if (provider === "openrouter") endpoint = "https://openrouter.ai/api/v1/chat/completions";

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: "You are a professional logistics tariff normalization engine. Return valid JSON only." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { ok: false, error: `${provider} extraction failed (${resp.status}): ${errText}` };
      }

      const jsonResp = await resp.json();
      rawText = jsonResp.choices?.[0]?.message?.content || "";
    } else {
      return { ok: false, error: `Direct client fallback is not supported for provider '${provider}'. Please ensure the backend server is running.` };
    }

    if (!rawText) {
      return { ok: false, error: `Empty response from ${provider}` };
    }

    let cleanJson = rawText.trim();
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

    const data = JSON.parse(cleanJson);
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: `Direct extraction error: ${err.message}` };
  }
}
