"use client";

import React, { useState, useRef } from "react";
import { importStudents } from "@/app/actions";

interface ImportStudentsModalProps {
  assignedOfficerId: string;
  defaultDistrict: string;
  onClose: () => void;
}

interface ParsedStudent {
  name: string;
  dob: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  tribe: string;
  aadhaarLast4?: string;
  guardianName: string;
  guardianPhone?: string;
  school: string;
  currentClass: string;
  district: string;
  village: string;
  isValid: boolean;
  errors: string[];
}

export default function ImportStudentsModal({
  assignedOfficerId,
  defaultDistrict,
  onClose,
}: ImportStudentsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse standard CSV lines, supporting quoted values
  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cell = "";
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === "," && !insideQuote) {
        result.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    result.push(cell.trim());
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a standard CSV file (export from Excel).");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setError("The selected file is empty.");
          return;
        }

        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) {
          setError("The CSV file must contain a header row and at least one student record.");
          return;
        }

        // Parse headers
        const parsedHeaders = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s_]/g, ""));

        // Validate required headers
        const requiredFields = [
          "name",
          "dob",
          "gender",
          "tribe",
          "guardianname",
          "school",
          "class",
          "village",
        ];

        const missingFields = requiredFields.filter(
          (req) => !parsedHeaders.some((h) => h.includes(req) || req.includes(h))
        );

        if (missingFields.length > 0) {
          setError(
            `Missing columns in CSV file: ${missingFields
              .map((f) => f.toUpperCase())
              .join(", ")}. Please align your headers with the template.`
          );
          return;
        }

        // Map column indices
        const getIndex = (name: string) =>
          parsedHeaders.findIndex((h) => h.includes(name) || name.includes(h));

        const idxName = getIndex("name");
        const idxDob = getIndex("dob");
        const idxGender = getIndex("gender");
        const idxTribe = getIndex("tribe");
        const idxAadhaar = getIndex("aadhaar");
        const idxGuardianName = getIndex("guardianname");
        const idxGuardianPhone = getIndex("guardianphone");
        const idxSchool = getIndex("school");
        const idxClass = getIndex("class");
        const idxVillage = getIndex("village");

        const studentsList: ParsedStudent[] = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const rowCells = parseCSVLine(lines[i]);
          if (rowCells.length < 3) continue; // skip blank/invalid rows

          const rowErrors: string[] = [];

          const nameVal = rowCells[idxName] || "";
          const dobVal = rowCells[idxDob] || "";
          let genderVal = (rowCells[idxGender] || "").toUpperCase().trim();
          const tribeVal = rowCells[idxTribe] || "";
          const aadhaarVal = idxAadhaar !== -1 ? (rowCells[idxAadhaar] || "").replace(/\D/g, "") : "";
          const guardianNameVal = rowCells[idxGuardianName] || "";
          const guardianPhoneVal = idxGuardianPhone !== -1 ? rowCells[idxGuardianPhone] || "" : "";
          const schoolVal = rowCells[idxSchool] || "";
          const classVal = rowCells[idxClass] || "";
          const villageVal = rowCells[idxVillage] || "";

          // Validation rules
          if (!nameVal) rowErrors.push("Name is required");
          if (!dobVal) {
            rowErrors.push("DOB is required");
          } else {
            const dateParsed = Date.parse(dobVal);
            if (isNaN(dateParsed)) {
              rowErrors.push(`Invalid DOB format: ${dobVal} (use YYYY-MM-DD)`);
            }
          }

          if (genderVal === "M" || genderVal === "MALE") {
            genderVal = "MALE";
          } else if (genderVal === "F" || genderVal === "FEMALE") {
            genderVal = "FEMALE";
          } else if (genderVal === "O" || genderVal === "OTHER" || !genderVal) {
            genderVal = "OTHER";
          } else {
            rowErrors.push(`Invalid Gender: ${genderVal} (use MALE, FEMALE, or OTHER)`);
          }

          if (!tribeVal) rowErrors.push("Tribe is required");
          if (!guardianNameVal) rowErrors.push("Guardian Name is required");
          if (!schoolVal) rowErrors.push("School is required");
          if (!classVal) rowErrors.push("Class is required");
          if (!villageVal) rowErrors.push("Village is required");

          if (aadhaarVal && aadhaarVal.length !== 4) {
            rowErrors.push("Aadhaar must be exactly 4 digits");
          }

          studentsList.push({
            name: nameVal,
            dob: dobVal,
            gender: genderVal as "MALE" | "FEMALE" | "OTHER",
            tribe: tribeVal,
            aadhaarLast4: aadhaarVal || undefined,
            guardianName: guardianNameVal,
            guardianPhone: guardianPhoneVal || undefined,
            school: schoolVal,
            currentClass: classVal,
            district: defaultDistrict,
            village: villageVal,
            isValid: rowErrors.length === 0,
            errors: rowErrors,
          });
        }

        setParsedData(studentsList);
      } catch {
        setError("An error occurred while reading the file.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleConfirmImport = async () => {
    const validStudents = parsedData.filter((s) => s.isValid);
    if (validStudents.length === 0) {
      setError("No valid student records to import.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await importStudents({
        students: validStudents.map((s) => ({
          name: s.name,
          dob: s.dob,
          gender: s.gender,
          tribe: s.tribe,
          aadhaarLast4: s.aadhaarLast4,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          school: s.school,
          currentClass: s.currentClass,
          district: s.district,
          village: s.village,
        })),
        assignedOfficerId,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to import students.");
      }
    } catch {
      setError("An unexpected error occurred during ingestion.");
    } finally {
      setLoading(false);
    }
  };

  const validCount = parsedData.filter((s) => s.isValid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] text-[#0F172A] text-left">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Import Students from Excel/CSV</h3>
            <p className="text-xs text-sky-200 mt-0.5">
              Upload spreadsheets to bulk-register student metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded text-xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
              <span>✅</span>
              <span>
                Successfully imported {validCount} students to the database! Registry reloading...
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}




          {/* File Selector */}
          {!file && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-[#1E3A8A] bg-slate-50 hover:bg-slate-100/50 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
            >
              <span className="text-4xl">📁</span>
              <div>
                <p className="text-sm font-semibold">Select Excel/CSV Student Data Sheet</p>
                <p className="text-xs text-slate-400 mt-1">Accepts standard .csv files</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Parsed Preview Table */}
          {file && parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700">Inbound File Preview</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Found {parsedData.length} records · {validCount} valid · {invalidCount} invalid
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                  }}
                  className="text-xs text-red-500 hover:underline font-semibold"
                  disabled={loading}
                >
                  Clear & Choose Different File
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-4 w-12 text-center">Status</th>
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">DOB</th>
                      <th className="py-2.5 px-4">Gender</th>
                      <th className="py-2.5 px-4">School</th>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4">Village</th>
                      <th className="py-2.5 px-4">Errors / Validation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 transition ${
                          row.isValid ? "text-slate-700" : "bg-red-50/30 text-rose-800"
                        }`}
                      >
                        <td className="py-2 px-4 text-center">
                          {row.isValid ? (
                            <span className="text-emerald-500 font-bold">✓</span>
                          ) : (
                            <span className="text-rose-500 font-bold">⚠️</span>
                          )}
                        </td>
                        <td className="py-2 px-4 font-semibold">{row.name || "—"}</td>
                        <td className="py-2 px-4 font-mono">{row.dob || "—"}</td>
                        <td className="py-2 px-4">{row.gender}</td>
                        <td className="py-2 px-4 truncate max-w-[120px]">{row.school || "—"}</td>
                        <td className="py-2 px-4 font-mono">{row.currentClass || "—"}</td>
                        <td className="py-2 px-4">{row.village || "—"}</td>
                        <td className="py-2 px-4 font-semibold italic text-rose-600">
                          {row.isValid ? (
                            <span className="text-emerald-600 not-italic font-normal">Ready</span>
                          ) : (
                            row.errors.join(", ")
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            disabled={loading}
          >
            Cancel
          </button>

          {file && parsedData.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#152e72] text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || validCount === 0}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing…
                </>
              ) : (
                `Import ${validCount} Valid Students`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
