import {
  TariffDomestic,
  TariffInternational,
  CalculationDomesticInput,
  CalculationDomesticResult,
  CalculationInternationalInput,
  CalculationInternationalResult,
  CalculationChargeDetail,
  DomesticCity,
} from "../types";
import { lookupWorldCountry } from "../data/worldCountriesData";

export class TariffCalculationEngine {
  /**
   * Determine domestic zone relationship between origin and destination cities
   */
  static determineDomesticZone(
    originCityName: string,
    destCityName: string,
    citiesList: DomesticCity[]
  ): "Within City" | "Same Province" | "Different Province" | "Remote / Ext-area" {
    const findCity = (rawName: string): DomesticCity | undefined => {
      if (!rawName) return undefined;
      const q = rawName.trim().toLowerCase();
      return (
        citiesList.find((c) => c.name.toLowerCase() === q) ||
        citiesList.find((c) => c.id.toLowerCase() === q) ||
        citiesList.find((c) => c.deliveryCode && c.deliveryCode.toLowerCase() === q) ||
        citiesList.find(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            q.includes(c.name.toLowerCase()) ||
            (c.areaGroup && c.areaGroup.toLowerCase().includes(q))
        )
      );
    };

    const origin = findCity(originCityName);
    const dest = findCity(destCityName);

    if (dest && dest.zoneTier === "Remote / Out of Delivery Area") {
      return "Remote / Ext-area";
    }

    const origTrim = originCityName.trim().toLowerCase();
    const destTrim = destCityName.trim().toLowerCase();

    // Direct match
    if (origTrim === destTrim) {
      return "Within City";
    }

    // Check if both are in the same metropolitan area / city group (e.g. Karachi Clifton vs Gulshan, Lahore Gulberg vs DHA)
    if (origin && dest) {
      if (origin.areaGroup && dest.areaGroup && origin.areaGroup.toLowerCase() === dest.areaGroup.toLowerCase()) {
        return "Within City";
      }

      const origBase = origin.name.split(" - ")[0].split(" (")[0].trim().toLowerCase();
      const destBase = dest.name.split(" - ")[0].split(" (")[0].trim().toLowerCase();
      if (origBase && destBase && origBase === destBase) {
        return "Within City";
      }

      if (origin.province === dest.province) {
        return "Same Province";
      }
    }

    return "Different Province";
  }

  /**
   * Calculate Domestic Shipment Rate with strict deterministic math
   */
  static calculateDomestic(
    tariff: TariffDomestic,
    input: CalculationDomesticInput,
    citiesList: DomesticCity[]
  ): CalculationDomesticResult {
    const zoneType = this.determineDomesticZone(input.originCity, input.destinationCity, citiesList);

    // Compute Volumetric Weight if dimensions provided (standard divisor 5000)
    let volumetricWeight = 0;
    if (input.lengthCm && input.widthCm && input.heightCm) {
      volumetricWeight = parseFloat(((input.lengthCm * input.widthCm * input.heightCm) / 5000).toFixed(2));
    }
    const chargeableWeight = Math.max(input.actualWeightKg, volumetricWeight);

    // Find applicable rate tier - checks zone type, sector synonyms, city name, and province name
    const destNorm = input.destinationCity.trim().toLowerCase();
    const origNorm = input.originCity.trim().toLowerCase();

    // Map zone types to common synonyms in domestic tariffs
    const ZONE_SYNONYMS: Record<string, string[]> = {
      "Within City": ["within city", "within-city", "local", "same city", "intra city", "intracity", "intra-city", "intra"],
      "Same Province": ["same province", "same-province", "intra province", "intra-province", "within province", "short haul"],
      "Different Province": ["different province", "inter province", "inter-province", "different zone", "metro", "long haul", "nationwide", "all pakistan", "other province", "intercity"],
      "Remote / Ext-area": ["remote", "remote / ext-area", "ext-area", "extended area", "remote area", "rest of country"],
    };
    const activeSynonyms = ZONE_SYNONYMS[zoneType] || [zoneType.toLowerCase()];

    let tier = tariff.rates.find((r) => {
      const rDest = r.destination.trim().toLowerCase();
      return (
        rDest === zoneType.toLowerCase() ||
        activeSynonyms.some((syn) => rDest === syn || rDest.includes(syn) || syn.includes(rDest)) ||
        rDest === destNorm ||
        rDest.includes(destNorm) ||
        destNorm.includes(rDest)
      );
    });

    // Fallback: If no exact tier found, match any applicable rate tier
    if (!tier && tariff.rates.length > 0) {
      tier = tariff.rates[0];
    }

    if (!tier) {
      return {
        id: `calc-dom-${Date.now()}`,
        partnerId: tariff.partnerId,
        partnerName: tariff.partnerName,
        tariffId: tariff.id,
        tariffVersion: tariff.currentVersion,
        sourceDocName: tariff.sourceDocName,
        service: tariff.service,
        origin: input.originCity,
        destination: input.destinationCity,
        destinationZoneType: zoneType,
        chargeableWeightKg: chargeableWeight,
        actualWeightKg: input.actualWeightKg,
        volumetricWeightKg: volumetricWeight,
        baseRate: 0,
        fuelAmount: 0,
        codAmount: input.codAmountPkr || 0,
        codFee: 0,
        gstAmount: 0,
        otherSurchargesTotal: 0,
        totalPayable: 0,
        chargesBreakdown: [],
        currency: "PKR",
        calculatedAt: new Date().toISOString(),
        isCovered: false,
        uncoveredReason: `No rate defined for destination sector '${zoneType}' under tariff ${tariff.name}.`,
      };
    }

    // 1. Calculate Base Rate
    // Rule: First 1 KG flat rate + each additional KG or fraction
    const firstKgRate = tier.firstKgRate;
    const additionalKgRate = tier.additionalKgRate;

    let baseRate = firstKgRate;
    if (chargeableWeight > 1.0) {
      const extraWeight = chargeableWeight - 1.0;
      // Round up extra weight to nearest 0.5 or 1.0 kg as is customary
      const billableExtraKg = Math.ceil(extraWeight);
      baseRate += billableExtraKg * additionalKgRate;
    }

    const breakdown: CalculationChargeDetail[] = [
      {
        name: "Base Freight",
        originalLabel: `1st KG @ PKR ${firstKgRate}${chargeableWeight > 1 ? ` + ${Math.ceil(chargeableWeight - 1)} addl KG @ PKR ${additionalKgRate}` : ""}`,
        type: "base",
        rateApplied: `Chargeable weight: ${chargeableWeight.toFixed(2)} kg`,
        amount: Math.round(baseRate),
      },
    ];

    // 2. Fuel Surcharge (FAC)
    const fuelRate = tariff.fuelPercentage || 0;
    const fuelAmount = Math.round(baseRate * (fuelRate / 100));
    if (fuelRate > 0) {
      breakdown.push({
        name: "Fuel Surcharge",
        originalLabel: "Fuel Adjustment Charge (FAC)",
        type: "fuel",
        rateApplied: `${fuelRate}% on Freight (PKR ${baseRate})`,
        amount: fuelAmount,
      });
    }

    // 3. COD Handling Fee
    let codFee = 0;
    if (input.codAmountPkr && input.codAmountPkr > 0) {
      const calculatedCodCommission = input.codAmountPkr * ((tariff.codPercentage || 0) / 100);
      codFee = Math.round(Math.max(calculatedCodCommission, tariff.codFixedMinimum || 0));
      breakdown.push({
        name: "COD Handling Fee",
        originalLabel: "Cash on Delivery Handling",
        type: "cod",
        rateApplied: `${tariff.codPercentage}% of COD (Min PKR ${tariff.codFixedMinimum})`,
        amount: codFee,
      });
    }

    // 4. Other Surcharges
    let otherSurchargesTotal = 0;
    if (tariff.surcharges && tariff.surcharges.length > 0) {
      for (const sc of tariff.surcharges) {
        if (sc.name.includes("Fuel") || sc.name.includes("COD") || sc.name.includes("GST") || sc.name.includes("Tax")) {
          continue; // already handled
        }
        let scAmount = 0;
        if (sc.type === "percentage") {
          scAmount = Math.round(baseRate * (sc.value / 100));
        } else {
          scAmount = Math.round(sc.value);
        }
        otherSurchargesTotal += scAmount;
        breakdown.push({
          name: sc.name,
          originalLabel: sc.originalName || sc.name,
          type: "surcharge",
          rateApplied: sc.type === "percentage" ? `${sc.value}%` : `Fixed PKR ${sc.value}`,
          amount: scAmount,
        });
      }
    }

    // 5. GST / Provincial Sales Tax (applied on freight + fuel + handling)
    const subtotalForTax = baseRate + fuelAmount + otherSurchargesTotal;
    const gstRate = tariff.gstPercentage || 16.0;
    const gstAmount = Math.round(subtotalForTax * (gstRate / 100));
    if (gstRate > 0) {
      breakdown.push({
        name: "GST / Provincial Sales Tax",
        originalLabel: "Provincial Services Tax (PRA/SRB/BRA/KPRA)",
        type: "tax",
        rateApplied: `${gstRate}% on Subtotal (PKR ${subtotalForTax})`,
        amount: gstAmount,
      });
    }

    const totalPayable = subtotalForTax + codFee + gstAmount;

    return {
      id: `calc-dom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partnerId: tariff.partnerId,
      partnerName: tariff.partnerName,
      tariffId: tariff.id,
      tariffVersion: tariff.currentVersion,
      sourceDocName: tariff.sourceDocName,
      service: tariff.service,
      origin: input.originCity,
      destination: input.destinationCity,
      destinationZoneType: zoneType,
      chargeableWeightKg: chargeableWeight,
      actualWeightKg: input.actualWeightKg,
      volumetricWeightKg: volumetricWeight,
      baseRate,
      fuelAmount,
      codAmount: input.codAmountPkr || 0,
      codFee,
      gstAmount,
      otherSurchargesTotal,
      totalPayable,
      chargesBreakdown: breakdown,
      currency: "PKR",
      calculatedAt: new Date().toISOString(),
      isCovered: true,
    };
  }

  /**
   * Calculate International Shipment Rate with strict deterministic arithmetic
   */
  static calculateInternational(
    tariff: TariffInternational,
    input: CalculationInternationalInput
  ): CalculationInternationalResult {
    const divisor = tariff.volumetricDivisor || 5000;
    let volumetricWeight = 0;
    if (input.lengthCm && input.widthCm && input.heightCm) {
      volumetricWeight = parseFloat(((input.lengthCm * input.widthCm * input.heightCm) / divisor).toFixed(2));
    }
    const chargeableWeight = Math.max(input.actualWeightKg, volumetricWeight);

    // Resolve destination country dynamically to tariff columns / carrier zones
    const destCountryRaw = (input.destinationCountry || input.destinationZone || "United States").trim();
    const destCountryLower = destCountryRaw.toLowerCase();

    // Canonical country tokens (Country name, ISO code, Alpha-3, Numeric, common synonyms, carrier regional zone aliases)
    const getCountryTokens = (c: string): { tokens: string[]; resolvedCountry?: ReturnType<typeof lookupWorldCountry> } => {
      const tokens = new Set<string>();
      tokens.add(c.toLowerCase());

      const worldMatch = lookupWorldCountry(c);
      if (worldMatch) {
        tokens.add(worldMatch.countryCode.toLowerCase());
        tokens.add(worldMatch.alpha3.toLowerCase());
        tokens.add(worldMatch.numericCode.toLowerCase());
        const numTrim = worldMatch.numericCode.replace(/^0+/, "");
        if (numTrim) tokens.add(numTrim.toLowerCase());
        tokens.add(worldMatch.countryName.toLowerCase());
        tokens.add(worldMatch.region.toLowerCase());
        tokens.add(worldMatch.defaultZone.toLowerCase());
        if (worldMatch.aliases) {
          worldMatch.aliases.forEach((a) => tokens.add(a.toLowerCase()));
        }
      }
      
      const SYNONYM_MAP: Record<string, string[]> = {
        "us": ["us", "usa", "united states", "united states of america", "america", "north america", "zone 3"],
        "usa": ["us", "usa", "united states", "united states of america", "america", "north america", "zone 3"],
        "united states": ["us", "usa", "united states", "united states of america", "america", "north america", "zone 3"],
        "ca": ["ca", "can", "canada", "north america", "zone 3"],
        "canada": ["ca", "can", "canada", "north america", "zone 3"],
        "gb": ["gb", "uk", "united kingdom", "great britain", "england", "western europe", "zone 2"],
        "uk": ["gb", "uk", "united kingdom", "great britain", "england", "western europe", "zone 2"],
        "united kingdom": ["gb", "uk", "united kingdom", "great britain", "england", "western europe", "zone 2"],
        "ae": ["ae", "uae", "united arab emirates", "dubai", "abu dhabi", "middle east", "gcc", "zone 1"],
        "uae": ["ae", "uae", "united arab emirates", "dubai", "abu dhabi", "middle east", "gcc", "zone 1"],
        "united arab emirates": ["ae", "uae", "united arab emirates", "dubai", "abu dhabi", "middle east", "gcc", "zone 1"],
        "sa": ["sa", "ksa", "saudi arabia", "riyadh", "middle east", "gcc", "zone 1"],
        "saudi arabia": ["sa", "ksa", "saudi arabia", "riyadh", "middle east", "gcc", "zone 1"],
        "de": ["de", "germany", "deutschland", "western europe", "zone 2"],
        "germany": ["de", "germany", "deutschland", "western europe", "zone 2"],
        "nl": ["nl", "netherlands", "holland", "amsterdam", "western europe", "zone 2"],
        "netherlands": ["nl", "netherlands", "holland", "amsterdam", "western europe", "zone 2"],
        "fr": ["fr", "france", "western europe", "zone 2"],
        "france": ["fr", "france", "western europe", "zone 2"],
        "au": ["au", "aus", "australia", "oceania", "zone 5"],
        "australia": ["au", "aus", "australia", "oceania", "zone 5"],
        "nz": ["nz", "new zealand", "oceania", "zone 5"],
        "new zealand": ["nz", "new zealand", "oceania", "zone 5"],
        "cn": ["cn", "china", "asia pacific", "zone 4"],
        "china": ["cn", "china", "asia pacific", "zone 4"],
        "sg": ["sg", "singapore", "asia pacific", "zone 4"],
        "singapore": ["sg", "singapore", "asia pacific", "zone 4"],
        "my": ["my", "malaysia", "asia pacific", "zone 4"],
        "malaysia": ["my", "malaysia", "asia pacific", "zone 4"],
        "tr": ["tr", "turkey", "türkiye", "zone 7"],
        "turkey": ["tr", "turkey", "türkiye", "zone 7"],
        "za": ["za", "south africa", "africa", "zone 6"],
        "south africa": ["za", "south africa", "africa", "zone 6"],
        "br": ["br", "brazil", "south america", "zone 8"],
        "brazil": ["br", "brazil", "south america", "zone 8"],
        "in": ["in", "india", "south asia", "zone 1"],
        "india": ["in", "india", "south asia", "zone 1"],
        "om": ["om", "oman", "middle east", "gcc", "zone 1"],
        "oman": ["om", "oman", "middle east", "gcc", "zone 1"],
        "kw": ["kw", "kuwait", "middle east", "gcc", "zone 1"],
        "kuwait": ["kw", "kuwait", "middle east", "gcc", "zone 1"],
        "qa": ["qa", "qatar", "middle east", "gcc", "zone 1"],
        "qatar": ["qa", "qatar", "middle east", "gcc", "zone 1"],
        "bh": ["bh", "bahrain", "middle east", "gcc", "zone 1"],
        "bahrain": ["bh", "bahrain", "middle east", "gcc", "zone 1"],
        "it": ["it", "italy", "western europe", "zone 2"],
        "italy": ["it", "italy", "western europe", "zone 2"],
        "es": ["es", "spain", "western europe", "zone 2"],
        "spain": ["es", "spain", "western europe", "zone 2"],
        "jp": ["jp", "japan", "asia pacific", "zone 4"],
        "japan": ["jp", "japan", "asia pacific", "zone 4"],
      };

      const matchedList = SYNONYM_MAP[c.toLowerCase()];
      if (matchedList) {
        matchedList.forEach((item) => tokens.add(item));
      }
      return { tokens: Array.from(tokens), resolvedCountry: worldMatch };
    };

    const { tokens: targetTokens, resolvedCountry } = getCountryTokens(destCountryRaw);
    let matchedCarrierZone = "";
    let zoneTiers: TariffInternational["rates"] = [];
    let matchedColKey: string | undefined = undefined;

    // 1. Resolve from Rate Matrix columns first (e.g. CA, US, UK, DE, NL, etc.)
    if (tariff.rateMatrix && tariff.rateMatrix.columns.length > 0) {
      const matchedCol = tariff.rateMatrix.columns.find((col) => {
        const kNorm = col.key.toLowerCase();
        const lNorm = col.label.toLowerCase();
        return targetTokens.some(
          (tok) =>
            kNorm === tok ||
            lNorm === tok ||
            lNorm.split(/[,/ ]+/).some((part) => part.trim().toLowerCase() === tok) ||
            col.countries?.some((cntry) => cntry.toLowerCase() === tok)
        );
      });

      if (matchedCol) {
        matchedColKey = matchedCol.key;
        matchedCarrierZone = matchedCol.label || matchedCol.key;
        zoneTiers = tariff.rateMatrix.rows
          .map((row, idx) => ({
            id: `matrix-${matchedCol.key}-${idx}`,
            zone: matchedCol.key,
            countryGroup: matchedCol.label,
            countryCode: matchedCol.key.length === 2 ? matchedCol.key : undefined,
            service: tariff.service,
            weightFrom: row.weightFrom,
            weightTo: row.weightTo,
            flatRate: row.pricingType !== "per_kg" ? row.rates[matchedCol.key] : undefined,
            ratePerKg: row.pricingType === "per_kg" ? row.rates[matchedCol.key] : undefined,
          }))
          .filter((t) => (t.flatRate !== undefined && t.flatRate > 0) || (t.ratePerKg !== undefined && t.ratePerKg > 0));
      }
    }

    // 2. Resolve from itemized rate tiers (e.g. DHL/UPS Zone 1 to Zone 8)
    if (zoneTiers.length === 0) {
      const matchedRates = tariff.rates.filter((r) => {
        const zNorm = r.zone.toLowerCase();
        const cgNorm = (r.countryGroup || "").toLowerCase();
        const ccNorm = (r.countryCode || "").toLowerCase();

        return targetTokens.some(
          (tok) =>
            zNorm === tok ||
            cgNorm.includes(tok) ||
            ccNorm === tok ||
            (cgNorm && cgNorm.split(/[,/() ]+/).some((part) => part.trim() === tok))
        );
      });

      if (matchedRates.length > 0) {
        zoneTiers = matchedRates;
        matchedCarrierZone = matchedRates[0].countryGroup
          ? `${matchedRates[0].zone} (${matchedRates[0].countryGroup})`
          : matchedRates[0].zone;
      }
    }

    // Fallback if still empty: check if any rate tier or zone keyword exists
    if (zoneTiers.length === 0 && tariff.rates.length > 0) {
      // Default to the first group or Zone 3 if destination is unspecified
      const fallbackZone = tariff.rates[0]?.zone;
      zoneTiers = tariff.rates.filter((r) => r.zone === fallbackZone);
      if (zoneTiers.length > 0) {
        matchedCarrierZone = zoneTiers[0].countryGroup || zoneTiers[0].zone;
      }
    }

    if (zoneTiers.length === 0) {
      return {
        id: `calc-intl-${Date.now()}`,
        partnerId: tariff.partnerId,
        partnerName: tariff.partnerName,
        tariffId: tariff.id,
        tariffVersion: tariff.currentVersion,
        sourceDocName: tariff.sourceDocName,
        service: tariff.service,
        destinationCountry: resolvedCountry
          ? `${resolvedCountry.countryName} (${resolvedCountry.countryCode} / ${resolvedCountry.alpha3})`
          : destCountryRaw,
        destinationZone: matchedCarrierZone || "Unmapped",
        actualWeightKg: input.actualWeightKg,
        volumetricWeightKg: volumetricWeight,
        chargeableWeightKg: chargeableWeight,
        volumetricDivisorUsed: divisor,
        baseRate: 0,
        fuelSurcharge: 0,
        remoteAreaSurcharge: 0,
        securityFee: 0,
        customsFee: 0,
        otherSurchargesTotal: 0,
        totalPayable: 0,
        chargesBreakdown: [],
        currency: tariff.currency || "PKR",
        calculatedAt: new Date().toISOString(),
        isCovered: false,
        uncoveredReason: `Destination '${destCountryRaw}' is not covered by tariff ${tariff.name}.`,
      };
    }

    // Determine max flat parcel weight threshold (e.g. 70 kg)
    const flatTiers = zoneTiers.filter((t) => t.flatRate !== undefined && t.flatRate > 0);
    const maxFlatSlab = flatTiers.length > 0
      ? flatTiers.reduce((prev, curr) => (curr.weightTo > prev.weightTo ? curr : prev), flatTiers[0])
      : null;
    const maxFlatThreshold = tariff.rateMatrix?.maxFlatWeightKg || (maxFlatSlab ? maxFlatSlab.weightTo : 70);

    let baseRate = 0;
    let rateLabel = "";
    const additionalBreakdownItems: CalculationChargeDetail[] = [];

    // CASE 1: Standard parcel within flat slabs (e.g. weight <= 70 kg)
    // Sort flat tiers ascending by weightTo for standard courier weight slab lookup
    const sortedFlatTiers = [...flatTiers].sort((a, b) => a.weightTo - b.weightTo);

    // Standard courier slab lookup: find first tier whose upper limit covers the chargeable weight, or matches the weight span
    const matchedFlatTier =
      sortedFlatTiers.find((t) => t.weightTo >= chargeableWeight - 0.001) ||
      sortedFlatTiers.find((t) => chargeableWeight >= t.weightFrom && chargeableWeight <= t.weightTo);

    if (matchedFlatTier && chargeableWeight <= maxFlatThreshold) {
      baseRate = matchedFlatTier.flatRate || 0;
      rateLabel = `Flat package rate for ${matchedFlatTier.weightFrom}–${matchedFlatTier.weightTo} kg slab`;
    } else if (maxFlatSlab && chargeableWeight > maxFlatThreshold) {
      // CASE 2: Heavy cargo exceeding base flat slabs (e.g. > 70 kg)
      // Base flat rate at max slab
      const baseFlatCost = maxFlatSlab.flatRate || 0;
      let totalExcessCost = 0;
      const effectiveZoneKey = matchedColKey || zoneTiers[0]?.zone;

      // Check if multi-bracket excess tiers exist (e.g. 70.01 - 99 kg and 99.01 - 1000 kg)
      const excessTiers = tariff.rateMatrix?.excessTiers;

      if (excessTiers && excessTiers.length > 0) {
        rateLabel = `Base slab (${maxFlatThreshold} kg: PKR ${baseFlatCost.toLocaleString()}) + Tiered excess per-kg charges`;

        for (const tier of excessTiers) {
          const tierRate = tier.rates[effectiveZoneKey];
          if (!tierRate || tierRate <= 0) continue;

          // Compute weight span falling into this tier
          const tierMin = Math.max(maxFlatThreshold, tier.weightFrom - 0.01);
          const tierMax = tier.weightTo;

          if (chargeableWeight > tierMin) {
            const billableKgInTier = Math.min(chargeableWeight, tierMax) - tierMin;
            if (billableKgInTier > 0) {
              const roundedTierKg = Number(billableKgInTier.toFixed(2));
              const tierCharge = Math.round(roundedTierKg * tierRate);
              totalExcessCost += tierCharge;

              additionalBreakdownItems.push({
                name: `Excess Freight (${tier.weightFrom}–${Math.min(chargeableWeight, tierMax)} kg)`,
                originalLabel: `${tier.label} @ PKR ${tierRate.toLocaleString()}/kg`,
                type: "base",
                rateApplied: `${roundedTierKg} kg × PKR ${tierRate.toLocaleString()}`,
                amount: tierCharge,
              });
            }
          }
        }

        baseRate = baseFlatCost + totalExcessCost;
      } else {
        // Fallback: Single additional per kg rate
        const addlPerKg = tariff.rateMatrix?.additionalKgRates?.[effectiveZoneKey] ||
          zoneTiers.find((t) => t.ratePerKg !== undefined)?.ratePerKg;

        if (addlPerKg) {
          const excessWeight = Math.ceil(chargeableWeight - maxFlatThreshold);
          totalExcessCost = excessWeight * addlPerKg;
          baseRate = baseFlatCost + totalExcessCost;
          rateLabel = `Base slab (${maxFlatThreshold} kg: PKR ${baseFlatCost.toLocaleString()}) + ${excessWeight} kg excess @ PKR ${addlPerKg.toLocaleString()}/kg`;

          additionalBreakdownItems.push({
            name: `Excess Freight (${maxFlatThreshold}+ kg)`,
            originalLabel: `Additional weight @ PKR ${addlPerKg}/kg`,
            type: "base",
            rateApplied: `${excessWeight} kg × PKR ${addlPerKg}`,
            amount: totalExcessCost,
          });
        } else {
          baseRate = baseFlatCost;
          rateLabel = `Base slab (${maxFlatThreshold} kg: PKR ${baseFlatCost.toLocaleString()})`;
        }
      }
    } else {
      // Direct per-kg rate if no flat tiers exist
      const perKgTier = zoneTiers.find((t) => t.ratePerKg !== undefined && chargeableWeight >= t.weightFrom && chargeableWeight <= t.weightTo)
        || zoneTiers.find((t) => t.ratePerKg !== undefined);

      if (perKgTier && perKgTier.ratePerKg) {
        baseRate = Math.round(chargeableWeight * perKgTier.ratePerKg);
        rateLabel = `Air cargo rate PKR ${perKgTier.ratePerKg}/kg × ${chargeableWeight.toFixed(2)} kg`;
      }
    }

    const breakdown: CalculationChargeDetail[] = [
      {
        name: "Base Air Express Freight",
        originalLabel: rateLabel,
        type: "base",
        rateApplied: `Chargeable weight: ${chargeableWeight.toFixed(2)} kg (Divisor ${divisor})`,
        amount: baseRate,
      },
      ...additionalBreakdownItems,
    ];

    // 1. Fuel Surcharge
    const fuelRate = tariff.fuelPercentage || 0;
    const fuelSurcharge = Math.round(baseRate * (fuelRate / 100));
    if (fuelRate > 0) {
      breakdown.push({
        name: "Fuel Surcharge",
        originalLabel: "Fuel Surcharge Index (FSC)",
        type: "fuel",
        rateApplied: `${fuelRate}% on Freight (PKR ${baseRate})`,
        amount: fuelSurcharge,
      });
    }

    // 2. Remote Area Fee
    let remoteAreaSurcharge = 0;
    if (input.isRemoteArea && tariff.remoteAreaFee > 0) {
      remoteAreaSurcharge = tariff.remoteAreaFee;
      breakdown.push({
        name: "Remote Area Delivery",
        originalLabel: "Out of Delivery Area (ODA) Surcharge",
        type: "fee",
        rateApplied: `Fixed flat per consignment`,
        amount: remoteAreaSurcharge,
      });
    }

    // 3. Security Fee
    const securityFee = tariff.securityFee || 0;
    if (securityFee > 0) {
      breakdown.push({
        name: "Airline Security Fee",
        originalLabel: "Aviation Security & Screening Charge",
        type: "fee",
        rateApplied: `Fixed flat per consignment`,
        amount: securityFee,
      });
    }

    // 4. Customs Formalities Fee
    const customsFee = tariff.customsClearanceFee || 0;
    if (customsFee > 0) {
      breakdown.push({
        name: "Customs Formalities Admin",
        originalLabel: "Routine Export Documentation & Clearance",
        type: "fee",
        rateApplied: `Fixed administrative charge`,
        amount: customsFee,
      });
    }

    const totalPayable = baseRate + fuelSurcharge + remoteAreaSurcharge + securityFee + customsFee;

    return {
      id: `calc-intl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partnerId: tariff.partnerId,
      partnerName: tariff.partnerName,
      tariffId: tariff.id,
      tariffVersion: tariff.currentVersion,
      sourceDocName: tariff.sourceDocName,
      service: tariff.service,
      destinationCountry: resolvedCountry
        ? `${resolvedCountry.countryName} (${resolvedCountry.countryCode} / ${resolvedCountry.alpha3})`
        : destCountryRaw,
      destinationZone: matchedCarrierZone || input.destinationZone || "Standard",
      actualWeightKg: input.actualWeightKg,
      volumetricWeightKg: volumetricWeight,
      chargeableWeightKg: chargeableWeight,
      volumetricDivisorUsed: divisor,
      baseRate,
      fuelSurcharge,
      remoteAreaSurcharge,
      securityFee,
      customsFee,
      otherSurchargesTotal: 0,
      totalPayable,
      chargesBreakdown: breakdown,
      currency: tariff.currency || "PKR",
      calculatedAt: new Date().toISOString(),
      isCovered: true,
    };
  }
}
