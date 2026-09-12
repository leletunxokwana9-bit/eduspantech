// src/pages/Notifications.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import './Notifications.css';

// ─────────────────────────────────────────────────────────────
// Icon + accent per notification type
// ─────────────────────────────────────────────────────────────
const TYPE_META = {
  warning:               { icon: 'alert-triangle', label: 'Warning',          accent: 'amber',   category: 'Account' },
  session_booked:        { icon: 'book',           label: 'Session Booked',   accent: 'indigo',  category: 'Sessions' },
  session_accepted:      { icon: 'check',          label: 'Session Accepted', accent: 'emerald', category: 'Sessions' },
  session_started:       { icon: 'play',           label: 'Session Started',  accent: 'emerald', category: 'Sessions' },
  session_ended:         { icon: 'check-circle',   label: 'Session Ended',    accent: 'slate',   category: 'Sessions' },
  session_cancelled:     { icon: 'x',              label: 'Session Cancelled',accent: 'rose',    category: 'Sessions' },
  payment_received:      { icon: 'credit-card',    label: 'Payment',          accent: 'emerald', category: 'Payments' },
  subscription_renewed:  { icon: 'refresh',        label: 'Subscription',     accent: 'indigo',  category: 'Billing' },
  subscription_expired:  { icon: 'alert-triangle', label: 'Subscription',     accent: 'amber',   category: 'Billing' },
  student_joined:        { icon: 'user-plus',      label: 'New Student',      accent: 'indigo',  category: 'Students' },
  tutor_assigned:        { icon: 'graduation-cap', label: 'Tutor Assigned',   accent: 'indigo',  category: 'Tutors' },
  new_tutor:             { icon: 'graduation-cap', label: 'New Tutor',        accent: 'indigo',  category: 'Tutors' },
  system:                { icon: 'info',           label: 'System',           accent: 'indigo',  category: 'System' },
  default:               { icon: 'bell',           label: 'Notification',     accent: 'indigo',  category: 'General' },
};

// ─────────────────────────────────────────────────────────────
// Inline SVG icons
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (name) {
    case 'alert-triangle': return <svg {...common}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'bell':           return <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
    case 'book':           return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case 'check':          return <svg {...common}><polyline points="20 6 9 17 4 12"/></svg>;
    case 'check-circle':   return <svg {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
    case 'play':           return <svg {...common}><polygon points="5 3 19 12 5 21 5 3"/></svg>;
    case 'x':              return <svg {...common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
    case 'credit-card':    return <svg {...common}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case 'refresh':        return <svg {...common}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
    case 'user-plus':      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
    case 'graduation-cap': return <svg {...common}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    case 'info':           return <svg {...common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
    case 'search':         return <svg {...common}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    case 'arrow-right':    return <svg {...common}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
    case 'clock':          return <svg {...common}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
    case 'inbox':          return <svg {...common}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
    default:               return <svg {...common}><circle cx="12" cy="12" r="10"/></svg>;
  }
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const formatRelative = (dateString) => {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatAbsolute = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const groupByDay = (list) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  list.forEach(n => {
    const d = new Date(n.created_at); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(n);
    else if (d.getTime() === yest.getTime()) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  });
  return groups;
};

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────
const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');       // all | unread | read
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      if (!token) { navigate('/login'); return; }

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else if (res.status === 404) {
        setNotifications([]);
      } else {
        setError('Failed to load notifications');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  const handleCardClick = (n) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) navigate(n.link);
    else if (n.metadata?.session_id) navigate(`/session/${n.metadata.session_id}`);
  };

  const filtered = useMemo(() => {
    let list = [...notifications];
    if (filter === 'unread') list = list.filter(n => !n.is_read);
    if (filter === 'read')   list = list.filter(n => n.is_read);
    if (categoryFilter !== 'all') {
      list = list.filter(n => (TYPE_META[n.type]?.category || 'General') === categoryFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.message || '').toLowerCase().includes(q) ||
        (n.metadata?.warned_by_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [notifications, filter, categoryFilter, query]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const categories = useMemo(() => {
    const set = new Set(['all']);
    notifications.forEach(n => set.add(TYPE_META[n.type]?.category || 'General'));
    return Array.from(set);
  }, [notifications]);

  return (
    <div className="nx-page">
      <div className="nx-shell">
        <header className="nx-header">
          <nav className="nx-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="nx-crumb-sep">/</span>
            <span className="nx-crumb-current">Notifications</span>
          </nav>

          <div className="nx-header-row">
            <div className="nx-title-block">
              <h1 className="nx-title">Notifications</h1>
              <p className="nx-subtitle">
                {unreadCount > 0
                  ? <>You have <strong>{unreadCount}</strong> unread notification{unreadCount > 1 ? 's' : ''}.</>
                  : 'You’re all caught up.'}
              </p>
            </div>

            <div className="nx-header-actions">
              <div className="nx-search">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Search notifications…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {unreadCount > 0 && (
                <button className="nx-btn nx-btn-ghost" onClick={markAllAsRead}>
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="nx-tabs-row">
            <div className="nx-tabs" role="tablist">
              {[
                { key: 'all',    label: 'All',    count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'read',   label: 'Read',   count: notifications.length - unreadCount },
              ].map(t => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={filter === t.key}
                  className={`nx-tab ${filter === t.key ? 'is-active' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  <span className="nx-tab-count">{t.count}</span>
                </button>
              ))}
            </div>

            <div className="nx-category-filter">
              {categories.map(c => (
                <button
                  key={c}
                  className={`nx-chip ${categoryFilter === c ? 'is-active' : ''}`}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c === 'all' ? 'All categories' : c}
                </button>
              ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="nx-skeleton-list">
            {[0,1,2,3].map(i => <div key={i} className="nx-skeleton-card" />)}
          </div>
        ) : error ? (
          <div className="nx-empty">
            <div className="nx-empty-icon"><Icon name="alert-triangle" size={28} /></div>
            <h3>Couldn’t load notifications</h3>
            <p>{error}</p>
            <button className="nx-btn nx-btn-primary" onClick={fetchNotifications}>Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="nx-empty">
            <div className="nx-empty-icon"><Icon name="inbox" size={28} /></div>
            <h3>No notifications</h3>
            <p>{query ? 'No results match your search.' : 'When something happens on your account, you’ll see it here.'}</p>
          </div>
        ) : (
          <div className="nx-groups">
            {Object.entries(groups).map(([label, items]) =>
              items.length === 0 ? null : (
                <section key={label} className="nx-group">
                  <div className="nx-group-head">
                    <span className="nx-group-label">{label}</span>
                    <span className="nx-group-count">{items.length}</span>
                  </div>
                  <div className="nx-list">
                    {items.map(n => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        onOpen={() => handleCardClick(n)}
                        onMarkRead={() => markAsRead(n.id)}
                      />
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────
const NotificationCard = ({ notification, onOpen, onMarkRead }) => {
  const meta = TYPE_META[notification.type] || TYPE_META.default;
  const m = notification.metadata || {};
  const isWarning = notification.type === 'warning';

  const actorName =
    m.warned_by_name ||
    m.tutor_name ||
    m.student_name ||
    m.sender_name ||
    null;

  return (
    <article
      className={`nx-card accent-${meta.accent} ${!notification.is_read ? 'is-unread' : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
    >
      <div className={`nx-card-icon accent-${meta.accent}`}>
        <Icon name={meta.icon} size={20} />
      </div>

      <div className="nx-card-body">
        <div className="nx-card-chips">
          <span className={`nx-chip-tag accent-${meta.accent}`}>{meta.label}</span>
          <span className="nx-chip-muted">{meta.category}</span>
          {isWarning && m.severity && (
            <span className={`nx-chip-sev sev-${m.severity}`}>{m.severity}</span>
          )}
          {!notification.is_read && <span className="nx-unread-dot" aria-label="Unread" />}
        </div>

        <h3 className="nx-card-title">{notification.title}</h3>
        <p className="nx-card-message">{notification.message}</p>

        {isWarning && (actorName || m.category) && (
          <div className="nx-meta-block">
            {actorName && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Issued by</span>
                <span className="nx-meta-val">
                  {actorName}
                  {m.warned_by_id && <span className="nx-meta-sub"> · Administration</span>}
                </span>
              </div>
            )}
            {m.category && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Reason</span>
                <span className="nx-meta-val">{m.category}</span>
              </div>
            )}
            {m.warned_at && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Issued at</span>
                <span className="nx-meta-val">{formatAbsolute(m.warned_at)}</span>
              </div>
            )}
          </div>
        )}

        {!isWarning && m.session_id && (
          <div className="nx-meta-block">
            {m.tutor_name && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Tutor</span>
                <span className="nx-meta-val">{m.tutor_name}</span>
              </div>
            )}
            {m.topic && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Topic</span>
                <span className="nx-meta-val">{m.topic}</span>
              </div>
            )}
            {m.date && (
              <div className="nx-meta-row">
                <span className="nx-meta-key">Session</span>
                <span className="nx-meta-val">{formatAbsolute(m.date)}</span>
              </div>
            )}
          </div>
        )}

        <div className="nx-card-footer">
          <div className="nx-time" title={formatAbsolute(notification.created_at)}>
            <Icon name="clock" size={13} />
            <span>{formatRelative(notification.created_at)}</span>
            <span className="nx-time-sep">·</span>
            <span className="nx-time-abs">{formatAbsolute(notification.created_at)}</span>
          </div>

          <div className="nx-card-actions" onClick={(e) => e.stopPropagation()}>
            {m.session_id && (
              <button className="nx-btn nx-btn-primary nx-btn-sm" onClick={onOpen}>
                View session <Icon name="arrow-right" size={14} />
              </button>
            )}
            {!notification.is_read && (
              <button className="nx-btn nx-btn-ghost nx-btn-sm" onClick={onMarkRead}>
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default Notifications;