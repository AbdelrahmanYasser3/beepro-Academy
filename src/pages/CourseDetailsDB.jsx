import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useAuth } from "../contexts/AuthContext";
import {
  courseService,
  enrollmentService,
  lessonService,
  meetingService,
  sectionService,
} from "../services/api";
import { isCoursePublishedAndApproved } from "../lib/backendFormatters";
import { isPaymentsEnabled } from "../lib/featureFlags";
import { paymentService } from "../services/paymentAPI";
import { getMeetingJoinTarget, pickJoinableMeeting } from "../lib/jitsi";
import { isStudentUser } from "../lib/roles";
import { getLandingAuthUrl } from "../lib/authRoutes";
import { toastSuccess, toastError } from "../lib/toast";
import Button from "../components/ui/Button";
import ImageWithFallback from "../components/ui/ImageWithFallback";
import LessonForm from "../components/course/LessonForm";
import {
  FiPlay,
  FiClock,
  FiUsers,
  FiStar,
  FiBookOpen,
  FiAward,
  FiGlobe,
  FiCheck,
  FiLock,
  FiChevronDown,
  FiChevronUp,
  FiShare2,
  FiHeart,
  FiArrowRight,
  FiArrowLeft,
  FiUser,
  FiVideo,
  FiMessageCircle,
} from "react-icons/fi";
import "./CourseDetailsDB.css";

const CourseDetailsDB = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const { formatCoursePrice } = useCurrency();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [sections, setSections] = useState([]);
  const [openLessonFormFor, setOpenLessonFormFor] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    contentType: "video",
    contentUrl: "",
    duration: 0,
    isFree: true,
  });
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [savingLessonFor, setSavingLessonFor] = useState(null);
  const [lessonError, setLessonError] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasApprovedPayment, setHasApprovedPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedSections, setExpandedSections] = useState(["section-1"]);
  const [liveMeetings, setLiveMeetings] = useState([]);
  const isPaidCourse = Number(course?.price || 0) > 0;
  const coursePriceDisplay = course ? formatCoursePrice(course.price).full : "";
  const isStudent = isStudentUser(user);
  const paymentsEnabled = isPaymentsEnabled();

  const hasCourseAccess =
    isEnrolled ||
    hasApprovedPayment ||
    (!paymentsEnabled && isPaidCourse && isStudent);

  const joinableMeeting = useMemo(
    () => pickJoinableMeeting(liveMeetings),
    [liveMeetings],
  );

  const courseLevel = course?.level?.trim() || "beginner";
  const isCourseOwner = user?.id && course?.instructor_id === user.id;
  const totalLessons = useMemo(() => {
    if (sections.length > 0) {
      return sections.reduce(
        (sum, section) => sum + ((section.lessons || []).length || 0),
        0,
      );
    }
    return lessons.length;
  }, [sections, lessons]);

  const sectionsToRender =
    sections.length > 0
      ? sections
      : [
          {
            id: "default",
            title: t("courseDetailsDB.courseContent"),
            lessons,
          },
        ];

  const ArrowIcon = isRTL ? FiArrowLeft : FiArrowRight;

  const renderJoinSessionLink = (
    className = "btn btn-primary w-full inline-flex items-center justify-center gap-2",
  ) => {
    const joinTarget = joinableMeeting
      ? getMeetingJoinTarget(joinableMeeting)
      : null;

    if (joinTarget?.type === "external") {
      return (
        <a
          href={joinTarget.url}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          <FiVideo className="w-5 h-5" />
          {t("courseDetailsDB.joinLiveSession_22")}
        </a>
      );
    }

    if (joinTarget?.type === "jitsi") {
      return (
        <Link
          to={`/courses/${course.id}/learn?session=${joinableMeeting.id}`}
          className={className}
        >
          <FiVideo className="w-5 h-5" />
          {t("courseDetailsDB.joinLiveSession_21")}
        </Link>
      );
    }

    return (
      <Link
        to={`/courses/${course.id}/learn?session=live`}
        className={className}
      >
        <FiVideo className="w-5 h-5" />
        {t("courseDetailsDB.joinLiveSession_20")}
      </Link>
    );
  };

  // Fetch course details
  useEffect(() => {
    fetchCourseData();
  }, [id]);

  // Check enrollment status
  useEffect(() => {
    if (isAuthenticated && user && course) {
      checkEnrollmentStatus();
    }
  }, [isAuthenticated, user, course]);

  useEffect(() => {
    const loadLiveMeetings = async () => {
      if (!course?.id || !hasCourseAccess) {
        setLiveMeetings([]);
        return;
      }

      try {
        const meetings = await meetingService.getMeetingsByCourse(course.id);
        setLiveMeetings(meetings || []);
      } catch (err) {
        console.error("Live meetings fetch error:", err);
        setLiveMeetings([]);
      }
    };

    loadLiveMeetings();
  }, [course?.id, hasCourseAccess]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const courseData = await courseService.getPublishedCourseDetails(id);

      if (!courseData || !isCoursePublishedAndApproved(courseData)) {
        setError("Course not found");
        return;
      }

      setCourse(courseData);

      const sectionsData = await sectionService.getSectionsByCourse(id);
      const sectionsWithLessons = await Promise.all(
        (sectionsData || []).map(async (section) => ({
          ...section,
          lessons: await lessonService.getLessonsBySection(
            section.id,
            courseData.id,
          ),
        })),
      );
      setSections(sectionsWithLessons);

      const lessonsData = await lessonService.getPublishedLessonsByCourse(id);
      setLessons(lessonsData || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const refreshSectionLessons = async (sectionId) => {
    try {
      const sectionLessons = await lessonService.getLessonsBySection(
        sectionId,
        course?.id,
      );
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? { ...section, lessons: sectionLessons || [] }
            : section,
        ),
      );
    } catch (err) {
      console.error("Failed to refresh section lessons:", err);
    }
  };

  const loadCourseSections = async (courseId) => {
    if (!courseId) return [];
    try {
      const sectionsData = await sectionService.getSectionsByCourse(courseId);
      const sectionsWithLessons = await Promise.all(
        (sectionsData || []).map(async (section) => ({
          ...section,
          lessons: await lessonService.getLessonsBySection(
            section.id,
            courseId,
          ),
        })),
      );
      setSections(sectionsWithLessons);
      return sectionsWithLessons;
    } catch (err) {
      console.error("Failed to load course sections:", err);
      return [];
    }
  };

  const checkEnrollmentStatus = async () => {
    if (!user || !course) return;

    try {
      const enrolled = await enrollmentService.isEnrolled(course.id);
      setIsEnrolled(enrolled);

      const paidCourse = Number(course.price || 0) > 0;
      if (!enrolled && paidCourse) {
        if (!paymentsEnabled && isStudent) {
          setHasApprovedPayment(true);
        } else {
          const approved = await paymentService.hasApprovedPaymentForCourse(
            user.id,
            course.id,
          );
          setHasApprovedPayment(approved);
        }
      } else {
        setHasApprovedPayment(false);
      }
    } catch (err) {
      console.error("Enrollment check error:", err);
      setIsEnrolled(false);
      setHasApprovedPayment(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      const redirectPath =
        isPaidCourse && paymentsEnabled
          ? `/courses/${course?.id}/checkout`
          : `/courses/${course?.id}`;
      navigate(getLandingAuthUrl("login", { redirect: redirectPath }));
      return;
    }

    if (!user || !course) return;

    if (!isStudent && isPaidCourse) {
      setError(t("courseDetailsDB.paymentIsAllowedForStudentsOnl"));
      return;
    }

    if (!isPaidCourse || !paymentsEnabled) {
      setEnrolling(true);
      setError(null);
      try {
        await enrollmentService.enrollInCourse(course.id);
        setIsEnrolled(true);
        navigate(`/courses/${course.id}/learn`);
      } catch (err) {
        setError(err.message || t("courseDetailsDB.failedToEnrollInCourse"));
      } finally {
        setEnrolling(false);
      }
      return;
    }

    navigate(`/courses/${course.id}/checkout`);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleAddSection = async () => {
    const title = window.prompt(t("courseDetailsDB.enterSectionTitle"));
    if (!title?.trim()) return;

    try {
      await sectionService.createSection(course.id, { title: title.trim() });
      await loadCourseSections(course.id);
      toastSuccess(t("courseDetailsDB.sectionAddedSuccessfully"));
    } catch (err) {
      const message = err.message || t("courseDetailsDB.failedToCreateSection");
      toastError(message);
    }
  };

  const openLessonForm = (sectionId) => {
    setOpenLessonFormFor(sectionId);
    setEditingLessonId(null);
    setLessonError("");
    setLessonForm({
      title: "",
      description: "",
      contentType: "video",
      contentUrl: "",
      duration: 0,
      isFree: true,
    });
  };

  const handleLessonFormChange = (field, value) => {
    setLessonForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveLesson = async (sectionId) => {
    if (!lessonForm.title.trim()) {
      setLessonError(t("courseDetailsDB.lessonTitleRequired"));
      return;
    }

    setSavingLessonFor(sectionId);
    setLessonError("");

    try {
      const payload = {
        title: lessonForm.title.trim(),
        description: lessonForm.description?.trim() || "",
        contentType: lessonForm.contentType || "video",
        contentUrl: lessonForm.contentUrl?.trim() || "",
        duration: Number(lessonForm.duration) || 0,
        isFree: Boolean(lessonForm.isFree),
      };

      if (editingLessonId) {
        await lessonService.updateLesson(editingLessonId, payload);
        toastSuccess(t("courseDetailsDB.lessonUpdatedSuccessfully"));
      } else {
        await lessonService.createLessonInSection(sectionId, {
          ...payload,
          course_id: course?.id,
        });
        toastSuccess(t("courseDetailsDB.lessonAddedSuccessfully"));
      }

      setOpenLessonFormFor(null);
      setEditingLessonId(null);
      await refreshSectionLessons(sectionId);
    } catch (err) {
      const message = err.message || t("courseDetailsDB.failedToSaveLesson");
      setLessonError(message);
      toastError(message);
    } finally {
      setSavingLessonFor(null);
    }
  };

  const handleEditLesson = (lesson, sectionId) => {
    setEditingLessonId(lesson.id);
    setOpenLessonFormFor(sectionId);
    setLessonForm({
      title: lesson.title || "",
      description: lesson.description || "",
      contentType: lesson.contentType || lesson.content_type || "video",
      contentUrl:
        lesson.contentUrl || lesson.content_url || lesson.video_url || "",
      duration: lesson.duration || 0,
      isFree: Boolean(lesson.isFree),
    });
    setLessonError("");
  };

  const handleDeleteLesson = async (lesson, sectionId) => {
    const confirmed = window.confirm(
      t("courseDetailsDB.confirmDeleteLesson", { title: lesson.title }),
    );
    if (!confirmed) return;

    try {
      await lessonService.deleteLesson(lesson.id);
      await refreshSectionLessons(sectionId);
      toastSuccess(t("courseDetailsDB.lessonDeletedSuccessfully"));
    } catch (err) {
      const message = err.message || t("courseDetailsDB.failedToDeleteLesson");
      toastError(message);
    }
  };

  if (loading) {
    return (
      <div className="bepro-page min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="bepro-card flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="bepro-page min-h-screen pt-24 flex items-center justify-center px-4">
        <div className="bepro-card max-w-lg w-full text-center">
          <FiBookOpen className="w-12 h-12 mx-auto mb-4 text-primary-500" />
          <h2 className="text-2xl font-bold mb-3">
            {t("courseDetailsDB.courseNotFound")}
          </h2>
          <p className="text-secondary-500 dark:text-secondary-400 mb-6">
            {error || t("courseDetailsDB.courseNotFound")}
          </p>
          <Button to="/courses" variant="primary">
            {t("dashboardExtra.browseCourses")}
          </Button>
        </div>
      </div>
    );
  }

  const instructor = course.instructor || course.users || {};
  const displayTitle =
    language === "ar"
      ? course.title || course.title_en
      : course.title_en || course.title;
  const displayDescription =
    language === "ar"
      ? course.description || course.description_en
      : course.description_en || course.description;
  const courseFeatures = [
    { icon: FiClock, label: t("courseDetailsDB.comprehensiveContent") },
    {
      icon: FiBookOpen,
      label: `${totalLessons} ${t("courseDetailsDB.lessons", { defaultValue: "lessons" })}`,
    },
    { icon: FiGlobe, label: t("courseDetailsDB.lifetimeAccess") },
    { icon: FiAward, label: t("courseDetailsDB.certificateOfCompletion") },
  ];

  const tabs = [
    { id: "overview", label: t("courseDetailsDB.overview") },
    { id: "curriculum", label: t("course.curriculum") },
    { id: "instructor", label: t("course.instructor") },
  ];

  return (
    <div className="course-details-page">
      {/* Hero Section */}
      <section className="course-details-hero">
        <div className="container-custom">
          <div className="course-details-breadcrumb">
            <Link to="/">{t("nav.home")}</Link>
            <span>/</span>
            <Link to="/courses">{t("nav.courses")}</Link>
            <span>/</span>
            <span>{displayTitle}</span>
          </div>
          <div className="course-details-hero-grid">
            {/* Course Info */}
            <div className="course-details-copy">

              {/* Tags */}
              <div className="course-details-tags">
                <span className="course-details-tag">
                  {t(`course.level.${courseLevel}`)}
                </span>
                <span className="course-details-tag">
                  {(language === "ar"
                    ? course.category_name
                    : course.category_name_en || course.category_name) ||
                    course.category ||
                    t("nav.courses")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 break-words">
                {displayTitle}
              </h1>
              <p className="course-details-lead">
                {displayDescription}
              </p>
              <div className="course-details-meta">
                <span><FiClock /> {course.duration || t("courseDetailsDB.selfPaced", { defaultValue: "Self-paced" })}</span>
                <span><FiBookOpen /> {totalLessons} {t("courseDetailsDB.lessons_13")}</span>
                <span><FiGlobe /> {t("courseDetailsDB.lifetimeAccess")}</span>
              </div>

              {isCourseOwner && (
                <div className="mb-6 rounded-2xl border border-secondary-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Course Management
                      </h2>
                      <p className="text-sm text-secondary-500">
                        Manage sections and lessons for this course.
                      </p>
                    </div>
                    <Button onClick={handleAddSection} variant="secondary">
                      + Add Section
                    </Button>
                  </div>
                </div>
              )}

              {/* Instructor */}
              <div className="course-details-instructor">
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center overflow-hidden">
                  {instructor.avatar_url ? (
                    <ImageWithFallback
                      src={instructor.avatar_url}
                      alt={instructor.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                      fallback="/assets/abdullah1.jpg"
                    />
                  ) : (
                    <FiUser className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="label">
                    {t("course.instructor")}
                  </p>
                  <p className="name">
                    {instructor.full_name ||
                      instructor.name ||
                      t("course.instructor")}
                  </p>
                  <p className="role">
                    {t("courseDetailsDB.instructorRole", {
                      defaultValue: language === "ar" ? "مدرب الدورة" : "Course instructor",
                    })}
                  </p>
                  {instructor.bio && (
                    <p className="text-sm text-secondary-300 mt-1 line-clamp-2">
                      {instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Card (Desktop) */}
            <div>
              <div className="course-details-purchase">
                {/* Thumbnail */}
                <div className="course-details-purchase-media">
                  {course.thumbnail_url ? (
                    <ImageWithFallback
                      src={course.thumbnail_url}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                      fallback="/assets/hero-background.png"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiBookOpen className="w-16 h-16 text-white opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                    {hasCourseAccess ? (
                      (() => {
                        const joinTarget = joinableMeeting
                          ? getMeetingJoinTarget(joinableMeeting)
                          : null;
                        if (joinTarget?.type === "external") {
                          return (
                            <a
                              href={joinTarget.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col items-center gap-2"
                              title={t("courseDetailsDB.joinLiveSession_19")}
                            >
                              <span className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                                <FiVideo className="w-7 h-7" />
                              </span>
                              <span className="text-sm font-semibold text-white drop-shadow">
                                {t("courseDetailsDB.joinSession_18")}
                              </span>
                            </a>
                          );
                        }

                        return (
                          <Link
                            to={
                              joinableMeeting
                                ? `/courses/${course.id}/learn?session=${joinableMeeting.id}`
                                : `/courses/${course.id}/learn?session=live`
                            }
                            className="group flex flex-col items-center gap-2"
                            title={t("courseDetailsDB.joinLiveSession")}
                          >
                            <span className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                              <FiVideo className="w-7 h-7" />
                            </span>
                            <span className="text-sm font-semibold text-white drop-shadow">
                              {t("courseDetailsDB.joinSession")}
                            </span>
                          </Link>
                        );
                      })()
                    ) : (
                      <span className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <FiPlay className="w-6 h-6 text-primary-500 ms-1" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Price & CTA */}
                <div className="course-details-purchase-body">
                  <div className="course-details-price">
                    {isPaidCourse
                      ? coursePriceDisplay
                      : t("courseDetailsDB.free_17")}
                  </div>

                  {hasCourseAccess ? (
                    <div className="space-y-3">
                      {renderJoinSessionLink()}
                      <Button
                        to={`/courses/${course.id}/learn`}
                        fullWidth
                        icon={ArrowIcon}
                        iconPosition="end"
                        variant="outline"
                      >
                        {t("courseDetailsDB.continueLearning")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleEnroll}
                      fullWidth
                      size="lg"
                      disabled={enrolling || (isPaidCourse && !isStudent)}
                    >
                      {enrolling
                        ? t("courseDetailsDB.enrolling_16")
                        : isPaidCourse && !isStudent
                          ? t("courseDetailsDB.studentsOnly_15")
                          : isPaidCourse
                            ? paymentsEnabled
                              ? t("courseDetailsDB.payToGetCourse")
                              : t("courseDetailsDB.enrollForFree")
                            : t("courseDetailsDB.enrollForFree")}
                    </Button>
                  )}

                  {isAuthenticated && isStudent && (
                    <Link
                      to={`/courses/${course.id}/learn?tab=chat`}
                      className="btn btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      {t("dashboardExtra.chatWithInstructor")}
                    </Link>
                  )}

                  {/* Features */}
                  <div className="course-details-feature-list">
                    {courseFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5 text-primary-500" />
                        <span className="text-sm">{feature.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Course Card */}
      <div className="lg:hidden sticky top-16 z-40 bg-white dark:bg-dark-card shadow-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-green-500">
              {isPaidCourse ? coursePriceDisplay : t("courseDetailsDB.free_14")}
            </span>
          </div>
          {hasCourseAccess ? (
            <div className="flex items-center gap-2">
              {renderJoinSessionLink(
                "btn btn-primary btn-sm inline-flex items-center gap-2",
              )}
              <Button
                to={`/courses/${course.id}/learn`}
                icon={ArrowIcon}
                iconPosition="end"
                variant="outline"
                size="sm"
              >
                {t("courseDetailsDB.continue")}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEnroll}
              disabled={enrolling || (isPaidCourse && !isStudent)}
            >
              {enrolling
                ? t("courseDetailsDB.enrolling")
                : isPaidCourse && !isStudent
                  ? t("courseDetailsDB.studentsOnly")
                  : isPaidCourse
                    ? paymentsEnabled
                      ? t("courseDetailsDB.pay")
                      : t("courseDetailsDB.enrollForFree")
                    : t("courseDetailsDB.free")}
            </Button>
          )}
        </div>
      </div>

      {/* Content Section */}
      <section className="course-details-content">
        <div className="container-custom">
          <div className="course-details-main">
            {/* Tabs */}
            <div className="course-details-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "active" : ""}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="course-details-panel">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    {t("courseDetailsDB.courseDescription")}
                  </h2>
                  <p>
                    {displayDescription}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t("course.curriculum")}
                    </h2>
                    <p className="text-sm text-secondary-500">
                      {totalLessons} {t("courseDetailsDB.lessons_13")}
                    </p>
                  </div>
                  {isCourseOwner && (
                    <Button onClick={handleAddSection} variant="secondary">
                      + {t("courseDetailsDB.addSection")}
                    </Button>
                  )}
                </div>

                {/* Curriculum Sections */}
                <div className="space-y-4">
                  {sectionsToRender.map((section) => (
                    <div
                      key={section.id}
                      className="border border-secondary-200 dark:border-dark-border rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-secondary-50 dark:bg-dark-border hover:bg-secondary-100 dark:hover:bg-dark-card transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections.includes(section.id) ? (
                            <FiChevronUp className="w-5 h-5" />
                          ) : (
                            <FiChevronDown className="w-5 h-5" />
                          )}
                          <span className="font-medium">
                            {section.title || t("courseDetailsDB.section")}
                          </span>
                        </div>
                        <span className="text-sm text-secondary-500">
                          {(section.lessons || []).length}{" "}
                          {t("courseDetailsDB.lessons")}
                        </span>
                      </button>

                      {expandedSections.includes(section.id) && (
                        <div className="divide-y divide-secondary-100 dark:divide-dark-border">
                          {(section.lessons || []).map((lesson) => {
                            const canOpenLesson = isEnrolled || hasCourseAccess;
                            return (
                              <div
                                key={lesson.id}
                                className="flex flex-col gap-3 p-4 hover:bg-secondary-50 dark:hover:bg-dark-border/50 transition-colors"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    {canOpenLesson ? (
                                      <FiPlay className="w-5 h-5 text-primary-500" />
                                    ) : (
                                      <FiLock className="w-5 h-5 text-secondary-400" />
                                    )}
                                    {canOpenLesson ? (
                                      <Link
                                        to={`/courses/${course.id}/lessons/${lesson.id}`}
                                        className="font-medium"
                                      >
                                        {lesson.title}
                                      </Link>
                                    ) : (
                                      <span className="font-medium text-secondary-400">
                                        {lesson.title}
                                      </span>
                                    )}
                                  </div>
                                  {isCourseOwner && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                          handleEditLesson(lesson, section.id)
                                        }
                                      >
                                        {t("courseDetailsDB.editLesson")}
                                      </Button>
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteLesson(lesson, section.id)
                                        }
                                      >
                                        {t("courseDetailsDB.deleteLesson")}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {section.lessons?.length === 0 && (
                            <div className="p-4 text-center text-secondary-500">
                              {t("courseDetailsDB.noLessonsYet")}
                            </div>
                          )}

                          {isCourseOwner && section.id !== "default" && (
                            <div className="p-4">
                              <Button
                                variant="secondary"
                                onClick={() => openLessonForm(section.id)}
                              >
                                + {t("courseDetailsDB.addLesson")}
                              </Button>
                              {openLessonFormFor === section.id && (
                                <LessonForm
                                  form={lessonForm}
                                  onChange={handleLessonFormChange}
                                  onSubmit={() => handleSaveLesson(section.id)}
                                  loading={savingLessonFor === section.id}
                                  onCancel={() => setOpenLessonFormFor(null)}
                                  mode={editingLessonId ? "edit" : "create"}
                                />
                              )}
                              {lessonError && (
                                <p className="text-sm text-red-500 mt-3">
                                  {lessonError}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "instructor" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">
                  {t("course.instructor")}
                </h2>
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full bg-primary-500 flex items-center justify-center">
                    {instructor.avatar_url ? (
                      <ImageWithFallback
                        src={instructor.avatar_url}
                        alt={instructor.full_name}
                        className="w-24 h-24 rounded-full object-cover"
                        fallback="/assets/abdullah1.jpg"
                      />
                    ) : (
                      <FiUser className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {instructor.full_name || "Instructor"}
                    </h3>
                    <p className="text-secondary-500 mb-4">
                      {instructor.email}
                    </p>
                    {instructor.bio && (
                      <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseDetailsDB;
