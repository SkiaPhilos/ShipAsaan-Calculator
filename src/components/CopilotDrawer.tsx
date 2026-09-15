import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Cpu,
  Bot,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  WorkspaceType,
  AIProviderConfig,
  TariffDomestic,
  TariffInternational,
  PartnerDomestic,
  PartnerInternational,
  StoredDocument,
} from "../types";
import { sendAICopilotUniversal } from "../utils/aiClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspace: WorkspaceType;
  aiConfig: AIProviderConfig;
  domesticTariffs: TariffDomestic[];
  internationalTariffs: TariffInternational[];
  domesticPartners: PartnerDomestic[];
  internationalPartners: PartnerInternational[];
  documents: StoredDocument[];
  onNavigateToView?: (view: any) => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  activeWorkspace,
  aiConfig,
  domesticTariffs,
  internationalTariffs,
  domesticPartners,
  internationalPartners,
  documents,
  onNavigateToView,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-msg",
      role: "assistant",
      content: `Hello! I am your **Ship Asaan AI Copilot**.\n\nI have full real-time access to your local ${
        activeWorkspace === "domestic" ? "Domestic (COD)" : "International"
      } database, active carrier tariffs, verified rate sheets, and logistics rules.\n\nYou can ask me to calculate quotes, compare courier options, analyze fuel surcharges, or ask general logistics questions!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDomestic = activeWorkspace === "domestic";

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setErrorNotice(null);
    setInputQuery("");

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Build database context to ground the response
    const contextData = {
      workspace: activeWorkspace,
      activeTariffs: isDomestic
        ? domesticTariffs.map((t) => ({
            partner: t.partnerName,
            service: t.serviceName,
            fuelSurcharge: t.fuelSurchargePercentage,
            codFee: `${t.codPercentage}% (Min PKR ${t.codFixedMinimum})`,
            gst: t.gstPercentage,
            ratesSummary: t.rates.slice(0, 10).map((r) => ({
              dest: r.destinationCity,
              firstKg: r.firstKgRate,
              addKg: r.additionalKgRate,
            })),
          }))
        : internationalTariffs.map((t) => ({
            partner: t.partnerName,
            service: t.serviceName,
            fuelSurcharge: t.fuelSurchargePercentage,
            currency: t.currency,
            zones: t.rates.slice(0, 10).map((r) => ({
              zone: r.zone,
              first0_5kg: r.first0_5kgRate,
              add0_5kg: r.additional0_5kgRate,
            })),
          })),
      partners: isDomestic
        ? domesticPartners.map((p) => ({ name: p.name, code: p.code, active: p.isActive }))
        : internationalPartners.map((p) => ({ name: p.name, code: p.code, active: p.isActive })),
      storedDocumentsCount: documents.length,
      sampleDocuments: documents.slice(0, 5).map((d) => ({
        name: d.filename,
        partner: d.partnerName,
        uploaded: d.uploadedAt,
      })),
    };

    try {
      const historyForApi = messages
        .filter((m) => m.id !== "welcome-msg")
        .map((m) => ({ role: m.role, content: m.content }));

      const data = await sendAICopilotUniversal({
        query: textToSend,
        workspace: activeWorkspace,
        contextData,
        providerConfig: aiConfig,
        history: historyForApi,
      });

      if (!data.ok) {
        throw new Error(data.error || "AI service returned an error");
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.answer || "No response received from AI model.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Copilot error:", err);
      setErrorNotice(err.message || "Failed to communicate with AI Copilot");
      const errorMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Connection issue**: ${
          err.message || "Could not reach AI provider."
        }\n\nPlease verify your API key and model settings in **Settings -> AI Configuration**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-msg-reset",
        role: "assistant",
        content: `Chat history cleared. How can I help you today with your ${
          isDomestic ? "Domestic COD" : "International"
        } tariffs?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  const quickPrompts = isDomestic
    ? [
        "Which courier is cheapest for 3kg Karachi to Lahore?",
        "What is TCS fuel surcharge and COD fee?",
        "Show Leopards Overnight rate breakdown",
        "How is volumetric weight calculated?",
      ]
    : [
        "Compare DHL vs FedEx rates for USA 5kg",
        "What is DHL's fuel surcharge for international?",
        "Which zone does United Kingdom belong to?",
        "Explain volumetric divisor (5000 vs 6000)",
      ];

  return (
    <div
      id="ai-copilot-drawer-container"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-stone-900/30 backdrop-blur-xs transition-opacity"
    >
      <div
        id="ai-copilot-drawer"
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-stone-200 z-50 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                isDomestic ? "bg-purple-900" : "bg-purple-900"
              }`}
            >
              <Sparkles className="w-4 h-4 text-lime-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-stone-900 leading-tight">
                  Tariff Intelligence Copilot
                </h3>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isDomestic
                      ? "bg-purple-100 text-purple-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {activeWorkspace}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-stone-400" />
                  <span>
                    {aiConfig.provider.toUpperCase()} (
                    {aiConfig.model || "gemini-3.8-flash"})
                  </span>
                </p>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-clear-copilot-history"
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              id="btn-close-copilot-drawer"
              type="button"
              onClick={onClose}
              title="Close Copilot"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Database Context Ribbon */}
        <div className="px-5 py-2 bg-stone-100/70 border-b border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
            <span>Grounded on:</span>
            <span className="font-semibold text-stone-800">
              {isDomestic ? domesticTariffs.length : internationalTariffs.length} Tariffs,{" "}
              {documents.length} Docs
            </span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">
            {isDomestic ? "PKR Logistics" : "Global Express"}
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]/50">
          {messages.map((msg) => {
            const isBot = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? "items-start" : "items-start flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isBot
                      ? isDomestic
                        ? "bg-purple-900 text-lime-400"
                        : "bg-purple-900 text-orange-400"
                      : "bg-stone-800 text-white"
                  }`}
                >
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    isBot
                      ? "bg-white border border-stone-200 text-stone-800 rounded-tl-xs"
                      : isDomestic
                      ? "bg-purple-900 text-white rounded-tr-xs"
                      : "bg-purple-900 text-white rounded-tr-xs"
                  }`}
                >
                  {/* Message body with Markdown linebreaks */}
                  <div className="whitespace-pre-wrap font-sans break-words">
                    {msg.content}
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] text-right ${
                      isBot ? "text-stone-400" : "text-purple-200"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isDomestic
                    ? "bg-purple-900 text-lime-400"
                    : "bg-purple-900 text-orange-400"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span className="text-[11px] text-stone-500 ml-1.5">
                    Analyzing rate sheets & database...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 shrink-0">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
            Suggested Prompts:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-[11px] px-2.5 py-1 bg-white hover:bg-purple-50 hover:border-purple-300 border border-stone-200 text-stone-700 rounded-lg transition-colors text-left truncate max-w-full"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200 shrink-0">
          {errorNotice && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{errorNotice}</span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              id="input-copilot-query"
              type="text"
              placeholder={`Ask anything about ${
                isDomestic ? "Domestic / COD tariffs" : "International rates"
              }...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-stone-900 placeholder-stone-400"
            />
            <button
              id="btn-send-copilot-query"
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className={`px-3 py-2 rounded-xl text-white font-medium text-xs flex items-center gap-1 transition-all ${
                isLoading || !inputQuery.trim()
                  ? "bg-stone-300 cursor-not-allowed"
                  : isDomestic
                  ? "bg-purple-900 hover:bg-purple-950"
                  : "bg-purple-900 hover:bg-purple-950"
              }`}
            >
              <span>Send</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400 px-1">
            <span>Press Enter to send</span>
            <span>Grounding: 100% verified rates</span>
          </div>
        </div>
      </div>
    </div>
  );
};
