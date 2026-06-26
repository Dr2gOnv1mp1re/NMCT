"use client";

import React, { useState } from "react";
import Link from "next/link";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useSignIn() {
  const signIn = {
    create: async ({
      identifier,
    }: {
      identifier: string;
      password?: string;
    }) => {
      // Auto-determine role based on email identifier
      const mockRole = identifier.toLowerCase().includes("admin")
        ? "ADMIN"
        : "FIELD_OFFICER";
      const mockName = identifier.toLowerCase().includes("admin")
        ? "Admin Coordinator"
        : "Field Officer Demo";

      // Set session cookies
      document.cookie = `mock-session-email=${encodeURIComponent(identifier)}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `mock-session-role=${mockRole}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `mock-session-name=${encodeURIComponent(mockName)}; path=/; max-age=86400; SameSite=Lax`;

      return {
        status: "complete",
        createdSessionId: `mock_sess_${Math.random().toString(36).substring(7)}`,
      };
    },
  };
  return { signIn, isLoaded: true };
}

export function useClerk() {
  return {
    setActive: async ({ session }: { session: string }) => {
      console.log("Mock session active:", session);
      // Perform client side redirect to dashboard
      window.location.href = "/dashboard";
    },
  };
}

export function SignIn({
  signUpUrl = "/sign-up",
  forceRedirectUrl = "/dashboard",
}: {
  signUpUrl?: string;
  forceRedirectUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Use useSignIn hook to trigger cookie setting
    const mockRole = email.toLowerCase().includes("admin")
      ? "ADMIN"
      : "FIELD_OFFICER";
    const mockName = email.toLowerCase().includes("admin")
      ? "Admin Coordinator"
      : "Field Officer Demo";
    document.cookie = `mock-session-email=${encodeURIComponent(email || "officer@nmct.org")}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `mock-session-role=${mockRole}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `mock-session-name=${encodeURIComponent(mockName)}; path=/; max-age=86400; SameSite=Lax`;
    window.location.href = forceRedirectUrl;
  };
  return (
    <div
      style={{
        background: "#fff",
        padding: "32px",
        borderRadius: "12px",
        border: "1px solid #D8CFC0",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#0B1329",
          marginBottom: "8px",
        }}
      >
        Sign In to NMCT
      </h2>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        Use your field officer or admin credentials.
      </p>
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "#333",
            }}
          >
            Email address
          </label>
          <input
            type="email"
            placeholder="officer@nmct.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #D8CFC0",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#38BDF8",
            color: "#0B1329",
            fontWeight: 600,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
      <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px" }}>
        Don&apos;t have an account?{" "}
        <a
          href={signUpUrl}
          style={{ color: "#38BDF8", textDecoration: "none", fontWeight: 600 }}
        >
          Sign up
        </a>
      </div>
    </div>
  );
}

export function SignUp({
  signInUrl = "/sign-in",
  forceRedirectUrl = "/dashboard",
}: {
  signInUrl?: string;
  forceRedirectUrl?: string;
}) {
  const [email, setEmail] = useState("");
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    document.cookie = `mock-session-email=${encodeURIComponent(email || "officer@nmct.org")}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `mock-session-role=FIELD_OFFICER; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `mock-session-name=New Field Officer; path=/; max-age=86400; SameSite=Lax`;
    window.location.href = forceRedirectUrl;
  };
  return (
    <div
      style={{
        background: "#fff",
        padding: "32px",
        borderRadius: "12px",
        border: "1px solid #D8CFC0",
        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 600,
          color: "#0B1329",
          marginBottom: "8px",
        }}
      >
        Create NMCT Account
      </h2>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
        Register as a new field officer.
      </p>
      <form
        onSubmit={handleSignUp}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "6px",
              color: "#333",
            }}
          >
            Email address
          </label>
          <input
            type="email"
            placeholder="officer@nmct.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #D8CFC0",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#38BDF8",
            color: "#0B1329",
            fontWeight: 600,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Sign Up
        </button>
      </form>
      <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px" }}>
        Already have an account?{" "}
        <a
          href={signInUrl}
          style={{ color: "#38BDF8", textDecoration: "none", fontWeight: 600 }}
        >
          Sign in
        </a>
      </div>
    </div>
  );
}

export function Show({
  children,
  when,
}: {
  children: React.ReactNode;
  when: "signed-in" | "signed-out" | string;
}) {
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const isSignedIn = document.cookie.includes("mock-session-email=");
  const shouldShow =
    (when === "signed-in" && isSignedIn) ||
    (when === "signed-out" && !isSignedIn);

  return shouldShow ? <>{children}</> : null;
}

export function SignInButton({ children }: { children: React.ReactNode }) {
  return (
    <span onClick={() => (window.location.href = "/sign-in")}>{children}</span>
  );
}

export function SignUpButton({ children }: { children: React.ReactNode }) {
  return (
    <span onClick={() => (window.location.href = "/sign-up")}>{children}</span>
  );
}

export function UserButton() {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = () => {
    // Clear cookies by setting max-age=0
    document.cookie = "mock-session-email=; path=/; max-age=0";
    document.cookie = "mock-session-role=; path=/; max-age=0";
    document.cookie = "mock-session-name=; path=/; max-age=0";
    window.location.href = "/sign-in";
  };

  if (!isMounted) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white font-bold flex items-center justify-center text-sm border border-slate-200 shadow-xs cursor-pointer animate-pulse" />
    );
  }

  // Get cookies client-side safely
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
    return "";
  };

  const email = getCookie("mock-session-email");
  const name = getCookie("mock-session-name") || "Field Officer Demo";
  const initial = name.charAt(0).toUpperCase() || "F";

  if (!email) {
    return (
      <Link
        href="/sign-in"
        className="w-8 h-8 rounded-full bg-[#1E3A8A] hover:bg-[#152e72] text-white font-bold flex items-center justify-center text-xs border border-slate-200 shadow-xs transition"
        title="Sign In"
      >
        🔑
      </Link>
    );
  }

  return (
    <div className="relative inline-block">
      {/* Overlay background to close the dropdown when clicking outside */}
      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)}
        />
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-[#1E3A8A] hover:bg-[#152e72] text-white font-bold flex items-center justify-center text-sm border border-slate-200 shadow-xs cursor-pointer transition focus:outline-none relative z-50"
        aria-label="User menu"
        title={name}
      >
        {initial}
      </button>
      {open && (
        <div className="user-button-dropdown absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-800">{name}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{email}</p>
          </div>
          <div className="p-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

