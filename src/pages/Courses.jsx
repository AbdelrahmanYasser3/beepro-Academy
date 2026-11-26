import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import CourseCard from "../components/ui/CourseCard";
import {
  categoryService,
  courseService,
  enrollmentService,
} from "../services/api";
import {
  formatCourseForCard,
  isCoursePublishedAndApproved,
} from "../lib/backendFormatters";
import {
  FiSearch,
  FiGlobe,
  FiBarChart2,
  FiGrid,
  FiList,
  FiX,
  FiLoader,
  FiBookOpen,
} from "react-icons/fi";
import { learningCategories } from "../data/learningCategories";

const VIEW_MODE_STORAGE_KEY = "beepro:courses:view-mode";
const PAGE_SIZE = 10;
const staticCourses = learningCategories.flatMap((category) =>
  category.courses.map((course) => ({
    ...course,
    title: course.titleAr,
    titleEn: course.title,
    description: course.descriptionAr,
    descriptionEn: course.description,
    category: category.id,
    categoryName: category.titleAr,
    categoryNameEn: category.title,
    lessons: course.lessonsCount,
    isStatic: true,
    isDemo: true,
    href: `/categories/${category.slug}/courses/${course.slug}`,
  })),
);
const staticCategoryRecords = learningCategories.map((category) => ({
  id: category.id,
  name: category.titleAr,
  nameEn: category.title,
}));

const normalizeCategoryId = (category) => {
  if (!category) return "";

  if (typeof category === "object") {
    return normalizeCategoryId(
      category.id ||
        category.category_id ||
        category.categoryId ||
        category.slug ||
        category.value ||
        category.name ||
        category.name_en,
    );
  }

  const map = {
    finance: "financial_markets",
    financial: "financial_markets",
    data: "data_analysis",
    it: "it",
    programming: "programming",
    design: "design",
  };

  return map[String(category).toLowerCase()] || String(category);
};

const normalizeCategoryRecord = (category) => {
  if (!category) return null;

  const id = normalizeCategoryId(category);
  if (!id) return null;

  return {
    id,
    name: category.name || category.title || category.label || id,
    nameEn:
      category.name_en ||
      category.nameEn ||
      category.title_en ||
      category.titleEn ||
      category.label_en ||
      category.labelEn ||
      category.name ||
      category.title ||
      category.label ||
      id,
  };
};

const getCategoryLabel = (category, isArabic) => {
  if (!category) return "";
  return isArabic ? category.name : category.nameEn;
};

const readViewMode = () => {
  if (typeof window === "undefined") return "grid";
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "list" ? "list" : "grid";
};

const buildProgressMap = (rows) =>
  rows.reduce((acc, row) => {
    const courseId =
      row?.course_id || row?.courseId || row?.course?.id || row?.Course?.id;
    if (!courseId) return acc;

    const progress = Number(
      row?.progress ||
        row?.percentage ||
        row?.completion ||
        row?.completion_percentage ||
        0,
    );
    acc[courseId] = Number.isFinite(progress) ? progress : 0;
    return acc;
  }, {});

const Courses = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const isArabic = language === "ar";
  const [searchParams, setSearchParams] = useSearchParams();

  const [courses, setCourses] = useState(staticCourses);
  const [backendCategories, setBackendCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    () => normalizeCategoryId(searchParams.get("category")) || "all",
  );
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState(readViewMode);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const [courseResult, categoriesResult, enrollmentRows] =
        await Promise.all([
          courseService.getCourses({ throwOnError: true }),
          categoryService.getCategories(),
          isAuthenticated
            ? enrollmentService.getUserEnrollments()
            : Promise.resolve([]),
        ]);

      const rows = courseResult?.data || [];
      const normalizedCategories = (categoriesResult || [])
        .map(normalizeCategoryRecord)
        .filter(Boolean);
      const categoryMap = new Map(
        normalizedCategories.map((category) => [category.id, category]),
      );
      const progressMap = buildProgressMap(enrollmentRows || []);

      const formattedCourses = rows
        .filter((course) => isCoursePublishedAndApproved(course))
        .map((course) => {
          const formatted = formatCourseForCard(course);
          const categoryId = normalizeCategoryId(
            course.category ||
              course.category_id ||
              course.categoryId ||
              course.category_slug ||
              course.categorySlug,
          );
          const category = categoryMap.get(categoryId);
          const categoryName =
            course.category?.name ||
            course.category_name ||
            course.categoryName ||
            category?.name ||
            categoryId;
          const categoryNameEn =
            course.category?.name_en ||
            course.category?.nameEn ||
            course.category_name_en ||
            course.categoryNameEn ||
            category?.nameEn ||
            categoryName;

          return {
            ...formatted,
            category: categoryId,
            categoryName,
            categoryNameEn,
            progress:
              progressMap[formatted.id] !== undefined
                ? progressMap[formatted.id]
                : null,
          };
        });

      setCourses([...staticCourses, ...formattedCourses]);
      setBackendCategories(normalizedCategories);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses(staticCourses);
      setBackendCategories([]);
      setLoadError(
        t("courses.loadError", {
          defaultValue: "We couldn't load the courses. Please try again.",
        }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, t]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    const queryCategory =
      normalizeCategoryId(searchParams.get("category")) || "all";
    setSelectedCategory((current) =>
      current === queryCategory ? current : queryCategory,
    );
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const categories = useMemo(() => {
    const courseCounts = courses.reduce((acc, course) => {
      const categoryId =
        normalizeCategoryId(course.category) || "uncategorized";
      acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {});

    const mergedCategories = [...staticCategoryRecords, ...backendCategories].reduce(
      (result, category) => {
        const normalized = normalizeCategoryRecord(category);
        if (normalized && !result.some((item) => item.id === normalized.id)) {
          result.push(normalized);
        }
        return result;
      },
      [],
    );

    return [
      {
        id: "all",
        name: t("courses.all"),
        nameEn: t("courses.all"),
        courseCount: courses.length,
      },
      ...mergedCategories.map((category) => ({
        ...category,
        courseCount: courseCounts[category.id] || 0,
      })),
    ];
  }, [backendCategories, courses, t]);

  const sortOptions = [
    { value: "newest", label: t("courses.sort.newest") },
    {
      value: "oldest",
      label: t("courses.sort.oldest", { defaultValue: "Oldest" }),
    },
    {
      value: "title-asc",
      label: t("courses.sort.alphaAsc", { defaultValue: "A-Z" }),
    },
    {
      value: "title-desc",
      label: t("courses.sort.alphaDesc", { defaultValue: "Z-A" }),
    },
  ];

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = [...courses];

    if (query) {
      result = result.filter((course) => {
        const title = (course.title || "").toLowerCase();
        const titleEn = (course.titleEn || "").toLowerCase();
        return title.includes(query) || titleEn.includes(query);
      });
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (course) => normalizeCategoryId(course.category) === selectedCategory,
      );
    }

    switch (sortBy) {
      case "oldest":
        result.sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
        );
        break;
      case "title-asc":
        result.sort((a, b) => {
          const titleA = isArabic
            ? a.title || a.titleEn || ""
            : a.titleEn || a.title || "";
          const titleB = isArabic
            ? b.title || b.titleEn || ""
            : b.titleEn || b.title || "";
          return titleA.localeCompare(titleB);
        });
        break;
      case "title-desc":
        result.sort((a, b) => {
          const titleA = isArabic
            ? a.title || a.titleEn || ""
            : a.titleEn || a.title || "";
          const titleB = isArabic
            ? b.title || b.titleEn || ""
            : b.titleEn || b.title || "";
          return titleB.localeCompare(titleA);
        });
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    }

    return result;
  }, [courses, isArabic, searchQuery, selectedCategory, sortBy]);

  const totalCourses = courses.length;
  const totalFilteredCourses = filteredCourses.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCourses / PAGE_SIZE));
  const paginatedCourses = useMemo(
    () =>
      filteredCourses.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredCourses],
  );
  const visibleCount = Math.min(currentPage * PAGE_SIZE, totalFilteredCourses);

  const handleCategoryChange = (category) => {
    const normalizedCategory = normalizeCategoryId(category) || "all";
    setSelectedCategory(normalizedCategory);
    if (normalizedCategory === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: normalizedCategory });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) || selectedCategory !== "all" || sortBy !== "newest";

  const goToPreviousPage = () =>
    setCurrentPage((page) => Math.max(1, page - 1));
  const goToNextPage = () =>
    setCurrentPage((page) => Math.min(totalPages, page + 1));

  return (
    <div className="bepro-page pt-6 pb-16 sm:pt-8">
      <section className="py-8 sm:py-10">
        <div className="bepro-container">
          <div className="text-center">
            <h1 className="mb-3 break-words px-2 text-3xl font-bold text-[#172B4D] sm:text-4xl md:text-5xl">
              {t("courses.title")}
            </h1>
            <p className="mx-auto max-w-3xl px-2 text-base font-medium text-[#475569] sm:text-lg md:text-xl">
              {t("courses.discoverOurCoursesInFinancialM")}
            </p>
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="bepro-container grid gap-4 md:grid-cols-2">
          {learningCategories.map((category) => {
            const CategoryIcon = category.icon === "globe" ? FiGlobe : FiBarChart2;
            const topics = isArabic ? category.topicsAr : category.topics;

            return (
              <Link
                key={category.id}
                to={`/categories/${category.slug}`}
                className="bepro-card group block p-5 transition duration-200 hover:-translate-y-1 hover:border-[#1769E0] sm:p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EAF3FF] text-[#1769E0]">
                    <CategoryIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-[#172B4D] group-hover:text-[#1769E0]">
                      {isArabic ? category.titleAr : category.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#475569]">
                      {isArabic ? category.descriptionAr : category.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topics.slice(0, 4).map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-medium text-[#475569]"
                    >
                      {topic}
                    </span>
                  ))}
                  <span className="rounded-full bg-[#FFF7E6] px-3 py-1 text-xs font-semibold text-[#9A6700]">
                    {isArabic ? "محتوى تجريبي" : "Demo content"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pb-8">
        <div className="bepro-container">
          <div className="flex flex-wrap justify-center gap-2.5">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`rounded-full border px-5 py-2.5 font-semibold transition-all ${selectedCategory === category.id ? "border-[#1769E0] bg-[#1769E0] text-white shadow-sm" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#1769E0] hover:text-[#0D47A1]"}`}
                type="button"
              >
                {getCategoryLabel(category, isArabic)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-8">
        <div className="bepro-container">
          <div className="bepro-card p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <FiSearch className="pointer-events-none absolute start-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  placeholder={t("courses.search")}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                    className="form-input h-12 border-[#E2E8F0] bg-white ps-12 text-[#172B4D] placeholder:text-[#64748B]"
                />
                </div>
                <div className="flex shrink-0 items-center self-start overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`inline-flex h-12 w-12 items-center justify-center transition-colors ${viewMode === "grid" ? "bg-[#1769E0] text-white" : "text-[#475569] hover:bg-[#F5F7FA]"}`}
                    aria-label={t("courses.gridView", { defaultValue: "Grid view" })}
                    type="button"
                  >
                    <FiGrid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`inline-flex h-12 w-12 items-center justify-center transition-colors ${viewMode === "list" ? "bg-[#1769E0] text-white" : "text-[#475569] hover:bg-[#F5F7FA]"}`}
                    aria-label={t("courses.listView", { defaultValue: "List view" })}
                    type="button"
                  >
                    <FiList className="h-5 w-5" />
                  </button>
                </div>
              </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-secondary-200 dark:border-dark-border">
                {searchQuery && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-500/30 dark:text-white rounded-full text-sm flex items-center gap-2">
                    &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery("")} type="button">
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-500/30 dark:text-white rounded-full text-sm flex items-center gap-2">
                    {getCategoryLabel(
                      categories.find(
                        (category) => category.id === selectedCategory,
                      ),
                      isArabic,
                    )}
                    <button
                      onClick={() => handleCategoryChange("all")}
                      type="button"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  type="button"
                >
                  {t("courses.clearAll")}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pb-4">
        <div className="bepro-container">
          <p className="font-bold text-[#172B4D]">
            {t("courses.showingCount", {
              defaultValue: "Showing {{visible}} of {{total}} courses",
              visible: visibleCount || totalFilteredCourses,
              total: totalFilteredCourses || totalCourses,
            })}
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="bepro-container">
          {isLoading && courses.length === 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5 animate-pulse"
                >
                  <div className="mb-4 aspect-video rounded-xl bg-[#F1F5F9]" />
                  <div className="mb-3 h-4 w-3/4 rounded bg-[#F1F5F9]" />
                  <div className="mb-2 h-3 w-1/2 rounded bg-[#F1F5F9]" />
                  <div className="mb-2 h-3 w-full rounded bg-[#F1F5F9]" />
                  <div className="mb-4 h-3 w-5/6 rounded bg-[#F1F5F9]" />
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-20 rounded bg-white/10" />
                    <div className="h-5 w-16 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError && courses.length === 0 ? (
            <div className="bepro-card py-16 text-center">
              <FiBookOpen className="mx-auto mb-5 h-12 w-12 text-[#1769E0]" />
              <h3 className="mb-3 text-2xl font-bold text-[#172B4D]">
                {t("courses.loadErrorTitle", { defaultValue: "Unable to load courses" })}
              </h3>
              <p className="mb-8 text-[#475569]">{loadError}</p>
              <button onClick={loadCourses} className="bepro-btn-primary" type="button">
                {t("common.retry", { defaultValue: "Retry" })}
              </button>
            </div>
          ) : paginatedCourses.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {paginatedCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CourseCard
                    course={course}
                    variant={viewMode === "list" ? "horizontal" : "default"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#EAF3FF]">
                <FiBookOpen className="h-12 w-12 text-[#1769E0]" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-[#172B4D]">
                {t(totalCourses === 0 ? "courses.noCourses" : "courses.noMatchingCourses", {
                  defaultValue:
                    totalCourses === 0 ? "No courses available." : "No matching courses found.",
                })}
              </h3>
              <p className="mb-8 font-bold text-[#475569]">
                {t(totalCourses === 0 ? "courses.noCoursesHint" : "courses.noMatchingCoursesHint", {
                  defaultValue:
                    totalCourses === 0
                      ? "New courses will appear here once they are published."
                      : "Try changing your search, category, or sort order.",
                })}
              </p>
              {totalCourses > 0 && (
                <button
                  onClick={clearFilters}
                  className="bepro-btn-primary"
                  type="button"
                >
                  {t("courses.clearFilters")}
                </button>
              )}
            </div>
          )}

          {totalFilteredCourses > PAGE_SIZE && (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-[#475569]">
                {t("courses.pageOf", {
                  defaultValue: "Page {{current}} of {{total}}",
                  current: currentPage,
                  total: totalPages,
                })}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-secondary-300 text-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-card transition-colors"
                >
                  {t("courses.previous", { defaultValue: "Previous" })}
                </button>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-secondary-300 text-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-card transition-colors"
                >
                  {t("courses.next", { defaultValue: "Next" })}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Courses;
