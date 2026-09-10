// src/pages/BecomeATutor.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorApplicationService } from '../services/tutorApplicationService';
import './BecomeATutor.css';

const SUBJECTS = [
  'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics',
  'Probability', 'Linear Algebra', 'Differential Equations',
  'Financial Mathematics', 'Discrete Mathematics', 'Physics', 'Chemistry'
];

const CURRICULA = ['CAPS', 'IEB', 'Cambridge', 'IB', 'A-Levels', 'GCSE', 'AP', 'Other'];
const GRADE_LEVELS = ['Grade 8-9', 'Grade 10-11', 'Grade 12 / Matric', 'University Year 1', 'University Year 2+'];
const SHIFTS = ['Asia-Pacific (08:00-15:00 SAST)', 'South Asian (12:00-19:30 SAST)', 'Africa-Europe (16:00-23:00 SAST)', 'Americas (21:00-04:00 SAST)'];
const LANGUAGES = ['English', 'Afrikaans', 'isiZulu', 'isiXhosa', 'Sesotho', 'Setswana', 'French', 'Portuguese'];
const CERTIFICATIONS = ['PGCE', 'SACE Registered', 'TEFL', 'TESOL', 'CELTA', 'Other teaching qualification'];

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Teaching' },
  { id: 3, label: 'Qualifications' },
  { id: 4, label: 'Files' },
  { id: 5, label: 'Video & Submit' }
];

const BecomeATutor = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const photoInputRef = useRef(null);
  const cvInputRef = useRef(null);
  const idInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const certInputRef = useRef(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    country: 'ZA',
    city: '',
    timezone: 'Africa/Johannesburg',
    nationality: '',
    id_number: '',
    languages: [],

    photo_url: '',
    bio_short: '',
    bio_long: '',
    linkedin_url: '',
    portfolio_url: '',
    years_experience: 0,
    hourly_rate: '',
    currency: 'ZAR',

    subjects: [],
    curricula: [],
    grade_levels: [],
    teaching_languages: [],
    preferred_shifts: [],

    highest_degree: '',
    institution: '',
    graduation_year: '',
    teaching_certifications: [],

    cv_url: '',
    id_document_url: '',
    qualification_docs: [],
    intro_video_url: '',
    intro_video_duration: 0,
    intro_video_thumbnail: '',

    has_criminal_record: false,
    consent_background_check: false,
    consent_terms: false
  });

  const toggleArray = (key, value) => {
    setForm(prev => {
      const arr = prev[key] || [];
      const has = arr.includes(value);
      return { ...prev, [key]: has ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  // ============================================
  // FILE UPLOADS
  // ============================================
  const handleUpload = async (file, folder, field, extra = {}) => {
    if (!file) return;
    setUploadProgress(`Uploading ${file.name}…`);
    try {
      const result = await tutorApplicationService.uploadFile({ file, folder });
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }
      if (field === 'qualification_docs') {
        setForm(prev => ({
          ...prev,
          qualification_docs: [...(prev.qualification_docs || []), result.url]
        }));
      } else {
        setForm(prev => ({ ...prev, [field]: result.url, ...extra }));
      }
      setUploadProgress('');
    } catch (err) {
      setUploadProgress('');
      setError(err.message || 'Upload failed');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'photos', 'photo_url');
  };

  const handleCvChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('CV must be a PDF');
        return;
      }
      handleUpload(file, 'cvs', 'cv_url');
    }
  };

  const handleIdChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'ids', 'id_document_url');
  };

  const handleCertChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file, 'certificates', 'qualification_docs');
  };

  const handleVideoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Duration check via HTMLVideoElement
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.src = URL.createObjectURL(file);
    videoEl.onloadedmetadata = async () => {
      URL.revokeObjectURL(videoEl.src);
      const duration = Math.round(videoEl.duration);
      if (duration > 600) {
        setError('Intro video must be 10 minutes or less');
        return;
      }
      // Thumbnail from video frame
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      videoEl.currentTime = 1;
      videoEl.onseeked = async () => {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const thumbData = canvas.toDataURL('image/jpeg', 0.7);
        await handleUpload(file, 'videos', 'intro_video_url', { intro_video_duration: duration });

        // Upload thumbnail as separate file
        const thumbBlob = await (await fetch(thumbData)).blob();
        const thumbFile = new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' });
        const thumbResult = await tutorApplicationService.uploadFile({
          file: thumbFile,
          folder: 'video-thumbnails'
        });
        if (thumbResult.success) {
          setForm(prev => ({ ...prev, intro_video_thumbnail: thumbResult.url }));
        }
      };
    };
  };

  // ============================================
  // VALIDATION + SUBMIT
  // ============================================
  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.full_name.trim()) return 'Full name is required';
      if (!form.email.trim()) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email';
    }
    if (step === 2) {
      if (form.subjects.length === 0) return 'Select at least one subject you can teach';
      if (!form.bio_short.trim()) return 'Short bio is required';
    }
    if (step === 3) {
      if (!form.highest_degree.trim()) return 'Highest degree is required';
    }
    if (step === 4) {
      if (!form.cv_url) return 'Please upload your CV (PDF)';
    }
    if (step === 5) {
      if (!form.consent_terms) return 'You must accept the terms to apply';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const back = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await tutorApplicationService.submit(form);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Submission failed');
      }
    } catch (e) {
      setError(e.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bat-container">
        <div className="bat-success">
          <div className="bat-success-icon">✅</div>
          <h2>Application received!</h2>
          <p>Thanks, <strong>{form.full_name}</strong>. Our team will review your application within <strong>3–5 business days</strong>.</p>
          <p>We'll contact you at <strong>{form.email}</strong>.</p>
          <button className="bat-btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bat-container">
      <div className="bat-hero">
        <h1>Become an EduSpantech Tutor</h1>
        <p>Join a network of world-class mathematics tutors delivering 24/7 learning across 9 AWS regions.</p>
      </div>

      <div className="bat-steps">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`bat-step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
            <div className="bat-step-num">{step > s.id ? '✓' : s.id}</div>
            <div className="bat-step-label">{s.label}</div>
            {i < STEPS.length - 1 && <div className="bat-step-line" />}
          </div>
        ))}
      </div>

      {error && <div className="bat-error">⚠️ {error}</div>}
      {uploadProgress && <div className="bat-progress">📤 {uploadProgress}</div>}

      <div className="bat-card">
        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <>
            <h2>Personal Details</h2>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div className="bat-form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
              </div>
            </div>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+27 12 345 6789" />
              </div>
              <div className="bat-form-group">
                <label>Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
              </div>
            </div>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>Country</label>
                <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="ZA" />
              </div>
              <div className="bat-form-group">
                <label>City</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Cape Town" />
              </div>
            </div>
            <div className="bat-form-group">
              <label>Nationality</label>
              <input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} placeholder="South African" />
            </div>
            <div className="bat-form-group">
              <label>Languages you speak</label>
              <div className="bat-chips">
                {LANGUAGES.map(l => (
                  <button
                    type="button"
                    key={l}
                    className={`bat-chip ${form.languages.includes(l) ? 'active' : ''}`}
                    onClick={() => toggleArray('languages', l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============ STEP 2 ============ */}
        {step === 2 && (
          <>
            <h2>Teaching Profile</h2>
            <div className="bat-form-group">
              <label>Subjects you can teach *</label>
              <div className="bat-chips">
                {SUBJECTS.map(s => (
                  <button
                    type="button"
                    key={s}
                    className={`bat-chip ${form.subjects.includes(s) ? 'active' : ''}`}
                    onClick={() => toggleArray('subjects', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bat-form-group">
              <label>Curricula you can teach</label>
              <div className="bat-chips">
                {CURRICULA.map(c => (
                  <button
                    type="button"
                    key={c}
                    className={`bat-chip ${form.curricula.includes(c) ? 'active' : ''}`}
                    onClick={() => toggleArray('curricula', c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="bat-form-group">
              <label>Grade levels</label>
              <div className="bat-chips">
                {GRADE_LEVELS.map(g => (
                  <button
                    type="button"
                    key={g}
                    className={`bat-chip ${form.grade_levels.includes(g) ? 'active' : ''}`}
                    onClick={() => toggleArray('grade_levels', g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="bat-form-group">
              <label>Preferred teaching shifts</label>
              <div className="bat-chips">
                {SHIFTS.map(s => (
                  <button
                    type="button"
                    key={s}
                    className={`bat-chip ${form.preferred_shifts.includes(s) ? 'active' : ''}`}
                    onClick={() => toggleArray('preferred_shifts', s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="bat-form-group">
              <label>Short bio (shown on your profile) *</label>
              <input
                value={form.bio_short}
                onChange={e => setForm({ ...form, bio_short: e.target.value })}
                placeholder="Passionate mathematics tutor with 5+ years experience…"
                maxLength={140}
              />
              <small>{form.bio_short.length}/140</small>
            </div>
            <div className="bat-form-group">
              <label>Full professional bio</label>
              <textarea
                rows={5}
                value={form.bio_long}
                onChange={e => setForm({ ...form, bio_long: e.target.value })}
                placeholder="Tell us about your teaching style, philosophy, and achievements…"
              />
            </div>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>Years of teaching experience</label>
                <input type="number" min="0" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="bat-form-group">
                <label>Hourly rate (ZAR)</label>
                <input type="number" min="0" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="250" />
              </div>
            </div>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>LinkedIn URL</label>
                <input value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="bat-form-group">
                <label>Portfolio / Website</label>
                <input value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://..." />
              </div>
            </div>
          </>
        )}

        {/* ============ STEP 3 ============ */}
        {step === 3 && (
          <>
            <h2>Qualifications</h2>
            <div className="bat-form-group">
              <label>Highest qualification *</label>
              <input value={form.highest_degree} onChange={e => setForm({ ...form, highest_degree: e.target.value })} placeholder="e.g., BSc Mathematics, PhD Physics" />
            </div>
            <div className="bat-form-row">
              <div className="bat-form-group">
                <label>Institution</label>
                <input value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder="University of Cape Town" />
              </div>
              <div className="bat-form-group">
                <label>Year of graduation</label>
                <input type="number" value={form.graduation_year} onChange={e => setForm({ ...form, graduation_year: e.target.value })} placeholder="2020" />
              </div>
            </div>
            <div className="bat-form-group">
              <label>Teaching certifications</label>
              <div className="bat-chips">
                {CERTIFICATIONS.map(c => (
                  <button
                    type="button"
                    key={c}
                    className={`bat-chip ${form.teaching_certifications.includes(c) ? 'active' : ''}`}
                    onClick={() => toggleArray('teaching_certifications', c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============ STEP 4 ============ */}
        {step === 4 && (
          <>
            <h2>Documents & Photo</h2>

            <div className="bat-upload-block">
              <label>Straight-face headshot *</label>
              <p className="bat-hint">Clear front-facing photo on a plain background. This appears on your public tutor profile.</p>
              <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
              <button type="button" className="bat-upload-btn" onClick={() => photoInputRef.current.click()}>
                📷 {form.photo_url ? 'Change photo' : 'Upload photo'}
              </button>
              {form.photo_url && (
                <div className="bat-preview">
                  <img src={form.photo_url} alt="preview" />
                  <span className="bat-preview-ok">✓ Uploaded</span>
                </div>
              )}
            </div>

            <div className="bat-upload-block">
              <label>CV / Résumé (PDF) *</label>
              <input type="file" accept=".pdf" ref={cvInputRef} onChange={handleCvChange} style={{ display: 'none' }} />
              <button type="button" className="bat-upload-btn" onClick={() => cvInputRef.current.click()}>
                📄 {form.cv_url ? 'Replace CV' : 'Upload CV'}
              </button>
              {form.cv_url && <a href={form.cv_url} target="_blank" rel="noopener noreferrer" className="bat-file-ok">✓ CV uploaded — click to view</a>}
            </div>

            <div className="bat-upload-block">
              <label>ID / Passport scan</label>
              <input type="file" accept="image/*,.pdf" ref={idInputRef} onChange={handleIdChange} style={{ display: 'none' }} />
              <button type="button" className="bat-upload-btn" onClick={() => idInputRef.current.click()}>
                🆔 {form.id_document_url ? 'Replace ID' : 'Upload ID'}
              </button>
              {form.id_document_url && <span className="bat-file-ok">✓ ID uploaded</span>}
            </div>

            <div className="bat-upload-block">
              <label>Qualification certificates</label>
              <input type="file" accept="image/*,.pdf" ref={certInputRef} onChange={handleCertChange} style={{ display: 'none' }} />
              <button type="button" className="bat-upload-btn" onClick={() => certInputRef.current.click()}>
                🎓 Add certificate
              </button>
              {form.qualification_docs.length > 0 && (
                <ul className="bat-file-list">
                  {form.qualification_docs.map((u, i) => (
                    <li key={i}>
                      <a href={u} target="_blank" rel="noopener noreferrer">Certificate {i + 1}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ============ STEP 5 ============ */}
        {step === 5 && (
          <>
            <h2>Intro Video & Final Steps</h2>
            <div className="bat-upload-block">
              <label>Intro video (max 10 minutes) *</label>
              <p className="bat-hint">
                Record horizontally. Introduce yourself, your teaching style, and what students can expect.
                This is your chance to stand out — speak clearly, look at the camera.
              </p>
              <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoChange} style={{ display: 'none' }} />
              <button type="button" className="bat-upload-btn" onClick={() => videoInputRef.current.click()}>
                🎬 {form.intro_video_url ? 'Replace video' : 'Upload video'}
              </button>
              {form.intro_video_url && (
                <div className="bat-video-preview">
                  <video controls src={form.intro_video_url} poster={form.intro_video_thumbnail} />
                  <span className="bat-preview-ok">
                    ✓ {Math.floor(form.intro_video_duration / 60)}:{String(form.intro_video_duration % 60).padStart(2, '0')} uploaded
                  </span>
                </div>
              )}
            </div>

            <div className="bat-form-group bat-checkbox-group">
              <label className="bat-checkbox">
                <input
                  type="checkbox"
                  checked={form.consent_background_check}
                  onChange={e => setForm({ ...form, consent_background_check: e.target.checked })}
                />
                <span>I consent to a background check if required</span>
              </label>
              <label className="bat-checkbox">
                <input
                  type="checkbox"
                  checked={form.has_criminal_record}
                  onChange={e => setForm({ ...form, has_criminal_record: e.target.checked })}
                />
                <span>I have a criminal record (this does not automatically disqualify you)</span>
              </label>
              <label className="bat-checkbox">
                <input
                  type="checkbox"
                  checked={form.consent_terms}
                  onChange={e => setForm({ ...form, consent_terms: e.target.checked })}
                />
                <span>I confirm the information provided is accurate and I accept the Terms of Service and Tutor Code of Conduct *</span>
              </label>
            </div>
          </>
        )}

        <div className="bat-actions">
          {step > 1 && <button className="bat-btn-secondary" onClick={back} disabled={submitting}>← Back</button>}
          {step < STEPS.length && <button className="bat-btn-primary" onClick={next}>Continue →</button>}
          {step === STEPS.length && (
            <button className="bat-btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : '✅ Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BecomeATutor;