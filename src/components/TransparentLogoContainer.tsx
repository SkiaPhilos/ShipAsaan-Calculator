import React, { useState, useEffect } from "react";
import { LogoStorageManager } from "../utils/logoStorage";

// Standard file paths where a static logo may exist in /public
const CANDIDATE_IMAGE_PATHS = [
  "/Ship Asaan Logo with Transparent Background.png",
  "/Ship%20Asaan%20Logo%20with%20Transparent%20Background.png",
  "/ship-asaan-logo.png",
  "/logo.png",
];

interface TransparentLogoContainerProps {
  className?: string;
  onLogoStateChange?: (hasLogo: boolean) => void;
}

export const TransparentLogoContainer: React.FC<TransparentLogoContainerProps> = ({
  className = "",
  onLogoStateChange,
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Load logo from IndexedDB or candidate paths
  const loadLogo = async () => {
    try {
      const stored = await LogoStorageManager.getLogo();
      if (stored) {
        setLogoSrc(stored);
        setIsLoaded(true);
        setHasCheckedStorage(true);
        onLogoStateChange?.(true);
        return;
      }
    } catch (err) {
      console.warn("Error reading stored logo:", err);
    }

    // Try first candidate path
    setPathIndex(0);
    setLogoSrc(CANDIDATE_IMAGE_PATHS[0]);
    setHasCheckedStorage(true);
  };

  useEffect(() => {
    loadLogo();

    const handleLogoChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ dataUrl?: string | null }>;
      if (customEvent.detail && customEvent.detail.dataUrl) {
        setLogoSrc(customEvent.detail.dataUrl);
        setIsLoaded(true);
        onLogoStateChange?.(true);
      } else if (customEvent.detail && customEvent.detail.dataUrl === null) {
        // Logo was removed in Settings
        setLogoSrc(null);
        setIsLoaded(false);
        onLogoStateChange?.(false);
      } else {
        loadLogo();
      }
    };

    window.addEventListener("ship_asaan_logo_changed", handleLogoChanged);
    return () => {
      window.removeEventListener("ship_asaan_logo_changed", handleLogoChanged);
    };
  }, []);

  const handleImageError = () => {
    // If currently trying candidate paths in /public
    if (pathIndex + 1 < CANDIDATE_IMAGE_PATHS.length && logoSrc?.startsWith("/")) {
      const nextIdx = pathIndex + 1;
      setPathIndex(nextIdx);
      setLogoSrc(CANDIDATE_IMAGE_PATHS[nextIdx]);
    } else {
      // No valid logo found or all candidates failed
      setLogoSrc(null);
      setIsLoaded(false);
      onLogoStateChange?.(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLogoStateChange?.(true);
  };

  if (!hasCheckedStorage || !logoSrc) {
    return null;
  }

  return (
    <div
      id="header-brand-logo"
      className={`relative flex items-center justify-center bg-transparent shrink-0 ${className} ${
        !isLoaded ? "hidden" : ""
      }`}
    >
      <img
        src={logoSrc}
        alt="Ship Asaan Logo"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className="h-9 sm:h-11 w-auto max-w-[220px] object-contain bg-transparent select-none drop-shadow-2xs"
      />
    </div>
  );
};
