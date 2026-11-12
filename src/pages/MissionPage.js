// src/pages/MissionPage.js
import React, { useEffect, useState } from "react";
import { Target, CheckCircle2, GraduationCap, Smartphone, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./MissionPage.css";

export default function MissionPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simulating fetching from the SQL database
  useEffect(() => {
    // In a real app, this would be: 
    // fetch('/api/mission').then(res => res.json()).then(data => setContent(data));
    
    const mockDatabaseData = [
      {
        section_identifier: 'intro',
        title: 'Bridging the High-Stakes Institutional Transition Phase',
        content: 'The transition from high school to university is the most critical hurdle in a learner’s academic journey. While the South African schooling system provides heavily guided support, tertiary institutions like UCT, Wits, and UP demand immediate independence, intense workloads, and advanced technical skills from day one. This sudden shift explains why many science and commerce students struggle or drop out during their first semester.\n\nWe bridge this gap. EduSpantech provides a continuous, supportive pipeline that prepares learners for university-level thinking long before they step onto campus, ensuring they transition smoothly and graduate successfully.',
        ui_theme: 'default'
      },
      {
        section_identifier: 'pipeline',
        title: 'Our 3-Phase Academic Pipeline',
        content: 'We systematically guide your child through every phase of their academic journey with a structured, step-by-step approach:',
        ui_theme: 'pipeline'
      },
      {
        section_identifier: 'phase_1',
        title: 'Phase 1 // Junior Foundation',
        content: 'Grades 8 & 9 Support. We enforce foundational numbers mastery and structured analytics habits early to prepare learners for high school tier and subject selections.',
        ui_theme: 'phase-card'
      },
      {
        section_identifier: 'phase_2',
        title: 'Phase 2 // High-Stakes Matric',
        content: 'Grades 10, 11 & Matric. We provide targeted stream specialisation across Science (3 subjects) or Commerce (3 subjects) optimized for maximum bachelor passes.',
        ui_theme: 'phase-card'
      },
      {
        section_identifier: 'phase_3',
        title: 'Phase 3 // Tertiary Mastery',
        content: 'Undergraduate Years 1–3. We provide aligned support that syncs directly with what is offered at these institutions, including Extended Curriculum Programmes (ECP). By tracking your child\'s specific campus subjects, we give them the exact help they need to pass their exams and graduate on time.',
        ui_theme: 'phase-card'
      },
      {
        section_identifier: 'public_universities',
        title: 'Why Choose EduSpantech & How We Support South Africa’s 26 Public Universities',
        content: 'South Africa’s public universities are facing a quiet crisis: up to 50% to 60% of first-year students drop out or fail their first term. While universities work tirelessly to accommodate students, they simply do not have the resources to hand-hold thousands of individuals through the "academic shock" of transitioning from high school.\n\nEduSpantech acts as a vital safety net. We support public higher education institutions by preparing, tutoring, and keeping students from falling through the academic cracks.',
        ui_theme: 'highlight'
      },
      {
        section_identifier: 'infrastructure',
        title: 'Overcoming the Infrastructure Barrier: Education for Everyone, Everywhere',
        content: 'Quality education shouldn\'t depend on where you live or what your school can afford.\n\n• No School Facilities? No Problem: Many brilliant learners in under-resourced areas attend schools that lack basic computer labs, science equipment, or modern learning tools. We bring a fully equipped academic ecosystem straight to them.\n• Zero Fiber or Wi-Fi Needed: You do not need expensive home fiber, permanent Wi-Fi setups, or costly computer equipment to escape educational inequality.\n• Just a Cellphone and a Sliver of Data: Our entire platform is engineered from the ground up to be hyper-accessible. A learner only needs a basic smartphone and a tiny fraction of normal mobile data to unlock full, high-definition access to our academic pipeline, no matter where they are in South Africa.',
        ui_theme: 'default'
      },
      {
        section_identifier: 'why_choose',
        title: 'Why Parents and Learners Choose EduSpantech',
        content: 'Families invest immense time and money into getting a child into university or any other post-matric institution, only to face a massive risk of first-year failure due to a lack of individual support. EduSpantech completely eliminates that risk.\n\n• Protects Financial Investment: A university dropout often leaves a family with significant debt and no qualification. We guard your tuition investment by securing passing grades from day one.\n• Reduces Academic Shock: High schools prioritize guided rote learning, but universities demand immediate self-directed study. We build those critical independent habits early in Phase 1 and 2.\n• Elite Academic Mentors: Learners aren\'t left to figure things out alone. They are guided by postgraduate specialists holding BSc, BCom, Honours, Master\'s, or PhD degrees who know exactly what it takes to pass.\n• Support until Graduation: Our systematic approach secures your investment in your child\'s future all the way to final graduation day.',
        ui_theme: 'default'
      }
    ];

    setTimeout(() => {
      setContent(mockDatabaseData);
      setLoading(false);
    }, 300); // Simulate network delay
  }, []);

  if (loading) {
    return (
      <div className="mission-loading">
        <div className="spinner"></div>
        <p>Loading our mission...</p>
      </div>
    );
  }

  // Helper to format text with bullet points nicely
  const renderText = (text) => {
    return text.split('\n\n').map((paragraph, index) => {
      if (paragraph.includes('• ')) {
        const [intro, ...bullets] = paragraph.split('\n');
        return (
          <div key={index} className="mission-bullets-container">
            {intro && <p className="mission-intro-text">{intro}</p>}
            <ul className="mission-bullets">
              {bullets.map((bullet, i) => {
                const [boldPart, ...rest] = bullet.replace('• ', '').split(':');
                return (
                  <li key={i}>
                    <CheckCircle2 size={18} className="bullet-icon" />
                    <span>
                      <strong>{boldPart}:</strong>{rest.join(':')}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      return <p key={index}>{paragraph}</p>;
    });
  };

  // Grouping data for the specific layout
  const intro = content.find(c => c.section_identifier === 'intro');
  const pipeline = content.find(c => c.section_identifier === 'pipeline');
  const phases = content.filter(c => c.ui_theme === 'phase-card');
  const highlight = content.find(c => c.section_identifier === 'public_universities');
  const infrastructure = content.find(c => c.section_identifier === 'infrastructure');
  const whyChoose = content.find(c => c.section_identifier === 'why_choose');

  return (
    <div className="mission-page-container">
      {/* Background Decor */}
      <div className="bg-decor decor-1">∫</div>
      <div className="bg-decor decor-2">π</div>
      <div className="bg-decor decor-3">Σ</div>

      {/* Header */}
      <header className="mission-header">
        <div className="mission-badge">
          <Target size={16} /> Our Mission & Vision
        </div>
        <h1>Bridging the Gap to <span className="highlight-text">Academic Success</span></h1>
        <p className="mission-subtitle">
          We prepare learners for university-level thinking long before they step onto campus, ensuring a smooth transition and a successful graduation.
        </p>
      </header>

      <div className="mission-content-wrapper">
        {/* 1. Intro Section */}
        {intro && (
          <section className="mission-section">
            <h2>{intro.title}</h2>
            <div className="text-content">
              {renderText(intro.content)}
            </div>
          </section>
        )}

        {/* 2. Pipeline Section */}
        {pipeline && (
          <section className="mission-section pipeline-section">
            <h2>{pipeline.title}</h2>
            <p className="pipeline-sub">{pipeline.content}</p>
            
            <div className="phase-grid">
              {phases.map((phase, idx) => (
                <div key={idx} className="phase-card">
                  <div className="phase-number">0{idx + 1}</div>
                  <h3>{phase.title}</h3>
                  <p>{phase.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Highlight Section (Public Universities) */}
        {highlight && (
          <section className="mission-section highlight-box">
            <div className="highlight-icon">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2>{highlight.title}</h2>
              <div className="text-content">
                {renderText(highlight.content)}
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
              {renderText(infrastructure.content)}
            </div>
          </section>
        )}

        {/* 5. Why Choose Section */}
        {whyChoose && (
          <section className="mission-section why-choose-section">
            <div className="why-header">
              <ShieldCheck size={28} className="why-icon" />
              <h2>{whyChoose.title}</h2>
            </div>
            <div className="text-content">
              {renderText(whyChoose.content)}
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