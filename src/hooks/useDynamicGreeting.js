// src/hooks/useDynamicGreeting.js
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const useDynamicGreeting = (user, pageContext = 'dashboard') => {
  const [message, setMessage] = useState('Welcome to EduSpantech!');

  useEffect(() => {
    const fetchMessage = async () => {
      // 1. If it's the Home page (Guest)
      if (pageContext === 'home') {
        const { data } = await supabase
          .from('app_messages')
          .select('message')
          .eq('audience', 'guest')
          .eq('is_active', true);

        if (data && data.length > 0) {
          setMessage(data[Math.floor(Math.random() * data.length)].message);
        }
        return;
      }

      // 2. If it's the Dashboard (Logged in)
      if (!user) return;

      let audience = 'highschool'; 
      
      if (user.is_admin || user.is_super_admin) {
        audience = 'admin';
      } else if (user.is_tutor || user.role === 'tutor') {
        audience = 'tutor';
      } else if (user.cohort === 'UniversityFirstYear' || user.grade === 1 || user.grade === 2) {
        audience = 'tertiary';
      }

      try {
        // Fetch messages for their specific role + the 'all' category
        const { data, error } = await supabase
          .from('app_messages')
          .select('message')
          .in('audience', [audience, 'all']) 
          .eq('is_active', true);

        if (data && data.length > 0 && !error) {
          setMessage(data[Math.floor(Math.random() * data.length)].message);
        }
      } catch (err) {
        console.error('Failed to fetch greeting:', err);
      }
    };

    fetchMessage();
  }, [user, pageContext]);

  return message;
};