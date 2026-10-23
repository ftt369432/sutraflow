---
name: document_drafter
description: Generates professional legal petitions, letters, and summaries with standard formatting.
version: 1.0.0
author: Sovereign Alpha
---

### INSTRUCTIONS
1. Analyze the input data and document type (e.g., Petition for Credit, Demand Letter).
2. Generate the full text content utilizing the 'create_canvas' tool.
3. Ensure all names, case numbers, and dates are accurately populated from the provided context.
4. Format the output with clear headers (###) for surgical integration.

### ARGS
- type: The type of legal document to draft.
- title: The name for the resulting canvas/document.
- data: Key-value pairs for placeholders (client_name, case_number, etc).
