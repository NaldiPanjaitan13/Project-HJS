import { useState, useEffect, useCallback } from 'react';
import api from '../services/api'; 

const useFetch = (url, dependencies = []) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        const controller = new AbortController();
        
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(url, {
                signal: controller.signal 
            });
            setData(response.data.data || response.data); 
        } catch (err) {
            if (err.name !== 'CanceledError' && err.code !== "ERR_CANCELED") {
                setError(err.response?.data?.message || err.message || 'Terjadi kesalahan');
                console.error("Fetch error:", err);
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
            }
        }

        return () => controller.abort();
    }, [url, ...dependencies]);

    useEffect(() => {
        const cleanup = fetchData();
        return () => {
            if (cleanup && typeof cleanup === 'function') cleanup();
        };
    }, [fetchData]);

    const refetch = () => fetchData();

    return { data, loading, error, refetch };
};

export default useFetch;