import React, { useState } from "react";
import {
  FolderArchive,
  FileText,
  Search,
  ExternalLink,
  Calendar,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { WorkspaceType, StoredDocument } from "../types";

interface DocumentLibraryViewProps {
  activeWorkspace: WorkspaceType;
  domesticDocs: StoredDocument[];
  internationalDocs: StoredDocument[];
  onOpenTariffDetails: (tariffId: string) => void;
}

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  activeWorkspace,
  domesticDocs,
  internationalDocs,
  onOpenTariffDetails,
}) => {
  const isDomestic = activeWorkspace === "domestic";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);

  const docs = (isDomestic ? domesticDocs : internationalDocs).filter((d) =>
    d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.tariffName && d.tariffName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div id="document-library-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">
              {isDomestic ? "Domestic Document Archive" : "International Rate Card Archive"}
            </h1>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isDomestic ? "bg-lime-100 text-lime-800" : "bg-orange-100 text-orange-800"
              }`}
            >
              Audit Traceability Store
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Every calculated rate and tariff version links back to the original preserved file record.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by filename, courier, or tariff agreement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800"
          />
        </div>
      </div>

      {/* Document Records Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/60 text-stone-600 font-bold">
                <th className="py-3 px-4">Document File</th>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Associated Tariff</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Extraction Method</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No documents stored in this workspace yet.
                  </td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-700 shrink-0" />
                        <div>
                          <p className="font-bold text-stone-900">{doc.filename}</p>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {(doc.fileSize / 1024).toFixed(1)} KB • {doc.fileType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      {doc.partnerName}
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.tariffId ? (
                        <button
                          type="button"
                          onClick={() => onOpenTariffDetails(doc.tariffId!)}
                          className="text-purple-700 hover:underline font-semibold flex items-center gap-1"
                        >
                          <span>{doc.tariffName || doc.tariffId}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-stone-400 italic">Unlinked</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600">
                      {doc.uploadedAt.split("T")[0]}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-mono text-[10px]">
                        {doc.extractionStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.reviewStatus === "user_verified"
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.reviewStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedDoc(doc)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-base font-bold text-stone-900">{selectedDoc.filename}</h2>
                <p className="text-xs text-stone-500">
                  Partner: {selectedDoc.partnerName} • ID: {selectedDoc.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-xs text-stone-500 hover:text-stone-800 px-3 py-1 bg-stone-100 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400">Upload Date:</span>
                  <p className="font-mono font-bold text-stone-800">{selectedDoc.uploadedAt}</p>
                </div>
                <div>
                  <span className="text-stone-400">Review Status:</span>
                  <p className="font-bold text-green-700">{selectedDoc.reviewStatus.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-stone-700 mb-1">Preserved Raw Text Sample / OCR Excerpt:</p>
                <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64">
                  {selectedDoc.rawTextSample || "Binary spreadsheet or document content stored securely."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
