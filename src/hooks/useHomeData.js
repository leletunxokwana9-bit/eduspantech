// src/hooks/useHomeData.js
import { useState, useEffect } from 'react';
import { homeService } from '../services/homeService';

// Helper: Get default icon based on subject name
const getDefaultIcon = (name) => {
    if (!name) return '📚';
    const icons = {
        'Mathematics': '🔢',
        'Math': '🔢',
        'Physics': '⚛️',
        'Chemistry': '🧪',
        'Biology': '🧬',
        'Life Sci': '🧬',
        'Accounting': '📊',
        'Economics': '📈',
        'Business': '💼',
        'Statistics': '📉',
        'ECP': '📘'
    };
    for (const [key, icon] of Object.entries(icons)) {
        if (name.toLowerCase().includes(key.toLowerCase())) {
            return icon;
        }
    }
    return '📚';
};

// Helper: Get default color based on subject name
const getDefaultColor = (name) => {
    if (!name) return '#4f46e5';
    const colors = {
        'Mathematics': '#4f46e5',
        'Math': '#4f46e5',
        'Physics': '#06b6d4',
        'Chemistry': '#10b981',
        'Biology': '#22c55e',
        'Life Sci': '#22c55e',
        'Accounting': '#f59e0b',
        'Economics': '#8b5cf6',
        'Business': '#ec4899',
        'Statistics': '#14b8a6',
        'ECP': '#f97316'
    };
    for (const [key, color] of Object.entries(colors)) {
        if (name.toLowerCase().includes(key.toLowerCase())) {
            return color;
        }
    }
    return '#4f46e5';
};

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
        let subjectsArray = [];
        if (result && result.subjects) {
          if (Array.isArray(result.subjects)) {
            subjectsArray = result.subjects;
          } else if (Array.isArray(result.subjects.items)) {
            subjectsArray = result.subjects.items;
          }
        }
        
        // ✅ Map subjects with default values for display
        const mappedSubjects = subjectsArray.map(subject => ({
            id: subject.id,
            name: subject.name,
            description: subject.description || subject.code || 'No description',
            icon: subject.icon || getDefaultIcon(subject.name),
            color: subject.color || getDefaultColor(subject.name),
            tier: subject.tier || subject.year_level || 'TIER_1',
            display_order: subject.display_order || 0,
            is_active: subject.is_active !== undefined ? subject.is_active : true,
            // Preserve original fields
            code: subject.code,
            track: subject.track,
            semester: subject.semester,
            institution: subject.institution,
            year_level: subject.year_level,
            topics: subject.topics || []
        }));
        
        console.log('✅ Mapped subjects:', mappedSubjects);
        
        setData({
            ...result,
            subjects: mappedSubjects
        });
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