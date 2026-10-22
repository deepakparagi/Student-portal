# LOCAL AI SETUP GUIDE — SMART STUDY PORTAL

## Overview

This guide walks through setting up the fully local AI Tutor using Ollama for LLM inference and ChromaDB for vector storage. No external API keys, no cloud services required.

---

## Prerequisites

### Hardware Requirements (Minimum)
- **RAM**: 16 GB DDR4 (32 GB recommended for larger documents)
- **GPU VRAM**: 4 GB (RTX 3050 Laptop or better)
- **Storage**: 10 GB free space for models and vector index
- **OS**: Windows 10/11 64-bit

### Software Requirements
| Software | Version | Purpose |
|----------|---------|---------|
| Ollama | 0.3.x+ | Local LLM runtime |
| Python | 3.11+ | ML Engine (FastAPI) |
| Node.js | 20.9+ | Frontend (Next.js) |
| Java JDK | 21+ | Backend (Spring Boot) |
| Maven | 3.9+ | Backend build |
| MySQL | 8.0+ | Database |
| Tesseract OCR | 5.x+ | Optional: scanned PDF OCR |
| LibreOffice | 7.x+ | Optional: legacy DOC/PPT/XLS conversion |

---

## Step 1: Install Ollama

### Windows Installation
1. Download Ollama from https://ollama.com/download/windows
2. Run the installer (`OllamaSetup.exe`)
3. Verify installation:
   ```powershell
   ollama --version
   ```

### Start Ollama Service
```powershell
# Option A: Run as service (recommended)
ollama serve

# Option B: Run in background
Start-Process ollama -ArgumentList "serve"
```

Ollama API will be available at `http://127.0.0.1:11434`

---

## Step 2: Download Required Models

### Required Models
```powershell
# Main chat model (Qwen 3.5 4B) - ~3.5 GB
ollama pull qwen3.5:4b

# Build the Smart Study tutor persona and inference defaults
ollama create smartstudy-tutor -f ml/Modelfile.tutor

# Embedding model (nomic-embed-text) - ~274 MB
ollama pull nomic-embed-text
```

### Verify Models
```powershell
ollama list
```

Expected output:
```
NAME                 ID              SIZE      MODIFIED
nomic-embed-text     latest          274 MB    2024-...
qwen3.5:4b           latest          3.5 GB    2024-...
smartstudy-tutor     latest          ~3.5 GB   Built from the tutor Modelfile
```

---

## Step 3: Test Ollama API

### Test Chat Model
```powershell
$body = @{
    model = "smartstudy-tutor"
    messages = @(@{role = "user"; content = "Reply exactly: LOCAL CHAT WORKS."})
    stream = $false
    options = @{num_ctx = 8192}
} | ConvertTo-Json -Depth 8

Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/chat" -Method Post -ContentType "application/json" -Body $body
```

Expected: `LOCAL CHAT WORKS.`

### Test Embedding Model
```powershell
$body = @{
    model = "nomic-embed-text"
    input = "The scholarship provides 18000 rupees per semester."
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/embed" -Method Post -ContentType "application/json" -Body $body
```

Expected: JSON with `embeddings` array (768 dimensions).

---

## Step 4: Optional - Install Tesseract OCR (for scanned PDFs)

### Windows
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to `C:\Program Files\Tesseract-OCR`
3. Add to PATH: `C:\Program Files\Tesseract-OCR`
4. Verify:
   ```powershell
   tesseract --version
   ```

### Enable in Application
Set environment variable:
```powershell
$env:OCR_ENABLED = "true"
$env:OCR_LANGS = "eng"
```

---

## Step 5: Optional - Install LibreOffice (for legacy formats)

### Windows
1. Download from: https://www.libreoffice.org/download/
2. Install (default path OK)
3. Verify:
   ```powershell
   "C:\Program Files\LibreOffice\program\soffice.exe" --version
   ```

### Supported Legacy Conversions
- `.doc` → `.docx`
- `.ppt` → `.pptx`
- `.xls` → `.xlsx`

---

## Step 6: Configure Environment Variables

### Backend (application.yml already configured)
The following are pre-configured in `backend/src/main/resources/application.yml`:

```yaml
app:
  ollama-base-url: http://127.0.0.1:11434
  ollama-chat-model: smartstudy-tutor
  ollama-embed-model: nomic-embed-text
  ollama-context-size: 8192
  ollama-timeout: 120
```

### ML Engine (create `.env` in `ml/` directory)
```bash
# ml/.env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_CHAT_MODEL=smartstudy-tutor
OLLAMA_EMBED_MODEL=nomic-embed-text
OLLAMA_CONTEXT_SIZE=8192 # Tutor model context; reduce to 4096 if memory is constrained
OLLAMA_TIMEOUT=180
OLLAMA_KEEP_ALIVE=60m # Keeps model in VRAM for 60 minutes
OLLAMA_THINK=false # Disables verbose reasoning tokens for 3-5x faster responses
CHROMA_PERSIST_DIR=./chroma_data
ML_INTERNAL_TOKEN=dev-internal-token-change-me
OCR_ENABLED=false
OCR_LANGS=eng
EXTRACTION_TIMEOUT_SECONDS=120
MAX_PAGES_PER_FILE=200
```

### Frontend (create `.env.local` in `frontend/` directory)
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## Step 7: Install Python Dependencies

```powershell
cd ml
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

Key dependencies installed:
- `chromadb` - Vector database
- `httpx` - Async HTTP client for Ollama
- `openpyxl` - Excel processing
- `python-pptx` - PowerPoint processing
- `pytesseract` - OCR (optional)
- `tiktoken` - Token counting

---

## Step 8: Start the Application

### Method A: Automated (PowerShell)
```powershell
# From project root
.\run-all.ps1
```

This starts:
1. MySQL on port 3306
2. FastAPI ML Engine on port 8000
3. Spring Boot Backend on port 8080
4. Next.js Frontend on port 3000

### Method B: Manual (4 Terminals)

**Terminal 1 - MySQL:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --datadir="d:\Smart Edu\mysql-local\data" --port=3306 --console
```

**Terminal 2 - ML Engine:**
```powershell
cd "D:\Smart Edu\ml"
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload
```

**Terminal 3 - Backend:**
```powershell
cd "D:\Smart Edu\backend"
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.datasource.password=dev-password-change-me"
```

**Terminal 4 - Frontend:**
```powershell
cd "D:\Smart Edu\frontend"
npm run dev
```

---

## Step 9: Verify Installation

### 1. ML Engine Health
```
http://localhost:8000/ml/v1/health
```
Expected:
```json
{
  "status": "healthy",
  "service": "smart-study-ml-local",
  "ollama": {
    "server": "healthy",
    "chat_model": {"name": "smartstudy-tutor", "available": true},
    "embed_model": {"name": "nomic-embed-text", "available": true}
  },
  "vector_store": {"total_chunks": 0, ...}
}
```

### 2. Backend API
```
http://localhost:8080/api/v1/tutor/health
```

### 3. Frontend
Open http://localhost:3000
- Login as `student@test.com` / `Password123!`
- Navigate to AI Tutor page

---

## Step 10: Test Document Upload & Q&A

### Create Test Document
Create a PDF with known content:
```
The fictional Aurora Scholarship has reference number AZ-7319 
and provides ₹18,450 per semester. Applications close on 17 February 2027.
```

### Test Workflow
1. Go to AI Tutor page
2. Click paperclip icon → Upload test PDF
3. Wait for processing (status: COMPLETED)
4. Select the document in the sidebar (checkbox)
5. Ask questions:
   - "What is the scholarship reference number?" → Should answer AZ-7319 with citation
   - "How much does it provide per semester?" → Should answer ₹18,450 with citation
   - "When do applications close?" → Should answer 17 February 2027 with citation
   - "What is the eligibility age?" → Should say "not in document"
6. Click citation to view source excerpt

---

## Troubleshooting

### Ollama Connection Issues

**Error: "Connection refused"**
- Ensure `ollama serve` is running
- Check firewall allows port 11434
- Verify `OLLAMA_BASE_URL` in config

**Error: "Model not found"**
```powershell
ollama pull qwen3.5:4b
ollama pull nomic-embed-text
```

**Error: "Out of memory"**
- Reduce context size: `OLLAMA_CONTEXT_SIZE=4096`
- Close other GPU applications
- Use smaller model: `ollama pull qwen3.5:1.5b`

### Model Loading Slow
- First request loads model into VRAM/RAM (10-30s)
- Subsequent requests are fast
- Keep Ollama running to keep models loaded

### ChromaDB Issues
- Delete `ml/chroma_data` folder to reset
- Check disk space (need ~1GB for embeddings)

### PDF Extraction Issues
- Scanned PDFs: Enable OCR (`OCR_ENABLED=true`)
- Password-protected: Not supported (remove password first)
- Corrupt files: Check file integrity

### Legacy Format Issues (.doc, .ppt, .xls)
- Install LibreOffice
- Check LibreOffice path in system PATH

---

## Memory Optimization for 16GB RAM / 4GB VRAM

| Setting | Value | Notes |
|---------|-------|-------|
| `OLLAMA_CONTEXT_SIZE` | 8192 | Don't increase beyond 8K |
| `CHUNK_TARGET_TOKENS` | 600 | Smaller chunks = less memory |
| `CHUNK_OVERLAP_TOKENS` | 80 | Modest overlap |
| Batch size | 1 | Process one document at a time |

### Monitor GPU Memory
```powershell
nvidia-smi -l 5
```

---

## Offline Verification

After setup, test fully offline:
1. Disconnect network/internet
2. Restart all services
3. Upload document → ask questions
4. All AI features should work without internet

---

## Supported File Formats

| Format | Extension | Extraction | Notes |
|--------|-----------|------------|-------|
| PDF | .pdf | ✅ Text + OCR | PyMuPDF + Tesseract |
| Word | .docx | ✅ Full | python-docx |
| Word Legacy | .doc | ⚠️ Via LibreOffice | Requires LibreOffice |
| Excel | .xlsx/.xlsm | ✅ Sheets, rows, formulas | openpyxl |
| Excel Legacy | .xls | ⚠️ Via LibreOffice | Requires LibreOffice |
| CSV | .csv | ✅ Full | Python csv |
| PowerPoint | .pptx | ✅ Slides, notes, tables | python-pptx |
| PPT Legacy | .ppt | ⚠️ Via LibreOffice | Requires LibreOffice |
| Text | .txt | ✅ Full | Native |
| Markdown | .md | ✅ Full | Native |

---

## Known Limitations

1. **No streaming in grounded mode** - RAG queries return complete response
2. **OCR accuracy** - Depends on scan quality; Tesseract not perfect
3. **Legacy formats** - Require LibreOffice; conversion may lose formatting
4. **Large documents** - Map-reduce summarization processes in batches
5. **No cross-document reasoning** - Each document indexed separately
6. **Model size** - qwen3.5:4b optimized for 4GB VRAM; larger models need more VRAM

---

## Updating Models

```powershell
# Update to latest versions
ollama pull qwen3.5:4b
ollama pull nomic-embed-text

# List all models
ollama list

# Remove old models
ollama rm old-model-name
```

---

## Logs & Debugging

### ML Engine Logs
```powershell
# Check console output in ML Engine terminal
# Or check log file if configured
```

### Backend Logs
```powershell
# Spring Boot console output
# Logs in backend/backend.log
```

### Frontend Logs
- Browser DevTools Console
- Network tab for API calls

---

## Support

For issues:
1. Check Ollama is running: `ollama ps`
2. Check models installed: `ollama list`
3. Verify health endpoints
4. Check GPU memory: `nvidia-smi`
5. Review application logs

---

## Quick Reference Commands

```powershell
# Start Ollama
ollama serve

# Pull models
ollama pull qwen3.5:4b
ollama pull nomic-embed-text

# Test chat
$body = @{model="smartstudy-tutor"; messages=@(@{role="user"; content="Hi"}); stream=$false; options=@{num_ctx=8192}} | ConvertTo-Json -Depth 8
irm -Uri "http://127.0.0.1:11434/api/chat" -Method Post -ContentType "application/json" -Body $body

# Test embeddings
$body = @{model="nomic-embed-text"; input="test"} | ConvertTo-Json
irm -Uri "http://127.0.0.1:11434/api/embed" -Method Post -ContentType "application/json" -Body $body

# Check health
irm "http://localhost:8000/ml/v1/health"
irm "http://localhost:8080/api/v1/tutor/health"
```
