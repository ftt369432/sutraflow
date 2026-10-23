/**
 * Client-Side Microsoft Word (.docx) Exporter
 * 
 * Generates an official, beautifully styled Word document from markdown output
 * and triggers immediate browser / Electron download.
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';

export async function exportMarkdownToDocx(markdownText: string, filename: string = 'Sovereign_Legal_Pleading.docx') {
  const lines = markdownText.split('\n');
  const children: (Paragraph | Table)[] = [];

  // Parse lines into Word paragraphs
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      // Empty line / paragraph break
      children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }));
      continue;
    }

    // Heading 1
    if (rawLine.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 240, after: 120 }
        })
      );
      continue;
    }

    // Heading 2
    if (rawLine.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      continue;
    }

    // Heading 3
    if (rawLine.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: rawLine.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 }
        })
      );
      continue;
    }

    // Bold lines or bullet points
    if (rawLine.startsWith('- ') || rawLine.startsWith('* ')) {
      const cleanBullet = rawLine.replace(/^[-*]\s+/, '');
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          children: parseFormattedTextRuns(cleanBullet),
          spacing: { after: 80 }
        })
      );
      continue;
    }

    // Standard body paragraph
    children.push(
      new Paragraph({
        children: parseFormattedTextRuns(rawLine),
        spacing: { after: 100, line: 276 } // 1.15 line spacing
      })
    );
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children
      }
    ]
  });

  // Pack into blob and trigger download
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Parses markdown **bold** and *italic* into TextRun elements
 */
function parseFormattedTextRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: 'Times New Roman',
          size: 24 // 12pt
        })
      );
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(
        new TextRun({
          text: part.slice(1, -1),
          italics: true,
          font: 'Times New Roman',
          size: 24
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: 'Times New Roman',
          size: 24
        })
      );
    }
  }

  return runs;
}
