import useSWR from 'swr';
import api from '../api';
import { cacheDB } from '../db';

interface FileListParams {
    folderId?: string | null;
    page?: number;
    limit?: number;
}

interface FileListResponse {
    files: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    cache_hint?: string;
}

// Fetcher with ETag support and IndexedDB caching
const fileListFetcher = async (url: string, params: FileListParams): Promise<FileListResponse> => {
    const cacheKey = `files-${params.folderId || 'root'}-${params.page || 1}-${params.limit || 50}`;
    
    // Try to get from IndexedDB first
    const cached = await cacheDB.getFileList(cacheKey);
    
    try {
        const headers: any = {};
        
        // Add ETag for conditional request
        if (cached?.etag) {
            headers['If-None-Match'] = cached.etag;
        }

        const response = await api.get(url, {
            params,
            headers,
            validateStatus: (status) => status === 200 || status === 304,
        });

        // 304 Not Modified - use cached data
        if (response.status === 304) {
            return cached.data;
        }

        // 200 OK - update cache
        const etag = response.headers['etag'];
        const data = response.data;
        
        await cacheDB.setFileList(cacheKey, data, etag);
        
        return data;
    } catch (error: any) {
        // If request fails and we have cached data, use it
        if (cached && !cached.isStale) {
            console.warn('Using cached data due to fetch error:', error);
            return cached.data;
        }
        throw error;
    }
};

export const useFiles = (params: FileListParams = {}) => {
    const { folderId, page = 1, limit = 50 } = params;
    
    const { data, error, isLoading, mutate, isValidating } = useSWR(
        ['/files', { folderId, page, limit }],
        ([url, params]) => fileListFetcher(url, params),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute
            focusThrottleInterval: 300000, // 5 minutes
            errorRetryCount: 3,
            errorRetryInterval: 5000,
            // Keep previous data while revalidating
            keepPreviousData: true,
        }
    );

    return {
        files: data?.files || [],
        pagination: data?.pagination,
        isLoading,
        isError: error,
        isValidating,
        mutate,
        refresh: () => mutate(),
    };
};

// Hook for infinite scroll / pagination
export const useInfiniteFiles = (params: FileListParams = {}) => {
    const { folderId, limit = 50 } = params;
    
    const getKey = (pageIndex: number, previousPageData: FileListResponse | null) => {
        // Reached the end
        if (previousPageData && !previousPageData.files.length) return null;
        
        // First page
        return ['/files', { folderId, page: pageIndex + 1, limit }];
    };

    // Note: useSWRInfinite would be used here, but since it's not in the current package.json,
    // we'll keep this as a placeholder for future implementation
    // For now, use the regular useFiles hook with manual page management
    
    return useFiles({ folderId, page: 1, limit });
};

// Prefetch next page
export const prefetchFiles = async (params: FileListParams) => {
    const { folderId, page = 1, limit = 50 } = params;
    const cacheKey = `files-${folderId || 'root'}-${page}-${limit}`;
    
    try {
        const response = await api.get('/files', { params: { folderId, page, limit } });
        const etag = response.headers['etag'];
        await cacheDB.setFileList(cacheKey, response.data, etag);
    } catch (error) {
        console.error('Prefetch error:', error);
    }
};