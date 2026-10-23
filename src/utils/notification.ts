import { toast } from 'sonner';
import { useNotifications, NotificationType } from '../contexts/NotificationContext';

/**
 * Unified notification utility that shows toast messages and stores notifications
 * in the notification center.
 */
export function useNotify() {
  const { addNotification } = useNotifications();

  /**
   * Show a notification
   * @param title The notification title
   * @param message The notification message
   * @param type The notification type
   * @param options Additional options
   */
  const notify = (
    title: string,
    message: string,
    type: NotificationType = 'info',
    options?: {
      showToast?: boolean;
      actionUrl?: string;
      actionLabel?: string;
    }
  ) => {
    // Default options
    const { showToast = true, actionUrl, actionLabel } = options || {};

    // Always add to the notification center
    addNotification({
      title,
      message,
      type,
      actionUrl,
      actionLabel,
    });

    // Show toast if enabled
    if (showToast) {
      switch (type) {
        case 'success':
          toast.success(title, {
            description: message,
          });
          break;
        case 'error':
          toast.error(title, {
            description: message,
          });
          break;
        case 'warning':
          toast.warning(title, {
            description: message,
          });
          break;
        case 'info':
        default:
          toast.info(title, {
            description: message,
          });
          break;
      }
    }
  };

  /**
   * Show a success notification
   */
  const success = (title: string, message: string, options?: { showToast?: boolean; actionUrl?: string; actionLabel?: string }) => {
    notify(title, message, 'success', options);
  };

  /**
   * Show an error notification
   */
  const error = (title: string, message: string, options?: { showToast?: boolean; actionUrl?: string; actionLabel?: string }) => {
    notify(title, message, 'error', options);
  };

  /**
   * Show a warning notification
   */
  const warning = (title: string, message: string, options?: { showToast?: boolean; actionUrl?: string; actionLabel?: string }) => {
    notify(title, message, 'warning', options);
  };

  /**
   * Show an info notification
   */
  const info = (title: string, message: string, options?: { showToast?: boolean; actionUrl?: string; actionLabel?: string }) => {
    notify(title, message, 'info', options);
  };

  /**
   * Show a notification for API errors
   */
  const apiError = (error: Error | { response?: { data?: { message?: string } }, message?: string }, defaultMessage: string = 'An unexpected error occurred') => {
    const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as { message?: string })?.message || defaultMessage;
    notify('Error', errorMessage, 'error');
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
    apiError,
  };
}