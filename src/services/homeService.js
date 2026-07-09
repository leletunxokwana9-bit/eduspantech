// Service layer with mock data for development
// Replace with real API calls when backend is ready

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// ===== MOCK DATA - Only used in development =====
const MOCK_DATA = {
  hero: {
    badge: 'Global Mathematics Education',
    title: 'Education for the',
    highlight: 'love of your life',
    description: 'World-class mathematics tutoring for Grade 8 to 2nd-Year Tertiary students.',
    ctaPrimary: 'Get Started Free',
    ctaSecondary: 'Login to Account',
    trustBadges: ['No credit card required', '24/7 Access', 'Cancel anytime'],
    dashboardPreview: {
      sidebar: [
        { icon: '📊', label: 'Dashboard' },
        { icon: '📚', label: 'Courses' },
        { icon: '📈', label: 'Progress' },
        { icon: '⚙️', label: 'Settings' }
      ],
      welcome: 'Welcome back, Alex!',
      subtitle: 'Continue your learning journey',
      course: '📐 Algebra Fundamentals',
      chapter: 'Chapter 3: Linear Equations',
      progress: 70
    }
  },
  features: {
    title: 'Interactive Learning at Your Fingertips',
    subtitle: 'Everything you need to master mathematics',
    items: [
      { id: 1, icon: '📐', title: 'Interactive Whiteboard', description: 'Engaging lessons with interactive whiteboards and real-time collaboration' },
      { id: 2, icon: '👨‍🏫', title: 'Expert Tutors', description: 'Learn from qualified tutors with proven teaching experience' },
      { id: 3, icon: '🌍', title: 'Global Curriculum', description: 'Aligned with SA, US, UK, and international standards' },
      { id: 4, icon: '📊', title: 'Track Progress', description: 'Advanced analytics to monitor your learning journey' }
    ]
  },
  stats: {
    students: 50000,
    tutors: 2000,
    courses: 1000,
    successRate: 98,
    countries: 25,
    schools: 500
  },
  subjects: {
    title: 'Mathematics Subjects',
    subtitle: 'Master any topic with expert guidance and interactive tools',
    items: [
      { id: 1, name: 'Algebra', icon: '🔢', description: 'Master linear equations, polynomials, functions, and inequalities', color: '#4f46e5' },
      { id: 2, name: 'Geometry', icon: '📐', description: 'Explore shapes, angles, proofs, and spatial reasoning', color: '#7c3aed' },
      { id: 3, name: 'Calculus', icon: '∫', description: 'Understand derivatives, integrals, limits, and applications', color: '#ec4899' },
      { id: 4, name: 'Statistics', icon: '📊', description: 'Learn data analysis, probability, distributions, and inference', color: '#06b6d4' },
      { id: 5, name: 'Trigonometry', icon: '📐', description: 'Master sine, cosine, tangent, and their applications', color: '#f59e0b' },
      { id: 6, name: 'Matrices', icon: '🧮', description: 'Understand matrix operations, determinants, and linear algebra', color: '#10b981' },
      { id: 7, name: 'Functions', icon: '📈', description: 'Explore domain, range, transformations, and graphing', color: '#8b5cf6' },
      { id: 8, name: 'Financial Mathematics', icon: '💰', description: 'Learn interest, annuities, investments, and loans', color: '#ef4444' },
      { id: 9, name: 'Differential Equations', icon: '⚡', description: 'Master ordinary and partial differential equations', color: '#14b8a6' },
      { id: 10, name: 'Linear Algebra', icon: '🔲', description: 'Understand vectors, spaces, transformations, and eigenvalues', color: '#f97316' }
    ]
  },
  curriculum: {
    title: 'Global Curriculum',
    subtitle: 'Aligned with international standards across the world',
    items: [
      { id: 1, country: 'South Africa', flag: '🇿🇦', subjects: ['CAPS', 'IEB', 'AP Maths'], levels: ['Grade 8-12', 'Matric', 'University Prep'], description: 'National Senior Certificate (NSC) and Independent Examinations Board (IEB)' },
      { id: 2, country: 'USA', flag: '🇺🇸', subjects: ['Algebra 1', 'Geometry', 'Algebra 2', 'Pre-Calculus', 'AP Calculus'], levels: ['Middle School', 'High School', 'AP'], description: 'Common Core State Standards for Mathematics' },
      { id: 3, country: 'UK', flag: '🇬🇧', subjects: ['GCSE', 'A-Level', 'Further Maths'], levels: ['Key Stage 4', 'Key Stage 5', 'University Prep'], description: 'National Curriculum for England and Wales' },
      { id: 4, country: 'Australia', flag: '🇦🇺', subjects: ['VCE', 'HSC', 'Mathematical Methods'], levels: ['Years 7-10', 'Years 11-12', 'Tertiary Prep'], description: 'Australian Curriculum: Mathematics' },
      { id: 5, country: 'Singapore', flag: '🇸🇬', subjects: ['O-Level', 'A-Level', 'H2 Maths'], levels: ['Secondary 1-4', 'Junior College', 'University Prep'], description: 'Singapore Mathematics Framework (highly accelerated)' },
      { id: 6, country: 'Japan', flag: '🇯🇵', subjects: ['Sūgaku I', 'Sūgaku II', 'Sūgaku III'], levels: ['Junior High', 'Senior High', 'University Prep'], description: 'Japanese National Curriculum (rigorous and advanced)' },
      { id: 7, country: 'Brazil', flag: '🇧🇷', subjects: ['Ensino Fundamental', 'Ensino Médio'], levels: ['Years 8-9', 'Years 1-3'], description: 'Brazilian National Common Curriculum Base' }
    ]
  },
  tutors: {
    title: 'Our Expert Tutors',
    subtitle: '12 Centralised Tutors • 24/7 Global Coverage',
    shifts: [
      {
        id: 1,
        name: 'Asia-Pacific Axis',
        time: '08:00 – 15:00 SAST',
        hubs: ['Sydney (ap-southeast-2)', 'Tokyo (ap-northeast-1)'],
        tutors: [
          { id: 'A', name: 'Tutor A', tier: 'Tier 1', grades: 'Grades 8-9', time: '08:00 – 10:00 SAST', subjects: ['Algebra', 'Geometry'], image: 'https://i.pravatar.cc/150?img=11', bio: 'Expert in foundational mathematics' },
          { id: 'B', name: 'Tutor B', tier: 'Tier 2', grades: 'Grades 10-11', time: '10:30 – 12:30 SAST', subjects: ['Algebra', 'Trigonometry'], image: 'https://i.pravatar.cc/150?img=1', bio: 'Specializes in intermediate algebra' },
          { id: 'C', name: 'Tutor C', tier: 'Tier 3', grades: 'Grade 12 / Tertiary', time: '13:00 – 15:00 SAST', subjects: ['Calculus', 'Statistics'], image: 'https://i.pravatar.cc/150?img=8', bio: 'Advanced mathematics expert' }
        ]
      },
      {
        id: 2,
        name: 'South Asian / Indian Corridor',
        time: '12:00 – 19:30 SAST',
        hubs: ['Singapore (ap-southeast-1)', 'Mumbai (ap-south-1)'],
        tutors: [
          { id: 'D', name: 'Tutor D', tier: 'Tier 1', grades: 'Grades 8-9', time: '10:00 – 12:00 SAST', subjects: ['Geometry', 'Algebra'], image: 'https://i.pravatar.cc/150?img=5', bio: 'Making math fun and accessible' },
          { id: 'E', name: 'Tutor E', tier: 'Tier 2', grades: 'Grades 10-11', time: '12:30 – 14:30 SAST', subjects: ['Algebra', 'Functions'], image: 'https://i.pravatar.cc/150?img=6', bio: 'Expert in functions' },
          { id: 'F', name: 'Tutor F', tier: 'Tier 3', grades: 'Grade 12 / Tertiary', time: '15:00 – 17:00 SAST', subjects: ['Calculus', 'Linear Algebra'], image: 'https://i.pravatar.cc/150?img=7', bio: 'University-level specialist' }
        ]
      },
      {
        id: 3,
        name: 'Africa / Europe Core',
        time: '16:00 – 23:00 SAST',
        hubs: ['Cape Town (af-south-1)', 'Ireland (eu-west-1)'],
        tutors: [
          { id: 'G', name: 'Tutor G', tier: 'Tier 1', grades: 'Grades 8-9', time: '16:00 – 18:00 SAST', subjects: ['Algebra', 'Geometry'], image: 'https://i.pravatar.cc/150?img=9', bio: 'Building strong foundations' },
          { id: 'H', name: 'Tutor H', tier: 'Tier 2', grades: 'Grades 10-11', time: '18:30 – 20:30 SAST', subjects: ['Trigonometry', 'Statistics'], image: 'https://i.pravatar.cc/150?img=10', bio: 'Data analysis expert' },
          { id: 'I', name: 'Tutor I', tier: 'Tier 3', grades: 'Grade 12 / Tertiary', time: '21:00 – 23:00 SAST', subjects: ['Calculus', 'Differential Equations'], image: 'https://i.pravatar.cc/150?img=12', bio: 'Advanced calculus specialist' }
        ]
      },
      {
        id: 4,
        name: 'Pan-American Axis',
        time: '21:00 – 04:00 SAST',
        hubs: ['São Paulo (sa-east-1)', 'N. Virginia (us-east-1)', 'Oregon (us-west-2)'],
        tutors: [
          { id: 'J', name: 'Tutor J', tier: 'Tier 1', grades: 'Grades 8-9', time: '21:00 – 23:00 SAST', subjects: ['Algebra', 'Geometry'], image: 'https://i.pravatar.cc/150?img=20', bio: 'Making math accessible' },
          { id: 'K', name: 'Tutor K', tier: 'Tier 2', grades: 'Grades 10-11', time: '23:30 – 01:30 SAST', subjects: ['Algebra', 'Trigonometry'], image: 'https://i.pravatar.cc/150?img=30', bio: 'Algebra specialist' },
          { id: 'L', name: 'Tutor L', tier: 'Tier 3', grades: 'Grade 12 / Tertiary', time: '02:00 – 04:00 SAST', subjects: ['Calculus', 'Linear Algebra'], image: 'https://i.pravatar.cc/150?img=40', bio: 'Higher mathematics expert' }
        ]
      }
    ]
  },
  pricing: {
    title: 'Choose Your Plan',
    subtitle: 'Flexible subscription options for every learner',
    items: [
      { id: 1, name: 'Silver', price: 'R100', period: '/month', currency: 'ZAR', features: ['On-demand whiteboard archives', 'Practice exercises with solutions', 'Progress tracking dashboard', 'Mobile access (iOS & Android)'], popular: false, tier: 'Tier_Silver', description: 'Perfect for independent learners' },
      { id: 2, name: 'Gold', price: 'R200', period: '/month', currency: 'ZAR', features: ['Live drop-in evening homework clinics', 'Real-time interactive whiteboard', '24/7 Access to recorded lessons', 'Homework help from expert tutors', 'Weekly progress reports'], popular: true, tier: 'Tier_Gold', description: 'Best for students who need extra support' },
      { id: 3, name: 'Platinum', price: 'R350', period: '/month', currency: 'ZAR', features: ['Weekend mathematics clinics', 'Priority queue-bypass access', 'One-on-one tutoring sessions', 'Custom learning paths', 'Advanced analytics and insights', 'Dedicated academic coach'], popular: false, tier: 'Tier_Platinum', description: 'Premium experience for serious learners' }
    ]
  },
  resources: {
    title: 'Learning Resources',
    subtitle: 'On-demand whiteboard archives and study materials',
    vaults: [
      { id: 1, name: 'Pure Euclidean Geometry', icon: '📐', description: 'Master geometric proofs, theorems, and constructions', topics: ['Theorems', 'Proofs', 'Constructions', 'Triangles', 'Circles'] },
      { id: 2, name: 'Differential Calculus', icon: '∫', description: 'Comprehensive coverage of limits, derivatives, optimization', topics: ['Limits', 'Derivatives', 'Optimization', 'Application Problems'] },
      { id: 3, name: 'Matrix Algebra', icon: '🧮', description: 'Master matrix operations, determinants, eigenvalues', topics: ['Matrix Operations', 'Determinants', 'Eigenvalues', 'Transformations'] },
      { id: 4, name: 'Algebra Fundamentals', icon: '🔢', description: 'Build a strong foundation in linear equations, polynomials, and functions', topics: ['Linear Equations', 'Polynomials', 'Functions', 'Inequalities'] },
      { id: 5, name: 'Trigonometry', icon: '📐', description: 'Master sine, cosine, tangent, and their applications', topics: ['Sine', 'Cosine', 'Tangent', 'Applications', 'Identities'] },
      { id: 6, name: 'Statistics & Probability', icon: '📊', description: 'Comprehensive guide to data analysis, distributions, and statistical inference', topics: ['Data Analysis', 'Distributions', 'Inference', 'Probability'] }
    ]
  },
  howItWorks: {
    badge: '🚀 How It Works',
    title: 'Start Learning in 3 Simple Steps',
    subtitle: 'Your path to mathematics mastery',
    steps: [
      { id: 1, step: 'Choose Curriculum', description: 'Select your country, grade level, and subjects' },
      { id: 2, step: 'Choose Plan', description: 'Pick the subscription that fits your learning needs' },
      { id: 3, step: 'Start Learning', description: 'Begin your journey to mathematics excellence today!' }
    ]
  },
  testimonials: {
    badge: '💬 Testimonials',
    title: 'What Our Students Say',
    subtitle: 'Hear from students who transformed their math skills',
    items: [
      { id: 1, name: 'Sarah Johnson', country: 'South Africa', rating: 5, review: 'EduSpantech transformed my math grades from failing to distinction!', avatar: '👩' },
      { id: 2, name: 'Michael Chen', country: 'Singapore', rating: 5, review: 'The expert tutors and global curriculum prepared me perfectly for my university entrance exams.', avatar: '👨' },
      { id: 3, name: 'Jessica Williams', country: 'USA', rating: 5, review: 'I love the 24/7 access and homework clinics. Whenever I get stuck, there\'s always someone to help me understand.', avatar: '👩' }
    ]
  },
  cta: {
    title: 'Ready to Master Mathematics?',
    description: 'Join thousands of students already learning with EduSpantech',
    primaryText: 'Start Free Trial →',
    secondaryText: 'View Plans',
    note: 'No credit card required. Cancel anytime.'
  },
  dashboard: {
    user: { name: 'Alex Johnson', grade: 'Grade 12', country: 'South Africa', avatar: '👤' },
    stats: { courses: 4, hours: 24, badges: 7 },
    continueLearning: { title: 'Algebra Fundamentals', chapter: 'Chapter 3: Linear Equations', progress: 70 },
    recentActivity: [
      { id: 1, type: 'completed', title: 'Quadratic Equations Quiz', time: '2 hours ago' },
      { id: 2, type: 'watched', title: 'Functions & Graphs Lesson', time: '4 hours ago' },
      { id: 3, type: 'earned', title: 'Math Wizard Badge', time: '1 day ago' }
    ],
    progress: [
      { subject: 'Algebra', percentage: 70, color: '#4f46e5' },
      { subject: 'Geometry', percentage: 60, color: '#7c3aed' },
      { subject: 'Calculus', percentage: 45, color: '#ec4899' },
      { subject: 'Statistics', percentage: 80, color: '#06b6d4' }
    ]
  },
  navigation: [
    { id: 1, label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 2, label: 'My Courses', icon: '📚', path: '/courses' },
    { id: 3, label: 'Progress', icon: '📈', path: '/progress' },
    { id: 4, label: 'Whiteboard', icon: '✏️', path: '/whiteboard' },
    { id: 5, label: 'Settings', icon: '⚙️', path: '/settings' }
  ],
  footer: {
    columns: [
      { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
      { title: 'Resources', links: ['Documentation', 'Community', 'Support', 'Status'] },
      { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'Cookies'] }
    ],
    social: ['📘', '🐦', '📸', '💼'],
    languages: ['English', 'Afrikaans', 'Zulu', 'Xhosa']
  }
};

// ===== SERVICE EXPORTS =====
export const homeService = {
  getHomeData: async () => {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock data (development mode)');
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/home`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      throw error;
    }
  },

  getDashboardData: async (userId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA.dashboard;
    }

    const response = await fetch(`${API_BASE_URL}/dashboard/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  getUserProgress: async (userId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA.dashboard.progress;
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}/progress`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },

  getCourses: async (filters) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_DATA.subjects.items;
    }

    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/courses?${params}`);
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  }
};