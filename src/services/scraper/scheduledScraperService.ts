/**
 * Scheduled Blog Scraper Service
 * 
 * Runs periodic scraping jobs to keep knowledge base updated with latest
 * legal articles from Sullivan on Comp and other legal blogs.
 * 
 * Features:
 * - Configurable scraping schedules (daily, weekly, monthly)
 * - Multiple blog source support
 * - Email notifications on completion
 * - Error tracking and retry logic
 * - Job history and analytics
 */

import { legalBlogScraperService } from './legalBlogScraperService';
import { supabase } from '../../lib/supabase';

export interface ScraperSchedule {
  id: string;
  name: string;
  blogUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string; // For custom schedules
  assistantId?: string;
  maxPages: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  totalArticlesScraped: number;
  totalErrors: number;
}

export interface ScraperJobHistory {
  id: string;
  scheduleId: string;
  jobId: string;
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'partial' | 'failed';
  articlesAdded: number;
  articlesUpdated: number;
  articlesSkipped: number;
  errors: string[];
}

export class ScheduledScraperService {
  private static instance: ScheduledScraperService;
  private schedules: Map<string, ScraperSchedule> = new Map();
  private runningJobs: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): ScheduledScraperService {
    if (!this.instance) {
      this.instance = new ScheduledScraperService();
    }
    return this.instance;
  }

  /**
   * Initialize default scraping schedules
   */
  async initializeDefaultSchedules(): Promise<void> {
    // Sullivan on Comp - Daily scrape for latest updates
    await this.addSchedule({
      id: 'sullivan-daily',
      name: 'Sullivan on Comp Daily Update',
      blogUrl: 'https://www.sullivanoncomp.com/blog',
      frequency: 'daily',
      maxPages: 2, // Only scrape first 2 pages for daily updates
      enabled: true,
      totalArticlesScraped: 0,
      totalErrors: 0
    });

    console.log('[ScheduledScraper] Default schedules initialized');
  }

  /**
   * Add a new scraping schedule
   */
  async addSchedule(schedule: ScraperSchedule): Promise<void> {
    this.schedules.set(schedule.id, schedule);
    
    // Save to database for persistence
    await this.saveScheduleToDB(schedule);

    if (schedule.enabled) {
      this.startSchedule(schedule.id);
    }

    console.log(`[ScheduledScraper] Added schedule: ${schedule.name}`);
  }

  /**
   * Remove a scraping schedule
   */
  async removeSchedule(scheduleId: string): Promise<void> {
    this.stopSchedule(scheduleId);
    this.schedules.delete(scheduleId);
    
    // Remove from database
    await this.removeScheduleFromDB(scheduleId);

    console.log(`[ScheduledScraper] Removed schedule: ${scheduleId}`);
  }

  /**
   * Start a schedule (begins running periodic jobs)
   */
  startSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      console.error(`[ScheduledScraper] Schedule not found: ${scheduleId}`);
      return;
    }

    if (this.runningJobs.has(scheduleId)) {
      console.warn(`[ScheduledScraper] Schedule already running: ${scheduleId}`);
      return;
    }

    const intervalMs = this.getIntervalMs(schedule.frequency);
    
    // Run immediately
    this.executeScheduledJob(scheduleId);

    // Then schedule recurring runs
    const timer = setInterval(() => {
      this.executeScheduledJob(scheduleId);
    }, intervalMs);

    this.runningJobs.set(scheduleId, timer);
    console.log(`[ScheduledScraper] Started schedule: ${schedule.name} (${schedule.frequency})`);
  }

  /**
   * Stop a running schedule
   */
  stopSchedule(scheduleId: string): void {
    const timer = this.runningJobs.get(scheduleId);
    if (timer) {
      clearInterval(timer);
      this.runningJobs.delete(scheduleId);
      console.log(`[ScheduledScraper] Stopped schedule: ${scheduleId}`);
    }
  }

  /**
   * Execute a scheduled scraping job
   */
  private async executeScheduledJob(scheduleId: string): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return;

    console.log(`[ScheduledScraper] Executing job for: ${schedule.name}`);

    try {
      const result = await legalBlogScraperService.scrapeSullivanOnCompBlog({
        baseUrl: schedule.blogUrl,
        maxPages: schedule.maxPages,
        assistantId: schedule.assistantId,
        includeArchive: false // Only get new articles
      });

      // Update schedule stats
      schedule.lastRun = new Date();
      schedule.nextRun = new Date(Date.now() + this.getIntervalMs(schedule.frequency));
      schedule.totalArticlesScraped += result.articlesAdded + result.articlesUpdated;
      schedule.totalErrors += result.errors.length;

      // Save job history
      await this.saveJobHistory({
        id: crypto.randomUUID(),
        scheduleId: schedule.id,
        jobId: result.jobId,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        status: result.success ? 'success' : (result.articlesAdded > 0 ? 'partial' : 'failed'),
        articlesAdded: result.articlesAdded,
        articlesUpdated: result.articlesUpdated,
        articlesSkipped: result.articlesSkipped,
        errors: result.errors
      });

      console.log(`[ScheduledScraper] Job completed: ${result.articlesAdded} added, ${result.errors.length} errors`);

      // Send notification if configured
      if (result.articlesAdded > 0) {
        await this.sendNotification(schedule, result);
      }

    } catch (error) {
      console.error(`[ScheduledScraper] Job failed for ${schedule.name}:`, error);
      schedule.totalErrors++;
    }

    // Update schedule in database
    await this.saveScheduleToDB(schedule);
  }

  /**
   * Get interval in milliseconds based on frequency
   */
  private getIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  /**
   * Save schedule to database
   */
  private async saveScheduleToDB(schedule: ScraperSchedule): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('scraper_schedules')
        .upsert({
          id: schedule.id,
          user_id: user.user.id,
          name: schedule.name,
          blog_url: schedule.blogUrl,
          frequency: schedule.frequency,
          assistant_id: schedule.assistantId,
          max_pages: schedule.maxPages,
          enabled: schedule.enabled,
          last_run: schedule.lastRun?.toISOString(),
          next_run: schedule.nextRun?.toISOString(),
          total_articles_scraped: schedule.totalArticlesScraped,
          total_errors: schedule.totalErrors,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[ScheduledScraper] Error saving schedule to DB:', error);
    }
  }

  /**
   * Remove schedule from database
   */
  private async removeScheduleFromDB(scheduleId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('scraper_schedules')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', user.user.id);
    } catch (error) {
      console.error('[ScheduledScraper] Error removing schedule from DB:', error);
    }
  }

  /**
   * Save job history to database
   */
  private async saveJobHistory(history: ScraperJobHistory): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('scraper_job_history')
        .insert({
          id: history.id,
          user_id: user.user.id,
          schedule_id: history.scheduleId,
          job_id: history.jobId,
          started_at: history.startedAt.toISOString(),
          completed_at: history.completedAt.toISOString(),
          status: history.status,
          articles_added: history.articlesAdded,
          articles_updated: history.articlesUpdated,
          articles_skipped: history.articlesSkipped,
          errors: history.errors,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[ScheduledScraper] Error saving job history to DB:', error);
    }
  }

  /**
   * Send notification about scraping results
   */
  private async sendNotification(schedule: ScraperSchedule, result: any): Promise<void> {
    // TODO: Implement email notification or in-app notification
    // For now, just log
    console.log(`[ScheduledScraper] 📧 Notification: ${result.articlesAdded} new articles from ${schedule.name}`);
  }

  /**
   * Get all schedules
   */
  getSchedules(): ScraperSchedule[] {
    return Array.from(this.schedules.values());
  }

  /**
   * Get job history for a schedule
   */
  async getJobHistory(scheduleId: string, limit: number = 10): Promise<ScraperJobHistory[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('scraper_job_history')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        scheduleId: row.schedule_id,
        jobId: row.job_id,
        startedAt: new Date(row.started_at),
        completedAt: new Date(row.completed_at),
        status: row.status,
        articlesAdded: row.articles_added,
        articlesUpdated: row.articles_updated,
        articlesSkipped: row.articles_skipped,
        errors: row.errors || []
      }));
    } catch (error) {
      console.error('[ScheduledScraper] Error fetching job history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const scheduledScraperService = ScheduledScraperService.getInstance();
