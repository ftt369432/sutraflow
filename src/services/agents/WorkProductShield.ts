/**
 * 🛡️ Work Product Shield
 * 
 * Programmatically strips conversational filler and "meta-talk" from AI responses
 * to ensure only the final work product (documents, code, etc.) reaches the user.
 */

export class WorkProductShield {
    /**
     * Aggressively cleanses a response of conversational filler
     */
    public static cleanse(content: string): string {
        if (!content) return '';

        // 🎯 MANDATORY: Strip thinking/reasoning tags FIRST
        // Remove entire <think>, <reasoning>, <thought>, <case_analysis>, and XML prologues
        let cleansed = content
            .replace(/<\?xml[\s\S]*?\?>/gi, '')
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<case_analysis>[\s\S]*?<\/case_analysis>/gi, '')
            .replace(/<final>[\s\S]*?<\/final>/gi, '') // Strip entire block!
            .trim();


        // 1. Remove common "Sure!" or "Based on your request" prefixes
        const prefixPatterns = [
            /^Sure(,? here['i]s|! )/i,
            /^Of course! /i,
            /^Based on (your request|our conversation),? /i,
            /^I can (help|certainly help) with that.?/i,
            /^Here is the (.*?) you requested:?/i,
            /^I checked (.*?) and found:?/i,
            /^Absolutely! /i,
            /^Certainly! /i,
            /^Following is (.*?):?/i,
            /^Ok,? /i,
            /^Okay,? /i,
            /^Understood. /i,
            /^I have drafted (.*?):?/i,
            /^Here['i]s (.*?) (for you:?|:?)/i,
        ];

        for (const pattern of prefixPatterns) {
            cleansed = cleansed.replace(pattern, '');
        }

        // 2. Remove common markdown markers that wrap the entire response if it's not JUST code
        // If it starts with ``` and ends with ``` and there's only one block, we might keep it or strip the fences.
        // For universal assistant, we often want the raw text in the canvas.
        const markdownWrapper = /^```[a-z]*\n([\s\S]*?)\n```$/i;
        const match = cleansed.match(markdownWrapper);
        if (match) {
            cleansed = match[1];
        }

        // 3. Remove common "Let me know if you need anything else" suffixes at the end
        const suffixPatterns = [
            /\s*Let me know if (you need|there['i]s) (anything|it|else).*$/i,
            /\s*I hope this helps!?.*$/i,
            /\s*Feel free to .*$/i,
            /\s*If you have (any )?more questions.*$/i,
            /\s*Is there anything else I can (assist|help).*$/i,
        ];

        for (const pattern of suffixPatterns) {
            cleansed = cleansed.replace(pattern, '');
        }

        return cleansed.trim();
    }

    /**
     * Wraps a prompt with strict work-product-only instructions
     */
    public static wrapPrompt(prompt: string, domain: string = 'general'): string {
        const strictInstructions = `
CRITICAL SOVEREIGN DIRECTIVE (THINK-ACT-REFLECT):
You are operating within the GenieFlow Sovereign Architecture. 

1. THINK: You MUST output all your forensic reasoning, strategy, and internal monologue inside <think>...</think> XML tags. Our UI will parse this to show the user your logic loop. DO NOT skip this. 
2. ACT: After your <think> block, provide the FINAL WORK PRODUCT.
3. REFLECT: Ensure your final work product contains NO conversational filler, NO meta-talk outside of the <think> tags, and starts/ends directly with the content.

Domain context: ${domain.toUpperCase()}
`;

        return `${strictInstructions}\n\n${prompt}`;
    }
}
