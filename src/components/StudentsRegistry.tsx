"use client";

import React, { useState, useEffect } from "react";
import AddStudentButton from "@/components/AddStudentButton";
import Sidebar from "@/components/Sidebar";
import ImportStudentsModal from "@/components/ImportStudentsModal";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { deleteStudent, bulkDeleteStudents, bulkUpdateStudentStatus } from "@/app/actions";

interface StudentWithRelations {
  id: string;
  name: string;
  dob: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  tribe: string;
  aadhaarLast4: string | null;
  guardianName: string;
  guardianPhone: string | null;
  school: string;
  currentClass: string;
  district: string;
  village: string;
  status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED";
  createdAt: Date;
  updatedAt: Date;
  isTribal?: boolean;
  photoUrl?: string | null;
  goesToTuition?: boolean;
  address?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  fatherAlive?: boolean;
  fatherDifferentlyAbled?: boolean;
  motherAlive?: boolean;
  motherDifferentlyAbled?: boolean;
  state?: string | null;
}

interface StudentsRegistryProps {
  students: StudentWithRelations[];
  officerId: string;
  officerName: string;
  officerDistrict: string;
}

export default function StudentsRegistry({
  students,
  officerId,
  officerName,
  officerDistrict,
}: StudentsRegistryProps) {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All levels");
  const [status, setStatus] = useState("All statuses");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [tribeCategory, setTribeCategory] = useState("All categories");
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset to first page when search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, level, status, tribeCategory]);

  // Filter students based on search, level standard range, and status
  const filteredStudents = students.filter((s) => {
    // 1. Search term match
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.village.toLowerCase().includes(search.toLowerCase()) ||
      s.school.toLowerCase().includes(search.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(search.toLowerCase());

    // 2. Class/Level range match
    let matchesLevel = true;
    if (level !== "All levels") {
      const cls = s.currentClass.toLowerCase().trim();
      const parsedNum = parseInt(cls.replace(/\D/g, ""), 10);
      const hasNumber = !isNaN(parsedNum);

      if (level === "Std 1-5") {
        if (hasNumber) {
          matchesLevel = parsedNum >= 1 && parsedNum <= 5;
        } else {
          matchesLevel =
            cls.includes("first") ||
            cls.includes("second") ||
            cls.includes("third") ||
            cls.includes("fourth") ||
            cls.includes("fifth") ||
            cls.includes("primary");
        }
      } else if (level === "Std 6-8") {
        if (hasNumber) {
          matchesLevel = parsedNum >= 6 && parsedNum <= 8;
        } else {
          matchesLevel =
            cls.includes("sixth") ||
            cls.includes("seventh") ||
            cls.includes("eighth") ||
            cls.includes("middle");
        }
      } else if (level === "Std 9-10") {
        if (hasNumber) {
          matchesLevel = parsedNum >= 9 && parsedNum <= 10;
        } else {
          matchesLevel =
            cls.includes("ninth") ||
            cls.includes("tenth") ||
            cls.includes("secondary");
        }
      } else if (level === "Std 11-12") {
        if (hasNumber) {
          matchesLevel = parsedNum >= 11 && parsedNum <= 12;
        } else {
          matchesLevel =
            cls.includes("eleventh") ||
            cls.includes("twelfth") ||
            cls.includes("higher secondary") ||
            cls.includes("highersec") ||
            cls.includes("hrsec") ||
            cls.includes("hr.sec");
        }
      } else if (level === "College") {
        if (hasNumber) {
          matchesLevel = parsedNum > 12;
        } else {
          matchesLevel =
            cls.includes("college") ||
            cls.includes("university") ||
            cls.includes("higher ed") ||
            cls.includes("highereducation") ||
            cls.includes("degree") ||
            cls.includes("graduation");
        }
      }
    }

    // 3. Status match
    const matchesStatus = status === "All statuses" || s.status === status;

    // 4. Tribe Category match
    const matchesTribeCategory =
      tribeCategory === "All categories" ||
      (tribeCategory === "Tribal" && s.isTribal) ||
      (tribeCategory === "Non-Tribal" && !s.isTribal);

    return matchesSearch && matchesLevel && matchesStatus && matchesTribeCategory;
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;



  // Export to Excel file (.xlsx)
  const handleExportExcel = () => {
    if (students.length === 0) return alert("No student records to export.");
    const headers = [
      "SNO",
      "Child Name",
      "Address",
      "D.O.B",
      "Class",
      "School",
      "Mother Name",
      "Mother Occupation",
      "Father Name",
      "Father Occupation",
      "Father Alive",
      "Father Differently Abled",
      "Mother Alive",
      "Mother Differently Abled",
      "Gender",
      "Tribe",
      "AadhaarLast4",
      "Guardian Name",
      "Guardian Phone",
      "Village",
      "District",
      "State",
      "Status",
    ];
    const rows = students.map((s, idx) => [
      (idx + 1).toString(),
      s.name,
      s.address || "",
      s.dob ? new Date(s.dob).toISOString().split("T")[0] : "",
      s.currentClass,
      s.school,
      s.motherName || "",
      s.motherOccupation || "",
      s.fatherName || "",
      s.fatherOccupation || "",
      s.fatherAlive !== false ? "Yes" : "No",
      s.fatherDifferentlyAbled ? "Yes" : "No",
      s.motherAlive !== false ? "Yes" : "No",
      s.motherDifferentlyAbled ? "Yes" : "No",
      s.gender,
      s.tribe,
      s.aadhaarLast4 || "",
      s.guardianName,
      s.guardianPhone || "",
      s.village,
      s.district,
      s.state || "Tamil Nadu",
      s.status,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `student_registry_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF file (.pdf)
  const handleExportPDF = () => {
    if (students.length === 0) return alert("No student records to export.");
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NMCT Student Registry", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const headers = [
      "S.No",
      "Name",
      "Class",
      "School",
      "Father Name",
      "Mother Name",
      "Village/Town",
      "District",
      "State",
      "Status",
    ];

    const rows = students.map((s, idx) => [
      (idx + 1).toString(),
      s.name,
      s.currentClass,
      s.school,
      s.fatherName || "",
      s.motherName || "",
      s.village,
      s.district,
      s.state || "Tamil Nadu",
      s.status,
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
    });

    doc.save(`student_registry_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} searchValue={search} onSearchChange={setSearch} />

        {/* Content Body */}
        <main className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-7xl w-full mx-auto text-left">
          {/* Page Title & Registry Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Students</h2>
              <p className="text-sm text-slate-500 mt-1">
                {students.length} enrolled · {filteredStudents.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2"
              >
                <span>📥</span>
                <span>Import</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                  className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2"
                >
                  <span>📤</span>
                  <span>Export</span>
                  <span className="text-[9px] text-slate-400">▼</span>
                </button>
                {isExportDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsExportDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-slate-700">
                      <button
                        onClick={() => {
                          handleExportExcel();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <span>📊</span> Export to Excel (.xlsx)
                      </button>
                      <button
                        onClick={() => {
                          handleExportPDF();
                          setIsExportDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 transition flex items-center gap-2"
                      >
                        <span>📕</span> Export to PDF (.pdf)
                      </button>
                    </div>
                  </>
                )}
              </div>

              <AddStudentButton
                assignedOfficerId={officerId}
                defaultDistrict={officerDistrict}
                className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <span>+</span>
                <span>Add Student</span>
              </AddStudentButton>
            </div>
          </div>

          {/* Search/Filter Bar matching screenshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center gap-4">
            {/* Realtime Search Input */}
            <div className="flex-1 min-w-[280px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name, village, school, guardian..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Level Dropdown */}
            <div className="w-48 relative">
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-white cursor-pointer"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="All levels">All levels</option>
                <option value="Std 1-5">Primary (Std 1-5)</option>
                <option value="Std 6-8">Middle (Std 6-8)</option>
                <option value="Std 9-10">Secondary (Std 9-10)</option>
                <option value="Std 11-12">Higher Secondary (Std 11-12)</option>
                <option value="College">College / Higher Ed</option>
              </select>
            </div>

            {/* Filter Status Dropdown */}
            <div className="w-48 relative">
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-white cursor-pointer"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="All statuses">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="AT_RISK">At Risk</option>
                <option value="DROPPED_OUT">Dropped Out</option>
                <option value="MIGRATED">Migrated</option>
                <option value="GRADUATED">Graduated</option>
              </select>
            </div>

            {/* Filter Tribe Category Dropdown */}
            <div className="w-48 relative">
              <select
                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-white cursor-pointer"
                value={tribeCategory}
                onChange={(e) => setTribeCategory(e.target.value)}
              >
                <option value="All categories">All categories</option>
                <option value="Tribal">Tribal Students</option>
                <option value="Non-Tribal">Non-Tribal Students</option>
              </select>
            </div>
          </div>

          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/20 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150 text-[#0F172A]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#1E3A8A]">
                  {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-500 hover:text-slate-700 underline ml-2"
                >
                  Deselect all
                </button>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 font-medium">Change Status:</span>
                  <select
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      if (!newStatus) return;
                      if (window.confirm(`Are you sure you want to change the status of ${selectedIds.length} students to ${newStatus}?`)) {
                        const res = await bulkUpdateStudentStatus(selectedIds, newStatus as any, officerId, officerName);
                        if (res.success) {
                          alert("Status updated successfully!");
                          setSelectedIds([]);
                          window.location.reload();
                        } else {
                          alert(res.error || "Failed to update status.");
                        }
                      }
                      e.target.value = "";
                    }}
                    className="text-xs border border-slate-200 rounded p-1 bg-white cursor-pointer focus:outline-none"
                  >
                    <option value="">Choose status...</option>
                    <option value="ACTIVE">Active</option>
                    <option value="AT_RISK">At Risk</option>
                    <option value="DROPPED_OUT">Dropped Out</option>
                    <option value="MIGRATED">Migrated</option>
                    <option value="GRADUATED">Graduated</option>
                  </select>
                </div>
                
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected students? This will back up all records locally.`)) {
                      const res = await bulkDeleteStudents(selectedIds, officerId, officerName);
                      if (res.success) {
                        alert("Students deleted successfully!");
                        setSelectedIds([]);
                        window.location.reload();
                      } else {
                        alert(res.error || "Failed to delete students.");
                      }
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#BE123C] hover:bg-[#9F1239] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Registry Table List */}
          {filteredStudents.length === 0 ? (
            /* Empty State Card exactly matching the Lovable screenshot */
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center flex flex-col items-center justify-center space-y-2">
              <p className="text-sm font-medium text-slate-500">
                No students match. Click &quot;Add Student&quot; to start.
              </p>
            </div>
          ) : (
            /* Student table list with all details */
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-6 w-12">
                        <input
                          type="checkbox"
                          checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedIds.includes(s.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = [...selectedIds];
                              paginatedStudents.forEach(s => {
                                if (!newSelected.includes(s.id)) newSelected.push(s.id);
                              });
                              setSelectedIds(newSelected);
                            } else {
                              setSelectedIds(selectedIds.filter(id => !paginatedStudents.some(s => s.id === id)));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="py-3.5 px-6">S.No</th>
                      <th className="py-3.5 px-6">Child Name</th>
                      <th className="py-3.5 px-6">Address</th>
                      <th className="py-3.5 px-6">Village</th>
                      <th className="py-3.5 px-6">District</th>
                      <th className="py-3.5 px-6">D.O.B</th>
                      <th className="py-3.5 px-6">Class</th>
                      <th className="py-3.5 px-6">School</th>
                      <th className="py-3.5 px-6">{"Mother's Details"}</th>
                      <th className="py-3.5 px-6">{"Father's Details"}</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-6">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, student.id]);
                              } else {
                                setSelectedIds(selectedIds.filter(id => id !== student.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                          {startIndex + idx + 1}
                        </td>
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          <Link href={`/students/${student.id}`} className="text-sky-600 hover:text-sky-800 hover:underline">
                            {student.name}
                          </Link>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 max-w-[200px] truncate" title={student.address || ""}>
                          {student.address || "—"}
                        </td>
                        {(() => {
                          const cleanVillage = student.village?.trim();
                          const cleanDistrict = student.district?.trim();
                          let resolvedVillage = cleanVillage || "Not Recorded";
                          let resolvedDistrict = cleanDistrict || "Not Recorded";

                          if (!cleanVillage && !cleanDistrict) {
                            resolvedVillage = "Not Recorded";
                            resolvedDistrict = "Not Recorded";
                          } else if (cleanVillage && (!cleanDistrict || cleanDistrict.toLowerCase() === "not recorded" || cleanDistrict === "—")) {
                            // Find match in other students
                            const match = students.find(
                              (s) => s.village && s.district && s.village.trim().toLowerCase() === cleanVillage.toLowerCase() && s.district.trim().toLowerCase() !== "not recorded" && s.district.trim() !== "—"
                            );
                            if (match) {
                              resolvedDistrict = match.district.trim();
                            } else {
                              const lowerVillage = cleanVillage.toLowerCase();
                              const nilgirisVillages = [
                                "gopanari", "maanaar", "alamarameedu", "kaliyur", "aalangandi",
                                "seenguli", "senkuttai", "senkullai", "thudiyalur", "melur",
                                "pudur", "kallur", "mattathukadu", "mattathukkadu"
                              ];
                              if (nilgirisVillages.some(v => lowerVillage.includes(v))) {
                                resolvedDistrict = "Nilgiris";
                              }
                            }
                          }

                          return (
                            <>
                              <td className="py-3.5 px-6 text-slate-600 font-medium">
                                {resolvedVillage}
                              </td>
                              <td className="py-3.5 px-6 text-slate-600 font-medium">
                                {resolvedDistrict}
                              </td>
                            </>
                          );
                        })()}
                        <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                          {student.dob ? new Date(student.dob).toISOString().split("T")[0] : "—"}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                          {student.currentClass}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 font-medium">{student.school}</td>
                        <td className="py-3.5 px-6 text-slate-600">
                          <p className="font-medium text-slate-700">{student.motherName || "—"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {student.motherOccupation || "No Occupation"} · {student.motherAlive !== false ? "Alive" : "Deceased"}
                            {student.motherDifferentlyAbled ? " · Diff. Abled" : ""}
                          </p>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          <p className="font-medium text-slate-700">{student.fatherName || "—"}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {student.fatherOccupation || "No Occupation"} · {student.fatherAlive !== false ? "Alive" : "Deceased"}
                            {student.fatherDifferentlyAbled ? " · Diff. Abled" : ""}
                          </p>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold py-1 px-2.5 rounded-full ${
                                student.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : student.status === "AT_RISK"
                                  ? "bg-amber-50 text-amber-700"
                                  : student.status === "DROPPED_OUT"
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {student.status}
                            </span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to permanently delete ${student.name}? This will log a backup locally in deleted_students.json.`)) {
                                  try {
                                    const res = await deleteStudent(student.id, officerId, officerName);
                                    if (res.success) {
                                      alert("Student deleted successfully!");
                                      window.location.reload();
                                    } else {
                                      alert(res.error || "Failed to delete student.");
                                    }
                                  } catch (err) {
                                    console.error("Deletion error:", err);
                                    alert("An error occurred during deletion.");
                                  }
                                }
                              }}
                              className="text-xs text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded transition cursor-pointer"
                              title={`Delete ${student.name}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer Controls */}
              <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between text-slate-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Showing <span className="font-semibold text-slate-800">{Math.min(startIndex + 1, filteredStudents.length)}</span> to{" "}
                      <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredStudents.length)}</span> of{" "}
                      <span className="font-semibold text-slate-800">{filteredStudents.length}</span> students
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-2xs -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return (
                              <span
                                key={pageNum}
                                className="relative inline-flex items-center px-3 py-2 border border-slate-200 bg-white text-xs font-semibold text-slate-400 select-none"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-3.5 py-2 border text-xs font-semibold transition ${
                              currentPage === pageNum
                                ? "z-10 bg-indigo-50/70 border-indigo-500 text-indigo-600 font-bold"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CSV Import Modal Overlay */}
      {isImportOpen && (
        <ImportStudentsModal
          assignedOfficerId={officerId}
          defaultDistrict={officerDistrict}
          onClose={() => setIsImportOpen(false)}
        />
      )}
    </div>
  );
}
