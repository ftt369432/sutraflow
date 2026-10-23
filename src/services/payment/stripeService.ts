// Mock Stripe service for development purposes

// Types
export interface SubscriptionParams {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface SubscriptionData {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'past_due';
  currentPeriodEnd: number;
  plan: {
    id: string;
    name: string;
    amount: number;
    interval: 'month' | 'year';
  };
}

/**
 * Get the current subscription for the user
 * In a production environment, this would fetch the subscription from Stripe API
 */
export async function getCurrentSubscription(): Promise<SubscriptionData | null> {
  console.log('Fetching current subscription');
  
  // For development, we'll simulate the process with a delay
  return new Promise((resolve) => {
    // Mock API call delay
    setTimeout(() => {
      // For development, return a mock subscription
      // In production, this would make a server request
      const mockSubscription: SubscriptionData = {
        id: 'sub_mock123456',
        status: 'active',
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        plan: {
          id: 'price_basic_monthly',
          name: 'Basic Plan',
          amount: 999, // $9.99
          interval: 'month'
        }
      };
      
      console.log('Subscription fetched successfully');
      resolve(mockSubscription);
    }, 800);
  });
}

/**
 * Create a subscription with Stripe
 * In a production environment, this would redirect to Stripe Checkout
 */
export async function createSubscription(params: SubscriptionParams): Promise<void> {
  const { priceId, successUrl, cancelUrl } = params;
  
  console.log('Creating subscription with price ID:', priceId);
  console.log('Success URL:', successUrl);
  console.log('Cancel URL:', cancelUrl);
  
  // For development, we'll simulate the process with a delay
  return new Promise((resolve, reject) => {
    try {
      // Mock API call delay
      setTimeout(() => {
        // In production, this would redirect to Stripe Checkout
        console.log('Subscription created successfully');
        
        // For testing, you can uncomment this to simulate redirect
        // window.location.href = successUrl;
        
        resolve();
      }, 1500);
    } catch (error) {
      console.error('Error creating subscription:', error);
      reject(error);
    }
  });
}

/**
 * Cancel a subscription with Stripe
 * In a production environment, this would make an API call to cancel the subscription
 */
export async function cancelSubscription(): Promise<void> {
  console.log('Cancelling subscription');
  
  // For development, we'll simulate the process with a delay
  return new Promise((resolve, reject) => {
    try {
      // Mock API call delay
      setTimeout(() => {
        console.log('Subscription cancelled successfully');
        resolve();
      }, 1500);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      reject(error);
    }
  });
} 