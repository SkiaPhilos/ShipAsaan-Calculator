import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Sidebar, NavView } from "./components/Sidebar";
import { DashboardView } from "./components/DashboardView";
import { CalculatorView } from "./components/CalculatorView";
import { ComparisonView } from "./components/ComparisonView";
import { PartnersView } from "./components/PartnersView";
import { TariffsView } from "./components/TariffsView";
import { ImportView } from "./components/ImportView";
import { GeographyView } from "./components/GeographyView";
import { DocumentLibraryView } from "./components/DocumentLibraryView";
import { HistoryView } from "./components/HistoryView";
import { SettingsView } from "./components/SettingsView";
import { LoginView } from "./components/LoginView";
import { CopilotDrawer } from "./components/CopilotDrawer";
import { LocalStorageManager } from "./db/localStore";
import {
  seedFirestoreIfEmpty,
  subscribeDomesticTariffs,
  subscribeInternationalTariffs,
  subscribeDocuments,
  subscribeCalculationHistory,
  subscribePartners,
  saveDomesticTariffToFirestore,
  deleteDomesticTariffFromFirestore,
  saveInternationalTariffToFirestore,
  deleteInternationalTariffFromFirestore,
  saveDocumentToFirestore,
  saveHistoryRecordToFirestore,
  savePartnerToFirestore,
} from "./db/firebase";
import {
  WorkspaceType,
  PartnerDomestic,
  PartnerInternational,
  TariffDomestic,
  TariffInternational,
  DomesticCity,
  InternationalCountryZone,
  StoredDocument,
  CalculationHistoryRecord,
  AIProviderConfig,
  AppUser,
} from "./types";

export default function App() {
  // 1. Core State loaded from LocalStorageManager
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceType>(() =>
    LocalStorageManager.getActiveWorkspace()
  );

  const [currentView, setCurrentView] = useState<NavView>("dashboard");

  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() =>
    LocalStorageManager.getAIConfig()
  );

  const [user, setUser] = useState<AppUser>(() => {
    const logged = LocalStorageManager.getLoggedInUser();
    if (logged) return logged;
    return LocalStorageManager.getUser();
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const logged = LocalStorageManager.getLoggedInUser();
    return logged !== null && logged.status !== "pending_approval" && logged.status !== "rejected";
  });
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Domestic Data
  const [domesticPartners, setDomesticPartners] = useState<PartnerDomestic[]>(() =>
    LocalStorageManager.getDomesticPartners()
  );
  const [domesticTariffs, setDomesticTariffs] = useState<TariffDomestic[]>(() =>
    LocalStorageManager.getDomesticTariffs()
  );
  const [domesticCities, setDomesticCities] = useState<DomesticCity[]>(() =>
    LocalStorageManager.getDomesticCities()
  );
  const [domesticDocs, setDomesticDocs] = useState<StoredDocument[]>(() =>
    LocalStorageManager.getDocuments("domestic")
  );
  const [domesticHistory, setDomesticHistory] = useState<CalculationHistoryRecord[]>(() =>
    LocalStorageManager.getHistory("domestic")
  );

  // International Data
  const [internationalPartners, setInternationalPartners] = useState<PartnerInternational[]>(() =>
    LocalStorageManager.getInternationalPartners()
  );
  const [internationalTariffs, setInternationalTariffs] = useState<TariffInternational[]>(() =>
    LocalStorageManager.getInternationalTariffs()
  );
  const [internationalCountries, setInternationalCountries] = useState<InternationalCountryZone[]>(() =>
    LocalStorageManager.getInternationalCountries()
  );
  const [internationalDocs, setInternationalDocs] = useState<StoredDocument[]>(() =>
    LocalStorageManager.getDocuments("international")
  );
  const [internationalHistory, setInternationalHistory] = useState<CalculationHistoryRecord[]>(() =>
    LocalStorageManager.getHistory("international")
  );

  // Modal / Interactive State
  const [inspectedTariffId, setInspectedTariffId] = useState<string | null>(null);
  const [quickRoute, setQuickRoute] = useState<{ origin: string; dest: string; weight: number } | undefined>(undefined);

  // Sync workspace change to localStorage
  const handleWorkspaceChange = (ws: WorkspaceType) => {
    setActiveWorkspace(ws);
    LocalStorageManager.setActiveWorkspace(ws);
    // If on locations or countries, switch to relevant view
    if (currentView === "locations" && ws === "international") {
      setCurrentView("countries");
    } else if (currentView === "countries" && ws === "domestic") {
      setCurrentView("locations");
    }
  };

  // -------------------------------------------------------------
  // CLOUD FIRESTORE REAL-TIME SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    // 1. Seed Firestore master rate cards if cloud collection is brand new
    seedFirestoreIfEmpty();

    // 2. Real-time domestic tariffs subscription
    const unsubDomTariffs = subscribeDomesticTariffs((cloudTariffs) => {
      if (cloudTariffs && cloudTariffs.length > 0) {
        setDomesticTariffs(cloudTariffs);
        LocalStorageManager.saveDomesticTariffs(cloudTariffs);
      }
    });

    // 3. Real-time international tariffs subscription
    const unsubIntlTariffs = subscribeInternationalTariffs((cloudTariffs) => {
      if (cloudTariffs && cloudTariffs.length > 0) {
        setInternationalTariffs(cloudTariffs);
        LocalStorageManager.saveInternationalTariffs(cloudTariffs);
      }
    });

    // 4. Real-time documents subscription
    const unsubDomDocs = subscribeDocuments("domestic", (cloudDocs) => {
      setDomesticDocs(cloudDocs);
      LocalStorageManager.saveDocuments("domestic", cloudDocs);
    });
    const unsubIntlDocs = subscribeDocuments("international", (cloudDocs) => {
      setInternationalDocs(cloudDocs);
      LocalStorageManager.saveDocuments("international", cloudDocs);
    });

    // 5. Real-time calculation audit history
    const unsubDomHistory = subscribeCalculationHistory("domestic", (cloudHistory) => {
      setDomesticHistory(cloudHistory);
    });
    const unsubIntlHistory = subscribeCalculationHistory("international", (cloudHistory) => {
      setInternationalHistory(cloudHistory);
    });

    // 6. Real-time partner profiles
    const unsubDomPartners = subscribePartners("domestic", (cloudPartners) => {
      if (cloudPartners && cloudPartners.length > 0) {
        setDomesticPartners(cloudPartners);
        LocalStorageManager.saveDomesticPartners(cloudPartners);
      }
    });
    const unsubIntlPartners = subscribePartners("international", (cloudPartners) => {
      if (cloudPartners && cloudPartners.length > 0) {
        setInternationalPartners(cloudPartners);
        LocalStorageManager.saveInternationalPartners(cloudPartners);
      }
    });

    return () => {
      unsubDomTariffs();
      unsubIntlTariffs();
      unsubDomDocs();
      unsubIntlDocs();
      unsubDomHistory();
      unsubIntlHistory();
      unsubDomPartners();
      unsubIntlPartners();
    };
  }, []);

  // Refresh all state from local store
  const refreshAllData = () => {
    setDomesticPartners(LocalStorageManager.getDomesticPartners());
    setDomesticTariffs(LocalStorageManager.getDomesticTariffs());
    setDomesticCities(LocalStorageManager.getDomesticCities());
    setDomesticDocs(LocalStorageManager.getDocuments("domestic"));
    setDomesticHistory(LocalStorageManager.getHistory("domestic"));

    setInternationalPartners(LocalStorageManager.getInternationalPartners());
    setInternationalTariffs(LocalStorageManager.getInternationalTariffs());
    setInternationalCountries(LocalStorageManager.getInternationalCountries());
    setInternationalDocs(LocalStorageManager.getDocuments("international"));
    setInternationalHistory(LocalStorageManager.getHistory("international"));

    setAiConfig(LocalStorageManager.getAIConfig());
  };

  // Tariff verification
  const handleVerifyTariff = (tariffId: string) => {
    if (activeWorkspace === "domestic") {
      let verifiedItem: TariffDomestic | null = null;
      const updated = domesticTariffs.map((t) => {
        if (t.id === tariffId) {
          verifiedItem = {
            ...t,
            reviewStatus: "user_verified" as const,
            status: "active" as const,
            updatedAt: new Date().toISOString(),
          };
          return verifiedItem;
        }
        return t;
      });
      setDomesticTariffs(updated);
      LocalStorageManager.saveDomesticTariffs(updated);
      if (verifiedItem) saveDomesticTariffToFirestore(verifiedItem);
    } else {
      let verifiedItem: TariffInternational | null = null;
      const updated = internationalTariffs.map((t) => {
        if (t.id === tariffId) {
          verifiedItem = {
            ...t,
            reviewStatus: "user_verified" as const,
            status: "active" as const,
            updatedAt: new Date().toISOString(),
          };
          return verifiedItem;
        }
        return t;
      });
      setInternationalTariffs(updated);
      LocalStorageManager.saveInternationalTariffs(updated);
      if (verifiedItem) saveInternationalTariffToFirestore(verifiedItem);
    }
  };

  // Save new tariff from Import
  const handleSaveNewTariff = (
    tariff: TariffDomestic | TariffInternational,
    sourceDoc: StoredDocument
  ) => {
    if (activeWorkspace === "domestic") {
      const updatedTariffs = [tariff as TariffDomestic, ...domesticTariffs];
      setDomesticTariffs(updatedTariffs);
      LocalStorageManager.saveDomesticTariffs(updatedTariffs);
      saveDomesticTariffToFirestore(tariff as TariffDomestic);

      const updatedDocs = [sourceDoc, ...domesticDocs];
      setDomesticDocs(updatedDocs);
      LocalStorageManager.saveDocuments("domestic", updatedDocs);
      saveDocumentToFirestore(sourceDoc);
    } else {
      const updatedTariffs = [tariff as TariffInternational, ...internationalTariffs];
      setInternationalTariffs(updatedTariffs);
      LocalStorageManager.saveInternationalTariffs(updatedTariffs);
      saveInternationalTariffToFirestore(tariff as TariffInternational);

      const updatedDocs = [sourceDoc, ...internationalDocs];
      setInternationalDocs(updatedDocs);
      LocalStorageManager.saveDocuments("international", updatedDocs);
      saveDocumentToFirestore(sourceDoc);
    }
  };

  // Add Document Only
  const handleAddDocumentOnly = (doc: StoredDocument) => {
    LocalStorageManager.addDocument(doc);
    saveDocumentToFirestore(doc);
    if (doc.workspace === "domestic") {
      setDomesticDocs((prev) => [doc, ...prev]);
    } else {
      setInternationalDocs((prev) => [doc, ...prev]);
    }
  };

  // Save calculation history
  const handleSaveHistory = (record: CalculationHistoryRecord) => {
    LocalStorageManager.addHistoryItem(record);
    saveHistoryRecordToFirestore(record);
    if (record.workspace === "domestic") {
      setDomesticHistory((prev) => [record, ...prev]);
    } else {
      setInternationalHistory((prev) => [record, ...prev]);
    }
  };

  // Clear history
  const handleClearHistory = () => {
    LocalStorageManager.clearHistory(activeWorkspace);
    if (activeWorkspace === "domestic") {
      setDomesticHistory([]);
    } else {
      setInternationalHistory([]);
    }
  };

  // Add Partners
  const handleAddDomesticPartner = (partner: PartnerDomestic) => {
    const updated = [...domesticPartners, partner];
    setDomesticPartners(updated);
    LocalStorageManager.saveDomesticPartners(updated);
    savePartnerToFirestore(partner, "domestic");
  };

  const handleAddInternationalPartner = (partner: PartnerInternational) => {
    const updated = [...internationalPartners, partner];
    setInternationalPartners(updated);
    LocalStorageManager.saveInternationalPartners(updated);
    savePartnerToFirestore(partner, "international");
  };

  // Add & Delete Geography items
  const handleAddDomesticCity = (city: DomesticCity) => {
    const updated = [...domesticCities, city];
    setDomesticCities(updated);
    LocalStorageManager.saveDomesticCities(updated);
  };

  const handleDeleteDomesticCity = (cityId: string) => {
    const updated = domesticCities.filter((c) => c.id !== cityId);
    setDomesticCities(updated);
    LocalStorageManager.saveDomesticCities(updated);
  };

  const handleAddInternationalCountry = (country: InternationalCountryZone) => {
    const updated = [...internationalCountries, country];
    setInternationalCountries(updated);
    LocalStorageManager.saveInternationalCountries(updated);
  };

  const handleDeleteInternationalCountry = (countryCode: string) => {
    const updated = internationalCountries.filter((c) => c.countryCode !== countryCode);
    setInternationalCountries(updated);
    LocalStorageManager.saveInternationalCountries(updated);
  };

  // Add & Delete Rate Cards (Tariffs)
  const handleAddTariff = (tariff: TariffDomestic | TariffInternational) => {
    if (activeWorkspace === "domestic") {
      const updated = [tariff as TariffDomestic, ...domesticTariffs];
      setDomesticTariffs(updated);
      LocalStorageManager.saveDomesticTariffs(updated);
      saveDomesticTariffToFirestore(tariff as TariffDomestic);
    } else {
      const updated = [tariff as TariffInternational, ...internationalTariffs];
      setInternationalTariffs(updated);
      LocalStorageManager.saveInternationalTariffs(updated);
      saveInternationalTariffToFirestore(tariff as TariffInternational);
    }
  };

  const handleDeleteTariff = (tariffId: string) => {
    if (activeWorkspace === "domestic") {
      const updated = domesticTariffs.filter((t) => t.id !== tariffId);
      setDomesticTariffs(updated);
      LocalStorageManager.saveDomesticTariffs(updated);
      deleteDomesticTariffFromFirestore(tariffId);
    } else {
      const updated = internationalTariffs.filter((t) => t.id !== tariffId);
      setInternationalTariffs(updated);
      LocalStorageManager.saveInternationalTariffs(updated);
      deleteInternationalTariffFromFirestore(tariffId);
    }
  };

  // Update AI config
  const handleUpdateAIConfig = (cfg: AIProviderConfig) => {
    setAiConfig(cfg);
    LocalStorageManager.saveAIConfig(cfg);
  };

  // Reset database to seeds
  const handleResetDatabase = () => {
    LocalStorageManager.resetToSeedData();
    refreshAllData();
  };

  // Quick route select from dashboard
  const handleQuickRouteSelect = (origin: string, dest: string, weight: number) => {
    setQuickRoute({ origin, dest, weight });
    setCurrentView("calculator");
  };

  // Count items needing review
  const needsReviewCount = (
    activeWorkspace === "domestic" ? domesticTariffs : internationalTariffs
  ).filter(
    (t) => t.reviewStatus.includes("needs_review") || t.status === "needs_review"
  ).length;

  const handleLogout = () => {
    LocalStorageManager.setLoggedInUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn || user.status === "pending_approval" || user.status === "rejected") {
    return (
      <LoginView
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-stone-900 font-sans antialiased">
      {/* 1. Global Header with Workspace Switcher */}
      <Header
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        aiConfig={aiConfig}
        user={user}
        onOpenSettings={() => setCurrentView("settings")}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeWorkspace={activeWorkspace}
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view);
          }}
          needsReviewCount={needsReviewCount}
        />

        {/* Content View Area */}
        <main
          id="main-content-viewport"
          className="flex-1 overflow-y-auto p-5 sm:p-7 max-w-7xl mx-auto w-full"
        >
          {currentView === "dashboard" && (
            <DashboardView
              activeWorkspace={activeWorkspace}
              onNavigate={setCurrentView}
              domesticPartners={domesticPartners}
              domesticTariffs={domesticTariffs}
              domesticDocs={domesticDocs}
              internationalPartners={internationalPartners}
              internationalTariffs={internationalTariffs}
              internationalDocs={internationalDocs}
              onOpenTariffDetails={(tId) => {
                setInspectedTariffId(tId);
                setCurrentView("tariffs");
              }}
              onQuickRouteSelect={handleQuickRouteSelect}
            />
          )}

          {currentView === "calculator" && (
            <CalculatorView
              activeWorkspace={activeWorkspace}
              domesticTariffs={domesticTariffs}
              internationalTariffs={internationalTariffs}
              domesticCities={domesticCities}
              internationalCountries={internationalCountries}
              onSaveHistory={handleSaveHistory}
              onOpenTariffDetails={(tId) => {
                setInspectedTariffId(tId);
                setCurrentView("tariffs");
              }}
              initialRoute={quickRoute}
            />
          )}

          {currentView === "comparison" && (
            <ComparisonView
              activeWorkspace={activeWorkspace}
              domesticTariffs={domesticTariffs}
              internationalTariffs={internationalTariffs}
              domesticCities={domesticCities}
              internationalCountries={internationalCountries}
              onOpenTariffDetails={(tId) => {
                setInspectedTariffId(tId);
                setCurrentView("tariffs");
              }}
            />
          )}

          {currentView === "partners" && (
            <PartnersView
              activeWorkspace={activeWorkspace}
              domesticPartners={domesticPartners}
              internationalPartners={internationalPartners}
              onAddDomesticPartner={handleAddDomesticPartner}
              onAddInternationalPartner={handleAddInternationalPartner}
            />
          )}

          {currentView === "tariffs" && (
            <TariffsView
              activeWorkspace={activeWorkspace}
              domesticTariffs={domesticTariffs}
              internationalTariffs={internationalTariffs}
              onVerifyTariff={handleVerifyTariff}
              selectedTariffIdModal={inspectedTariffId}
              onCloseTariffModal={() => setInspectedTariffId(null)}
              onOpenTariffModal={(tId) => setInspectedTariffId(tId)}
              onDeleteTariff={handleDeleteTariff}
              onAddTariff={handleAddTariff}
            />
          )}

          {currentView === "import" && (
            <ImportView
              activeWorkspace={activeWorkspace}
              aiConfig={aiConfig}
              onSaveNewTariff={handleSaveNewTariff}
              onAddDocumentOnly={handleAddDocumentOnly}
              onNavigateToTariffs={() => setCurrentView("tariffs")}
            />
          )}

          {(currentView === "locations" || currentView === "countries") && (
            <GeographyView
              activeWorkspace={activeWorkspace}
              domesticCities={domesticCities}
              internationalCountries={internationalCountries}
              onAddDomesticCity={handleAddDomesticCity}
              onAddInternationalCountry={handleAddInternationalCountry}
              onDeleteDomesticCity={handleDeleteDomesticCity}
              onDeleteInternationalCountry={handleDeleteInternationalCountry}
            />
          )}

          {currentView === "documents" && (
            <DocumentLibraryView
              activeWorkspace={activeWorkspace}
              domesticDocs={domesticDocs}
              internationalDocs={internationalDocs}
              onOpenTariffDetails={(tId) => {
                setInspectedTariffId(tId);
                setCurrentView("tariffs");
              }}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              activeWorkspace={activeWorkspace}
              history={activeWorkspace === "domestic" ? domesticHistory : internationalHistory}
              onClearHistory={handleClearHistory}
              onOpenTariffDetails={(tId) => {
                setInspectedTariffId(tId);
                setCurrentView("tariffs");
              }}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              aiConfig={aiConfig}
              onUpdateAIConfig={handleUpdateAIConfig}
              onResetDatabase={handleResetDatabase}
              onRefreshAllData={refreshAllData}
              user={user}
              onUpdateUser={(updated) => setUser(updated)}
            />
          )}
        </main>
      </div>

      {/* 3. AI Copilot Chat Drawer */}
      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        activeWorkspace={activeWorkspace}
        aiConfig={aiConfig}
        domesticTariffs={domesticTariffs}
        internationalTariffs={internationalTariffs}
        domesticPartners={domesticPartners}
        internationalPartners={internationalPartners}
        documents={activeWorkspace === "domestic" ? domesticDocs : internationalDocs}
        onNavigateToView={(v) => {
          setCurrentView(v);
          setIsCopilotOpen(false);
        }}
      />
    </div>
  );
}
