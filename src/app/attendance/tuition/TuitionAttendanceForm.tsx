"use client";

import React, { useState, useEffect } from "react";
import { logTuitionAttendance } from "@/app/actions";

interface StudentInfo {
  id: string;
  name: string;
  village: string;
  school: string;
}

interface AttendanceLog {
  studentId: string;
  date: Date;
  status: string;
}

interface TuitionAttendanceFormProps {
  students: StudentInfo[];
  recordedById: string;
  initialLogs: AttendanceLog[];
}

export default function TuitionAttendanceForm({
  students,
  recordedById,
  initialLogs,
}: TuitionAttendanceFormProps) {
  // Format Date object to local YYYY-MM-DD
  const getLocalDateString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const [attendance, setAttendance] = useState<{ [studentId: string]: "PRESENT" | "ABSENT" }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Re-calculate checking states when selectedDate or logs change
  useEffect(() => {
    const currentMap: { [id: string]: "PRESENT" | "ABSENT" } = {};
    students.forEach((s) => {
      const match = logs.find((l) => {
        const logDateStr = getLocalDateString(new Date(l.date));
        return l.studentId === s.id && logDateStr === selectedDate;
      });
      currentMap[s.id] = match ? (match.status as "PRESENT" | "ABSENT") : "PRESENT"; // Default to PRESENT if unlogged
    });
    setAttendance(currentMap);
    setSuccess(false);
    setError("");
  }, [selectedDate, logs, students]);

  const isSavedPresent = (studentId: string) => {
    return logs.some((l) => {
      const logDateStr = getLocalDateString(new Date(l.date));
      return l.studentId === studentId && logDateStr === selectedDate && l.status === "PRESENT";
    });
  };

  const handleToggle = (studentId: string) => {
    if (isSavedPresent(studentId)) return;
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "PRESENT" ? "ABSENT" : "PRESENT",
    }));
  };

  const setAllStatus = (status: "PRESENT" | "ABSENT") => {
    const updated: { [id: string]: "PRESENT" | "ABSENT" } = { ...attendance };
    students.forEach((s) => {
      if (!isSavedPresent(s.id)) {
        updated[s.id] = status;
      }
    });
    setAttendance(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    try {
      const res = await logTuitionAttendance({
        date: selectedDate,
        records,
        recordedById,
      });

      if (res.success) {
        setSuccess(true);
        // Update local logs state so that switching back/forth updates correctly
        const newLogs = logs.filter((l) => {
          const logDateStr = getLocalDateString(new Date(l.date));
          return !(logDateStr === selectedDate);
        });

        records.forEach((r) => {
          newLogs.push({
            studentId: r.studentId,
            date: new Date(selectedDate),
            status: r.status,
          });
        });

        setLogs(newLogs);
      } else {
        setError(res.error || "Failed to save attendance.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-16 text-center space-y-3">
        <span className="text-3xl">📭</span>
        <p className="text-sm font-medium text-slate-500">
          No students are currently marked as attending tuition program.
        </p>
        <p className="text-xs text-slate-400">
          Edit a student profile and check &quot;Attends Tuition Program?&quot; to list them here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {/* Date Selector & Bulk actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Select Date:
          </label>
          <input
            type="date"
            className="p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllStatus("PRESENT")}
            className="px-3 py-1.5 border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition"
            disabled={loading}
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => setAllStatus("ABSENT")}
            className="px-3 py-1.5 border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
            disabled={loading}
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <span>✅</span>
          <span>Attendance saved successfully for {selectedDate}!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Checklist list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Village</th>
                <th className="py-3.5 px-6">School</th>
                <th className="py-3.5 px-6 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => {
                const status = attendance[student.id] || "PRESENT";
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-800">{student.name}</td>
                    <td className="py-4 px-6 text-slate-600">{student.village}</td>
                    <td className="py-4 px-6 text-slate-500 font-medium">{student.school}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(student.id)}
                        disabled={loading || isSavedPresent(student.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition w-28 disabled:opacity-60 disabled:cursor-not-allowed ${
                          status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                        title={isSavedPresent(student.id) ? "Saved present records cannot be changed" : ""}
                      >
                        {status}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-bold py-3 px-6 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Attendance...
            </>
          ) : (
            "Save Attendance Record"
          )}
        </button>
      </div>
    </form>
  );
}
