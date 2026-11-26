import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteNavbar from "../components/layout/SiteNavbar";
import Footer from "../components/layout/Footer";
import CourseCard from "../components/ui/CourseCard";
import AuthTabs from "../components/auth/AuthTabs";
import { categoryService, courseService } from "../services/api";
import {
  formatCourseForCard,
  getCategoryMeta,
  isCoursePublishedAndApproved,
} from "../lib/backendFormatters";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCheck,
  FiCloud,
  FiLayers,
  FiMonitor,
  FiPlayCircle,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import "./LandingPage.css";

const categoryIcons = {
  data_analysis: FiBarChart2,
  it: FiCloud,
  financial_markets: FiTrendingUp,
};

const LandingPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [backendCategories, setBackendCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authModal, setAuthModal] = useState({ isOpen: false, tab: "login" });
  const authTab = searchParams.get("auth");
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      courseService.getCourses({ limit: 1000, throwOnError: true }),
      categoryService.getCategories(),
    ])
      .then(([{ data = [] }, categoriesData = []]) => {
        if (active) {
          const categoriesById = new Map(
            categoriesData.map((category) => [category.id, category]),
          );
          const formattedCourses = data
            .filter(isCoursePublishedAndApproved)
            .map((course) => {
              const formatted = formatCourseForCard(course);
              const category = categoriesById.get(formatted.category);
              return {
                ...formatted,
                categoryName:
                  category?.name || formatted.categoryName || formatted.category,
                categoryNameEn:
                  category?.name_en ||
                  category?.nameEn ||
                  formatted.categoryNameEn ||
                  formatted.categoryName,
              };
            });
          setCourses(formattedCourses);
          setBackendCategories(categoriesData);
        }
      })
      .catch((error) => {
        console.error("Error loading homepage courses:", error);
        if (active) {
          setCourses([]);
          setBackendCategories([]);
          setLoadError(error);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    if (authTab === "login" || authTab === "register") {
      setAuthModal({ isOpen: true, tab: authTab });
    }
  }, [authTab]);

  const categories = useMemo(() => {
    const counts = courses.reduce((items, course) => {
      if (course.category) items[course.category] = (items[course.category] || 0) + 1;
      return items;
    }, {});
    return Object.entries(counts).map(([id, count]) => {
      const backendCategory = backendCategories.find(
        (category) => category.id === id,
      );
      const meta = getCategoryMeta(id);
      return {
        ...meta,
        name: backendCategory?.name || meta.name,
        nameEn: backendCategory?.name_en || backendCategory?.nameEn || meta.nameEn,
        count,
      };
    });
  }, [backendCategories, courses]);

  const instructors = useMemo(() => {
    const unique = new Map();
    courses.forEach((course) => {
      const instructor = course.instructor;
      const name = instructor?.name?.trim();
      if (!name || name === "Instructor") return;
      const key = course.instructor_id || name;
      const current = unique.get(key) || {
        ...instructor,
        courses: 0,
        ratingTotal: 0,
        ratedCourses: 0,
      };
      current.courses += 1;
      if (course.rating > 0) {
        current.ratingTotal += course.rating;
        current.ratedCourses += 1;
      }
      unique.set(key, current);
    });
    return [...unique.values()]
      .map((instructor) => ({
        ...instructor,
        rating:
          instructor.ratedCourses > 0
            ? (instructor.ratingTotal / instructor.ratedCourses).toFixed(1)
            : null,
        specialty: instructor.bio?.split(/[.!؟]/)[0]?.trim() || "",
      }))
      .slice(0, 4);
  }, [courses]);

  const closeAuth = () => {
    setAuthModal({ isOpen: false, tab: "login" });
    const next = new URLSearchParams(searchParams);
    next.delete("auth");
    next.delete("role");
    setSearchParams(next, { replace: true });
  };

  const Arrow = FiArrowLeft;
  const featured = courses.slice(0, 4);
  const practical = courses.filter((course) => course.isFree || course.lessons > 0).slice(0, 3);

  return (
    <div className="bee-home" dir="rtl">
      <SiteNavbar />
      <main>
        <section className="bee-hero">
          <div className="bee-container bee-hero-grid">
            <div className="bee-hero-copy">
              <span className="bee-eyebrow"><FiBookOpen /> {t("homeExtra.heroEyebrow")}</span>
              <h1>{t("homeExtra.heroTitle")}</h1>
              <p>{t("homeExtra.heroSubtitle")}</p>
              <div className="bee-actions">
                <Link className="bee-button bee-button-primary" to="/courses">{t("homeExtra.exploreCourses")} <Arrow /></Link>
                <Link className="bee-button bee-button-light" to="/courses"><FiPlayCircle /> {t("homeExtra.startLearning")}</Link>
              </div>
              <div className="bee-proof-row">
                <span><FiCheck /> {t("homeExtra.specializedCourses")}</span><span><FiCheck /> {t("homeExtra.flexibleLearning")}</span><span><FiCheck /> {t("homeExtra.practicalExperience")}</span>
              </div>
            </div>
            <div className="bee-hero-art" aria-label="منصة BeePro Academy للتعلم" role="img">
              <div className="bee-art-panel">
                <div className="bee-art-top"><span /><span /><span /></div>
                <div className="bee-art-chart"><div className="bee-chart-line" /><span className="bee-chart-dot" /></div>
                <div className="bee-art-stats"><span /><span /><span /></div>
              </div>
              <div className="bee-float-card bee-float-one"><FiBarChart2 /><span>مهارات عملية<br /><b>خطوة بخطوة</b></span></div>
              <div className="bee-float-card bee-float-two"><FiUsers /><span>تعلّم مع<br /><b>مجتمع مهني</b></span></div>
            </div>
          </div>
          {categories.length > 0 && <div className="bee-category-strip"><div className="bee-container bee-category-list">{categories.slice(0, 6).map((category) => { const Icon = categoryIcons[category.id] || FiLayers; return <Link key={category.id} to={`/courses?category=${category.id}`}><Icon /><span>{category.name}</span></Link>; })}</div></div>}
        </section>

        <section className="bee-section" id="courses">
          <div className="bee-container">
            <SectionHeading eyebrow={t("homeExtra.featuredEyebrow")} title={t("homeExtra.featuredTitle")} description={t("homeExtra.featuredDescription")} link="/courses" t={t} />
            {featured.length ? <div className="bee-course-grid">{featured.map((course) => <CourseCard key={course.id} course={course} variant="light" />)}</div> : <EmptyState t={t} loading={loading} error={loadError} onRetry={() => setRetryCount((count) => count + 1)} />}
          </div>
        </section>

        {practical.length > 0 && <section className="bee-section bee-section-soft" id="practical">
          <div className="bee-container">
            <SectionHeading eyebrow={t("homeExtra.practicalEyebrow")} title={t("homeExtra.practicalTitle")} description={t("homeExtra.practicalDescription")} link="/courses" t={t} />
            <div className="bee-practical-grid">{practical.map((course) => <Link className="bee-practical-card" to={`/courses/${course.id}`} key={course.id}><span className="bee-practical-icon"><FiPlayCircle /></span><span className="bee-practical-meta">{course.categoryName || course.category || "دورة تدريبية"}</span><h3>{course.title}</h3><p>{course.description}</p><span className="bee-inline-link">اكتشف الدورة <Arrow /></span></Link>)}</div>
          </div>
        </section>}

        <section className="bee-section" id="programs">
          <div className="bee-container">
            <SectionHeading eyebrow={t("homeExtra.learningProgramsEyebrow")} title={t("homeExtra.learningProgramsTitle")} description={t("homeExtra.learningProgramsDescription")} link="/courses" t={t} />
            {categories.length ? <div className="bee-program-grid">{categories.slice(0, 3).map((category) => { const Icon = categoryIcons[category.id] || FiLayers; const categoryCourses = courses.filter((course) => course.category === category.id); const hours = categoryCourses.reduce((total, course) => total + Number(course.duration || 0), 0); return <Link className="bee-program-card" to={`/courses?category=${category.id}`} key={category.id}><div className="bee-program-icon"><Icon /></div><h3>{category.name}</h3><p>{t("homeExtra.programDescription")}</p><div className="bee-program-foot"><span>{category.count} {t("homeExtra.availableCourses")}{hours > 0 ? ` · ${hours} ${t("homeExtra.hours")}` : ""}</span><span className="bee-inline-link">{t("homeExtra.browseCourses")} <Arrow /></span></div></Link>; })}</div> : <EmptyState t={t} loading={loading} />}
          </div>
        </section>

        {instructors.length > 0 && <section className="bee-section bee-section-soft" id="instructors">
          <div className="bee-container">
            <SectionHeading eyebrow={t("homeExtra.instructorsEyebrow")} title={t("homeExtra.instructorsTitle")} description={t("homeExtra.instructorsDescription")} link="/courses" t={t} />
            <div className="bee-instructor-grid">{instructors.map((instructor, index) => <article className="bee-instructor-card" key={`${instructor.name}-${index}`}><img src={instructor.avatar} alt={instructor.name} loading="lazy" /><h3>{instructor.name}</h3>{instructor.specialty && <p className="bee-instructor-specialty">{instructor.specialty}</p>}<p>{instructor.courses} {t("homeExtra.availableCourses")}{instructor.rating ? ` · ${instructor.rating}/5` : ""}</p></article>)}</div>
          </div>
        </section>}

        <section className="bee-section" id="business">
          <div className="bee-container">
            <div className="bee-business-card"><div className="bee-business-copy"><span className="bee-eyebrow">{t("homeExtra.businessEyebrow")}</span><h2>{t("homeExtra.businessTitle")}</h2><p>{t("homeExtra.businessDescription")}</p><div className="bee-actions"><Link to="/contact" className="bee-button bee-button-primary">{t("homeExtra.contactUs")} <Arrow /></Link><Link to="/courses" className="bee-button bee-button-outline">{t("homeExtra.browseCourses")}</Link></div></div><div className="bee-benefits">{[[FiBookOpen,0],[FiLayers,1],[FiBriefcase,2],[FiTrendingUp,3]].map(([Icon,index])=><div key={index}><Icon /><span>{t(`homeExtra.businessBenefits.${index}`)}</span></div>)}</div></div>
          </div>
        </section>

        <section className="bee-section bee-section-soft" id="solutions">
          <div className="bee-container bee-solutions-layout"><div><span className="bee-eyebrow">{t("homeExtra.solutionsEyebrow")}</span><h2 className="bee-section-title">{t("homeExtra.solutionsTitle")}</h2><p className="bee-section-description">{t("homeExtra.solutionsDescription")}</p><Link to="/about" className="bee-text-link">{t("homeExtra.discoverPlatform")} <Arrow /></Link></div><div className="bee-solutions-grid">{[FiBookOpen, FiTrendingUp, FiMonitor, FiLayers].map((Icon,index)=><div className="bee-solution-item" key={index}><Icon /><h3>{t(`homeExtra.solutions.${index}`)}</h3></div>)}</div></div>
        </section>

        <section className="bee-section" id="learn-anywhere">
          <div className="bee-container bee-learn-layout"><div className="bee-device" aria-hidden="true"><div className="bee-device-screen"><img src="/assets/platform-logo.png" alt="" loading="lazy" /><span className="bee-device-line" /><span className="bee-device-line short" /><span className="bee-device-play"><FiPlayCircle /></span><span className="bee-device-line" /></div></div><div><span className="bee-eyebrow">{t("homeExtra.learnAnywhereEyebrow")}</span><h2 className="bee-section-title">{t("homeExtra.learnAnywhereTitle")}</h2><p className="bee-section-description">{t("homeExtra.learnAnywhereDescription")}</p><ul className="bee-learn-list">{["accessCourses","learnFromDevices","learnAtYourPace"].map((key)=><li key={key}><FiCheck /> {t(`homeExtra.${key}`)}</li>)}</ul><Link to="/courses" className="bee-button bee-button-primary">{t("homeExtra.browseCourses")} <Arrow /></Link></div></div>
        </section>

        <section className="bee-final-cta"><div className="bee-container"><span className="bee-cta-kicker">{t("homeExtra.nextStep")}</span><h2>{t("homeExtra.finalCtaTitle")}</h2><p>{t("homeExtra.finalCtaDescription")}</p><Link to="/courses" className="bee-button bee-button-white">{t("homeExtra.startLearning")} <Arrow /></Link></div></section>
      </main>
      <Footer />

      {authModal.isOpen && <div className="auth-modal-overlay" onClick={closeAuth}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><div className="auth-modal-header"><button type="button" className="auth-modal-close" onClick={closeAuth} aria-label="إغلاق"><FiX /></button><h2>أهلاً بك في BeePro</h2><p>سجّل الدخول أو أنشئ حسابك وابدأ التعلّم</p></div><div className="auth-modal-body"><AuthTabs compact initialTab={authModal.tab} redirectTo={redirectTo} onAuthenticated={closeAuth} /></div></div></div>}
    </div>
  );
};

const SectionHeading = ({ eyebrow, title, description, link, t }) => <div className="bee-section-heading"><div><span className="bee-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{link && <Link to={link} className="bee-text-link">{t("homeExtra.viewAll")} <FiArrowLeft /></Link>}</div>;

const EmptyState = ({ t, loading, error, onRetry }) => (
  <div className={`bee-empty${error ? " bee-empty-error" : ""}`}>
    {loading ? (
      "جارٍ تحميل الدورات..."
    ) : error ? (
      <>
        <strong>{t("homeExtra.loadError")}</strong>
        <span>{error.message}</span>
        <button type="button" className="bee-empty-retry" onClick={onRetry}>
          {t("homeExtra.retry")}
        </button>
      </>
    ) : (
      t("homeExtra.emptyCourses")
    )}
  </div>
);

export default LandingPage;
