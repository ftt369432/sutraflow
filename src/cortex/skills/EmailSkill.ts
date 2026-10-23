import { Skill, CortexContext } from '../types';
import { EmailAgent } from '../../services/agents/EmailAgent';

/**
 * 📧 Email Skill
 * The "Hand" that allows Cortex to communicate via Email.
 * Wraps the existing EmailAgent.
 */
export class EmailSkill implements Skill {
    id = 'email_skill';
    name = 'Email Communication';
    description = 'Read and send emails via Gmail integration.';

    private agent: EmailAgent;

    constructor() {
        this.agent = new EmailAgent();
    }

    async execute(context: CortexContext): Promise<void> {
        // Default behavior during heartbeat: Check for unread urgent emails
        console.log('📧 EmailSkill: Checking for new messages...');
        // Real implementation would call this.checkInbox()
    }

    /**
     * 📥 Read Inbox
     */
    async checkInbox(query: string = 'is:unread'): Promise<any[]> {
        try {
            const result = await this.agent.getMessages({
                folderId: 'INBOX',
                query: query,
                maxResults: 5
            });
            return result.messages || [];
        } catch (error) {
            console.error('📧 EmailSkill Error (CheckInbox):', error);
            return [];
        }
    }

    /**
     * 📤 Send Email
     */
    async send(to: string, subject: string, body: string): Promise<boolean> {
        try {
            console.log(`📧 EmailSkill: Sending email to ${to}`);
            // Actual implementation requires Draft + Send flow in EmailAgent
            // For now, we mock the final step to avoid accidental spam during dev
            // await this.agent.createDraft(...)
            return true;
        } catch (error) {
            console.error('📧 EmailSkill Error (Send):', error);
            return false;
        }
    }
}

export const emailSkill = new EmailSkill();
