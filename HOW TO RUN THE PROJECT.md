# How to Run the Project

This guide covers the local Windows setup, starting the services manually, and running the stack with Docker Compose.

## What you need

- Windows 10/11
- Node.js 20.9 or newer
- Python 3.11 or newer
- Java 21 and Maven 3.9 or newer
- MySQL 8 for the local Windows setup, or Docker Desktop for Compose
- Ollama with the tutor and embedding models installed

The app uses these local Ollama models by default:

```powershell
ollama pull qwen3.5:4b
ollama pull nomic-embed-text
ollama create smartstudy-tutor -f ml/Modelfile.tutor
```

Keep the Ollama service running at `http://127.0.0.1:11434` while using AI features.

## First-time setup

From the repository root, install the frontend and ML dependencies:

```powershell
Set-Location 'D:\Smart Edu\frontend'
npm install

Set-Location 'D:\Smart Edu\ml'
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Maven downloads the backend dependencies the first time it runs.

## Method 1: Start the local Windows services together

Start Ollama first, then run this from the repository root in PowerShell:

```powershell
Set-Location 'D:\Smart Edu'
.\run-all.ps1
```

The script starts MySQL on port `3307`, the ML service on `8000`, the Spring Boot API on `8080`, and the Next.js app on `3000`. It reuses a service if its port is already listening.

Open the website at <http://localhost:3000>. The ML health endpoint is <http://localhost:8000/ml/v1/health>.

## Method 2: Start each local service in its own terminal

Start Ollama and MySQL before the application services. For MySQL, this project’s launcher uses the `mysql-fresh-data` directory and port `3307`.

**Terminal 1 — MySQL** (from the repository root):

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe' `
  '--datadir=D:\Smart Edu\mysql-fresh-data' `
  --port=3307 --bind-address=127.0.0.1 --shared-memory=OFF --named-pipe=OFF
```

**Terminal 2 — ML service:**

```powershell
Set-Location 'D:\Smart Edu\ml'
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Terminal 3 — Backend API:**

```powershell
Set-Location 'D:\Smart Edu\backend'
$env:SPRING_DATASOURCE_URL = 'jdbc:mysql://127.0.0.1:3307/smart_study?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC'
$env:SPRING_DATASOURCE_USERNAME = 'smart_study'
$env:SPRING_DATASOURCE_PASSWORD = 'dev-password-change-me'
$env:DEV_SEED_ENABLED = 'true'
$env:ML_SERVICE_URL = 'http://127.0.0.1:8000'
$env:ML_INTERNAL_TOKEN = 'dev-internal-token-change-me'
mvn spring-boot:run
```

**Terminal 4 — Frontend:**

```powershell
Set-Location 'D:\Smart Edu\frontend'
npm run dev
```

Stop manually started services with `Ctrl+C` in their terminals.

## Method 3: Run with Docker Compose

Docker Compose starts the database, ML service, API, and frontend in containers. Ollama runs on the host machine, so start Ollama and install the models first. The Compose configuration connects the ML container to Ollama through `host.docker.internal`.

From the repository root:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build
```

If `.env` already exists, the command keeps it and Compose uses its current settings plus the defaults in `docker-compose.yml`.

The Compose database uses port `3306` by default. The website is at <http://localhost:3000> and the API is at <http://localhost:8080/api/v1>. Stop the containers with:

```powershell
docker compose down
```

## Check that the services are ready

- Website: <http://localhost:3000>
- Backend API: <http://localhost:8080/api/v1>
- ML health: <http://localhost:8000/ml/v1/health> for the local setup
- Ollama: <http://127.0.0.1:11434/api/version>

If the site opens but AI features are unavailable, check that Ollama is running, both models are installed, and the ML health response reports an available chat model and embedding model.
