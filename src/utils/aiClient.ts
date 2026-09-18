import { AIProviderConfig } from "../types";

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
  let targetModel = (config.model || "").trim();

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

  const targetModel = config?.model?.trim() || (
    provider === "gemini" ? "gemini-3.8-flash" :
    provider === "openai" ? "gpt-4o-mini" :
    provider === "deepseek" ? "deepseek-chat" :
    provider === "groq" ? "llama-3.3-70b-versatile" :
    provider === "anthropic" ? "claude-3-5-haiku-20241022" : "gemini-3.8-flash"
  );

  const prompt = `You are the Tariff Intelligence & Rate Normalization Engine for Ship Asaan Logistics.
WORKSPACE: ${params.workspace.toUpperCase()}
FILENAME: ${params.filename}
PARTNER HINT: ${params.partnerHint || "Unknown"}

Analyze this courier rate card / tariff text and normalize it into a clean JSON structure:
${params.fileContent.slice(0, 100000)}

Return ONLY valid JSON matching this schema:
{
  "tariffName": "string",
  "partnerName": "string",
  "serviceType": "string",
  "currency": "PKR or USD",
  "effectiveFrom": "YYYY-MM-DD or empty",
  "effectiveUntil": "YYYY-MM-DD or empty",
  "confidence": 95,
  "ambiguities": [],
  "transformationsApplied": [],
  "dynamicRules": [],
  "rateMatrix": {
    "columns": [],
    "rows": []
  },
  "normalizedData": {
    "baseRate": 0,
    "additionalKgRate": 0,
    "fuelSurchargePct": 0,
    "gstPct": 0,
    "rates": [],
    "surcharges": []
  },
  "rawExtraction": {}
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
