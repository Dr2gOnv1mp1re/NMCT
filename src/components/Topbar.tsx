/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";

interface Notification {
  id: string;
  type: "critical" | "warning" | "success" | "info";
  message: string;
  time: string;
}

interface TopbarProps {
  officerName: string;
  placeholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function Topbar({
  officerName,
  placeholder = "Search students, villages, schemes...",
  searchValue = "",
  onSearchChange,
}: TopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Fetch real notifications from the database
  const fetchNotifications = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // silently fail — show nothing rather than crash
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [fetched]);

  // Fetch when bell is opened for the first time
  useEffect(() => {
    if (notificationsOpen && !fetched) {
      fetchNotifications();
    }
  }, [notificationsOpen, fetched, fetchNotifications]);

  const alertCount = notifications.filter(
    (n) => n.type === "critical" || n.type === "warning"
  ).length;

  const dotColor = (type: Notification["type"]) => {
    if (type === "critical") return "🔴";
    if (type === "warning") return "🟡";
    if (type === "success") return "🟢";
    return "🔵";
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search & Mobile Hamburger */}
      <div className="flex items-center gap-3 w-72 md:w-96 relative">
        <label
          htmlFor="sidebar-toggle"
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer lg:hidden flex items-center justify-center text-xl select-none"
          aria-label="Toggle navigation menu"
        >
          ☰
        </label>
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50/50"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-4 relative">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition relative focus:outline-none cursor-pointer"
          >
            <span className="text-lg">🔔</span>
            {/* Badge — only shows when there are real alerts */}
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <>
              {/* Overlay to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                {/* Header */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  {alertCount > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md font-bold">
                      {alertCount} alert{alertCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {loading ? (
                    <div className="p-6 text-center">
                      <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 mt-2">Loading alerts…</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">No notifications right now.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition cursor-pointer">
                        <p className="text-xs text-slate-700 leading-normal">
                          {dotColor(n.type)}{" "}
                          {n.message}
                        </p>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                          {n.time}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer refresh button */}
                <div className="px-4 pt-2 pb-1 border-t border-slate-100">
                  <button
                    onClick={() => { setFetched(false); fetchNotifications(); }}
                    className="text-[10px] text-sky-500 hover:text-sky-700 font-semibold transition"
                  >
                    ↻ Refresh
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Circle (Clerk UserButton) */}
        <div className="flex items-center">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
