import React, { useState, useEffect, useRef } from 'react';
import './Statistics.css';

const Statistics = ({ statsData }) => {
  const [counts, setCounts] = useState({});
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !statsData) return;

    const animateNumber = (key, target) => {
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        if (step >= steps) {
          current = target;
          clearInterval(timer);
        }
        setCounts(prev => ({ ...prev, [key]: Math.round(current) }));
      }, duration / steps);

      return timer;
    };

    const timers = [];
    
    if (statsData.students) {
      timers.push(animateNumber('students', statsData.students));
    }
    if (statsData.tutors) {
      timers.push(animateNumber('tutors', statsData.tutors));
    }
    if (statsData.courses) {
      timers.push(animateNumber('courses', statsData.courses));
    }
    if (statsData.successRate) {
      timers.push(animateNumber('successRate', statsData.successRate));
    }
    if (statsData.countries) {
      timers.push(animateNumber('countries', statsData.countries));
    }
    if (statsData.schools) {
      timers.push(animateNumber('schools', statsData.schools));
    }

    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [isVisible, statsData]);

  if (!statsData) {
    return (
      <section className="statistics-section" ref={sectionRef}>
        <div className="container">
          <div className="stats-grid">
            <p>Loading statistics...</p>
          </div>
        </div>
      </section>
    );
  }

  const statItems = [
    { key: 'students', value: statsData.students, label: 'Students', suffix: '+', icon: '👨‍🎓' },
    { key: 'tutors', value: statsData.tutors, label: 'Expert Tutors', suffix: '+', icon: '👨‍🏫' },
    { key: 'courses', value: statsData.courses, label: 'Courses', suffix: '+', icon: '📚' },
    { key: 'successRate', value: statsData.successRate, label: 'Success Rate', suffix: '%', icon: '📈' },
    { key: 'countries', value: statsData.countries, label: 'Countries', suffix: '+', icon: '🌍' },
    { key: 'schools', value: statsData.schools, label: 'Schools', suffix: '+', icon: '🏫' }
  ];

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num;
  };

  return (
    <section className="statistics-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-grid">
          {statItems.map((item) => (
            <div key={item.key} className="stat-item">
              <div className="stat-icon">{item.icon}</div>
              <div className="stat-value">
                {formatNumber(counts[item.key] || 0)}
                {item.suffix}
              </div>
              <div className="stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Statistics;