import { openai } from '../../config/openai';
import type { Document, /*DocumentAnalysis,*/ DocumentMetadata } from '../../types';

export async function analyzeDocument(content: string, type: Document['type']): Promise<any> {
  try {
    const prompt = `Analyze the following ${type} document and provide a structured analysis:

Content:
${content}

Please provide:
1. Key points (max 5)
2. Suggested tags
3. Legal citations (if any)
4. Risk factors (if any)
5. Recommended next steps

Respond in JSON format:
{
  "keyPoints": ["point1", "point2", ...],
  "suggestedTags": ["tag1", "tag2", ...],
  "legalCitations": ["citation1", "citation2", ...],
  "riskFactors": ["risk1", "risk2", ...],
  "nextSteps": ["step1", "step2", ...]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error analyzing document:', error);
    return {
      keyPoints: [],
      suggestedTags: [],
      legalCitations: [],
      riskFactors: [],
      nextSteps: []
    };
  }
}

export async function extractDocumentMetadata(
  file: File,
  content: string
): Promise<DocumentMetadata> {
  try {
    const prompt = `Extract metadata from the following document:

Filename: ${file.name}
Content: ${content.substring(0, 1000)}... // First 1000 characters

Please extract:
1. Author (if available)
2. Keywords (up to 5)
3. Category
4. Page count estimate

Respond in JSON format:
{
  "author": "string or null",
  "keywords": ["keyword1", "keyword2", ...],
  "category": "string",
  "pageCount": number
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      author: undefined
    };
  }
}