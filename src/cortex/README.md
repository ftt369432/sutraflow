# 🧠 THE GENIEFLOW CORTEX (The Sovereign Brain)

The Cortex is the autonomous reasoning layer of the GenieFlow Intelligence system. It is designed as a **Headless Brain** (Sovereign SDK) that can be mounted into any host system ("The Body") via a standardized API Bridge.

## 🔄 THE REASONING LOOP (Think-Act-Reflect)

Unlike traditional chatbots, every mission in the Cortex follows a non-linear, self-correcting cycle:

1.  **THINK (The Soul):** The `Soul.ts` generates a strategy expressed as an **Internal Monologue** (`<think>` tags). It decides which skill to execute and why.
2.  **ACT (The Skills):** The `SkillExecutor.ts` performs the literal task (e.g., scanning a PDF, calling an API).
3.  **REFLECT (The Critic):** The `CognitiveReflector.ts` audits the output of the action. If it detects a hallucination, a missing fact, or a logical error, it triggers a **Self-Correction** loop back to Phase 1.

## 🌩️ THE NEURAL TRACE (UI Standard)

To maintain absolute transparency with the user, the Cortex utilizes a **Neural Trace** visualization:
-   **Chevroned Reasoning:** The internal monologue is preserved and displayed in a collapsible HUD.
-   **Live Telemetry:** The user sees a real-time stream of the agent's "Thought, Search, and Draft" phases.
*Reference: `CognitiveActionCell.tsx` for implementation details.*

## 📂 CORE DIRECTORY STRUCTURE

-   `/souls`: Persona manifests defining the "Identity" and specific legal/medical directives.
-   `/skills_library`: Specialized forensic modules (e.g., `medical_scout`, `legal_drafter`).
-   `AgenticLoop.ts`: The primary orchestrator of the Think-Act-Reflect cycles.
-   `Heartbeat.ts`: The autonomic nervous system that drives proactive, background work.

## ⚖️ SOVEREIGN PRINCIPLES

1.  **Research-First:** drafting is forbidden without a preceding Forensic Research step (RAG).
2.  **Halt-and-Alert:** Agents must freeze automation if a human-critical anomaly (like a medical referral) is detected.
3.  **Self-Awareness:** The system knows its own architecture and can explain its logic to the user via the Neural Trace.

---
*Authored by: URENO-PRIME-ARCHITECT*
