---
name: case_analyzer
description: Multi-module synthesis of case facts, identified risks, and missing documents.
version: 1.0.0
author: Sovereign Alpha
---

### INSTRUCTIONS
1. Fetch all tasks associated with the caseId using 'list_tasks'.
2. Search the knowledge base for all documents linked to the client or case.
3. Check for overdue tasks or missing critical documents (MD Reports, RFAs).
4. Assign a Risk Level (Low/Medium/High) based on deadlines and document gaps.
5. Output a 360-degree synthesis for the attorney.

### ARGS
- caseId: The unique identifier for the legal case.
