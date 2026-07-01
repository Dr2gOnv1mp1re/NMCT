"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logAttendance, logBulkAttendance } from "@/app/actions";


interface AttendanceRecord {
  id: string;
  month: number;
  year: number;
  daysPresent: number;
  daysTotal: number;
  percentage: number;
  createdAt: Date;
}

interface StudentWithAttendance {
  id: string;
  name: string;
  currentClass: string;
  status: "ACTIVE" | "AT_RISK" | "DROPPED_OUT" | "MIGRATED" | "GRADUATED";
  attendanceRecords: AttendanceRecord[];
}

interface AttendanceDashboardProps {
  students: StudentWithAttendance[];
  officerId: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AttendanceDashboard({
  students,
  officerId,
}: AttendanceDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "sheet">("cards");

  // Single Modal State (for card view logging)
  const [activeStudent, setActiveStudent] = useState<StudentWithAttendance | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [daysPresent, setDaysPresent] = useState(20);
  const [daysTotal, setDaysTotal] = useState(22);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk Sheet State
  const [bulkMonth, setBulkMonth] = useState(new Date().getMonth() + 1);
  const [bulkYear, setBulkYear] = useState(new Date().getFullYear());
  const [bulkTotalDays, setBulkTotalDays] = useState(22);
  const [bulkRecords, setBulkRecords] = useState<{ [studentId: string]: number }>({});
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState(false);

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.currentClass.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize bulk list with default present days
  React.useEffect(() => {
    const initialMap: { [id: string]: number } = {};
    students.forEach((s) => {
      initialMap[s.id] = 20; // Default present days
    });
    setBulkRecords(initialMap);
  }, [students]);

  const handleOpenModal = (student: StudentWithAttendance) => {
    setActiveStudent(student);
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setDaysPresent(20);
    setDaysTotal(22);
    setModalError("");
  };

  const handleCloseModal = () => {
    setActiveStudent(null);
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) return;

    const parsedYear = Number.isNaN(year) ? new Date().getFullYear() : year;
    const parsedPresent = Number.isNaN(daysPresent) ? 0 : daysPresent;
    const parsedTotal = Number.isNaN(daysTotal) ? 22 : daysTotal;

    if (parsedPresent < 0 || parsedTotal <= 0) {
      setModalError("Please enter valid days.");
      return;
    }
    if (parsedPresent > parsedTotal) {
      setModalError("Days present cannot exceed total days.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const res = await logAttendance({
        studentId: activeStudent.id,
        month,
        year: parsedYear,
        daysPresent: parsedPresent,
        daysTotal: parsedTotal,
        recordedById: officerId,
      });

      if (res.success) {
        handleCloseModal();
        startTransition(() => {
          router.refresh();
        });
      } else {
        setModalError(res.error || "Failed to log attendance");
      }
    } catch {
      setModalError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bulk Attendance Form
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setBulkError("");
    setBulkSuccess(false);

    const parsedYear = Number.isNaN(bulkYear) ? new Date().getFullYear() : bulkYear;
    const parsedTotal = Number.isNaN(bulkTotalDays) ? 22 : bulkTotalDays;

    if (parsedTotal <= 0) {
      setBulkError("Total days must be a positive number.");
      setSubmitting(false);
      return;
    }

    // Build records list to send
    const recordsToSend = students.map((s) => {
      const present = Number.isNaN(bulkRecords[s.id]) ? 20 : bulkRecords[s.id];
      return {
        studentId: s.id,
        daysPresent: Math.min(present, parsedTotal), // cap days present to total
        daysTotal: parsedTotal,
      };
    });

    try {
      const res = await logBulkAttendance({
        records: recordsToSend,
        month: bulkMonth,
        year: parsedYear,
        recordedById: officerId,
      });

      if (res.success) {
        setBulkSuccess(true);
        startTransition(() => {
          router.refresh();
        });
      } else {
        setBulkError(res.error || "Failed to save bulk attendance.");
      }
    } catch {
      setBulkError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── PDF Export ──────────────────────────────────────────────
  const exportAttendancePDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const now = new Date();
    const generatedOn = now.toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

    // ── Header band ────────────────────────────────
    doc.setFillColor(30, 58, 138); // navy #1E3A8A
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NMCT Student Tracking Portal", 14, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Attendance Report", 14, 17);
    doc.text(`Generated: ${generatedOn}`, pageW - 14, 17, { align: "right" });

    // ── Summary table ──────────────────────────────
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Student Attendance Summary", 14, 32);

    const summaryRows = students.map((s) => {
      const count = s.attendanceRecords.length;
      const avg =
        count > 0
          ? Math.round(s.attendanceRecords.reduce((acc, r) => acc + r.percentage, 0) / count)
          : null;
      const totalPresent = s.attendanceRecords.reduce((acc, r) => acc + r.daysPresent, 0);
      const totalDays = s.attendanceRecords.reduce((acc, r) => acc + r.daysTotal, 0);
      return [
        s.name,
        s.currentClass,
        s.status.replace("_", " "),
        count.toString(),
        totalPresent.toString(),
        totalDays.toString(),
        avg !== null ? `${avg}%` : "—",
        avg === null ? "No Data" : avg >= 75 ? "Good" : avg >= 50 ? "At Risk" : "Critical",
      ];
    });

    autoTable(doc, {
      startY: 36,
      head: [["Student Name", "Class", "Status", "Records", "Days Present", "Total Days", "Avg %", "Remarks"]],
      body: summaryRows,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.section === "body") {
          const val = String(data.cell.raw);
          if (val === "Critical") data.cell.styles.textColor = [190, 18, 60];
          else if (val === "At Risk") data.cell.styles.textColor = [161, 98, 7];
          else if (val === "Good") data.cell.styles.textColor = [6, 95, 70];
        }
      },
    });

    // ── Per-student detail table ────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalY: number = (doc as any).lastAutoTable?.finalY ?? 60;

    students.forEach((s) => {
      if (s.attendanceRecords.length === 0) return;
      finalY += 8;
      if (finalY > 170) { doc.addPage(); finalY = 14; }

      doc.setTextColor(30, 58, 138);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${s.name}  (${s.currentClass})`, 14, finalY);

      const detailRows = s.attendanceRecords.map((r) => [
        MONTH_NAMES[r.month - 1] + " " + r.year,
        r.daysPresent.toString(),
        r.daysTotal.toString(),
        `${Math.round(r.percentage)}%`,
        r.percentage >= 75 ? "Good" : r.percentage >= 50 ? "At Risk" : "Critical",
      ]);

      autoTable(doc, {
        startY: finalY + 2,
        head: [["Month / Year", "Days Present", "Total Days", "Percentage", "Remarks"]],
        body: detailRows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === "body") {
            const val = String(data.cell.raw);
            if (val === "Critical") data.cell.styles.textColor = [190, 18, 60];
            else if (val === "At Risk") data.cell.styles.textColor = [161, 98, 7];
            else if (val === "Good") data.cell.styles.textColor = [6, 95, 70];
          }
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalY = (doc as any).lastAutoTable?.finalY ?? finalY + 20;
    });

    // ── Footer on last page ─────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NMCT EduTrack — Confidential  |  Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: "center" }
      );
    }

    doc.save(`NMCT_Attendance_Report_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`);
  };
  // ── End PDF Export ──────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* View Toggle Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode("cards")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
              viewMode === "cards"
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            📇 Card Grid View
          </button>
          <button
            onClick={() => setViewMode("sheet")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
              viewMode === "sheet"
                ? "bg-[#1E3A8A] text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            📝 Bulk School Sheet
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold font-mono">
            Assigned Students: {students.length}
          </span>
          <button
            type="button"
            onClick={exportAttendancePDF}
            disabled={students.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export attendance report as PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <>
          {/* Search bar for cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search students by name or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </div>

          {/* Cards list */}
          {filteredStudents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                No students found matching your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => {
                const recordsCount = student.attendanceRecords.length;
                const avgAttendance = recordsCount > 0
                  ? Math.round(
                      student.attendanceRecords.reduce((sum, r) => sum + r.percentage, 0) / recordsCount
                    )
                  : null;

                let cardHighlightClass = "border-slate-200 hover:border-slate-300";
                let badgeColorClass = "bg-slate-100 text-slate-700";

                if (avgAttendance !== null) {
                  if (avgAttendance < 50) {
                    cardHighlightClass = "border-rose-300 hover:border-rose-400 ring-2 ring-rose-50/50";
                    badgeColorClass = "bg-rose-100 text-rose-700";
                  } else if (avgAttendance < 75) {
                    cardHighlightClass = "border-amber-300 hover:border-amber-400 ring-2 ring-amber-50/50";
                    badgeColorClass = "bg-amber-100 text-amber-700";
                  } else {
                    cardHighlightClass = "border-emerald-200 hover:border-emerald-300";
                    badgeColorClass = "bg-emerald-100 text-emerald-700";
                  }
                }

                return (
                  <div
                    key={student.id}
                    className={`bg-white border rounded-2xl shadow-xs transition duration-200 flex flex-col justify-between overflow-hidden ${cardHighlightClass}`}
                  >
                    {/* Card Header */}
                    <div className="p-5 pb-4 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            href={`/students/${student.id}`}
                            className="font-bold text-lg text-slate-800 hover:text-sky-600 hover:underline transition"
                          >
                            {student.name}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Class: <span className="font-mono font-semibold">{student.currentClass}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              student.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : student.status === "AT_RISK"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : student.status === "DROPPED_OUT"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {student.status.replace("_", " ")}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeColorClass}`}>
                            Avg: {avgAttendance !== null ? `${avgAttendance}%` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body - Attendance List */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Recent Attendance Records
                        </h4>
                        {student.attendanceRecords.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 border border-dashed border-slate-100 rounded-lg">
                            No records logged for this student yet.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                            {student.attendanceRecords.map((record) => (
                              <div
                                key={record.id}
                                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs hover:bg-slate-100/80 transition"
                              >
                                <span className="font-medium text-slate-700">
                                  {MONTH_NAMES[record.month - 1] || `Month ${record.month}`}, {record.year}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500 font-mono text-[11px]">
                                    {record.daysPresent}/{record.daysTotal} days
                                  </span>
                                  <span
                                    className={`font-bold font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                      record.percentage < 50
                                        ? "bg-rose-100 text-rose-700"
                                        : record.percentage < 75
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {Math.round(record.percentage)}%
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenModal(student)}
                        className="w-full bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2"
                      >
                        <span>📊</span>
                        <span>Log Attendance</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Bulk School Sheet View Mode */
        <form onSubmit={handleBulkSubmit} className="space-y-6 text-left">
          {/* Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Month
              </label>
              <select
                value={bulkMonth}
                onChange={(e) => setBulkMonth(parseInt(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 cursor-pointer"
                disabled={submitting}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m - 1]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Year
              </label>
              <input
                type="number"
                value={Number.isNaN(bulkYear) ? "" : bulkYear}
                onChange={(e) =>
                  setBulkYear(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
                }
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                required
                disabled={submitting}
                min={2020}
                max={2030}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Total School Days
              </label>
              <input
                type="number"
                value={Number.isNaN(bulkTotalDays) ? "" : bulkTotalDays}
                onChange={(e) =>
                  setBulkTotalDays(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)
                }
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                required
                disabled={submitting}
                min={1}
                max={31}
              />
            </div>
          </div>

          {/* Success / Error Logs */}
          {bulkSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
              <span>✅</span>
              <span>All student attendance logs saved successfully for {MONTH_NAMES[bulkMonth - 1]}, {bulkYear}!</span>
            </div>
          )}
          {bulkError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-850 text-sm rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{bulkError}</span>
            </div>
          )}

          {/* Student rows list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">Name</th>
                    <th className="py-3.5 px-6">Class/Grade</th>
                    <th className="py-3.5 px-6">Days Present</th>
                    <th className="py-3.5 px-6">Total Days</th>
                    <th className="py-3.5 px-6 text-center">Status preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const present = bulkRecords[student.id] ?? 20;
                    const total = Number.isNaN(bulkTotalDays) ? 22 : bulkTotalDays;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                    let rateClass = "text-slate-500 bg-slate-100";
                    if (percentage < 50) {
                      rateClass = "text-rose-700 bg-rose-50 border border-rose-200";
                    } else if (percentage < 75) {
                      rateClass = "text-amber-700 bg-amber-50 border border-amber-200";
                    } else {
                      rateClass = "text-emerald-700 bg-emerald-50 border border-emerald-200";
                    }

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {student.name}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-mono text-xs">
                          {student.currentClass}
                        </td>
                        <td className="py-4 px-6">
                          <input
                            type="number"
                            min={0}
                            max={total}
                            value={Number.isNaN(present) ? "" : present}
                            onChange={(e) => {
                              const val = Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber;
                              setBulkRecords((prev) => ({
                                ...prev,
                                [student.id]: val,
                              }));
                            }}
                            className="w-24 p-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-sky-500 bg-slate-50/50 font-mono"
                            required
                            disabled={submitting}
                          />
                        </td>
                        <td className="py-4 px-6 text-slate-650 font-mono font-bold">
                          {total} days
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-[10px] font-bold py-1 px-2.5 rounded-full ${rateClass}`}>
                            {percentage}% {percentage < 75 ? "⚠️ AT RISK" : "✓ GOOD"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || isPending}
              className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-bold py-3.5 px-6 rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Logs...
                </>
              ) : isPending ? (
                "Refreshing..."
              ) : (
                "Save All School Attendance"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Log Attendance Modal (Card view mode) */}
      {activeStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-xl overflow-hidden text-left animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-800">Log Attendance</h3>
                <p className="text-xs text-slate-500 mt-0.5">student: {activeStudent.name}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAttendance} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-semibold flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500 transition cursor-pointer"
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {MONTH_NAMES[m - 1]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={Number.isNaN(year) ? "" : year}
                    onChange={(e) => setYear(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                    required
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Days Present
                  </label>
                  <input
                    type="number"
                    value={Number.isNaN(daysPresent) ? "" : daysPresent}
                    onChange={(e) => setDaysPresent(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                    required
                    min={0}
                    max={31}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Total Days
                  </label>
                  <input
                    type="number"
                    value={Number.isNaN(daysTotal) ? "" : daysTotal}
                    onChange={(e) => setDaysTotal(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
                    required
                    min={1}
                    max={31}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isPending}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#152e72] text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? "Saving..." : isPending ? "Refreshing..." : "Log Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
