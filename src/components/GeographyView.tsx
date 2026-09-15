import React, { useState } from "react";
import {
  MapPin,
  Globe2,
  Plus,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  Info,
  Trash2,
} from "lucide-react";
import {
  WorkspaceType,
  DomesticCity,
  InternationalCountryZone,
} from "../types";

interface GeographyViewProps {
  activeWorkspace: WorkspaceType;
  domesticCities: DomesticCity[];
  internationalCountries: InternationalCountryZone[];
  onAddDomesticCity: (city: DomesticCity) => void;
  onAddInternationalCountry: (country: InternationalCountryZone) => void;
  onDeleteDomesticCity?: (cityId: string) => void;
  onDeleteInternationalCountry?: (countryCode: string) => void;
}

export const GeographyView: React.FC<GeographyViewProps> = ({
  activeWorkspace,
  domesticCities,
  internationalCountries,
  onAddDomesticCity,
  onAddInternationalCountry,
  onDeleteDomesticCity,
  onDeleteInternationalCountry,
}) => {
  const isDomestic = activeWorkspace === "domestic";
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);

  // New item states
  const [cityName, setCityName] = useState("");
  const [province, setProvince] = useState("Sindh");
  const [zoneTier, setZoneTier] = useState<"Major City" | "Secondary City" | "Remote Area">("Major City");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [areaGroup, setAreaGroup] = useState("");

  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [alpha3, setAlpha3] = useState("");
  const [numericCode, setNumericCode] = useState("");
  const [region, setRegion] = useState("Middle East");
  const [defaultZone, setDefaultZone] = useState("Zone 1");
  const [isRemote, setIsRemote] = useState(false);

  const filteredDomestic = domesticCities.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(q) ||
      (c.deliveryCode && c.deliveryCode.toLowerCase().includes(q)) ||
      (c.areaGroup && c.areaGroup.toLowerCase().includes(q)) ||
      (c.tehsilDistrict && c.tehsilDistrict.toLowerCase().includes(q)) ||
      c.province.toLowerCase().includes(q);
    const matchProvince = provinceFilter === "all" || c.province === provinceFilter;
    return matchSearch && matchProvince;
  });

  const filteredIntl = internationalCountries.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      c.countryName.toLowerCase().includes(q) ||
      c.countryCode.toLowerCase().includes(q) ||
      (c.alpha3 && c.alpha3.toLowerCase().includes(q)) ||
      (c.numericCode && c.numericCode.toLowerCase().includes(q)) ||
      (c.region && c.region.toLowerCase().includes(q)) ||
      c.aliases?.some((a) => a.toLowerCase().includes(q));
    const matchZone = zoneFilter === "all" || c.defaultZone === zoneFilter;
    return matchSearch && matchZone;
  });

  const handleAddDomestic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityName) return;
    onAddDomesticCity({
      id: `city-${Date.now()}`,
      name: cityName,
      province,
      zoneTier,
      isHub: zoneTier === "Major City",
      deliveryCode: deliveryCode.trim().toUpperCase() || undefined,
      areaGroup: areaGroup.trim() || undefined,
    });
    setShowAddModal(false);
    setCityName("");
    setDeliveryCode("");
    setAreaGroup("");
  };

  const handleAddIntl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !countryCode) return;
    onAddInternationalCountry({
      countryCode: countryCode.toUpperCase(),
      countryName,
      alpha3: alpha3.trim().toUpperCase() || undefined,
      numericCode: numericCode.trim() || undefined,
      region,
      defaultZone,
      isRemoteDefault: isRemote,
    });
    setShowAddModal(false);
    setCountryName("");
    setCountryCode("");
    setAlpha3("");
    setNumericCode("");
  };

  return (
    <div id="geography-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Locations & Provincial Sectors" : "International Global Destinations"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              {isDomestic ? `${domesticCities.length} Cities Configured` : `${internationalCountries.length} Global Destinations`}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isDomestic
              ? "Controls sector routing classification: Within City, Same Province, or Different Province."
              : "Direct country-to-carrier tariff mapping enables automatic calculation by destination country without requiring users to select zones."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-2xs flex items-center gap-1.5 transition-colors ${
            isDomestic ? "bg-purple-900 text-lime-300 hover:bg-purple-800" : "bg-purple-900 text-orange-400 hover:bg-purple-800"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isDomestic ? "Add City / Hub" : "Add Country Zone"}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isDomestic ? "Search city or province..." : "Search country or ISO code..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
          />
        </div>

        {isDomestic ? (
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
          >
            <option value="all">All Provinces</option>
            <option value="Sindh">Sindh</option>
            <option value="Punjab">Punjab</option>
            <option value="Khyber Pakhtunkhwa">KPK</option>
            <option value="Balochistan">Balochistan</option>
            <option value="Federal Capital">Islamabad / ICT</option>
            <option value="Azad Kashmir">AJK</option>
            <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
          </select>
        ) : (
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
          >
            <option value="all">All Zones</option>
            {["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"].map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Grid Display */}
      {isDomestic ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredDomestic.map((city) => (
            <div
              key={city.id}
              className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs space-y-2 hover:border-purple-300 transition-colors group relative"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 pr-1">
                  <p className="text-xs font-bold text-stone-900 leading-snug">{city.name}</p>
                  {city.areaGroup && (
                    <p className="text-[10px] text-stone-500 font-medium">{city.areaGroup}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {city.deliveryCode && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-stone-100 text-stone-700">
                      {city.deliveryCode}
                    </span>
                  )}
                  {city.isHub && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900">
                      Hub
                    </span>
                  )}
                  {onDeleteDomesticCity && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove location "${city.name}" from domestic network?`)) {
                          onDeleteDomesticCity(city.id);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title={`Remove ${city.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                <span>{city.province}</span>
                <span className="font-medium text-stone-600 text-[10px]">{city.zoneTier}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredIntl.map((country) => (
            <div
              key={country.countryCode}
              className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs space-y-2 hover:border-orange-300 transition-colors group relative"
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-xs font-black text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                      {country.countryCode}
                    </span>
                    {country.alpha3 && (
                      <span className="font-mono text-[10px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded">
                        {country.alpha3}
                      </span>
                    )}
                    {country.numericCode && (
                      <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1 py-0.5 rounded">
                        #{country.numericCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-stone-900">{country.countryName}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-900 font-mono">
                    {country.defaultZone}
                  </span>
                  {onDeleteInternationalCountry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove country "${country.countryName}" (${country.countryCode})?`)) {
                          onDeleteInternationalCountry(country.countryCode);
                        }
                      }}
                      className="p-1 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors cursor-pointer"
                      title={`Remove ${country.countryName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                <span className="truncate">{country.region}</span>
                {country.isRemoteDefault && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold shrink-0">
                    ODA Remote
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h2 className="text-base font-bold text-stone-900">
              {isDomestic ? "Add New Domestic City" : "Add International Country Zone"}
            </h2>

            {isDomestic ? (
              <form onSubmit={handleAddDomestic} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">City Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sukkur or Abbottabad"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Delivery / Hub Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SKR, ATD"
                      value={deliveryCode}
                      onChange={(e) => setDeliveryCode(e.target.value.toUpperCase())}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Area Group</label>
                    <input
                      type="text"
                      placeholder="e.g. Upper Sindh, Hazara"
                      value={areaGroup}
                      onChange={(e) => setAreaGroup(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Province</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  >
                    <option value="Sindh">Sindh</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Federal Capital">Federal Capital</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Zone Tier</label>
                  <select
                    value={zoneTier}
                    onChange={(e) => setZoneTier(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  >
                    <option value="Major City">Major City / Primary Hub</option>
                    <option value="Secondary City">Secondary City / Tier 2</option>
                    <option value="Remote Area">Remote Area / Extended</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-900 text-white rounded-lg font-bold hover:bg-purple-800"
                  >
                    Save City
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddIntl} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Country Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Canada or Singapore"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Alpha-2 (ISO)</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="e.g. CA"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Alpha-3</label>
                    <input
                      type="text"
                      maxLength={3}
                      placeholder="e.g. CAN"
                      value={alpha3}
                      onChange={(e) => setAlpha3(e.target.value.toUpperCase())}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Numeric Code</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 124"
                      value={numericCode}
                      onChange={(e) => setNumericCode(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Region</label>
                  <input
                    type="text"
                    placeholder="e.g. North America, GCC, Western Europe"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Default Zone</label>
                  <select
                    value={defaultZone}
                    onChange={(e) => setDefaultZone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono"
                  >
                    {["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"].map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRemote}
                      onChange={(e) => setIsRemote(e.target.checked)}
                      className="rounded text-purple-700"
                    />
                    <span className="font-semibold text-stone-700">Flag as Remote / Out of Delivery Area</span>
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 font-semibold text-stone-600 hover:text-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-900 text-white rounded-lg font-bold hover:bg-purple-800"
                  >
                    Save Country
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
