import { skillBridge } from '../SkillBridge';

/**
 * 📄 PDFSkill
 * Automates the conversion of markdown/text to high-fidelity PDF documents.
 */
export class PDFSkill {
    private static instance: PDFSkill;

    private constructor() { }

    public static getInstance(): PDFSkill {
        if (!PDFSkill.instance) {
            PDFSkill.instance = new PDFSkill();
        }
        return PDFSkill.instance;
    }

    /**
     * 🏗️ Convert markdown content to PDF file
     */
    public async convert(content: string, outputPath: string): Promise<{ success: boolean; path: string }> {
        console.log(`📄 PDFSkill: Converting content to ${outputPath}`);

        try {
            // Bridge to OpenClaw Node 'fs.write_pdf' or a specialized pdf worker
            // For now, we utilize the node.invoke pathway to a custom script or library
            const response = await skillBridge.nodeInvoke(
                'main',
                'pdf.generate',
                {
                    content,
                    outputPath,
                    options: {
                        title: 'Autonomous Legal Document',
                        author: 'GenieFlow Sovereign AI',
                        margins: { top: 72, left: 72, bottom: 72, right: 72 }
                    }
                }
            );

            return {
                success: response.status === 'success',
                path: outputPath
            };
        } catch (error) {
            console.error('📄 PDFSkill: Conversion failed.', error);
            throw error;
        }
    }
}

export const pdfSkill = PDFSkill.getInstance();
