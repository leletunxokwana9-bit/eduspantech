// src/hooks/useHomeData.js
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
        console.log('📦 useHomeData - result:', result);
        console.log('📦 useHomeData - result.subjects:', result?.subjects);
        
        // ✅ If subjects is not an array but has items, fix it
        if (result && result.subjects && !Array.isArray(result.subjects)) {
          if (Array.isArray(result.subjects.items)) {
            result.subjects = result.subjects.items;
          } else if (Array.isArray(result.subjects)) {
            // already an array
          } else {
            result.subjects = [];
          }
        }
        
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