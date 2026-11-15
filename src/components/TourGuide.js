// src/components/TourGuide.js
import React, { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate, useLocation } from 'react-router-dom';
import './TourGuide.css';

const TourGuide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [driverObj, setDriverObj] = useState(null);

  // ============================================
  // ALL TOUR STEPS DEFINED HERE
  // ============================================
  const allSteps = {
    // --- 1. DASHBOARD ---
    '/dashboard': [
      {
        element: '.greeting-section',
        popover: {
          title: 'Welcome to your Dashboard!',
          description: 'This is your personal home base. We tailor your daily greeting based on your role.',
          side: 'bottom', align: 'start'
        }
      },
      {
        element: '.stats-grid',
        popover: {
          title: 'Your Progress',
          description: 'Track your enrolled courses, hours spent, and badges earned here.',
          side: 'top', align: 'center'
        }
      },
      {
        element: '.quick-actions',
        popover: {
          title: 'Quick Actions',
          description: 'Jump straight into browsing subjects or finding a live tutor.',
          side: 'top', align: 'center',
          onNextClick: () => {
            // Smooth transition to Subjects page
            if (driverObj) driverObj.destroy();
            navigate('/subjects');
          }
        }
      }
    ],

    // --- 2. SUBJECTS ---
    '/subjects': [
      {
        element: '.subjects-hero',
        popover: {
          title: 'Explore Subjects',
          description: 'This is where you find all your learning materials. Filter by Grade or Category.',
          side: 'bottom', align: 'center'
        }
      },
      {
        element: '.subjects-filter-search-row',
        popover: {
          title: 'Powerful Search',
          description: 'Type in any topic, subject, or keyword to instantly find what you need.',
          side: 'bottom', align: 'start'
        }
      },
      {
        element: '.subjects-page-grid',
        popover: {
          title: 'Your Subject Cards',
          description: 'Click on any subject to view its specific topics, past papers, and resources.',
          side: 'top', align: 'center',
          onNextClick: () => {
            // Smooth transition to Tutors page
            if (driverObj) driverObj.destroy();
            navigate('/tutors');
          }
        }
      }
    ],

    // --- 3. TUTORS ---
    '/tutors': [
      {
        element: '.tutors-page-header',
        popover: {
          title: 'Meet Your Tutors',
          description: 'We have expert tutors online 24/7 across 4 global shifts.',
          side: 'bottom', align: 'center'
        }
      },
      {
        element: '.become-tutor-banner',
        popover: {
          title: 'Are you a Tutor?',
          description: 'If you want to teach and earn on EduSpantech, click here to apply.',
          side: 'bottom', align: 'center'
        }
      },
      {
        element: '.availability-banner',
        popover: {
          title: 'Global Coverage',
          description: 'Our tutors are grouped by shifts so you always have someone online, no matter your timezone.',
          side: 'bottom', align: 'center'
        }
      },
      {
        element: '.tutor-card',
        popover: {
          title: 'Tutor Profiles',
          description: 'Click on a tutor to view their intro video, bio, and subjects. You can book them directly from here!',
          side: 'bottom', align: 'center',
          onNextClick: () => {
            // Smooth transition to Pricing page
            if (driverObj) driverObj.destroy();
            navigate('/pricing');
          }
        }
      }
    ],

    // --- 4. PRICING ---
    '/pricing': [
      {
        element: '.audience-toggle-wrap',
        popover: {
          title: 'Choose Your Path',
          description: 'Are you a High School learner or a Tertiary student? Select your tier to see relevant plans.',
          side: 'bottom', align: 'center'
        }
      },
      {
        element: '.pricing-page-grid',
        popover: {
          title: 'Unlock Premium Features',
          description: 'Upgrade to Silver, Gold, or Platinum to access live sessions, past papers, and more.',
          side: 'top', align: 'center'
        }
      },
      {
        element: '.pricing-page-card.popular',
        popover: {
          title: 'Most Popular Plan',
          description: 'This is what most students choose. Click "Get Started" to subscribe via Paystack.',
          side: 'left', align: 'center',
          onNextClick: () => {
            // ✅ FIX: Save state BEFORE destroying, and trigger the finish logic
            localStorage.setItem('hasSeenTour', 'true');
            localStorage.removeItem('triggerTour');
            if (driverObj) driverObj.destroy();
            
            // Use a small timeout to ensure the DOM clears before the alert
            setTimeout(() => {
              alert("Tour complete! You're ready to conquer your studies.");
            }, 100);
          }
        }
      }
    ]
  };

  // ============================================
  // INITIALIZE & RUN TOUR
  // ============================================
  useEffect(() => {
    // 1. Check if they have seen the tour, OR if they just logged in
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    const triggerTour = localStorage.getItem('triggerTour');
    const currentSteps = allSteps[location.pathname];

    // 2. If they haven't seen it AND are on a valid page, start the tour
    if ((!hasSeenTour || triggerTour === 'true') && currentSteps) {
      
      // Delay slightly to ensure the page DOM is fully rendered before highlighting
      const timer = setTimeout(() => {
        
        // Remove the trigger flag so it doesn't start again if they refresh mid-tour
        if (triggerTour === 'true') {
          localStorage.removeItem('triggerTour');
        }

        const obj = driver({
          showProgress: true,
          animate: true,
          allowClose: true, // ✅ FIX: Allow closing via ESC or clicking overlay
          overlayColor: 'rgba(10, 14, 26, 0.85)', 
          nextBtnText: 'Next →',
          prevBtnText: '← Back',
          doneBtnText: 'Finish Tour',
          steps: currentSteps,
          onDestroyStarted: () => {
            // ✅ FIX: Ensure state is saved if they skip/close the tour early
            localStorage.setItem('hasSeenTour', 'true');
            localStorage.removeItem('triggerTour');
            obj.destroy();
          }
        });
        
        setDriverObj(obj);
        obj.drive();
      }, 800); // 800ms gives the page time to load and fade in

      return () => clearTimeout(timer);
    }
  }, [location.pathname, navigate]); // Re-run whenever the URL changes

  return null; // This component doesn't render anything visually itself
};

export default TourGuide;