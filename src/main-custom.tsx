import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'sonner';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SupabaseProvider } from './providers/SupabaseProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { EmailProvider } from './contexts/EmailContext';
import { services } from './services/core/initializeServices';

// Create a context for services
export const ServicesContext = React.createContext(services);

// Create root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
const root = ReactDOM.createRoot(rootElement);

// Render app with providers
root.render(
  <SupabaseProvider>
    <NotificationProvider>
      <ThemeProvider>
        <EmailProvider>
          <ServicesContext.Provider value={services}>
            <DndProvider backend={HTML5Backend}>
              <App />
              <Toaster position="top-right" />
            </DndProvider>
          </ServicesContext.Provider>
        </EmailProvider>
      </ThemeProvider>
    </NotificationProvider>
  </SupabaseProvider>
); 