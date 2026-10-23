import { useCallback } from 'react';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    // For now, we'll just console.log the toast
    // In a real app, you'd integrate with a toast library
    console.log('Toast:', options);
  }, []);
  
  // Add convenience methods
  const enhancedToast = Object.assign(toast, {
    success: (message: string) => {
      console.log('Toast Success:', message);
      toast({ title: 'Success', description: message, variant: 'success' });
    },
    error: (message: string) => {
      console.log('Toast Error:', message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
    info: (message: string) => {
      console.log('Toast Info:', message);
      toast({ title: 'Info', description: message, variant: 'default' });
    }
  });

  return { toast: enhancedToast };
}