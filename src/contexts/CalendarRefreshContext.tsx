import React, { createContext, useContext, useState, useCallback } from 'react';

interface CalendarRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const CalendarRefreshContext = createContext<CalendarRefreshContextType | null>(null);

export const CalendarRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    console.log('📅 Calendar refresh triggered');
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);

  return (
    <CalendarRefreshContext.Provider value={{ refreshTrigger, triggerRefresh, isRefreshing }}>
      {children}
    </CalendarRefreshContext.Provider>
  );
};

export const useCalendarRefresh = () => {
  const context = useContext(CalendarRefreshContext);
  if (!context) {
    throw new Error('useCalendarRefresh must be used within a CalendarRefreshProvider');
  }
  return context;
};
