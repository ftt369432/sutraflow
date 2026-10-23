import { useState, useCallback } from 'react';
import { EmailMessage } from '../../services/email/types';
import { EmailEventDetails } from '../../services/calendar/EmailEventAnalyzer';

interface CalendarModalState {
  isOpen: boolean;
  selectedEmail: EmailMessage | null;
  eventDetails: EmailEventDetails | null;
  needsReauth: boolean;
}

/**
 * Hook for managing calendar modal state and operations
 * Handles modal open/close, email selection, and event details
 */
export const useCalendarModal = () => {
  const [modalState, setModalState] = useState<CalendarModalState>({
    isOpen: false,
    selectedEmail: null,
    eventDetails: null,
    needsReauth: false
  });

  // Open modal with email and optional event details
  const openModal = useCallback((email: EmailMessage, eventDetails?: EmailEventDetails | null) => {
    setModalState({
      isOpen: true,
      selectedEmail: email,
      eventDetails: eventDetails || null,
      needsReauth: false
    });
  }, []);

  // Close modal and reset state
  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      selectedEmail: null,
      eventDetails: null,
      needsReauth: false
    });
  }, []);

  // Set reauth needed state
  const setNeedsReauth = useCallback((needsReauth: boolean) => {
    setModalState(prev => ({
      ...prev,
      needsReauth
    }));
  }, []);

  // Update event details
  const updateEventDetails = useCallback((eventDetails: EmailEventDetails) => {
    setModalState(prev => ({
      ...prev,
      eventDetails
    }));
  }, []);

  return {
    // State
    isOpen: modalState.isOpen,
    selectedEmail: modalState.selectedEmail,
    eventDetails: modalState.eventDetails,
    needsReauth: modalState.needsReauth,
    
    // Actions
    openModal,
    closeModal,
    setNeedsReauth,
    updateEventDetails
  };
};
