
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  CalendarDays,
  BookOpen,
  ChartNoAxesCombined,
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

  // ============================================
  // LOAD PARENT HERO IMAGE
  // ============================================

  useEffect(() => {
    const controller = new AbortController();

    const loadHeroImage = async () => {
      try {
        const response = await fetch(
          `${API_URL}/login-hero/active?type=parent`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (result.success && result.image?.url) {
          setHeroImage(result.image.url);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Parent home hero image error:', error);
        }
      }
    };

    loadHeroImage();

    return () => controller.abort();
  }, []);

  const features = [
    {
      icon: <TrendingUp size={23} />,
      title: 'Track academic progress',
      description:
        'Follow your child’s learning journey and understand how they are progressing across their subjects.'
    },
    {
      icon: <ClipboardCheck size={23} />,
      title: 'View learning reports',
      description:
        'Access academic reports and important learning updates to stay informed about your child’s development.'
    },
    {
      icon: <CalendarDays size={23} />,
      title: 'Manage tutoring sessions',
      description:
        'Keep track of tutoring sessions and stay connected with your child’s learning schedule.'
    },
    {
      icon: <BookOpen size={23} />,
      title: 'Explore learning resources',
      description:
        'Discover educational resources that support learning, revision and academic confidence.'
    }
  ];

  const benefits = [
    'Stay informed about academic progress',
    'Keep track of tutoring sessions',
    'Access learning reports in one place',
    'Stay involved in your child’s education'
  ];

  return (
    <main className="parent-home">

      {/* ========================================
          HERO SECTION
      ======================================== */}

      <section className="parent-hero">

        <div
          className={`parent-hero-visual ${heroImage ? 'has-image' : ''}`}
          style={
            heroImage
              ? { backgroundImage: `url("${heroImage}")` }
              : undefined
          }
        >
          <div className="parent-hero-overlay"></div>

          <div className="parent-hero-content">

            <div className="parent-hero-copy">

              <div className="parent-eyebrow">
                <ShieldCheck size={16} />
                <span>THE PARENT & GUARDIAN EXPERIENCE</span>
              </div>

              <h1>
                Be part of your child's
                <span> learning journey.</span>
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
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/parent-login"
                  className="parent-secondary-btn"
                >
                  Parent Login
                </Link>

              </div>

              <div className="parent-hero-trust">
                <ShieldCheck size={17} />
                <span>A dedicated space for parents and guardians</span>
              </div>

            </div>

            <div className="parent-hero-card">

              <div className="parent-preview-top">
                <div className="parent-preview-icon">
                  <GraduationCap size={22} />
                </div>

                <div>
                  <span className="parent-preview-label">
                    YOUR CHILD'S EDUCATION
                  </span>
                  <strong>Stay connected</strong>
                </div>
              </div>

              <div className="parent-preview-divider"></div>

              <div className="parent-preview-item">
                <div className="parent-preview-item-icon progress">
                  <ChartNoAxesCombined size={19} />
                </div>

                <div>
                  <strong>Academic progress</strong>
                  <span>Follow learning development</span>
                </div>

                <CheckCircle2 size={18} className="parent-preview-check" />
              </div>

              <div className="parent-preview-item">
                <div className="parent-preview-item-icon sessions">
                  <CalendarDays size={19} />
                </div>

                <div>
                  <strong>Tutoring sessions</strong>
                  <span>Stay up to date with sessions</span>
                </div>

                <CheckCircle2 size={18} className="parent-preview-check" />
              </div>

              <div className="parent-preview-item">
                <div className="parent-preview-item-icon reports">
                  <ClipboardCheck size={19} />
                </div>

                <div>
                  <strong>Learning reports</strong>
                  <span>Keep informed about progress</span>
                </div>

                <CheckCircle2 size={18} className="parent-preview-check" />
              </div>

              <div className="parent-preview-footer">
                <ShieldCheck size={15} />
                <span>One place to support their success</span>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ========================================
          INTRODUCTION
      ======================================== */}

      <section className="parent-intro">

        <div className="parent-section-heading">
          <span className="parent-section-label">
            SUPPORT EVERY STEP
          </span>

          <h2>
            A better way to stay involved.
          </h2>

          <p>
            Your involvement matters. EduSpantech brings important
            aspects of your child's educational journey together
            so you can stay informed and involved.
          </p>
        </div>

        <div className="parent-feature-grid">

          {features.map((feature, index) => (
            <article
              className="parent-feature-card"
              key={index}
            >
              <div className="parent-feature-icon">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>

              <p>{feature.description}</p>

              <div className="parent-feature-number">
                0{index + 1}
              </div>
            </article>
          ))}

        </div>

      </section>

      {/* ========================================
          PARENT PARTNERSHIP SECTION
      ======================================== */}

      <section className="parent-partnership">

        <div className="parent-partnership-content">

          <div className="parent-partnership-icon">
            <Users size={25} />
          </div>

          <span className="parent-section-label">
            EDUCATION WORKS BETTER TOGETHER
          </span>

          <h2>
            Your support can make
            <span> a lasting difference.</span>
          </h2>

          <p>
            When parents, learners and educators work together,
            learners have a stronger support system. Be part of
            that partnership with EduSpantech.
          </p>

          <ul className="parent-benefits-list">
            {benefits.map((benefit, index) => (
              <li key={index}>
                <CheckCircle2 size={18} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/parent-register"
            className="parent-partnership-link"
          >
            Create your parent account
            <ArrowRight size={18} />
          </Link>

        </div>

        <div className="parent-partnership-visual">
          <div className="parent-partnership-decoration decoration-one"></div>
          <div className="parent-partnership-decoration decoration-two"></div>

          <div className="parent-partnership-illustration">
            <div className="parent-illustration-circle">
              <GraduationCap size={76} strokeWidth={1.3} />
            </div>

            <div className="parent-illustration-caption">
              <span>EduSpantech</span>
              <strong>Supporting every learner.</strong>
            </div>
          </div>
        </div>

      </section>

      {/* ========================================
          FINAL CTA
      ======================================== */}

      <section className="parent-final-cta">

        <div className="parent-final-cta-content">
          <span className="parent-section-label">
            YOUR CHILD'S JOURNEY STARTS HERE
          </span>

          <h2>
            Stay connected.
            <br />
            Support their success.
          </h2>

          <p>
            Create your parent account and become an active part
            of your child's learning experience.
          </p>

          <div className="parent-final-actions">

            <Link
              to="/parent-register"
              className="parent-primary-btn"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/parent-login"
              className="parent-final-login"
            >
              Already registered? Sign in
            </Link>

          </div>
        </div>

      </section>

    </main>
  );
};

export default ParentHome;
