/**
 * Vector Data Quality Check Script
 * 
 * This script checks if document vectors/embeddings are clean and properly formatted.
 * It can identify documents where vector generation might have been affected by binary content.
 */

const { supabase } = require('./src/lib/supabaseClient');

async function checkVectorQuality() {
  console.log('Checking vector/embedding quality in the database...');
  
  try {
    // Get documents from the database that have embeddings
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, content, embedding')
      .not('embedding', 'is', null);
    
    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }
    
    console.log(`Found ${documents.length} documents with embeddings`);
    
    // Check for potential issues in embeddings
    const issuesByType = {
      zeroVectors: [],
      nullValues: [],
      abnormalDistribution: [],
      inconsistentLength: [],
      suspiciousDocuments: []
    };
    
    // Expected embedding length (adjust based on your model)
    const expectedLength = 1536; // For OpenAI Ada embeddings
    
    documents.forEach(doc => {
      const embedding = doc.embedding;
      
      // Check for null or undefined embeddings
      if (!embedding) {
        issuesByType.nullValues.push(doc.id);
        return;
      }
      
      // Check embedding length
      if (embedding.length !== expectedLength) {
        issuesByType.inconsistentLength.push({
          id: doc.id,
          title: doc.title,
          length: embedding.length
        });
      }
      
      // Check for zero vectors
      const nonZeroValues = embedding.filter(val => val !== 0).length;
      if (nonZeroValues === 0) {
        issuesByType.zeroVectors.push(doc.id);
      }
      
      // Check for abnormal value distribution
      // Most embeddings should have values distributed around 0
      const sum = embedding.reduce((acc, val) => acc + val, 0);
      const mean = sum / embedding.length;
      const squaredDiffs = embedding.map(val => (val - mean) ** 2);
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / embedding.length;
      const stdDev = Math.sqrt(variance);
      
      // Flag suspicious distributions
      if (Math.abs(mean) > 0.1 || stdDev < 0.01) {
        issuesByType.abnormalDistribution.push({
          id: doc.id,
          title: doc.title,
          mean,
          stdDev
        });
      }
      
      // Check for binary content that might have affected embeddings
      if (doc.content) {
        const nonPrintableChars = doc.content.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
        const nonPrintablePct = nonPrintableChars / doc.content.length;
        
        if (nonPrintablePct > 0.2) {
          issuesByType.suspiciousDocuments.push({
            id: doc.id,
            title: doc.title,
            nonPrintablePct
          });
        }
      }
    });
    
    // Print summary
    console.log('\n--- Vector Quality Summary ---');
    console.log(`Total documents checked: ${documents.length}`);
    console.log(`Documents with null vectors: ${issuesByType.nullValues.length}`);
    console.log(`Documents with zero vectors: ${issuesByType.zeroVectors.length}`);
    console.log(`Documents with incorrect length: ${issuesByType.inconsistentLength.length}`);
    console.log(`Documents with abnormal distributions: ${issuesByType.abnormalDistribution.length}`);
    console.log(`Documents with suspicious content: ${issuesByType.suspiciousDocuments.length}`);
    
    // Print details of suspicious documents
    if (issuesByType.suspiciousDocuments.length > 0) {
      console.log('\n--- Suspicious Documents ---');
      issuesByType.suspiciousDocuments.forEach(doc => {
        console.log(`${doc.id} - ${doc.title} (${Math.round(doc.nonPrintablePct * 100)}% non-printable)`);
      });
    }
    
    console.log('\nVector quality check complete!');
    
    // Return true if no major issues found
    const totalIssues = 
      issuesByType.nullValues.length +
      issuesByType.zeroVectors.length +
      issuesByType.inconsistentLength.length +
      issuesByType.abnormalDistribution.length;
      
    return totalIssues === 0;
  } catch (error) {
    console.error('Error checking vector quality:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  checkVectorQuality()
    .then(isClean => {
      if (isClean) {
        console.log('Vector data appears to be clean and well-formatted.');
      } else {
        console.log('Some issues were detected with the vector data. See details above.');
      }
    })
    .catch(console.error);
}

module.exports = { checkVectorQuality };
/**
 * Vector Data Quality Check Script
 * 
 * This script checks if document vectors/embeddings are clean and properly formatted.
 * It can identify documents where vector generation might have been affected by binary content.
 */

const { supabase } = require('./src/lib/supabaseClient');

async function checkVectorQuality() {
  console.log('Checking vector/embedding quality in the database...');
  
  try {
    // Get documents from the database that have embeddings
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, title, content, embedding')
      .not('embedding', 'is', null);
    
    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }
    
    console.log(`Found ${documents.length} documents with embeddings`);
    
    // Check for potential issues in embeddings
    const issuesByType = {
      zeroVectors: [],
      nullValues: [],
      abnormalDistribution: [],
      inconsistentLength: [],
      suspiciousDocuments: []
    };
    
    // Expected embedding length (adjust based on your model)
    const expectedLength = 1536; // For OpenAI Ada embeddings
    
    documents.forEach(doc => {
      const embedding = doc.embedding;
      
      // Check for null or undefined embeddings
      if (!embedding) {
        issuesByType.nullValues.push(doc.id);
        return;
      }
      
      // Check embedding length
      if (embedding.length !== expectedLength) {
        issuesByType.inconsistentLength.push({
          id: doc.id,
          title: doc.title,
          length: embedding.length
        });
      }
      
      // Check for zero vectors
      const nonZeroValues = embedding.filter(val => val !== 0).length;
      if (nonZeroValues === 0) {
        issuesByType.zeroVectors.push(doc.id);
      }
      
      // Check for abnormal value distribution
      // Most embeddings should have values distributed around 0
      const sum = embedding.reduce((acc, val) => acc + val, 0);
      const mean = sum / embedding.length;
      const squaredDiffs = embedding.map(val => (val - mean) ** 2);
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / embedding.length;
      const stdDev = Math.sqrt(variance);
      
      // Flag suspicious distributions
      if (Math.abs(mean) > 0.1 || stdDev < 0.01) {
        issuesByType.abnormalDistribution.push({
          id: doc.id,
          title: doc.title,
          mean,
          stdDev
        });
      }
      
      // Check for binary content that might have affected embeddings
      if (doc.content) {
        const nonPrintableChars = doc.content.replace(/[\x20-\x7E\n\r\t\u00A0-\u00FF]/g, '').length;
        const nonPrintablePct = nonPrintableChars / doc.content.length;
        
        if (nonPrintablePct > 0.2) {
          issuesByType.suspiciousDocuments.push({
            id: doc.id,
            title: doc.title,
            nonPrintablePct
          });
        }
      }
    });
    
    // Print summary
    console.log('\n--- Vector Quality Summary ---');
    console.log(`Total documents checked: ${documents.length}`);
    console.log(`Documents with null vectors: ${issuesByType.nullValues.length}`);
    console.log(`Documents with zero vectors: ${issuesByType.zeroVectors.length}`);
    console.log(`Documents with incorrect length: ${issuesByType.inconsistentLength.length}`);
    console.log(`Documents with abnormal distributions: ${issuesByType.abnormalDistribution.length}`);
    console.log(`Documents with suspicious content: ${issuesByType.suspiciousDocuments.length}`);
    
    // Print details of suspicious documents
    if (issuesByType.suspiciousDocuments.length > 0) {
      console.log('\n--- Suspicious Documents ---');
      issuesByType.suspiciousDocuments.forEach(doc => {
        console.log(`${doc.id} - ${doc.title} (${Math.round(doc.nonPrintablePct * 100)}% non-printable)`);
      });
    }
    
    console.log('\nVector quality check complete!');
    
    // Return true if no major issues found
    const totalIssues = 
      issuesByType.nullValues.length +
      issuesByType.zeroVectors.length +
      issuesByType.inconsistentLength.length +
      issuesByType.abnormalDistribution.length;
      
    return totalIssues === 0;
  } catch (error) {
    console.error('Error checking vector quality:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  checkVectorQuality()
    .then(isClean => {
      if (isClean) {
        console.log('Vector data appears to be clean and well-formatted.');
      } else {
        console.log('Some issues were detected with the vector data. See details above.');
      }
    })
    .catch(console.error);
}

module.exports = { checkVectorQuality };
