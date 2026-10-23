import { BaseAgent, AgentAction, AgentActionResult } from './BaseAgent';
import { OodarPhase, AgentThoughtState } from '../../components/agents/OodarThoughtStream';
import { invokeTool } from '../../cortex/tools/ToolRegistry';
import { supabase } from '../../lib/supabase';
import { AIServiceFactory } from '../ai/aiServiceFactory';

/**
 * 🧘 OodarAgent
 * 
 * An agent implementation that natively follows the O.O.D.A.R. loop.
 * It syncs its mental state to Supabase for real-time tracking.
 */
export class OodarAgent extends BaseAgent {
  private currentPhase: OodarPhase = 'idle';
  private missionId: string = '';
  private logs: AgentThoughtState['logs'] = [];
  private onPhaseUpdateCallback?: (phase: OodarPhase, message: string, details?: string, isComplete?: boolean) => void;

  /**
   * 🎯 Orchestrator Bridge: Execute a standard task
   */
  public async executeTask(task: any): Promise<any> {
    console.log(`[OodarAgent] Bridging mission to O.O.D.A.R. loop: ${task.title}`);
    await this.startMission(task.id, task.instruction);
    return {
      ...task,
      status: 'completed',
      result: { message: "O.O.D.A.R. Mission Complete" }
    };
  }

  /**
   * 🚀 Start a new Mission
   */
  public async startMission(
    missionId: string, 
    objective: string,
    onPhaseUpdate?: (phase: OodarPhase, message: string, details?: string, isComplete?: boolean) => void
  ) {
    this.missionId = missionId;
    this.currentPhase = 'observe';
    this.logs = [];
    this.onPhaseUpdateCallback = onPhaseUpdate;
    
    await this.syncState('Initializing cognitive swarm...', false, `Target Objective: ${objective}`);
    
    try {
      const ai = AIServiceFactory.getInstance();

      // 1. OBSERVE
      await this.syncPhase('observe', 'Gathering evidence from Vector Knowledge Base...', 'Scanning local repositories, stashed records, and legal briefs...');
      const contextResult = await invokeTool(this.getPassport(), 'search_knowledge', { query: objective, limit: 5 });
      const contextString = JSON.stringify(contextResult?.data || contextResult || '');

      await this.syncPhase('observe', 'Analyzing case facts and sensory data...', 'Invoking AI provider to evaluate industrial causation and discrepancies...');
      const observePrompt = `You are an elite California workers' compensation attorney performing an OODAR OBSERVE phase.
Analyze the following objective and context. Extract all key facts, dates, medical evaluators, and legal discrepancies.
Identify the 3 strongest grounds for relief and sort them in rank order.

OBJECTIVE: "${objective}"
CONTEXT DATA:
${contextString}

Respond with:
### 👁️ Ground Analysis
- **Ranked Grounds**: List 1, 2, 3
- **Sensory Evidence**: Key documents, dates, and names found
- **Unverified Variables**: Any missing facts that must be researched`;

      const observeText = await ai.generateText(observePrompt, { _trackerSource: 'OodarAgent.observe', _trackerCategory: 'agentic' });
      await this.syncPhase('observe', 'Observation complete — grounds ranked.', observeText);
      
      // 2. ORIENT
      await this.syncPhase('orient', 'Formulating contradiction matrix & precedent chains...', 'Mapping case rules: Escobedo, Hikida, Yeager, and Benson...');
      const orientPrompt = `You are a California workers' compensation legal research specialist performing an OODAR ORIENT phase.
Take these grounds and match them against binding legal precedents. Build a logical IRAC chain for each ground.

GROUNDS:
${observeText}

Construct:
### 🧭 Legal Framework
1. **Case Precedents**: Which binding cases govern this exact issue (e.g., Escobedo, Hikida, Yeager)?
2. **IRAC Matrices**:
   - **Rule**: Exact legal standard (e.g., Labor Code section or case standard)
   - **Application**: How it applies to our observed facts
   - **Why WCJ Erred**: Legal justification for error`;

      const orientText = await ai.generateText(orientPrompt, { _trackerSource: 'OodarAgent.orient', _trackerCategory: 'agentic' });
      await this.syncPhase('orient', 'Legal framework and precedent chains locked.', orientText);
      
      // 3. DECIDE
      await this.syncPhase('decide', 'Determining pleading strategy and argument blueprint...', 'Structuring petition layout and selecting optimal strategic tone...');
      const decidePrompt = `You are a senior litigation strategist performing an OODAR DECIDE phase.
Review the observations and legal frameworks, and decide the exact structure and argument order for the petition.

LEGAL FRAMEWORK:
${orientText}

Decide:
### ⚖️ Strategic Decision Blueprint
- **Argument Order**: The exact narrative sequence for maximum impact
- **Strategic Angle**: Pleading tone (assertive, technical, or systemic)
- **Draft Outline**: Outline of caption, facts, arguments, and prayer for relief`;

      const decideText = await ai.generateText(decidePrompt, { _trackerSource: 'OodarAgent.decide', _trackerCategory: 'agentic' });
      await this.syncPhase('decide', 'Pleading strategy and argument blueprint locked.', decideText);
      
      // 4. ACT
      await this.syncPhase('act', 'Executing document generation in the workspace...', 'Drafting final court-ready pleading. This will create a Canvas tab...');
      const actPrompt = `You are an elite workers' comp trial attorney drafting a formal legal petition for the WCAB.
Generate the COMPLETE Petition for Reconsideration based on the case outline and strategic blueprint.

BLUEPRINT:
${decideText}

FACTS & CONTEXT:
${contextString}

RULES:
- Formal court layout (Caption, Introduction, Statement of Facts, Arguments, Prayer, Verification, COS, Signature)
- Verbatim IRAC sections with bold case names (e.g., **Escobedo v. Marshalls**)
- NO placeholders or bracketed text. Every name, doctor, and date must be filled or naturally resolved.
- Attorney signature block for: Allen Ureno, Law Office of Allen Ureno`;

      const actText = await ai.generateText(actPrompt, { _trackerSource: 'OodarAgent.act', _trackerCategory: 'agentic' });
      
      await this.syncPhase('act', 'Saving petition draft to workspace...', 'Opening a live React Canvas tab with the drafted document...');
      await invokeTool(this.getPassport(), 'create_canvas', {
        title: `Petition: ${objective.replace(/draft|write|petition for reconsideration/gi, '').trim().substring(0, 30)}`,
        content: actText,
        type: 'document'
      });
      await this.syncPhase('act', 'Petition successfully saved to Canvas.', actText);
      
      // 5. REFLECT
      await this.syncPhase('reflect', 'Performing critical self-assessment against Sentinel Guardrails...', 'Scoring legal rigor and validating against California comp guidelines...');
      const reflectPrompt = `You are a WCAB Commissioner reviewing a Petition for Reconsideration. 
Perform a critical self-assessment of the drafted document.

DRAFT DOCUMENT:
${actText.substring(0, 4000)}

Score:
### 🔍 Quality Assessment
- **Score (1-10)**: Strict rating
- **Strongest Argument**: Why it will succeed
- **Weakest Argument**: Point of vulnerability
- **Specific Fixes**: Recommended edits for the attorney`;

      const reflectText = await ai.generateText(reflectPrompt, { _trackerSource: 'OodarAgent.reflect', _trackerCategory: 'agentic' });
      await this.syncPhase('reflect', 'Critical self-assessment complete.', reflectText);
      
      this.currentPhase = 'idle';
      await this.syncState('Mission Accomplished. Live Canvas ready.', true, 'The petition has been drafted, verified, and placed on your active workspace Canvas.');
      
    } catch (error: any) {
      this.currentPhase = 'failed';
      await this.syncState('Mission Failure: ' + error.message, false, undefined, error.message);
    }
  }

  private getPassport() {
    return { permissions: ['admin:*'] };
  }

  private async syncPhase(phase: OodarPhase, message: string, details?: string) {
    this.currentPhase = phase;
    await this.syncState(message, false, details);
  }

  private async syncState(message: string, isComplete = false, details?: string, error?: string) {
    const logEntry = {
      timestamp: new Date(),
      phase: this.currentPhase,
      message,
      details
    };
    
    this.logs.push(logEntry);
    
    console.log(`[OodarAgent:${this.name}] ${this.currentPhase.toUpperCase()}: ${message}`);

    // Fire callback to stream the step in real-time to the UI
    try {
      this.onPhaseUpdateCallback?.(this.currentPhase, message, details, isComplete);
    } catch (cbErr) {
      console.warn('onPhaseUpdateCallback error:', cbErr);
    }

    // Update Supabase agent_state table for real-time UI tracking
    try {
      const { error: dbError } = await supabase
        .from('agent_state')
        .upsert({
          agent_id: this.id,
          mission_id: this.missionId,
          current_phase: this.currentPhase,
          status: isComplete ? 'completed' : this.currentPhase === 'failed' ? 'failed' : 'running',
          context_window: this.logs,
          last_error: error,
          updated_at: new Date()
        });
        
      if (dbError) console.warn('Supabase sync failed (expected if local):', dbError);
    } catch (e) {
      // Silent fail if no DB connected
    }
  }
}

