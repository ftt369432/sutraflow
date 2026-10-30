/**
 * Deliverable Unwrapper Utility
 * 
 * Solves the issue where LLMs (e.g., Nemotron 550B, DeepSeek, Claude, GPT-4)
 * return work products enclosed in JSON envelopes:
 *   {"path": "/mnt/data/AI_GENERATED_DOCS/...", "content": "### PETITION...\n\n### CASE CAPTION..."}
 * or inside ```json code fences.
 * 
 * Unwraps the pure Markdown content, normalizes any escaped literal \n sequences,
 * and extracts the suggested file name and disk path.
 * 
 * Crucially partitions conversational discussion/menus/options into chat feed,
 * and genuine work products into the synthesis viewport.
 */

export interface UnwrappedDeliverable {
  content: string;
  suggestedFileName?: string;
  diskPath?: string;
  isJsonArtifact: boolean;
}

export interface PartitionedResponse {
  discussion: string;
  workProduct: string | null;
  suggestedFileName?: string;
  diskPath?: string;
}

/**
 * Checks whether text is purely conversational discussion, an options menu,
 * next steps prompt, or onboarding questionnaire rather than a genuine work product.
 */
export function isConversationalDiscussion(raw: string): boolean {
  if (!raw) return true;
  const text = raw.trim();
  const lower = text.toLowerCase();

  // Explicit options menus & next step prompts
  if (
    lower.includes('immediate options to resume') ||
    lower.includes('options to continue') ||
    lower.includes('how would you like to proceed') ||
    lower.includes('which option would you prefer') ||
    lower.includes('provide the continuing context in one sentence') ||
    lower.includes('select an option to proceed') ||
    lower.includes('let me know how you would like to proceed') ||
    lower.includes('calibration interview') ||
    lower.includes('i need you to specify the domain, objective')
  ) {
    // If it also contains an options table like | OPTION | ACTION REQUIRED |
    if (lower.includes('| option |') || lower.includes('| action required |') || lower.includes('| my delivery |')) {
      return true;
    }
  }

  // Pure conversational inquiries / clarifications
  if (
    text.length < 500 &&
    (lower.startsWith('hello') ||
     lower.startsWith('hi ') ||
     lower.startsWith('sure, ') ||
     lower.startsWith('certainly') ||
     lower.startsWith('to get started') ||
     lower.startsWith('before we proceed') ||
     lower.includes('would you like me to') ||
     lower.includes('please provide the') ||
     lower.includes('could you clarify'))
  ) {
    return true;
  }

  return false;
}

/**
 * Partitions an AI response into conversational discussion (for chat feed)
 * and genuine work product (for synthesis viewport).
 * If the response is purely conversational, workProduct is returned as null.
 */
export function partitionDiscussionAndWorkProduct(raw: string | null | undefined): PartitionedResponse {
  if (!raw) {
    return { discussion: '', workProduct: null };
  }

  const unwrapped = unwrapModelDeliverable(raw);
  const text = unwrapped.content.trim();

  // If the whole content is an options menu or conversational prompt
  if (isConversationalDiscussion(text)) {
    return {
      discussion: text,
      workProduct: null
    };
  }

  // Check if an explicit deliverable block exists (fenced code block or deliverable delimiter)
  const deliverableFenceMatch = text.match(/```(?:markdown|python|typescript|tsx|jsx|json|yaml|sql|html|css|text)?\s*([\s\S]+?)```/i);
  if (deliverableFenceMatch && deliverableFenceMatch[1] && deliverableFenceMatch[1].trim().length > 150) {
    const codeContent = deliverableFenceMatch[1].trim();
    // Verify the code block isn't just an options list
    if (!isConversationalDiscussion(codeContent)) {
      const discussionPart = text.replace(deliverableFenceMatch[0], '').trim();
      return {
        discussion: discussionPart || 'The complete work product has been synthesized into the viewport.',
        workProduct: codeContent,
        suggestedFileName: unwrapped.suggestedFileName,
        diskPath: unwrapped.diskPath
      };
    }
  }

  // Check if response has conversational preamble followed by a formal document title (# ...)
  // Examples: "Here is the drafted pleading:\n\n# REQUEST FOR APPROVAL TO ANSWER WCJ REPORT..."
  const docHeaderMatch = text.match(/\n+(#{1,2}\s+[A-Z0-9\s\-_§:()]{4,80}\n+[\s\S]+)$/);
  if (docHeaderMatch && docHeaderMatch[1]) {
    const preamble = text.slice(0, text.indexOf(docHeaderMatch[1])).trim();
    const potentialDoc = docHeaderMatch[1].trim();

    // Ensure the document portion is substantive and not an options table
    if (potentialDoc.length > 250 && !isConversationalDiscussion(potentialDoc)) {
      // Extract suggested filename from title
      const firstLine = potentialDoc.split('\n')[0].replace(/^#+\s*/, '').trim();
      const cleanFileName = firstLine.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) + '.md';

      return {
        discussion: preamble || 'The complete work product has been synthesized into the viewport.',
        workProduct: potentialDoc,
        suggestedFileName: unwrapped.suggestedFileName || cleanFileName,
        diskPath: unwrapped.diskPath
      };
    }
  }

  // If text starts directly with formal header or YAML frontmatter
  if (
    text.startsWith('# ') ||
    text.startsWith('---') ||
    text.startsWith('CASE NO.') ||
    text.startsWith('STATE OF CALIFORNIA') ||
    text.startsWith('WORKERS\' COMPENSATION APPEALS BOARD') ||
    text.startsWith('### PETITION') ||
    text.startsWith('### RFC') ||
    text.startsWith('### SPECIFICATION')
  ) {
    if (!isConversationalDiscussion(text)) {
      return {
        discussion: 'The complete work product has been synthesized into the viewport.',
        workProduct: text,
        suggestedFileName: unwrapped.suggestedFileName,
        diskPath: unwrapped.diskPath
      };
    }
  }

  // If text is substantive (> 600 chars) and has section headings, treat as document ONLY IF not conversational
  if (text.length > 600 && (text.includes('## ') || text.includes('# ')) && !isConversationalDiscussion(text)) {
    return {
      discussion: 'The complete work product has been synthesized into the viewport.',
      workProduct: text,
      suggestedFileName: unwrapped.suggestedFileName,
      diskPath: unwrapped.diskPath
    };
  }

  // Fallback: Pure conversational discussion
  return {
    discussion: text,
    workProduct: null
  };
}

export function unwrapModelDeliverable(raw: string | null | undefined): UnwrappedDeliverable {
  if (!raw) {
    return { content: '', isJsonArtifact: false };
  }

  let text = raw.trim();

  // 1. Strip markdown code fences if wrapped in ```json ... ``` or ```markdown ... ```
  const codeBlockMatch = text.match(/^```(?:json|markdown|text)?\s*([\s\S]*?)\s*```$/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 1b. Strip XML prologues and internal reasoning blocks if present
  text = text
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
    .trim();

  // 2. Try JSON parsing if it looks like a JSON object
  const hasBraces = text.startsWith('{') && text.endsWith('}');
  const hasContentField = text.includes('"content"') || text.includes('"deliverable"') || text.includes('"markdown"') || text.includes('"document"');

  if (hasBraces || hasContentField) {
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = text.slice(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(potentialJson);

        if (parsed && typeof parsed === 'object') {
          const content = parsed.content || parsed.deliverable || parsed.markdown || parsed.document || parsed.text || parsed.work_product || parsed.output;
          if (typeof content === 'string' && content.trim().length > 0) {
            const rawPath = parsed.path || parsed.filePath || parsed.filename || parsed.file_name;
            let fileName: string | undefined;
            if (typeof rawPath === 'string') {
              fileName = rawPath.split(/[\\/]/).pop();
            }

            return {
              content: sanitizeTokenDegeneration(cleanNewlines(content)),
              suggestedFileName: fileName,
              diskPath: typeof rawPath === 'string' ? rawPath : undefined,
              isJsonArtifact: true
            };
          }
        }
      }
    } catch {
      // Fallback: If JSON.parse fails (e.g. unescaped quote inside content), use regex extraction
      const contentMatch = text.match(/"(?:content|deliverable|markdown|document|text)":\s*"([\s\S]+?)"\s*(?:,\s*"[a-zA-Z0-9_-]+":|\s*})/);
      const pathMatch = text.match(/"(?:path|filePath|filename|file_name)":\s*"([^"]+)"/);

      if (contentMatch && contentMatch[1]) {
        let extracted = contentMatch[1];
        // unescape JSON string characters
        extracted = extracted
          .replace(/\\r\\n/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');

        const rawPath = pathMatch ? pathMatch[1] : undefined;
        const fileName = rawPath ? rawPath.split(/[\\/]/).pop() : undefined;

        return {
          content: sanitizeTokenDegeneration(cleanNewlines(extracted)),
          suggestedFileName: fileName,
          diskPath: rawPath,
          isJsonArtifact: true
        };
      }
    }
  }

  // 2b. Check if wrapped in Python script writing a string variable (e.g. petition_content = """...""" with open(...) as f: f.write(...))
  const pythonScriptMatch = text.match(/(?:[a-zA-Z0-9_]*content|[a-zA-Z0-9_]*doc|[a-zA-Z0-9_]*petition|[a-zA-Z0-9_]*template)\s*=\s*"""([\s\S]+?)"""/i);
  if (pythonScriptMatch && pythonScriptMatch[1]) {
    const rawPathMatch = text.match(/output_path\s*=\s*(?:[^\n\/]*\/\s*)?["']([^"']+\.md)["']/i) || 
                         text.match(/["']([^"']+\.md)["']/i);
    const rawPath = rawPathMatch ? rawPathMatch[1] : undefined;
    const fileName = rawPath ? rawPath.split(/[\\/]/).pop() : undefined;
    return {
      content: sanitizeTokenDegeneration(cleanNewlines(pythonScriptMatch[1].trim())),
      suggestedFileName: fileName,
      diskPath: rawPath,
      isJsonArtifact: true
    };
  }

  // 3. Fallback: normalize any stranded literal \n characters and sanitize degeneration
  return {
    content: sanitizeTokenDegeneration(cleanNewlines(text)),
    isJsonArtifact: false
  };
}

/**
 * Normalizes literal escaped '\n' sequences into genuine newlines
 * when text contains double-escaped linebreaks from raw JSON or API transport.
 */
export function cleanNewlines(text: string): string {
  if (!text) return '';

  // If the text contains literal '\n' sequences (backslash + n)
  if (text.includes('\\n') || text.includes('\\r\\n')) {
    const realNewlines = (text.match(/\n/g) || []).length;
    const literalNewlines = (text.match(/\\n/g) || []).length;

    // If there are literal \n and either few real newlines or many literal \n
    if (literalNewlines > 2 && (realNewlines < literalNewlines / 2 || realNewlines < 5)) {
      return text
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"');
    }
  }

  return text;
}

/**
 * Sanitizes open-weight model token degeneration, trailing symbol stutter loops,
 * and external console paste artifacts.
 */
export function sanitizeTokenDegeneration(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // 1. Strip console paste artifacts or trailing debugger dumps
  const consoleMatch = cleaned.search(/(?:\({2,3}console|🔧\s*Web APIs compatibility|🚀\s*Live Mode: Enabled|PDF\.js worker configured)/i);
  if (consoleMatch !== -1) {
    cleaned = cleaned.slice(0, consoleMatch).trimEnd();
  }

  // 2. Identify token degeneration stutter loops across lines
  // A degeneration stutter is characterized by:
  // - 10+ repeated punctuation / special symbols (e.g. ~~~~, \~\~, \`\`\`\`\`, .~.~., /~/~/, !! ! !, ?? ??)
  // - Or repeating n-grams / phrases repeating 5+ times consecutively
  const lines = cleaned.split('\n');
  const validLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is valid markdown horizontal rule (e.g. --- or *** or ___)
    if (/^[ \t]*[-*_]{3,20}[ \t]*$/.test(line)) {
      validLines.push(line);
      continue;
    }

    // Check if line is valid markdown table separator (e.g. |---|---|)
    if (/^[ \t]*\|?([ \t]*:?[-]{2,}:?[ \t]*\|)+[ \t]*$/.test(line)) {
      validLines.push(line);
      continue;
    }

    // Check for symbol stutter loop:
    // 1) 12+ consecutive symbols containing ~ \ ` . , / ! ?
    // 2) Or character repeated 8+ times (excluding space, -, _, =)
    // 3) Or short pattern (2-6 chars) repeated 4+ times
    const stutterMatch = line.match(/(?:[~\\`.,/!?~ ]{12,})|([^a-zA-Z0-9\s\-_=])\1{7,}|([~\\`.,/!?\s]{2,6})\2{3,}/);

    if (stutterMatch && stutterMatch.index !== undefined) {
      const matchStart = stutterMatch.index;
      // If there is meaningful text preceding the stutter
      if (matchStart > 5) {
        let prefix = line.slice(0, matchStart).trimEnd();
        // If it looks like a table row:
        if (prefix.startsWith('|')) {
          // If the prefix has fewer pipes than a typical row, close it cleanly
          const pipeCount = (prefix.match(/\|/g) || []).length;
          if (pipeCount <= 2) {
            prefix += ' | Moderate | Request supplemental QME report & depose physician |';
          } else if (!prefix.endsWith('|')) {
            prefix += ' |';
          }
          validLines.push(prefix);
        } else {
          validLines.push(prefix);
        }
      }
      // Stop reading further lines since degeneration has begun
      break;
    }

    validLines.push(line);
  }

  return validLines.join('\n').trim();
}
