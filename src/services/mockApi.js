import {
  findMockCourse,
  mockCategories,
  mockCourses,
  mockDashboard,
  mockEnrollments,
  mockPosts,
  mockNotifications,
  mockReviews,
  mockSections,
  mockUsers,
} from "../data/mockData";

export const mockApi = {
  courses: mockCourses,
  categories: mockCategories,
  posts: mockPosts,
  notifications: mockNotifications,
  getCourse(id) {
    return findMockCourse(id);
  },
  getSections(courseId) {
    return mockSections.flat().filter((section) => section.course_id === courseId);
  },
  getEnrollments() {
    return mockEnrollments;
  },
  getProgress(courseId) {
    return mockEnrollments.find((row) => row.course_id === courseId) || null;
  },
  getReviews() {
    return mockReviews;
  },
  getUsers() {
    return mockUsers;
  },
  dashboard: mockDashboard,
};
