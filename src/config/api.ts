export interface APIConfig {
  serpapi: {
    key: string;
    baseUrl: string;
  };
  openai?: {
    key: string;
    baseUrl: string;
  };
  gemini?: {
    key: string;
    baseUrl: string;
  };
  anthropic?: {
    key: string;
    baseUrl: string;
  };
}

const config: APIConfig = {
  serpapi: {
    key: import.meta.env.VITE_SERPAPI_KEY || '',
    baseUrl: 'https://serpapi.com'
  },
  openai: {
    key: import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1'
  },
  gemini: {
    key: import.meta.env.VITE_GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  }
};

export default config; 