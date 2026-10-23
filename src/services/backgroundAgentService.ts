import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export interface AgentJob {
  id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  payload: {
    prompt: string;
    agentName?: string;
  };
  result?: {
    success: boolean;
    plan?: string;
    finalContent?: string;
    fileId?: string;
    error?: string;
  };
  created_at: string;
  updated_at: string;
}

type JobListener = (jobs: AgentJob[]) => void;

class BackgroundAgentService {
  private static instance: BackgroundAgentService;
  private jobs: AgentJob[] = [];
  private listeners: Set<JobListener> = new Set();
  private subscription: any = null;

  private constructor() {
    this.initializeRealtime();
  }

  public static getInstance(): BackgroundAgentService {
    if (!BackgroundAgentService.instance) {
      BackgroundAgentService.instance = new BackgroundAgentService();
    }
    return BackgroundAgentService.instance;
  }

  public subscribe(listener: JobListener): () => void {
    this.listeners.add(listener);
    listener([...this.jobs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const list = [...this.jobs];
    this.listeners.forEach(l => l(list));
  }

  public async fetchJobs(): Promise<AgentJob[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from('agent_jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.jobs = data || [];
      this.notify();
      return this.jobs;
    } catch (e) {
      console.error('[BackgroundAgentService] Failed to fetch jobs:', e);
      return [];
    }
  }

  public async submitJob(prompt: string, agentName: string = 'Sovereign Executor'): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('You must be signed in to run background agents.');
        return null;
      }

      // 1. Insert pending job locally/Supabase to get immediate Realtime sync
      const { data: job, error: insertError } = await supabase
        .from('agent_jobs')
        .insert({
          user_id: session.user.id,
          status: 'pending',
          payload: { prompt, agentName }
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // 2. Trigger the Supabase edge function (non-blocking)
      const url = `${(supabase as any).supabaseUrl}/functions/v1/run-agent`;
      const token = session.access_token;
      
      // Fire-and-forget or async request
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job.id,
          userId: session.user.id,
          prompt,
          agentName
        })
      }).catch(err => {
        console.error('[BackgroundAgentService] Edge function invoke failed:', err);
      });

      toast.info(`Background agent queued: "${prompt.substring(0, 30)}..."`);
      await this.fetchJobs();
      return job.id;
    } catch (e: any) {
      console.error('[BackgroundAgentService] Submit job failed:', e);
      toast.error(`Failed to submit job: ${e.message}`);
      return null;
    }
  }

  private initializeRealtime() {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;

      this.fetchJobs();

      if (this.subscription) {
        supabase.removeChannel(this.subscription);
      }

      this.subscription = supabase
        .channel('agent_jobs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_jobs',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            const newJob = payload.new as AgentJob;
            const oldJob = payload.old as AgentJob;

            if (payload.eventType === 'INSERT') {
              this.jobs = [newJob, ...this.jobs];
            } else if (payload.eventType === 'UPDATE') {
              const prevJob = this.jobs.find(j => j.id === newJob.id);
              this.jobs = this.jobs.map(j => j.id === newJob.id ? newJob : j);

              // Toast on status completion transitions
              if (prevJob && prevJob.status !== 'completed' && newJob.status === 'completed') {
                toast.success(`Agent completed job: "${newJob.payload.prompt.substring(0, 30)}..."`, {
                  description: 'Results delivered to your AI Drive.',
                  duration: 6000
                });
              } else if (prevJob && prevJob.status !== 'failed' && newJob.status === 'failed') {
                toast.error(`Agent job failed: "${newJob.payload.prompt.substring(0, 30)}..."`, {
                  description: newJob.result?.error || 'Unknown error during execution.'
                });
              }
            } else if (payload.eventType === 'DELETE') {
              this.jobs = this.jobs.filter(j => j.id === oldJob.id);
            }

            this.notify();
          }
        )
        .subscribe();
    });
  }
}

export const backgroundAgentService = BackgroundAgentService.getInstance();
