"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Database,
  FileCheck,
  FileText,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  Search,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Page3DScrollScene } from "@/components/3d/page-3d-scroll-scene";

interface InteractiveQuizState {
  selectedOption: number | null;
  submitted: boolean;
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Interactive Active Recall Sandbox State
  const [quizState, setQuizState] = useState<InteractiveQuizState>({
    selectedOption: null,
    submitted: false,
  });

  // Persona Perspective Switcher
  const [activePersona, setActivePersona] = useState<"student" | "parent">("student");

  function handleSelectOption(index: number) {
    if (quizState.submitted) return;
    setQuizState({ selectedOption: index, submitted: true });
  }

  function handleResetQuiz() {
    setQuizState({ selectedOption: null, submitted: false });
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#080D1C] text-brand-light overflow-x-hidden selection:bg-primary-action/30 selection:text-white">
      {/* Unified 3D Knowledge Core Model Spanning Entire Page with Cinematic Scroll Transformation */}
      <Page3DScrollScene />

      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle/40 bg-[#080D1C]/85 backdrop-blur-md h-14">
        <div className="w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between h-full">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group" aria-label="Smart Study Portal Home">
            <Logo size={28} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-text-secondary" aria-label="Main Navigation">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#sandbox" className="hover:text-white transition-colors">
              Interactive Demo
            </a>
            <a href="#workflow" className="hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-[13px] font-medium text-text-secondary hover:text-white px-3 py-1.5 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Button
              variant="primary"
              href="/register"
              size="sm"
              className="text-[13px] px-3.5 py-1.5 shadow-[0_0_15px_rgba(113,133,255,0.4)]"
            >
              Get Started <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 relative z-10">
        {/* HERO SECTION - FULL-WIDTH STRETCHED WITH UNIFIED 3D KNOWLEDGE CORE */}
        <section className="relative min-h-[calc(100vh-56px)] flex items-center border-b border-border-subtle/30 overflow-hidden py-10 lg:py-16">
          {/* Ambient lighting accents */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_30%,rgba(113,133,255,0.12),transparent_70%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_40%,rgba(85,214,232,0.10),transparent_65%)]" />

          {/* Stretched Container spanning both left and right flanks */}
          <div className="w-full px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* LEFT FLANK: High-Impact Typography, Value Prop, CTAs & Proof */}
              <div className="lg:col-span-7 flex flex-col items-start text-left">
                
                {/* Status Pill with Pulsing Local AI Beacon */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-primary-action/30 bg-[#111E3B]/90 backdrop-blur-md mb-6 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADEA6] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ADEA6]" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-white">
                    Local AI Grounded Architecture
                  </span>
                  <span className="text-[11px] font-mono text-[#55D6E8] bg-[#55D6E8]/10 px-2 py-0.5 rounded-full border border-[#55D6E8]/30">
                    Zero Hallucinations
                  </span>
                </div>

                {/* Main Headline with Crisp High-Contrast Stretched Gradients */}
                <h1 className="text-3xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-white leading-[1.12] mb-6 font-heading">
                  The intelligent study portal{" "}
                  <span className="block bg-gradient-to-r from-white via-[#C4CEE4] to-[#7185FF] bg-clip-text text-transparent">
                    grounded in your actual
                  </span>
                  <span className="block bg-gradient-to-r from-[#7185FF] via-[#55D6E8] to-[#4ADEA6] bg-clip-text text-transparent">
                    course materials.
                  </span>
                </h1>

                {/* Subtitle - High Legibility */}
                <p className="text-base sm:text-lg text-[#C4CEE4] leading-relaxed max-w-2xl mb-8 font-sans font-normal">
                  Upload syllabus PDFs, lecture slides, and spreadsheets. Smart Study parses verified content, crafts active recall quizzes with citations, and guides focused study blocks without generic AI guesses.
                </p>

                {/* Primary CTAs with Luminous Periwinkle Hover */}
                <div className="flex flex-wrap items-center gap-3.5 mb-10 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    href="/register"
                    size="default"
                    className="px-6 py-3 text-[14px] font-semibold shadow-[0_0_24px_rgba(113,133,255,0.4)] hover:shadow-[0_0_32px_rgba(113,133,255,0.6)] transition-all transform hover:-translate-y-0.5"
                  >
                    Start Learning Free <ArrowRight size={15} className="ml-2" />
                  </Button>
                  <Button
                    variant="secondary"
                    href="/dashboard"
                    size="default"
                    className="px-5 py-3 text-[14px] font-medium border border-border-subtle bg-[#111E3B]/80 hover:bg-[#1A2A4B] text-white hover:border-primary-action/40 transition-all shadow-md"
                  >
                    <Compass size={15} className="mr-2 text-ai-accent" /> Explore Dashboard
                  </Button>
                  <a
                    href="#sandbox"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[#C4CEE4] hover:text-[#55D6E8] transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    <PlayCircle size={14} className="text-ai-accent" />
                    Live Interactive Demo ↓
                  </a>
                </div>

                {/* Trust & Grounding Proof Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full pt-6 border-t border-border-subtle/50 text-xs text-text-secondary">
                  <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle/70 bg-[#0D1731]/80 px-3.5 py-2.5 backdrop-blur-md shadow-sm">
                    <CheckCircle2 size={16} className="text-[#4ADEA6] shrink-0" />
                    <div>
                      <span className="font-semibold text-white block text-xs">100% Local Inference</span>
                      <span className="text-[11px] text-[#8998B7]">ChromaDB + Ollama</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle/70 bg-[#0D1731]/80 px-3.5 py-2.5 backdrop-blur-md shadow-sm">
                    <FileCheck size={16} className="text-[#55D6E8] shrink-0" />
                    <div>
                      <span className="font-semibold text-white block text-xs">Exact Citations</span>
                      <span className="text-[11px] text-[#8998B7]">Page & slide verified</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle/70 bg-[#0D1731]/80 px-3.5 py-2.5 backdrop-blur-md shadow-sm col-span-2 sm:col-span-1">
                    <ShieldCheck size={16} className="text-[#7185FF] shrink-0" />
                    <div>
                      <span className="font-semibold text-white block text-xs">Parent Progress</span>
                      <span className="text-[11px] text-[#8998B7]">Audit ledger & review</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT FLANK: Spatial Frame Showcasing the Background 3D Knowledge Core */}
              <div className="lg:col-span-5 relative mt-6 lg:mt-0 min-h-[460px] flex flex-col justify-between">
                {/* Floating Ambient Glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#7185FF]/20 via-[#55D6E8]/20 to-[#4ADEA6]/15 blur-xl opacity-60 pointer-events-none" />

                {/* Top Telemetry Header Bar */}
                <div className="relative z-10 flex items-center justify-between p-3.5 rounded-xl border border-border-bright/60 bg-[#0B1328]/85 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FB7185]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F6C56B]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4ADEA6]" />
                    </div>
                    <span className="text-xs font-mono font-medium text-white ml-2">
                      ai-knowledge-core.mesh
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#55D6E8] animate-pulse" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#55D6E8] bg-[#55D6E8]/10 px-2 py-0.5 rounded border border-[#55D6E8]/30">
                      Unified 3D Scroll
                    </span>
                  </div>
                </div>

                {/* Open Viewport Window framing the 3D model */}
                <div className="relative my-4 h-64 sm:h-72 pointer-events-none flex items-center justify-center">
                  {/* Subtle target reticle to frame the 3D core */}
                  <div className="w-60 h-60 rounded-full border border-dashed border-[#7185FF]/30 animate-spin [animation-duration:50s]" />
                  <div className="absolute w-44 h-44 rounded-full border border-[#55D6E8]/20" />
                </div>

                {/* Stretched HUD Info Badges below the 3D core */}
                <div className="relative z-10 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-border-subtle/80 bg-[#0B1328]/90 p-3 backdrop-blur-md shadow-xl">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-mono mb-1">
                      <Database size={12} className="text-[#55D6E8]" /> Vector Embeddings
                    </div>
                    <div className="font-semibold text-white text-[13px]">
                      128-dim Cosine Sim
                    </div>
                    <div className="text-[11px] text-[#4ADEA6] font-mono mt-0.5">
                      0.984 Confidence
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-subtle/80 bg-[#0B1328]/90 p-3 backdrop-blur-md shadow-xl">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-mono mb-1">
                      <Brain size={12} className="text-[#7185FF]" /> Active Recall
                    </div>
                    <div className="font-semibold text-white text-[13px]">
                      Spaced Repetition
                    </div>
                    <div className="text-[11px] text-[#55D6E8] font-mono mt-0.5">
                      5 Target Subjects
                    </div>
                  </div>
                </div>

                {/* Floating HUD Badge (Top-Left) */}
                <div className="hidden sm:flex absolute top-14 -left-4 items-center gap-2 rounded-xl border border-[#55D6E8]/40 bg-[#080D1C]/95 px-3 py-1.5 shadow-2xl backdrop-blur-md z-20">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#55D6E8]/20 text-[#55D6E8]">
                    ✓
                  </span>
                  <div className="text-[11px] leading-tight">
                    <div className="font-semibold text-white">Verified Citation</div>
                    <div className="text-[10px] text-[#55D6E8] font-mono">Cellular Biology · p. 42</div>
                  </div>
                </div>

                {/* Floating HUD Badge (Bottom-Right) */}
                <div className="hidden sm:flex absolute bottom-24 -right-3 items-center gap-2 rounded-xl border border-[#7185FF]/40 bg-[#080D1C]/95 px-3 py-1.5 shadow-2xl backdrop-blur-md z-20">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#7185FF]/20 text-[#7185FF]">
                    ⚡
                  </span>
                  <div className="text-[11px] leading-tight">
                    <div className="font-semibold text-white">Local RAG Latency</div>
                    <div className="text-[10px] text-[#7185FF] font-mono">18ms · Zero Cloud Leak</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* INTERACTIVE SANDBOX SECTION - STRETCHED FULL WIDTH */}
        <section id="sandbox" className="py-16 md:py-24 border-b border-border-subtle/30 bg-[#080D1C]/65 backdrop-blur-[2px]">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-ai-accent block mb-2 font-mono">
                Live Interactive Sandbox
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                Experience source-grounded learning
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Test how questions are answered using real extracted syllabus passages rather than generic guesses.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* Sandbox Card 1: Active Recall Quiz */}
              <div className="lg:col-span-7 rounded-2xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between border-b border-border-subtle/60 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="grid w-8 h-8 place-items-center rounded-lg bg-[#7185FF]/20 text-primary-action border border-[#7185FF]/30">
                        <Brain size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Active Recall Simulator</h3>
                        <p className="text-xs text-text-muted">Cellular Biology · Chapter 4: Membrane Dynamics</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#7185FF]/15 text-[#899AFF] border border-[#7185FF]/30">
                      Interactive
                    </span>
                  </div>

                  {/* Question Stem */}
                  <div className="mb-4 p-4 rounded-xl bg-[#080D1C]/80 border border-border-subtle/70">
                    <span className="text-xs font-semibold text-ai-accent block mb-1 font-mono">
                      Question 1 of 5
                    </span>
                    <p className="text-sm sm:text-base font-medium text-white leading-snug">
                      Which mechanism allows ions such as Na⁺ and K⁺ to move against their electrochemical gradient across the plasma membrane?
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5 mb-5">
                    {[
                      { text: "Simple passive diffusion through lipid bilayer", correct: false },
                      { text: "Primary active transport utilizing ATP hydrolysis", correct: true },
                      { text: "Osmotic pressure gradient equalisation", correct: false },
                      { text: "Facilitated diffusion via aquaporin channels", correct: false },
                    ].map((opt, idx) => {
                      const isSelected = quizState.selectedOption === idx;
                      let optionClasses = "border-border-subtle/60 bg-[#080D1C]/60 text-text-secondary hover:border-border-bright hover:bg-[#111E3B]/60";

                      if (quizState.submitted) {
                        if (opt.correct) {
                          optionClasses = "border-emerald-500/70 bg-emerald-500/15 text-emerald-100 font-semibold";
                        } else if (isSelected && !opt.correct) {
                          optionClasses = "border-red-500/70 bg-red-500/15 text-red-200";
                        } else {
                          optionClasses = "border-border-subtle/40 opacity-40 text-text-muted";
                        }
                      } else if (isSelected) {
                        optionClasses = "border-primary-action bg-primary-action/20 text-white font-medium";
                      }

                      return (
                        <button
                          key={opt.text}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm cursor-pointer ${optionClasses}`}
                          disabled={quizState.submitted}
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid w-6 h-6 place-items-center rounded-md bg-[#111E3B] text-xs font-bold text-white border border-border-subtle">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {quizState.submitted && opt.correct && (
                            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Verification Snippet */}
                  {quizState.submitted && (
                    <div className="p-4 rounded-xl bg-[#080D1C]/90 border border-emerald-500/40 text-xs sm:text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-emerald-300 flex items-center gap-1.5 text-xs">
                          <FileCheck size={15} /> Grounded Syllabus Citation
                        </span>
                        <span className="text-[11px] text-text-muted font-mono">Campbell Biology 12th Ed · Page 138</span>
                      </div>
                      <p className="text-text-secondary italic leading-relaxed">
                        &ldquo;Primary active transport directly relies on the expenditure of metabolic energy (ATP) to transport molecules against their concentration gradient, exemplified by the Na⁺/K⁺-ATPase pump.&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-muted">
                  <span className="font-medium text-text-secondary">{!quizState.submitted ? "Select an option to test recall" : "Answer verified from syllabus"}</span>
                  {quizState.submitted && (
                    <button
                      onClick={handleResetQuiz}
                      className="flex items-center gap-1.5 text-primary-action font-semibold hover:underline cursor-pointer"
                    >
                      <RotateCcw size={13} /> Reset Question
                    </button>
                  )}
                </div>
              </div>

              {/* Sandbox Card 2: Transparency & Persona Engine */}
              <div className="lg:col-span-5 rounded-2xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex items-center justify-between border-b border-border-subtle/60 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="grid w-8 h-8 place-items-center rounded-lg bg-[#55D6E8]/20 text-ai-accent border border-[#55D6E8]/30">
                        <Users size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Shared Transparency</h3>
                        <p className="text-xs text-text-muted">Role-based perspectives</p>
                      </div>
                    </div>

                    {/* Persona Toggle */}
                    <div className="flex rounded-lg bg-[#080D1C] p-1 border border-border-subtle">
                      <button
                        onClick={() => setActivePersona("student")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          activePersona === "student"
                            ? "bg-primary-action text-white shadow-md"
                            : "text-text-muted hover:text-white"
                        }`}
                      >
                        Student
                      </button>
                      <button
                        onClick={() => setActivePersona("parent")}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                          activePersona === "parent"
                            ? "bg-primary-action text-white shadow-md"
                            : "text-text-muted hover:text-white"
                        }`}
                      >
                        Parent
                      </button>
                    </div>
                  </div>

                  {activePersona === "student" ? (
                    <div className="space-y-3.5">
                      <div className="p-4 rounded-xl bg-[#080D1C]/75 border border-border-subtle/70">
                        <div className="text-xs font-semibold text-white mb-1.5">Today&apos;s Focus Goal</div>
                        <div className="text-xs sm:text-sm text-text-secondary">2 Pomodoro blocks remaining for Organic Chemistry</div>
                        <div className="mt-3 w-full bg-[#111E3B] rounded-full h-2">
                          <div className="bg-primary-action h-2 rounded-full" style={{ width: "60%" }} />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#080D1C]/75 border border-border-subtle/70">
                        <div className="text-xs font-semibold text-white mb-1.5">Recent AI Tutor Question</div>
                        <p className="text-xs sm:text-sm text-text-secondary italic">
                          &ldquo;What are the core operations and time complexity of a Stack in Data Structures Full Notes.pdf?&rdquo;
                        </p>
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4ADEA6]/15 border border-[#4ADEA6]/30 text-[11px] text-[#4ADEA6] font-medium">
                          <CheckCircle2 size={13} /> Cited [Data Structures Full Notes.pdf, page 1]
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="p-4 rounded-xl bg-[#080D1C]/75 border border-border-subtle/70">
                        <div className="text-xs font-semibold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                          <ShieldCheck size={15} /> Weekly Activity Ledger
                        </div>
                        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                          Verified: 3 hr 45 min total focused study, 4 quizzes completed with 91% average accuracy.
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[#080D1C]/75 border border-border-subtle/70">
                        <div className="text-xs font-semibold text-white mb-1.5">Study Consistency</div>
                        <div className="flex items-center gap-2 mt-3">
                          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                            <div key={i} className="flex-1 text-center">
                              <div className={`h-7 rounded-md ${i < 5 ? "bg-primary-action shadow-[0_0_8px_rgba(113,133,255,0.4)]" : "bg-[#111E3B]"} mb-1.5`} />
                              <span className="text-[11px] font-semibold text-text-muted">{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-muted">
                  <span>Privacy-first audit ledger</span>
                  <Link href="/login" className="text-primary-action font-semibold hover:underline">
                    Access Portal &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CORE FEATURES PILLARS - STRETCHED FULL WIDTH */}
        <section id="features" className="py-16 md:py-24 border-b border-border-subtle/30 bg-[#080D1C]/50 backdrop-blur-[2px]">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-action block mb-2 font-mono">
                Core Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                Built for academic rigor, not generic chat
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Everything you need to master your syllabus through proven cognitive learning principles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl p-7 hover:border-primary-action/50 transition-all shadow-xl hover:-translate-y-1">
                <div className="grid w-11 h-11 place-items-center rounded-xl bg-primary-action/20 border border-primary-action/30 text-primary-action mb-5">
                  <FileText size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  Document-Grounded RAG
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Ingests PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), CSV and TXT files. Generates precise answers citing page numbers, slides, and spreadsheet rows.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl p-7 hover:border-primary-action/50 transition-all shadow-xl hover:-translate-y-1">
                <div className="grid w-11 h-11 place-items-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mb-5">
                  <Brain size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  Active Recall Quizzes
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Automatically extracts core definitions and high-yield concepts from your materials to build practice tests with instant rationale and source excerpts.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl p-7 hover:border-primary-action/50 transition-all shadow-xl hover:-translate-y-1">
                <div className="grid w-11 h-11 place-items-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mb-5">
                  <Clock size={22} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2.5">
                  Focus Mode & Analytics
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Integrated Pomodoro intervals tied directly to study tasks. Real-time telemetry logs study duration, completion rates, and retention trends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW SECTION - STRETCHED FULL WIDTH */}
        <section id="workflow" className="py-16 md:py-24 border-b border-border-subtle/30 bg-[#080D1C]/65 backdrop-blur-[2px]">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center mb-14">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4ADEA6] block mb-2 font-mono">
                Workflow
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
                How Smart Study works
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                From raw files to verified mastery in three straightforward steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/85 backdrop-blur-xl p-7 shadow-xl flex flex-col items-center text-center">
                <div className="grid w-12 h-12 place-items-center rounded-2xl bg-primary-action/20 border border-primary-action/40 text-primary-action text-base font-bold mb-4 shadow-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-white mb-2">Upload Course Materials</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Drag and drop syllabus PDFs, lecture slide decks, or spreadsheets. Files are indexed into local vector storage.
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/85 backdrop-blur-xl p-7 shadow-xl flex flex-col items-center text-center">
                <div className="grid w-12 h-12 place-items-center rounded-2xl bg-[#55D6E8]/20 border border-[#55D6E8]/40 text-[#55D6E8] text-base font-bold mb-4 shadow-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-white mb-2">Query & Generate Quizzes</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Ask questions with guaranteed citations. Generate adaptive multiple-choice quizzes to verify retention.
                </p>
              </div>

              <div className="rounded-2xl border border-border-subtle/80 bg-[#0D1731]/85 backdrop-blur-xl p-7 shadow-xl flex flex-col items-center text-center">
                <div className="grid w-12 h-12 place-items-center rounded-2xl bg-[#4ADEA6]/20 border border-[#4ADEA6]/40 text-[#4ADEA6] text-base font-bold mb-4 shadow-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-white mb-2">Track & Share Progress</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Log focused sessions and review trends on your dashboard with transparent parent progress sharing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ SECTION - STRETCHED */}
        <section id="faq" className="py-16 md:py-24 border-b border-border-subtle/30 bg-[#080D1C]/50 backdrop-blur-[2px]">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-ai-accent block mb-2 font-mono">
                Questions & Answers
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="w-full max-w-5xl mx-auto space-y-3.5">
              {[
                {
                  q: "Does Smart Study require a paid API key or cloud subscription?",
                  a: "No. Smart Study runs entirely on local models using Ollama (Llama 3.2 3B and Nomic-Embed-Text). All inference and document embeddings remain on your machine with zero external cloud dependencies.",
                },
                {
                  q: "How does the AI prevent hallucinating answers?",
                  a: "Every query searches your uploaded documents using dense vector similarity. The model is strictly instructed to answer using retrieved source passages, providing verifiable citations like [Filename.pdf, page 12]. If a general question is asked, it uses broad knowledge with clear explanation.",
                },
                {
                  q: "Which file formats are supported?",
                  a: "PDF (with OCR fallback for scanned pages), Word (DOCX), Excel (XLSX, XLSM), PowerPoint (PPTX), CSV, Markdown, and plain text files.",
                },
                {
                  q: "How does the Parent Portal work?",
                  a: "Parents can link their accounts to view student study minutes, quiz scores, and task completion metrics without intruding on day-to-day work.",
                },
              ].map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border-subtle/80 bg-[#0D1731]/90 backdrop-blur-xl overflow-hidden shadow-lg transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-primary-action transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      {isOpen ? <ChevronUp size={18} className="text-primary-action shrink-0 ml-2" /> : <ChevronDown size={18} className="text-text-muted shrink-0 ml-2" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border-subtle/60 pt-4">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA BANNER - STRETCHED */}
        <section className="py-20 md:py-28 text-center relative z-10">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="w-full max-w-5xl mx-auto p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#111E3B]/95 to-[#080D1C]/95 border border-primary-action/30 backdrop-blur-xl shadow-2xl">
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                Ready to master your course materials?
              </h2>
              <p className="text-base text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
                Create your account in seconds, upload your syllabus materials, and experience real local AI learning.
              </p>
              <Button
                variant="primary"
                href="/register"
                size="default"
                className="px-8 py-3.5 text-base font-semibold shadow-[0_0_25px_rgba(113,133,255,0.5)]"
              >
                Get Started Now <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-brand-neutral/20 py-8 bg-brand-primary text-xs text-brand-muted">
        <div className="app-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center group">
            <Logo size={22} textSize="text-xs font-medium text-brand-neutral" />
          </Link>
          <p>© 2026 Smart Study. Clean, source-grounded learning.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-brand-neutral transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-brand-neutral transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
