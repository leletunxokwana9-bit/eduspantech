// src/pages/Admin/AdminPricing.js
import React, { useState, useEffect, useMemo } from 'react';
import './AdminPricing.css';

const API = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

const EMPTY_PLAN = {
  tier: '',
  name: '',
  price: 0,
  annual_price: 0,
  currency: 'ZAR',
  period: '/month',
  description: '',
  note: '',
  badge: '',
  color: 'bg-gray-500',
  features: [],
  popular: false,
  is_active: true,
  display_order: 99,
  display_price: ''
};

const COLOR_OPTIONS = [
  'bg-gray-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500'
];

const AdminPricing = () => {
  const [admin, setAdmin] = useState(null);
  const [adminLoaded, setAdminLoaded] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: View toggle state
  const [pricingAudience, setPricingAudience] = useState('school'); // 'school' | 'tertiary'

  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [featuresText, setFeaturesText] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ============================================
  // HELPERS
  // ============================================
  const showError = (msg) => {
    setErrorMessage(msg);
    setShowErrorPopup(true);
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setShowSuccessPopup(true);
  };

  // Filter plans based on the toggle
  const displayedPlans = useMemo(() => {
    return plans.filter(plan => {
      const isTertiary = plan.tier?.toUpperCase().startsWith('TERTIARY');
      return pricingAudience === 'tertiary' ? isTertiary : !isTertiary;
    });
  }, [plans, pricingAudience]);

  // ============================================
  // LOAD ADMIN + PLANS
  // ============================================
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const meRes = await fetch(`${API}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meRes.json();
        const user = meData?.user || meData?.data?.user || meData?.data || meData || null;
        setAdmin(user);
      } catch (err) {
        console.error('Failed to load admin:', err);
      } finally {
        setAdminLoaded(true);
      }
    };
    init();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${API}/admin/pricing/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401 || res.status === 403) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
      } else {
        showError(data.error || 'Failed to load plans');
      }
    } catch (err) {
      console.error('Fetch plans error:', err);
      showError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MODAL OPEN / CLOSE
  // ============================================
  const openAddModal = () => {
    setEditingPlan(null);
    // Auto-prefill tier code based on current view
    const prefix = pricingAudience === 'tertiary' ? 'TERTIARY_' : 'SCHOOL_';
    setForm({ ...EMPTY_PLAN, tier: prefix });
    setFeaturesText('');
    setShowModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setForm({
      tier: plan.tier || '',
      name: plan.name || '',
      price: Number(plan.price) || 0,
      annual_price: Number(plan.annual_price) || 0,
      currency: plan.currency || 'ZAR',
      period: plan.period || '/month',
      description: plan.description || '',
      note: plan.note || '',
      badge: plan.badge || '',
      color: plan.color || 'bg-gray-500',
      features: Array.isArray(plan.features) ? plan.features : [],
      popular: !!plan.popular,
      is_active: plan.is_active !== false,
      display_order: plan.display_order || 1,
      display_price: plan.display_price || ''
    });
    setFeaturesText(
      Array.isArray(plan.features) ? plan.features.join('\n') : ''
    );
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingPlan(null);
    setForm(EMPTY_PLAN);
    setFeaturesText('');
  };

  // ============================================
  // SAVE (CREATE / UPDATE)
  // ============================================
  const handleSave = async () => {
    if (!form.tier.trim()) return showError('Tier code is required (e.g., SCHOOL_SILVER)');
    if (!form.name.trim()) return showError('Name is required');
    if (form.price === '' || Number(form.price) < 0) return showError('Price must be 0 or more');

    const features = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      tier: form.tier.toUpperCase().trim(),
      name: form.name.trim(),
      price: Number(form.price),
      annual_price: Number(form.annual_price) || 0,
      display_order: Number(form.display_order) || 1,
      features,
      display_price: form.display_price || `R${form.price} per month`
    };

    try {
      setSaving(true);
      const token = localStorage.getItem('accessToken');
      const url = editingPlan
        ? `${API}/admin/pricing/plans/${editingPlan.id}`
        : `${API}/admin/pricing/plans`;
      const method = editingPlan ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchPlans();
        showSuccess(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
      } else {
        showError(data.error || 'Save failed');
      }
    } catch (err) {
      console.error('Save error:', err);
      showError('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // TOGGLE ACTIVE
  // ============================================
  const handleToggle = async (plan) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/admin/pricing/plans/${plan.id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPlans();
        showSuccess(`Plan ${plan.tier} ${plan.is_active ? 'deactivated' : 'activated'}`);
      } else {
        showError(data.error || 'Toggle failed');
      }
    } catch (err) {
      console.error('Toggle error:', err);
      showError('Network error');
    }
  };

  // ============================================
  // DELETE
  // ============================================
  const handleDeleteClick = (plan) => {
    setDeleteTarget(plan);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API}/admin/pricing/plans/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setShowDeletePopup(false);
        setDeleteTarget(null);
        fetchPlans();
        showSuccess('Plan deleted');
      } else {
        setShowDeletePopup(false);
        showError(data.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setShowDeletePopup(false);
      showError('Network error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================
  // GUARD — super-admin only (normalized)
  // ============================================
  const isSuperAdmin = (() => {
    if (!admin) return false;
    const candidates = [
      admin.is_super_admin,
      admin.isSuperAdmin,
      admin.super_admin,
      admin.is_admin,
      admin.role === 'super_admin',
      admin.role === 'admin'
    ];
    return candidates.some((raw) => {
      if (raw === true || raw === 1) return true;
      if (typeof raw === 'string') {
        const v = raw.toLowerCase();
        return v === '1' || v === 'true' || v === 'super_admin' || v === 'admin';
      }
      return false;
    });
  })();

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading || !adminLoaded || !admin) {
    return (
      <div className="ap-loading">
        <div className="ap-spinner"></div>
        <p>Loading pricing…</p>
      </div>
    );
  }

  // ============================================
  // BLOCKED STATE
  // ============================================
  if (!isSuperAdmin) {
    return (
      <div className="ap-blocked">
        <div className="ap-blocked-icon">🔒</div>
        <h2>Super-admin access required</h2>
        <p>Only the platform owner can manage pricing plans and their features.</p>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="ap-container">
      {/* Header */}
      <div className="ap-header">
        <div>
          <h1>💎 Pricing Plans</h1>
          <p className="ap-subtitle">
            Manage tiers, prices, features, and visibility. Changes go live instantly.
          </p>
        </div>
        <div className="ap-header-actions">
          <button className="ap-refresh" onClick={fetchPlans} title="Refresh">🔄</button>
          <button className="ap-add-btn" onClick={openAddModal}>➕ Add Plan</button>
        </div>
      </div>

      {/* NEW: Audience Toggle */}
      <div className="ap-audience-toggle-container">
        <div className="ap-audience-toggle">
          <button
            className={`ap-toggle-btn ${pricingAudience === 'school' ? 'active' : ''}`}
            onClick={() => setPricingAudience('school')}
          >
            🎒 School (Grades 8–12)
          </button>
          <button
            className={`ap-toggle-btn ${pricingAudience === 'tertiary' ? 'active' : ''}`}
            onClick={() => setPricingAudience('tertiary')}
          >
            🎓 Tertiary (University)
          </button>
        </div>
        <span className="ap-audience-hint">
          {pricingAudience === 'school' 
            ? 'Showing plans for high school learners.' 
            : 'Showing plans for university students.'}
        </span>
      </div>

      {/* Notice */}
      <div className="ap-notice">
        <span>⚠️</span>
        <div>
          <strong>Heads up:</strong> Changing a plan's price does <em>not</em> affect existing subscribers.
          Only new signups will see the new price. To stop new signups, deactivate the plan instead of deleting it.
        </div>
      </div>

      {/* Plans grid */}
      {displayedPlans.length === 0 ? (
        <div className="ap-empty">
          <span>📭</span>
          <h3>No {pricingAudience === 'school' ? 'School' : 'Tertiary'} plans yet</h3>
          <p>Click "Add Plan" to create your first {pricingAudience === 'school' ? 'school' : 'tertiary'} tier.</p>
        </div>
      ) : (
        <div className="ap-grid">
          {displayedPlans.map(plan => (
            <div
              key={plan.id}
              className={`ap-card ${plan.popular ? 'popular' : ''} ${!plan.is_active ? 'inactive' : ''}`}
            >
              <div className="ap-card-top">
                <div className="ap-card-badges">
                  {plan.badge && <span className="ap-badge">{plan.badge}</span>}
                  {plan.popular && <span className="ap-badge popular">⭐ Most Popular</span>}
                  {!plan.is_active && <span className="ap-badge inactive-badge">Inactive</span>}
                </div>
                <span className="ap-card-order">#{plan.display_order}</span>
              </div>

              <h3 className="ap-card-title">{plan.name}</h3>
              {plan.tier && <p className="ap-card-tier">{plan.tier}</p>}

              <div className="ap-card-price">
                R{Number(plan.price).toLocaleString()}
                <span>{plan.period || '/month'}</span>
              </div>

              {plan.annual_price > 0 && (
                <p className="ap-card-annual">
                  Annual: R{Number(plan.annual_price).toLocaleString()}
                </p>
              )}

              {plan.description && (
                <p className="ap-card-desc">{plan.description}</p>
              )}

              <div className="ap-card-features">
                <div className="ap-card-features-header">
                  {Array.isArray(plan.features) ? plan.features.length : 0} feature
                  {(plan.features?.length || 0) === 1 ? '' : 's'}
                </div>
                <ul>
                  {(plan.features || []).slice(0, 4).map((f, i) => (
                    <li key={i}>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: '#22c55e', flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.features?.length > 4 && (
                    <li className="ap-more">+{plan.features.length - 4} more…</li>
                  )}
                </ul>
              </div>

              {plan.note && (
                <p className="ap-card-note">{plan.note}</p>
              )}

              <div className="ap-card-actions">
                <button className="ap-btn ap-btn-edit" onClick={() => openEditModal(plan)}>
                  ✏️ Edit
                </button>
                <button
                  className="ap-btn ap-btn-toggle"
                  onClick={() => handleToggle(plan)}
                >
                  {plan.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                </button>
                <button className="ap-btn ap-btn-delete" onClick={() => handleDeleteClick(plan)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ EDIT / CREATE MODAL ============ */}
      {showModal && (
        <div className="ap-overlay" onClick={closeModal}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <button className="ap-modal-close" onClick={closeModal}>✕</button>
            <div className="ap-modal-header">
              <span className="ap-modal-icon">💎</span>
              <h3>{editingPlan ? 'Edit Pricing Plan' : 'Add Pricing Plan'}</h3>
              <p>{editingPlan ? `Updating ${editingPlan.tier}` : `Create a new tier for ${pricingAudience === 'school' ? 'School' : 'Tertiary'}`}</p>
            </div>

            <div className="ap-modal-body">
              <div className="ap-form-row">
                <div className="ap-form-group ap-half">
                  <label>Tier Code * (uppercase)</label>
                  <input
                    value={form.tier}
                    onChange={e => setForm({ ...form, tier: e.target.value.toUpperCase() })}
                    placeholder={pricingAudience === 'school' ? 'SCHOOL_SILVER' : 'TERTIARY_BASIC'}
                  />
                </div>
                <div className="ap-form-group ap-half">
                  <label>Display Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder={pricingAudience === 'school' ? 'Silver' : 'Basic'}
                  />
                </div>
              </div>

              <div className="ap-form-row">
                <div className="ap-form-group ap-half">
                  <label>Monthly Price (ZAR) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div className="ap-form-group ap-half">
                  <label>Annual Price (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.annual_price}
                    onChange={e => setForm({ ...form, annual_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="ap-form-row">
                <div className="ap-form-group ap-half">
                  <label>Badge</label>
                  <input
                    value={form.badge}
                    onChange={e => setForm({ ...form, badge: e.target.value })}
                    placeholder="Most Popular"
                  />
                </div>
                <div className="ap-form-group ap-half">
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={form.display_order}
                    onChange={e => setForm({ ...form, display_order: e.target.value })}
                  />
                </div>
              </div>

              <div className="ap-form-group">
                <label>Color</label>
                <div className="ap-color-row">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      type="button"
                      key={c}
                      className={`ap-color-chip ${c} ${form.color === c ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, color: c })}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="ap-form-group">
                <label>Short Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Perfect for self-study and archive access"
                />
              </div>

              <div className="ap-form-group">
                <label>Note (shown under CTA)</label>
                <input
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Best for self-study"
                />
              </div>

              <div className="ap-form-group">
                <label>Features (one per line)</label>
                <textarea
                  rows="7"
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  placeholder={
                    'On-demand whiteboard vector presentation playback\n' +
                    'Step-by-step mathematical proofs\n' +
                    'Localized static notes'
                  }
                />
                <small className="ap-form-hint">
                  Each line becomes a separate bullet on the pricing card. Empty lines are ignored.
                </small>
              </div>

              <div className="ap-form-row ap-checkbox-row">
                <label className="ap-checkbox">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={e => setForm({ ...form, popular: e.target.checked })}
                  />
                  <span>Mark as Most Popular</span>
                </label>
                <label className="ap-checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  />
                  <span>Active (visible to public)</span>
                </label>
              </div>
            </div>

            <div className="ap-modal-footer">
              <button className="ap-btn ap-btn-secondary" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              <button className="ap-btn ap-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving…' : (editingPlan ? '💾 Update Plan' : '➕ Create Plan')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE POPUP ============ */}
      {showDeletePopup && deleteTarget && (
        <div className="ap-overlay" onClick={() => !deleteLoading && setShowDeletePopup(false)}>
          <div className="ap-popup-small" onClick={e => e.stopPropagation()}>
            <div className="ap-popup-icon danger">🗑️</div>
            <h3>Delete {deleteTarget.tier}?</h3>
            <p>
              This cannot be undone. If the plan has active subscribers, deletion will be blocked.
              Deactivate it instead to hide from new signups.
            </p>
            <div className="ap-popup-actions">
              <button
                className="ap-btn ap-btn-secondary"
                onClick={() => setShowDeletePopup(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="ap-btn ap-btn-danger"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? '⏳ Deleting…' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ SUCCESS POPUP ============ */}
      {showSuccessPopup && (
        <div className="ap-overlay" onClick={() => setShowSuccessPopup(false)}>
          <div className="ap-popup-small" onClick={e => e.stopPropagation()}>
            <div className="ap-popup-icon success">✅</div>
            <h3>Success!</h3>
            <p>{successMessage}</p>
            <div className="ap-popup-actions">
              <button className="ap-btn ap-btn-primary" onClick={() => setShowSuccessPopup(false)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ERROR POPUP ============ */}
      {showErrorPopup && (
        <div className="ap-overlay" onClick={() => setShowErrorPopup(false)}>
          <div className="ap-popup-small" onClick={e => e.stopPropagation()}>
            <div className="ap-popup-icon danger">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{errorMessage}</p>
            <div className="ap-popup-actions">
              <button className="ap-btn ap-btn-secondary" onClick={() => setShowErrorPopup(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPricing;