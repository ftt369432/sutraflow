import React, { useState } from 'react';
import { useAsyncAction } from '../../utils/useAsyncAction';
import { useLoadingState } from '../../utils/loadingState';
import { LoadingButton } from '../ui/LoadingButton';
import { Spinner, SpinnerOverlay, FullPageSpinner } from '../ui/Spinner';
import { Button } from '../ui/Button';

/**
 * Simulates an API call that takes some time and might fail
 */
const simulateApiCall = async (shouldFail = false, delay = 1500): Promise<{ message: string }> => {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (shouldFail) {
    throw new Error('API call failed');
  }
  
  return { message: 'API call succeeded' };
};

export function LoadingExample() {
  const [showFullPageSpinner, setShowFullPageSpinner] = useState(false);
  const [showSpinnerOverlay, setShowSpinnerOverlay] = useState(false);
  const { loadingState, startLoading, stopLoading, isLoading, withLoading } = useLoadingState();
  
  // Example 1: Basic button loading
  const handleBasicLoading = async () => {
    startLoading('basic');
    try {
      await simulateApiCall();
    } finally {
      stopLoading('basic');
    }
  };

  // Example 2: Using withLoading helper
  const handleWithLoading = async () => {
    try {
      await withLoading('withLoading', async () => {
        return await simulateApiCall();
      }, {
        successTitle: 'Success',
        successMessage: 'Operation completed successfully',
        showSuccessNotification: true
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Example 3: Using useAsyncAction hook for a more complete approach
  const { execute: executeSafe, isLoading: isSafeLoading } = useAsyncAction({
    operationId: 'safe-execute',
    action: () => simulateApiCall(false),
    onSuccess: {
      title: 'Success',
      message: 'Safe operation completed successfully',
      showNotification: true
    }
  });

  // Example 4: Using useAsyncAction with error
  const { execute: executeFail, isLoading: isFailLoading } = useAsyncAction({
    operationId: 'fail-execute',
    action: () => simulateApiCall(true),
    onError: {
      title: 'Error',
      message: 'Operation failed as expected',
      showNotification: true
    }
  });

  // Example 5: Full page loading
  const handleFullPageLoading = async () => {
    setShowFullPageSpinner(true);
    try {
      await simulateApiCall();
    } finally {
      setShowFullPageSpinner(false);
    }
  };

  // Example 6: Element overlay loading
  const handleOverlayLoading = async () => {
    setShowSpinnerOverlay(true);
    try {
      await simulateApiCall();
    } finally {
      setShowSpinnerOverlay(false);
    }
  };
  
  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-8">Loading States Examples</h2>
      
      {/* Example 1: Basic Loading Button */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">Basic Loading Button</h3>
        <p className="mb-4 text-gray-600">Simple approach using LoadingButton component</p>
        <LoadingButton 
          onClick={handleBasicLoading} 
          isLoading={isLoading('basic')}
          loadingText="Loading..."
        >
          Start Basic Loading
        </LoadingButton>
      </div>

      {/* Example 2: withLoading Helper */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">Using withLoading Helper</h3>
        <p className="mb-4 text-gray-600">Simplified approach with notifications using withLoading</p>
        <LoadingButton
          onClick={handleWithLoading}
          isLoading={isLoading('withLoading')}
          loadingText="Loading with helper..."
        >
          Start Loading with Helper
        </LoadingButton>
      </div>

      {/* Example 3: useAsyncAction Hook */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">useAsyncAction Hook (Success)</h3>
        <p className="mb-4 text-gray-600">Complete approach with hooks, error handling, and notifications</p>
        <LoadingButton
          onClick={executeSafe}
          isLoading={isSafeLoading}
          loadingText="Running safe operation..."
        >
          Execute Successful Operation
        </LoadingButton>
      </div>

      {/* Example 4: useAsyncAction Hook with Error */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">useAsyncAction Hook (Error)</h3>
        <p className="mb-4 text-gray-600">Example with error handling</p>
        <LoadingButton
          onClick={executeFail}
          isLoading={isFailLoading}
          loadingText="Running operation with error..."
          variant="destructive"
        >
          Execute Failed Operation
        </LoadingButton>
      </div>

      {/* Example 5: Spinner Component */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">Spinner Components</h3>
        <p className="mb-4 text-gray-600">Various spinner component variations</p>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <Spinner size={24} />
            <span className="mt-2 text-sm text-gray-500">Small</span>
          </div>
          <div className="flex flex-col items-center">
            <Spinner size={32} color="text-blue-500" />
            <span className="mt-2 text-sm text-gray-500">Blue</span>
          </div>
          <div className="flex flex-col items-center">
            <Spinner size={40} color="text-green-500" text="Loading..." />
            <span className="mt-2 text-sm text-gray-500">With text</span>
          </div>
          <div className="flex flex-col items-center">
            <Spinner size={36} color="#ff6b6b" thickness={3} speed={2} />
            <span className="mt-2 text-sm text-gray-500">Custom</span>
          </div>
        </div>
      </div>

      {/* Example 6: Full Page Spinner */}
      <div className="p-6 border rounded-lg bg-white relative">
        <h3 className="text-lg font-semibold mb-4">Full Page Loading</h3>
        <p className="mb-4 text-gray-600">Full page loading overlay</p>
        <Button onClick={handleFullPageLoading}>
          Show Full Page Loading
        </Button>
        {showFullPageSpinner && <FullPageSpinner text="Loading page content..." />}
      </div>

      {/* Example 7: Spinner Overlay */}
      <div className="p-6 border rounded-lg bg-white relative h-64">
        <h3 className="text-lg font-semibold mb-4">Element Loading Overlay</h3>
        <p className="mb-4 text-gray-600">Overlay that covers only one component</p>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Button onClick={handleOverlayLoading}>
              Show Overlay on Card
            </Button>
          </div>
          
          <div className="relative min-h-[100px] p-4 border rounded bg-gray-50">
            <h4 className="font-medium">Content Area</h4>
            <p>This content will be covered by the loading overlay</p>
            {showSpinnerOverlay && <SpinnerOverlay blur={true} text="Loading content..." />}
          </div>
        </div>
      </div>
    </div>
  );
} 