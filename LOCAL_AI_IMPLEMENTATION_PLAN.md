# LOCAL AI IMPLEMENTATION PLAN — SMART STUDY PORTAL

## Current State Analysis

### Complete Local Architecture
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend API**: Spring Boot 3.4, Java 21, Spring Security, JWT session authentication, RestClient connection to ML Engine
- **ML / AI Engine**: FastAPI, Python 3.11+, PyMuPDF, python-docx, openpyxl, python-pptx, ChromaDB persistent vector store, Ollama local client
- **Database**: MySQL 8.0 running on localhost:3307 with Flyway migrations
- **Local LLM Runtime**: Ollama (Windows 64-bit) running at `http://127.0.0.1:11434`
- **Chat & Reasoning Model**: `qwen3.5:4b` (3.7 GB, quantized GGUF, ~50%/50% CPU/GPU allocation)
- **Embedding Model**: `nomic-embed-text` (323 MB, 100% GPU, 768 dimensions)
- **Hardware Profile**: HP Victus Laptop (AMD Ryzen 5 5600H, 16 GB DDR4 RAM, NVIDIA RTX 3050 Laptop GPU with 4 GB VRAM)

---

## Implementation Phases & Status

### Phase 1: Local LLM Configuration (Ollama) — [COMPLETED]
- [x] Configure Ollama local endpoints (`/api/chat` and `/api/embed`)
- [x] Implement `OllamaClient` wrapper with timeout and retry logic
- [x] Create health check verifying Ollama server and installed models
- [x] Optimize context size to 2048 tokens and max tokens to 500 to prevent VRAM overflow on RTX 3050 (4 GB)
- [x] Support deep reasoning fallback (`response.message.thinking`) for `qwen3.5:4b`

### Phase 2: Vector Store & Embeddings (ChromaDB) — [COMPLETED]
- [x] Persistent local vector storage using ChromaDB in `./chroma_data`
- [x] Dense vector embeddings with `nomic-embed-text` (768 dimensions)
- [x] Cosine similarity index (`{"hnsw:space": "cosine"}`)
- [x] Provenance metadata attached to every chunk: `material_id`, `filename`, `file_type`, `page`, `slide`, `sheet`, `row_range`
- [x] Document-isolated vector indexing and instant index deletion on material removal

### Phase 3: Multi-Format Document Ingestion — [COMPLETED]
- [x] **PDF**: PyMuPDF (`fitz`) page-by-page text extraction with page numbers and OCR fallback
- [x] **DOCX**: `python-docx` extraction for headings, paragraphs, and structured tables
- [x] **XLSX / XLSM**: `openpyxl` extraction with sheet names, coordinate headers, and cell values
- [x] **PPTX**: `python-pptx` extraction with slide numbers, titles, body text, and tables
- [x] **CSV / TXT / MD**: Native stream processing and sentence-aware chunking
- [x] Ingestion status lifecycle: `PROCESSING` -> `COMPLETED` / `FAILED`

### Phase 4: Grounded Document Question Answering (RAG) — [COMPLETED]
- [x] FastAPI `/ml/v1/rag-query` endpoint accepting `question`, `material_ids`, `conversation_history`, `k`
- [x] Strict grounding prompt prohibiting fabrication and hallucination
- [x] Precise source citation formatting: `[Filename.pdf, page X]` or `[Workbook.xlsx, sheet Y, rows Z]`
- [x] Honest admission when facts are absent from uploaded materials
- [x] Spring Boot `/api/v1/tutor/ask-grounded` integration with ownership verification

### Phase 5: Hierarchical Map-Reduce Summarization — [COMPLETED]
- [x] FastAPI `/ml/v1/summarize` endpoint with styles: executive, detailed, keypoints, definitions, topics, qa
- [x] Single-chunk fast-path to reduce latency on brief documents
- [x] Multi-chunk map-reduce batching for large documents

### Phase 6: Frontend & Conversation Persistence — [COMPLETED]
- [x] AI Tutor UI with document selection, grounded mode toggle, and clickable citations
- [x] Conversation persistence in MySQL (`tutor_conversations`, `tutor_messages`)
- [x] Secure student authentication via JWT session cookies (`study_session`)
- [x] Complete isolation between students' documents and chat history

### Phase 7: Verification & Acceptance Testing — [COMPLETED]
- [x] Automated test suite in `test_local_ai_suite.py` covering multi-format fixtures (PDF, DOCX, XLSX, PPTX, CSV)
- [x] Real-world verification against fictional Aurora Scholarship document (`AZ-7319`, `18450` rupees, `17 February 2027`, and absent eligibility age)
- [x] Zero external/cloud API requirements — runs 100% locally on laptop

---

## Technical Constraints & Hardware Tuning
1. **Context Window**: Set to `num_ctx = 2048` tokens in `ml/app/ollama_client.py` to keep total model memory under 3.7 GB, allowing Ollama to fit comfortably in the 4 GB VRAM of the RTX 3050 Laptop GPU.
2. **Generation Tokens**: Configured `max_tokens = 1500` for RAG responses. `qwen3.5:4b` generates step-by-step thinking before outputting markdown, so 1500 tokens ensures reasoning finishes and the final concise answer is produced within 20–35 seconds.
3. **RestClient Read Timeout**: Configured Spring Boot `RestClient` read timeout to 300 seconds so local LLM generation never triggers premature socket disconnection.