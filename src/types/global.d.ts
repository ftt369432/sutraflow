declare global {
  interface Window {
    gapi: {
      load: (libraries: string, callback: { callback: () => void; onerror: (error: unknown) => void }) => void;
      client: {
        init: (options: any) => Promise<void>;
        request: (options: any) => Promise<{
          result: any;
          status: number;
          statusText: string;
          headers: Record<string, string>;
        }>;
        setToken: (token: { access_token: string }) => void;
        gmail?: any;
      };
      auth2: {
        getAuthInstance: () => unknown;
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => any;
          revoke: (token: string, callback: () => void) => void;
        };
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
    useAssistantStore?: {
      getState?: () => any;
    };
    useKnowledgeBaseStore?: {
      getState?: () => any;
    };
    supabase?: any;
  }
  declare let gapi: any;
}

export {};