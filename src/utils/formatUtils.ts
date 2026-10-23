/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes The file size in bytes
 * @returns A human-readable string representation of the file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Formats a date string to a human-readable format
 * @param dateString The date string to format
 * @returns A formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return '';
  
  // If date is today, show time
  const today = new Date();
  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If date is yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If date is within this year
  if (date.getFullYear() === today.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  // Otherwise show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 * @param dateString The date string to format
 * @returns A relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return '';
  
  const secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (secondsAgo < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  
  // Less than a day
  if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  
  // Less than a week
  if (secondsAgo < 604800) {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  
  // Less than a month
  if (secondsAgo < 2592000) {
    const weeks = Math.floor(secondsAgo / 604800);
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }
  
  // Less than a year
  if (secondsAgo < 31536000) {
    const months = Math.floor(secondsAgo / 2592000);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }
  
  // More than a year
  const years = Math.floor(secondsAgo / 31536000);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}; 