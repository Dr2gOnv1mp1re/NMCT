"use client";

import React, { useState } from "react";
import AddStudentButton from "@/components/AddStudentButton";
import Sidebar from "@/components/Sidebar";
import ImportStudentsModal from "@/components/ImportStudentsModal";
import Link from "next/link";
import Topbar from "@/components/Topbar";

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
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [tribeCategory, setTribeCategory] = useState("All categories");

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
      const cls = s.currentClass.toLowerCase();
      if (level === "Std 1-5") {
        matchesLevel =
          cls.includes("1") ||
          cls.includes("2") ||
          cls.includes("3") ||
          cls.includes("4") ||
          cls.includes("5") ||
          cls.includes("first") ||
          cls.includes("second") ||
          cls.includes("third") ||
          cls.includes("fourth") ||
          cls.includes("fifth") ||
          cls.includes("primary");
      } else if (level === "Std 6-8") {
        matchesLevel =
          cls.includes("6") ||
          cls.includes("7") ||
          cls.includes("8") ||
          cls.includes("sixth") ||
          cls.includes("seventh") ||
          cls.includes("eighth") ||
          cls.includes("middle");
      } else if (level === "Std 9-10") {
        matchesLevel =
          cls.includes("9") ||
          cls.includes("10") ||
          cls.includes("ninth") ||
          cls.includes("tenth") ||
          cls.includes("secondary");
      } else if (level === "College") {
        matchesLevel =
          cls.includes("college") ||
          cls.includes("university") ||
          cls.includes("higher") ||
          cls.includes("degree") ||
          cls.includes("graduation");
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

  // Calculate age from DOB
  const getAge = (dobString: Date) => {
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Export to Excel-compatible CSV helper (prepending UTF-8 BOM)
  const handleExportCSV = () => {
    if (students.length === 0) return alert("No student records to export.");
    const headers = [
      "Name",
      "Age",
      "DOB",
      "Gender",
      "Tribe",
      "AadhaarLast4",
      "GuardianName",
      "GuardianPhone",
      "School",
      "Class",
      "Village",
      "District",
      "Status",
    ];
    const rows = students.map((s) => [
      s.name,
      getAge(s.dob).toString(),
      new Date(s.dob).toLocaleDateString(),
      s.gender,
      s.tribe,
      s.aadhaarLast4 || "",
      s.guardianName,
      s.guardianPhone || "",
      s.school,
      s.currentClass,
      s.village,
      s.district,
      s.status,
    ]);
    const csvContent =
      "\uFEFF" + // Excel UTF-8 BOM
      [
        headers.join(","),
        ...rows.map((e) =>
          e.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `student_registry_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-[#0F172A] font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar officerName={officerName} officerDistrict={officerDistrict} />

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Topbar officerName={officerName} />

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

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2"
              >
                <span>📤</span>
                <span>Export</span>
              </button>

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
                      <th className="py-3.5 px-6">Name</th>
                      <th className="py-3.5 px-6">Age</th>
                      <th className="py-3.5 px-6">Gender</th>
                      <th className="py-3.5 px-6">Tribe</th>
                      <th className="py-3.5 px-6">School</th>
                      <th className="py-3.5 px-6">Class</th>
                      <th className="py-3.5 px-6">Village</th>
                      <th className="py-3.5 px-6">Guardian</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition duration-150">
                        <td className="py-3.5 px-6 font-semibold text-slate-800">
                          <Link href={`/students/${student.id}`} className="text-sky-600 hover:text-sky-800 hover:underline">
                            {student.name}
                          </Link>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                          {getAge(student.dob)} yrs
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">
                          {student.gender.charAt(0) + student.gender.slice(1).toLowerCase()}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">{student.tribe}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-medium">{student.school}</td>
                        <td className="py-3.5 px-6 text-slate-500 font-mono text-xs">
                          {student.currentClass}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">{student.village}</td>
                        <td className="py-3.5 px-6 text-slate-600">
                          <p className="font-medium text-slate-700">{student.guardianName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {student.guardianPhone || "No Phone"}
                          </p>
                        </td>
                        <td className="py-3.5 px-6">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
