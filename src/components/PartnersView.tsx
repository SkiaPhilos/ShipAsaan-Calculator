import React, { useState } from "react";
import {
  Truck,
  Plus,
  Phone,
  Mail,
  Globe,
  CheckCircle2,
  Calendar,
  Percent,
  Search,
  Building,
  ShieldCheck,
} from "lucide-react";
import {
  WorkspaceType,
  PartnerDomestic,
  PartnerInternational,
} from "../types";

interface PartnersViewProps {
  activeWorkspace: WorkspaceType;
  domesticPartners: PartnerDomestic[];
  internationalPartners: PartnerInternational[];
  onAddDomesticPartner: (partner: PartnerDomestic) => void;
  onAddInternationalPartner: (partner: PartnerInternational) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  activeWorkspace,
  domesticPartners,
  internationalPartners,
  onAddDomesticPartner,
  onAddInternationalPartner,
}) => {
  const isDomestic = activeWorkspace === "domestic";
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // New partner state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const filteredPartners = (isDomestic ? domesticPartners : internationalPartners).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    if (isDomestic) {
      const newP: PartnerDomestic = {
        id: `dp-${Date.now()}`,
        name,
        code: code.toUpperCase(),
        contactName: contactPerson || "Key Account Manager",
        phone,
        email,
        services: ["Overnight Express", "Standard COD"],
        coverageCities: ["Karachi", "Lahore", "Islamabad", "Faisalabad"],
        provincesCovered: ["Sindh", "Punjab", "KPK", "Balochistan"],
        accountNo: `PK-${Math.floor(100000 + Math.random() * 900000)}`,
        contractRef: `REF-${code.toUpperCase()}-2026`,
        effectiveDate: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "Active domestic courier partner.",
        createdAt: new Date().toISOString(),
      };
      onAddDomesticPartner(newP);
    } else {
      const newP: PartnerInternational = {
        id: `ip-${Date.now()}`,
        name,
        code: code.toUpperCase(),
        contactName: contactPerson || "Global Commercial Lead",
        phone,
        email,
        services: ["Air Express", "Standard International"],
        countriesCovered: 220,
        zonesCovered: 8,
        volumetricDivisor: 5000,
        currency: "PKR",
        accountNo: `INT-${Math.floor(100000 + Math.random() * 900000)}`,
        contractRef: `REF-INT-${code.toUpperCase()}-2026`,
        effectiveDate: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "Global express air carrier.",
        createdAt: new Date().toISOString(),
      };
      onAddInternationalPartner(newP);
    }

    setShowAddModal(false);
    setName("");
    setCode("");
    setContactPerson("");
    setPhone("");
    setEmail("");
  };

  return (
    <div id="partners-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Couriers & COD Partners" : "International Air Courier Carriers"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              {filteredPartners.length} Active Partners
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {isDomestic
              ? "Manage contracted domestic couriers, COD remittance terms, and account credentials."
              : "Manage global carrier agreements, volume discounts, and surcharge index mechanisms."}
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
          <span>Add Courier Partner</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search partners by name or short code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
          />
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                    isDomestic
                      ? "bg-purple-100 text-purple-900"
                      : "bg-orange-100 text-orange-900"
                  }`}
                >
                  {partner.code}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">{partner.name}</h2>
                  <span className="text-[10px] text-stone-500 font-mono">Code: {partner.code}</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                Active Partner
              </span>
            </div>

            {/* Services pills */}
            <div className="flex flex-wrap gap-1.5">
              {partner.services.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Contract specific details */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
              {isDomestic ? (
                <>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-[11px]">Contract Ref:</span>
                    <span className="font-semibold text-stone-800 font-mono">
                      {(partner as PartnerDomestic).contractRef}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-[11px]">Account No:</span>
                    <span className="font-semibold text-stone-800 font-mono">
                      {(partner as PartnerDomestic).accountNo}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-[11px]">Contract Ref:</span>
                    <span className="font-semibold text-stone-800 font-mono">
                      {(partner as PartnerInternational).contractRef}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span className="text-[11px]">Volumetric Divisor:</span>
                    <span className="font-semibold text-stone-800 font-mono">
                      {(partner as PartnerInternational).volumetricDivisor} (standard)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Contact Details */}
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-stone-400" />
                <span>{partner.contactName || "Account Manager"}</span>
              </div>
              <div className="flex items-center gap-3">
                {partner.phone && (
                  <span className="font-mono text-stone-700">{partner.phone}</span>
                )}
                {partner.email && (
                  <span className="text-purple-700 underline">{partner.email}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD PARTNER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <h2 className="text-base font-bold text-stone-900">
              Add New {isDomestic ? "Domestic Courier" : "International Carrier"}
            </h2>
            <form onSubmit={handleSavePartner} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. M&P Courier or DHL Express"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Carrier Short Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP or DHL"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Key Account Manager</label>
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="021-..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                </div>
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
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
