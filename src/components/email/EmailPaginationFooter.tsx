import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

interface EmailPaginationFooterProps {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  loading: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const EmailPaginationFooter: React.FC<EmailPaginationFooterProps> = ({
  currentPage,
  totalPages,
  totalMessages,
  hasPrevPage,
  hasNextPage,
  loading,
  onPrevPage,
  onNextPage,
}) => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({totalMessages} emails shown)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={!hasPrevPage || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground px-2">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!hasNextPage || loading}
          >
            {loading ? (
              <>
                <Spinner className="h-4 w-4 mr-1" />
                Loading...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
