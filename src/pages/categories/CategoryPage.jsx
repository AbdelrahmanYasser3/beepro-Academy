import React from "react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { courseService } from "../../services/api";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { parseUsdPrice } from "../../lib/currency";
import { isCoursePublishedAndApproved } from "../../lib/backendFormatters";
import CourseCard from "../../components/ui/CourseCard";
import CategoryCard from "../../components/ui/CategoryCard";
import SectionHeader from "../../components/ui/SectionHeader";
import { getLearningCategory } from "../../data/learningCategories";
import "./CategoryPage.css";

const CategoryPage = ({
  title,
  subtitle,
  description,
  backgroundImage,
  backgroundVideo,
  icon,
  color,
  categoryKey,
  features = [],
  learningAreas = [],
  titleKey,
  subtitleKey,
  descriptionKey,
  hideHeroContent = false,
}) => {
  const { t } = useTranslation();
  const { formatCoursePrice } = useCurrency();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [dbCourses, setDbCourses] = useState([]);
  const staticCategory = getLearningCategory(categoryKey);
  const displayFeatures = staticCategory
    ? isArabic
      ? staticCategory.topicsAr
      : staticCategory.topics
    : features;
  const displayLearningAreas = staticCategory
    ? isArabic
      ? staticCategory.topicsAr
      : staticCategory.topics
    : learningAreas;
  const displayTitle = staticCategory
    ? isArabic
      ? staticCategory.titleAr
      : staticCategory.title
    : titleKey
      ? t(titleKey, { defaultValue: title })
      : title;
  const displaySubtitle = staticCategory
    ? isArabic
      ? staticCategory.subtitleAr
      : staticCategory.subtitle
    : subtitleKey
      ? t(subtitleKey, { defaultValue: subtitle })
      : subtitle;
  const displayDescription = staticCategory
    ? isArabic
      ? staticCategory.descriptionAr
      : staticCategory.description
    : descriptionKey
      ? t(descriptionKey, { defaultValue: description })
      : description;

  const formatDisplayPrice = (price) => {
    if (price == null || price === "") return formatCoursePrice(0).full;
    return formatCoursePrice(parseUsdPrice(price)).full;
  };

  useEffect(() => {
    let isMounted = true;

    const loadCategoryCourses = async () => {
      if (!categoryKey || staticCategory) return;

      try {
        const { data } = await courseService.getCoursesByCategory(categoryKey);
        const published = (data || [])
          .filter((course) => isCoursePublishedAndApproved(course))
          .map((course) => ({
            id: course.id,
            title: course.title,
            level: course.level || "All Levels",
            duration: course.duration
              ? `${course.duration} hours`
              : "Self-paced",
            price: course.price ?? 0,
            image: course.thumbnail_url || `https://picsum.photos/seed/${course.slug}/400/200`,
          }));

        if (isMounted) {
          setDbCourses(published);
        }
      } catch (error) {
        if (isMounted) {
          setDbCourses([]);
        }
      }
    };

    loadCategoryCourses();

    return () => {
      isMounted = false;
    };
  }, [categoryKey, backgroundImage, staticCategory]);

  const displayCourses = staticCategory
    ? staticCategory.courses.map((course) => ({
        ...course,
          title: course.titleAr,
          titleEn: course.title,
          description: course.descriptionAr,
          descriptionEn: course.description,
          category: staticCategory.id,
        categoryName: staticCategory.titleAr,
        categoryNameEn: staticCategory.title,
        lessons: course.lessonsCount,
        isStatic: true,
        isDemo: true,
        href: `/categories/${staticCategory.slug}/courses/${course.slug}`,
      }))
    : dbCourses;

  return (
    <div className="category-page">
      {/* Hero Section */}
      <section className="category-hero" style={{ "--category-color": color }}>
        {backgroundVideo ? (
          <video
            className="category-hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster={backgroundImage}
          >
            <source src={backgroundVideo} type="video/mp4" />
          </video>
        ) : (
          <div
            className="category-hero-bg"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        <div className="category-hero-overlay" />
        {!hideHeroContent && (
          <div className="category-hero-content">
            <div className="category-hero-icon">{icon}</div>
            <h1 className="category-hero-title">{displayTitle}</h1>
            <p className="category-hero-subtitle">{displaySubtitle}</p>
            <p className="category-hero-description">{displayDescription}</p>
            <div className="category-hero-features">
              {displayFeatures.map((feature, idx) => (
                <span key={idx} className="category-hero-tag">
                  {staticCategory
                    ? feature
                    : feature.includes(".")
                      ? t(feature)
                      : feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Courses Grid Section */}
      <section
        className="category-courses-section"
        style={{ "--courses-bg-image": `url(${backgroundImage})` }}
      >
        <div className="category-courses-container">
          {displayLearningAreas.length > 0 && (
            <div className="category-learning-areas">
              <SectionHeader
                title={staticCategory ? isArabic ? "مجالات التعلم" : "Learning Areas" : t("category.learningAreas")}
                description={staticCategory ? isArabic ? "المهارات والموضوعات التي يغطيها هذا المسار التعليمي." : "Explore the skills and topics covered by this learning track." : t("category.learningAreasDescription")}
              />
              <div className="category-learning-grid">
                {displayLearningAreas.map((area) => (
                  <CategoryCard
                    key={area}
                    title={staticCategory ? area : t(area)}
                    description={staticCategory ? displayDescription : ""}
                    href={`/courses?category=${categoryKey}`}
                    icon={icon}
                    actionLabel={staticCategory ? isArabic ? "استكشف الدورات" : "Explore courses" : t("category.exploreTrack")}
                  />
                ))}
              </div>
            </div>
          )}
          <SectionHeader
            title={staticCategory ? isArabic ? "الدورات المتاحة" : "Available Courses" : t("category.availableCourses")}
            description={staticCategory ? isArabic ? "محتوى تعليمي تجريبي ثابت للتصفح والتعرّف على المسار." : "Browse sample static courses and explore this learning path." : t("category.exploreDesc")}
          />
          <div className="category-courses-grid">
            {displayCourses.length > 0 ? (
              displayCourses.map((course) => (
                <CourseCard key={course.id} course={course} variant="light" />
              ))
            ) : (
              <div className="category-courses-empty">
                <p>
                  {staticCategory
                    ? isArabic
                      ? "لا توجد دورات في هذا المسار حاليًا."
                      : "There are no courses in this track yet."
                    : t("category.empty")}
                </p>
                <Link to="/courses" className="category-course-btn">
                  {staticCategory
                    ? isArabic
                      ? "تصفح جميع الدورات"
                      : "Browse all courses"
                    : t("category.browseAll")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="category-cta-section"
        style={{ "--cta-color": color }}
      >
        <div className="category-cta-content">
          <h2>
            {staticCategory
              ? isArabic
                ? "ابدأ رحلة التعلم"
                : "Start your learning journey"
              : t("category.readyTitle")}
          </h2>
          <p>
            {staticCategory
              ? isArabic
                ? "استكشف المواد التجريبية وتعرّف على المهارات التي يغطيها هذا المسار."
                : "Explore the sample material and see which skills this track covers."
              : t("category.readyDesc")}
          </p>
          <div className="category-cta-buttons">
            <Link to="/register" className="category-cta-btn primary">
              {staticCategory
                ? isArabic
                  ? "إنشاء حساب"
                  : "Create an account"
                : t("category.getStarted")}
            </Link>
            <Link to="/contact" className="category-cta-btn secondary">
              {staticCategory
                ? isArabic
                  ? "تواصل معنا"
                  : "Contact us"
                : t("category.contactUs")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
