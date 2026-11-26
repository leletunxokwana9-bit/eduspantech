
import React, { useEffect, useState } from 'react';
import {
  UserRound,
  UserRoundPen,
  Users,
  CreditCard,
  Receipt,
  Bell,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  LifeBuoy,
  Settings,
  ChevronRight,
  ChevronDown,
  Camera,
  Pencil,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  GraduationCap,
  BookOpen,
  Clock3,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  KeyRound,
  Smartphone,
  Monitor,
  LogOut,
  CircleHelp,
  FileText,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import './ParentProfile.css';

const navigation = [
  { id: 'overview', label: 'Overview', icon: UserRound },
  { id: 'personal', label: 'Personal Information', icon: UserRoundPen },
  { id: 'students', label: 'Linked Students', icon: Users },
  { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { id: 'subscriptions', label: 'Subscriptions', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Account Security', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy & Permissions', icon: LockKeyhole },
  { id: 'support', label: 'Support & Activity', icon: LifeBuoy }
];

const initialProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  relationship: 'Parent',
  language: 'English',
  country: 'South Africa',
  province: '',
  city: '',
  address: ''
};

const initialNotifications = {
  email: true,
  sms: false,
  inApp: true,
  paymentReminders: true,
  sessionReminders: true,
  progressUpdates: true,
  announcements: true,
  marketing: false
};

const formatSubscriptionDate = (dateValue) => {
  if (!dateValue) return 'Not available';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getStudentEducationType = (student, plan) => {
  const audience = String(plan?.audience || '').toLowerCase();

  if (
    audience === 'school' ||
    audience === 'highschool' ||
    audience === 'high_school'
  ) {
    return 'High School';
  }

  if (audience === 'tertiary' || audience === 'university') {
    return 'Tertiary';
  }

  const studentDetails = [
    student?.cohort,
    student?.gradeLevel,
    student?.grade
  ].filter(Boolean).join(' ').toLowerCase();

  if (
    studentDetails.includes('university') ||
    studentDetails.includes('tertiary') ||
    studentDetails.includes('college') ||
    studentDetails.includes('year')
  ) {
    return 'Tertiary';
  }

  if (
    studentDetails.includes('grade') ||
    studentDetails.includes('high school') ||
    studentDetails.includes('highschool')
  ) {
    return 'High School';
  }

  return 'Not specified';
};

const formatSubscriptionPrice = (subscription, plan) => {
  const currency = subscription?.currency || plan?.currency || 'ZAR';
  const billingCycle = String(
    subscription?.billing_cycle || 'monthly'
  ).toLowerCase();

  let amount;

  if (
    subscription?.amount !== null &&
    subscription?.amount !== undefined
  ) {
    amount = Number(subscription.amount);
  } else if (
    (billingCycle === 'annual' || billingCycle === 'yearly') &&
    plan?.annualPrice
  ) {
    amount = Number(plan.annualPrice);
  } else {
    amount = Number(plan?.price || 0);
  }

  if (!Number.isFinite(amount)) {
    return 'Price unavailable';
  }

  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const ParentProfile = ({
  profileData,
  linkedStudents = [],
  onSaveProfile,
  onSaveNotifications,
  onAddStudent,
  onManageBilling,
  onChangePassword,
  onSignOut
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  const [profile, setProfile] = useState({
    ...initialProfile,
    ...(profileData || {})
  });

  const [notifications, setNotifications] = useState(initialNotifications);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Subscription state.
  const [activeStudentId, setActiveStudentId] = useState(
    linkedStudents[0]?.id || ''
  );

  const [studentSubscription, setStudentSubscription] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState('');

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const displayName = fullName || 'Parent Account';

  const initials = fullName
    ? fullName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
    : 'PA';

  const activeStudent = linkedStudents.find(
    student => String(student.id) === String(activeStudentId)
  ) || linkedStudents[0] || null;

  // This ID changes when students load or when the parent selects another student.
  const selectedStudentId = activeStudent?.id || '';

  // Keep the selected student valid when linked students load or change.
  useEffect(() => {
    if (!linkedStudents.length) {
      setActiveStudentId('');
      setStudentSubscription(null);
      setSubscriptionError('');
      setSubscriptionLoading(false);
      return;
    }

    const selectedStudentExists = linkedStudents.some(
      student => String(student.id) === String(activeStudentId)
    );

    if (!selectedStudentExists) {
      setActiveStudentId(linkedStudents[0].id);
    }
  }, [linkedStudents, activeStudentId]);

  // FIXED: Fetch the selected student's subscription when the section opens
  // or when the selected student's ID becomes available or changes.
  useEffect(() => {
    if (activeSection !== 'subscriptions' || !selectedStudentId) {
      return undefined;
    }

    let cancelled = false;

    const fetchStudentSubscription = async () => {
      setSubscriptionLoading(true);
      setSubscriptionError('');
      setStudentSubscription(null);

      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          throw new Error(
            'Your session has expired. Please sign in again.'
          );
        }

        const endpoint =
          `${API_BASE_URL}/auth/parent/children/${selectedStudentId}/subscription`;

        console.log(
          '💳 Requesting subscription for student:',
          selectedStudentId
        );

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            'Unable to retrieve this student’s subscription.'
          );
        }

        if (!cancelled) {
          setStudentSubscription(
            data.hasSubscription ? data.subscription : null
          );

          console.log(
            '✅ Student subscription response:',
            data.hasSubscription
              ? 'Subscription found'
              : 'No active subscription found'
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to fetch student subscription:',
            error
          );

          setSubscriptionError(
            error.message ||
            'Unable to load subscription information.'
          );
        }
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    };

    fetchStudentSubscription();

    return () => {
      cancelled = true;
    };
  }, [activeSection, selectedStudentId]);

  const updateProfile = (field, value) => {
    setProfile(previous => ({
      ...previous,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      if (onSaveProfile) {
        await onSaveProfile(profile);
      }

      setIsEditing(false);
      setSaveMessage('Your profile changes have been saved.');
    } catch (error) {
      setSaveMessage(
        error.message ||
        'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = async (field) => {
    const updated = {
      ...notifications,
      [field]: !notifications[field]
    };

    setNotifications(updated);

    try {
      if (onSaveNotifications) {
        await onSaveNotifications(updated);
      }
    } catch (error) {
      setNotifications(previous => ({
        ...previous,
        [field]: !previous[field]
      }));

      setSaveMessage(
        'Unable to update notification preferences.'
      );
    }
  };

  const changeSection = (section) => {
    setActiveSection(section);
    setIsEditing(false);
    setSaveMessage('');
  };

  const renderInput = (label, field, type = 'text', icon = null) => (
    <div className="pp-form-field">
      <label htmlFor={`parent-${field}`}>{label}</label>

      <div className="pp-input-wrap">
        {icon && <span className="pp-input-icon">{icon}</span>}

        <input
          id={`parent-${field}`}
          type={type}
          value={profile[field] || ''}
          disabled={!isEditing}
          onChange={event => updateProfile(field, event.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    </div>
  );

  const renderSelect = (label, field, options) => (
    <div className="pp-form-field">
      <label htmlFor={`parent-${field}`}>{label}</label>

      <div className="pp-select-wrap">
        <select
          id={`parent-${field}`}
          value={profile[field] || ''}
          disabled={!isEditing}
          onChange={event => updateProfile(field, event.target.value)}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <ChevronDown size={16} />
      </div>
    </div>
  );

  const renderHeader = (eyebrow, title, description) => (
    <div className="pp-section-heading">
      <div>
        <span className="pp-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );

  const renderOverview = () => (
    <>
      {renderHeader(
        'ACCOUNT CENTRE',
        'Parent Profile',
        'Manage your personal details, linked students and account preferences.'
      )}

      <div className="pp-profile-hero">
        <div className="pp-profile-identity">
          <div className="pp-avatar-large">{initials}</div>

          <div>
            <span className="pp-account-label">PARENT ACCOUNT</span>
            <h2>{displayName}</h2>
            <p>{profile.email || 'Your email address'}</p>

            <div className="pp-verified-label">
              <CheckCircle2 size={14} />
              Account profile
            </div>
          </div>
        </div>

        <button
          className="pp-button pp-button-primary"
          onClick={() => changeSection('personal')}
        >
          <Pencil size={16} />
          Edit Profile
        </button>
      </div>

      <div className="pp-overview-grid">
        <div className="pp-stat-card">
          <div className="pp-stat-icon blue">
            <Users size={20} />
          </div>

          <div>
            <span>Linked Students</span>
            <strong>{linkedStudents.length}</strong>
            <small>Connected to your account</small>
          </div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon purple">
            <CreditCard size={20} />
          </div>

          <div>
            <span>Billing Profile</span>
            <strong>Manage</strong>
            <small>Payment and billing details</small>
          </div>
        </div>

        <div className="pp-stat-card">
          <div className="pp-stat-icon green">
            <ShieldCheck size={20} />
          </div>

          <div>
            <span>Account Security</span>
            <strong>Review</strong>
            <small>Keep your account protected</small>
          </div>
        </div>
      </div>

      <div className="pp-content-grid">
        <section className="pp-panel">
          <div className="pp-panel-heading">
            <div>
              <h3>Personal Information</h3>
              <p>Your account holder details</p>
            </div>

            <button
              className="pp-text-button"
              onClick={() => changeSection('personal')}
            >
              View details <ChevronRight size={15} />
            </button>
          </div>

          <div className="pp-detail-list">
            <div className="pp-detail-row">
              <span><UserRound size={17} /> Full name</span>
              <strong>{displayName}</strong>
            </div>

            <div className="pp-detail-row">
              <span><Mail size={17} /> Email address</span>
              <strong>{profile.email || 'Not provided'}</strong>
            </div>

            <div className="pp-detail-row">
              <span><Phone size={17} /> Phone number</span>
              <strong>{profile.phone || 'Not provided'}</strong>
            </div>

            <div className="pp-detail-row">
              <span><Globe size={17} /> Country</span>
              <strong>{profile.country || 'Not provided'}</strong>
            </div>
          </div>
        </section>

        <section className="pp-panel">
          <div className="pp-panel-heading">
            <div>
              <h3>Linked Students</h3>
              <p>Students connected to your account</p>
            </div>

            <button
              className="pp-text-button"
              onClick={() => changeSection('students')}
            >
              View all <ChevronRight size={15} />
            </button>
          </div>

          {linkedStudents.length > 0 ? (
            <div className="pp-student-list">
              {linkedStudents.slice(0, 3).map(student => (
                <div className="pp-student-row" key={student.id}>
                  <div className="pp-student-avatar">
                    {(student.name || 'S').charAt(0).toUpperCase()}
                  </div>

                  <div className="pp-student-info">
                    <strong>{student.name || 'Student'}</strong>
                    <span>{student.grade || 'Grade not provided'}</span>
                  </div>

                  <ChevronRight size={17} />
                </div>
              ))}
            </div>
          ) : (
            <div className="pp-empty-state compact">
              <Users size={25} />
              <strong>No linked students yet</strong>
              <p>Link a student account to manage their learning access.</p>

              <button
                className="pp-button pp-button-secondary"
                onClick={onAddStudent}
              >
                <Plus size={15} /> Link Student
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="pp-panel pp-shortcut-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Account Management</h3>
            <p>Quick access to important account settings</p>
          </div>
        </div>

        <div className="pp-shortcut-grid">
          <button onClick={() => changeSection('billing')}>
            <CreditCard size={20} />
            <span>
              <strong>Billing & Payments</strong>
              <small>Manage payment details</small>
            </span>
            <ChevronRight size={17} />
          </button>

          <button onClick={() => changeSection('notifications')}>
            <Bell size={20} />
            <span>
              <strong>Notifications</strong>
              <small>Choose what you receive</small>
            </span>
            <ChevronRight size={17} />
          </button>

          <button onClick={() => changeSection('security')}>
            <ShieldCheck size={20} />
            <span>
              <strong>Security</strong>
              <small>Password and account access</small>
            </span>
            <ChevronRight size={17} />
          </button>

          <button onClick={() => changeSection('privacy')}>
            <LockKeyhole size={20} />
            <span>
              <strong>Privacy & Permissions</strong>
              <small>Manage account permissions</small>
            </span>
            <ChevronRight size={17} />
          </button>
        </div>
      </section>
    </>
  );

  const renderPersonal = () => (
    <>
      {renderHeader(
        'YOUR ACCOUNT',
        'Personal Information',
        'Keep your contact and personal details up to date.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Profile Details</h3>
            <p>
              This information identifies the parent or guardian
              responsible for this account.
            </p>
          </div>

          {!isEditing && (
            <button
              className="pp-button pp-button-secondary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil size={15} /> Edit Details
            </button>
          )}
        </div>

        <div className="pp-profile-photo-row">
          <div className="pp-avatar-large">{initials}</div>

          <div>
            <strong>Profile photo</strong>
            <p>Profile photo uploads can be connected to your account storage.</p>
          </div>

          <button className="pp-button pp-button-secondary" disabled>
            <Camera size={15} /> Change Photo
          </button>
        </div>

        <div className="pp-form-grid">
          {renderInput('First name', 'firstName')}
          {renderInput('Last name', 'lastName')}
          {renderInput('Email address', 'email', 'email', <Mail size={16} />)}
          {renderInput('Mobile number', 'phone', 'tel', <Phone size={16} />)}

          {renderSelect('Relationship to student', 'relationship', [
            'Parent',
            'Mother',
            'Father',
            'Legal Guardian',
            'Other'
          ])}

          {renderSelect('Preferred language', 'language', [
            'English',
            'isiXhosa',
            'isiZulu',
            'Afrikaans',
            'Sesotho',
            'Setswana'
          ])}

          {renderSelect('Country', 'country', [
            'South Africa',
            'Other'
          ])}

          {renderInput('Province', 'province')}
          {renderInput('City / Town', 'city')}

          <div className="pp-form-field pp-full-width">
            <label htmlFor="parent-address">
              Residential / Billing Address
            </label>

            <textarea
              id="parent-address"
              value={profile.address || ''}
              disabled={!isEditing}
              onChange={event => updateProfile('address', event.target.value)}
              placeholder="Enter your address if required for billing"
              rows="3"
            />
          </div>
        </div>

        {isEditing && (
          <div className="pp-form-actions">
            <button
              className="pp-button pp-button-secondary"
              onClick={() => {
                setProfile({
                  ...initialProfile,
                  ...(profileData || {})
                });
                setIsEditing(false);
              }}
            >
              <X size={16} /> Cancel
            </button>

            <button
              className="pp-button pp-button-primary"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              <Check size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {saveMessage && (
          <div className="pp-inline-message">{saveMessage}</div>
        )}
      </section>

      <div className="pp-information-note">
        <ShieldCheck size={19} />

        <div>
          <strong>Your information is private</strong>
          <p>
            Your personal details are used for account management and
            relevant EduSpantech services. They are not displayed as a
            public profile.
          </p>
        </div>
      </div>
    </>
  );

  const renderStudents = () => (
    <>
      {renderHeader(
        'FAMILY MANAGEMENT',
        'Linked Students',
        'Manage the student accounts connected to your parent or guardian account.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Your Students</h3>
            <p>Student learning information belongs to each student's profile.</p>
          </div>

          <button
            className="pp-button pp-button-primary"
            onClick={onAddStudent}
          >
            <Plus size={16} /> Link Student
          </button>
        </div>

        {linkedStudents.length > 0 ? (
          <div className="pp-linked-student-grid">
            {linkedStudents.map(student => (
              <article
                className="pp-linked-student-card"
                key={student.id}
              >
                <div className="pp-linked-student-top">
                  <div className="pp-student-avatar large">
                    {(student.name || 'S').charAt(0).toUpperCase()}
                  </div>

                  <span className="pp-status-pill">Linked</span>
                </div>

                <h3>{student.name || 'Student'}</h3>
                <p>{student.grade || 'Grade not provided'}</p>

                <div className="pp-student-meta">
                  <span>
                    <GraduationCap size={15} />
                    {student.school || 'School not provided'}
                  </span>

                  <span>
                    <BookOpen size={15} />
                    Student account
                  </span>
                </div>

                <button
                  className="pp-button pp-button-secondary pp-button-full"
                  disabled
                >
                  View Student Profile <ChevronRight size={15} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="pp-empty-state">
            <div className="pp-empty-icon">
              <Users size={28} />
            </div>

            <h3>No students linked</h3>

            <p>
              Once a student is linked, their account will appear here.
              You can then manage the access you have been granted.
            </p>

            <button
              className="pp-button pp-button-primary"
              onClick={onAddStudent}
            >
              <Plus size={16} /> Link a Student
            </button>
          </div>
        )}
      </section>

      <div className="pp-information-note">
        <Shield size={19} />

        <div>
          <strong>Student access and permissions</strong>
          <p>
            Only information and actions authorised for your parent or
            guardian account should be available here. Detailed academic
            records remain part of the student's learning profile.
          </p>
        </div>
      </div>
    </>
  );

  const renderBilling = () => (
    <>
      {renderHeader(
        'PAYMENT MANAGEMENT',
        'Billing & Payments',
        'Manage payer information, payment methods and billing records.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Billing Profile</h3>
            <p>Details used for invoices and payment administration.</p>
          </div>

          <button
            className="pp-button pp-button-secondary"
            onClick={onManageBilling}
          >
            <Settings size={15} /> Manage Billing
          </button>
        </div>

        <div className="pp-billing-placeholder">
          <div className="pp-billing-icon">
            <CreditCard size={25} />
          </div>

          <div>
            <strong>Payment information</strong>
            <p>
              Your saved payment methods and billing details will appear
              here once connected to the payment provider.
            </p>
          </div>

          <span className="pp-status-pill neutral">Not connected</span>
        </div>

        <div className="pp-billing-details">
          <div className="pp-detail-row">
            <span>Billing account holder</span>
            <strong>{displayName}</strong>
          </div>

          <div className="pp-detail-row">
            <span>Billing email</span>
            <strong>{profile.email || 'Not provided'}</strong>
          </div>

          <div className="pp-detail-row">
            <span>Billing address</span>
            <strong>{profile.address || 'Not provided'}</strong>
          </div>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Invoices & Receipts</h3>
            <p>Access your payment records.</p>
          </div>
        </div>

        <div className="pp-empty-state compact">
          <Receipt size={25} />
          <strong>No billing records to display</strong>
          <p>Invoices and receipts will appear here when available.</p>
        </div>
      </section>

      <div className="pp-information-note">
        <LockKeyhole size={19} />

        <div>
          <strong>Secure payment handling</strong>
          <p>
            Payment card details should be collected and stored by the
            approved payment provider, not directly in the EduSpantech
            application database.
          </p>
        </div>
      </div>
    </>
  );

  const renderSubscriptions = () => {
    const subscription = studentSubscription;
    const plan = subscription?.plan || null;

    const features = Array.isArray(plan?.features)
      ? plan.features
      : [];

    const billingCycle = String(
      subscription?.billing_cycle || 'monthly'
    ).toLowerCase();

    const billingCycleLabel =
      billingCycle === 'annual' || billingCycle === 'yearly'
        ? 'Annual'
        : billingCycle === 'monthly'
          ? 'Monthly'
          : billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1);

    const educationType = getStudentEducationType(activeStudent, plan);

    const price = plan
      ? formatSubscriptionPrice(subscription, plan)
      : 'Not available';

    const nextBillingDate = subscription?.next_billing_date
      ? formatSubscriptionDate(subscription.next_billing_date)
      : 'Not available';

    const autoRenewLabel =
      typeof subscription?.auto_renew === 'boolean'
        ? subscription.auto_renew
          ? 'Enabled'
          : 'Disabled'
        : 'Not configured';

    const statusLabel = subscription?.status
      ? subscription.status.charAt(0).toUpperCase() +
        subscription.status.slice(1)
      : 'Not available';

    return (
      <>
        {renderHeader(
          'PLAN MANAGEMENT',
          'Subscriptions',
          'Review the plans and services associated with your linked students.'
        )}

        {linkedStudents.length === 0 ? (
          <>
            <section className="pp-panel">
              <div className="pp-panel-heading">
                <div>
                  <h3>Your Subscriptions</h3>
                  <p>Subscription information will be displayed here.</p>
                </div>
              </div>

              <div className="pp-empty-state">
                <div className="pp-empty-icon">
                  <Receipt size={28} />
                </div>

                <h3>No subscription information available</h3>

                <p>
                  When a subscription is purchased or assigned to your
                  account, you will be able to review its plan, billing
                  cycle, renewal date and status here.
                </p>
              </div>
            </section>

            <section className="pp-panel">
              <h3 className="pp-panel-title">
                Subscription management
              </h3>

              <div className="pp-detail-list">
                <div className="pp-detail-row">
                  <span>Plan details</span>
                  <strong>Available when subscribed</strong>
                </div>

                <div className="pp-detail-row">
                  <span>Next billing date</span>
                  <strong>Not available</strong>
                </div>

                <div className="pp-detail-row">
                  <span>Renewal preferences</span>
                  <strong>Not configured</strong>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="pp-panel">
            <div className="pp-panel-heading">
              <div>
                <h3>Your Subscriptions</h3>
                <p>
                  Select a linked student to view their individual
                  subscription and plan.
                </p>
              </div>

              <span className="pp-status-pill">
                {linkedStudents.length}{' '}
                {linkedStudents.length === 1 ? 'Student' : 'Students'}
              </span>
            </div>

            <div className="pp-subscription-controls">
              <label htmlFor="pp-subscription-student">
                Select student
              </label>

              <div className="pp-subscription-select-wrap">
                <Users size={17} />

                <select
                  id="pp-subscription-student"
                  className="pp-subscription-student-select"
                  value={activeStudentId || selectedStudentId}
                  onChange={event => {
                    setActiveStudentId(event.target.value);
                    setStudentSubscription(null);
                    setSubscriptionError('');
                  }}
                >
                  {linkedStudents.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name || 'Student'}
                      {student.grade ? ` — ${student.grade}` : ''}
                    </option>
                  ))}
                </select>

                <ChevronDown size={16} />
              </div>

              {activeStudent && (
                <div className="pp-subscription-student-summary">
                  <div className="pp-student-avatar large">
                    {(activeStudent.name || 'S').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>{activeStudent.name || 'Student'}</strong>

                    <span>
                      {activeStudent.gradeLevel ||
                        activeStudent.grade ||
                        activeStudent.cohort ||
                        'Education level not specified'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {subscriptionLoading ? (
              <div className="pp-subscription-loading">
                <div className="pp-loading-spinner" />

                <strong>Loading subscription details</strong>

                <p>
                  Retrieving the selected student's plan and billing
                  information.
                </p>
              </div>
            ) : subscriptionError ? (
              <div className="pp-subscription-error">
                <AlertCircle size={22} />

                <div>
                  <strong>Unable to load subscription</strong>
                  <p>{subscriptionError}</p>

                  <button
                    type="button"
                    className="pp-button pp-button-secondary"
                    onClick={() => {
                      setSubscriptionError('');
                      setStudentSubscription(null);

                      // Re-trigger the request by briefly leaving and
                      // reopening the section.
                      setActiveSection('overview');

                      window.setTimeout(() => {
                        setActiveSection('subscriptions');
                      }, 0);
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : !subscription ? (
              <div className="pp-empty-state">
                <div className="pp-empty-icon">
                  <Receipt size={28} />
                </div>

                <h3>No subscription information available</h3>

                <p>
                  When a subscription is purchased or assigned to this
                  student, you will be able to review its plan, billing
                  cycle, renewal date and status here.
                </p>
              </div>
            ) : (
              <div className="pp-subscription-content">
                {plan ? (
                  <>
                    <div className="pp-subscription-plan-card">
                      <div className="pp-subscription-plan-top">
                        <div>
                          <span className="pp-account-label">
                            ACTIVE STUDENT PLAN
                          </span>

                          <h2>
                            {plan.name || plan.tier || 'Subscription Plan'}
                          </h2>

                          <span className="pp-subscription-audience">
                            <GraduationCap size={15} />
                            {educationType}
                          </span>
                        </div>

                        <span className="pp-status-pill">
                          {statusLabel}
                        </span>
                      </div>

                      <div className="pp-subscription-price">
                        <strong>{price}</strong>

                        <span>
                          {billingCycle === 'annual' ||
                          billingCycle === 'yearly'
                            ? 'per year'
                            : billingCycle === 'monthly'
                              ? 'per month'
                              : `per ${billingCycle}`}
                        </span>
                      </div>

                      {plan.description && (
                        <p className="pp-subscription-description">
                          {plan.description}
                        </p>
                      )}

                      {plan.badge && (
                        <span className="pp-subscription-plan-badge">
                          {plan.badge}
                        </span>
                      )}

                      {features.length > 0 && (
                        <div className="pp-subscription-features">
                          <h4>What's included in this plan</h4>

                          <ul>
                            {features.map((feature, index) => (
                              <li key={`${index}-${feature}`}>
                                <CheckCircle2 size={16} />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.note && (
                        <div className="pp-subscription-note">
                          {plan.note}
                        </div>
                      )}
                    </div>

                    <section className="pp-subscription-management">
                      <h3 className="pp-panel-title">
                        Subscription management
                      </h3>

                      <div className="pp-detail-list">
                        <div className="pp-detail-row">
                          <span>
                            <GraduationCap size={16} />
                            Student category
                          </span>
                          <strong>{educationType}</strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <Receipt size={16} />
                            Plan
                          </span>
                          <strong>
                            {plan.name || plan.tier || 'Not available'}
                          </strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <CreditCard size={16} />
                            Billing cycle
                          </span>
                          <strong>{billingCycleLabel}</strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <CreditCard size={16} />
                            Subscription amount
                          </span>
                          <strong>{price}</strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <CalendarDays size={16} />
                            Subscription start date
                          </span>
                          <strong>
                            {formatSubscriptionDate(subscription.start_date)}
                          </strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <CalendarDays size={16} />
                            Next billing date
                          </span>
                          <strong>{nextBillingDate}</strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <CheckCircle2 size={16} />
                            Subscription status
                          </span>
                          <strong>{statusLabel}</strong>
                        </div>

                        <div className="pp-detail-row">
                          <span>
                            <Clock3 size={16} />
                            Automatic renewal
                          </span>
                          <strong>{autoRenewLabel}</strong>
                        </div>
                      </div>
                    </section>
                  </>
                ) : (
                  <div className="pp-subscription-error">
                    <AlertCircle size={22} />

                    <div>
                      <strong>Plan details unavailable</strong>

                      <p>
                        An active subscription was found for this student,
                        but its associated pricing plan could not be retrieved.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </>
    );
  };

  const notificationItems = [
    {
      title: 'Email notifications',
      description: 'Receive important account updates by email.',
      key: 'email'
    },
    {
      title: 'SMS notifications',
      description: 'Receive selected updates by text message.',
      key: 'sms'
    },
    {
      title: 'In-app notifications',
      description: 'Receive notifications inside EduSpantech.',
      key: 'inApp'
    },
    {
      title: 'Payment reminders',
      description: 'Reminders about upcoming payments and billing activity.',
      key: 'paymentReminders'
    },
    {
      title: 'Session reminders',
      description: 'Reminders about scheduled tutoring sessions.',
      key: 'sessionReminders'
    },
    {
      title: 'Learning progress updates',
      description: 'Updates when relevant student progress information is available.',
      key: 'progressUpdates'
    },
    {
      title: 'Platform announcements',
      description: 'Important news, new features and service announcements.',
      key: 'announcements'
    },
    {
      title: 'Product news and offers',
      description: 'Optional promotional information from EduSpantech.',
      key: 'marketing'
    }
  ];

  const renderNotifications = () => (
    <>
      {renderHeader(
        'COMMUNICATION PREFERENCES',
        'Notifications',
        'Choose how and when EduSpantech communicates with you.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Notification Preferences</h3>
            <p>You can change these preferences at any time.</p>
          </div>
        </div>

        <div className="pp-notification-list">
          {notificationItems.map(item => (
            <div className="pp-notification-row" key={item.key}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                className={`pp-toggle ${
                  notifications[item.key] ? 'active' : ''
                }`}
                onClick={() => handleNotificationChange(item.key)}
                aria-label={`Toggle ${item.title}`}
              >
                <span />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="pp-information-note">
        <Bell size={19} />

        <div>
          <strong>Important account communications</strong>
          <p>
            Some essential service, security or payment communications may
            still be sent when necessary, even if optional notification
            preferences are disabled.
          </p>
        </div>
      </div>
    </>
  );

  const renderSecurity = () => (
    <>
      {renderHeader(
        'ACCOUNT PROTECTION',
        'Account Security',
        'Manage your password and protect access to your parent account.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Password & Sign-in</h3>
            <p>Keep your login credentials secure.</p>
          </div>
        </div>

        <div className="pp-security-row">
          <div className="pp-security-icon">
            <KeyRound size={20} />
          </div>

          <div className="pp-security-copy">
            <strong>Password</strong>
            <p>
              Change your password regularly and avoid sharing it with others.
            </p>
          </div>

          <button
            className="pp-button pp-button-secondary"
            onClick={onChangePassword}
          >
            Change Password <ChevronRight size={15} />
          </button>
        </div>

        <div className="pp-security-row">
          <div className="pp-security-icon">
            <Smartphone size={20} />
          </div>

          <div className="pp-security-copy">
            <strong>Two-factor authentication</strong>
            <p>
              An additional verification step can help protect your account.
            </p>
          </div>

          <span className="pp-status-pill neutral">
            Check availability
          </span>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Account Access</h3>
            <p>
              Review the devices and sessions associated with your account.
            </p>
          </div>
        </div>

        <div className="pp-device-row">
          <div className="pp-security-icon">
            <Monitor size={20} />
          </div>

          <div>
            <strong>Current browser session</strong>
            <p>This device · Current session</p>
          </div>

          <span className="pp-status-pill">Active</span>
        </div>

        <p className="pp-muted-note">
          A complete device and session history requires backend session tracking.
        </p>
      </section>

      <section className="pp-danger-zone">
        <div>
          <h3>Sign out of your account</h3>
          <p>End your current parent account session on this device.</p>
        </div>

        <button
          className="pp-button pp-button-danger"
          onClick={onSignOut}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </section>
    </>
  );

  const renderPrivacy = () => (
    <>
      {renderHeader(
        'DATA & PERMISSIONS',
        'Privacy & Permissions',
        'Review how your account information and student access are managed.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Parent / Guardian Permissions</h3>
            <p>
              Manage the permissions associated with your linked student accounts.
            </p>
          </div>
        </div>

        <div className="pp-permission-row">
          <div className="pp-permission-icon">
            <Users size={19} />
          </div>

          <div>
            <strong>Linked student access</strong>
            <p>
              Access to student information depends on your verified
              relationship and assigned permissions.
            </p>
          </div>
        </div>

        <div className="pp-permission-row">
          <div className="pp-permission-icon">
            <CreditCard size={19} />
          </div>

          <div>
            <strong>Billing permissions</strong>
            <p>
              Being a guardian does not automatically mean you are the
              authorised payer. Billing access should be assigned separately.
            </p>
          </div>
        </div>

        <div className="pp-permission-row">
          <div className="pp-permission-icon">
            <ShieldCheck size={19} />
          </div>

          <div>
            <strong>Consent and privacy</strong>
            <p>
              Review the consents and permissions associated with your
              account and linked students.
            </p>
          </div>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Your Data</h3>
            <p>Requests relating to your personal information.</p>
          </div>
        </div>

        <div className="pp-privacy-action">
          <div>
            <strong>Request a copy of your data</strong>
            <p>
              Request access to personal information associated with your account.
            </p>
          </div>

          <button className="pp-button pp-button-secondary" disabled>
            <Download size={15} /> Request Data
          </button>
        </div>

        <div className="pp-privacy-action">
          <div>
            <strong>Account closure</strong>
            <p>
              Request the closure of your parent account, subject to
              applicable obligations and retention requirements.
            </p>
          </div>

          <button className="pp-button pp-button-danger" disabled>
            Request Closure
          </button>
        </div>
      </section>

      <div className="pp-information-note">
        <FileText size={19} />

        <div>
          <strong>Privacy policy and terms</strong>
          <p>
            Read the EduSpantech Privacy Policy and Terms of Service to
            understand how account information is handled.
          </p>
        </div>
      </div>
    </>
  );

  const renderSupport = () => (
    <>
      {renderHeader(
        'HELP & ACCOUNT HISTORY',
        'Support & Activity',
        'Find assistance and review important account activity.'
      )}

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Parent Support</h3>
            <p>Get help with your account and parent services.</p>
          </div>
        </div>

        <div className="pp-support-card">
          <div className="pp-support-icon">
            <CircleHelp size={24} />
          </div>

          <div>
            <strong>Parent Help Centre</strong>
            <p>
              Find answers about parent accounts, linked students, billing,
              subscriptions and notifications.
            </p>
          </div>

          <button className="pp-button pp-button-secondary" disabled>
            Open Help Centre <ExternalLink size={14} />
          </button>
        </div>

        <div className="pp-support-card">
          <div className="pp-support-icon">
            <LifeBuoy size={24} />
          </div>

          <div>
            <strong>Contact Support</strong>
            <p>
              Contact the EduSpantech support team if you need assistance.
            </p>
          </div>

          <button className="pp-button pp-button-secondary" disabled>
            Get Support <ChevronRight size={15} />
          </button>
        </div>
      </section>

      <section className="pp-panel">
        <div className="pp-panel-heading">
          <div>
            <h3>Account Activity</h3>
            <p>Important activity associated with your parent account.</p>
          </div>
        </div>

        <div className="pp-empty-state compact">
          <Clock3 size={25} />
          <strong>No activity history available</strong>
          <p>
            Account activity will appear here when activity logging is enabled.
          </p>
        </div>
      </section>
    </>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonal();

      case 'students':
        return renderStudents();

      case 'billing':
        return renderBilling();

      case 'subscriptions':
        return renderSubscriptions();

      case 'notifications':
        return renderNotifications();

      case 'security':
        return renderSecurity();

      case 'privacy':
        return renderPrivacy();

      case 'support':
        return renderSupport();

      default:
        return renderOverview();
    }
  };

  return (
    <div className="parent-profile-page">
      <div className="pp-page-container">
        <div className="pp-breadcrumb">
          <span>Parent Portal</span>
          <ChevronRight size={14} />
          <strong>My Profile</strong>
        </div>

        <div className="pp-layout">
          <aside className="pp-sidebar">
            <div className="pp-sidebar-account">
              <div className="pp-avatar-small">{initials}</div>

              <div>
                <strong>{displayName}</strong>
                <span>Parent Account</span>
              </div>
            </div>

            <div className="pp-sidebar-label">
              ACCOUNT SETTINGS
            </div>

            <nav
              className="pp-sidebar-nav"
              aria-label="Parent profile sections"
            >
              {navigation.map(item => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    className={`pp-nav-item ${
                      activeSection === item.id ? 'active' : ''
                    }`}
                    onClick={() => changeSection(item.id)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>

                    {activeSection === item.id && (
                      <span className="pp-nav-active-mark" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="pp-sidebar-help">
              <div className="pp-sidebar-help-icon">
                <LifeBuoy size={18} />
              </div>

              <strong>Need assistance?</strong>
              <p>Visit the Parent Help Centre for guidance.</p>

              <button onClick={() => changeSection('support')}>
                Get Help <ChevronRight size={14} />
              </button>
            </div>
          </aside>

          <main className="pp-main-content">
            {renderActiveSection()}
          </main>
        </div>

        <footer className="pp-footer">
          <span>© {new Date().getFullYear()} EduSpantech</span>
          <span>Parent Account Centre</span>
        </footer>
      </div>
    </div>
  );
};

export default ParentProfile;
