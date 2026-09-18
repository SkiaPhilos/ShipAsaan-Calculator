// Robust cloud-synced brand logo storage backed by Firebase Firestore with IndexedDB caching
// Supports high-resolution transparent PNG, JPG/JPEG, SVG, and ICO files across all team members and devices.
import {
  saveBrandLogoToFirestore,
  getBrandLogoFromFirestore,
  removeBrandLogoFromFirestore,
} from "../db/firebase";

const DB_NAME = "ShipAsaanDB";
const DB_VERSION = 1;
const STORE_NAME = "brand_assets";
const LOGO_KEY = "ship_asaan_brand_logo";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".svg", ".ico"];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Optimizes large raster images (PNG, JPG) to a maximum dimension of 2400px
 * while preserving high fidelity, transparency (PNG), and aspect ratio.
 * Vector SVGs and ICO files are untouched.
 */
async function processImageFile(file: File): Promise<string> {
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  const isIco =
    file.type.includes("icon") || file.name.toLowerCase().endsWith(".ico");

  if (isSvg || isIco) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read vector/icon file"));
      reader.readAsDataURL(file);
    });
  }

  // Raster image (PNG, JPG)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 2400;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        // Draw with alpha channel preserved for PNG transparency
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
        const optimized = canvas.toDataURL(mime, 0.95);
        resolve(optimized);
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export class LogoStorageManager {
  /**
   * Validate if file matches allowed extensions and mime types
   */
  static isAllowedFileType(file: File): boolean {
    const nameLower = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTENSIONS.some((ext) => nameLower.endsWith(ext));
    const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    return hasAllowedExt || hasAllowedMime;
  }

  /**
   * Get the saved logo data URL:
   * First checks local IndexedDB cache for instant display.
   * Asynchronously or on cache miss, fetches latest logo from Firestore.
   */
  static async getLogo(): Promise<string | null> {
    // 1. Try local IndexedDB cache first for zero-latency load
    let cachedLogo: string | null = null;
    try {
      const db = await openDB();
      cachedLogo = await new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(LOGO_KEY);
        req.onsuccess = () => {
          if (req.result) {
            resolve(req.result as string);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (err) {
      console.warn("Could not read local logo cache:", err);
    }

    // 2. Fetch from Firebase Firestore for cross-device synchronization
    try {
      const remoteLogo = await getBrandLogoFromFirestore();
      if (remoteLogo) {
        // If remote logo is different or new, update local cache
        if (remoteLogo !== cachedLogo) {
          try {
            const db = await openDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).put(remoteLogo, LOGO_KEY);
          } catch (_) {}
          // Notify components if changed
          if (cachedLogo && remoteLogo !== cachedLogo) {
            window.dispatchEvent(
              new CustomEvent("ship_asaan_logo_changed", { detail: { dataUrl: remoteLogo } })
            );
          }
        }
        return remoteLogo;
      }
    } catch (err) {
      console.warn("Could not fetch remote logo from Firestore:", err);
    }

    return cachedLogo;
  }

  /**
   * Save a newly uploaded logo file into both IndexedDB and Firestore
   */
  static async saveLogo(
    file: File
  ): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    if (!this.isAllowedFileType(file)) {
      return {
        success: false,
        error: "Unsupported file format. Please upload a PNG, JPG, JPEG, SVG, or ICO file.",
      };
    }

    try {
      const processedDataUrl = await processImageFile(file);
      const db = await openDB();

      // 1. Cache locally in IndexedDB
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(processedDataUrl, LOGO_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      // Clear legacy localStorage to prevent quota bloat
      try {
        localStorage.removeItem("ship_asaan_logo");
      } catch (_) {}

      // 2. Synchronize to Firestore for all users/computers
      try {
        await saveBrandLogoToFirestore(processedDataUrl);
      } catch (cloudErr: any) {
        console.warn("Warning: Logo saved locally but Firestore sync failed:", cloudErr);
      }

      // Broadcast update event to all components
      window.dispatchEvent(
        new CustomEvent("ship_asaan_logo_changed", { detail: { dataUrl: processedDataUrl } })
      );

      return { success: true, dataUrl: processedDataUrl };
    } catch (err: any) {
      console.error("Error saving brand logo:", err);
      return {
        success: false,
        error: err.message || "Failed to save logo. Please try a different image.",
      };
    }
  }

  /**
   * Remove custom logo and restore default typography branding across all devices
   */
  static async removeLogo(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(LOGO_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      try {
        localStorage.removeItem("ship_asaan_logo");
      } catch (_) {}

      // Delete from Firestore
      try {
        await removeBrandLogoFromFirestore();
      } catch (cloudErr) {
        console.warn("Failed to remove logo from Firestore:", cloudErr);
      }

      window.dispatchEvent(
        new CustomEvent("ship_asaan_logo_changed", { detail: { dataUrl: null } })
      );
    } catch (err) {
      console.error("Error removing logo:", err);
    }
  }
}
