import { openai } from '../../config/openai';

export interface Template {
  content: string;
  variables: string[];
}

export interface TemplateVariables {
  [key: string]: string;
}

export interface TemplateCompletion {
  content: string;
  missingVariables: string[];
}

export async function completeTemplate(
  template: Template,
  variables: TemplateVariables
): Promise<TemplateCompletion> {
  try {
    const prompt = `Complete the following template by replacing variables with provided values.

Template:
${template.content}

Variables:
${Object.entries(variables).map(([key, value]) => `${key}: ${value}`).join('\n')}

Also identify any missing variables that weren't provided.
Respond in the following JSON format:
{
  "completedContent": "completed template text",
  "missingVariables": ["variable1", "variable2"]
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      content: response.completedContent,
      missingVariables: response.missingVariables
    };
  } catch (error) {
    console.error('Error completing template:', error);
    // Fallback to basic template completion if AI fails
    return completeTemplateBasic(template, variables);
  }
}

// Fallback function using basic template completion
function completeTemplateBasic(
  template: Template,
  variables: TemplateVariables
): TemplateCompletion {
  let content = template.content;
  const missingVariables: string[] = [];

  template.variables.forEach(variable => {
    const value = variables[variable];
    if (value) {
      content = content.replace(`{{${variable}}}`, value);
    } else {
      missingVariables.push(variable);
    }
  });

  return {
    content,
    missingVariables,
  };
}

export function suggestVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const matches = [...content.matchAll(variableRegex)];
  return matches.map(match => match[1]);
}

export async function generateTemplatePreview(
  template: Template,
  variables: TemplateVariables
): Promise<string> {
  const { content, missingVariables } = await completeTemplate(template, variables);
  
  // Highlight missing variables
  let preview = content;
  missingVariables.forEach(variable => {
    preview = preview.replace(
      `{{${variable}}}`,
      `[Missing: ${variable}]`
    );
  });
  
  return preview;
}