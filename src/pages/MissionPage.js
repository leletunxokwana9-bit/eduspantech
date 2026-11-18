
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import "./MissionPage.css";

export default function MissionPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

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
          throw new Error(`Unable to load mission content (${response.status})`);
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.content)) {
          throw new Error(data.error || "Invalid mission content response");
        }

        const sortedContent = [...data.content].sort(
          (a, b) => Number(a.id) - Number(b.id)
        );

        setContent(sortedContent);

      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Mission content error:", err);
          setError(err.message || "Unable to load mission content.");
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

  // Render rich content stored in the database.
  // Only use trusted, administrator-managed HTML content here.
  const renderHTML = (htmlString) => {
    if (!htmlString) return null;

    return (
      <div
        className="mission-rich-content"
        dangerouslySetInnerHTML={{ __html: htmlString }}
      />
    );
  };

  // Render database bullet points without decorative icons.
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
          <div key={index} className="mission-bullets-container">

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
                  const title = cleanBullet.substring(0, colonIndex);
                  const description = cleanBullet.substring(colonIndex + 1);

                  return (
                    <li key={bulletIndex}>
                      <div>
                        <strong
                          dangerouslySetInnerHTML={{ __html: title }}
                        />
                        <span
                          dangerouslySetInnerHTML={{ __html: description }}
                        />
                      </div>
                    </li>
                  );
                }

                return (
                  <li key={bulletIndex}>
                    <span
                      dangerouslySetInnerHTML={{ __html: cleanBullet }}
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

  // Database-driven sections
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

  if (loading) {
    return (
      <div className="mission-loading">
        <div className="mission-spinner"></div>
        <p>Loading our mission...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mission-error">
        <h2>Unable to load our mission</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="mission-page-container">

      {/* Page Header */}
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
          We prepare learners for university-level thinking long before
          they step onto campus, ensuring a smooth transition and a
          successful graduation.
        </p>

      </header>

      <div className="mission-content-wrapper">

        {/* Manifesto */}
        {manifesto && (
          <section className="mission-section manifesto-section">
            <div className="section-label">OUR BELIEF</div>

            <h2>{manifesto.title}</h2>

            <div className="text-content">
              {renderHTML(manifesto.content)}
            </div>
          </section>
        )}

        {/* Introduction */}
        {intro && (
          <section className="mission-section intro-section">
            <div className="section-label">WHO WE ARE</div>

            <h2>{intro.title}</h2>

            <div className="text-content">
              {renderHTML(intro.content)}
            </div>
          </section>
        )}

        {/* Education Pipeline */}
        {pipeline && (
          <section className="mission-section pipeline-section">
            <div className="section-label">THE LEARNING JOURNEY</div>

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

        {/* Pricing */}
        {pricing && (
          <section className="mission-section pricing-box">
            <div className="section-label">ACCESSIBLE EDUCATION</div>

            <h2>{pricing.title}</h2>

            <div className="text-content">
              {renderHTML(pricing.content)}
            </div>
          </section>
        )}

        {/* Infrastructure */}
        {infrastructure && (
          <section className="mission-section infrastructure-section">
            <div className="section-label">OUR PLATFORM</div>

            <h2>{infrastructure.title}</h2>

            <div className="text-content">
              {renderBullets(infrastructure.content)}
            </div>
          </section>
        )}

        {/* Why Choose EduSpantech */}
        {whyChoose && (
          <section className="mission-section why-choose-section">
            <div className="section-label">THE EDUSPANTECH DIFFERENCE</div>

            <h2>{whyChoose.title}</h2>

            <div className="text-content">
              {renderBullets(whyChoose.content)}
            </div>
          </section>
        )}

        {/* Social Impact */}
        {socialImpact && (
          <section className="mission-section impact-section">
            <div className="section-label">OUR BROADER IMPACT</div>

            <h2>{socialImpact.title}</h2>

            <div className="text-content">
              {renderHTML(socialImpact.content)}
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="mission-cta">

          <div className="section-label">
            BUILDING FUTURES TOGETHER
          </div>

          <h2>
            Ready to secure your child's academic future?
          </h2>

          <p>
            Join EduSpantech today and let's build a pathway to
            educational excellence together.
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
              View Pricing
            </button>
          </div>

        </section>

      </div>
    </main>
  );
}
