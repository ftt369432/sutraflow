import React from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface EmailPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalMessages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function EmailPagination({
  currentPage,
  totalPages,
  pageSize,
  totalMessages,
  isLoading = false,
  onPageChange,
  onPageSizeChange
}: EmailPaginationProps) {
  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7; // Show up to 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 4) {
        // Near beginning: 1 2 3 4 5 ... 10
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Near end: 1 ... 6 7 8 9 10
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: 1 ... 4 5 6 ... 10
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startMessage = (currentPage - 1) * pageSize + 1;
  const endMessage = Math.min(currentPage * pageSize, totalMessages);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-muted/20">
      {/* Left side: Message count and page size */}
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {totalMessages > 0 ? `${startMessage}-${endMessage} of ${totalMessages}` : 'No emails'}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Show:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-16 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side: Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center space-x-1">
          {/* First page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
            className="h-7 w-7 p-0"
          >
            <ChevronsLeft className="h-3 w-3" />
          </Button>

          {/* Previous page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((page, index) => (
              page === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400 text-sm">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={isLoading}
                  className="h-7 min-w-7 px-2 text-xs"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>

          {/* Last page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            className="h-7 w-7 p-0"
          >
            <ChevronsRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
} 