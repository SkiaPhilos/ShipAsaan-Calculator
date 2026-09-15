import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, MapPin, X, Building2 } from "lucide-react";
import { DomesticCity } from "../types";

interface CitySearchSelectProps {
  id?: string;
  label?: string;
  cities: DomesticCity[];
  selectedCityName: string;
  onSelectCity: (cityName: string) => void;
  placeholder?: string;
  helperText?: string;
}

const FREQUENT_HUBS = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
];

export const CitySearchSelect: React.FC<CitySearchSelectProps> = ({
  id = "city-search-select",
  label,
  cities,
  selectedCityName,
  onSelectCity,
  placeholder = "Search 900+ cities, codes (e.g. LHE, KHI)...",
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 40);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Current selected city object
  const currentCity = useMemo(() => {
    const q = selectedCityName.trim().toLowerCase();
    return (
      cities.find(
        (c) =>
          c.name.toLowerCase() === q ||
          (c.deliveryCode && c.deliveryCode.toLowerCase() === q)
      ) || null
    );
  }, [selectedCityName, cities]);

  // High-performance search filter (searches across name, delivery code, province, zone tier, area group)
  const filteredCities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Return top popular hubs first, then others
      return cities.slice(0, 45);
    }

    const matches = cities.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(query);
      const codeMatch = c.deliveryCode ? c.deliveryCode.toLowerCase().includes(query) : false;
      const provinceMatch = c.province.toLowerCase().includes(query);
      const tierMatch = c.zoneTier.toLowerCase().includes(query);
      const areaMatch = c.areaGroup ? c.areaGroup.toLowerCase().includes(query) : false;

      return nameMatch || codeMatch || provinceMatch || tierMatch || areaMatch;
    });

    // Sort exact prefix matches first
    matches.sort((a, b) => {
      const aCode = a.deliveryCode ? a.deliveryCode.toLowerCase() === query : false;
      const bCode = b.deliveryCode ? b.deliveryCode.toLowerCase() === query : false;
      if (aCode && !bCode) return -1;
      if (!aCode && bCode) return 1;

      const aStarts = a.name.toLowerCase().startsWith(query);
      const bStarts = b.name.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Hubs prioritized
      if (a.isHub && !b.isHub) return -1;
      if (!a.isHub && b.isHub) return 1;

      return a.name.localeCompare(b.name);
    });

    return matches.slice(0, 50); // Cap at 50 for optimal 60fps rendering
  }, [cities, searchQuery]);

  const handleSelect = (city: DomesticCity) => {
    onSelectCity(city.name);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredCities.length - 1 ? prev + 1 : prev));
      scrollHighlightedIntoView(highlightedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollHighlightedIntoView(highlightedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCities[highlightedIndex]) {
        handleSelect(filteredCities[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listContainerRef.current) return;
    const items = listContainerRef.current.querySelectorAll<HTMLButtonElement>("[data-city-item]");
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  };

  return (
    <div id={id} ref={containerRef} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-stone-700">{label}</label>
          {helperText && <span className="text-[10px] text-stone-400 font-medium">{helperText}</span>}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs bg-stone-50 border rounded-lg transition-all text-left ${
          isOpen
            ? "border-purple-600 ring-2 ring-purple-100 bg-white shadow-2xs"
            : "border-stone-300 hover:border-stone-400 text-stone-800"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate flex-1">
          <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          {currentCity ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-stone-900 truncate">{currentCity.name}</span>
              {currentCity.deliveryCode && (
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                  {currentCity.deliveryCode}
                </span>
              )}
              <span className="text-[10px] text-stone-400">
                ({currentCity.province} • {currentCity.zoneTier})
              </span>
            </div>
          ) : (
            <span className="text-stone-400 font-normal">{selectedCityName || "Select City..."}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform ${
              isOpen ? "rotate-180 text-purple-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full text-xs bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-stone-200 rounded text-stone-400 hover:text-stone-600 transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Hub Filter Bar */}
          <div className="px-2 py-1.5 bg-stone-100/60 border-b border-stone-100 flex items-center gap-1 overflow-x-auto text-[10px]">
            <span className="text-stone-400 font-semibold uppercase text-[9px] shrink-0 mr-1">
              Quick:
            </span>
            {FREQUENT_HUBS.map((hub) => (
              <button
                key={hub}
                type="button"
                onClick={() => setSearchQuery(hub)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                  selectedCityName === hub
                    ? "bg-purple-600 text-white font-bold"
                    : "bg-white text-stone-600 hover:bg-purple-50 hover:text-purple-700 border border-stone-200"
                }`}
              >
                {hub}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div
            ref={listContainerRef}
            className="max-h-60 overflow-y-auto divide-y divide-stone-50 p-1"
            role="listbox"
          >
            {filteredCities.length === 0 ? (
              <div className="p-4 text-center text-stone-400 text-xs">
                No matching cities found for &ldquo;{searchQuery}&rdquo;.
                <p className="text-[10px] text-stone-400 mt-1">
                  Try checking city spelling or district name.
                </p>
              </div>
            ) : (
              filteredCities.map((city, index) => {
                const isSelected = city.name.toLowerCase() === selectedCityName.toLowerCase();
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={city.id}
                    type="button"
                    data-city-item
                    onClick={() => handleSelect(city)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-left rounded-lg transition-colors text-xs ${
                      isSelected
                        ? "bg-purple-50 text-purple-900 font-semibold"
                        : isHighlighted
                        ? "bg-stone-100 text-stone-900"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      ) : city.isHub ? (
                        <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-stone-900">{city.name}</span>
                          {city.deliveryCode && (
                            <span className="font-mono text-[9px] font-bold px-1 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                              {city.deliveryCode}
                            </span>
                          )}
                          {city.isHub && (
                            <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800">
                              Hub
                            </span>
                          )}
                        </div>
                        {city.areaGroup && (
                          <p className="text-[10px] text-stone-400 truncate">{city.areaGroup}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-right">
                      <span className="text-[10px] font-medium text-stone-500">
                        {city.province}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          city.zoneTier === "Major City"
                            ? "bg-emerald-50 text-emerald-700"
                            : city.zoneTier === "Remote Area"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {city.zoneTier}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
            <span>{cities.length} domestic stations loaded</span>
            <span>Use ↑↓ arrows & Enter</span>
          </div>
        </div>
      )}
    </div>
  );
};
