import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, Globe, X } from "lucide-react";
import { InternationalCountryZone } from "../types";

interface CountrySearchSelectProps {
  id?: string;
  countries: InternationalCountryZone[];
  selectedCountry: string;
  onSelectCountry: (countryName: string) => void;
}

export const CountrySearchSelect: React.FC<CountrySearchSelectProps> = ({
  id = "country-search-select",
  countries,
  selectedCountry,
  onSelectCountry,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Find currently selected country object
  const currentSelected = useMemo(() => {
    const q = selectedCountry.trim().toLowerCase();
    return (
      countries.find(
        (c) =>
          c.countryName.toLowerCase() === q ||
          c.countryCode.toLowerCase() === q ||
          c.alpha3?.toLowerCase() === q ||
          c.numericCode === q
      ) || null
    );
  }, [selectedCountry, countries]);

  // Background matching by Country Name, Alpha-2, Alpha-3, Numeric code, or Aliases
  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      // Sort alphabetically
      return [...countries].sort((a, b) => a.countryName.localeCompare(b.countryName));
    }

    return countries
      .filter((c) => {
        const nameMatch = c.countryName.toLowerCase().includes(query);
        const codeMatch = c.countryCode.toLowerCase().includes(query);
        const alpha3Match = c.alpha3 ? c.alpha3.toLowerCase().includes(query) : false;
        const numericMatch = c.numericCode ? c.numericCode.toLowerCase().includes(query) : false;
        const aliasMatch = c.aliases
          ? c.aliases.some((a) => a.toLowerCase().includes(query))
          : false;
        const regionMatch = c.region ? c.region.toLowerCase().includes(query) : false;

        return nameMatch || codeMatch || alpha3Match || numericMatch || aliasMatch || regionMatch;
      })
      .sort((a, b) => {
        // Prioritize exact name prefix match
        const aStarts = a.countryName.toLowerCase().startsWith(query);
        const bStarts = b.countryName.toLowerCase().startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.countryName.localeCompare(b.countryName);
      });
  }, [countries, searchQuery]);

  const handleSelect = (countryName: string) => {
    onSelectCountry(countryName);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div id={id} ref={containerRef} className="relative w-full">
      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs bg-stone-50 border rounded-lg px-3 py-2.5 text-stone-800 transition-all ${
          isOpen
            ? "border-purple-600 ring-2 ring-purple-100 bg-white"
            : "border-stone-300 hover:border-stone-400"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-semibold text-stone-900 truncate">
            {currentSelected ? currentSelected.countryName : selectedCountry || "Select Country..."}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {currentSelected && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-mono">
              {currentSelected.defaultZone}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-purple-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu with Search Bar & Scrollable Country List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Integrated Search Input */}
          <div className="p-2 border-b border-stone-100 bg-stone-50/80">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by country name, US, USA, 840..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  } else if (e.key === "Enter" && filteredCountries.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredCountries[0].countryName);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Country List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-stone-50 py-1 text-xs">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-stone-400">
                No matching country found for <span className="font-mono">"{searchQuery}"</span>
              </div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected =
                  currentSelected?.countryName.toLowerCase() === c.countryName.toLowerCase();
                return (
                  <button
                    key={c.countryCode}
                    type="button"
                    onClick={() => handleSelect(c.countryName)}
                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-purple-50 text-purple-950 font-bold"
                        : "hover:bg-stone-50 text-stone-800"
                    }`}
                  >
                    <span className="truncate pr-2">{c.countryName}</span>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {c.defaultZone}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-700" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
