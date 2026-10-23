/**
 * Vector Search Debug Utility
 * Add this to your project to enable detailed logging of vector search operations
 */

// Update the import paths to match your actual implementation
import { extractLegalReferences } from '../../utils/legalUtils';

/**
 * Wraps your existing vector search function with additional logging
 * @param {Function} originalSearchFn Your original vector search function
 * @returns {Function} Enhanced search function with logging
 */
export function createDebugVectorSearch(originalSearchFn) {
  return async function debugVectorSearch(query, options = {}) {
    console.log(`[DEBUG] Vector search requested for query: "${query}"`);
    
    // Check if query contains legal references
    const legalRefs = extractLegalReferences(query);
    if (legalRefs.allReferences.length > 0) {
      console.log(`[DEBUG] Legal references found in query:`, legalRefs.allReferences);
    } else {
      console.log(`[DEBUG] No legal references found in query`);
    }
    
    // Log search options
    console.log(`[DEBUG] Search options:`, JSON.stringify(options, null, 2));
    
    // Track timing
    const startTime = Date.now();
    
    try {
      // Call the original search function
      const results = await originalSearchFn(query, options);
      
      // Calculate time taken
      const duration = Date.now() - startTime;
      
      // Log results summary
      console.log(`[DEBUG] Search completed in ${duration}ms, found ${results.length} results`);
      
      // Log details about top results
      if (results.length > 0) {
        console.log(`[DEBUG] Top 3 results:`);
        results.slice(0, 3).forEach((result, i) => {
          console.log(`[DEBUG] Result #${i + 1}: ID=${result.id}, Score=${result.score}`);
          
          // Check if result contains legal references
          if (result.metadata?.legalReferences) {
            console.log(`[DEBUG] Legal references in result:`, result.metadata.legalReferences);
          }
        });
      } else {
        console.log(`[DEBUG] No results found`);
      }
      
      return results;
    } catch (error) {
      console.error(`[DEBUG] Vector search error:`, error);
      throw error;
    }
  };
}

/**
 * Wraps your knowledge base service with debug capabilities
 * @param {Object} knowledgeBaseService Your original KB service
 * @returns {Object} Enhanced KB service with debug methods
 */
export function createDebugKnowledgeBase(knowledgeBaseService) {
  return {
    ...knowledgeBaseService,
    
    searchWithTrace: async (query, options = {}) => {
      const traceLog = [];
      
      // Start trace
      traceLog.push({
        timestamp: new Date().toISOString(),
        event: 'search_start',
        query,
        options
      });
      
      // Extract legal references if any
      const legalRefs = extractLegalReferences(query);
      traceLog.push({
        timestamp: new Date().toISOString(),
        event: 'legal_references_extracted',
        references: legalRefs
      });
      
      try {
        // Perform search
        const results = await knowledgeBaseService.search(query, options);
        
        // Log results
        traceLog.push({
          timestamp: new Date().toISOString(),
          event: 'search_complete',
          resultCount: results.length
        });
        
        // Return both results and trace
        return {
          results,
          trace: traceLog
        };
      } catch (error) {
        traceLog.push({
          timestamp: new Date().toISOString(),
          event: 'search_error',
          error: error.message
        });
        
        throw error;
      }
    },
    
    // Add more debug methods as needed
  };
}

/**
 * Creates a middleware for Express that logs vector search operations
 */
export function createVectorSearchLogger(options = {}) {
  const { logToFile = false, logFilePath = './logs/vector-search.log' } = options;
  
  return function(req, res, next) {
    // Only intercept vector search endpoints
    if (req.path.includes('/api/vector') || req.path.includes('/api/search')) {
      const originalJson = res.json;
      
      // Start time
      const startTime = Date.now();
      
      // Log request
      console.log(`[VECTOR] ${req.method} ${req.path} - Query: ${req.query.q || req.body.query || '[none]'}`);
      
      // Capture the response
      res.json = function(data) {
        const duration = Date.now() - startTime;
        
        // Log response summary
        console.log(`[VECTOR] Response in ${duration}ms - Results: ${data.results?.length || 0}`);
        
        // Log to file if enabled
        if (logToFile) {
          // Implement file logging logic here
        }
        
        // Call original json method
        return originalJson.call(this, data);
      };
    }
    
    next();
  };
}

/**
 * Example usage of these debug utilities
 */
function exampleUsage() {
  /*
  // Original vector search service
  const vectorSearchService = {
    search: async (query, options) => {
      // Your implementation
    }
  };
  
  // Enhanced with debug
  const debugVectorSearch = createDebugVectorSearch(vectorSearchService.search);
  
  // Using the debug search
  debugVectorSearch("Labor Code 3208.3 analysis", { limit: 10 })
    .then(results => console.log(`Found ${results.length} results`))
    .catch(console.error);
  */
  
  console.log("Example usage - replace with your actual implementation");
}

// Export the debug utilities
export { exampleUsage };
