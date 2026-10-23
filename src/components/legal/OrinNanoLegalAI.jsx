// GenieFlow Integration with Orin Nano Legal AI
// Add this to your existing GenieFlow React app

import React, { useState, useEffect } from 'react';

// MCP Configuration for Orin Nano
export const ORIN_NANO_CONFIG = {
  // Update with your Orin Nano's IP address
  baseUrl: 'https://192.168.1.xxx:8080',  // Replace with actual IP
  fallbackUrl: 'http://192.168.1.xxx:8080',
  apiKey: 'legal-ai-secure-key-2024',
  timeout: 30000, // 30 seconds for document processing
};

// Custom hook for Orin Nano Legal AI
export const useOrinNanoLegalAI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test connection to Orin Nano
  const testConnection = async () => {
    try {
      const response = await fetch(`${ORIN_NANO_CONFIG.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ORIN_NANO_CONFIG.apiKey}`,
        },
        timeout: 5000,
      });
      
      if (response.ok) {
        setIsConnected(true);
        return true;
      }
    } catch (err) {
      // Try fallback HTTP connection
      try {
        const response = await fetch(`${ORIN_NANO_CONFIG.fallbackUrl}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${ORIN_NANO_CONFIG.apiKey}`,
          },
          timeout: 5000,
        });
        
        if (response.ok) {
          setIsConnected(true);
          return true;
        }
      } catch (fallbackErr) {
        setIsConnected(false);
        setError('Cannot connect to Orin Nano Legal AI');
        return false;
      }
    }
    return false;
  };

  // Analyze legal document
  const analyzeDocument = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('document', file);

      const url = isConnected ? 
        `${ORIN_NANO_CONFIG.baseUrl}/analyze/document` : 
        `${ORIN_NANO_CONFIG.fallbackUrl}/analyze/document`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ORIN_NANO_CONFIG.apiKey}`,
        },
        body: formData,
        timeout: ORIN_NANO_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Analyze contract specifically
  const analyzeContract = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('contract', file);

      const url = isConnected ? 
        `${ORIN_NANO_CONFIG.baseUrl}/analyze/contract` : 
        `${ORIN_NANO_CONFIG.fallbackUrl}/analyze/contract`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ORIN_NANO_CONFIG.apiKey}`,
        },
        body: formData,
        timeout: ORIN_NANO_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new Error(`Contract analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Risk assessment
  const assessRisk = async (documentText) => {
    setLoading(true);
    setError(null);

    try {
      const url = isConnected ? 
        `${ORIN_NANO_CONFIG.baseUrl}/analyze/risk` : 
        `${ORIN_NANO_CONFIG.fallbackUrl}/analyze/risk`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ORIN_NANO_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentText,
          document_type: 'general'
        }),
        timeout: ORIN_NANO_CONFIG.timeout,
      });

      if (!response.ok) {
        throw new Error(`Risk assessment failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test connection on component mount
    testConnection();
  }, []);

  return {
    isConnected,
    loading,
    error,
    testConnection,
    analyzeDocument,
    analyzeContract,
    assessRisk,
  };
};

// Legal Document Analyzer Component
export const LegalDocumentAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisType, setAnalysisType] = useState('document'); // document, contract, risk
  
  const { 
    isConnected, 
    loading, 
    error, 
    analyzeDocument, 
    analyzeContract, 
    testConnection 
  } = useOrinNanoLegalAI();

  const handleAnalyze = async () => {
    if (!file) return;

    try {
      let result;
      
      if (analysisType === 'contract') {
        result = await analyzeContract(file);
      } else {
        result = await analyzeDocument(file);
      }
      
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className="legal-ai-analyzer p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            🏛️ Legal AI Document Analyzer
          </h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to Orin Nano' : 'Disconnected'}
            </span>
            <button 
              onClick={testConnection}
              className="text-blue-600 text-sm hover:underline"
            >
              Test Connection
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analysis Type
            </label>
            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="document">General Document</option>
              <option value="contract">Contract Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Legal Document
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="border border-gray-300 rounded-md px-3 py-2 w-full"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading || !isConnected}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              (!file || loading || !isConnected)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing on Orin Nano...
              </div>
            ) : (
              'Analyze Document'
            )}
          </button>
        </div>
      </div>

      {analysisResult && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900">Document Type</h4>
              <p className="text-blue-800 capitalize">{analysisResult.document_type}</p>
              <p className="text-sm text-blue-600">
                Confidence: {Math.round(analysisResult.confidence * 100)}%
              </p>
            </div>

            {analysisResult.key_findings && (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="font-medium text-green-900 mb-2">Key Findings</h4>
                <ul className="list-disc list-inside space-y-1 text-green-800">
                  {analysisResult.key_findings.map((finding, index) => (
                    <li key={index} className="text-sm">{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.risk_assessment && (
              <div className={`p-4 rounded-md ${
                analysisResult.risk_assessment.risk_level === 'high' 
                  ? 'bg-red-50' 
                  : analysisResult.risk_assessment.risk_level === 'medium' 
                  ? 'bg-yellow-50' 
                  : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  analysisResult.risk_assessment.risk_level === 'high' 
                    ? 'text-red-900' 
                    : analysisResult.risk_assessment.risk_level === 'medium' 
                    ? 'text-yellow-900' 
                    : 'text-gray-900'
                }`}>
                  Risk Assessment: {analysisResult.risk_assessment.risk_level?.toUpperCase()}
                </h4>
                {analysisResult.risk_assessment.specific_risks && (
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysisResult.risk_assessment.specific_risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {analysisResult.recommendations && (
              <div className="bg-purple-50 p-4 rounded-md">
                <h4 className="font-medium text-purple-900 mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-purple-800">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Processing time: {analysisResult.processing_time?.toFixed(2)}s | 
              Processed locally on Orin Nano GPU
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalDocumentAnalyzer;