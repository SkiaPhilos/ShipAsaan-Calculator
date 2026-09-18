import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Cpu,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  EyeOff,
  User,
  Key,
  Wand2,
  Trash2,
  AlertTriangle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { AIProviderConfig, AppUser } from "../types";
import { LocalStorageManager } from "../db/localStore";
import { LogoStorageManager } from "../utils/logoStorage";
import { testAIConnectionUniversal } from "../utils/aiClient";

interface SettingsViewProps {
  aiConfig: AIProviderConfig;
  onUpdateAIConfig: (config: AIProviderConfig) => void;
  onResetDatabase: () => void;
  onRefreshAllData: () => void;
  user?: AppUser;
  onUpdateUser?: (user: AppUser) => void;
}

// Curated list of popular, latest models per provider for quick suggestions
const PROVIDER_MODEL_PRESETS: Record<string, Array<{ id: string; label: string; badge?: string }>> = {
  gemini: [
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", badge: "Current Flagship" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", badge: "High Speed" },
    { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", badge: "Complex Reasoning" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Stable GA" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Deep Thinking" },
  ],
  openai: [
    { id: "gpt-5.4", label: "GPT-5.4", badge: "Workhorse" },
    { id: "gpt-5.5", label: "GPT-5.5", badge: "Next-Gen" },
    { id: "gpt-4o", label: "GPT-4o", badge: "Omni Standard" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini", badge: "Fast & Lightweight" },
    { id: "o4-mini", label: "o4-mini", badge: "High Reasoning" },
    { id: "o3-mini", label: "o3-mini", badge: "Math & Code" },
  ],
  anthropic: [
    { id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", badge: "Hybrid Reasoning" },
    { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", badge: "High Accuracy" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", badge: "Established Standard" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", badge: "Ultra Fast" },
    { id: "claude-opus-4-1", label: "Claude Opus 4.1", badge: "Complex Analysis" },
  ],
  deepseek: [
    { id: "deepseek-chat", label: "DeepSeek-V3 / V4 Chat", badge: "Flagship General" },
    { id: "deepseek-reasoner", label: "DeepSeek-R1 Reasoner", badge: "Deep Reasoning" },
    { id: "deepseek-v4-flash", label: "DeepSeek-V4-Flash", badge: "High Throughput" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile", badge: "Ultra Fast LPU" },
    { id: "qwen-2.5-32b", label: "Qwen 2.5 32B", badge: "Multilingual" },
    { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B", badge: "Reasoning" },
  ],
  openrouter: [
    { id: "google/gemini-2.5-flash", label: "Google: Gemini 2.5 Flash", badge: "OpenRouter" },
    { id: "anthropic/claude-3.7-sonnet", label: "Anthropic: Claude 3.7 Sonnet", badge: "OpenRouter" },
    { id: "deepseek/deepseek-r1", label: "DeepSeek: R1", badge: "OpenRouter" },
    { id: "openai/gpt-4o", label: "OpenAI: GPT-4o", badge: "OpenRouter" },
  ],
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  aiConfig,
  onUpdateAIConfig,
  onResetDatabase,
  onRefreshAllData,
  user,
  onUpdateUser,
}) => {
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const currentUser: AppUser = user || LocalStorageManager.getUser();

  // Brand Logo State
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<string | null>(null);

  useEffect(() => {
    LogoStorageManager.getLogo().then((logo) => {
      if (logo) setCurrentLogo(logo);
    });

    const onLogoChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ dataUrl?: string | null }>;
      if (customEvent.detail && customEvent.detail.dataUrl !== undefined) {
        setCurrentLogo(customEvent.detail.dataUrl);
      }
    };
    window.addEventListener("ship_asaan_logo_changed", onLogoChanged);
    return () => window.removeEventListener("ship_asaan_logo_changed", onLogoChanged);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoSuccess(null);
    setLogoUploading(true);

    try {
      const res = await LogoStorageManager.saveLogo(file);
      setLogoUploading(false);
      if (res.success && res.dataUrl) {
        setCurrentLogo(res.dataUrl);
        setLogoSuccess("Brand logo updated successfully! It is now visible in the top header bar.");
        setTimeout(() => setLogoSuccess(null), 4000);
      } else {
        setLogoError(res.error || "Failed to upload logo.");
      }
    } catch (err: any) {
      setLogoUploading(false);
      setLogoError(err.message || "Failed to process logo file.");
    } finally {
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (confirm("Reset logo to default Ship Asaan typography branding?")) {
      await LogoStorageManager.removeLogo();
      setCurrentLogo(null);
      setLogoSuccess("Custom logo removed. Standard header restored.");
      setTimeout(() => setLogoSuccess(null), 3500);
    }
  };

  // Local editable AI config
  const [provider, setProvider] = useState(aiConfig.provider || "gemini");
  const [apiKey, setApiKey] = useState(aiConfig.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [model, setModel] = useState(aiConfig.model || "gemini-3.8-flash");
  const [customEndpoint, setCustomEndpoint] = useState(aiConfig.customEndpoint || "");

  // Model validation & auto-correct state
  const [modelWarning, setModelWarning] = useState<{
    invalid: boolean;
    entered: string;
    suggestion: string;
  } | null>(null);
  const [autoCorrectedNotice, setAutoCorrectedNotice] = useState<string | null>(null);

  // Connection Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    provider?: string;
    model?: string;
    latencyMs?: number;
    message?: string;
    sampleResponse?: string;
  } | null>(null);

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Flush All Data modal / confirmation state
  const [showFlushModal, setShowFlushModal] = useState(false);
  const [flushConfirmText, setFlushConfirmText] = useState("");
  const [isFlushing, setIsFlushing] = useState(false);

  // Global action notification
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Helper to detect obvious formatting issues (like accidental spaces) and offer clean hyphenated format
  const validateModelName = (prov: string, modelName: string) => {
    const raw = modelName.trim();
    if (!raw) {
      setModelWarning(null);
      return;
    }

    // Check if model contains spaces (e.g. "gemini 3.9 flash" instead of "gemini-3.9-flash")
    if (raw.includes(" ")) {
      const hyphenated = raw.toLowerCase().replace(/\s+/g, "-");
      setModelWarning({
        invalid: false,
        entered: modelName,
        suggestion: hyphenated,
      });
      return;
    }

    // Common shorthand conveniences
    const clean = raw.toLowerCase();
    if (prov === "gemini" && (clean === "flash" || clean === "gemini-flash")) {
      setModelWarning({
        invalid: false,
        entered: modelName,
        suggestion: "gemini-3.8-flash",
      });
      return;
    }
    if (prov === "openai" && (clean === "gpt4" || clean === "gpt-4")) {
      setModelWarning({
        invalid: false,
        entered: modelName,
        suggestion: "gpt-4o",
      });
      return;
    }
    if (prov === "deepseek" && (clean === "deepseek" || clean === "deepseek-v3")) {
      setModelWarning({
        invalid: false,
        entered: modelName,
        suggestion: "deepseek-chat",
      });
      return;
    }

    // Any valid model string (including future models like gemini-3.9-flash, gpt-5, etc.) is fully accepted!
    setModelWarning(null);
  };

  // Run validation whenever model or provider changes
  useEffect(() => {
    validateModelName(provider, model);
  }, [provider, model]);

  const handleApplyAutoCorrect = () => {
    if (modelWarning?.suggestion) {
      const corrected = modelWarning.suggestion;
      setModel(corrected);
      setModelWarning(null);
      setAutoCorrectedNotice(`Auto-corrected model identifier to "${corrected}".`);
      setTimeout(() => setAutoCorrectedNotice(null), 4000);
    }
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AIProviderConfig = {
      ...aiConfig,
      provider: provider as any,
      apiKey: apiKey.trim(),
      model: model.trim(),
      customEndpoint: customEndpoint.trim(),
    };
    onUpdateAIConfig(updated);
    LocalStorageManager.setAIConfig(updated);
    setStatusMsg({ type: "success", text: "AI Provider configuration and API key saved." });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const configToTest: AIProviderConfig = {
        provider: provider as any,
        apiKey: apiKey.trim(),
        model: model.trim(),
        customEndpoint: customEndpoint.trim(),
      };

      const data = await testAIConnectionUniversal(configToTest);
      setTestResult(data);

      // Also persist the test status into local AI config
      const updatedConfig: AIProviderConfig = {
        ...aiConfig,
        provider: provider as any,
        apiKey: apiKey.trim(),
        model: model.trim(),
        customEndpoint: customEndpoint.trim(),
        testStatus: data.ok ? "success" : "failed",
        testMessage: data.message || data.error || (data.ok ? "Connected successfully" : "Connection failed"),
        lastTestedAt: new Date().toISOString(),
      };
      onUpdateAIConfig(updatedConfig);
      LocalStorageManager.setAIConfig(updatedConfig);
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || "Failed to reach AI service.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword || newPassword.length < 4) {
      setPasswordFeedback({
        type: "error",
        text: "New password must be at least 4 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        text: "Passwords do not match. Please verify and retype.",
      });
      return;
    }

    const res = LocalStorageManager.resetUserPassword(newPassword, currentUser.username);
    if (res.success) {
      const updatedUser = LocalStorageManager.getUser();
      onUpdateUser?.(updatedUser);
      setPasswordFeedback({
        type: "success",
        text: "Password updated successfully. Session updated.",
      });
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordFeedback({
        type: "error",
        text: res.message || "Failed to update password.",
      });
    }
  };

  // Execute Complete Data Flush
  const handleExecuteFlush = () => {
    if (flushConfirmText.trim().toUpperCase() !== "CONFIRM FLUSH") {
      alert("Please type 'CONFIRM FLUSH' to verify irreversible data wipe.");
      return;
    }

    setIsFlushing(true);
    setTimeout(() => {
      const res = LocalStorageManager.executeCompleteDataFlush(currentUser.username);
      setIsFlushing(false);
      setShowFlushModal(false);
      setFlushConfirmText("");

      if (res.success) {
        onRefreshAllData();
        setStatusMsg({
          type: "success",
          text: "All operational data (tariffs, partners, documents, calculations) has been completely flushed.",
        });
      } else {
        setStatusMsg({
          type: "error",
          text: res.message || "Data flush encountered an error.",
        });
      }
    }, 400);
  };

  const handleExportBackup = () => {
    const jsonStr = LocalStorageManager.exportFullBackup();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ship-asaan-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setStatusMsg({ type: "success", text: "Database JSON backup downloaded successfully." });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const res = LocalStorageManager.importFullBackup(
          reader.result as string,
          currentUser.username || "System Admin"
        );
        if (res.success) {
          onRefreshAllData();
          setStatusMsg({ type: "success", text: "Database restored successfully from backup." });
          setTimeout(() => setStatusMsg(null), 4000);
        } else {
          setStatusMsg({ type: "error", text: `Error: ${res.message}` });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-stone-900">System & AI Settings</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold uppercase bg-stone-100 text-stone-800">
            Enterprise Admin
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Manage multi-provider AI model settings, API credentials, account password security, and database lifecycle.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-3 border rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* ===================================================== */}
      {/* 0. Brand & Workspace Logo */}
      {/* ===================================================== */}
      <div
        id="settings-brand-logo-card"
        className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-stone-900">
              Workspace Brand Logo
            </h2>
          </div>
          <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
            Header Display
          </span>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Upload your official company logo to be displayed seamlessly in the top navigation bar. Supported formats are strictly <strong>PNG</strong>, <strong>JPG / JPEG</strong>, <strong>SVG</strong>, and <strong>ICO</strong>. High-resolution transparent PNGs are stored in local persistent database storage without browser quota restrictions.
        </p>

        {logoSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{logoSuccess}</span>
          </div>
        )}

        {logoError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{logoError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-stone-200 bg-stone-50/70">
          {/* Logo Preview Canvas */}
          <div className="w-48 h-20 rounded-lg border border-stone-300 bg-white flex items-center justify-center p-2 overflow-hidden shadow-2xs relative">
            {currentLogo ? (
              <img
                src={currentLogo}
                alt="Active Brand Logo"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-center">
                <span className="font-extrabold text-stone-900 text-sm tracking-tight block">
                  SHIP ASAAN
                </span>
                <span className="text-[9px] text-stone-400 font-medium">
                  Default Typography
                </span>
              </div>
            )}
          </div>

          {/* Action Controls */}
          <div className="space-y-2 flex-1">
            <input
              ref={logoFileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.ico,image/png,image/jpeg,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
              onChange={handleLogoUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-upload-brand-logo"
                type="button"
                disabled={logoUploading}
                onClick={() => logoFileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-900 hover:bg-purple-950 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                {logoUploading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>{currentLogo ? "Change Logo" : "Upload Logo"}</span>
              </button>

              {currentLogo && (
                <button
                  id="btn-remove-brand-logo"
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3.5 py-2 bg-white hover:bg-stone-100 text-red-600 border border-stone-200 hover:border-red-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-stone-400">
              Only files with extension <strong>.png</strong>, <strong>.jpg</strong>, <strong>.jpeg</strong>, <strong>.svg</strong>, or <strong>.ico</strong> are accepted.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 1. AI Provider, API Key & Model Configuration */}
      {/* ===================================================== */}
      <div
        id="settings-ai-config-card"
        className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-stone-900">
              AI Provider & Tariff Intelligence Engine
            </h2>
          </div>
          <span className="text-xs font-mono text-stone-500">
            Secure Server Proxy Active
          </span>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed">
          Configure the generative AI provider and model used for automated rate card extraction, document parsing, and the AI Copilot. Enter your API key below; the test connection verifies validity and model responsiveness.
        </p>

        <form onSubmit={handleSaveAI} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Active Provider */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                AI Provider
              </label>
              <select
                id="select-ai-provider"
                value={provider}
                onChange={(e) => {
                  const newP = e.target.value;
                  setProvider(newP as any);
                  if (newP === "gemini") setModel("gemini-3.8-flash");
                  else if (newP === "openai") setModel("gpt-4o-mini");
                  else if (newP === "anthropic") setModel("claude-3-5-haiku-20241022");
                  else if (newP === "deepseek") setModel("deepseek-chat");
                  else if (newP === "groq") setModel("llama-3.3-70b-versatile");
                  else if (newP === "openrouter") setModel("meta-llama/llama-3.3-70b-instruct");
                  else if (newP === "custom") setModel("custom-model");
                }}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-semibold"
              >
                <option value="gemini">Google Gemini (Gemini 3.8 / 3.5 / 2.5)</option>
                <option value="openai">OpenAI (GPT-5.4 / GPT-4o / o4-mini)</option>
                <option value="anthropic">Anthropic Claude (Claude 3.7 Sonnet / 4.5 / Haiku)</option>
                <option value="deepseek">DeepSeek (V3 / R1 / V4-Flash)</option>
                <option value="groq">Groq (Llama 3.3 / Qwen 2.5 / DeepSeek R1)</option>
                <option value="openrouter">OpenRouter (Unified Multi-Model Gateway)</option>
                <option value="custom">Custom / Local Endpoint (Ollama / vLLM / LM Studio)</option>
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700">API Key</label>
                {provider === "gemini" && !apiKey && (
                  <span className="text-[10px] text-green-700 font-medium">
                    (Default server GEMINI_API_KEY available)
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="input-ai-api-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder={
                    provider === "gemini"
                      ? "Enter Gemini API key (or leave empty for server default)"
                      : `Enter ${provider.toUpperCase()} API key`
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-3 pr-9 py-2 text-stone-800 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Model Identifier with Verification & Auto-Correct */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-stone-700">
                Model Identifier
              </label>
              <span className="text-[11px] text-stone-400">
                Any valid model name works (e.g. current or future models like gemini-3.9-flash)
              </span>
            </div>

            {/* Quick-Select Recommendation Pills */}
            {PROVIDER_MODEL_PRESETS[provider] && (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mr-1">
                  Popular:
                </span>
                {PROVIDER_MODEL_PRESETS[provider].map((preset) => {
                  const isSelected = model.trim() === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setModel(preset.id);
                        setModelWarning(null);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-md font-mono transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-purple-900 text-white font-bold shadow-2xs"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
                      }`}
                      title={preset.label}
                    >
                      <span>{preset.id}</span>
                      {preset.badge && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-sans ${
                            isSelected
                              ? "bg-purple-800 text-purple-100"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {preset.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                id="input-ai-model"
                type="text"
                list="model-suggestions"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Type or select model (e.g. gemini-3.8-flash, gpt-5.4, claude-3-7-sonnet)"
                className="w-full bg-stone-50 border border-stone-300 focus:ring-purple-600 rounded-lg px-3 py-2 text-stone-800 font-mono text-xs"
              />
              <datalist id="model-suggestions">
                {(PROVIDER_MODEL_PRESETS[provider] || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </datalist>
            </div>

            {/* Model Name Non-Blocking Format Suggestion */}
            {modelWarning?.suggestion && (
              <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-[11px]">
                    Tip: Did you mean the standard identifier{" "}
                    <code className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                      {modelWarning.suggestion}
                    </code>
                    ?
                  </span>
                </div>
                <button
                  id="btn-auto-correct-model"
                  type="button"
                  onClick={handleApplyAutoCorrect}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shrink-0 text-[11px] shadow-2xs transition-colors cursor-pointer"
                >
                  Apply &quot;{modelWarning.suggestion}&quot;
                </button>
              </div>
            )}

            {autoCorrectedNotice && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>{autoCorrectedNotice}</span>
              </div>
            )}
          </div>

          {provider === "custom" && (
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Custom Base Endpoint URL
              </label>
              <input
                id="input-custom-endpoint"
                type="text"
                placeholder="http://localhost:11434/v1"
                value={customEndpoint}
                onChange={(e) => setCustomEndpoint(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono text-xs"
              />
            </div>
          )}

          {/* Test Connection Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.ok
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">
                    {testResult.ok ? "Connection & Model Verified" : "Connection Test Failed"}
                  </p>
                  {testResult.latencyMs && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 rounded font-mono">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5">
                  {testResult.message || (testResult.ok ? "Ready for AI extractions." : "Unable to reach provider.")}
                </p>
                {testResult.sampleResponse && (
                  <p className="text-[10px] text-stone-500 font-mono mt-1 bg-white/70 px-2 py-0.5 rounded border border-stone-200 inline-block">
                    Ping test response: &quot;{testResult.sampleResponse}&quot;
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Buttons: Test & Save */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              id="btn-test-ai-connection"
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-2 transition-colors text-xs"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-700" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-purple-700" />
              )}
              <span>{isTesting ? "Testing Connection..." : "Test Connection"}</span>
            </button>

            <button
              id="btn-save-ai-config"
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold transition-colors shadow-2xs text-xs"
            >
              Save AI Configuration
            </button>
          </div>
        </form>
      </div>

      {/* ===================================================== */}
      {/* 2. User Account Security & Reset Password */}
      {/* ===================================================== */}
      <div
        id="settings-user-account-card"
        className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-stone-900">
              User Account & Reset Password
            </h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 font-semibold capitalize">
            Role: {currentUser.role}
          </span>
        </div>

        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <span className="text-stone-400 block text-[10px]">Username</span>
            <span className="font-bold text-stone-800">{currentUser.username}</span>
          </div>
          <div>
            <span className="text-stone-400 block text-[10px]">Full Name</span>
            <span className="font-bold text-stone-800">{currentUser.fullName}</span>
          </div>
          <div>
            <span className="text-stone-400 block text-[10px]">Email</span>
            <span className="font-bold text-stone-800">{currentUser.email}</span>
          </div>
        </div>

        {/* Reset Password Form */}
        <div className="border-t border-stone-100 pt-4">
          <h3 className="text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Reset Account Password</span>
          </h3>
          <p className="text-[11px] text-stone-500 mb-3">
            Enter a new password below to update your login credentials. Your session will be immediately refreshed.
          </p>

          {passwordFeedback && (
            <div
              className={`mb-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordFeedback.type === "success"
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{passwordFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="input-reset-new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 pr-9 py-1.5 text-xs text-stone-800 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="input-reset-confirm-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Retype new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-800 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="btn-submit-reset-password"
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 3. Database Persistence & Backup Management */}
      {/* ===================================================== */}
      <div
        id="settings-backup-card"
        className="bg-white border border-stone-200 rounded-2xl p-6 shadow-2xs space-y-4"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-purple-700" />
          <h2 className="text-sm font-bold text-stone-900">
            Local Database Persistence & Backup
          </h2>
        </div>

        <p className="text-xs text-stone-500">
          All domestic and international tariff agreements, document libraries, and calculation histories are stored persistently in your local browser sandbox across sessions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Export */}
          <button
            id="btn-export-database"
            type="button"
            onClick={handleExportBackup}
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
              <Download className="w-3.5 h-3.5 text-purple-700" />
              <span>Export Database</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Download complete JSON snapshot of all tariffs, rates, and history.
            </p>
          </button>

          {/* Import */}
          <button
            id="btn-restore-database"
            type="button"
            onClick={() => restoreFileRef.current?.click()}
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors space-y-1"
          >
            <input
              ref={restoreFileRef}
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
              <Upload className="w-3.5 h-3.5 text-purple-700" />
              <span>Restore Backup</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Restore tariffs and calculations from a previously exported backup file.
            </p>
          </button>

          {/* Reset to Seed */}
          <button
            id="btn-reset-seed-data"
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to restore verified initial seed tariffs (TCS, Leopards, M&P, Trax, Call Courier, DHL, FedEx)?")) {
                onResetDatabase();
                setStatusMsg({
                  type: "success",
                  text: "Database re-seeded with initial verified courier contracts.",
                });
                setTimeout(() => setStatusMsg(null), 3500);
              }
            }}
            className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-left transition-colors space-y-1"
          >
            <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
              <span>Reset to Seed Data</span>
            </div>
            <p className="text-[11px] text-stone-500">
              Reload standard Pakistan domestic and international verified carriers.
            </p>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 4. Danger Zone: Flush All System Data */}
      {/* ===================================================== */}
      <div
        id="settings-danger-zone-card"
        className="bg-red-50/40 border border-red-200 rounded-2xl p-6 shadow-2xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold">Danger Zone: Complete Data Flush</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded uppercase tracking-wider">
            Irreversible Action
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Flush and permanently delete all operational data from local browser storage. This wipes all Domestic and International tariffs, rate cards, carrier partners, document libraries, and calculation history. The security audit log is preserved in compliance with audit standards.
        </p>

        <div className="pt-1">
          <button
            id="btn-open-flush-modal"
            type="button"
            onClick={() => {
              setFlushConfirmText("");
              setShowFlushModal(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Flush All System Data</span>
          </button>
        </div>
      </div>

      {/* Flush Confirmation Modal */}
      {showFlushModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowFlushModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-stone-900">Confirm Complete Data Flush</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                This action will permanently purge all local records:
              </p>
              <ul className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg list-disc list-inside mt-2 space-y-0.5">
                <li>All Domestic & International Courier Tariffs</li>
                <li>All Partner Carrier Configurations</li>
                <li>All Uploaded Documents and Rate Cards</li>
                <li>All Calculation History Records</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Type <span className="font-mono text-red-600 font-bold">CONFIRM FLUSH</span> to proceed:
              </label>
              <input
                id="input-flush-confirmation"
                type="text"
                value={flushConfirmText}
                onChange={(e) => setFlushConfirmText(e.target.value)}
                placeholder="CONFIRM FLUSH"
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFlushModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-execute-flush"
                type="button"
                onClick={handleExecuteFlush}
                disabled={flushConfirmText.trim().toUpperCase() !== "CONFIRM FLUSH" || isFlushing}
                className={`px-4 py-2 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
                  flushConfirmText.trim().toUpperCase() === "CONFIRM FLUSH" && !isFlushing
                    ? "bg-red-600 hover:bg-red-700 cursor-pointer"
                    : "bg-red-300 cursor-not-allowed"
                }`}
              >
                {isFlushing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isFlushing ? "Flushing..." : "Permanently Flush Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
