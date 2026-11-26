import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { getLearningCategory, getStaticCourse } from "../../data/learningCategories";
import {
  FiArrowLeft,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiPlayCircle,
  FiUser,
} from "react-icons/fi";
import "./StaticCoursePage.css";

const StaticCoursePageView = () => {
  const { categorySlug, slug } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isArabic = language === "ar";
  const course = getStaticCourse(slug, categorySlug);
  const category = getLearningCategory(categorySlug);
  const BackIcon = isArabic ? FiArrowRight : FiArrowLeft;
  const NextIcon = isArabic ? FiArrowLeft : FiArrowRight;

  if (!course || !category) {
    return (
      <main className="static-course-page" dir={isArabic ? "rtl" : "ltr"}>
        <section className="static-course-not-found">
          <p>{isArabic ? "الدورة غير موجودة." : "Course not found."}</p>
          <Link to="/courses" className="static-course-button static-course-button-primary">
            {isArabic ? "تصفح الدورات" : "Browse courses"}
            <NextIcon aria-hidden="true" />
          </Link>
        </section>
      </main>
    );
  }

  const title = isArabic ? course.titleAr : course.title;
  const description = isArabic ? course.descriptionAr : course.description;
  const tags = isArabic ? course.tagsAr : course.tags;
  const categoryTitle = isArabic ? category.titleAr : category.title;
  const instructor = isArabic ? course.instructor.name : course.instructor.nameEn;
  const level = t(`course.level.${course.level}`, { defaultValue: course.level });
  const backLabel = isArabic ? `العودة إلى ${categoryTitle}` : `Back to ${categoryTitle}`;
  const curriculum = Array.isArray(course.curriculum) && course.curriculum.length
    ? course.curriculum
    : Array.isArray(course.sections) && course.sections.length
      ? course.sections
      : [];

  return (
    <main className="static-course-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="static-course-hero">
        <div className="static-course-hero-inner">
          <Link to={`/categories/${category.slug}`} className="static-course-back-link">
            <BackIcon aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>

          <div className="static-course-hero-grid">
            <div className="static-course-copy">
              <div className="static-course-eyebrow">
                <span>{categoryTitle}</span>
                <span className="static-course-eyebrow-dot" aria-hidden="true" />
                <span>{isArabic ? "مسار تعليمي" : "Learning path"}</span>
              </div>

              <div className="static-course-badges">
                <span className="static-course-level-badge">{level}</span>
                <span className="static-course-demo-badge">
                  {isArabic ? "دورة تجريبية" : "Sample course"}
                </span>
              </div>

              <h1>{title}</h1>
              <p className="static-course-description">{description}</p>

              <div className="static-course-meta" aria-label={isArabic ? "معلومات الدورة" : "Course details"}>
                <div className="static-course-meta-item">
                  <span className="static-course-meta-icon"><FiClock aria-hidden="true" /></span>
                  <span>
                    <strong>{course.duration} {isArabic ? "ساعة" : "hours"}</strong>
                    <small>{isArabic ? "المدة التقديرية" : "Estimated duration"}</small>
                  </span>
                </div>
                <div className="static-course-meta-item">
                  <span className="static-course-meta-icon"><FiBookOpen aria-hidden="true" /></span>
                  <span>
                    <strong>{course.lessonsCount} {isArabic ? "درس" : "lessons"}</strong>
                    <small>{isArabic ? "دروس الدورة" : "Course lessons"}</small>
                  </span>
                </div>
                <div className="static-course-meta-item">
                  <span className="static-course-meta-icon"><FiUser aria-hidden="true" /></span>
                  <span>
                    <strong>{instructor}</strong>
                    <small>{isArabic ? "المدرب" : "Instructor"}</small>
                  </span>
                </div>
              </div>

              <Link to={`/categories/${category.slug}`} className="static-course-button static-course-button-primary static-course-hero-button">
                {backLabel}
                <NextIcon aria-hidden="true" />
              </Link>
            </div>

            <figure className="static-course-media">
              <img className="static-course-image" src={course.image} alt={title} />
              <figcaption className="static-course-image-caption">
                <span className="static-course-play-icon"><FiPlayCircle aria-hidden="true" /></span>
                <span>{isArabic ? "تعلم وفق وتيرتك" : "Learn at your own pace"}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="static-course-content-section">
        <div className="static-course-content-grid">
          <article className="static-course-info-card">
            <div className="static-course-section-heading">
              <span className="static-course-section-icon"><FiBookOpen aria-hidden="true" /></span>
              <div>
                <p className="static-course-section-kicker">{isArabic ? "نظرة عامة" : "Course overview"}</p>
                <h2>{isArabic ? "عن هذه الدورة" : "About this course"}</h2>
              </div>
            </div>
            <p className="static-course-overview-copy">{description}</p>

            {tags?.length > 0 && (
              <div className="static-course-topics-block">
                <h3>{isArabic ? "الموضوعات التي ستتعلمها" : "Topics covered"}</h3>
                <div className="static-course-tags">
                  {tags.map((tag) => (
                    <span className="static-course-tag" key={tag}>
                      <FiCheckCircle aria-hidden="true" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="static-course-summary-card">
            <p className="static-course-section-kicker">{isArabic ? "معلومات الدورة" : "Course information"}</p>
            <h2>{isArabic ? "خطتك التعليمية" : "Your learning plan"}</h2>
            <dl className="static-course-summary-list">
              <div><dt>{isArabic ? "المستوى" : "Level"}</dt><dd>{level}</dd></div>
              <div><dt>{isArabic ? "المدة" : "Duration"}</dt><dd>{course.duration} {isArabic ? "ساعة" : "hours"}</dd></div>
              <div><dt>{isArabic ? "عدد الدروس" : "Lessons"}</dt><dd>{course.lessonsCount}</dd></div>
              <div><dt>{isArabic ? "المدرب" : "Instructor"}</dt><dd>{instructor}</dd></div>
            </dl>
            <Link to={`/categories/${category.slug}`} className="static-course-button static-course-button-outline">
              {backLabel}
              <NextIcon aria-hidden="true" />
            </Link>
          </aside>

          {curriculum.length > 0 && (
            <section className="static-course-curriculum-card">
              <div className="static-course-section-heading">
                <span className="static-course-section-icon"><FiPlayCircle aria-hidden="true" /></span>
                <div>
                  <p className="static-course-section-kicker">{isArabic ? "محتوى الدورة" : "Course content"}</p>
                  <h2>{isArabic ? "المنهج" : "Curriculum"}</h2>
                </div>
              </div>
              <div className="static-course-curriculum-list">
                {curriculum.map((section, index) => {
                  const lessons = Array.isArray(section.lessons) ? section.lessons : [];
                  return (
                    <div className="static-course-curriculum-row" key={section.id || section.title || index}>
                      <div className="static-course-curriculum-title">
                        <span>{index + 1}</span>
                        <strong>{section.title || section.name || (isArabic ? `الوحدة ${index + 1}` : `Module ${index + 1}`)}</strong>
                      </div>
                      {lessons.length > 0 && (
                        <ul>
                          {lessons.map((lesson, lessonIndex) => (
                            <li key={lesson.id || lesson.title || lessonIndex}>
                              <FiPlayCircle aria-hidden="true" />
                              {typeof lesson === "string" ? lesson : lesson.title || lesson.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
};

export default StaticCoursePageView;
