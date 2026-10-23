# 📁 Genie Drive — Sovereign Neural Storage Architecture

**Genie Drive** is the neural document and knowledge management system powering **Sutra OS** and **GenieFlow AI**. It unifies physical local hard drives, cloud mounts (Google Drive), and local vector databases into a single, high-speed, air-gapped knowledge repository.

---

## 1. Key Architectural Features

### A. Lazy-Loaded Multi-Drive Tree
* **Zero Startup Overhead:** Instead of blocking the UI to scan hundreds of thousands of files on external drives, Genie Drive scans root folders shallowly and marks subfolders with `isLoaded: false`.
* **On-Demand Expansion:** Subfolders are fetched asynchronously via Electron IPC (`earth:fs.readDir`) only when expanded by the user in `GenieDriveTree.tsx`.
* **Supported Mounts:**
  - `C:\` — Local Operating System & Application Cache
  - `E:\` — High-Speed NVMe Storage (`E:\.brain`, `E:\models`, Master Evidence)
  - `G:\` — Google Drive Master Mirror (`g:\My Drive`)
  - Local LAN network shares (`\\SERVER\Shared\`)

### B. In-Memory RAG & Local Vectorization
* **Text Extraction:** Multi-format document readers extract text directly on the local machine (PDF.js for medical/legal PDF packets, Mammoth for `.docx`, native UTF-8 stream readers).
* **Local Embeddings:** Generates semantic vectors locally for indexing into SQLite (`cortex_memory.db`) or local vector stores.
* **Semantic & Exact Search:** Query case law, evidence, contracts, and solicitations using either natural language conceptual search or exact boolean strings.

### C. Non-Invasive File-Watch Folders
* **Automated Ingestion:** Drop client files or solicitation packets into designated watch folders. Genie Drive detects new documents, triggers OCR extraction, and alerts your active agent.
* **Non-Destructive Operations:** Never overwrites or moves original server evidence. Read-only compliance preserves evidentiary chain of custody.

### D. Zero-PHI Egress Shield
* **Kernel-Level Masking:** Direct personal identifiers (claimant names, Social Security Numbers, Dates of Birth, WCAB claim numbers) are masked at the local kernel layer before any context is passed to auxiliary tools.
* **True Air-Gap Capability:** Fully functional in 100% offline environments when paired with local NVIDIA RTX / CUDA hardware nodes.

---

## 2. Component Structure

| Component / File | Purpose |
|---|---|
| `src/store/attachedDriveStore.ts` | Zustand store managing attached drives, loading states, and active files |
| `src/store/attachedDriveTypes.ts` | TypeScript types for DriveNode, FileMetadata, and drive configurations |
| `src/components/geniedrive/GenieDriveTree.tsx` | Hierarchical file tree with lazy-load folder expansion and search |
| `src/components/canvas/AIDriveFileBrowser.tsx` | Visual file browser integrated into the Intelligent Canvas |
| `electron/main.ts` | Secure IPC bridges (`earth:fs.readDir`, `earth:fs.readFile`, path validation) |

---

## 3. Integration with Intelligent Canvas & Solutions

* **1-Click Synthesis:** Select any document in Genie Drive to open it directly in the **Intelligent Canvas** for collaborative editing with autonomous agents.
* **Citation Grounding:** When drafting 28-line California legal pleadings, RFP compliance matrices, or executive memos, agents pull exact page and line citations directly from documents residing in Genie Drive.