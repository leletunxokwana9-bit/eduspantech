// src/services/homeService.js
const API_URL = 'https://eduspantech-backend.onrender.com';

export const homeService = {
  getHomeData: async () => {
    try {
      console.log('🌐 Fetching subjects from API:', `${API_URL}/api/v1/content/subjects`);
      
      const response = await fetch(`${API_URL}/api/v1/content/subjects`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      console.log('✅ Subjects fetched successfully:', data);
      
      const subjects = data.subjects || [];
      
      return {
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
          courses: subjects.length || 1000,
          successRate: 98,
          countries: 25,
          schools: 500
        },
        subjects: {
          title: 'Mathematics Subjects',
          subtitle: 'Master any topic with expert guidance and interactive tools',
          items: subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            icon: subject.icon || '📚',
            description: subject.description || '',
            longDescription: subject.longDescription || subject.description || '',
            color: subject.color || '#4f46e5',
            topics: subject.topics || [],
            resources: [
              { 
                id: 1, 
                name: `${subject.name} Study Guide`, 
                path: `/resources/study-guides/${subject.id}`, 
                type: 'guide' 
              },
              { 
                id: 2, 
                name: `${subject.name} Practice Problems`, 
                path: `/resources/practice/${subject.id}`, 
                type: 'practice' 
              },
              { 
                id: 3, 
                name: `${subject.name} Video Lessons`, 
                path: `/resources/videos/${subject.id}`, 
                type: 'video' 
              }
            ]
          }))
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
            {
              id: 1,
              name: 'Pure Euclidean Geometry',
              icon: '📐',
              description: 'Master geometric proofs, theorems, and constructions',
              topics: ['Theorems', 'Proofs', 'Constructions', 'Triangles', 'Circles'],
              videos: [
                { id: 'vid-1', name: 'Introduction to Euclidean Geometry', description: 'Learn the basics of points, lines, and planes', duration: '12:34', difficulty: 'Beginner', type: 'video' },
                { id: 'vid-2', name: 'Triangle Theorems Explained', description: 'Master all triangle theorems with step-by-step proofs', duration: '18:22', difficulty: 'Intermediate', type: 'video' }
              ],
              practice: [
                { id: 'prac-1', name: 'Triangle Theorems Practice', description: 'Test your knowledge with 20 practice problems', difficulty: 'Intermediate', problems: 20, type: 'practice' }
              ],
              guides: [
                { id: 'guide-1', name: 'Complete Geometry Study Guide', description: 'Everything you need to know for your exam', pages: 45, type: 'guide' }
              ]
            },
            {
              id: 2,
              name: 'Differential Calculus',
              icon: '∫',
              description: 'Comprehensive coverage of limits, derivatives, optimization',
              topics: ['Limits', 'Derivatives', 'Optimization', 'Application Problems'],
              videos: [
                { id: 'vid-3', name: 'Introduction to Limits', description: 'Understanding the concept of limits', duration: '15:20', difficulty: 'Beginner', type: 'video' },
                { id: 'vid-4', name: 'Derivatives Explained', description: 'Master the power rule, product rule, and chain rule', duration: '22:10', difficulty: 'Intermediate', type: 'video' }
              ],
              practice: [
                { id: 'prac-2', name: 'Derivative Practice Problems', description: 'Practice derivatives with step-by-step solutions', difficulty: 'Intermediate', problems: 25, type: 'practice' }
              ],
              guides: [
                { id: 'guide-2', name: 'Calculus Study Guide', description: 'Complete guide to differential calculus', pages: 60, type: 'guide' }
              ]
            },
            {
              id: 3,
              name: 'Matrix Algebra',
              icon: '🧮',
              description: 'Master matrix operations, determinants, eigenvalues',
              topics: ['Matrix Operations', 'Determinants', 'Eigenvalues', 'Transformations'],
              videos: [
                { id: 'vid-5', name: 'Matrix Operations', description: 'Learn addition, subtraction, and multiplication of matrices', duration: '14:15', difficulty: 'Beginner', type: 'video' }
              ],
              practice: [
                { id: 'prac-3', name: 'Matrix Operations Practice', description: 'Practice matrix multiplication and determinants', difficulty: 'Intermediate', problems: 15, type: 'practice' }
              ],
              guides: [
                { id: 'guide-3', name: 'Linear Algebra Study Guide', description: 'Complete guide to matrices and linear algebra', pages: 50, type: 'guide' }
              ]
            }
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
        checkout: {
          title: 'Complete Your Enrollment',
          subtitle: 'Secure your spot and start learning today',
          steps: ['Plan Selection', 'Personal Details', 'Payment'],
          paymentMethods: [
            { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
            { id: 'payfast', name: 'PayFast', icon: '🔒' },
            { id: 'bank', name: 'Bank Transfer (EFT)', icon: '🏦' },
            { id: 'voucher', name: 'Voucher / Promo Code', icon: '🎫' }
          ],
          billingCountries: [
            { code: 'ZA', name: 'South Africa' },
            { code: 'US', name: 'United States' },
            { code: 'GB', name: 'United Kingdom' },
            { code: 'AU', name: 'Australia' },
            { code: 'SG', name: 'Singapore' },
            { code: 'JP', name: 'Japan' },
            { code: 'BR', name: 'Brazil' }
          ],
          securityBadges: [
            { id: 1, icon: '🔒', label: 'Secure Payment' },
            { id: 2, icon: '🛡️', label: 'Data Protected' },
            { id: 3, icon: '✅', label: 'Instant Access' },
            { id: 4, icon: '🔄', label: '72-Hour Refund' }
          ]
        },
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
    } catch (error) {
      console.error('❌ Failed to fetch subjects:', error);
      throw error;
    }
  },

  getDashboardData: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/dashboard/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return response.json();
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error;
    }
  },

  getUserProgress: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/${userId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    } catch (error) {
      console.error('Progress error:', error);
      throw error;
    }
  },

  getCourses: async (filters) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_URL}/api/v1/courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    } catch (error) {
      console.error('Courses error:', error);
      throw error;
    }
  }
};

export default homeService;