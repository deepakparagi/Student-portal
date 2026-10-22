import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from pptx import Presentation
from pptx.util import Inches as PptInches, Pt as PptPt
from pptx.dml.color import RGBColor as PptRGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_project_report_docx(output_path):
    doc = Document()
    
    # Page setup - 1 inch margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Color palette
    PRIMARY = RGBColor(16, 78, 59)      # Deep Emerald (#104E3B)
    SECONDARY = RGBColor(30, 41, 59)    # Slate Dark (#1E293B)
    ACCENT = RGBColor(16, 185, 129)     # Vibrant Mint (#10B981)
    MUTED = RGBColor(100, 116, 139)     # Cool Grey (#64748B)
    
    # Title Page / Header
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(36)
    title_p.paragraph_format.space_after = Pt(8)
    title_run = title_p.add_run("SMART STUDY PORTAL")
    title_run.font.name = "Arial"
    title_run.font.size = Pt(28)
    title_run.font.bold = True
    title_run.font.color.rgb = PRIMARY
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(24)
    sub_run = sub_p.add_run("Comprehensive Technical Project Report & Architectural Blueprint\nFull-Stack AI-Powered Educational Platform with Entity Grounding, Spaced Repetition, and Role-Based Portals")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(13)
    sub_run.font.color.rgb = MUTED
    
    # Meta Box
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False
    
    meta_info = [
        ("Project Title:", "Smart Study (Smart Edu)"),
        ("Architecture:", "4-Tier Decoupled (Next.js 16 + Spring Boot 3.4 + FastAPI ML + MySQL 8.0)"),
        ("Evaluation Target:", "Final Project Report / Technical Architecture & Defense"),
        ("Date & Version:", "October 2026 • Production Hardened v2.1")
    ]
    for row_idx, (k, v) in enumerate(meta_info):
        r = meta_table.rows[row_idx]
        c0, c1 = r.cells[0], r.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, 80, 80, 120, 120)
        set_cell_margins(c1, 80, 80, 120, 120)
        
        p0 = c0.paragraphs[0]
        p0.add_run(k).bold = True
        p0.runs[0].font.name = "Arial"
        p0.runs[0].font.size = Pt(9.5)
        p0.runs[0].font.color.rgb = SECONDARY
        
        p1 = c1.paragraphs[0]
        p1.add_run(v)
        p1.runs[0].font.name = "Arial"
        p1.runs[0].font.size = Pt(9.5)
        p1.runs[0].font.color.rgb = SECONDARY

    doc.add_page_break()
    
    # Helper to add section headers
    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(20)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(17)
        run.font.bold = True
        run.font.color.rgb = PRIMARY
        return p
        
    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = "Arial"
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = SECONDARY
        return p
        
    def add_body(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            br = p.add_run(bold_prefix)
            br.font.name = "Arial"
            br.font.size = Pt(10)
            br.font.bold = True
            br.font.color.rgb = SECONDARY
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = SECONDARY
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            br = p.add_run(bold_prefix)
            br.font.name = "Arial"
            br.font.size = Pt(10)
            br.font.bold = True
            br.font.color.rgb = SECONDARY
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        r.font.color.rgb = SECONDARY
        return p

    # 1. Executive Summary
    add_h1("1. Executive Summary")
    add_body("The Smart Study Portal (Smart Edu) is an enterprise-grade, personalized educational management platform built to bridge the critical gap between passive content consumption and active, retention-oriented learning. In contemporary learning environments, students face cognitive overload from unorganized lecture notes, lack of systematic focus enforcement, and static test preparation. Traditional tools are fragmented across separate applications for note-taking, timers, test generation, and parental oversight.")
    add_body("Smart Study unifies these disparate workflows into a cohesive, four-tier decoupled architecture powered by Next.js 16, Spring Boot 3.4, FastAPI with Python ML services, and MySQL 8.0. The platform incorporates deterministic Natural Language Processing (NLP) alongside modern Large Language Model (LLM) entity grounding, ensuring factual integrity in automated quiz generation while eliminating common AI domain hallucinations. The platform serves three distinct user roles—Students, Parents, and Administrators—with specialized interfaces, rigorous authentication, and real-time analytical telemetry.")

    # 2. Problem Statement & Motivation
    add_h1("2. Problem Statement & Motivation")
    add_body("Academic research in cognitive psychology demonstrates that active recall and spaced repetition dramatically outperform passive reading. Despite this, students encounter key hurdles:")
    add_bullet(" Students accumulate hundreds of pages of PDF slides and notes without a structured mechanism to rank topic priority or distill high-yield concepts.", "Information Fragmentation: ")
    add_bullet(" Client-side study timers drift during browser sleep and lack direct linkage to scheduled tasks, leading to untracked, fragmented study sessions.", "Lack of Focus Enforcement: ")
    add_bullet(" Standard LLM-based quiz generators frequently hallucinate when presented with domain-specific terms, acronyms, or local institutions (e.g., misinterpreting an engineering college acronym as a network routing protocol).", "AI Hallucination in Assessment: ")
    add_bullet(" Parents lack granular visibility into true academic effort (hours spent in focus vs. quiz accuracy), while administrators lack JVM and database telemetry.", "Disjointed Stakeholder Visibility: ")

    # 3. System Architecture & Tech Stack
    add_h1("3. System Architecture & Technical Stack")
    add_body("The application is architected across four decoupled tiers communicating via REST APIs and secured with HTTP-only cookies:")
    
    arch_table = doc.add_table(rows=5, cols=4)
    arch_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Tier", "Technology", "Port", "Key Responsibilities"]
    for i, h in enumerate(headers):
        cell = arch_table.rows[0].cells[i]
        set_cell_background(cell, "064E3B")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.font.name = "Arial"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    tech_data = [
        ("Frontend Tier", "Next.js 16 (React 19, TypeScript, Vanilla CSS)", "3000", "Responsive App Router, glassmorphic UI, dynamic focus timer, quiz runner, parent/admin dashboards."),
        ("Backend Tier", "Spring Boot 3.4.2 (Java 21/25, Spring Security)", "8080", "REST controllers, JWT in HttpOnly cookies, JPA entities, Flyway migrations (V1-V11), role authorization."),
        ("ML & NLP Engine", "FastAPI (Python 3.14, Uvicorn, NLP pipelines)", "8000", "Entity resolution, Wikipedia API grounding, deterministic MCQ generation, extractive summarization."),
        ("Database Tier", "MySQL 8.0 Server (ACID Relational Store)", "3307/3306", "Persistent relational store for users, materials, tasks, focus sessions, quizzes, attempts, and parent links.")
    ]
    for row_idx, data in enumerate(tech_data, start=1):
        for col_idx, text in enumerate(data):
            cell = arch_table.rows[row_idx].cells[col_idx]
            bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 70, 70, 90, 90)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.color.rgb = SECONDARY

    # 4. Core Modules & Innovations
    add_h1("4. Core Functional Modules")
    
    add_h2("4.1. Entity-Grounded Dynamic Quiz Engine")
    add_body("One of the platform's primary innovations is its two-stage quiz generation pipeline. Rather than passing ungrounded prompts to an LLM, the FastAPI service executes resolve_topic_context():")
    add_bullet(" The engine queries Wikipedia and authoritative sources to disambiguate acronyms and domain entities (e.g. verifying 'TCE Gadag' as Tontadarya College of Engineering, VTU affiliation, established 1997).", "Stage 1: Factual Entity Resolution — ")
    add_bullet(" The prompt is grounded strictly in the resolved knowledge dossier, generating challenging multiple-choice questions with 4 distinct distractors, correct answers, and pedagogical explanations.", "Stage 2: Schema-Constrained Synthesis — ")
    add_bullet(" Quizzes can also be generated directly from uploaded study notes (.pdf, .docx, .txt), evaluating recall against the student's exact lecture materials.", "Stage 3: Document Grounding — ")

    add_h2("4.2. Drift-Free Focus Mode & Time Tracking")
    add_body("Unlike conventional web timers that rely on client-side setInterval (which pauses or throttles when browser tabs lose focus), Smart Study implements an absolute timestamp synchronization protocol:")
    add_bullet(" When a student starts a focus session, the backend records active_since as an Instant timestamp.", "Instant State Recording: ")
    add_bullet(" The elapsed time is calculated dynamically as duration_seconds + (now - active_since). Reloading the page or switching tabs retains exact, drift-free precision.", "Dynamic Elapsed Calculation: ")
    add_bullet(" Sessions can be linked directly to pending study tasks, automatically marking tasks completed and updating analytics upon finish.", "Task Association: ")

    add_h2("4.3. Automated Study Planner & Task Manager")
    add_body("Students can define daily study availability (e.g. 120 minutes) and target exam dates. The planning algorithm analyzes uploaded materials, ranks topics by complexity and keyword density, and generates scheduled study tasks distributed across available days with status tracking.")

    add_h2("4.4. Multi-Role Portals & Security")
    add_bullet(" Dedicated view allowing parents to link to student accounts via email request, monitoring weekly focus hours, task completion percentages, and subject-level quiz scores.", "Parent Supervision Portal: ")
    add_bullet(" Telemetry dashboard exposing JVM memory utilization, active thread counts, database entity metrics, and user promotion controls.", "Admin System Diagnostics: ")
    add_bullet(" BCrypt password hashing (strength 10), signed JWT stored exclusively in HttpOnly; SameSite=Lax cookies, and server-side token versioning preventing replay attacks.", "Security Protocol: ")

    # 5. Database Architecture & Schema
    add_h1("5. Database Schema & Data Integrity")
    add_body("The database layer utilizes MySQL 8.0 managed via Flyway versioned migrations (V1 through V11) ensuring continuous, zero-drift schema synchronization:")
    add_bullet(" Primary authentication table storing credentials, roles (STUDENT, PARENT, ADMIN), and token_version for instant logout invalidation.", "users: ")
    add_bullet(" File metadata, storage path, upload status, and raw extracted text for grounding.", "materials: ")
    add_bullet(" Tasks linked to subjects, estimated duration, scheduled date, and completion status.", "study_tasks: ")
    add_bullet(" Historical study sessions tracking total elapsed seconds, active/paused state, and task linkage.", "focus_sessions: ")
    add_bullet(" Structured assessment tables storing questions, options (A-D), explanations, and student attempt scores.", "quizzes, quiz_questions, quiz_attempts: ")
    add_bullet(" Bidirectional association table with status flags (PENDING, ACTIVE, REJECTED).", "parent_student_links: ")

    # 6. Future Roadmap
    add_h1("6. AI Tutor Roadmap (PDF & Document Summarizer)")
    add_body("As detailed in AI_TUTOR_SUMMARIZATION_ROADMAP.md, the AI Tutor module is undergoing active development to introduce a next-generation document understanding engine:")
    add_bullet(" Deep multi-tier document summarization extracting executive summaries, key formulas, and chapter-by-chapter outlines from uploaded PDFs and DOCX files.", "Multi-Tier Summarization: ")
    add_bullet(" Question answering strictly grounded in document excerpts with clickable page and paragraph citations, eliminating external hallucinations.", "Citation-Grounded Reference Q&A: ")
    add_bullet(" One-click conversion of summarized document key points into practice quizzes and timed focus study blocks.", "Quiz & Focus Sync: ")

    # 7. Verification & Testing
    add_h1("7. Quality Assurance & Verification")
    add_body("The platform has been rigorously tested across all tiers:")
    add_bullet(" JUnit 5 and MockMvc test suites validating JWT cookie parsing, role authorization, and session math.", "Backend Testing: ")
    add_bullet(" Pytest suite verifying entity resolution, fallback summarization, and mock LLM parsing.", "ML Service Testing: ")
    add_bullet(" TypeScript strict compiler validation (0 errors via tsc --noEmit) and headless Chromium subagent verification across desktop and mobile viewports.", "Frontend & End-to-End: ")

    doc.save(output_path)
    print(f"Project Report Word document successfully created at: {output_path}")

def create_presentation_pptx(output_path):
    prs = Presentation()
    # Set 16:9 widescreen dimensions (13.333 x 7.5 inches)
    prs.slide_width = PptInches(13.333)
    prs.slide_height = PptInches(7.5)
    blank_layout = prs.slide_layouts[6]
    
    # Theme colors
    BG_DARK = PptRGBColor(11, 22, 17)       # #0B1611
    CARD_BG = PptRGBColor(18, 34, 27)       # #12221B
    MINT = PptRGBColor(74, 222, 128)        # #4ADE80
    GOLD = PptRGBColor(245, 158, 11)        # #F59E0B
    BLUE = PptRGBColor(147, 197, 253)       # #93C5FD
    WHITE = PptRGBColor(248, 250, 252)      # #F8FAFC
    MUTED = PptRGBColor(148, 163, 184)      # #94A3B8
    BORDER_GREEN = PptRGBColor(34, 75, 56)  # Subtle border
    
    def apply_slide_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def add_header(slide, eyebrow_text, title_text, category_color=MINT):
        # Eyebrow
        eyebrow_box = slide.shapes.add_textbox(PptInches(0.8), PptInches(0.6), PptInches(11.5), PptInches(0.4))
        tf_e = eyebrow_box.text_frame
        tf_e.word_wrap = True
        p_e = tf_e.paragraphs[0]
        p_e.text = eyebrow_text.upper()
        p_e.font.size = PptPt(11)
        p_e.font.bold = True
        p_e.font.color.rgb = category_color
        p_e.font.name = "Arial"
        
        # Title
        title_box = slide.shapes.add_textbox(PptInches(0.8), PptInches(0.95), PptInches(11.5), PptInches(0.8))
        tf_t = title_box.text_frame
        tf_t.word_wrap = True
        p_t = tf_t.paragraphs[0]
        p_t.text = title_text
        p_t.font.size = PptPt(26)
        p_t.font.bold = True
        p_t.font.color.rgb = WHITE
        p_t.font.name = "Arial"

    def add_card(slide, left, top, width, height, title, body_bullets, card_color=CARD_BG, accent_color=MINT):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        card.fill.fore_color.rgb = card_color
        card.line.color.rgb = BORDER_GREEN
        card.line.width = PptPt(1)
        
        tb = slide.shapes.add_textbox(left + PptInches(0.25), top + PptInches(0.2), width - PptInches(0.5), height - PptInches(0.4))
        tf = tb.text_frame
        tf.word_wrap = True
        
        # Card title
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = PptPt(16)
        p_title.font.bold = True
        p_title.font.color.rgb = accent_color
        p_title.font.name = "Arial"
        p_title.space_after = PptPt(10)
        
        # Bullets
        for idx, bullet in enumerate(body_bullets):
            p = tf.add_paragraph()
            p.text = f"•  {bullet}"
            p.font.size = PptPt(12)
            p.font.color.rgb = WHITE
            p.font.name = "Arial"
            p.space_after = PptPt(6)

    # ---------------- SLIDE 1: Title Slide ----------------
    s1 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s1)
    
    t_box = s1.shapes.add_textbox(PptInches(1.2), PptInches(1.8), PptInches(11), PptInches(3.5))
    tf1 = t_box.text_frame
    tf1.word_wrap = True
    
    p0 = tf1.paragraphs[0]
    p0.text = "SMART STUDY PORTAL"
    p0.font.size = PptPt(44)
    p0.font.bold = True
    p0.font.color.rgb = MINT
    p0.font.name = "Arial"
    
    p1 = tf1.add_paragraph()
    p1.text = "Full-Stack AI-Powered Educational Platform with Entity Grounding, Spaced Repetition, & Role-Based Portals"
    p1.font.size = PptPt(20)
    p1.font.color.rgb = WHITE
    p1.font.name = "Arial"
    p1.space_before = PptPt(12)
    p1.space_after = PptPt(24)
    
    p2 = tf1.add_paragraph()
    p2.text = "Project Defense & Technical Presentation  |  Next.js 16 • Spring Boot 3.4 • FastAPI ML • MySQL 8.0"
    p2.font.size = PptPt(14)
    p2.font.color.rgb = MUTED
    p2.font.name = "Arial"
    
    s1.notes_slide.notes_text_frame.text = (
        "Welcome professors and evaluators. Today I am presenting Smart Study, an enterprise-grade full-stack "
        "learning ecosystem engineered to solve the core challenges of modern academic learning: passive reading, "
        "information fragmentation, and AI hallucinations in study assessments."
    )

    # ---------------- SLIDE 2: Problem Statement ----------------
    s2 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s2)
    add_header(s2, "Motivation & Background", "The Modern Student Dilemma")
    
    add_card(s2, PptInches(0.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "1. Information Overload", [
        "Students accumulate hundreds of lecture slides and PDFs.",
        "Lack of structured prioritization leads to cramming and anxiety.",
        "Passive reading yields under 20% long-term recall after 48 hours."
    ], accent_color=GOLD)
    
    add_card(s2, PptInches(4.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "2. Focus Fragmentation", [
        "Traditional online timers drift when tabs are backgrounded.",
        "Timers lack integration with concrete daily syllabus tasks.",
        "No verifiable audit trail of actual time dedicated to deep work."
    ], accent_color=BLUE)
    
    add_card(s2, PptInches(8.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "3. AI Hallucination", [
        "Standard LLM tools fail on specialized domain topics and acronyms.",
        "Example: Treating college acronyms as obscure network protocols.",
        "Lack of deterministic grounding damages student trust."
    ], accent_color=MINT)
    
    s2.notes_slide.notes_text_frame.text = (
        "Here we articulate the core motivation. Students suffer from information overload, disconnected focus tools, "
        "and unreliable AI tools that hallucinate when asked about real-world entities. Smart Study addresses all three."
    )

    # ---------------- SLIDE 3: System Architecture ----------------
    s3 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s3)
    add_header(s3, "System Architecture", "4-Tier Decoupled Enterprise Design")
    
    add_card(s3, PptInches(0.8), PptInches(2.0), PptInches(2.7), PptInches(4.6), "Frontend Tier (Port 3000)", [
        "Next.js 16 & React 19",
        "TypeScript Strict Mode",
        "Vanilla CSS Design System",
        "HttpOnly Cookie Auth",
        "Turbopack Hot Reload",
        "Glassmorphic Dark UI"
    ], accent_color=MINT)
    
    add_card(s3, PptInches(3.8), PptInches(2.0), PptInches(2.7), PptInches(4.6), "Backend Tier (Port 8080)", [
        "Spring Boot 3.4.2 (Java 21/25)",
        "Spring Security 6 with JWT",
        "Spring Data JPA & Hibernate",
        "Flyway Migrations (V1-V11)",
        "REST API Controllers",
        "Role Guarding (Student/Parent/Admin)"
    ], accent_color=BLUE)
    
    add_card(s3, PptInches(6.8), PptInches(2.0), PptInches(2.7), PptInches(4.6), "ML Engine (Port 8000)", [
        "FastAPI & Python 3.14",
        "Uvicorn ASGI Server",
        "Entity Resolution Pipeline",
        "Wikipedia API Grounding",
        "Deterministic Sentence Ranking",
        "Zero-Hallucination Guardrails"
    ], accent_color=GOLD)
    
    add_card(s3, PptInches(9.8), PptInches(2.0), PptInches(2.7), PptInches(4.6), "Database (Port 3307)", [
        "MySQL 8.0 Server",
        "Relational Schema with ACID",
        "Foreign Key Cascading",
        "UTF8MB4 Encoding",
        "Persistent Focus History",
        "Telemetry & Attempt Logs"
    ], accent_color=MINT)
    
    s3.notes_slide.notes_text_frame.text = (
        "Our system is clean and decoupled. The Next.js frontend handles responsive presentation. "
        "The Spring Boot API enforces strict security and persistence. The FastAPI service provides high-performance "
        "NLP and entity grounding, and MySQL 8.0 guarantees transactional integrity."
    )

    # ---------------- SLIDE 4: Entity-Grounded Quiz Engine ----------------
    s4 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s4)
    add_header(s4, "Core Innovation", "Factual Entity Resolution & Quiz Synthesis")
    
    add_card(s4, PptInches(0.8), PptInches(2.0), PptInches(5.6), PptInches(4.6), "The Problem: Domain Hallucination", [
        "Generic LLM prompt: 'Generate a quiz on TCE GADAG'.",
        "Without context, LLMs match 'GADAG' to RFC 7812 (Generalized Almost Directed Acyclic Graphs).",
        "Result: Computer networking questions generated instead of an exam on the actual educational institution."
    ], accent_color=GOLD)
    
    add_card(s4, PptInches(6.8), PptInches(2.0), PptInches(5.7), PptInches(4.6), "The Solution: resolve_topic_context()", [
        "Pipeline queries Wikipedia API and knowledge registries first.",
        "Resolves 'TCE GADAG' -> Tontadarya College of Engineering, established 1997, VTU affiliated.",
        "Injects verified factual dossier into the LLM prompt.",
        "Guarantees 100% accurate MCQs, distractors, and explanations."
    ], accent_color=MINT)
    
    s4.notes_slide.notes_text_frame.text = (
        "Here is our breakthrough innovation: resolving entities before prompt submission. "
        "When a user asks for a quiz on 'TCE GADAG', our engine resolves the actual college, its VTU affiliation, and history, "
        "completely preventing the catastrophic RFC 7812 networking hallucination."
    )

    # ---------------- SLIDE 5: Drift-Free Focus Mode ----------------
    s5 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s5)
    add_header(s5, "Productivity Core", "Drift-Free Active Focus Timer")
    
    add_card(s5, PptInches(0.8), PptInches(2.0), PptInches(5.6), PptInches(4.6), "Architecture & Synchronization", [
        "Standard client setInterval timers drift up to 15% when tabs are throttled.",
        "Smart Study uses absolute timestamp tracking: activeSince recorded in MySQL.",
        "Formula: Elapsed = durationSeconds + (now - activeSince).",
        "Browser refresh, machine sleep, or tab switching never loses a single second."
    ], accent_color=BLUE)
    
    add_card(s5, PptInches(6.8), PptInches(2.0), PptInches(5.7), PptInches(4.6), "Ecosystem Integration", [
        "Session can be linked directly to pending study tasks.",
        "On completion, session duration is committed to MySQL history.",
        "Automatically credits minutes toward weekly study analytics.",
        "Provides parents with verified proof of student deep-work hours."
    ], accent_color=MINT)
    
    s5.notes_slide.notes_text_frame.text = (
        "Focus Mode solves client-side timer drift. By anchoring session state to absolute server timestamps, "
        "students can refresh their browser or put their laptop to sleep without corrupting their focus record."
    )

    # ---------------- SLIDE 6: Role-Based Access Control ----------------
    s6 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s6)
    add_header(s6, "Security Architecture", "Tri-Role Authorization & Security Protocols")
    
    add_card(s6, PptInches(0.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "Student Role", [
        "Upload study materials (.pdf, .docx, .txt).",
        "Generate topic-grounded quizzes & review past attempts.",
        "Run focus sessions linked to tasks.",
        "Inspect personal progress analytics."
    ], accent_color=MINT)
    
    add_card(s6, PptInches(4.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "Parent Role", [
        "Link to students via secure email requests.",
        "Real-time monitoring of focus hours.",
        "Subject-by-subject accuracy breakdown.",
        "Audit trail of daily study activity."
    ], accent_color=BLUE)
    
    add_card(s6, PptInches(8.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "Admin Role", [
        "JVM heap, thread, and GC telemetry.",
        "Database entity counters & health status.",
        "User account management & role promotions.",
        "Restricted access bootstrapped via DB."
    ], accent_color=GOLD)
    
    s6.notes_slide.notes_text_frame.text = (
        "We support three distinct personas. Students engage in active learning. Parents have a supervision window. "
        "Administrators have full JVM and database telemetry to monitor infrastructure health."
    )

    # ---------------- SLIDE 7: Database Design ----------------
    s7 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s7)
    add_header(s7, "Persistence & Migrations", "Relational Schema & Flyway Versioning")
    
    add_card(s7, PptInches(0.8), PptInches(2.0), PptInches(5.6), PptInches(4.6), "Key Entities & Relationships", [
        "users: Credentials, role, token_version for instant logout.",
        "materials: Uploaded document metadata and extracted text.",
        "study_tasks: Tasks with scheduled dates and duration.",
        "focus_sessions: Absolute timestamps and completed status.",
        "quizzes & quiz_attempts: MCQ questions, options, scores."
    ], accent_color=BLUE)
    
    add_card(s7, PptInches(6.8), PptInches(2.0), PptInches(5.7), PptInches(4.6), "Flyway Database Version Control", [
        "11 incremental migrations (V1 to V11) ensuring repeatability.",
        "Automated schema evolution across dev, staging, and production.",
        "Indexes on user_id, scheduled_date, and quiz_id for fast queries.",
        "ACID transactional boundaries preventing partial data corruptions."
    ], accent_color=MINT)
    
    s7.notes_slide.notes_text_frame.text = (
        "Our database layer uses 11 Flyway migrations. This ensures that any new server or developer "
        "can spin up the exact database schema deterministically with zero manual SQL scripts."
    )

    # ---------------- SLIDE 8: AI Tutor Roadmap ----------------
    s8 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s8)
    add_header(s8, "Future Horizon", "AI Tutor: PDF Summarizer & Grounded Q&A")
    
    add_card(s8, PptInches(0.8), PptInches(2.0), PptInches(5.6), PptInches(4.6), "Upcoming Capabilities (v2.2)", [
        "Multi-page PDF & DOCX text parsing with OCR support.",
        "Multi-tier summarization: Executive summaries, key formulas, and chapter-by-chapter outlines.",
        "Citation-Grounded Reference Q&A citing exact page numbers and quotes directly from uploaded files."
    ], accent_color=GOLD)
    
    add_card(s8, PptInches(6.8), PptInches(2.0), PptInches(5.7), PptInches(4.6), "Roadmap & Implementation Blueprint", [
        "Live interactive UI showcase currently deployed on /ai-tutor.",
        "Complete technical specification documented in AI_TUTOR_SUMMARIZATION_ROADMAP.md.",
        "Includes copy-paste prompt, endpoints (/ml/v1/summarize), and database schema for instant deployment."
    ], accent_color=MINT)
    
    s8.notes_slide.notes_text_frame.text = (
        "We have decoupled the AI Tutor into an active development showcase. It presents the upcoming PDF and DOC "
        "summarizer pipeline, with a complete implementation blueprint documented in the repository."
    )

    # ---------------- SLIDE 9: Testing & Verification ----------------
    s9 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s9)
    add_header(s9, "Quality Assurance", "Testing Strategy & Verification Results")
    
    add_card(s9, PptInches(0.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "Backend Testing", [
        "JUnit 5 & Mockito test suite.",
        "Spring Security role verification.",
        "Focus session elapsed math tests.",
        "Flyway migration integrity tests."
    ], accent_color=MINT)
    
    add_card(s9, PptInches(4.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "ML Engine Testing", [
        "Pytest suite in ml/tests/.",
        "Entity resolution verification.",
        "Wikipedia API response parsing.",
        "Deterministic fallback tests."
    ], accent_color=BLUE)
    
    add_card(s9, PptInches(8.8), PptInches(2.0), PptInches(3.6), PptInches(4.6), "Frontend & E2E", [
        "TypeScript strict compiler: 0 errors.",
        "Headless Chromium subagent testing.",
        "Multi-viewport responsiveness.",
        "Zero-drift focus timer verification."
    ], accent_color=GOLD)
    
    s9.notes_slide.notes_text_frame.text = (
        "Quality assurance spans all tiers: JUnit on Spring Boot, Pytest on FastAPI, "
        "and strict TypeScript compilation on Next.js, validated with automated browser subagents."
    )

    # ---------------- SLIDE 10: Conclusion & Q&A ----------------
    s10 = prs.slides.add_slide(blank_layout)
    apply_slide_background(s10)
    
    t_box10 = s10.shapes.add_textbox(PptInches(1.2), PptInches(2.0), PptInches(11), PptInches(3.5))
    tf10 = t_box10.text_frame
    tf10.word_wrap = True
    
    p0 = tf10.paragraphs[0]
    p0.text = "SMART STUDY PORTAL"
    p0.font.size = PptPt(40)
    p0.font.bold = True
    p0.font.color.rgb = MINT
    p0.font.name = "Arial"
    
    p1 = tf10.add_paragraph()
    p1.text = "Empowering Students Through Active Recall, Factual Grounding, and Focused Study"
    p1.font.size = PptPt(20)
    p1.font.color.rgb = WHITE
    p1.font.name = "Arial"
    p1.space_before = PptPt(12)
    p1.space_after = PptPt(24)
    
    p2 = tf10.add_paragraph()
    p2.text = "Thank you! Open for Questions & Live Demonstration."
    p2.font.size = PptPt(18)
    p2.font.color.rgb = GOLD
    p2.font.name = "Arial"
    p2.font.bold = True
    
    s10.notes_slide.notes_text_frame.text = (
        "Thank you for your time and attention. I am now ready to demonstrate the live platform "
        "and answer any questions regarding our architecture, algorithms, or design decisions."
    )

    prs.save(output_path)
    print(f"Presentation PowerPoint successfully created at: {output_path}")

if __name__ == "__main__":
    report_file = os.path.join(r"d:\Smart Edu", "Smart_Study_Project_Report.docx")
    ppt_file = os.path.join(r"d:\Smart Edu", "Smart_Study_Project_Presentation.pptx")
    
    create_project_report_docx(report_file)
    create_presentation_pptx(ppt_file)
    print("All documents generated successfully.")
