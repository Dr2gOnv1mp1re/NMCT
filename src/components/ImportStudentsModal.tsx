"use client";

import React, { useState, useRef } from "react";
import { importStudents } from "@/app/actions";
import * as XLSX from "xlsx";

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
  address?: string;
  motherName?: string;
  motherOccupation?: string;
  fatherName?: string;
  fatherOccupation?: string;
  fatherAlive?: boolean;
  fatherDifferentlyAbled?: boolean;
  motherAlive?: boolean;
  motherDifferentlyAbled?: boolean;
  state?: string;
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

  // Tuition Enrollment and Monthly Attendance State
  const [goesToTuition, setGoesToTuition] = useState(false);
  const [logInitialAttendance, setLogInitialAttendance] = useState(false);
  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [attendanceDaysPresent, setAttendanceDaysPresent] = useState(20);
  const [attendanceDaysTotal, setAttendanceDaysTotal] = useState(22);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const lowerName = selectedFile.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls") && !lowerName.endsWith(".xslx")) {
      setError("Please upload a standard Excel (.xlsx, .xls, .xslx) or CSV file.");
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          setError("The selected file is empty.");
          return;
        }

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        let defaultVillageFromSheet = "";
        if (sheetName && !/^sheet\d+$/i.test(sheetName.trim())) {
          const rawName = sheetName.trim();
          defaultVillageFromSheet = rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
        }

        if (sheetName && sheetName.toLowerCase().trim() === "sheet2") {
          setGoesToTuition(true);
        } else {
          setGoesToTuition(false);
        }
        
        // Parse raw rows as Array of Arrays
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rows.length < 2) {
          setError("The file must contain a header row and at least one student record.");
          return;
        }

        // Find the first row that contains expected student headers
        let headerRowIndex = -1;
        let parsedHeaders: string[] = [];

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const rowData = rows[r];
          if (!rowData || !Array.isArray(rowData)) continue;

          const candidateHeaders = Array.from(rowData).map((h) =>
            String(h || "").toLowerCase().replace(/[\s_.]/g, "")
          );

          // Check if this row looks like a header row
          const hasChildName = candidateHeaders.some((h) => h && (h.includes("childname") || h === "name" || h.includes("studentname")));
          const hasSchool = candidateHeaders.some((h) => h && h.includes("school"));
          const hasClass = candidateHeaders.some((h) => h && h.includes("class"));

          if (hasChildName && (hasSchool || hasClass)) {
            headerRowIndex = r;
            parsedHeaders = candidateHeaders;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Fallback: If no custom title rows detected, use row 0
          parsedHeaders = Array.from(rows[0] || []).map((h) =>
            String(h || "").toLowerCase().replace(/[\s_.]/g, "")
          );
          headerRowIndex = 0;
        }

        // Validate required headers (Only require core identity fields from template)
        const requiredFields = [
          "name",
          "dob",
          "class",
          "school",
        ];

        const missingFields = requiredFields.filter((req) => {
          if (req === "name") {
            return !parsedHeaders.some((h) => h && (h.includes("name") || h.includes("child")));
          }
          if (req === "dob") {
            const hasDobHeader = parsedHeaders.some((h) => h && (h.includes("dob") || h.includes("birth") || h.includes("date")));
            const isIndex3Empty = parsedHeaders[3] === "" || parsedHeaders[3] === undefined;
            return !(hasDobHeader || isIndex3Empty);
          }
          return !parsedHeaders.some((h) => h && (h.includes(req) || req.includes(h)));
        });

        if (missingFields.length > 0) {
          setError(
            `Missing columns in spreadsheet: ${missingFields
              .map((f) => f.toUpperCase())
              .join(", ")}. Please align your headers with the template.`
          );
          return;
        }

        // Map column indices
        const getIndex = (name: string) => {
          if (name === "name") {
            const idx = parsedHeaders.findIndex((h) => h && (h.includes("childname") || h === "name" || h.includes("studentname")));
            if (idx !== -1) return idx;
          }
          return parsedHeaders.findIndex((h) => h && (h.includes(name) || name.includes(h)));
        };

        const idxName = getIndex("name");
        let idxDob = getIndex("dob");
        if (idxDob === -1) {
          if (parsedHeaders[3] === "" || parsedHeaders[3] === undefined) {
            idxDob = 3;
          }
        }
        const idxGender = getIndex("gender");
        const idxTribe = getIndex("tribe");
        const idxAadhaar = getIndex("aadhaar");
        const idxGuardianName = getIndex("guardianname");
        const idxGuardianPhone = getIndex("guardianphone");
        const idxSchool = getIndex("school");
        const idxClass = getIndex("class");
        const idxVillage = getIndex("village");
        const idxAddress = getIndex("address");
        const idxState = getIndex("state");

        // Dynamic relative mapping for dual columns:
        const idxMotherName = parsedHeaders.indexOf("mothername");
        
        let idxMotherOcc = -1;
        if (idxMotherName !== -1) {
          for (let j = idxMotherName + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("occupation")) {
              idxMotherOcc = j;
              break;
            }
          }
        }

        const idxFatherName = parsedHeaders.indexOf("fathername");
        let idxFatherOcc = -1;
        if (idxFatherName !== -1) {
          for (let j = idxFatherName + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("occupation")) {
              idxFatherOcc = j;
              break;
            }
          }
        }

        // Find second occurrence of father for relationship
        let idxFatherRel = -1;
        if (idxFatherName !== -1) {
          for (let j = idxFatherName + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("father")) {
              idxFatherRel = j;
              break;
            }
          }
        }

        let idxFatherAlive = -1;
        let idxFatherDiff = -1;
        if (idxFatherRel !== -1) {
          for (let j = idxFatherRel + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("alive") && idxFatherAlive === -1) {
              idxFatherAlive = j;
            } else if (parsedHeaders[j].includes("differentlyabled") && idxFatherDiff === -1) {
              idxFatherDiff = j;
            }
          }
        }

        // Find second occurrence of mother for relationship
        let idxMotherRel = -1;
        if (idxMotherName !== -1) {
          for (let j = idxMotherName + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("mother")) {
              idxMotherRel = j;
              break;
            }
          }
        }

        let idxMotherAlive = -1;
        let idxMotherDiff = -1;
        if (idxMotherRel !== -1) {
          for (let j = idxMotherRel + 1; j < parsedHeaders.length; j++) {
            if (parsedHeaders[j].includes("alive") && idxMotherAlive === -1) {
              idxMotherAlive = j;
            } else if (parsedHeaders[j].includes("differentlyabled") && idxMotherDiff === -1) {
              idxMotherDiff = j;
            }
          }
        }

        const studentsList: ParsedStudent[] = [];
        let currentRunningVillage = defaultVillageFromSheet;

        // Parse data rows starting after header row
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const rowCells = rows[i];
          if (!rowCells) continue;

          // Check if this row is a section break/village header
          const nonSecCells = rowCells.filter(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");
          if (nonSecCells.length === 1) {
            const cellVal = String(nonSecCells[0]).trim();
            const match = cellVal.match(/^\d+\s*\.\s*([A-Za-z\s\-]+)$/);
            if (match) {
              const rawName = match[1].trim();
              currentRunningVillage = rawName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
              continue; // Skip processing this row as a student record
            }
          }

          if (rowCells.length < 3) continue; // skip blank/invalid rows

          const rowErrors: string[] = [];

          const nameVal = String(rowCells[idxName] || "").trim();
          
          // DOB parsing (supporting SheetJS Date objects or raw text strings)
          const rawDob = rowCells[idxDob];
          let dobVal = "";
          if (rawDob instanceof Date) {
            dobVal = rawDob.toISOString().split("T")[0];
          } else {
            const rawStr = String(rawDob || "").trim();
            const dmyMatch = rawStr.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/);
            if (dmyMatch) {
              const day = dmyMatch[1].padStart(2, "0");
              const month = dmyMatch[2].padStart(2, "0");
              const year = dmyMatch[3];
              dobVal = `${year}-${month}-${day}`;
            } else {
              const ymdMatch = rawStr.match(/^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})$/);
              if (ymdMatch) {
                const year = ymdMatch[1];
                const month = ymdMatch[2].padStart(2, "0");
                const day = ymdMatch[3].padStart(2, "0");
                dobVal = `${year}-${month}-${day}`;
              } else {
                dobVal = rawStr;
              }
            }
          }

          let genderVal = idxGender !== -1 ? String(rowCells[idxGender] || "").toUpperCase().trim() : "OTHER";
          const tribeVal = idxTribe !== -1 ? String(rowCells[idxTribe] || "").trim() : "Not Recorded";
          const aadhaarVal = idxAadhaar !== -1 ? String(rowCells[idxAadhaar] || "").replace(/\D/g, "") : "";
          const guardianNameVal = idxGuardianName !== -1 ? String(rowCells[idxGuardianName] || "").trim() : "Not Recorded";
          const guardianPhoneVal = idxGuardianPhone !== -1 ? String(rowCells[idxGuardianPhone] || "").trim() : "";
          const schoolVal = String(rowCells[idxSchool] || "").trim();
          const classVal = String(rowCells[idxClass] || "").trim();
          
          let villageVal = idxVillage !== -1 ? String(rowCells[idxVillage] || "").trim() : "";
          if ((!villageVal || villageVal === "Not Recorded") && currentRunningVillage) {
            villageVal = currentRunningVillage;
          }
          if (!villageVal) {
            villageVal = "Not Recorded";
          }
          
          const addressVal = idxAddress !== -1 ? String(rowCells[idxAddress] || "").trim() : "";
          const motherNameVal = idxMotherName !== -1 ? String(rowCells[idxMotherName] || "").trim() : "";
          const motherOccVal = idxMotherOcc !== -1 ? String(rowCells[idxMotherOcc] || "").trim() : "";
          const fatherNameVal = idxFatherName !== -1 ? String(rowCells[idxFatherName] || "").trim() : "";
          const fatherOccVal = idxFatherOcc !== -1 ? String(rowCells[idxFatherOcc] || "").trim() : "";
          const stateVal = idxState !== -1 ? String(rowCells[idxState] || "").trim() : undefined;

          // Boolean flags: default to true/false respectively
          const fatherAliveVal = idxFatherAlive !== -1 ? String(rowCells[idxFatherAlive] || "").toLowerCase().includes("yes") || String(rowCells[idxFatherAlive] || "").toLowerCase().includes("true") || String(rowCells[idxFatherAlive] || "") === "1" || String(rowCells[idxFatherAlive] || "") === "" : true;
          const fatherDiffVal = idxFatherDiff !== -1 ? String(rowCells[idxFatherDiff] || "").toLowerCase().includes("yes") || String(rowCells[idxFatherDiff] || "").toLowerCase().includes("true") || String(rowCells[idxFatherDiff] || "") === "1" : false;
          const motherAliveVal = idxMotherAlive !== -1 ? String(rowCells[idxMotherAlive] || "").toLowerCase().includes("yes") || String(rowCells[idxMotherAlive] || "").toLowerCase().includes("true") || String(rowCells[idxMotherAlive] || "") === "1" || String(rowCells[idxMotherAlive] || "") === "" : true;
          const motherDiffVal = idxMotherDiff !== -1 ? String(rowCells[idxMotherDiff] || "").toLowerCase().includes("yes") || String(rowCells[idxMotherDiff] || "").toLowerCase().includes("true") || String(rowCells[idxMotherDiff] || "") === "1" : false;

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

          if (!schoolVal) rowErrors.push("School is required");
          if (!classVal) rowErrors.push("Class is required");

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
            address: addressVal || undefined,
            motherName: motherNameVal || undefined,
            motherOccupation: motherOccVal || undefined,
            fatherName: fatherNameVal || undefined,
            fatherOccupation: fatherOccVal || undefined,
            fatherAlive: fatherAliveVal,
            fatherDifferentlyAbled: fatherDiffVal,
            motherAlive: motherAliveVal,
            motherDifferentlyAbled: motherDiffVal,
            state: stateVal || undefined,
            isValid: rowErrors.length === 0,
            errors: rowErrors,
          });
        }

        setParsedData(studentsList);
      } catch (err) {
        console.error("File reading error:", err);
        setError("An error occurred while reading the file.");
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleConfirmImport = async () => {
    const studentsToImport = parsedData.filter((s) => s.name && s.name.trim() !== "");
    if (studentsToImport.length === 0) {
      setError("No student records to import.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await importStudents({
        students: studentsToImport.map((s) => ({
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
          address: s.address,
          motherName: s.motherName,
          motherOccupation: s.motherOccupation,
          fatherName: s.fatherName,
          fatherOccupation: s.fatherOccupation,
          fatherAlive: s.fatherAlive,
          fatherDifferentlyAbled: s.fatherDifferentlyAbled,
          motherAlive: s.motherAlive,
          motherDifferentlyAbled: s.motherDifferentlyAbled,
          state: s.state,
          goesToTuition: goesToTuition,
        })),
        assignedOfficerId,
        initialAttendance: logInitialAttendance ? {
          month: attendanceMonth,
          year: attendanceYear,
          daysPresent: attendanceDaysPresent,
          daysTotal: attendanceDaysTotal,
        } : undefined,
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
                <p className="text-xs text-slate-400 mt-1">Accepts .xlsx, .xls, or .csv files</p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv, .xlsx, .xls"
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

              {/* Tuition Enrollment & Initial Attendance Options */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 text-xs mt-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="goesToTuition"
                    checked={goesToTuition}
                    onChange={(e) => setGoesToTuition(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="goesToTuition" className="font-semibold text-slate-700 cursor-pointer select-none">
                    Mark these students as enrolled in the Tuition Program
                  </label>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="logInitialAttendance"
                      checked={logInitialAttendance}
                      onChange={(e) => setLogInitialAttendance(e.target.checked)}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="logInitialAttendance" className="font-semibold text-slate-700 cursor-pointer select-none">
                      Initialize monthly attendance record for these students?
                    </label>
                  </div>

                  {logInitialAttendance && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 p-3 bg-white border border-slate-200 rounded-lg animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Month
                        </label>
                        <select
                          value={attendanceMonth}
                          onChange={(e) => setAttendanceMonth(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1.5 bg-white cursor-pointer focus:outline-none"
                        >
                          <option value={1}>January</option>
                          <option value={2}>February</option>
                          <option value={3}>March</option>
                          <option value={4}>April</option>
                          <option value={5}>May</option>
                          <option value={6}>June</option>
                          <option value={7}>July</option>
                          <option value={8}>August</option>
                          <option value={9}>September</option>
                          <option value={10}>October</option>
                          <option value={11}>November</option>
                          <option value={12}>December</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          value={attendanceYear}
                          onChange={(e) => setAttendanceYear(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Days Present
                        </label>
                        <input
                          type="number"
                          value={attendanceDaysPresent}
                          onChange={(e) => setAttendanceDaysPresent(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Total Days
                        </label>
                        <input
                          type="number"
                          value={attendanceDaysTotal}
                          onChange={(e) => setAttendanceDaysTotal(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
              className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#152e72] text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={loading || parsedData.filter(s => s.name && s.name.trim() !== "").length === 0}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing…
                </>
              ) : (
                `Import All ${parsedData.filter(s => s.name && s.name.trim() !== "").length} Students`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
