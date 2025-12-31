/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../utils/apiConnector";

interface UseSearchOptions<T> {
  endpoint: string;
  searchFields: (item: T) => string[];
  initialFetch?: boolean; // Kept for API compatibility, but not used
  unmask?: boolean;
  filterFn?: (item: any) => boolean;
}

export function useSearch<T = any>(options: UseSearchOptions<T>) {
  const { endpoint, searchFields, unmask = true, filterFn } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Fetch data for search
  const fetchData = useCallback(
    async (): Promise<T[]> => {
      try {
        const params = new URLSearchParams();
        if (unmask) params.append("unmask", "true");

        const queryString = params.toString();
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${queryString ? `${separator}${queryString}` : ""}`;

        const response = await apiRequest<any>({
          method: "GET",
          url,
        });

        let data = response?.data ?? response ?? [];
        data = Array.isArray(data) ? data : [];
        
        // Apply filter function if provided
        if (filterFn && Array.isArray(data)) {
          data = data.filter(filterFn);
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch data:", error);
        throw error;
      }
    },
    [endpoint, unmask, filterFn]
  );

  // Perform search
  const performSearch = useCallback(
    async (term: string) => {
      // Cancel any ongoing search
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }

      const trimmedTerm = term.trim().toLowerCase();

      // If empty search term, return empty results
      if (!trimmedTerm) {
        setSearchResults([]);
        setSearchError(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);

      // Create new abort controller for this search
      const abortController = new AbortController();
      searchAbortControllerRef.current = abortController;

      try {
        // Fetch all data
        const data = await fetchData();

        // Check if aborted
        if (abortController.signal.aborted) return;

        // Search in data
        const results = data.filter((item) => {
          const fields = searchFields(item);
          return fields.some((field) =>
            field.toLowerCase().includes(trimmedTerm)
          );
        });

        setSearchResults(results);
      } catch (error: any) {
        // Don't set error if aborted
        if (!abortController.signal.aborted) {
          setSearchError(error?.message || "Search failed");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
          searchAbortControllerRef.current = null;
        }
      }
    },
    [fetchData, searchFields]
  );

  // Invalidate cache function (no-op since we don't cache)
  const invalidateCache = useCallback(() => {
    // No-op - kept for API compatibility
  }, []);

  // Effect to perform search when search term changes (with debounce)
  useEffect(() => {
    // Debounce search by 500ms
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
        setSearchError(null);
      }
    }, 500);

    // Cleanup timeout on searchTerm change or unmount
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]); // Only depend on searchTerm

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    searchError,
    invalidateCache,
  };
}
