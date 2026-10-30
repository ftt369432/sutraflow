import DOMPurify from 'dompurify';

/**
 * 🛡️ GENIEFLOW SECURITY SANITIZER
 * Uses DOMPurify to clean HTML/Markdown output before rendering.
 * Prevents XSS while allowing standard styling.
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'br', 'span', 'code', 'pre', 'blockquote', 'hr', 
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'src', 'alt', 'class', 'id'],
  });
};

/**
 * 🧪 BASIC STRIPPER (Fallback)
 * A simpler version for environments where DOMPurify might not be ready.
 */
export const stripScripts = (html: string): string => {
  if (!html) return '';
  return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "<!-- Script removed for security -->");
};
