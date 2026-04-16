# gemma-m4-agent

A high-performance, production-grade local AI agent optimized for the **Apple Silicon M4 Unified Memory Architecture**. This project implements a **Hybrid-Memory Orchestration (HMO)** strategy, utilizing the 16GB Unified RAM for low-latency inference while offloading long-term memory and context storage to external high-speed hardware.

---

## 🏗 System Architecture

The agent is engineered to bypass standard memory bottlenecks in local LLM environments through a decoupled, distributed I/O approach:

*   **Inference Engine (Internal SSD):** Leverages the **MLX framework** for native GPU and Neural Engine acceleration. Utilizes **Gemma 4 8B (8-bit quantized)** weights to maximize logic density while maintaining a ~8GB memory footprint.
*   **Long-Term Memory (Macintosh PD):** Persistent storage on a USB 3.2 Gen 1 (APFS) drive containing:
    *   **Vector Database:** ChromaDB with `all-MiniLM-L6-v2` embeddings for local code repository indexing.
    *   **Chat Logs:** Continuous JSON session state persistence to preserve context across reboots.
*   **Web Orchestration:** Real-time grounding via a non-recursive **DuckDuckGo Search Engine** pipeline.

---

## 🛠 Engineering Breakthroughs

### 1. Multi-Layer Sequence Termination
To solve "blabbering" and hallucinated turn-leakage, the engine implements a dual-gate stop logic:
*   **Silicon-Level Gate:** Resolves integer `stop_token_ids` from the tokenizer and injects them directly into the hardware inference loop.
*   **Software-Level Guard:** A real-time string-match filter inside the token generator that executes a `Hard Return` if control sequences like `<end_of_turn>` or `user\n` are detected.

### 2. Hardware-Aware Parameter Introspection
The backend utilizes Python's `inspect` module to perform runtime signature probing of the `mlx-lm` library. This ensures version-agnostic compatibility by automatically detecting whether the local environment requires `temp` or `temperature` parameters.

### 3. Studio-Grade Interface
A custom **React + Vite** frontend designed with a **#000000 AMOLED** aesthetic. Features include:
*   **SSE Streaming:** Server-Sent Events for real-time token delivery via FastAPI.
*   **Advanced Typography:** Integrated `prose-invert` and Prism syntax highlighting for professional code rendering.
*   **Playground Logic:** Full support for system instruction modification, temperature scaling, and "Edit & Rerun" session management.

---

## 📂 Repository Structure

```text
gemma-m4-agent/
├── core/                # Inference (engine.py), Memory (memory.py), Tools (tools.py)
├── api/                 # FastAPI backend with asynchronous SSE streaming
├── ui/                  # React + Vite frontend (Tailwind CSS / Typography)
├── config/              # YAML-based HMO path configurations
├── scripts/             # Storage initialization and lifecycle automation
├── mlx_model/           # Local 8-bit quantized model weights
└── docs/                # Architecture specifications and progress logs
```

---

## 🚀 Deployment

### 1. Environment Setup
```bash
conda env create -f environment.yml
conda activate gemma_m4
pip install fastapi uvicorn mlx-lm duckduckgo-search pyyaml
```

### 2. Backend Initialization
```bash
export PYTHONPATH=$PYTHONPATH:.
python -m api.main
```

### 3. UI Launch
```bash
cd ui
npm install
npm run dev
```

---

## 💻 Hardware Baseline
*   **Processor:** Apple M4 (10-core CPU, 8-core GPU)
*   **Memory:** 16GB Unified RAM
*   **Inference Latency:** Optimized for real-time token streaming
*   **Storage:** 256GB NVMe (SSD) + 64GB USB 3.2 (Macintosh PD)

---
**Author:** [@beeth73](https://github.com/beeth73)  
**Engineering Status:** Stable - Core Inference & UI Phase Complete.
