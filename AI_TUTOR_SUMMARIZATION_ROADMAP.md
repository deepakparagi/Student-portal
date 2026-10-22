# 📑 AI Tutor: PDF & Document Summarization and Citation-Grounded Q&A

> **Status:** Scheduled for Future Implementation (v2.2 / v2.3 Release)  
> **Target Capabilities:** Multi-page PDF/DOCX ingestion, deep structural text summarization, and zero-hallucination citation-grounded reference Q&A.

---

## 🎯 Future Implementation Master Prompt

When you are ready to implement this feature, simply copy and paste the prompt below into your AI assistant or agent:

````markdown
Please implement the **PDF & Document Text Summarization and Citation-Grounded Q&A Engine** for the Smart Study platform according to the specifications in `AI_TUTOR_SUMMARIZATION_ROADMAP.md`:

### Requirements:
1. **Document Ingestion (PDF, DOCX, TXT):**
   - In `ml/app/main.py`, implement an advanced document parser using `pypdf` (or `pdfplumber`) and `python-docx` that extracts text along with page and section metadata (e.g. `[Page X, Section Y]`).
   - Store parsed page chunks in the document database model (`materials` table: `summary_text`, `highlights_json`, `page_count`).

2. **Multi-Tier Text Summarization Endpoint (`/ml/v1/summarize`):**
   - Generate:
     a) **Executive Summary**: 3–5 bullet points summarizing the core thesis.
     b) **Key Concepts & Formulas**: Structured dictionary of definitions, formulas, and theorems.
     c) **Chapter-by-Chapter Outline**: Section-wise breakdowns.
   - Support both fast extractive summarization (local TextRank/LexRank) and high-quality abstractive summarization via LLM (e.g., OpenRouter / Groq / local HuggingFace model).

3. **Citation-Grounded Reference Q&A (`/ml/v1/tutor/qa-grounded`):**
   - Given an uploaded document ID and student question:
     a) Retrieve top 3–5 most relevant page chunks via TF-IDF / BM25 or cosine similarity embeddings.
     b) Generate the answer STRICTLY using those chunks.
     c) Attach exact citation objects (`{ "page": 14, "section": "3.2", "quote": "..." }`).
     d) If the question cannot be answered from the document, explicitly output: *"This topic is not discussed in the uploaded document."*

4. **Spring Boot Backend Integration:**
   - Update `Material.java` and Flyway migration `V12__add_material_summaries.sql` to persist `summary` and `page_count`.
   - Update `MaterialService.java` to trigger `/ml/v1/summarize` upon file upload.
   - Expose `GET /api/v1/materials/{id}/summary` and `POST /api/v1/tutor/qa-grounded`.

5. **Frontend UI in `frontend/src/app/ai-tutor/page.tsx`:**
   - Implement the live interactive PDF/DOC reader:
     - Document upload dropzone (.pdf, .docx, .txt).
     - Split or tabbed layout: Document Summary viewer on one side, and Grounded Citation Chat on the other.
     - Interactive citation tags (clicking a citation highlights the exact quoted text).
     - Export to practice quiz button ("Generate Quiz from Summary").
````

---

## 🏛️ Technical Architecture Blueprint

### 1. Document Parsing & Semantic Chunking Pipeline

```
[ User Uploads PDF / DOCX ]
           │
           ▼
[ Spring Boot: MaterialController.java ]
  • Saves file to storage
  • Passes file stream / path to FastAPI ML service
           │
           ▼
[ FastAPI: /ml/v1/parse-and-summarize ]
  • PDF: pypdf / pdfplumber extracts text per page:
      Chunk { page: 1, text: "..." }, Chunk { page: 2, text: "..." }
  • DOCX: python-docx extracts paragraphs and headings
           │
           ▼
[ Summarization Engine ]
  • Extractive: Rank top high-entropy sentences across document
  • Abstractive (LLM): Synthesize executive summary & key takeaways
           │
           ▼
[ MySQL Persistence ]
  • materials table updated with extracted_text, summary_text, highlights_json
```

---

### 2. Database Schema (Flyway Migration `V12`)

```sql
-- V12__add_material_summaries.sql
ALTER TABLE materials
  ADD COLUMN summary_text LONGTEXT NULL,
  ADD COLUMN key_takeaways_json JSON NULL,
  ADD COLUMN page_count INT NULL DEFAULT 1,
  ADD COLUMN summarized_at TIMESTAMP NULL;
```

---

### 3. FastAPI Service Specification (`ml/app/main.py`)

#### A. Document Summarization
```python
@app.post("/ml/v1/summarize")
async def summarize_document(file: UploadFile = File(...)):
    # 1. Extract text and page map
    pages = extract_pages_with_metadata(file)
    
    # 2. Generate multi-tier summary
    executive_summary = generate_executive_summary(pages)
    key_takeaways = extract_key_concepts(pages)
    
    return {
        "page_count": len(pages),
        "executive_summary": executive_summary,
        "key_takeaways": key_takeaways,
        "raw_text_length": sum(len(p["text"]) for p in pages)
    }
```

#### B. Grounded Reference Q&A
```python
@app.post("/ml/v1/tutor/qa-grounded")
async def grounded_qa(body: GroundedQARequest):
    # 1. Retrieve most relevant passage chunks
    ranked_chunks = retrieve_top_k_chunks(body.question, body.document_chunks, k=4)
    
    # 2. Strict grounding prompt
    prompt = f"""
    Answer the student's question SOLELY using the reference passages below.
    Always cite the exact page number and quote the supporting excerpt.
    If the answer is not in the passages, reply: "This topic is not covered in your document."

    Passages:
    {format_passages(ranked_chunks)}

    Question: {body.question}
    """
    
    response = call_llm(prompt)
    return {
        "answer": response.answer,
        "citations": [
            {"page": c.page, "section": c.section, "excerpt": c.excerpt}
            for c in ranked_chunks
        ]
    }
```

---

### 4. Frontend UI Components (`frontend/src/app/ai-tutor/`)

- **`SummaryViewer.tsx`**: Renders executive takeaways, key terms with flashcard export buttons, and chapter summaries.
- **`GroundedChat.tsx`**: Chat stream showing student questions and AI answers with interactive `[Page X]` badges.
- **`CitationModal.tsx`**: Displays the exact page excerpt and surrounding context when a student clicks on a citation pill.

---

## 📋 Implementation Checklist

- [ ] Install python libraries: `pip install pypdf python-docx pdfplumber` in `ml/.venv`.
- [ ] Create Flyway migration `V12__add_material_summaries.sql`.
- [ ] Implement `/ml/v1/summarize` and `/ml/v1/tutor/qa-grounded` in `ml/app/main.py`.
- [ ] Update `MaterialService.java` to invoke summarization upon file upload.
- [ ] Build the interactive split-screen viewer in `frontend/src/app/ai-tutor/page.tsx`.
- [ ] Add unit test verifying that off-document questions are rejected rather than hallucinated.
