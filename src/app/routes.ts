// App routes configuration
export const routes = {
  home: '/',
  email: '/email',
  calendar: '/calendar',
  documents: '/documents',
  assistants: '/assistants',
  settings: '/settings',
  auth: {
    callback: '/auth/callback',
    login: '/auth/login',
    logout: '/auth/logout'
  },
  api: {
    email: '/api/email',
    calendar: '/api/calendar',
    documents: '/api/documents'
  }
} as const;

export type AppRoutes = typeof routes;
