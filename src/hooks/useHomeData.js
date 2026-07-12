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
        
        // ✅ FIXED: Ensure subjects is always an array
        if (result && typeof result === 'object') {
          // If result.subjects is not an array, set it to empty array
          if (!Array.isArray(result.subjects)) {
            result.subjects = [];
          }
          // If result.subjects.items exists and is an array, use it
          if (result.subjects && Array.isArray(result.subjects.items)) {
            result.subjects = result.subjects.items;
          }
          // If result has items but not subjects, map it
          if (!result.subjects && Array.isArray(result.items)) {
            result.subjects = result.items;
          }
          // Ensure subjects is always an array
          if (!Array.isArray(result.subjects)) {
            result.subjects = [];
          }
        } else {
          // If result is not an object, set default
          setData({ subjects: [] });
          return;
        }
        
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch home data:', err);
        // ✅ Set default data on error
        setData({ subjects: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};