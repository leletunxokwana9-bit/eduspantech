
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import { authService } from "../services/authService";
import "./MissionPage.css";

export default function MissionPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();

  // ============================================================
  // FETCH MISSION CONTENT
  // ============================================================
  useEffect(() => {
    const controller = new AbortController();

    const fetchMission = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/mission`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load mission content (${response.status})`
          );
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.content)) {
          throw new Error(
            data.error || "Invalid mission content response"
          );
        }

        const sortedContent = [...data.content].sort(
          (a, b) => Number(a.id) - Number(b.id)
        );

        setContent(sortedContent);

      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Mission content error:", err);
          setError(
            err.message || "Unable to load mission content."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMission();

    return () => controller.abort();
  }, []);

  // ============================================================
  // CHECK AUTHENTICATED USER
  // ============================================================
  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const user = await authService.getCurrentUser();

        if (isMounted) {
          setCurrentUser(user || null);
        }
      } catch (err) {
        console.error("Mission page authentication check:", err);

        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================
  // DETERMINE USER ROLE
  // ============================================================
  const getUserRole = (user) => {
    if (!user) return "visitor";

    const role = String(user.role || "")
      .trim()
      .toLowerCase();

    // Admin takes priority over all other account types.
    if (
      user.is_admin === true ||
      user.is_super_admin === true ||
      Boolean(user.admin_role) ||
      role === "admin" ||
      role === "super_admin"
    ) {
      return "admin";
    }

    // Parent account.
    if (
      role === "parent" ||
      role === "guardian"
    ) {
      return "parent";
    }

    // Tutor account.
    if (
      user.is_tutor === true ||
      role === "tutor" ||
      role === "instructor"
    ) {
      return "tutor";
    }

    // Student account.
    if (role === "student") {
      return "student";
    }

    return "unknown";
  };

  const userRole = getUserRole(currentUser);

  // ============================================================
  // RENDER RICH CONTENT STORED IN THE DATABASE
  // Only use trusted, administrator-managed HTML content here.
  // ============================================================
  const renderHTML = (htmlString) => {
    if (!htmlString) return null;

    return (
      <div
        className="mission-rich-content"
        dangerouslySetInnerHTML={{ __html: htmlString }}
      />
    );
  };

  // ============================================================
  // RENDER DATABASE BULLET POINTS
  // ============================================================
  const renderBullets = (text) => {
    if (!text) return null;

    const normalized = String(text)
      .replace(/<\/p>\s*<p[^>]*>/gi, "<br><br>")
      .replace(/<p[^>]*>/gi, "")
      .replace(/<\/p>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n");

    const paragraphs = normalized.split(/\n\s*\n/);

    return paragraphs.map((paragraph, index) => {
      const lines = paragraph
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

      const bulletLines = lines.filter(line =>
        /^(?:•|&bull;|&#8226;)\s*/i.test(line)
      );

      const introLines = lines.filter(line =>
        !/^(?:•|&bull;|&#8226;)\s*/i.test(line)
      );

      if (bulletLines.length > 0) {
        return (
          <div
            key={index}
            className="mission-bullets-container"
          >
            {introLines.length > 0 && (
              <div
                className="mission-intro-text"
                dangerouslySetInnerHTML={{
                  __html: introLines.join("<br />")
                }}
              />
            )}

            <ul className="mission-bullets">
              {bulletLines.map((bullet, bulletIndex) => {
                const cleanBullet = bullet.replace(
                  /^(?:•|&bull;|&#8226;)\s*/i,
                  ""
                );

                const colonIndex = cleanBullet.indexOf(":");

                if (colonIndex !== -1) {
                  const title = cleanBullet.substring(
                    0,
                    colonIndex
                  );

                  const description = cleanBullet.substring(
                    colonIndex + 1
                  );

                  return (
                    <li key={bulletIndex}>
                      <div>
                        <strong
                          dangerouslySetInnerHTML={{
                            __html: title
                          }}
                        />

                        <span
                          dangerouslySetInnerHTML={{
                            __html: description
                          }}
                        />
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={bulletIndex}>
                    <span
                      dangerouslySetInnerHTML={{
                        __html: cleanBullet
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      return (
        <p
          key={index}
          dangerouslySetInnerHTML={{
            __html: lines.join("<br />")
          }}
        />
      );
    });
  };

  // ============================================================
  // DATABASE-DRIVEN SECTIONS
  // ============================================================
  const manifesto = content.find(
    item => item.section_identifier === "manifesto"
  );

  const intro = content.find(
    item => item.section_identifier === "intro"
  );

  const pipeline = content.find(
    item => item.section_identifier === "pipeline"
  );

  const phases = content.filter(
    item => item.ui_theme === "phase-card"
  );

  const pricing = content.find(
    item => item.section_identifier === "pricing"
  );

  const infrastructure = content.find(
    item => item.section_identifier === "infrastructure"
  );

  const whyChoose = content.find(
    item => item.section_identifier === "why_choose"
  );

  const socialImpact = content.find(
    item => item.section_identifier === "social_impact"
  );

  // ============================================================
  // PAGE LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="mission-loading">
        <div className="mission-spinner"></div>
        <p>Loading our mission...</p>
      </div>
    );
  }

  // ============================================================
  // PAGE ERROR
  // ============================================================
  if (error) {
    return (
      <div className="mission-error">
        <h2>Unable to load our mission</h2>
        <p>{error}</p>

        <button
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // ============================================================
  // DYNAMIC CLOSING SECTION
  // ============================================================
  const renderMissionCTA = () => {
    // Do not expose the public promotional CTA while
    // the authentication check is still running.
    if (authLoading) {
      return (
        <section className="mission-cta mission-cta-loading">
          <div className="mission-cta-inner">
            <div className="mission-cta-loading-line"></div>
            <div className="mission-cta-loading-line short"></div>
          </div>
        </section>
      );
    }

    // PUBLIC VISITOR
    if (userRole === "visitor") {
      return (
        <section className="mission-cta mission-cta-public">
          <div className="section-label">
            BUILDING FUTURES TOGETHER
          </div>

          <h2>
            Every learner deserves the opportunity to excel.
          </h2>

          <p>
            From secondary school to higher education,
            EduSpantech supports your academic journey with
            quality learning resources, expert guidance and
            opportunities to reach your full potential.
          </p>

          <div className="mission-cta-divider"></div>

          <h3>
            Your next chapter starts here.
          </h3>

          <p className="mission-cta-secondary-text">
            Discover a learning experience designed to help
            you grow, achieve and move forward with confidence.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>

            <button
              className="btn-outline"
              onClick={() => navigate("/pricing")}
            >
              Explore Pricing
            </button>
          </div>
        </section>
      );
    }

    // LOGGED-IN STUDENT
    if (userRole === "student") {
      return (
        <section className="mission-cta mission-cta-student">
          <div className="section-label">
            YOUR JOURNEY CONTINUES
          </div>

          <h2>
            Your education. Your future.
          </h2>

          <p>
            Keep building your knowledge, strengthening your
            skills and working towards the goals that matter
            to you.
          </p>

          <div className="mission-cta-divider"></div>

          <h3>
            Keep moving forward.
          </h3>

          <p className="mission-cta-secondary-text">
            Your learning journey is already underway.
            Pick up where you left off and make your next
            achievement count.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Student Dashboard
            </button>
          </div>
        </section>
      );
    }

    // LOGGED-IN TUTOR
    if (userRole === "tutor") {
      return (
        <section className="mission-cta mission-cta-tutor">
          <div className="section-label">
            MAKING AN IMPACT
          </div>

          <h2>
            Inspiring growth. Shaping futures.
          </h2>

          <p>
            Your knowledge and dedication can make a
            meaningful difference in every student's
            academic journey.
          </p>

          <div className="mission-cta-divider"></div>

          <h3>
            Continue making a difference.
          </h3>

          <p className="mission-cta-secondary-text">
            Manage your teaching activities, support your
            students and continue contributing to a stronger
            learning community.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/tutor/dashboard")}
            >
              Go to Tutor Dashboard
            </button>
          </div>
        </section>
      );
    }

    // LOGGED-IN PARENT
    if (userRole === "parent") {
      return (
        <section className="mission-cta mission-cta-parent">
          <div className="section-label">
            SUPPORTING EVERY STEP
          </div>

          <h2>
            Your child's progress matters.
          </h2>

          <p>
            Education is a journey best supported together.
            Stay involved and help create the conditions
            for your child's continued growth.
          </p>

          <div className="mission-cta-divider"></div>

          <h3>
            Stay connected to their journey.
          </h3>

          <p className="mission-cta-secondary-text">
            Keep up with linked students, follow their
            learning journey and stay connected with their
            academic support.
          </p>

          <div className="cta-buttons">
            <button
              className="btn-primary"
              onClick={() => navigate("/parent/dashboard")}
            >
              Go to Parent Dashboard
            </button>
          </div>
        </section>
      );
    }

    // ADMIN
    if (userRole === "admin") {
      return (
        <section className="mission-cta mission-cta-admin">
          <div className="section-label">
            EDUSPANTECH
          </div>

          <h2>
            Education moves forward together.
          </h2>

          <p>
            Thank you for contributing to the EduSpantech
            learning community.
          </p>
        </section>
      );
    }

    // Authenticated account with an unrecognised role:
    // do not display public registration promotions.
    return (
      <section className="mission-cta mission-cta-authenticated">
        <div className="section-label">
          EDUSPANTECH
        </div>

        <h2>
          Your learning journey matters.
        </h2>

        <p>
          Continue exploring the opportunities available
          through EduSpantech.
        </p>
      </section>
    );
  };

  // ============================================================
  // MAIN PAGE
  // ============================================================
  return (
    <main className="mission-page-container">

      {/* PAGE HEADER */}
      <header className="mission-header">
        <span className="mission-eyebrow">
          OUR PURPOSE AND VISION
        </span>

        <h1>
          Bridging the Gap to{" "}
          <span className="highlight-text">
            Academic Success
          </span>
        </h1>

        <p className="mission-subtitle">
          We prepare learners for university-level thinking
          long before they step onto campus, ensuring a
          smooth transition and a successful graduation.
        </p>
      </header>

      <div className="mission-content-wrapper">

        {/* MANIFESTO */}
        {manifesto && (
          <section className="mission-section manifesto-section">
            <div className="section-label">
              OUR BELIEF
            </div>

            <h2>{manifesto.title}</h2>

            <div className="text-content">
              {renderHTML(manifesto.content)}
            </div>
          </section>
        )}

        {/* INTRODUCTION */}
        {intro && (
          <section className="mission-section intro-section">
            <div className="section-label">
              WHO WE ARE
            </div>

            <h2>{intro.title}</h2>

            <div className="text-content">
              {renderHTML(intro.content)}
            </div>
          </section>
        )}

        {/* EDUCATION PIPELINE */}
        {pipeline && (
          <section className="mission-section pipeline-section">
            <div className="section-label">
              THE LEARNING JOURNEY
            </div>

            <h2>{pipeline.title}</h2>

            <div
              className="pipeline-sub"
              dangerouslySetInnerHTML={{
                __html: pipeline.content || ""
              }}
            />

            {phases.length > 0 && (
              <div className="phase-grid">
                {phases.map((phase, index) => (
                  <article
                    key={phase.id}
                    className="phase-card"
                  >
                    <div className="phase-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <h3>{phase.title}</h3>

                    <div
                      className="phase-content"
                      dangerouslySetInnerHTML={{
                        __html: phase.content || ""
                      }}
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PRICING */}
        {pricing && (
          <section className="mission-section pricing-box">
            <div className="section-label">
              ACCESSIBLE EDUCATION
            </div>

            <h2>{pricing.title}</h2>

            <div className="text-content">
              {renderHTML(pricing.content)}
            </div>
          </section>
        )}

        {/* INFRASTRUCTURE */}
        {infrastructure && (
          <section className="mission-section infrastructure-section">
            <div className="section-label">
              OUR PLATFORM
            </div>

            <h2>{infrastructure.title}</h2>

            <div className="text-content">
              {renderBullets(infrastructure.content)}
            </div>
          </section>
        )}

        {/* WHY CHOOSE EDUSPANTECH */}
        {whyChoose && (
          <section className="mission-section why-choose-section">
            <div className="section-label">
              THE EDUSPANTECH DIFFERENCE
            </div>

            <h2>{whyChoose.title}</h2>

            <div className="text-content">
              {renderBullets(whyChoose.content)}
            </div>
          </section>
        )}

        {/* SOCIAL IMPACT */}
        {socialImpact && (
          <section className="mission-section impact-section">
            <div className="section-label">
              OUR BROADER IMPACT
            </div>

            <h2>{socialImpact.title}</h2>

            <div className="text-content">
              {renderHTML(socialImpact.content)}
            </div>
          </section>
        )}

        {/* DYNAMIC CALL TO ACTION */}
        {renderMissionCTA()}

      </div>
    </main>
  );
}
