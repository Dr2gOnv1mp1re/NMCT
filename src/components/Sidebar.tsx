"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

interface SidebarProps {
  officerName: string;
  officerDistrict: string;
}

export default function Sidebar({
  officerName,
  officerDistrict,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" />
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 bg-black/40 z-30 hidden peer-checked:block lg:peer-checked:hidden cursor-pointer"
      />
      <aside className="fixed inset-y-0 left-0 w-[260px] bg-[#0B1329] text-white flex flex-col z-40 text-left transform -translate-x-full transition-transform duration-300 lg:relative lg:translate-x-0 flex-shrink-0 peer-checked:translate-x-0">
      {/* Sidebar Header / Logo */}
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#0EA5E9] rounded-lg flex items-center justify-center text-xl shadow-md">
          🎓
        </div>
        <div>
          <h2 className="font-bold text-xs leading-tight tracking-wide">
            NMCT
          </h2>
          <p className="text-[9px] text-white/55 uppercase tracking-wider font-mono">
            Student Tracking Portal
          </p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
            isActive("/dashboard")
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>📊</span>
          <span>Dashboard</span>
        </Link>

        <Link
          href="/students"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
            isActive("/students")
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>👥</span>
          <span>Students</span>
        </Link>

        <Link
          href="/attendance"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
            isActive("/attendance")
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>📅</span>
          <span>Attendance</span>
        </Link>
        <div className="pl-6">
          <Link
            href="/attendance/tuition"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              isActive("/attendance/tuition")
                ? "text-sky-400 font-bold bg-white/5"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>📖</span>
            <span>Tuition Attendance</span>
          </Link>
        </div>

        <Link
          href="/dbt"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
            isActive("/dbt")
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>🏦</span>
          <span>DBT Scholarships</span>
        </Link>

        <Link
          href="/admin"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
            isActive("/admin")
              ? "bg-[#0EA5E9] text-white shadow-sm"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
        >
          <span>🛡️</span>
          <span>Officers & Audit</span>
        </Link>
      </nav>

      {/* User Info / Sign Out in Sidebar Footer */}
      <div className="p-4 border-t border-white/10 bg-[#070D1D] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#38BDF8] text-[#0B1329] font-bold flex items-center justify-center text-xs">
            {officerName.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden max-w-[120px]">
            <p className="text-xs font-semibold truncate leading-tight text-white">
              {officerName}
            </p>
            <p className="text-[9px] text-white/40 truncate">
              {officerDistrict} District
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton>
              <button className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition px-2 py-1 rounded hover:bg-white/5">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition px-2 py-1 rounded hover:bg-white/5">
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
      </aside>
    </>
  );
}
