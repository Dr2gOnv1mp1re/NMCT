"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import AddStudentButton from "@/components/AddStudentButton";
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
  dbtRecords: unknown[];
}

interface DashboardContentProps {
  students: StudentWithRelations[];
  officerId: string;
  officerName: string;
  officerDistrict: string;
  overallStats: {
    totalStudents: number;
    activeEnrolled: number;
    atDropoutRisk: number;
    totalDisbursedAmount: number;
    pendingDBTCount: number;
  };
}

export default function DashboardContent({
  students,
  officerId,
  officerName,
  officerDistrict,
  overallStats,
}: DashboardContentProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const itemsPerPage = 10;

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Filter students based on search term (name, village, school, guardian)
  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.village || "").toLowerCase().includes(term) ||
      (s.school || "").toLowerCase().includes(term) ||
      (s.guardianName || "").toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased w-full">
      {/* Left Sidebar */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar with search bindings */}
        <Topbar
          officerName={officerName}
          searchValue={search}
          onSearchChange={setSearch}
          placeholder="Search dashboard students, villages, schools..."
        />

        {/* Inner Main Dashboard */}
        <main className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto text-left">
          {/* Welcome Header */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">
              Live overview of tribal student educational tracking and welfare distribution.
            </p>
          </div>

          {/* Ingestion & List Area */}
          {students.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/40 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-3xl text-slate-400 shadow-xs">
                🎓
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">No students enrolled yet</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Add your first tribal student to begin lifecycle tracking.
                </p>
              </div>
              <AddStudentButton
                assignedOfficerId={officerId}
                defaultDistrict={officerDistrict}
                className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-sm font-semibold py-2 px-6 rounded-lg shadow-xs transition"
              >
                Add Student
              </AddStudentButton>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">My Students Registry</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Actively tracked student lifecycle data for {officerDistrict} ({filteredStudents.length} shown)
                  </p>
                </div>
                <AddStudentButton
                  assignedOfficerId={officerId}
                  defaultDistrict={officerDistrict}
                  className="bg-[#1F3D2B] hover:bg-[#2A5038] text-white text-xs font-semibold py-1.5 px-3 rounded transition"
                />
              </div>

              {selectedIds.length > 0 && (
                <div className="mx-5 mt-4 p-4 bg-[#1E3A8A]/5 border border-[#1E3A8A]/20 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150 text-[#0F172A]">
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
                            const res = await bulkUpdateStudentStatus(selectedIds, newStatus as "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED", officerId, officerName);
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

              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No students match your search criteria.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                          <th className="py-3 px-6 w-12">
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
                          <th className="py-3 px-6">S.No</th>
                          <th className="py-3 px-6">Child Name</th>
                          <th className="py-3 px-6">Address</th>
                          <th className="py-3 px-6">Village</th>
                          <th className="py-3 px-6">District</th>
                          <th className="py-3 px-6">D.O.B</th>
                          <th className="py-3 px-6">Class</th>
                          <th className="py-3 px-6">School</th>
                          <th className="py-3 px-6">{"Mother's Details"}</th>
                          <th className="py-3 px-6">{"Father's Details"}</th>
                          <th className="py-3 px-6">Status</th>
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
                            <td className="py-3.5 px-6 text-slate-600 max-w-[150px] truncate" title={student.address || ""}>
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
                            <td className="py-3.5 px-6 text-slate-600 text-xs">
                              <p className="font-semibold text-slate-700">{student.motherName || "—"}</p>
                              <p className="text-[10px] text-slate-400">
                                {student.motherOccupation || "No Occupation"} · {student.motherAlive !== false ? "Alive" : "Deceased"}
                              </p>
                            </td>
                            <td className="py-3.5 px-6 text-slate-600 text-xs">
                              <p className="font-semibold text-slate-700">{student.fatherName || "—"}</p>
                              <p className="text-[10px] text-slate-400">
                                {student.fatherOccupation || "No Occupation"} · {student.fatherAlive !== false ? "Alive" : "Deceased"}
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
                </>
              )}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Students */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Students
                </p>
                <p className="text-3xl font-bold mt-1.5">{overallStats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                👥
              </div>
            </div>

            {/* Active Enrolled */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Enrolled
                </p>
                <p className="text-3xl font-bold mt-1.5">{overallStats.activeEnrolled}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                📈
              </div>
            </div>

            {/* At Dropout Risk */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  At Dropout Risk
                </p>
                <p className="text-3xl font-bold mt-1.5 text-rose-600">{overallStats.atDropoutRisk}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                ⚠️
              </div>
            </div>

            {/* DBT Disbursed */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  DBT Disbursed
                </p>
                <p className="text-3xl font-bold mt-1.5">₹{overallStats.totalDisbursedAmount.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-1">{overallStats.pendingDBTCount} pending</p>
              </div>
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center text-xl shadow-xs">
                🏦
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
