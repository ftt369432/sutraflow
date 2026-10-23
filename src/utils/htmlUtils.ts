/**
 * Converts an HTML string to plain text using the browser's DOMParser.
 * @param htmlString The HTML string to convert.
 * @returns The plain text content, or an empty string if parsing fails.
 */
export function convertHtmlToText(htmlString: string): string {
  if (typeof DOMParser === "undefined") {
    console.warn("DOMParser not available. Cannot convert HTML to text in this environment.");
    // Fallback or indicate server-side processing might be needed if not in browser
    return htmlString; // Or throw an error, or return a specific marker
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.textContent || "";
  } catch (error) {
    console.error("Error converting HTML to text:", error);
    return ""; // Return empty string on error
  }
}