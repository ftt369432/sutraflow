import { useState, useCallback } from 'react';

export function useRightPanelState(initialState: boolean = true) {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState<boolean>(initialState);

  const toggleRightPanel = useCallback(() => {
    setIsRightPanelCollapsed(prev => !prev);
  }, []);

  const openRightPanel = useCallback(() => {
    setIsRightPanelCollapsed(false);
  }, []);

  const closeRightPanel = useCallback(() => {
    setIsRightPanelCollapsed(true);
  }, []);

  return {
    isRightPanelCollapsed,
    toggleRightPanel,
    openRightPanel,
    closeRightPanel,
    setIsRightPanelCollapsed // Expose setter directly if needed
  };
}