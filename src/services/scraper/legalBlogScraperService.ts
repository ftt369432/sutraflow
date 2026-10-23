/**
 * Legal Blog Scraper Service
 * 
 * Backend service for scraping legal blogs (like Sullivan on Comp) and 
 * ingesting content into the knowledge base vector system.
 * 
 * Features:
 * - Scrapes blog articles and converts to clean markdown
 * - Extracts legal metadata (case citations, statutes, topics)
 * - Generates embeddings for semantic search
 * - Scheduled scraping for updates
 * - Deduplication and versioning
 */

import { supabase } from '../../lib/supabase';
import { AIServiceFactory } from '../ai/aiServiceFactory';
import { vectorSearchService } from '../vectordb/vectorSearchService';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { useAssistantStore } from '../../store/assistantStore';

export interface ScrapedArticle {
  title: string;
  url: string;
  content: string;
  author: string;
  publishedDate: Date;
  topics: string[];
  tags: string[];
  caseCitations?: string[];
  statutes?: string[];
  htmlContent?: string;
}

export interface ScrapeJobConfig {
  baseUrl: string;
  assistantId?: string;
  maxPages?: number;
  includeArchive?: boolean;
  startDate?: Date;
  endDate?: Date;
  topicsFilter?: string[];
}

export interface ScrapeJobResult {
  success: boolean;
  articlesScraped: number;
  articlesAdded: number;
  articlesUpdated: number;
  articlesSkipped: number;
  errors: string[];
  jobId: string;
  startedAt: Date;
  completedAt: Date;
}

export class LegalBlogScraperService {
  private static instance: LegalBlogScraperService;
  private aiService = AIServiceFactory.getInstance();
  private legalBlogFolderId: string | null = null;

  static getInstance(): LegalBlogScraperService {
    if (!this.instance) {
      this.instance = new LegalBlogScraperService();
    }
    return this.instance;
  }

  /**
   * Get or create "Legal Blog Articles" folder and link to Legal Eagle assistant
   */
  private async getOrCreateLegalBlogFolder(assistantId?: string): Promise<string> {
    try {
      const kbStore = useKnowledgeBaseStore.getState();
      const assistantStore = useAssistantStore.getState();

      // Check if folder already exists
      const existingFolder = kbStore.folders.find(
        f => f.name === 'Legal Blog Articles' || f.name === 'Sullivan on Comp Blog'
      );

      if (existingFolder) {
        console.log('[LegalBlogScraper] Using existing folder:', existingFolder.name);
        this.legalBlogFolderId = existingFolder.id;
        return existingFolder.id;
      }

      // Create new folder
      console.log('[LegalBlogScraper] Creating "Legal Blog Articles" folder...');
      const newFolder = await kbStore.addFolder({
        name: 'Legal Blog Articles',
        description: 'Scraped articles from Sullivan on Comp and other legal blogs about workers compensation law',
        assistantIds: [],
        parentId: null
      });

      this.legalBlogFolderId = newFolder.id;
      console.log('[LegalBlogScraper] Created folder with ID:', newFolder.id);

      // Find Legal Eagle assistant (or use provided assistantId)
      let legalEagleId = assistantId;
      if (!legalEagleId) {
        const legalEagle = assistantStore.assistants.find(
          a => a.name.toLowerCase().includes('legal eagle') ||
               a.name.toLowerCase().includes('legal') && a.name.toLowerCase().includes('eagle')
        );
        
        if (legalEagle) {
          legalEagleId = legalEagle.id;
          console.log('[LegalBlogScraper] Found Legal Eagle assistant:', legalEagle.name);
        } else {
          console.warn('[LegalBlogScraper] Legal Eagle assistant not found, folder created without assistant link');
        }
      }

      // Link folder to Legal Eagle assistant
      if (legalEagleId) {
        await kbStore.linkAssistantToFolder(newFolder.id, legalEagleId);
        console.log('[LegalBlogScraper] Linked folder to Legal Eagle assistant');
      }

      return newFolder.id;
    } catch (error) {
      console.error('[LegalBlogScraper] Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Main scraping method for Sullivan on Comp blog
   */
  async scrapeSullivanOnCompBlog(
    config: ScrapeJobConfig
  ): Promise<ScrapeJobResult> {
    const jobId = crypto.randomUUID();
    const startedAt = new Date();
    const errors: string[] = [];
    let articlesScraped = 0;
    let articlesAdded = 0;
    let articlesUpdated = 0;
    let articlesSkipped = 0;

    console.log(`[LegalBlogScraper] Starting scrape job ${jobId}`);

    try {
      // Step 0: Ensure Legal Blog Articles folder exists and is linked to Legal Eagle
      const folderId = await this.getOrCreateLegalBlogFolder(config.assistantId);
      console.log(`[LegalBlogScraper] Using folder ID: ${folderId}`);

      // Step 1: Get list of all article URLs from blog homepage and paginated pages
      const articleUrls = await this.getAllArticleUrls(config);
      console.log(`[LegalBlogScraper] Found ${articleUrls.length} articles`);

      // Step 2: Scrape each article
      for (const url of articleUrls) {
        try {
          // Check if article already exists (by URL hash)
          const existingDoc = await this.checkIfArticleExists(url);
          
          if (existingDoc && !config.includeArchive) {
            articlesSkipped++;
            console.log(`[LegalBlogScraper] Skipping existing article: ${url}`);
            continue;
          }

          // Fetch and parse article
          const article = await this.scrapeArticle(url);
          articlesScraped++;

          // Convert to markdown
          const markdownContent = this.convertToMarkdown(article);

          // Add to knowledge base
          if (existingDoc) {
            await this.updateKnowledgeBaseDocument(existingDoc.id, article, markdownContent);
            articlesUpdated++;
          } else {
            await this.addToKnowledgeBase(article, markdownContent, folderId);
            articlesAdded++;
          }

          console.log(`[LegalBlogScraper] Processed: ${article.title}`);

          // Rate limiting: wait 1 second between requests to be respectful
          await this.sleep(1000);

        } catch (error) {
          const errorMsg = `Failed to scrape ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`[LegalBlogScraper] ${errorMsg}`);
        }
      }

    } catch (error) {
      const errorMsg = `Scrape job failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(`[LegalBlogScraper] ${errorMsg}`);
    }

    const completedAt = new Date();
    console.log(`[LegalBlogScraper] Job ${jobId} completed:`, {
      articlesScraped,
      articlesAdded,
      articlesUpdated,
      articlesSkipped,
      errors: errors.length
    });

    return {
      success: errors.length === 0 || articlesAdded > 0,
      articlesScraped,
      articlesAdded,
      articlesUpdated,
      articlesSkipped,
      errors,
      jobId,
      startedAt,
      completedAt
    };
  }

  /**
   * Get all article URLs from blog (including pagination)
   */
  private async getAllArticleUrls(config: ScrapeJobConfig): Promise<string[]> {
    const urls: Set<string> = new Set();
    const maxPages = config.maxPages || 5; // Default to 5 pages
    
    // Sullivan on Comp uses /blog/page/N for pagination
    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = page === 1 
        ? `${config.baseUrl}`
        : `${config.baseUrl}/page/${page}`;

      try {
        const response = await fetch(pageUrl);
        const html = await response.text();

        // Extract article links using regex patterns
        // Pattern: href="https://www.sullivanoncomp.com/blog/[article-slug]"
        const articleLinkPattern = /href="(https:\/\/www\.sullivanoncomp\.com\/blog\/[^"]+?)"/g;
        let match;

        while ((match = articleLinkPattern.exec(html)) !== null) {
          const url = match[1];
          // Exclude pagination links, topic pages, author pages
          if (!url.includes('/page/') && 
              !url.includes('/topic/') && 
              !url.includes('/author/') &&
              url !== config.baseUrl) {
            urls.add(url);
          }
        }

        console.log(`[LegalBlogScraper] Page ${page}: Found ${urls.size} unique articles so far`);

        // Small delay between pagination requests
        await this.sleep(500);

      } catch (error) {
        console.error(`[LegalBlogScraper] Error fetching page ${page}:`, error);
        break; // Stop if we hit an error (might be past last page)
      }
    }

    return Array.from(urls);
  }

  /**
   * Scrape individual article content
   */
  private async scrapeArticle(url: string): Promise<ScrapedArticle> {
    const response = await fetch(url);
    const html = await response.text();

    // Extract article data using regex patterns
    const title = this.extractTitle(html);
    const content = this.extractContent(html);
    const author = this.extractAuthor(html);
    const publishedDate = this.extractPublishedDate(html);
    const topics = this.extractTopics(html);
    const tags = this.extractTags(html);
    const caseCitations = this.extractCaseCitations(content);
    const statutes = this.extractStatutes(content);

    return {
      title,
      url,
      content,
      author,
      publishedDate,
      topics,
      tags,
      caseCitations,
      statutes,
      htmlContent: html
    };
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    // Try multiple patterns for robustness
    const patterns = [
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<title>([^<]+?)\s*\|/i,
      /<meta\s+property="og:title"\s+content="([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return 'Untitled Article';
  }

  /**
   * Extract main content from HTML
   */
  private extractContent(html: string): string {
    // Sullivan on Comp typically has content in <article> or specific divs
    // This is a simplified extraction - may need refinement
    const articlePattern = /<article[^>]*>([\s\S]*?)<\/article>/i;
    const match = html.match(articlePattern);

    if (match) {
      let content = match[1];
      // Remove HTML tags but preserve structure
      content = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');

      return this.cleanText(content);
    }

    return '';
  }

  /**
   * Extract author from HTML
   */
  private extractAuthor(html: string): string {
    const patterns = [
      /Posted by:\s*<[^>]+>([^<]+)</i,
      /<meta\s+name="author"\s+content="([^"]+)"/i,
      /by\s+([A-Z][a-z]+\s+[A-Z]\.\s+[A-Z][a-z]+)/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this.cleanText(match[1]);
      }
    }

    return 'Unknown Author';
  }

  /**
   * Extract published date from HTML
   */
  private extractPublishedDate(html: string): Date {
    const patterns = [
      /on\s+([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)/i,
      /<time[^>]+datetime="([^"]+)"/i,
      /<meta\s+property="article:published_time"\s+content="([^"]+)"/i
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        try {
          return new Date(match[1]);
        } catch {
          continue;
        }
      }
    }

    return new Date(); // Default to now if can't extract
  }

  /**
   * Extract topics/tags from HTML
   */
  private extractTopics(html: string): string[] {
    const topics: Set<string> = new Set();
    
    // Pattern: Topics: <a>tag1</a>, <a>tag2</a>
    const topicPattern = /Topics:([^<]*(?:<a[^>]*>[^<]+<\/a>[,\s]*)+)/i;
    const match = html.match(topicPattern);

    if (match) {
      const linkPattern = /<a[^>]*>([^<]+)<\/a>/g;
      let linkMatch;
      while ((linkMatch = linkPattern.exec(match[1])) !== null) {
        topics.add(this.cleanText(linkMatch[1]));
      }
    }

    return Array.from(topics);
  }

  /**
   * Extract tags (alias for topics in this context)
   */
  private extractTags(html: string): string[] {
    return this.extractTopics(html);
  }

  /**
   * Extract legal case citations from content
   */
  private extractCaseCitations(content: string): string[] {
    const citations: Set<string> = new Set();
    
    // Pattern: Case v. Case (Year) Volume Reporter Page
    // Example: "Ocean Accident and Guarantee Co. v. IAC (1916) 173 Cal. 313"
    const casePattern = /([A-Z][a-zA-Z\s&.]+)\s+v\.\s+([A-Z][a-zA-Z\s&.]+)\s*\((\d{4})\)\s*(\d+\s+[A-Za-z.]+\s+\d+)/g;
    let match;

    while ((match = casePattern.exec(content)) !== null) {
      citations.add(match[0].trim());
    }

    return Array.from(citations);
  }

  /**
   * Extract statute references from content
   */
  private extractStatutes(content: string): string[] {
    const statutes: Set<string> = new Set();
    
    // Common California workers' comp statute patterns
    const patterns = [
      /LC\s+\d{4}(?:\.\d+)?/g,  // LC 5502, LC 3600.5
      /Labor Code\s+(?:§\s*)?\d{4}(?:\.\d+)?/g,
      /CCR\s+\d+(?:\.\d+)?/g,   // CCR 30, CCR 31.3
      /California Code of Regulations[^,]+?§\s*\d+/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        statutes.add(match[0].trim());
      }
    }

    return Array.from(statutes);
  }

  /**
   * Convert scraped article to clean markdown format
   */
  private convertToMarkdown(article: ScrapedArticle): string {
    const lines: string[] = [];

    // Title
    lines.push(`# ${article.title}\n`);

    // Metadata
    lines.push(`**Author:** ${article.author}`);
    lines.push(`**Published:** ${article.publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push(`**Source:** [Sullivan on Comp](${article.url})\n`);

    // Topics
    if (article.topics.length > 0) {
      lines.push(`**Topics:** ${article.topics.join(', ')}\n`);
    }

    // Case Citations
    if (article.caseCitations && article.caseCitations.length > 0) {
      lines.push(`**Key Cases:**`);
      article.caseCitations.forEach(citation => {
        lines.push(`- ${citation}`);
      });
      lines.push('');
    }

    // Statutes
    if (article.statutes && article.statutes.length > 0) {
      lines.push(`**Relevant Statutes:** ${article.statutes.join(', ')}\n`);
    }

    // Main Content
    lines.push(`## Summary\n`);
    lines.push(article.content);

    return lines.join('\n');
  }

  /**
   * Check if article already exists in knowledge base
   */
  private async checkIfArticleExists(url: string): Promise<{ id: string } | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      // Check documents table for existing article by URL
      const { data, error } = await supabase
        .from('documents')
        .select('id')
        .eq('user_id', user.user.id)
        .contains('metadata', { source_url: url })
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Add article to knowledge base with embeddings
   */
  private async addToKnowledgeBase(
    article: ScrapedArticle,
    markdownContent: string,
    folderId: string
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Create document in database
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.user.id,
          title: article.title,
          content: markdownContent,
          type: 'legal_article',
          folder_id: folderId,
          metadata: {
            source: 'web_scrape',
            source_url: article.url,
            author: article.author,
            published_date: article.publishedDate.toISOString(),
            topics: article.topics,
            tags: article.tags,
            case_citations: article.caseCitations || [],
            statutes: article.statutes || [],
            category: 'Workers Compensation Law',
            scraped_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (docError) throw docError;

      // Generate and store embeddings using vector search service
      await vectorSearchService.indexDocument({
        id: document.id,
        content: markdownContent,
        title: article.title,
        metadata: document.metadata as any,
        chunks: [],
        embeddings: [],
        created_at: new Date(document.created_at),
        updated_at: new Date(document.updated_at),
        user_id: user.user.id,
        tags: article.tags,
        summary: article.content.substring(0, 500),
        keywords: [...article.topics, ...(article.statutes || [])],
        language: 'en',
        complexity_score: 0.7 // Legal content is generally complex
      });

      console.log(`[LegalBlogScraper] Added to knowledge base: ${article.title}`);
    } catch (error) {
      console.error('[LegalBlogScraper] Error adding to knowledge base:', error);
      throw error;
    }
  }

  /**
   * Update existing knowledge base document
   */
  private async updateKnowledgeBaseDocument(
    documentId: string,
    article: ScrapedArticle,
    markdownContent: string
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Update document
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          content: markdownContent,
          metadata: {
            source: 'web_scrape',
            source_url: article.url,
            author: article.author,
            published_date: article.publishedDate.toISOString(),
            topics: article.topics,
            tags: article.tags,
            case_citations: article.caseCitations || [],
            statutes: article.statutes || [],
            category: 'Workers Compensation Law',
            scraped_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', user.user.id);

      if (updateError) throw updateError;

      // Re-generate embeddings
      await vectorSearchService.indexDocument({
        id: documentId,
        content: markdownContent,
        title: article.title,
        metadata: {
          source_url: article.url,
          topics: article.topics
        } as any,
        chunks: [],
        embeddings: [],
        created_at: new Date(),
        updated_at: new Date(),
        user_id: user.user.id,
        tags: article.tags,
        summary: article.content.substring(0, 500),
        keywords: [...article.topics, ...(article.statutes || [])],
        language: 'en',
        complexity_score: 0.7
      });

      console.log(`[LegalBlogScraper] Updated in knowledge base: ${article.title}`);
    } catch (error) {
      console.error('[LegalBlogScraper] Error updating knowledge base:', error);
      throw error;
    }
  }

  /**
   * Clean and normalize text
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const legalBlogScraperService = LegalBlogScraperService.getInstance();
