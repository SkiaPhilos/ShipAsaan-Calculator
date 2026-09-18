import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  TariffDomestic,
  TariffInternational,
  StoredDocument,
  CalculationHistoryRecord,
  PartnerDomestic,
  PartnerInternational,
  WorkspaceType,
} from "../types";
import {
  initialDomesticPartners,
  initialDomesticTariffs,
  initialDomesticDocuments,
  initialInternationalPartners,
  initialInternationalTariffs,
  initialInternationalDocuments,
} from "./initialData";

const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDuT98Y7I4tFMmvGhHx1HXnjet2VNCZMCc",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "shipasaan-calculator.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "shipasaan-calculator",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "shipasaan-calculator.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "118098123560",
  appId: env.VITE_FIREBASE_APP_ID || "1:118098123560:web:131b232effc7ce70ca0e1d",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-VFEDBNVXH8",
};

// Initialize Firebase App instance singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Firestore Collection Names
export const COLLECTIONS = {
  DOMESTIC_TARIFFS: "tariffs_domestic",
  INTERNATIONAL_TARIFFS: "tariffs_international",
  DOCUMENTS: "documents",
  CALCULATION_HISTORY: "calculation_history",
  DOMESTIC_PARTNERS: "partners_domestic",
  INTERNATIONAL_PARTNERS: "partners_international",
  BRAND_ASSETS: "brand_assets",
};

/**
 * Strips undefined properties recursively so Firestore does not reject writes.
 * Also trims massive base64 previews that exceed Firestore's 1MB document limit.
 */
export function sanitizeForFirestore<T>(data: T): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val === undefined) continue;

      // Guard against huge base64 in dataUrl exceeding 700KB
      if (key === "dataUrl" && typeof val === "string" && val.length > 700000) {
        cleaned[key] = ""; // Keep document metadata without exceeding 1MB limit
        continue;
      }

      cleaned[key] = sanitizeForFirestore(val);
    }
    return cleaned;
  }
  return data;
}

// =========================================================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// =========================================================================

/**
 * Subscribes to all domestic tariffs in real-time.
 * Callback triggers instantly with initial cloud state and on every remote change.
 */
export function subscribeDomesticTariffs(
  onUpdate: (tariffs: TariffDomestic[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.DOMESTIC_TARIFFS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TariffDomestic[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as TariffDomestic);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("Firestore domestic tariffs subscription notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to all international tariffs in real-time.
 */
export function subscribeInternationalTariffs(
  onUpdate: (tariffs: TariffInternational[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.INTERNATIONAL_TARIFFS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TariffInternational[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as TariffInternational);
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("Firestore international tariffs subscription notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to documents in real-time.
 */
export function subscribeDocuments(
  workspace: WorkspaceType,
  onUpdate: (docs: StoredDocument[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.DOCUMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: StoredDocument[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as StoredDocument;
        if (item.workspace === workspace) {
          list.push(item);
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn("Firestore documents subscription notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to calculation history in real-time.
 */
export function subscribeCalculationHistory(
  workspace: WorkspaceType,
  onUpdate: (history: CalculationHistoryRecord[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, COLLECTIONS.CALCULATION_HISTORY);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CalculationHistoryRecord[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as CalculationHistoryRecord;
        if (item.workspace === workspace) {
          list.push(item);
        }
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(list);
    },
    (err) => {
      console.warn("Firestore history subscription notice:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes to partners in real-time.
 */
export function subscribePartners(
  workspace: WorkspaceType,
  onUpdate: (partners: any[]) => void,
  onError?: (error: Error) => void
) {
  const colName =
    workspace === "domestic"
      ? COLLECTIONS.DOMESTIC_PARTNERS
      : COLLECTIONS.INTERNATIONAL_PARTNERS;
  const colRef = collection(db, colName);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      onUpdate(list);
    },
    (err) => {
      console.warn(`Firestore ${colName} subscription notice:`, err);
      if (onError) onError(err);
    }
  );
}

// =========================================================================
// CLOUD WRITES & MUTATIONS
// =========================================================================

export async function saveDomesticTariffToFirestore(tariff: TariffDomestic): Promise<void> {
  const docRef = doc(db, COLLECTIONS.DOMESTIC_TARIFFS, tariff.id);
  await setDoc(docRef, sanitizeForFirestore(tariff), { merge: true });
}

export async function deleteDomesticTariffFromFirestore(tariffId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.DOMESTIC_TARIFFS, tariffId);
  await deleteDoc(docRef);
}

export async function saveInternationalTariffToFirestore(
  tariff: TariffInternational
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.INTERNATIONAL_TARIFFS, tariff.id);
  await setDoc(docRef, sanitizeForFirestore(tariff), { merge: true });
}

export async function deleteInternationalTariffFromFirestore(tariffId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.INTERNATIONAL_TARIFFS, tariffId);
  await deleteDoc(docRef);
}

export async function saveDocumentToFirestore(document: StoredDocument): Promise<void> {
  const docRef = doc(db, COLLECTIONS.DOCUMENTS, document.id);
  await setDoc(docRef, sanitizeForFirestore(document), { merge: true });
}

export async function deleteDocumentFromFirestore(docId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.DOCUMENTS, docId);
  await deleteDoc(docRef);
}

export async function saveHistoryRecordToFirestore(
  record: CalculationHistoryRecord
): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CALCULATION_HISTORY, record.id);
  await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
}

export async function savePartnerToFirestore(
  partner: PartnerDomestic | PartnerInternational,
  workspace: WorkspaceType
): Promise<void> {
  const colName =
    workspace === "domestic"
      ? COLLECTIONS.DOMESTIC_PARTNERS
      : COLLECTIONS.INTERNATIONAL_PARTNERS;
  const docRef = doc(db, colName, partner.id);
  await setDoc(docRef, sanitizeForFirestore(partner), { merge: true });
}

export async function deletePartnerFromFirestore(
  partnerId: string,
  workspace: WorkspaceType
): Promise<void> {
  const colName =
    workspace === "domestic"
      ? COLLECTIONS.DOMESTIC_PARTNERS
      : COLLECTIONS.INTERNATIONAL_PARTNERS;
  const docRef = doc(db, colName, partnerId);
  await deleteDoc(docRef);
}

export async function saveBrandLogoToFirestore(dataUrl: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BRAND_ASSETS, "workspace_logo");
  await setDoc(docRef, { dataUrl, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function getBrandLogoFromFirestore(): Promise<string | null> {
  try {
    const docRef = doc(db, COLLECTIONS.BRAND_ASSETS, "workspace_logo");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data()?.dataUrl || null;
    }
    return null;
  } catch (err) {
    console.warn("Firestore logo fetch error:", err);
    return null;
  }
}

export async function removeBrandLogoFromFirestore(): Promise<void> {
  const docRef = doc(db, COLLECTIONS.BRAND_ASSETS, "workspace_logo");
  await deleteDoc(docRef);
}

// =========================================================================
// AUTO SEEDING FOR NEW DATABASE
// =========================================================================

let seedingAttempted = false;

/**
 * Checks if the remote Firestore database is empty.
 * If empty, seeds the master tariffs, partners, and reference documents
 * so that any user opening the URL immediately has full rate cards!
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  if (seedingAttempted) return;
  seedingAttempted = true;

  try {
    const domTariffsSnap = await getDocs(
      query(collection(db, COLLECTIONS.DOMESTIC_TARIFFS), limit(1))
    );

    if (domTariffsSnap.empty) {
      console.log("Firestore database is empty. Initializing master tariffs and partners...");
      const batch = writeBatch(db);

      // Seed domestic tariffs
      initialDomesticTariffs.forEach((tariff) => {
        const dRef = doc(db, COLLECTIONS.DOMESTIC_TARIFFS, tariff.id);
        batch.set(dRef, sanitizeForFirestore(tariff));
      });

      // Seed international tariffs
      initialInternationalTariffs.forEach((tariff) => {
        const dRef = doc(db, COLLECTIONS.INTERNATIONAL_TARIFFS, tariff.id);
        batch.set(dRef, sanitizeForFirestore(tariff));
      });

      // Seed domestic partners
      initialDomesticPartners.forEach((p) => {
        const dRef = doc(db, COLLECTIONS.DOMESTIC_PARTNERS, p.id);
        batch.set(dRef, sanitizeForFirestore(p));
      });

      // Seed international partners
      initialInternationalPartners.forEach((p) => {
        const dRef = doc(db, COLLECTIONS.INTERNATIONAL_PARTNERS, p.id);
        batch.set(dRef, sanitizeForFirestore(p));
      });

      // Seed initial sample documents
      initialDomesticDocuments.forEach((docItem) => {
        const dRef = doc(db, COLLECTIONS.DOCUMENTS, docItem.id);
        batch.set(dRef, sanitizeForFirestore(docItem));
      });

      initialInternationalDocuments.forEach((docItem) => {
        const dRef = doc(db, COLLECTIONS.DOCUMENTS, docItem.id);
        batch.set(dRef, sanitizeForFirestore(docItem));
      });

      await batch.commit();
      console.log("Firestore initial master seed completed successfully!");
    }
  } catch (err) {
    console.warn("Firestore seed check notice:", err);
  }
}
