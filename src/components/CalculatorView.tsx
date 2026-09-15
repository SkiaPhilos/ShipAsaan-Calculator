import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Truck,
  Globe,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  Printer,
} from "lucide-react";
import {
  WorkspaceType,
  TariffDomestic,
  TariffInternational,
  DomesticCity,
  InternationalCountryZone,
  CalculationDomesticInput,
  CalculationDomesticResult,
  CalculationInternationalInput,
  CalculationInternationalResult,
} from "../types";
import { TariffCalculationEngine } from "../engine/calculationEngine";
import { lookupWorldCountry } from "../data/worldCountriesData";
import { CountrySearchSelect } from "./CountrySearchSelect";
import { CitySearchSelect } from "./CitySearchSelect";
import { QuotationSlipModal } from "./QuotationSlipModal";

interface CalculatorViewProps {
  activeWorkspace: WorkspaceType;
  domesticTariffs: TariffDomestic[];
  internationalTariffs: TariffInternational[];
  domesticCities: DomesticCity[];
  internationalCountries: InternationalCountryZone[];
  onSaveHistory: (record: any) => void;
  onOpenTariffDetails: (tariffId: string) => void;
  initialRoute?: { origin: string; dest: string; weight: number };
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  activeWorkspace,
  domesticTariffs,
  internationalTariffs,
  domesticCities,
  internationalCountries,
  onSaveHistory,
  onOpenTariffDetails,
  initialRoute,
}) => {
  const isDomestic = activeWorkspace === "domestic";

  // Domestic State
  const [domOrigin, setDomOrigin] = useState("Karachi");
  const [domDest, setDomDest] = useState("Lahore");
  const [domWeight, setDomWeight] = useState(2.0);
  const [domLength, setDomLength] = useState<number | undefined>(undefined);
  const [domWidth, setDomWidth] = useState<number | undefined>(undefined);
  const [domHeight, setDomHeight] = useState<number | undefined>(undefined);
  const [domCodAmount, setDomCodAmount] = useState<number>(3500);
  const [domSelectedTariffId, setDomSelectedTariffId] = useState<string>("all");

  const [domResults, setDomResults] = useState<CalculationDomesticResult[]>([]);

  // International State
  const [intlCountry, setIntlCountry] = useState("United States");
  const [intlWeight, setIntlWeight] = useState(4.0);
  const [intlLength, setIntlLength] = useState(30);
  const [intlWidth, setIntlWidth] = useState(25);
  const [intlHeight, setIntlHeight] = useState(15);
  const [intlIsRemote, setIntlIsRemote] = useState(false);
  const [intlSelectedTariffId, setIntlSelectedTariffId] = useState<string>("all");

  const [intlResults, setIntlResults] = useState<CalculationInternationalResult[]>([]);

  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [quotationSlipData, setQuotationSlipData] = useState<{
    isOpen: boolean;
    selectedResult: CalculationDomesticResult | CalculationInternationalResult;
    allResults: (CalculationDomesticResult | CalculationInternationalResult)[];
  } | null>(null);

  // Group domestic cities by province / commercial importance
  const groupedDomesticCities = useMemo((): Record<string, DomesticCity[]> => {
    const groups: Record<string, DomesticCity[]> = {
      "Major Commercial Hubs": domesticCities.filter((c) => c.isHub),
      "Sindh & Karachi Delivery Areas": domesticCities.filter(
        (c) => !c.isHub && (c.province === "Sindh" || c.province.includes("Sindh"))
      ),
      "Punjab & Lahore Delivery Areas": domesticCities.filter(
        (c) => !c.isHub && (c.province === "Punjab" || c.province.includes("Punjab"))
      ),
      "Islamabad Capital Territory (ICT)": domesticCities.filter(
        (c) => !c.isHub && (c.province.includes("Capital") || c.province.includes("ICT"))
      ),
      "Khyber Pakhtunkhwa (KPK)": domesticCities.filter(
        (c) => !c.isHub && (c.province.includes("KPK") || c.province.includes("Khyber"))
      ),
      "Balochistan": domesticCities.filter(
        (c) => !c.isHub && c.province.includes("Balochistan")
      ),
      "Azad Jammu & Kashmir (AJK)": domesticCities.filter(
        (c) => !c.isHub && (c.province.includes("AJK") || c.province.includes("Kashmir"))
      ),
      "Gilgit-Baltistan (GB)": domesticCities.filter(
        (c) => !c.isHub && (c.province.includes("Gilgit") || c.province.includes("GB"))
      ),
    };
    return groups;
  }, [domesticCities]);

  // Group international countries by geographic world region
  const groupedInternationalCountries = useMemo((): Record<string, InternationalCountryZone[]> => {
    const groups: Record<string, InternationalCountryZone[]> = {};
    internationalCountries.forEach((c) => {
      const reg = c.region || "Other Global Destinations";
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(c);
    });
    return groups;
  }, [internationalCountries]);

  // Resolved country coding and details (supports Alpha-2, Alpha-3, ISO numeric, name)
  const resolvedCountryInfo = useMemo(() => {
    if (isDomestic) return undefined;
    return lookupWorldCountry(intlCountry, internationalCountries);
  }, [isDomestic, intlCountry, internationalCountries]);

  // Apply initial route if passed from dashboard
  useEffect(() => {
    if (initialRoute) {
      if (isDomestic) {
        setDomOrigin(initialRoute.origin || "Karachi");
        setDomDest(initialRoute.dest || "Lahore");
        setDomWeight(initialRoute.weight || 2.0);
      } else {
        setIntlCountry(initialRoute.dest || "United States");
        setIntlWeight(initialRoute.weight || 4.0);
      }
    }
  }, [initialRoute, isDomestic]);

  // Sync country default remote status for international
  useEffect(() => {
    if (!isDomestic) {
      const match =
        lookupWorldCountry(intlCountry, internationalCountries) ||
        internationalCountries.find(
          (c) => c.countryName.toLowerCase() === intlCountry.toLowerCase()
        );
      if (match) {
        setIntlIsRemote(match.isRemoteDefault);
      }
    }
  }, [intlCountry, isDomestic, internationalCountries]);

  // Execute Calculation whenever inputs change (deterministic!)
  useEffect(() => {
    if (isDomestic) {
      const input: CalculationDomesticInput = {
        originCity: domOrigin,
        destinationCity: domDest,
        actualWeightKg: Number(domWeight) || 0.5,
        lengthCm: domLength,
        widthCm: domWidth,
        heightCm: domHeight,
        codAmountPkr: Number(domCodAmount) || 0,
      };

      const tariffsToCalc =
        domSelectedTariffId === "all"
          ? domesticTariffs.filter((t) => t.status === "active")
          : domesticTariffs.filter((t) => t.id === domSelectedTariffId);

      const calculated = tariffsToCalc.map((t) =>
        TariffCalculationEngine.calculateDomestic(t, input, domesticCities)
      );

      // Sort by total payable
      calculated.sort((a, b) => (a.totalPayable > 0 && b.totalPayable > 0 ? a.totalPayable - b.totalPayable : 0));
      setDomResults(calculated);
    } else {
      const input: CalculationInternationalInput = {
        originCountry: "Pakistan",
        destinationCountry: intlCountry,
        actualWeightKg: Number(intlWeight) || 0.5,
        lengthCm: Number(intlLength) || 0,
        widthCm: Number(intlWidth) || 0,
        heightCm: Number(intlHeight) || 0,
        isRemoteArea: intlIsRemote,
      };

      const tariffsToCalc =
        intlSelectedTariffId === "all"
          ? internationalTariffs.filter((t) => t.status === "active")
          : internationalTariffs.filter((t) => t.id === intlSelectedTariffId);

      const calculated = tariffsToCalc.map((t) =>
        TariffCalculationEngine.calculateInternational(t, input)
      );

      calculated.sort((a, b) => (a.totalPayable > 0 && b.totalPayable > 0 ? a.totalPayable - b.totalPayable : 0));
      setIntlResults(calculated);
    }
  }, [
    isDomestic,
    domOrigin,
    domDest,
    domWeight,
    domLength,
    domWidth,
    domHeight,
    domCodAmount,
    domSelectedTariffId,
    domesticTariffs,
    domesticCities,
    intlCountry,
    intlWeight,
    intlLength,
    intlWidth,
    intlHeight,
    intlIsRemote,
    intlSelectedTariffId,
    internationalTariffs,
  ]);

  const handleSaveResult = (res: CalculationDomesticResult | CalculationInternationalResult) => {
    onSaveHistory({
      id: `hist-${Date.now()}`,
      workspace: activeWorkspace,
      timestamp: new Date().toISOString(),
      summaryTitle: isDomestic
        ? `${domOrigin} ➔ ${domDest} (${domWeight} kg COD)`
        : `Pakistan ➔ ${intlCountry} (${intlWeight} kg)`,
      origin: isDomestic ? domOrigin : "Pakistan",
      destination: isDomestic ? domDest : intlCountry,
      weightKg: isDomestic ? domWeight : intlWeight,
      partnerName: res.partnerName,
      service: res.service,
      totalPayable: res.totalPayable,
      currency: res.currency,
      tariffId: res.tariffId,
      tariffVersion: res.tariffVersion,
      sourceDocName: res.sourceDocName,
      inputSnapshot: isDomestic
        ? { domOrigin, domDest, domWeight, domCodAmount }
        : { intlCountry, carrierZone: (res as CalculationInternationalResult).destinationZone, intlWeight, intlLength, intlWidth, intlHeight },
      resultSnapshot: res,
    });

    setSavedSuccessMsg(`Saved quote for ${res.partnerName} to Calculation History.`);
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  return (
    <div id="calculator-view" className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic COD Rate Calculator" : "International Courier Rate Calculator"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              Deterministic Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isDomestic
              ? "Calculates verifiable freight, fuel adjustment (FAC), COD fee, and GST according to active domestic contracts."
              : "Calculates air freight, volumetric chargeable weight (L×W×H / divisor), fuel index, and clearance charges."}
          </p>
        </div>

        {savedSuccessMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs Form (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Shipment Parameters
          </h2>

          {isDomestic ? (
            /* DOMESTIC INPUTS */
            <div className="space-y-3.5">
              {/* Origin City */}
              <CitySearchSelect
                id="select-dom-origin"
                label="Origin City / Area"
                helperText={`${domesticCities.length} Areas`}
                cities={domesticCities}
                selectedCityName={domOrigin}
                onSelectCity={(cityName) => setDomOrigin(cityName)}
                placeholder="Search origin city or code (e.g. KHI, LHE, ISB)..."
              />

              {/* Destination City */}
              <CitySearchSelect
                id="select-dom-dest"
                label="Destination City / Area"
                helperText={`${domesticCities.length} Areas`}
                cities={domesticCities}
                selectedCityName={domDest}
                onSelectCity={(cityName) => setDomDest(cityName)}
                placeholder="Search destination city or code (e.g. FSD, PEW, UET)..."
              />

              {/* Actual Weight (kg) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Actual Parcel Weight (kg)
                </label>
                <input
                  id="input-dom-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={domWeight}
                  onChange={(e) => setDomWeight(parseFloat(e.target.value) || 0.1)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
                {/* Weight Presets */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[0.5, 1.0, 2.0, 3.0, 5.0, 10.0, 20.0].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setDomWeight(w)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                        domWeight === w
                          ? "bg-purple-600 text-white font-bold shadow-2xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* COD Invoice Amount (PKR) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Cash on Delivery (COD) Amount (PKR)
                </label>
                <input
                  id="input-dom-cod"
                  type="number"
                  step="100"
                  min="0"
                  value={domCodAmount}
                  onChange={(e) => setDomCodAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                  placeholder="e.g. 3500"
                />
                <p className="text-[10px] text-stone-600 mt-1">
                  Commission is calculated based on partner COD percentage and minimum threshold.
                </p>
              </div>

              {/* Dimensions (Optional Volumetric) */}
              <div className="pt-2 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-700 mb-1.5">
                  Dimensions (cm) <span className="text-stone-600 font-normal">(optional)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="L"
                    value={domLength || ""}
                    onChange={(e) => setDomLength(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                  <input
                    type="number"
                    placeholder="W"
                    value={domWidth || ""}
                    onChange={(e) => setDomWidth(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                  <input
                    type="number"
                    placeholder="H"
                    value={domHeight || ""}
                    onChange={(e) => setDomHeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                </div>
              </div>

              {/* Partner Filter */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Courier Selection
                </label>
                <select
                  id="select-dom-partner"
                  value={domSelectedTariffId}
                  onChange={(e) => setDomSelectedTariffId(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">Compare All Active Domestic Couriers</option>
                  {domesticTariffs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.partnerName} ({t.service})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            /* INTERNATIONAL INPUTS */
            <div className="space-y-3.5">
              {/* Destination Country Search & Combobox */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Destination Country
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {internationalCountries.length} Countries Available
                  </span>
                </div>

                <CountrySearchSelect
                  id="select-intl-country-combobox"
                  countries={internationalCountries}
                  selectedCountry={intlCountry}
                  onSelectCountry={(countryName) => setIntlCountry(countryName)}
                />
              </div>

              {/* Actual Weight (kg) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Actual Scale Weight (kg)
                </label>
                <input
                  id="input-intl-weight"
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={intlWeight}
                  onChange={(e) => setIntlWeight(parseFloat(e.target.value) || 0.5)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                />
                {/* Weight Presets */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {[0.5, 1.0, 2.0, 5.0, 10.0, 25.0, 50.0].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setIntlWeight(w)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                        intlWeight === w
                          ? "bg-purple-600 text-white font-bold shadow-2xs"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Carton Dimensions (L x W x H) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Carton Dimensions (cm)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Length"
                    value={intlLength}
                    onChange={(e) => setIntlLength(parseFloat(e.target.value) || 0)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={intlWidth}
                    onChange={(e) => setIntlWidth(parseFloat(e.target.value) || 0)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={intlHeight}
                    onChange={(e) => setIntlHeight(parseFloat(e.target.value) || 0)}
                    className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 text-center font-mono"
                  />
                </div>
                <p className="text-[10px] text-stone-600 mt-1 font-mono">
                  Volumetric: {((intlLength * intlWidth * intlHeight) / 5000).toFixed(2)} kg (Divisor 5000)
                </p>
              </div>

              {/* Remote Area checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="checkbox-intl-remote"
                    type="checkbox"
                    checked={intlIsRemote}
                    onChange={(e) => setIntlIsRemote(e.target.checked)}
                    className="rounded text-purple-700 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Remote / Out of Delivery Area (ODA)
                  </span>
                </label>
                <p className="text-[10px] text-stone-600 pl-6 mt-0.5">
                  Adds carrier flat surcharge (e.g. PKR 2,400–2,600)
                </p>
              </div>

              {/* Carrier Selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Carrier Selection
                </label>
                <select
                  id="select-intl-partner"
                  value={intlSelectedTariffId}
                  onChange={(e) => setIntlSelectedTariffId(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">Compare All Active International Carriers</option>
                  {internationalTariffs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.partnerName} ({t.service})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Rate Results & Calculation Breakdown (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Calculated Payable Quotes ({isDomestic ? domResults.length : intlResults.length})
              </h2>
              <span className="text-[11px] text-stone-500 font-mono">
                Formula: Base + Fuel + Surcharges + Taxes
              </span>
            </div>

            {((isDomestic && domResults.length > 0) || (!isDomestic && intlResults.length > 0)) && (
              <button
                type="button"
                onClick={() => {
                  const currentList = isDomestic ? domResults : intlResults;
                  if (currentList.length > 0) {
                    setQuotationSlipData({
                      isOpen: true,
                      selectedResult: currentList[0],
                      allResults: currentList,
                    });
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-purple-700" />
                <span>Formal Quotation Slip</span>
              </button>
            )}
          </div>

          {/* Results Cards List */}
          <div className="space-y-4">
            {isDomestic ? (
              domResults.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-stone-400">
                  <p className="text-sm">No active domestic tariffs found. Check Tariffs page or import a rate sheet.</p>
                </div>
              ) : (
                domResults.map((res, idx) => (
                  <div
                    key={res.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all ${
                      idx === 0
                        ? "border-purple-300 ring-1 ring-purple-200"
                        : "border-stone-200"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-stone-900">
                            {res.partnerName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                            {res.service}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-lime-100 text-lime-800">
                              Lowest Estimated Rate
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Sector: <span className="font-semibold text-stone-700">{res.destinationZoneType}</span> ({res.origin} ➔ {res.destination}) • Chargeable: {res.chargeableWeightKg.toFixed(2)} kg
                        </p>
                      </div>

                      {/* Total and Actions */}
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                        <div>
                          <span className="text-xs text-stone-400 font-semibold uppercase mr-1">Payable</span>
                          <span className="text-xl font-black text-stone-900 font-mono">
                            PKR {res.totalPayable.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQuotationSlipData({
                                isOpen: true,
                                selectedResult: res,
                                allResults: domResults,
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Print client quotation slip"
                          >
                            <Printer className="w-3 h-3 text-purple-700" />
                            <span>Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveResult(res)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3 text-stone-500" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Transparent Breakdown */}
                    <div className="py-3">
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Verifiable Price Breakdown
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {res.chargesBreakdown.map((item, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2 bg-stone-50/80 rounded-lg border border-stone-200/60 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-stone-800">{item.name}</p>
                              <p className="text-[10px] text-stone-600">{item.rateApplied}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-900">
                              PKR {item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source Traceability Footer */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span>
                          Source: <span className="font-semibold text-stone-700">{res.sourceDocName || "Direct Tariff"}</span> (v{res.tariffVersion})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenTariffDetails(res.tariffId)}
                        className="text-purple-700 hover:text-purple-900 font-semibold underline text-left"
                      >
                        Inspect Full Tariff Rules & Model ➔
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* INTERNATIONAL RESULTS */
              intlResults.length === 0 ? (
                <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-stone-400">
                  <p className="text-sm">No active international tariffs found. Check Tariffs page or import a rate sheet.</p>
                </div>
              ) : (
                intlResults.map((res, idx) => (
                  <div
                    key={res.id}
                    className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all ${
                      idx === 0
                        ? "border-orange-300 ring-1 ring-orange-200"
                        : "border-stone-200"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-stone-900">
                            {res.partnerName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-900">
                            {res.service}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-lime-100 text-lime-800">
                              Best Rate
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-1">
                          <span>Destination: <strong className="text-stone-800">{res.destinationCountry}</strong></span>
                          <span className="text-stone-300">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[10px] border border-stone-200">
                            Carrier Zone: {res.destinationZone}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span>Chargeable: <strong className="text-stone-800">{res.chargeableWeightKg.toFixed(2)} kg</strong> (Divisor {res.volumetricDivisorUsed})</span>
                        </div>
                      </div>

                      {/* Total and Actions */}
                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                        <div>
                          <span className="text-xs text-stone-400 font-semibold uppercase mr-1">Estimated Total</span>
                          <span className="text-xl font-black text-stone-900 font-mono">
                            PKR {res.totalPayable.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setQuotationSlipData({
                                isOpen: true,
                                selectedResult: res,
                                allResults: intlResults,
                              })
                            }
                            className="px-2.5 py-1 text-[11px] font-bold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Print client quotation slip"
                          >
                            <Printer className="w-3 h-3 text-orange-700" />
                            <span>Slip</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveResult(res)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3 text-stone-500" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step-by-Step Breakdown */}
                    <div className="py-3">
                      <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">
                        Verifiable Price Breakdown
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {res.chargesBreakdown.map((item, bIdx) => (
                          <div
                            key={bIdx}
                            className="p-2 bg-stone-50/80 rounded-lg border border-stone-200/60 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-stone-800">{item.name}</p>
                              <p className="text-[10px] text-stone-600">{item.rateApplied}</p>
                            </div>
                            <span className="font-mono font-bold text-stone-900">
                              PKR {item.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Source Traceability Footer */}
                    <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-stone-500 gap-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-orange-600" />
                        <span>
                          Source: <span className="font-semibold text-stone-700">{res.sourceDocName || "Master Tariff Card"}</span> (v{res.tariffVersion})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenTariffDetails(res.tariffId)}
                        className="text-orange-600 hover:text-orange-800 font-semibold underline text-left"
                      >
                        Inspect Full International Tariff Matrix ➔
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Printable / Exportable Quotation Slip Modal */}
      {quotationSlipData && quotationSlipData.isOpen && (
        <QuotationSlipModal
          isOpen={quotationSlipData.isOpen}
          onClose={() => setQuotationSlipData(null)}
          result={quotationSlipData.selectedResult}
          allResults={quotationSlipData.allResults}
          activeWorkspace={activeWorkspace}
        />
      )}
    </div>
  );
};
