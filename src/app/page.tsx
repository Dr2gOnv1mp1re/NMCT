"use client";

import React from "react";
import Link from "next/link";
import { Show, UserButton, useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { user } = useUser();
  return (
    <>
      <style>{`
        :root {
          --forest: #0B1329;
          --forest-mid: #1E3A8A;
          --leaf: #2563EB;
          --lime: #38BDF8;
          --gold: #F59E0B;
          --gold-light: #FCD34D;
          --cream: #F8FAFC;
          --paper: #F1F5F9;
          --ink: #0F172A;
          --muted: #64748B;
          --border: rgba(15,23,42,0.08);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
          background: var(--cream);
          color: var(--ink);
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          line-height: 1.65;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(248,250,252,0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 4rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          text-decoration: none;
        }

        .nav-emblem {
          width: 32px;
          height: 32px;
          background: var(--forest);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Playfair Display', serif;
          font-size: 14px;
          color: var(--lime);
          font-weight: 700;
          flex-shrink: 0;
        }

        .nav-name {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          color: var(--ink);
        }

        .nav-links {
          display: flex;
          gap: 2rem;
          align-items: center;
          list-style: none;
        }

        .nav-links a {
          font-size: 0.8rem;
          color: var(--muted);
          text-decoration: none;
          font-weight: 400;
          letter-spacing: 0.02em;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--ink); }

        .nav-cta {
          background: var(--forest) !important;
          color: var(--lime) !important;
          padding: 0.45rem 1.1rem;
          border-radius: 5px;
          font-weight: 500 !important;
          font-size: 0.78rem !important;
          transition: background 0.2s !important;
        }
        .nav-cta:hover { background: var(--forest-mid) !important; }

        /* ── HERO ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100vh - 60px);
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 4rem;
          gap: 4rem;
          align-items: center;
        }

        .hero-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--leaf);
          margin-bottom: 1.2rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1.5px;
          background: var(--leaf);
        }

        h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.6rem, 4.5vw, 3.8rem);
          font-weight: 700;
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: var(--forest);
          margin-bottom: 1.5rem;
        }

        h1 em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold);
        }

        .hero-desc {
          font-size: 1rem;
          color: var(--muted);
          line-height: 1.75;
          max-width: 48ch;
          margin-bottom: 2.5rem;
          font-weight: 300;
        }

        .hero-actions {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--forest);
          color: var(--lime);
          padding: 0.8rem 1.8rem;
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.88rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.2s, transform 0.15s;
          letter-spacing: 0.01em;
        }
        .btn-primary:hover { background: var(--forest-mid); transform: translateY(-1px); }

        .btn-ghost {
          color: var(--forest);
          padding: 0.8rem 1.6rem;
          border-radius: 6px;
          font-weight: 400;
          font-size: 0.88rem;
          text-decoration: none;
          border: 1.5px solid var(--border);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: border-color 0.2s, background 0.2s;
          background: transparent;
        }
        .btn-ghost:hover { border-color: var(--leaf); background: rgba(37,99,235,0.06); }

        /* ── HERO CARD ── */
        .hero-visual {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.2rem 1.4rem;
          position: relative;
          overflow: hidden;
          animation: cardIn 0.6s ease both;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 3px;
          height: 100%;
        }

        .stat-card.green::before { background: var(--leaf); }
        .stat-card.gold::before { background: var(--gold); }
        .stat-card.forest::before { background: var(--forest); }
        .stat-card.lime::before { background: var(--lime); }

        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2.2rem;
          font-weight: 700;
          color: var(--forest);
          line-height: 1;
          margin-bottom: 0.2rem;
        }

        .stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
        }


        /* ── ABOUT STRIP ── */

        .about-strip {
          background: var(--forest);
          padding: 3.5rem 4rem;
        }

        .about-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
          align-items: start;
        }

        .about-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--lime);
          margin-bottom: 0.8rem;
        }

        .about-body {
          font-size: 0.88rem;
          color: rgba(248,250,252,0.7);
          line-height: 1.75;
          font-weight: 300;
        }

        .about-stat {
          border-left: 1px solid rgba(56,189,248,0.2);
          padding-left: 1.5rem;
        }

        .about-stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--gold-light);
          line-height: 1;
          margin-bottom: 0.3rem;
        }

        .about-stat-label {
          font-size: 0.78rem;
          color: rgba(248,250,252,0.5);
          line-height: 1.4;
        }

        /* ── MODULES ── */
        .modules {
          padding: 5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.66rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--leaf);
          margin-bottom: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-eyebrow::before {
          content: '';
          display: block;
          width: 18px;
          height: 1.5px;
          background: var(--leaf);
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 700;
          color: var(--forest);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .section-sub {
          font-size: 0.92rem;
          color: var(--muted);
          margin-bottom: 3rem;
          font-weight: 300;
          max-width: 55ch;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.2rem;
        }

        .module-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.6rem;
          transition: border-color 0.2s, transform 0.2s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .module-card:hover {
          border-color: var(--leaf);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(11,19,41,0.08);
        }

        .module-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(37,99,235,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }

        .module-card.gold-accent .module-icon { background: rgba(200,148,58,0.1); }
        .module-card.forest-accent .module-icon { background: rgba(11,19,41,0.08); }

        .module-name {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--forest);
          margin-bottom: 0.5rem;
        }

        .module-desc {
          font-size: 0.82rem;
          color: var(--muted);
          line-height: 1.6;
          font-weight: 300;
        }

        .module-tag {
          display: inline-block;
          margin-top: 1rem;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          background: rgba(37,99,235,0.1);
          color: var(--leaf);
        }

        .module-card.gold-accent .module-tag { background: rgba(200,148,58,0.1); color: var(--gold); }
        .module-card.forest-accent .module-tag { background: rgba(11,19,41,0.08); color: var(--forest-mid); }

        /* ── STUDENT CATEGORIES ── */
        .categories {
          background: var(--paper);
          padding: 5rem 4rem;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .categories-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .categories-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .cat-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .cat-card:hover { box-shadow: 0 8px 24px rgba(11,19,41,0.09); }

        .cat-header {
          padding: 1.6rem 1.8rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cat-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--forest);
        }

        .cat-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
        }

        .badge-tribal { background: rgba(37,99,235,0.12); color: var(--leaf); }
        .badge-general { background: rgba(200,148,58,0.12); color: var(--gold); }

        .cat-body {
          padding: 1.4rem 1.8rem;
        }

        .cat-desc {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.65;
          margin-bottom: 1.2rem;
          font-weight: 300;
        }

        .cat-communities {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .community-tag {
          font-size: 0.75rem;
          padding: 0.25rem 0.7rem;
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--forest-mid);
          background: rgba(248,250,252,0.6);
          font-weight: 400;
        }

        /* ── STATUS LEGEND ── */
        .status-section {
          padding: 5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          margin-top: 2.5rem;
        }

        .status-card {
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 1.3rem;
          background: white;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-bottom: 0.8rem;
        }

        .dot-active { background: #4CAF50; }
        .dot-atrisk { background: #FF9800; }
        .dot-dropout { background: #F44336; }
        .dot-migrated { background: #9C27B0; }
        .dot-graduated { background: #2196F3; }

        .status-name {
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--forest);
          margin-bottom: 0.4rem;
        }

        .status-code {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.6rem;
        }

        .status-desc {
          font-size: 0.75rem;
          color: var(--muted);
          line-height: 1.5;
          font-weight: 300;
        }

        /* ── TECH STRIP ── */
        .tech-strip {
          background: var(--paper);
          border-top: 1px solid var(--border);
          padding: 3rem 4rem;
        }

        .tech-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 3rem;
        }

        .tech-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--muted);
          flex-shrink: 0;
        }

        .tech-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tech-pill {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.72rem;
          padding: 0.35rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: 5px;
          color: var(--forest);
          background: white;
          letter-spacing: 0.02em;
        }

        /* ── FOOTER ── */
        footer {
          background: var(--forest);
          color: rgba(248,250,252,0.7);
          padding: 3rem 4rem;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 3rem;
        }

        .footer-org {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--lime);
          margin-bottom: 0.6rem;
        }

        .footer-tagline {
          font-size: 0.82rem;
          line-height: 1.65;
          max-width: 42ch;
          color: rgba(248,250,252,0.55);
          font-weight: 300;
        }

        .footer-heading {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--lime);
          margin-bottom: 0.9rem;
        }

        .footer-item {
          font-size: 0.8rem;
          color: rgba(248,250,252,0.55);
          margin-bottom: 0.45rem;
          line-height: 1.5;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 2.5rem auto 0;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(56,189,248,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          color: rgba(248,250,252,0.35);
        }

        /* ── ANIMATIONS ── */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-left { animation: cardIn 0.7s ease both; }
        .hero-visual { animation: cardIn 0.8s 0.1s ease both; }
        .stat-card:nth-child(1) { animation-delay: 0.2s; }
        .stat-card:nth-child(2) { animation-delay: 0.3s; }
        .stat-card:nth-child(3) { animation-delay: 0.4s; }
        .stat-card:nth-child(4) { animation-delay: 0.5s; }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          nav { padding: 0 1.5rem; }
          .nav-links { display: none; }
          .hero { grid-template-columns: 1fr; padding: 3rem 1.5rem; min-height: auto; gap: 2.5rem; }
          .about-strip { padding: 3rem 1.5rem; }
          .about-inner { grid-template-columns: 1fr; gap: 1.5rem; }
          .about-stat { border-left: none; padding-left: 0; border-top: 1px solid rgba(56,189,248,0.2); padding-top: 1.2rem; }
          .modules { padding: 3rem 1.5rem; }
          .modules-grid { grid-template-columns: 1fr 1fr; }
          .categories { padding: 3rem 1.5rem; }
          .categories-grid { grid-template-columns: 1fr; }
          .status-section { padding: 3rem 1.5rem; }
          .status-grid { grid-template-columns: repeat(2, 1fr); }
          .tech-strip { padding: 2rem 1.5rem; }
          .tech-inner { flex-direction: column; align-items: flex-start; gap: 1rem; }
          footer { padding: 2.5rem 1.5rem; }
          .footer-inner { grid-template-columns: 1fr; gap: 2rem; }
          .footer-bottom { flex-direction: column; gap: 0.5rem; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav>
        <Link href="/" className="nav-brand">
          <div className="nav-emblem">N</div>
          <span className="nav-name">NMCT EduTrack</span>
        </Link>
        <ul className="nav-links">
          <li><a href="#modules">Modules</a></li>
          <li><a href="https://nmctngo.org" target="_blank" rel="noopener noreferrer">nmctngo.org</a></li>
          <Show when="signed-out">
            <li><Link href="/sign-in" className="nav-cta">Sign in</Link></li>
          </Show>
          <Show when="signed-in">
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                {user?.primaryEmailAddress?.emailAddress}
              </span>
              <UserButton />
            </li>
          </Show>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-eyebrow">Native Medicare Charitable Trust · Est. 1988</p>
          <h1>Every student<br />stays <em>in the system</em></h1>
          <p className="hero-desc">
            A secure field portal for NMCT officers to track students from Class 1 through graduation — tribal and non-tribal — across Coimbatore, Tirupur, and the Western Ghats region. Built to prevent dropouts before they happen.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="btn-primary">Open portal →</Link>
            <a href="#modules" className="btn-ghost">Explore features</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="stat-grid">
            <div className="stat-card green">
              <div className="stat-num">4.2k+</div>
              <div className="stat-label">Students tracked</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-num">35+</div>
              <div className="stat-label">Years of service</div>
            </div>
            <div className="stat-card forest">
              <div className="stat-num">3</div>
              <div className="stat-label">Districts covered</div>
            </div>
            <div className="stat-card lime">
              <div className="stat-num">75%</div>
              <div className="stat-label">Attendance threshold</div>
            </div>
          </div>
        </div>
      </section>


      {/* ABOUT STRIP */}
      <div className="about-strip">
        <div className="about-inner">
          <div>
            <div className="about-title">About NMCT</div>
            <p className="about-body">
              The Native Medicare Charitable Trust (NMCT), headquartered in Coimbatore, Tamil Nadu, has operated for nearly four decades across health, education, livelihoods, and socio-economic empowerment. NMCT works directly with tribal communities — including the Irula, Paniya, and Kurumba peoples — alongside underprivileged non-tribal youth, aligning all projects with the UN Sustainable Development Goals.
              <br /><br />
              EduTrack is the digital backbone for NMCT&apos;s Education &amp; Child Rights mission: rescuing children from child labor, enrolling them in mainstream schools, and ensuring no student silently disappears.
            </p>
          </div>
          <div className="about-stat">
            <div className="about-stat-num">12A &amp; 80G</div>
            <div className="about-stat-label">Tax-exempt certified<br />FCRA registered</div>
          </div>
          <div className="about-stat">
            <div className="about-stat-num">1988</div>
            <div className="about-stat-label">Founded under<br />Indian Trust Act</div>
          </div>
        </div>
      </div>

      {/* MODULES */}
      <section className="modules" id="modules">
        <p className="section-eyebrow">Platform features</p>
        <h2 className="section-title">Built for field officers</h2>
        <p className="section-sub">Every tool shaped around how NMCT workers actually operate — in the field, online, across multiple hamlets.</p>

        <div className="modules-grid">
          <div className="module-card" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon">📋</div>
            <div className="module-name">Student Registry</div>
            <p className="module-desc">Register new students, generate printed QR identity cards, and search profiles instantly. Export and import data across regional offices.</p>
            <span className="module-tag">Core</span>
          </div>

          <div className="module-card gold-accent" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon" style={{background:'rgba(245,158,11,0.1)'}}>⚠️</div>
            <div className="module-name">Dropout Risk Scoring</div>
            <p className="module-desc">Automatically calculates a dropout risk score from attendance and grade data. Flags &quot;High&quot; and &quot;Critical&quot; risk students for officer intervention.</p>
            <span className="module-tag" style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B'}}>Intelligence</span>
          </div>

          <div className="module-card" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon">📅</div>
            <div className="module-name">Attendance Tracker</div>
            <p className="module-desc">Logs both school and tuition attendance monthly. Triggers automatic SMS alerts in Tamil to parents when attendance falls below 75%.</p>
            <span className="module-tag">Core</span>
          </div>

          <div className="module-card forest-accent" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon" style={{background:'rgba(11,19,41,0.08)'}}>🏦</div>
            <div className="module-name">DBT Scholarships</div>
            <p className="module-desc">Tracks Direct Benefit Transfer scholarships from ELIGIBLE to VERIFIED to DISBURSED with a clear, auditable trail. Partners include Boehringer Ingelheim.</p>
            <span className="module-tag" style={{background:'rgba(11,19,41,0.08)',color:'#1E3A8A'}}>Finance</span>
          </div>

          <div className="module-card gold-accent" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon" style={{background:'rgba(245,158,11,0.1)'}}>🚚</div>
            <div className="module-name">Migration Records</div>
            <p className="module-desc">Logs family relocations — typically seasonal agricultural labor — and coordinates student case handoffs between district officers.</p>
            <span className="module-tag" style={{background:'rgba(245,158,11,0.1)',color:'#F59E0B'}}>Field Ops</span>
          </div>

          <div className="module-card" style={{background:'white',border:'1px solid rgba(15,23,42,0.08)',borderRadius:'10px',padding:'1.6rem',transition:'border-color 0.2s,transform 0.2s',cursor:'pointer',position:'relative',overflow:'hidden'}}>
            <div className="module-icon">🔐</div>
            <div className="module-name">Admin &amp; Audit Trail</div>
            <p className="module-desc">Invite field officers, configure regions, and review the full activity log. Every status change is recorded and time-stamped.</p>
            <span className="module-tag">Admin</span>
          </div>
        </div>

      </section>

      {/* TECH STRIP */}
      <div className="tech-strip">
        <div className="tech-inner">
          <span className="tech-label">Built with</span>
          <div className="tech-pills">
            <span className="tech-pill">Next.js 15</span>
            <span className="tech-pill">Prisma ORM</span>
            <span className="tech-pill">Supabase Cloud Sync</span>
            <span className="tech-pill">Clerk Auth</span>
            <span className="tech-pill">Tailwind CSS</span>
            <span className="tech-pill">App Router</span>
            <span className="tech-pill">Server Actions</span>
            <span className="tech-pill">Online Cloud Database</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div>
            <div className="footer-org">Native Medicare Charitable Trust</div>
            <p className="footer-tagline">A non-profit NGO serving marginalized communities in Coimbatore, Tirupur, and the Western Ghats since 1988. Aligned with UN Sustainable Development Goals.</p>
          </div>
          <div>
            <div className="footer-heading">Contact</div>
            <div className="footer-item">5/39, Kalappanaickenpalayam<br />Somayampalayam Post, Tadagam<br />Coimbatore – 641108</div>
            <div className="footer-item" style={{ marginTop: "0.8rem" }}>+91 422 240 1747</div>
            <div className="footer-item">info@nmctngo.org</div>
            <div className="footer-item">Mon–Sat · 9:45 AM – 6:00 PM</div>
          </div>
          <div>
            <div className="footer-heading">Accreditations</div>
            <div className="footer-item">Sec. 12A Tax Exempt</div>
            <div className="footer-item">Sec. 80G Certified</div>
            <div className="footer-item">FCRA Registered</div>
            <div className="footer-item">MCA CSR Recognized</div>
            <div className="footer-item" style={{ marginTop: "0.8rem" }}>Dir: Mr. A. S. Sankaranarayanan</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 NMCT EduTrack — Student Tracking Portal</span>
          <span>nmctngo.org</span>
        </div>
      </footer>
    </>
  );
}
