
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CalendarDays,
  BookOpen,
  Users,
  CheckCircle2,
  GraduationCap,
  ClipboardCheck
} from 'lucide-react';
import './ParentHome.css';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://eduspantech-backend.onrender.com/api';

const ParentHome = () => {
  const [heroImage, setHeroImage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchHeroImage = async () => {
      try {
        const response = await fetch(
          `${API_URL}/login-hero/active?type=parent`,
          { signal: controller.signal }
        );

        if (!response.ok) return;

        const result = await response.json();

        if (result?.image?.url) {
          setHeroImage(result.image.url);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Unable to load parent hero image:', error);
        }
      }
    };

    fetchHeroImage();

    return () => controller.abort();
  }, []);

  const features = [
    {
      icon: <TrendingUp size={23} />,
      title: 'Academic progress',
      description:
        "Follow your child's academic development and stay informed about their learning journey."
    },
    {
      icon: <ClipboardCheck size={23} />,
      title: 'Learning reports',
      description:
        "Access updates and reports that help you understand your child's performance."
    },
    {
      icon: <CalendarDays size={23} />,
      title: 'Tutoring sessions',
      description:
        'Keep track of tutoring sessions, schedules and important learning activities.'
    },
    {
      icon: <BookOpen size={23} />,
      title: 'Learning resources',
      description:
        'Stay connected to the resources and learning opportunities supporting your child.'
    }
  ];

  const benefits = [
    'Stay informed about your child’s academic progress',
    'Keep track of tutoring sessions and learning activities',
    'Access learning reports and important updates',
    'Remain actively involved in your child’s education'
  ];

  return (
    <main className="parent-home">

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="parent-hero">
        <div
          className={`parent-hero-visual ${heroImage ? 'has-image' : ''}`}
          style={
            heroImage
              ? { backgroundImage: `url(${heroImage})` }
              : {}
          }
        >
          <div className="parent-hero-overlay" />

          <div className="parent-hero-content">

            {/* HERO TEXT ONLY — NO RIGHT-SIDE CARD */}

            <div className="parent-hero-copy">

              <div className="parent-eyebrow">
                <ShieldCheck size={15} />
                THE PARENT &amp; GUARDIAN EXPERIENCE
              </div>

              <h1>
                Be part of your child's
                <span>learning journey.</span>
              </h1>

              <p className="parent-hero-description">
                Education is a partnership. Stay connected to your
                child's academic progress, manage tutoring sessions
                and support their success with EduSpantech.
              </p>

              <div className="parent-hero-actions">
                <Link
                  to="/parent-register"
                  className="parent-primary-btn"
                >
                  Get Started
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/parent-login"
                  className="parent-secondary-btn"
                >
                  Parent Login
                </Link>
              </div>

              <div className="parent-hero-trust">
                <CheckCircle2 size={16} />
                <span>
                  A dedicated space for parents and guardians
                </span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          INTRODUCTION
      ===================================================== */}

      <section className="parent-intro">

        <div className="parent-section-heading">
          <span className="parent-section-label">
            SUPPORTING YOUR CHILD
          </span>

          <h2>
            Everything you need to stay involved.
          </h2>

          <p>
            EduSpantech helps parents and guardians remain connected
            to the important aspects of their child's education.
          </p>
        </div>

        <div className="parent-feature-grid">
          {features.map((feature, index) => (
            <article
              className="parent-feature-card"
              key={feature.title}
            >
              <div className="parent-feature-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <span className="parent-feature-number">
                {String(index + 1).padStart(2, '0')}
              </span>
            </article>
          ))}
        </div>

      </section>

      {/* =====================================================
          PARTNERSHIP SECTION
      ===================================================== */}

      <section className="parent-partnership">

        <div className="parent-partnership-content">

          <div className="parent-partnership-icon">
            <Users size={25} />
          </div>

          <span className="parent-section-label">
            A STRONGER LEARNING PARTNERSHIP
          </span>

          <h2>
            Your involvement
            <span>makes a difference.</span>
          </h2>

          <p>
            A child's educational journey is strengthened when
            parents, tutors and learners work together. EduSpantech
            gives you a dedicated space to stay informed and
            participate in that journey.
          </p>

          <ul className="parent-benefits-list">
            {benefits.map((benefit) => (
              <li key={benefit}>
                <CheckCircle2 size={17} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/parent-register"
            className="parent-partnership-link"
          >
            Join EduSpantech
            <ArrowRight size={17} />
          </Link>

        </div>

        <div className="parent-partnership-visual">

          <div className="parent-partnership-decoration decoration-one" />
          <div className="parent-partnership-decoration decoration-two" />

          <div className="parent-partnership-illustration">

            <div className="parent-illustration-circle">
              <GraduationCap size={82} strokeWidth={1.4} />
            </div>

            <div className="parent-illustration-caption">
              <span>EDUSPANTECH</span>
              <strong>Supporting every learning journey</strong>
            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          FINAL CALL TO ACTION
      ===================================================== */}

      <section className="parent-final-cta">

        <div className="parent-final-cta-content">

          <span className="parent-section-label">
            YOUR CHILD'S FUTURE MATTERS
          </span>

          <h2>
            Be part of every
            learning milestone.
          </h2>

          <p>
            Create your parent or guardian account and stay connected
            to your child's educational progress with EduSpantech.
          </p>

          <div className="parent-final-actions">

            <Link
              to="/parent-register"
              className="parent-primary-btn"
            >
              Get Started
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/parent-login"
              className="parent-final-login"
            >
              Already have an account? Parent Login
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
};

export default ParentHome;
