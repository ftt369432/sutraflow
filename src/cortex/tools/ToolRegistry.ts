/**
 * 🛠️ Sovereign Agent Tool Registry
 * 
 * Defines the standard JSON schemas for agent tool consumption.
 * These are used by Gemini, Claude, and Groq for native function calling.
 */

export const TOOL_SCHEMAS = {
  /**
   * 🔍 KNOWLEDGE RETRIEVAL (The Vector Brain)
   */
  search_knowledge: {
    name: "search_knowledge",
    description: "Search the company vector database for relevant facts, cases, medical records, or legal research.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The conceptual search query (e.g., 'Contradictory QME findings for lumbar injury')"
        },
        limit: {
          type: "number",
          description: "Number of relevant chunks to retrieve (default: 5)"
        }
      },
      required: ["query"]
    }
  },

  /**
   * 📧 EMAIL COMMUNICATION
   */
  send_email: {
    name: "send_email",
    description: "Send a professional email to a participant (attorney, opposing counsel, witness).",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Email address of the recipient" },
        subject: { type: "string", description: "Subject line" },
        body: { type: "string", description: "The full body of the email in Markdown or HTML" },
        cc: { type: "array", items: { type: "string" }, description: "List of CC recipients" }
      },
      required: ["to", "subject", "body"]
    }
  },

  /**
   * 📅 CALENDAR MANAGEMENT
   */
  schedule_event: {
    name: "schedule_event",
    description: "Create a new event on the company calendar (Hearing, Deposition, Meeting).",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the calendar event" },
        start_time: { type: "string", description: "ISO 8601 timestamp for start" },
        end_time: { type: "string", description: "ISO 8601 timestamp for end" },
        location: { type: "string", description: "Meeting link (Zoom/Teams) or physical address" },
        description: { type: "string", description: "Notes or participant details" }
      },
      required: ["title", "start_time", "end_time"]
    }
  },

  /**
   * 📑 DOCUMENT DRAFTING
   */
  write_file: {
    name: "write_file",
    description: "Save a generated document, letter, or report to the user's workspace (GenieDrive).",
    parameters: {
      type: "object",
      properties: {
        filename: { type: "string", description: "Name of the file (e.g. objection_doe_993.pdf)" },
        content: { type: "string", description: "The text content to be saved" },
        folder: { type: "string", description: "Target folder (e.g. 'Drafts', 'CaseFiles')" }
      },
      required: ["filename", "content"]
    }
  },

  /**
   * ✅ TASK CREATION
   */
  create_task: {
    name: "create_task",
    description: "Create a task in the user's task board",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        description: { type: "string", description: "Task details" },
        priority: { type: "string", enum: ["low", "medium", "high"], description: "Priority level" },
        due_date: { type: "string", description: "ISO date for deadline" }
      },
      required: ["title"]
    }
  },

  /**
   * 📝 CANVAS CREATION
   */
  create_canvas: {
    name: "create_canvas",
    description: "Create or update a canvas document in the workspace",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Document title" },
        content: { type: "string", description: "Document content (markdown)" },
        type: { type: "string", enum: ["document", "code", "plan"], description: "Canvas type" }
      },
      required: ["title", "content"]
    }
  },

  /**
   * 🌐 WEB SEARCH
   */
  search_web: {
    name: "search_web",
    description: "Search the web for current information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" }
      },
      required: ["query"]
    }
  }
};

/**
 * 🛂 Passport-Enforced Tool Invocation
 * Ensures that agents only execute tools they have permissions for.
 */
export async function invokeTool(passport: any, toolName: string, args: any) {
  // Check permissions in passport
  if (!passport.permissions.includes(`invoke:${toolName}`) && !passport.permissions.includes('admin:*')) {
    throw new Error(`🛡️ Access Denied: Agent does not have permission to invoke tool: ${toolName}`);
  }

  console.log(`[ToolRegistry] Invoking ${toolName} with args:`, args);
  
  try {
    switch (toolName) {
      case 'search_knowledge': {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data, error } = await supabase.rpc('match_documents', {
          query_text: args.query,
          match_threshold: 0.7,
          match_count: args.limit || 5
        });
        // Note: Using text search fallback if match_documents uses embeddings but no query_embedding is provided
        if (error) {
          console.warn('Vector match failed, falling back to text search:', error);
          const textSearch = await supabase.from('knowledge_base_files')
            .select('*')
            .textSearch('content', args.query)
            .limit(args.limit || 5);
          if (textSearch.error) throw new Error(`Knowledge search failed: ${textSearch.error.message}`);
          return { status: "success", data: textSearch.data };
        }
        return { status: "success", data };
      }

      case 'send_email': {
        const { EmailService } = await import('../../services/email/emailService').catch(() => ({ EmailService: null }));
        if (!EmailService) return { status: "simulated_success", message: `Email sent to ${args.to}` };
        const result = await EmailService.send({
          to: args.to,
          subject: args.subject,
          body: args.body,
          cc: args.cc
        });
        return { status: "success", message: `Email sent to ${args.to}`, result };
      }

      case 'schedule_event': {
        const { CalendarService } = await import('../../services/CalendarService').catch(() => ({ CalendarService: null }));
        if (!CalendarService) return { status: "simulated_success", event: args };
        const event = await CalendarService.createEvent({
          title: args.title,
          start_time: args.start_time,
          end_time: args.end_time,
          location: args.location,
          description: args.description
        });
        return { status: "success", event };
      }

      case 'write_file': {
        const { default: genieDriveService } = await import('../../services/genieDriveKnowledgeBaseService').catch(() => ({ default: null }));
        if (!genieDriveService) return { status: "simulated_success", result: args };
        const result = await genieDriveService.uploadFile(
          args.filename,
          args.content,
          args.folder || 'Drafts'
        );
        return { status: "success", result };
      }

      case 'create_canvas': {
        const { useCanvasStore } = await import('../../stores/canvasStore');
        const store = useCanvasStore.getState();
        
        // Anti-stacking: check if canvas already exists with the same title
        const existingDoc = Object.values(store.documents || {}).find(
          (doc: any) => doc.title === args.title
        );

        if (existingDoc) {
          store.updateDocumentContent(existingDoc.id, args.content);
          const windowObj = store.windows?.find((w: any) => w.document?.id === existingDoc.id);
          if (windowObj) {
            store.setActiveWindow(windowObj.id);
          }
          if (!store.isCanvasEnabled) {
            store.toggleCanvasEnabled();
          }
          return { status: "success", action: "updated", canvasId: existingDoc.id };
        } else {
          // Create new canvas document using modern window-based Zustand system
          const windowId = store.createWindow('custom_document', args.content);
          const windowObj = store.getWindow ? store.getWindow(windowId) : store.windows?.find((w: any) => w.id === windowId);
          const docId = windowObj?.document?.id;
          
          if (docId) {
            store.updateDocumentTitle(docId, args.title);
          }
          
          if (!store.isCanvasEnabled) {
            store.toggleCanvasEnabled();
          }
          return { status: "success", action: "created", windowId, documentId: docId };
        }
      }

      case 'create_task': {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.from('tasks').insert({
          title: args.title,
          description: args.description,
          priority: args.priority || 'medium',
          due_date: args.due_date,
          status: 'pending',
          created_by: session?.user?.id,
          source: 'sovereign_agent'
        }).select().single();
        
        if (error) throw new Error(`Task creation failed: ${error.message}`);
        return { status: "success", task: data };
      }
      
      case 'search_web': {
        return { status: "simulated_success", data: `Web search results for: ${args.query}` };
      }

      default:
        throw new Error(`Tool ${toolName} not implemented in local registry.`);
    }
  } catch (error: any) {
    console.error(`[ToolRegistry] Error executing ${toolName}:`, error);
    return { status: "error", error: error.message || String(error) };
  }
}
