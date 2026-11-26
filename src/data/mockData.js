const instructor = {
  id: "mock-instructor-1",
  full_name: "Mariam Hassan",
  name: "Mariam Hassan",
  email: "mariam@beepro.academy",
  role: "instructor",
  avatar_url: "/assets/abdullah1.jpg",
  bio: "Practical technology and data instructor.",
};

export const mockCategories = [
  {
    id: "it",
    name: "تكنولوجيا المعلومات",
    name_en: "Information Technology",
    slug: "it",
    description: "Cloud, cybersecurity, networking, and systems.",
  },
  {
    id: "data_analysis",
    name: "تحليل البيانات",
    name_en: "Data Analysis",
    slug: "data-analysis",
    description: "Turn data into useful decisions.",
  },
  {
    id: "financial_markets",
    name: "الأسواق المالية",
    name_en: "Financial Markets",
    slug: "financial-markets",
    description: "Understand markets and financial decision-making.",
  },
];

export const mockCourses = [
  {
    id: "mock-course-power-bi",
    title: "أساسيات تحليل البيانات",
    title_en: "Data Analysis Fundamentals",
    description: "Learn spreadsheets, SQL, and Power BI through practical projects.",
    description_en: "Learn spreadsheets, SQL, and Power BI through practical projects.",
    category: "data_analysis",
    category_name: "تحليل البيانات",
    category_name_en: "Data Analysis",
    instructor_id: instructor.id,
    instructor,
    thumbnail_url: "/assets/hero-background.png",
    price: 49,
    level: "beginner",
    rating: 4.8,
    students_count: 128,
    lessons_count: 24,
    duration: 18,
    status: "published",
    admin_approval_status: "approved",
  },
  {
    id: "mock-course-networking",
    title: "أساسيات الشبكات",
    title_en: "Networking Essentials",
    description: "Build a reliable foundation in modern networks and protocols.",
    description_en: "Build a reliable foundation in modern networks and protocols.",
    category: "it",
    category_name: "تكنولوجيا المعلومات",
    category_name_en: "Information Technology",
    instructor_id: instructor.id,
    instructor,
    thumbnail_url: "/assets/hero-background.png",
    price: 0,
    level: "intermediate",
    rating: 4.6,
    students_count: 96,
    lessons_count: 18,
    duration: 12,
    status: "published",
    admin_approval_status: "approved",
  },
  {
    id: "mock-course-markets",
    title: "مدخل إلى الأسواق المالية",
    title_en: "Introduction to Financial Markets",
    description: "Understand market structure, risk, and responsible analysis.",
    description_en: "Understand market structure, risk, and responsible analysis.",
    category: "financial_markets",
    category_name: "الأسواق المالية",
    category_name_en: "Financial Markets",
    instructor_id: instructor.id,
    instructor,
    thumbnail_url: "/assets/hero-background.png",
    price: 59,
    level: "beginner",
    rating: 4.7,
    students_count: 74,
    lessons_count: 16,
    duration: 10,
    status: "published",
    admin_approval_status: "approved",
  },
];

export const mockEnrollments = [
  { id: "mock-enrollment-1", course_id: mockCourses[0].id, course: mockCourses[0], progress: 64 },
  { id: "mock-enrollment-2", course_id: mockCourses[1].id, course: mockCourses[1], progress: 100 },
];

export const mockSections = mockCourses.map((course, index) => [
  {
    id: `mock-section-${index + 1}`,
    course_id: course.id,
    title: index === 0 ? "Getting started" : "Core concepts",
    lessons: Array.from({ length: 4 }, (_, lessonIndex) => ({
      id: `mock-lesson-${index + 1}-${lessonIndex + 1}`,
      course_id: course.id,
      title: `Lesson ${lessonIndex + 1}`,
      duration: 35,
      is_published: true,
      completed: index === 1 || lessonIndex < 2,
    })),
  },
]);

export const mockReviews = [
  { id: "mock-review-1", course_id: mockCourses[0].id, rating: 5, comment: "Clear and practical." },
  { id: "mock-review-2", course_id: mockCourses[1].id, rating: 4, comment: "Great foundation." },
];

export const mockUsers = [
  { id: "mock-user-1", full_name: "Ahmed Ali", email: "ahmed@example.com", role: "student", status: "active" },
  { id: "mock-user-2", full_name: "Sara Omar", email: "sara@example.com", role: "pending_instructor", status: "pending" },
  { id: instructor.id, full_name: instructor.full_name, email: instructor.email, role: "instructor", status: "active" },
];

export const mockPosts = [
  {
    id: "mock-post-1",
    title: "كيف تبدأ رحلة تحليل البيانات؟",
    title_en: "How to Start Your Data Analysis Journey",
    excerpt: "A practical roadmap for building your first data skills.",
    excerpt_en: "A practical roadmap for building your first data skills.",
    content: "ابدأ بالأساسيات، ثم طبّق ما تتعلمه على مشروعات صغيرة قابلة للقياس.",
    content_en: "Start with fundamentals, then apply what you learn to measurable projects.",
    category: "Data",
    published_at: "2026-10-10T09:00:00.000Z",
    status: "published",
    course_id: mockCourses[0].id,
  },
];

export const mockNotifications = [
  {
    id: "mock-notification-1",
    title: "Keep learning",
    message: "Your next lesson is ready.",
    type: "course",
    is_read: false,
    created_at: "2026-10-12T10:00:00.000Z",
  },
];

export const mockDashboard = {
  student: { enrollments: mockEnrollments, progress: mockEnrollments.map((row) => ({ course_id: row.course_id, progress: row.progress })) },
  teacher: { courses: mockCourses, sections: mockSections.flat(), enrollments: mockEnrollments, reviews: mockReviews },
  admin: { users: mockUsers, pendingInstructors: mockUsers.filter((user) => user.role === "pending_instructor"), courses: mockCourses, posts: mockPosts },
};

export const findMockCourse = (id) => mockCourses.find((course) => course.id === id) || null;
