/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "../utils/apiConnector";

interface UseCachedSearchOptions<T> {
  endpoint: string;
  searchFields: (item: T) => string[];
  initialFetch?: boolean;
  unmask?: boolean;
  filterFn?: (item: any) => boolean;
}

interface SearchCache<T> {
  data: T[];
  timestamp: number;
  isComplete: boolean; // whether we've fetched all data
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const INITIAL_SEARCH_LIMIT = 500;

export function useCachedSearch<T = any>(options: UseCachedSearchOptions<T>) {
  const { endpoint, searchFields, initialFetch = true, unmask = true, filterFn } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Cache stored in ref to persist across renders without causing re-renders
  const cacheRef = useRef<SearchCache<T> | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    const age = Date.now() - cacheRef.current.timestamp;
    return age < CACHE_DURATION;
  }, []);

  // Fetch data for search cache
  const fetchSearchCache = useCallback(
    async (limit?: number): Promise<T[]> => {
      try {
        const params = new URLSearchParams();
        if (unmask) params.append("unmask", "true");
        if (limit) params.append("limit", limit.toString());

        const queryString = params.toString();
        const url = `${endpoint}${queryString ? `?${queryString}` : ""}`;

        const response = await apiRequest<any>({
          method: "GET",
          url,
        });

        // apiRequest returns response directly, check for data property
        let data = response?.data ?? response ?? [];
        data = Array.isArray(data) ? data : [];
        // Apply filter function if provided
        if (filterFn && Array.isArray(data)) {
          data = data.filter(filterFn);
        }
        return data;
      } catch (error) {
        console.error("Failed to fetch search cache:", error);
        throw error;
      }
    },
    [endpoint, unmask]
  );

  // Perform search on cached data
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
        // Check if we have valid cache
        if (!isCacheValid()) {
          // Fetch initial 500 items
          const initialData = await fetchSearchCache(INITIAL_SEARCH_LIMIT);
          cacheRef.current = {
            data: initialData,
            timestamp: Date.now(),
            isComplete: false,
          };
        }

        // Check if aborted
        if (abortController.signal.aborted) return;

        // Search in cached data
        const cached = cacheRef.current!;
        const results = cached.data.filter((item) => {
          const fields = searchFields(item);
          return fields.some((field) =>
            field.toLowerCase().includes(trimmedTerm)
          );
        });

        // If we found results or cache is complete, return them
        if (results.length > 0 || cached.isComplete) {
          setSearchResults(results);
          setIsSearching(false);
          return;
        }

        // No results found in initial 500, fetch all data
        const allData = await fetchSearchCache();

        // Check if aborted
        if (abortController.signal.aborted) return;

        // Update cache with complete data
        cacheRef.current = {
          data: allData,
          timestamp: Date.now(),
          isComplete: true,
        };

        // Search in complete data
        const allResults = allData.filter((item) => {
          const fields = searchFields(item);
          return fields.some((field) =>
            field.toLowerCase().includes(trimmedTerm)
          );
        });

        setSearchResults(allResults);
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
    [fetchSearchCache, isCacheValid, searchFields]
  );

  // Invalidate cache (useful when data changes)
  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
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
  }, [searchTerm]); // Only depend on searchTerm, not performSearch

  // Pre-fetch cache on mount if initialFetch is true
  useEffect(() => {
    if (initialFetch && !cacheRef.current) {
      fetchSearchCache(INITIAL_SEARCH_LIMIT)
        .then((data) => {
          cacheRef.current = {
            data,
            timestamp: Date.now(),
            isComplete: false,
          };
        })
        .catch((error) => {
          console.error("Failed to pre-fetch search cache:", error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetch]); // Only depend on initialFetch, not fetchSearchCache

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
