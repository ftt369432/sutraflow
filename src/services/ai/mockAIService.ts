// Mock AI Service - for testing when CORS is broken
export class MockAIService {
  async generateText(prompt: string, options: any = {}): Promise<string> {
    console.log('🎭 MockAIService: Generating mock response for prompt:', prompt.substring(0, 50) + '...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Generate a realistic mock response based on the prompt
    const responses = [
      `I understand you're asking about: "${prompt.substring(0, 100)}..."\n\nThis is a mock response while we fix the CORS issues with the Groq API. The AI assistant functionality is working correctly - we just need to resolve the connection to the backend service.\n\nKey points:\n• The chat interface is functional\n• Message routing works properly\n• The issue is specifically with the API endpoint connection\n• Once CORS is fixed, you'll get real AI responses`,
      
      `Thank you for your message: "${prompt.substring(0, 60)}..."\n\n**Mock AI Assistant Response:**\n\nI can see your request is being processed correctly through the chat system. While we're resolving the backend API connection, here's what I can tell you:\n\n1. Your message was received and parsed successfully\n2. The chat interface and state management are working\n3. The provider switching system is functional\n4. We just need to fix the CORS configuration on the Supabase Edge Function\n\nOnce that's resolved, you'll receive full AI-powered responses!`,
      
      `Processing your request: "${prompt.substring(0, 80)}..."\n\n**Temporary Mock Response**\n\nThe AI Assistant system is operational - we're just using a mock service while fixing the API connectivity. Your message demonstrates that:\n\n✅ Chat UI is working\n✅ Message handling is correct\n✅ Assistant selection is functional\n✅ Knowledge base integration is ready\n\n❌ Just need to resolve CORS on the Groq API endpoint\n\nYour actual AI responses will be much more sophisticated once the connection is restored!`
    ];
    
    // 🔬 ENHANCED MOCK FOR TESTING VISUALIZER
    if (prompt.toLowerCase().includes('grid') || prompt.toLowerCase().includes('table')) {
      return `Here is the data grid analysis you requested:\n\n[\n  {"City": "New York", "Population": "8,335,897", "State": "NY"},\n  {"City": "Los Angeles", "Population": "3,822,238", "State": "CA"},\n  {"City": "Chicago", "Population": "2,665,039", "State": "IL"}\n]`;
    }

    if (prompt.toLowerCase().includes('flowchart') || prompt.toLowerCase().includes('mermaid') || prompt.toLowerCase().includes('diagram')) {
      return `Here is the process flowchart you requested:\n\ngraph TD\n  A[Start] --> B{Is it working?}\n  B -- Yes --> C[Success!]\n  B -- No --> D[Debug]\n  D --> B`;
    }

    const mockResponse = responses[Math.floor(Math.random() * responses.length)];
    console.log('✅ MockAIService: Generated mock response');
    return mockResponse;
  }
}

export const mockAIService = new MockAIService();