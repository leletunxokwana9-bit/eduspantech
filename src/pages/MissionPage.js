// src/pages/MissionPage.js
import React, { useEffect, useState } from "react";
import { Target, CheckCircle, GraduationCap, Smartphone, Shield, ArrowRight, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/api";
import "./MissionPage.css";

export default function MissionPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMission = async () => {
      try {
        // ✅ Fetching from the real database via your backend route
        const res = await fetch(`${API_BASE_URL}/mission`);
        const data = await res.json();
        
        if (data.success && data.content) {
          // Sort by ID so the order matches the database (9, 10, 11, etc.)
          const sorted = data.content.sort((a, b) => a.id - b.id);
          setContent(sorted);
        } else {
          console.error("Failed to load mission content:", data.error);
        }
      } catch (err) {
        console.error("Network error fetching mission:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMission();
  }, []);

  if (loading) {
    return (
      <div className="mission-loading">
        <div className="spinner"></div>
        <p>Loading our mission...</p>
      </div>
    );
  }

  // ✅ Helper to parse HTML from the database safely
  const renderHTML = (htmlString) => {
    return <div dangerouslySetInnerHTML={{ __html: htmlString }} />;
  };

  // ✅ Helper to parse bullet points that contain <strong> tags
  const renderBullets = (text) => {
    // Split by paragraphs
    return text.split('<br><br>').map((paragraph, index) => {
      if (paragraph.includes('• ')) {
        // Split by new lines or <br> to find the bullets
        const lines = paragraph.split(/<br>|\n/).filter(Boolean);
        const intro = lines[0].includes('• ') ? null : lines.shift();
        const bullets = lines.filter(l => l.includes('• '));

        return (
          <div key={index} className="mission-bullets-container">
            {intro && <p className="mission-intro-text" dangerouslySetInnerHTML={{ __html: intro }} />}
            <ul className="mission-bullets">
              {bullets.map((bullet, i) => {
                // Remove the bullet point character and split at the colon
                const cleanBullet = bullet.replace('• ', '');
                const colonIndex = cleanBullet.indexOf(':');
                
                if (colonIndex !== -1) {
                  const title = cleanBullet.substring(0, colonIndex);
                  const desc = cleanBullet.substring(colonIndex + 1);
                  return (
                    <li key={i}>
                      <CheckCircle size={18} className="bullet-icon" />
                      <span>
                        <strong dangerouslySetInnerHTML={{ __html: title }} />
                        <span dangerouslySetInnerHTML={{ __html: desc }} />
                      </span>
                    </li>
                  );
                }
                
                return (
                  <li key={i}>
                    <CheckCircle size={18} className="bullet-icon" />
                    <span dangerouslySetInnerHTML={{ __html: cleanBullet }} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      
      // Standard paragraph
      return <p key={index} dangerouslySetInnerHTML={{ __html: paragraph }} />;
    });
  };

  // Grouping data based on the database `section_identifier`
  const manifesto = content.find(c => c.section_identifier === 'manifesto');
  const intro = content.find(c => c.section_identifier === 'intro');
  const pipeline = content.find(c => c.section_identifier === 'pipeline');
  const phases = content.filter(c => c.ui_theme === 'phase-card');
  const pricing = content.find(c => c.section_identifier === 'pricing');
  const infrastructure = content.find(c => c.section_identifier === 'infrastructure');
  const whyChoose = content.find(c => c.section_identifier === 'why_choose');
  const socialImpact = content.find(c => c.section_identifier === 'social_impact');

  return (
    <div className="mission-page-container">
      {/* Background Decor */}
      <div className="bg-decor decor-1">∫</div>
      <div className="bg-decor decor-2">π</div>
      <div className="bg-decor decor-3">Σ</div>

      {/* Header */}
      <header className="mission-header">
        <div className="mission-badge">
          <Target size={16} /> Our Mission &amp; Vision
        </div>
        <h1>Bridging the Gap to <span className="highlight-text">Academic Success</span></h1>
        <p className="mission-subtitle">
          We prepare learners for university-level thinking long before they step onto campus, ensuring a smooth transition and a successful graduation.
        </p>
      </header>

      <div className="mission-content-wrapper">
        
        {/* 0. Manifesto Section */}
        {manifesto && (
          <section className="mission-section manifesto-section">
            <h2>{manifesto.title}</h2>
            <div className="text-content">
              {renderHTML(manifesto.content)}
            </div>
          </section>
        )}

        {/* 1. Intro Section */}
        {intro && (
          <section className="mission-section">
            <h2>{intro.title}</h2>
            <div className="text-content">
              {renderHTML(intro.content)}
            </div>
          </section>
        )}

        {/* 2. Pipeline Section */}
        {pipeline && (
          <section className="mission-section pipeline-section">
            <h2>{pipeline.title}</h2>
            <p className="pipeline-sub" dangerouslySetInnerHTML={{ __html: pipeline.content }} />

            <div className="phase-grid">
              {phases.map((phase, idx) => (
                <div key={idx} className="phase-card">
                  <div className="phase-number">0{idx + 1}</div>
                  <h3>{phase.title}</h3>
                  <div dangerouslySetInnerHTML={{ __html: phase.content }} className="phase-content" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Pricing Section */}
        {pricing && (
          <section className="mission-section highlight-box pricing-box">
            <div className="highlight-icon pricing-icon">
              <Target size={32} />
            </div>
            <div>
              <h2>{pricing.title}</h2>
              <div className="text-content">
                {renderHTML(pricing.content)}
              </div>
            </div>
          </section>
        )}

        {/* 4. Infrastructure Section */}
        {infrastructure && (
          <section className="mission-section infrastructure-section">
            <div className="infra-header">
              <Smartphone size={28} className="infra-icon" />
              <h2>{infrastructure.title}</h2>
            </div>
            <div className="text-content">
              {renderBullets(infrastructure.content)}
            </div>
          </section>
        )}

        {/* 5. Why Choose Section */}
        {whyChoose && (
          <section className="mission-section why-choose-section">
            <div className="why-header">
              <Shield size={28} className="why-icon" />
              <h2>{whyChoose.title}</h2>
            </div>
            <div className="text-content">
              {renderBullets(whyChoose.content)}
            </div>
          </section>
        )}

        {/* 6. Social Impact Section */}
        {socialImpact && (
          <section className="mission-section impact-section">
            <div className="why-header">
              <Heart size={28} className="impact-icon" />
              <h2>{socialImpact.title}</h2>
            </div>
            <div className="text-content">
              {renderHTML(socialImpact.content)}
            </div>
          </section>
        )}

        {/* CTA Footer */}
        <div className="mission-cta">
          <h3>Ready to secure your child's academic future?</h3>
          <p>Join EduSpantech today and let's build a pathway to success together.</p>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Get Started <ArrowRight size={18} />
            </button>
            <button className="btn-outline" onClick={() => navigate('/pricing')}>
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
