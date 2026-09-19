import {
  PartnerDomestic,
  PartnerInternational,
  TariffDomestic,
  TariffInternational,
  StoredDocument,
  CalculationHistoryRecord,
  DomesticCity,
  InternationalCountryZone,
  AIProviderConfig,
  AppUser,
  SecurityAuditRecord,
  LoginAttemptRecord,
  AdminEmailNotification,
} from "../types";

import {
  initialDomesticPartners,
  initialDomesticTariffs,
  initialDomesticDocuments,
  initialInternationalPartners,
  initialInternationalTariffs,
  initialInternationalDocuments,
  initialDomesticCities,
  initialInternationalCountries,
  initialAIConfig,
  initialUser,
  initialSecurityAuditLogs,
} from "./initialData";

const KEYS = {
  DOMESTIC_PARTNERS: "ship_asaan_domestic_partners",
  DOMESTIC_TARIFFS: "ship_asaan_domestic_tariffs",
  DOMESTIC_DOCUMENTS: "ship_asaan_domestic_documents",
  DOMESTIC_HISTORY: "ship_asaan_domestic_history",
  DOMESTIC_CITIES: "ship_asaan_domestic_cities",

  INTERNATIONAL_PARTNERS: "ship_asaan_international_partners",
  INTERNATIONAL_TARIFFS: "ship_asaan_international_tariffs",
  INTERNATIONAL_DOCUMENTS: "ship_asaan_international_documents",
  INTERNATIONAL_HISTORY: "ship_asaan_international_history",
  INTERNATIONAL_COUNTRIES: "ship_asaan_international_countries",

  AI_CONFIG: "ship_asaan_ai_config",
  USER_PROFILE: "ship_asaan_user_profile",
  USERS_LIST: "ship_asaan_users_list",
  LOGIN_ATTEMPTS: "ship_asaan_login_attempts",
  ADMIN_NOTIFICATIONS: "ship_asaan_admin_notifications",
  SECURITY_AUDIT_LOGS: "ship_asaan_security_audit_logs", // Protected key: preserved through normal data flushes
  ACTIVE_WORKSPACE: "ship_asaan_active_workspace",
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error loading key ${key} from storage:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export class LocalStorageManager {
  // -------------------------------------------------------------
  // INITIALIZATION
  // -------------------------------------------------------------
  static initializeIfEmpty(): void {
    if (!localStorage.getItem(KEYS.DOMESTIC_PARTNERS)) {
      safeSet(KEYS.DOMESTIC_PARTNERS, initialDomesticPartners);
    }
    if (!localStorage.getItem(KEYS.DOMESTIC_TARIFFS)) {
      safeSet(KEYS.DOMESTIC_TARIFFS, initialDomesticTariffs);
    }
    if (!localStorage.getItem(KEYS.DOMESTIC_DOCUMENTS)) {
      safeSet(KEYS.DOMESTIC_DOCUMENTS, initialDomesticDocuments);
    }
    if (!localStorage.getItem(KEYS.DOMESTIC_CITIES)) {
      safeSet(KEYS.DOMESTIC_CITIES, initialDomesticCities);
    }
    if (!localStorage.getItem(KEYS.DOMESTIC_HISTORY)) {
      safeSet(KEYS.DOMESTIC_HISTORY, []);
    }

    if (!localStorage.getItem(KEYS.INTERNATIONAL_PARTNERS)) {
      safeSet(KEYS.INTERNATIONAL_PARTNERS, initialInternationalPartners);
    }
    if (!localStorage.getItem(KEYS.INTERNATIONAL_TARIFFS)) {
      safeSet(KEYS.INTERNATIONAL_TARIFFS, initialInternationalTariffs);
    }
    if (!localStorage.getItem(KEYS.INTERNATIONAL_DOCUMENTS)) {
      safeSet(KEYS.INTERNATIONAL_DOCUMENTS, initialInternationalDocuments);
    }
    if (!localStorage.getItem(KEYS.INTERNATIONAL_COUNTRIES)) {
      safeSet(KEYS.INTERNATIONAL_COUNTRIES, initialInternationalCountries);
    }
    if (!localStorage.getItem(KEYS.INTERNATIONAL_HISTORY)) {
      safeSet(KEYS.INTERNATIONAL_HISTORY, []);
    }

    if (!localStorage.getItem(KEYS.AI_CONFIG)) {
      safeSet(KEYS.AI_CONFIG, initialAIConfig);
    }
    if (!localStorage.getItem(KEYS.USER_PROFILE)) {
      safeSet(KEYS.USER_PROFILE, initialUser);
    }
    if (!localStorage.getItem(KEYS.SECURITY_AUDIT_LOGS)) {
      safeSet(KEYS.SECURITY_AUDIT_LOGS, initialSecurityAuditLogs);
    }
  }

  // -------------------------------------------------------------
  // ACTIVE WORKSPACE
  // -------------------------------------------------------------
  static getActiveWorkspace(): "domestic" | "international" {
    return safeGet<"domestic" | "international">(KEYS.ACTIVE_WORKSPACE, "domestic");
  }
  static setActiveWorkspace(ws: "domestic" | "international"): void {
    safeSet(KEYS.ACTIVE_WORKSPACE, ws);
  }

  // Unified Document Helpers
  static getDocuments(workspace: "domestic" | "international"): StoredDocument[] {
    return workspace === "domestic" ? this.getDomesticDocuments() : this.getInternationalDocuments();
  }
  static saveDocuments(workspace: "domestic" | "international", docs: StoredDocument[]): void {
    if (workspace === "domestic") {
      this.setDomesticDocuments(docs);
    } else {
      this.setInternationalDocuments(docs);
    }
  }
  static addDocument(doc: StoredDocument): void {
    if (doc.workspace === "domestic") {
      const docs = this.getDomesticDocuments();
      this.setDomesticDocuments([doc, ...docs]);
    } else {
      const docs = this.getInternationalDocuments();
      this.setInternationalDocuments([doc, ...docs]);
    }
  }

  // Unified History Helpers
  static getHistory(workspace: "domestic" | "international"): CalculationHistoryRecord[] {
    return workspace === "domestic" ? this.getDomesticHistory() : this.getInternationalHistory();
  }
  static addHistoryItem(item: CalculationHistoryRecord): void {
    if (item.workspace === "domestic") {
      this.addDomesticHistory(item);
    } else {
      this.addInternationalHistory(item);
    }
  }
  static clearHistory(workspace: "domestic" | "international"): void {
    if (workspace === "domestic") {
      safeSet(KEYS.DOMESTIC_HISTORY, []);
    } else {
      safeSet(KEYS.INTERNATIONAL_HISTORY, []);
    }
  }

  // Convenience Aliases
  static saveDomesticPartners(data: PartnerDomestic[]): void {
    this.setDomesticPartners(data);
  }
  static saveInternationalPartners(data: PartnerInternational[]): void {
    this.setInternationalPartners(data);
  }
  static saveDomesticTariffs(data: TariffDomestic[]): void {
    this.setDomesticTariffs(data);
  }
  static saveInternationalTariffs(data: TariffInternational[]): void {
    this.setInternationalTariffs(data);
  }
  static saveDomesticCities(data: DomesticCity[]): void {
    this.setDomesticCities(data);
  }
  static saveInternationalCountries(data: InternationalCountryZone[]): void {
    this.setInternationalCountries(data);
  }
  static saveAIConfig(config: AIProviderConfig): void {
    this.setAIConfig(config);
  }
  static resetToSeedData(): void {
    this.resetToDefaultDataset("Admin");
  }

  // -------------------------------------------------------------
  // DOMESTIC DATA GETTERS & SETTERS
  // -------------------------------------------------------------
  static getDomesticPartners(): PartnerDomestic[] {
    return safeGet<PartnerDomestic[]>(KEYS.DOMESTIC_PARTNERS, initialDomesticPartners);
  }
  static setDomesticPartners(data: PartnerDomestic[]): void {
    safeSet(KEYS.DOMESTIC_PARTNERS, data);
  }

  static getDomesticTariffs(): TariffDomestic[] {
    return safeGet<TariffDomestic[]>(KEYS.DOMESTIC_TARIFFS, initialDomesticTariffs);
  }
  static setDomesticTariffs(data: TariffDomestic[]): void {
    safeSet(KEYS.DOMESTIC_TARIFFS, data);
  }

  static getDomesticDocuments(): StoredDocument[] {
    return safeGet<StoredDocument[]>(KEYS.DOMESTIC_DOCUMENTS, initialDomesticDocuments);
  }
  static setDomesticDocuments(data: StoredDocument[]): void {
    safeSet(KEYS.DOMESTIC_DOCUMENTS, data);
  }

  static getDomesticCities(): DomesticCity[] {
    const current = safeGet<DomesticCity[]>(KEYS.DOMESTIC_CITIES, initialDomesticCities);
    if (!current || !Array.isArray(current) || current.length < initialDomesticCities.length) {
      safeSet(KEYS.DOMESTIC_CITIES, initialDomesticCities);
      return initialDomesticCities;
    }
    return current;
  }
  static setDomesticCities(data: DomesticCity[]): void {
    safeSet(KEYS.DOMESTIC_CITIES, data);
  }

  static getDomesticHistory(): CalculationHistoryRecord[] {
    return safeGet<CalculationHistoryRecord[]>(KEYS.DOMESTIC_HISTORY, []);
  }
  static addDomesticHistory(item: CalculationHistoryRecord): void {
    const list = safeGet<CalculationHistoryRecord[]>(KEYS.DOMESTIC_HISTORY, []);
    safeSet(KEYS.DOMESTIC_HISTORY, [item, ...list].slice(0, 100)); // keep last 100
  }

  // -------------------------------------------------------------
  // INTERNATIONAL DATA GETTERS & SETTERS
  // -------------------------------------------------------------
  static getInternationalPartners(): PartnerInternational[] {
    return safeGet<PartnerInternational[]>(KEYS.INTERNATIONAL_PARTNERS, initialInternationalPartners);
  }
  static setInternationalPartners(data: PartnerInternational[]): void {
    safeSet(KEYS.INTERNATIONAL_PARTNERS, data);
  }

  static getInternationalTariffs(): TariffInternational[] {
    return safeGet<TariffInternational[]>(KEYS.INTERNATIONAL_TARIFFS, initialInternationalTariffs);
  }
  static setInternationalTariffs(data: TariffInternational[]): void {
    safeSet(KEYS.INTERNATIONAL_TARIFFS, data);
  }

  static getInternationalDocuments(): StoredDocument[] {
    return safeGet<StoredDocument[]>(KEYS.INTERNATIONAL_DOCUMENTS, initialInternationalDocuments);
  }
  static setInternationalDocuments(data: StoredDocument[]): void {
    safeSet(KEYS.INTERNATIONAL_DOCUMENTS, data);
  }

  static getInternationalCountries(): InternationalCountryZone[] {
    const current = safeGet<InternationalCountryZone[]>(KEYS.INTERNATIONAL_COUNTRIES, initialInternationalCountries);
    if (!current || !Array.isArray(current) || current.length < initialInternationalCountries.length) {
      safeSet(KEYS.INTERNATIONAL_COUNTRIES, initialInternationalCountries);
      return initialInternationalCountries;
    }
    return current;
  }
  static setInternationalCountries(data: InternationalCountryZone[]): void {
    safeSet(KEYS.INTERNATIONAL_COUNTRIES, data);
  }

  static getInternationalHistory(): CalculationHistoryRecord[] {
    return safeGet<CalculationHistoryRecord[]>(KEYS.INTERNATIONAL_HISTORY, []);
  }
  static addInternationalHistory(item: CalculationHistoryRecord): void {
    const list = safeGet<CalculationHistoryRecord[]>(KEYS.INTERNATIONAL_HISTORY, []);
    safeSet(KEYS.INTERNATIONAL_HISTORY, [item, ...list].slice(0, 100));
  }

  // -------------------------------------------------------------
  // SYSTEM & CONFIG
  // -------------------------------------------------------------
  static getAIConfig(): AIProviderConfig {
    return safeGet<AIProviderConfig>(KEYS.AI_CONFIG, initialAIConfig);
  }
  static setAIConfig(config: AIProviderConfig): void {
    safeSet(KEYS.AI_CONFIG, config);
  }

  static getUser(): AppUser {
    return safeGet<AppUser>(KEYS.USER_PROFILE, initialUser);
  }
  static setUser(user: AppUser): void {
    safeSet(KEYS.USER_PROFILE, user);
  }

  static getLoggedInUser(): AppUser | null {
    return safeGet<AppUser | null>("ship_asaan_logged_in_user", null);
  }
  static setLoggedInUser(user: AppUser | null): void {
    if (!user) {
      localStorage.removeItem("ship_asaan_logged_in_user");
    } else {
      safeSet("ship_asaan_logged_in_user", user);
    }
  }

  // -------------------------------------------------------------
  // USER ACCOUNTS & APPROVALS
  // -------------------------------------------------------------
  static getUsersList(): AppUser[] {
    return safeGet<AppUser[]>(KEYS.USERS_LIST, [initialUser]);
  }
  static saveUsersList(users: AppUser[]): void {
    safeSet(KEYS.USERS_LIST, users);
  }
  static addRegisteredUser(user: AppUser): void {
    const list = this.getUsersList();
    const existingIdx = list.findIndex(
      (u) => u.email.toLowerCase() === user.email.toLowerCase() || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (existingIdx >= 0) {
      list[existingIdx] = user;
    } else {
      list.push(user);
    }
    this.saveUsersList(list);
  }
  static updateUserStatus(userId: string, status: "active" | "pending_approval" | "rejected", approvedBy?: string): AppUser | null {
    const list = this.getUsersList();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status,
        approvedAt: status === "active" ? new Date().toISOString() : undefined,
        approvedBy: approvedBy || "System Admin",
      };
      this.saveUsersList(list);
      return list[idx];
    }
    return null;
  }

  // -------------------------------------------------------------
  // LOGIN ATTEMPTS AUDIT
  // -------------------------------------------------------------
  static getLoginAttempts(): LoginAttemptRecord[] {
    return safeGet<LoginAttemptRecord[]>(KEYS.LOGIN_ATTEMPTS, []);
  }
  static addLoginAttempt(attempt: LoginAttemptRecord): void {
    const list = this.getLoginAttempts();
    safeSet(KEYS.LOGIN_ATTEMPTS, [attempt, ...list].slice(0, 100));
  }

  // -------------------------------------------------------------
  // ADMIN NOTIFICATIONS (EMAIL DISPATCHES)
  // -------------------------------------------------------------
  static getAdminNotifications(): AdminEmailNotification[] {
    return safeGet<AdminEmailNotification[]>(KEYS.ADMIN_NOTIFICATIONS, []);
  }
  static addAdminNotification(notif: AdminEmailNotification): void {
    const list = this.getAdminNotifications();
    safeSet(KEYS.ADMIN_NOTIFICATIONS, [notif, ...list].slice(0, 50));
  }
  static markNotificationRead(id: string): void {
    const list = this.getAdminNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    safeSet(KEYS.ADMIN_NOTIFICATIONS, list);
  }

  static resetUserPassword(newPassword: string, username?: string): { success: boolean; message: string } {
    const user = this.getUser();
    user.password = newPassword;
    this.setUser(user);
    this.setLoggedInUser(user);
    this.addSecurityAuditLog({
      action: "CONFIG_UPDATE",
      user: username || user.username,
      timestamp: new Date().toISOString(),
      result: "Successful",
      details: "User password reset successfully.",
    });
    return { success: true, message: "Password updated successfully." };
  }

  static getSecurityAuditLogs(): SecurityAuditRecord[] {
    return safeGet<SecurityAuditRecord[]>(KEYS.SECURITY_AUDIT_LOGS, initialSecurityAuditLogs);
  }
  static addSecurityAuditLog(log: Omit<SecurityAuditRecord, "id">): void {
    const existing = safeGet<SecurityAuditRecord[]>(KEYS.SECURITY_AUDIT_LOGS, initialSecurityAuditLogs);
    const newRecord: SecurityAuditRecord = {
      ...log,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    safeSet(KEYS.SECURITY_AUDIT_LOGS, [newRecord, ...existing]);
  }

  // -------------------------------------------------------------
  // BACKUP & RESTORE
  // -------------------------------------------------------------
  static exportFullBackup(): string {
    const payload = {
      version: "1.0",
      app: "Ship Asaan Tariff Intelligence",
      exportedAt: new Date().toISOString(),
      domestic: {
        partners: this.getDomesticPartners(),
        tariffs: this.getDomesticTariffs(),
        documents: this.getDomesticDocuments(),
        cities: this.getDomesticCities(),
        history: this.getDomesticHistory(),
      },
      international: {
        partners: this.getInternationalPartners(),
        tariffs: this.getInternationalTariffs(),
        documents: this.getInternationalDocuments(),
        countries: this.getInternationalCountries(),
        history: this.getInternationalHistory(),
      },
      aiConfig: this.getAIConfig(),
      user: this.getUser(),
    };
    return JSON.stringify(payload, null, 2);
  }

  static importFullBackup(jsonString: string, authenticatedUser: string = "Admin"): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.app && !data.domestic && !data.international) {
        throw new Error("Invalid backup format. Missing Ship Asaan database roots.");
      }

      if (data.domestic) {
        if (data.domestic.partners) safeSet(KEYS.DOMESTIC_PARTNERS, data.domestic.partners);
        if (data.domestic.tariffs) safeSet(KEYS.DOMESTIC_TARIFFS, data.domestic.tariffs);
        if (data.domestic.documents) safeSet(KEYS.DOMESTIC_DOCUMENTS, data.domestic.documents);
        if (data.domestic.cities) safeSet(KEYS.DOMESTIC_CITIES, data.domestic.cities);
        if (data.domestic.history) safeSet(KEYS.DOMESTIC_HISTORY, data.domestic.history);
      }

      if (data.international) {
        if (data.international.partners) safeSet(KEYS.INTERNATIONAL_PARTNERS, data.international.partners);
        if (data.international.tariffs) safeSet(KEYS.INTERNATIONAL_TARIFFS, data.international.tariffs);
        if (data.international.documents) safeSet(KEYS.INTERNATIONAL_DOCUMENTS, data.international.documents);
        if (data.international.countries) safeSet(KEYS.INTERNATIONAL_COUNTRIES, data.international.countries);
        if (data.international.history) safeSet(KEYS.INTERNATIONAL_HISTORY, data.international.history);
      }

      if (data.aiConfig) safeSet(KEYS.AI_CONFIG, data.aiConfig);

      this.addSecurityAuditLog({
        action: "BACKUP_RESTORE",
        user: authenticatedUser,
        timestamp: new Date().toISOString(),
        result: "Successful",
        details: `Restored database backup generated at ${data.exportedAt || "unknown"}.`,
      });

      return { success: true, message: "Database successfully restored from backup file." };
    } catch (err: any) {
      this.addSecurityAuditLog({
        action: "BACKUP_RESTORE",
        user: authenticatedUser,
        timestamp: new Date().toISOString(),
        result: "Failed",
        details: `Restore failed: ${err.message}`,
      });
      return { success: false, message: err.message || "Failed to restore backup" };
    }
  }

  // -------------------------------------------------------------
  // COMPLETE DATA FLUSH / "DELETE ALL DATA" (PROTECTED)
  // -------------------------------------------------------------
  static executeCompleteDataFlush(
    authenticatedUser: string
  ): { success: boolean; message: string } {
    try {
      // 1. Audit record MUST be recorded in the protected security log BEFORE and AFTER flush
      this.addSecurityAuditLog({
        action: "DELETE_ALL_DATA",
        user: authenticatedUser,
        timestamp: new Date().toISOString(),
        result: "Successful",
        details: `Irreversible Complete Data Flush executed by user ${authenticatedUser}. All domestic & international tariffs, partners, documents, and history wiped.`,
      });

      // 2. Clear all operational data partitions
      safeSet(KEYS.DOMESTIC_PARTNERS, []);
      safeSet(KEYS.DOMESTIC_TARIFFS, []);
      safeSet(KEYS.DOMESTIC_DOCUMENTS, []);
      safeSet(KEYS.DOMESTIC_HISTORY, []);

      safeSet(KEYS.INTERNATIONAL_PARTNERS, []);
      safeSet(KEYS.INTERNATIONAL_TARIFFS, []);
      safeSet(KEYS.INTERNATIONAL_DOCUMENTS, []);
      safeSet(KEYS.INTERNATIONAL_HISTORY, []);

      return {
        success: true,
        message: "All operational data (tariffs, partners, documents, calculations) has been permanently flushed. Security audit record preserved.",
      };
    } catch (err: any) {
      this.addSecurityAuditLog({
        action: "DELETE_ALL_DATA",
        user: authenticatedUser,
        timestamp: new Date().toISOString(),
        result: "Failed",
        details: `Data flush error: ${err.message}`,
      });
      return { success: false, message: err.message || "Data flush failed" };
    }
  }

  // Reset database to initial sample dataset
  static resetToDefaultDataset(authenticatedUser: string): void {
    safeSet(KEYS.DOMESTIC_PARTNERS, initialDomesticPartners);
    safeSet(KEYS.DOMESTIC_TARIFFS, initialDomesticTariffs);
    safeSet(KEYS.DOMESTIC_DOCUMENTS, initialDomesticDocuments);
    safeSet(KEYS.DOMESTIC_CITIES, initialDomesticCities);
    safeSet(KEYS.DOMESTIC_HISTORY, []);

    safeSet(KEYS.INTERNATIONAL_PARTNERS, initialInternationalPartners);
    safeSet(KEYS.INTERNATIONAL_TARIFFS, initialInternationalTariffs);
    safeSet(KEYS.INTERNATIONAL_DOCUMENTS, initialInternationalDocuments);
    safeSet(KEYS.INTERNATIONAL_COUNTRIES, initialInternationalCountries);
    safeSet(KEYS.INTERNATIONAL_HISTORY, []);

    this.addSecurityAuditLog({
      action: "CONFIG_UPDATE",
      user: authenticatedUser,
      timestamp: new Date().toISOString(),
      result: "Successful",
      details: "Database reset to standard Ship Asaan verified sample tariffs.",
    });
  }
}
