import { useState, useEffect } from 'react';
import { homeService } from '../services/homeService';

export const useHomeData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await homeService.getHomeData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};