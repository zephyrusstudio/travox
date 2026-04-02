import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import Button from "./Button";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
  showItemsPerPage?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
  showItemsPerPage = true,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
    // Reset to page 1 when changing items per page
    onPageChange(1);
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-gradient-to-r from-white to-gray-50/70 px-3 py-3 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800/70 sm:px-4">
      <div className="flex w-full flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-start sm:gap-4 lg:w-auto">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{startItem}</span> to{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{endItem}</span> of{" "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">{totalItems}</span> results
          </p>
          {showItemsPerPage && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="itemsPerPage"
                className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
              >
                Items per page
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="form-select !h-9 !w-20 !px-2 !py-0 text-xs !font-medium"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <Button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:text-sm">
            Page {currentPage} of {totalPages}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
