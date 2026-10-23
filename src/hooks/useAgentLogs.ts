import { useState, useEffect } from 'react';

export function useAgentLogs(agentId: string) {
  const [logs, setLogs] = useState([
    {
      timestamp: new Date(),
      level: 'info',
      message: 'Agent initialized successfully',
    },
    {
      timestamp: new Date(Date.now() - 5000),
      level: 'warning',
      message: 'Processing large dataset',
    },
    {
      timestamp: new Date(Date.now() - 10000),
      level: 'error',
      message: 'Failed to connect to external service',
    }
  ]);

  useEffect(() => {
    // Simulate real-time logs
    const interval = setInterval(() => {
      setLogs(prev => [
        {
          timestamp: new Date(),
          level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          message: `Log message ${Date.now()}`,
        },
        ...prev.slice(0, 49), // Keep last 50 logs
      ]);
    }, 5000);

    return () => clearInterval(interval);
  }, [agentId]);

  return logs;
} 