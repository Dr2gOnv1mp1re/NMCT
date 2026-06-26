"use client";

import React, { useState } from "react";
import { addAchievement, deleteAchievement } from "@/app/actions";

interface Achievement {
  id: string;
  title: string;
  event: string;
  award: string | null;
  date: Date;
}

interface AchievementsSectionProps {
  studentId: string;
  initialAchievements: Achievement[];
}

export default function AchievementsSection({
  studentId,
  initialAchievements,
}: AchievementsSectionProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [event, setEvent] = useState("Annual Day Functions");
  const [award, setAward] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !event.trim()) {
      setError("Please fill out title and event.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await addAchievement({
        studentId,
        title: title.trim(),
        event: event.trim(),
        award: award.trim() || undefined,
        date,
      });

      if (res.success && res.achievement) {
        setAchievements((prev) => [res.achievement as Achievement, ...prev]);
        setIsOpen(false);
        setTitle("");
        setEvent("Annual Day Functions");
        setAward("");
        setDate(new Date().toISOString().split("T")[0]);
      } else {
        setError(res.error || "Failed to add achievement.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;
    try {
      const res = await deleteAchievement(id);
      if (res.success) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete achievement.");
      }
    } catch {
      alert("An unexpected error occurred.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="font-bold text-base text-[#0B1329] flex items-center gap-2">
          <span>🏆</span> Achievements & Awards
        </h3>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xs transition"
        >
          + Add Achievement
        </button>
      </div>

      {achievements.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
          No achievements logged yet. Click &quot;Add Achievement&quot; to log annual day or sports success.
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="flex items-start justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-lg transition"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">{ach.title}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span>📅</span> {new Date(ach.date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-indigo-600">
                    <span>🎪</span> {ach.event}
                  </span>
                  {ach.award && (
                    <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                      🏅 {ach.award}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(ach.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded-md transition hover:bg-slate-200 text-xs"
                title="Delete achievement"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Achievement Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col text-[#24241F]">
            <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold font-serif">Record Achievement</h4>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  Log student accolades and milestones
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4 text-left">
              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Achievement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place in 100m Sprint"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Category *
                </label>
                <select
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm cursor-pointer"
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  disabled={loading}
                >
                  <option value="Annual Day Functions">Annual Day Functions</option>
                  <option value="Sports Meet">Sports Meet</option>
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Science Exhibition">Science Exhibition</option>
                  <option value="Other School Competitions">Other School Competitions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Award Received (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gold Medal / Trophy / Certificate"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  value={award}
                  onChange={(e) => setAward(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date Won
                </label>
                <input
                  type="date"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Achievement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
