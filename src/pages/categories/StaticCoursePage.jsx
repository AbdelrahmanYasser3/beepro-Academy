import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { getLearningCategory, getStaticCourse } from "../../data/learningCategories";
import "./CategoryPage.css";

const StaticCoursePage = () => {
  const { categorySlug, slug } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const isArabic = language === "ar";
  const course = getStaticCourse(slug, categorySlug);
  const category = getLearningCategory(categorySlug);

  if (!course || !category) {
    return (
      <div className="category-courses-empty static-course-page" dir={isArabic ? "rtl" : "ltr"}>
        <p>{isArabic ? "الدورة غير موجودة." : "Course not found."}</p>
        <Link to="/courses" className="category-course-btn">
          {isArabic ? "تصفح الدورات" : "Browse courses"}
        </Link>
      </div>
    );
  }

  const title = isArabic ? course.titleAr : course.title;
  const description = isArabic ? course.descriptionAr : course.description;
  const tags = isArabic ? course.tagsAr : course.tags;

  return (
    <main className="static-course-page" dir={isArabic ? "rtl" : "ltr"}>
      <article className="static-course-content">
        <img className="static-course-image" src={course.image} alt="" />
        <span className="category-course-level">
          {t(`course.level.${course.level}`, {
            defaultValue: isArabic ? "مستوى تجريبي" : course.level,
          })}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>

        <div className="static-course-meta">
          <span>
            {course.duration} {t("course.hours", { defaultValue: isArabic ? "ساعة" : "hours" })}
          </span>
          <span>
            {course.lessonsCount} {t("course.lessons", { defaultValue: isArabic ? "درس" : "lessons" })}
          </span>
          <span>{isArabic ? course.instructor.name : course.instructor.nameEn}</span>
        </div>

        <div className="category-learning-grid">
          {tags.map((tag) => (
            <span key={tag} className="category-hero-tag">
              {tag}
            </span>
          ))}
        </div>

        <p className="static-course-note">
          {isArabic
            ? "هذا محتوى تجريبي ثابت للعرض فقط. التسجيل والدفع وتتبع التقدم غير متاحة لهذه الدورة."
            : "This is demo static content for presentation only. Enrollment, payment, and progress tracking are unavailable for this course."}
        </p>
        <Link to={`/categories/${category.slug}`} className="category-course-btn">
          {isArabic ? `العودة إلى ${category.titleAr}` : `Back to ${category.title}`}
        </Link>
      </article>
    </main>
  );
};

export default StaticCoursePage;
