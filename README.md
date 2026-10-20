# LazyFlow AI 🦥
> **"You relax. Your AI handles the boring stuff."**

**Hacktoberfest 2026 DEV Open-Source AI Challenge — Week 3: "Slow and Steady"**

LazyFlow AI is a privacy-conscious, local-first productivity assistant powered by **Gemma 2 open-weights** and **Ollama**. It transforms chaotic brain dumps, messy documents, and unorganized filenames into clean, structured tasks and realistic, cognitive-load-balanced daily schedules.

---

## 🌟 Why Open-Source AI Matters

In contrast to cloud-tethered proprietary assistants that ship your private thoughts to remote servers, LazyFlow AI is architected around **developer data sovereignty**:

1. **Zero Data Egress:** When running locally via Ollama, all note extraction, summarization, and schedule generation happen 100% on your device (GPU or CPU). Zero bytes leave your machine.
2. **True Offline Resilience:** While downloading the initial model weights requires an internet connection, subsequent inference operates **100% offline without any internet access**.
3. **Deterministic & Inspectable:** Structured JSON outputs are schema-validated with **Zod** before reaching the UI or downstream storage.
4. **"Slow and Steady" Philosophy:** Rejects toxic crunch culture. The signature **Lazy Mode** Daily Planner explicitly incorporates cognitive pacing and restorative breaks (hydration, eye rest, light walks).

---

## 🛠️ Architecture & Open-Source AI Integration

```
┌─────────────────────────────────────────────────────────────┐
│                       React + TypeScript SPA                │
│ (Dashboard, Quick Capture, Summarizer, Planner, File Org)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                      HTTP /api/ai/* Requests
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Node.js + Express Backend                │
│   - Zod Schema Validation (server/ai/schemas.ts)            │
│   - Provider Orchestration Layer (server/ai/service.ts)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (Primary Local Engine)          (Testing & Fallbacks)
               │                              │
┌──────────────▼─────────────┐ ┌──────────────▼──────────────┐
│       Ollama Provider      │ │    Simulated Gemma Provider │
│    http://127.0.0.1:11434  │ │  (In-process out-of-the-box │
│     `ollama run gemma2:2b` │ │   demo mode, clearly marked)│
│  (100% Offline & Private)  │ └─────────────────────────────┘
└────────────────────────────┘ ┌─────────────────────────────┐
                               │   Optional Gemini Fallback  │
                               │ (Clearly marked non-open AI)│
                               └─────────────────────────────┘
```

### Where Open-Source AI is Used:
- **Quick Capture:** Gemma extracts imperative task names, estimates durations, detects explicit deadlines, and flags ambiguities without hallucinating specific times.
- **Smart Summarizer:** Multi-mode synthesis (Quick, Detailed, Key Points, Action Items, Plain English) with reading time calculation.
- **Task Extractor:** Structures unstructured meeting transcripts into prioritized, categorized backlog items.
- **Lazy Mode Daily Planner:** Balances energy levels (`low`, `medium`, `high`) with session durations, break intervals, and cognitive load explanations.
- **File Organizer:** Analyzes chaotic filenames (e.g., `IMG_final_v2(1).png`) to suggest standardized ISO 8601 names (`YYYY-MM-Product-Design.png`) and taxonomies.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Ollama** installed on your system (optional for demo mode, required for real local Gemma inference)

### 1. Install & Launch Ollama (macOS & Linux)
```bash
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull and start Gemma 2 (Lightweight 2B model recommended)
ollama run gemma2:2b
```

### 1. Install & Launch Ollama (Windows)
1. Download the Windows installer from [ollama.com/download](https://ollama.com/download).
2. Open PowerShell or Command Prompt:
```powershell
ollama run gemma2:2b
```

### 2. Clone & Install LazyFlow AI
```bash
# Install dependencies
npm install

# Start full-stack development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

> **Note on Sandbox / Demo Mode:** If Ollama is not running when you launch the app, LazyFlow AI automatically activates **Simulated Gemma 2:2b (Demo Mode)** so you can evaluate the entire interface without setup friction. The status badge will visibly denote when demo mode is active.

---

## 🧪 Automated Tests

Run the full validation suite testing Zod schemas, heuristic parsing, break calculations, and offline fallback resilience:
```bash
npm test
```

Expected output:
```
=======================================================
🧪 Running LazyFlow AI Automated Service & Schema Tests
=======================================================

Test Suite 1: Zod Input Validation Schemas
  ✅ PASS: Valid quick capture payload succeeds
  ✅ PASS: Short quick capture payload (< 3 chars) is rejected
  ✅ PASS: Valid summarize payload with mode succeeds
  ✅ PASS: Empty task array in plan-day is rejected

Test Suite 2: Simulated Gemma Open-Weight Heuristics
  ✅ PASS: Extracted 3 tasks from prompt
  ✅ PASS: Response correctly flagged as isSimulated
  ✅ PASS: Appropriately categorized study/engineering tasks

Test Suite 3: Summarization Engine
  ✅ PASS: Extracted key points
  ✅ PASS: Estimated reading time calculated

Test Suite 4: Daily Planner & Break Generation
  ✅ PASS: Generated 4 schedule blocks
  ✅ PASS: Incorporated deliberate restorative breaks ("Slow and Steady")
  ✅ PASS: Included cognitive load pacing rationale

Test Suite 5: File Taxonomy & ISO-8601 Renamer
  ✅ PASS: Generated 2 file suggestions
  ✅ PASS: Prefixed with standardized ISO year
  ✅ PASS: Constructed recommended directory taxonomy

Test Suite 6: AiService Provider Orchestration
  ✅ PASS: Detects offline Ollama port gracefully without throwing
  ✅ PASS: Status contains offline capability docs
  ✅ PASS: Gracefully falls back to simulated Gemma when Ollama is offline

=======================================================
Test Summary: 15 passed, 0 failed
=======================================================
```

---

## 🌐 Deploying to Render

LazyFlow AI is structured for easy deployment to **Render**:

### Option A: Web Service (Full-Stack Mode)
1. In your Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `OLLAMA_BASE_URL`: (Optional: your remote Ollama endpoint, or leave empty for default demo/fallback)
   - `GEMINI_API_KEY`: (Optional: if you wish to enable the labeled non-open fallback)

> **Important Deployment Note:** Cloud hosting platforms like Render run in isolated containers without direct access to your local computer's `localhost:11434`. When deployed on the public internet, LazyFlow AI defaults to its local in-process demo mode, or can connect to any remote Ollama instance reachable via HTTPS/VPN.

---

## 🧭 Step-by-Step Feature Testing

| Feature | How to Test | Expected Behavior |
| :--- | :--- | :--- |
| **Quick Capture** | Paste `finish dbms assignment by friday, prepare for viva, email the team about meeting` | Extracts 3 tasks, flags ambiguous submission times, lets you edit or bulk-save. |
| **Smart Summarizer** | Upload a `.md` or `.txt` file, choose "Action Items" mode | Summarizes document, provides reading time and word count, allows 1-click Markdown export. |
| **Task Extractor** | Filter by Category or Status, toggle completion | Tasks instantly re-render and persist in LocalStorage across page refreshes. |
| **Lazy Mode Planner** | Select 3 tasks, set energy to "Low", click "Generate Lazy Mode Schedule" | Generates short 25-minute sprints with 15-minute breaks, shows pacing rationale and focus timer. |
| **File Organizer** | Paste messy filenames, click "Generate Organization Plan" | Generates ISO-8601 rename proposals and provides downloadable `.sh` or `.bat` rename scripts. |
| **AI Settings** | Click "Test Connection" next to Ollama Base URL | Returns live ping latency or clear instructions if Ollama is not currently running. |

---

## 📄 License

Distributed under the Apache-2.0 License.
Built with ❤️ for **Hacktoberfest 2026: Slow and Steady**.
