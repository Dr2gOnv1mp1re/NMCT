"use client";

import React, { useState } from "react";
import { logAttendance } from "@/app/actions";

interface LogAttendanceFormProps {
  students: { id: string; name: string }[];
  recordedById: string;
}

export default function LogAttendanceForm({
  students,
  recordedById,
}: LogAttendanceFormProps) {
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [daysPresent, setDaysPresent] = useState(20);
  const [daysTotal, setDaysTotal] = useState(22);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return setError("Please select a student");
    if (daysPresent > daysTotal)
      return setError("Days present cannot exceed total days");

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await logAttendance({
        studentId,
        month,
        year,
        daysPresent,
        daysTotal,
        recordedById,
      });

      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to log attendance");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg font-medium">
          ✅ Attendance logged successfully!
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Student
        </label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500"
          required
        >
          <option value="">Select a student...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500"
            required
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) =>
              setYear(e.target.valueAsNumber || parseInt(e.target.value))
            }
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
            required
            min={2020}
            max={2030}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Days Present
          </label>
          <input
            type="number"
            value={daysPresent}
            onChange={(e) =>
              setDaysPresent(e.target.valueAsNumber || parseInt(e.target.value))
            }
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
            required
            min={0}
            max={31}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Total Days
          </label>
          <input
            type="number"
            value={daysTotal}
            onChange={(e) =>
              setDaysTotal(e.target.valueAsNumber || parseInt(e.target.value))
            }
            className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 bg-slate-50/50"
            required
            min={1}
            max={31}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1E3A8A] hover:bg-[#152e72] text-white text-xs font-semibold py-3 px-4 rounded-lg shadow-sm transition disabled:opacity-50"
      >
        {loading ? "Logging..." : "Log Record"}
      </button>
    </form>
  );
}
