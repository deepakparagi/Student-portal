"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURE_CARDS = [
  {
    icon: FileText,
    title: "Intelligent Note Ingestion",
    description: "Upload PDFs, DOCX, or text notes. Our pipeline extracts core concepts, definitions, and executive summaries with zero noise.",
    tag: "Source-Grounded",
  },
  {
    icon: Target,
    title: "Adaptive Study Plans",
    description: "Dynamic daily schedules calculated from your upcoming exams, study velocity, and weak retention areas.",
    tag: "Automated",
  },
  {
    icon: Brain,
    title: "Active Recall Quizzes",
    description: "Multiple-choice questions with full explanation rationale and exact source context references for verified recall.",
    tag: "Retention",
  },
  {
    icon: Clock,
    title: "Pomodoro Focus Timer",
    description: "Built-in countdown intervals (25m, 45m, 60m) that automatically log meaningful focus bursts to your academic ledger.",
    tag: "Productivity",
  },
  {
    icon: Sparkles,
    title: "Grounded AI Tutor",
    description: "Ask questions strictly grounded in your processed syllabus and study materials to eliminate hallucinations.",
    tag: "Interactive",
  },
  {
    icon: Users,
    title: "Parent & Guardian Portal",
    description: "Real-time visibility for parents into weekly study minutes, completed assignments, and quiz performance trends.",
    tag: "Accountability",
  },
];

const FAQS = [
  {
    q: "What types of study notes can I upload?",
    a: "Smart Study Portal supports PDF textbooks, lecture slide decks, Word documents (.docx), Markdown summaries, and raw text files. Materials are parsed and processed locally or through secure ML endpoints.",
  },
  {
    q: "How does the AI prevent incorrect answers on quizzes?",
    a: "Every quiz question is generated directly from sentences found in your uploaded materials. Each answer option includes the verified text excerpt so you can cross-check facts instantly.",
  },
  {
    q: "How does the Parent Portal link to student accounts?",
    a: "A parent can send an invitation to their student's email address from the Parent Portal. Once approved, the parent sees weekly focus minutes, quiz scores, and task completion without seeing private chats.",
  },
  {
    q: "Can I use the Pomodoro timer without an active task?",
    a: "Yes! While linking study blocks to specific subjects (e.g. Biology, Calculus) helps tracking accuracy, you can launch custom open study intervals at any time.",
  },
];

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-canvas)" }}>
      {/* Top Navigation */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(6, 13, 9, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--line)",
          height: "var(--nav-height)",
        }}
      >
        <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
          <Link className="brand" href="/" aria-label="Smart Study Portal Home">
            <span
              style={{
                display: "grid",
                width: "32px",
                height: "32px",
                placeItems: "center",
                borderRadius: "8px",
                background: "var(--accent-lime)",
                color: "#051409",
                fontFamily: "var(--font-serif-family)",
                fontSize: "18px",
                fontWeight: 700,
              }}
            >
              S
            </span>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--paper)" }}>
              smart study
            </span>
          </Link>

          <nav style={{ display: "flex", alignItems: "center", gap: "24px" }} aria-label="Landing Page Navigation">
            <a href="#how-it-works" style={{ fontSize: "13px", fontWeight: 600, color: "var(--mist)" }} className="hover:text-white hidden sm:inline">
              How It Works
            </a>
            <a href="#features" style={{ fontSize: "13px", fontWeight: 600, color: "var(--mist)" }} className="hover:text-white hidden sm:inline">
              Features
            </a>
            <a href="#faq" style={{ fontSize: "13px", fontWeight: 600, color: "var(--mist)" }} className="hover:text-white hidden sm:inline">
              FAQ
            </a>
            <Link href="/login" style={{ fontSize: "13px", fontWeight: 600, color: "var(--paper)" }} className="hover:text-lime-300">
              Sign In
            </Link>
            <Button variant="primary" href="/register" size="sm">
              Start Free <ArrowRight size={14} />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <section style={{ padding: "clamp(48px, 8vw, 84px) 0 64px", position: "relative", overflow: "hidden" }}>
          <div className="app-container">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "clamp(36px, 6vw, 64px)",
                alignItems: "center",
              }}
            >
              {/* Hero Copy */}
              <div className="premium-reveal" style={{ maxWidth: "580px" }}>
                <p className="eyebrow eyebrow-glow">
                  <Sparkles size={13} /> Adaptive AI Study Companion
                </p>
                <h1
                  className="page-title"
                  style={{
                    fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                    lineHeight: 1.1,
                    margin: "12px 0 18px",
                  }}
                >
                  Turn lecture notes into <span style={{ color: "var(--accent-lime)" }}>calm, lasting mastery.</span>
                </h1>
                <p className="page-lead" style={{ fontSize: "16px", marginBottom: "32px" }}>
                  Upload your syllabus and lecture slides. Smart Study synthesizes clear conceptual summaries, generates active recall quizzes, and organizes your daily focus sessions.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <Button variant="primary" href="/register" size="lg">
                    Build Your Study Space <ArrowRight size={16} />
                  </Button>
                  <Button variant="secondary" href="/dashboard" size="lg">
                    <LayoutDashboard size={16} /> Explore Student Preview
                  </Button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "18px",
                    marginTop: "36px",
                    paddingTop: "24px",
                    borderTop: "1px solid var(--line)",
                    fontSize: "13px",
                    color: "var(--mist)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={15} color="var(--accent-lime)" /> Source-grounded quizzes
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={15} color="var(--accent-lime)" /> Focus intervals
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={15} color="var(--accent-lime)" /> Parent monitoring
                  </span>
                </div>
              </div>

              {/* Clean, Accurate Product Preview (Fixes tilted card & overlapping badges bug) */}
              <div className="premium-reveal-delayed">
                <div
                  className="glass-panel"
                  style={{
                    padding: "24px",
                    borderRadius: "var(--radius-xl)",
                    border: "1px solid var(--border-medium)",
                    boxShadow: "0 28px 72px rgba(0, 0, 0, 0.55)",
                    background: "linear-gradient(145deg, rgba(16, 32, 23, 0.92), rgba(8, 18, 13, 0.98))",
                  }}
                >
                  {/* Mock Window Top Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: "16px",
                      marginBottom: "18px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444" }} />
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#eab308" }} />
                      <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: "11px", color: "var(--mist)", marginLeft: "8px", fontWeight: 600 }}>
                        Active Study Space &bull; Cellular Biology
                      </span>
                    </div>
                    <span className="badge badge-success">Live Session</span>
                  </div>

                  {/* Header in Mock */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--mint)", letterSpacing: "0.1em" }}>
                        DAILY RETENTION SCORE
                      </span>
                      <h2 style={{ fontSize: "24px", fontWeight: 700, margin: "4px 0 0", color: "var(--paper)" }}>
                        Cell Membrane Transport
                      </h2>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        placeItems: "center",
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "rgba(122, 255, 135, 0.12)",
                        border: "2px solid var(--accent-lime)",
                        color: "var(--accent-lime)",
                        fontWeight: 800,
                        fontSize: "18px",
                      }}
                    >
                      88%
                    </div>
                  </div>

                  {/* Mock Progress Bars */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(0, 0, 0, 0.35)",
                      border: "1px solid var(--line)",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                      <span style={{ color: "var(--paper)", fontWeight: 600 }}>Active Recall Quiz Progress</span>
                      <span style={{ color: "var(--accent-lime)", fontWeight: 700 }}>7 of 8 Correct</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.08)", overflow: "hidden" }}>
                      <div style={{ width: "87.5%", height: "100%", background: "var(--accent-lime)", borderRadius: "3px" }} />
                    </div>
                  </div>

                  {/* Two Micro Tiles */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--mist)", fontWeight: 600 }}>
                        <Clock size={13} color="var(--mint)" /> Focus Session
                      </span>
                      <strong style={{ display: "block", fontSize: "16px", color: "var(--paper)", marginTop: "6px" }}>
                        45m Logged
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--mist)", fontWeight: 600 }}>
                        <Brain size={13} color="var(--gold)" /> Adaptive Task
                      </span>
                      <strong style={{ display: "block", fontSize: "16px", color: "var(--paper)", marginTop: "6px" }}>
                        Active Recall Due
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 STEPS) */}
        <section id="how-it-works" style={{ padding: "64px 0", borderTop: "1px solid var(--line)", background: "rgba(0,0,0,0.2)" }}>
          <div className="app-container">
            <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
              <p className="eyebrow" style={{ justifyContent: "center" }}>
                Methodical & Calm
              </p>
              <h2 className="section-heading" style={{ fontSize: "32px" }}>
                How Smart Study Builds Momentum
              </h2>
              <p className="page-lead" style={{ margin: "0 auto" }}>
                A streamlined three-step workflow engineered to replace procrastination with structured comprehension.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
              {/* Step 1 */}
              <div className="glass-card" style={{ padding: "28px" }}>
                <span
                  style={{
                    display: "grid",
                    width: "40px",
                    height: "40px",
                    placeItems: "center",
                    borderRadius: "10px",
                    background: "rgba(122, 255, 135, 0.12)",
                    color: "var(--accent-lime)",
                    fontWeight: 800,
                    fontSize: "16px",
                    marginBottom: "16px",
                  }}
                >
                  1
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "var(--paper)" }}>
                  Upload Course Materials
                </h3>
                <p style={{ fontSize: "14px", color: "var(--mist)", lineHeight: 1.6, margin: 0 }}>
                  Upload your slide decks, lecture notes, textbook chapters, or syllabi. The portal extracts core concepts and generates concise study guides.
                </p>
              </div>

              {/* Step 2 */}
              <div className="glass-card" style={{ padding: "28px" }}>
                <span
                  style={{
                    display: "grid",
                    width: "40px",
                    height: "40px",
                    placeItems: "center",
                    borderRadius: "10px",
                    background: "rgba(122, 255, 135, 0.12)",
                    color: "var(--accent-lime)",
                    fontWeight: 800,
                    fontSize: "16px",
                    marginBottom: "16px",
                  }}
                >
                  2
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "var(--paper)" }}>
                  Adaptive Schedule & Practice
                </h3>
                <p style={{ fontSize: "14px", color: "var(--mist)", lineHeight: 1.6, margin: 0 }}>
                  The engine arranges realistic daily study blocks and creates source-grounded multiple-choice quizzes with cited explanations for instant feedback.
                </p>
              </div>

              {/* Step 3 */}
              <div className="glass-card" style={{ padding: "28px" }}>
                <span
                  style={{
                    display: "grid",
                    width: "40px",
                    height: "40px",
                    placeItems: "center",
                    borderRadius: "10px",
                    background: "rgba(122, 255, 135, 0.12)",
                    color: "var(--accent-lime)",
                    fontWeight: 800,
                    fontSize: "16px",
                    marginBottom: "16px",
                  }}
                >
                  3
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 8px", color: "var(--paper)" }}>
                  Deep Focus & Shared Oversight
                </h3>
                <p style={{ fontSize: "14px", color: "var(--mist)", lineHeight: 1.6, margin: 0 }}>
                  Execute focused intervals using the built-in Pomodoro clock. Verified metrics feed into student streaks and the dedicated Parent accountability portal.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES GRID */}
        <section id="features" style={{ padding: "72px 0" }}>
          <div className="app-container">
            <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 48px" }}>
              <p className="eyebrow" style={{ justifyContent: "center" }}>
                Platform Features
              </p>
              <h2 className="section-heading" style={{ fontSize: "32px" }}>
                Everything Needed for Deep Academic Work
              </h2>
              <p className="page-lead" style={{ margin: "0 auto" }}>
                Engineered for serious high school and university students, backed by parent visibility.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
              {FEATURE_CARDS.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div
                        style={{
                          display: "grid",
                          width: "38px",
                          height: "38px",
                          placeItems: "center",
                          borderRadius: "10px",
                          background: "rgba(122, 255, 135, 0.12)",
                          color: "var(--accent-lime)",
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="badge badge-neutral">{feat.tag}</span>
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 8px", color: "var(--paper)" }}>
                      {feat.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--mist)", lineHeight: 1.6, margin: 0 }}>
                      {feat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" style={{ padding: "64px 0", borderTop: "1px solid var(--line)", background: "rgba(0,0,0,0.2)" }}>
          <div className="app-container" style={{ maxWidth: "800px" }}>
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <p className="eyebrow" style={{ justifyContent: "center" }}>
                Got Questions?
              </p>
              <h2 className="section-heading" style={{ fontSize: "30px" }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="glass-card"
                    style={{
                      padding: "18px 20px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                    }}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 650, color: "var(--paper)" }}>
                        {faq.q}
                      </span>
                      {isOpen ? <ChevronUp size={16} color="var(--accent-lime)" /> : <ChevronDown size={16} color="var(--mist)" />}
                    </div>
                    {isOpen && (
                      <p style={{ margin: "12px 0 0", fontSize: "14px", color: "var(--mist)", lineHeight: 1.6, borderTop: "1px solid var(--line)", paddingTop: "12px" }}>
                        {faq.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section style={{ padding: "80px 0", textAlign: "center" }}>
          <div className="app-container" style={{ maxWidth: "700px" }}>
            <h2 className="section-heading" style={{ fontSize: "36px", marginBottom: "14px" }}>
              Ready to study with clarity?
            </h2>
            <p className="page-lead" style={{ margin: "0 auto 32px" }}>
              Join students and parents building structured, consistent academic momentum every day.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <Button variant="primary" href="/register" size="lg">
                Create Free Account <ArrowRight size={16} />
              </Button>
              <Button variant="secondary" href="/login" size="lg">
                Sign In
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0 40px", background: "rgba(4, 9, 6, 0.95)" }}>
        <div className="app-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  display: "grid",
                  width: "24px",
                  height: "24px",
                  placeItems: "center",
                  borderRadius: "6px",
                  background: "var(--accent-lime)",
                  color: "#051409",
                  fontWeight: 800,
                  fontSize: "13px",
                }}
              >
                S
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--paper)" }}>
                Smart Study Portal
              </span>
            </div>
            <div style={{ display: "flex", gap: "20px", fontSize: "13px", color: "var(--mist)" }}>
              <Link href="/login" className="hover:text-white">Sign In</Link>
              <Link href="/register" className="hover:text-white">Register</Link>
              <Link href="/dashboard" className="hover:text-white">Student Dashboard</Link>
              <Link href="/parent" className="hover:text-white">Parent Portal</Link>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--mist)", width: "100%", textAlign: "center", paddingTop: "16px", borderTop: "1px solid var(--line)" }}>
              &copy; {new Date().getFullYear()} Smart Study Portal. Built for real comprehension and focused academic achievement.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
