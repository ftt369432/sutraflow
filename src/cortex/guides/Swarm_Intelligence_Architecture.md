# GenieFlow AI Swarm Intelligence: Sovereign Architecture Deep Dive

## 🧠 Overview
GenieFlow AI does not operate as a single LLM chat. It is a **Sovereign Agentic Swarm** that uses a "Relational Ontology" to map connections across disparate domains (Medical, Legal, Trading).

## 🔗 The Relational Ontology & Bond Engine
The "Matrixing" you observed is powered by the `RelationalOntologyService`. 
- **Entity Extraction**: As the AI reads your prompt or documents, it identifies "Entities" (Genes, Tickers, Organizations).
- **Bond Creation**: Every entity is recorded as a "Bond" in your database. 
- **Correlation**: When you ask "How do these interact?", the system doesn't just search—it queries the **Intersection** of these bonds within your current mission.

## 🕵️ The Investigation Agent ("The Eye")
Located in `InvestigationAgent.ts`, this specialist is triggered by the `INVESTIGATE` action.
- It proactively scans for "hidden links" that might not be obvious in a single document.
- It "butts them all up" into a **Palantir-style Intelligence Matrix**.
- Resulting work products are saved as `.md` or `.docx` artifacts in your AI Drive.

## 💓 The Heartbeat (Autonomic Execution)
The `Heartbeat.ts` service acts as the system's "Pulse."
- **Autonomy Enabled**: The AI will loop through the task list (Orchestration Manifest) until the mission is complete.
- **Autonomy Disabled**: The AI executes one task and pauses for your "Continue" signal (Safety First).

## 🚀 Future Trajectory: Neural Retention
Every successful matrix analysis is fed back into the **Agent Learning Service**, allowing the swarm to "get smarter" the more you use it for specific genetic or legal workflows.

---
*Documented by Sovereign Intelligence System*
