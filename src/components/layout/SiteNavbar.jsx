import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getNavbarContext,
  getNavbarLinks,
  isNavLinkActive,
} from "../../lib/navbarConfig";
import {
  canAccessTeacherFeatures,
  getRoleLabel,
  isAdmin,
  resolveUserRole,
  shouldShowStudentChatBell,
} from "../../lib/roles";
import StudentNotificationsBell from "../notifications/StudentNotificationsBell";
import StudentChatBell from "../chat/StudentChatBell";
import {
  FiUser,
  FiLogOut,
  FiGrid,
  FiChevronDown,
  FiMessageCircle,
  FiSettings,
  FiGlobe,
  FiMenu,
  FiSearch,
  FiX,
} from "react-icons/fi";
import "./SiteNavbar.css";
import ImageWithFallback from "../ui/ImageWithFallback";

const navBarHeight = (scrolled) =>
  scrolled
    ? "h-[80px] md:h-[84px] lg:h-[88px]"
    : "h-[84px] md:h-[88px] lg:h-[96px]";

const logoHeight = (scrolled) =>
  scrolled
    ? "h-9 sm:h-10 md:h-11 lg:h-[52px]"
    : "h-10 sm:h-11 md:h-12 lg:h-[58px]";

const SiteNavbar = ({ onAuthClick }) => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const normalizedRole = resolveUserRole(user);
  const showChatBell = shouldShowStudentChatBell(user);
  const isTeacher = canAccessTeacherFeatures(normalizedRole);
  const isAdminUser = isAdmin(normalizedRole);

  const context = getNavbarContext(location.pathname, location.search);
  const navLinks = getNavbarLinks(context, {
    language,
    isAdmin: isAdminUser,
    isTeacher,
    t,
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;

    const handlePointerDown = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsProfileOpen(false);
  };

  const displayName =
    user?.full_name || user?.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const roleLabel = getRoleLabel(normalizedRole, language);

  const handleAuthClick = (tab, role) => {
    setMobileMenuOpen(false);
    if (onAuthClick) {
      onAuthClick(tab, role);
      return;
    }
    const redirect = `${location.pathname}${location.search}`;
    const params = new URLSearchParams();
    if (redirect && redirect !== "/") params.set("redirect", redirect);
    if (role) params.set("role", role);
    const query = params.toString();
    navigate(`/${tab === "register" ? "register" : "login"}${query ? `?${query}` : ""}`);
  };

  const linkClass = (active, mobile = false) => {
    const base = mobile
      ? "flex w-full items-center rounded-xl px-4 py-3.5 text-sm font-medium transition-colors"
      : "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:px-4 lg:py-2.5";
    const state = active
      ? "bg-blue-50 text-[#1769e0]"
      : "text-slate-700 hover:bg-blue-50 hover:text-[#1769e0]";
    return `${base} ${state}`;
  };

  const renderNavLink = (link, index, mobile = false) => {
    const active = isNavLinkActive(link, {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
    const className = linkClass(active, mobile);

    if (link.type === "hash") {
      return (
        <a
          key={index}
          href={link.href}
          className={className}
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.label}
        </a>
      );
    }

    return (
      <Link
        key={index}
        to={link.href}
        className={className}
        onClick={() => setMobileMenuOpen(false)}
      >
        {link.label}
      </Link>
    );
  };

  const teachButtonClass =
    "inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:w-auto md:py-2 md:px-5";

  const loginButtonClass =
    "inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:w-auto md:py-2.5 md:px-6";

  const registerButtonClass =
    "inline-flex w-full items-center justify-center rounded-full bg-[#1769e0] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0d47a1] md:w-auto md:py-2.5 md:px-6";

  const renderAuthButtons = (mobile = false) => (
    <>
      <button
        type="button"
        className={teachButtonClass}
        onClick={() => handleAuthClick("register", "teacher")}
      >
        {t("nav.teach")}
      </button>
      <button
        type="button"
        className={loginButtonClass}
        onClick={() => handleAuthClick("login")}
      >
        {t("nav.login")}
      </button>
      <button
        type="button"
        className={registerButtonClass}
        onClick={() => handleAuthClick("register")}
      >
        {t("nav.register")}
      </button>
    </>
  );

  return (
    <header
      className={`site-navbar bee-navbar-light fixed top-0 inset-x-0 z-[1000] w-full max-w-[100vw] overflow-visible bg-white/95 shadow-[0_2px_14px_rgba(15,40,80,0.08)] transition-all duration-300 backdrop-blur-xl`}
    >
      <nav
        className={`mx-auto flex w-full max-w-full min-w-0 items-center justify-between gap-2 overflow-visible px-3 sm:px-4 md:gap-4 md:px-6 lg:px-10 ${navBarHeight(scrolled)}`}
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center overflow-hidden md:flex-none md:max-w-[280px] lg:max-w-[360px]"
        >
          <ImageWithFallback
            src="/assets/platform-logo-dark.svg"
            alt="BeePro Academy"
            className={`w-auto max-w-full object-contain object-start ${logoHeight(scrolled)}`}
            fallback="/assets/platform-logo-dark.svg"
          />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex lg:gap-2">
          {navLinks.map((link, index) => renderNavLink(link, index))}
        </div>

        <form className="bee-navbar-search hidden lg:flex" onSubmit={(event) => { event.preventDefault(); navigate(`/courses${courseSearch.trim() ? `?q=${encodeURIComponent(courseSearch.trim())}` : ""}`); }} role="search">
          <FiSearch aria-hidden="true" />
          <input aria-label={language === "ar" ? "ابحث عن دورة تدريبية، موضوع، أو مدرب" : "Search courses, topics, or instructors"} value={courseSearch} onChange={(event) => setCourseSearch(event.target.value)} placeholder={language === "ar" ? "ابحث عن دورة تدريبية، موضوع، أو مدرب" : "Search courses, topics, or instructors"} />
        </form>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="hidden items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 lg:inline-flex"
            onClick={toggleLanguage}
            title={language === "ar" ? t("language.switchToEnglish") : t("language.switchToArabic")}
            aria-label={language === "ar" ? t("language.switchToEnglish") : t("language.switchToArabic")}
          >
            <FiGlobe className="h-5 w-5" />
          </button>

          {isAuthenticated && (
            <div className="hidden items-center gap-1 md:flex">
              <StudentNotificationsBell />
              {showChatBell && <StudentChatBell />}
            </div>
          )}

          {isAuthenticated ? (
            <div
              className="relative hidden min-w-0 md:block"
              ref={profileMenuRef}
            >
              <button
                type="button"
                className="flex max-w-[220px] items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-2 py-1.5 text-[#172B4D] transition-colors hover:border-[#9BBFF4] hover:bg-[#EAF3FF] sm:px-3"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {user?.avatar_url ? (
                  <ImageWithFallback
                    src={user.avatar_url}
                    alt={displayName}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                    fallback="/assets/abdullah1.jpg"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500">
                    <FiUser className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="hidden max-w-[120px] truncate text-sm font-semibold lg:inline">
                  {displayName}
                </span>
                <FiChevronDown
                  className={`hidden h-4 w-4 shrink-0 transition-transform lg:block ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute end-0 top-[calc(100%+10px)] z-[1100] mt-1 w-56 max-w-[calc(100vw-2rem)] animate-slide-down overflow-visible rounded-xl border border-[#E2E8F0] bg-white shadow-[0_12px_40px_rgba(15,40,80,0.14)]">
                <div className="border-b border-[#E2E8F0] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[#172B4D]">
                      {displayName}
                    </p>
                    {displayEmail && (
                      <p className="mt-0.5 truncate text-xs text-[#64748B]">
                        {displayEmail}
                      </p>
                    )}
                    <span className="mt-2 inline-flex rounded-full bg-[#009ffd]/25 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[#00d9ff]">
                      {roleLabel}
                    </span>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#475569] transition-colors hover:bg-[#EAF3FF]"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FiGrid className="h-5 w-5" />
                    <span>{t("nav.dashboard")}</span>
                  </Link>
                  {showChatBell && (
                    <Link
                      to="/courses"
                      className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#475569] transition-colors hover:bg-[#EAF3FF]"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <FiMessageCircle className="h-5 w-5" />
                      <span>{t("dashboardExtra.instructorChat")}</span>
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#475569] transition-colors hover:bg-[#EAF3FF]"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FiUser className="h-5 w-5" />
                    <span>{t("nav.profile")}</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#475569] transition-colors hover:bg-[#EAF3FF]"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <FiSettings className="h-5 w-5" />
                    <span>{t("dashboard.settings")}</span>
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-[#ff8a8a] transition-colors hover:bg-red-500/15"
                    onClick={handleLogout}
                  >
                    <FiLogOut className="h-5 w-5" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex lg:gap-3">
              {renderAuthButtons()}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-20 shrink-0 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 md:hidden"
            aria-label={mobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div
          className="bee-mobile-menu md:hidden max-h-[calc(100dvh-84px)] overflow-y-auto overflow-x-hidden border-t border-slate-100 bg-white overscroll-contain"
          role="dialog"
          aria-modal="true"
          aria-label={t("navExtra.navigationMenu")}
        >
          <div className="flex flex-col gap-1 p-4">
            {navLinks.map((link, index) => renderNavLink(link, index, true))}

            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
            >
              <FiGlobe className="h-5 w-5" />
              {language === "ar" ? t("language.english") : t("language.arabic")}
            </button>

            {isAuthenticated && (
              <>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="mb-3 flex items-center gap-3 px-1">
                    {user?.avatar_url ? (
                      <ImageWithFallback
                        src={user.avatar_url}
                        alt={displayName}
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                        fallback="/assets/abdullah1.jpg"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500">
                        <FiUser className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {displayName}
                      </p>
                      {displayEmail && (
                        <p className="truncate text-xs text-[#64748B]">
                          {displayEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    className={linkClass(false, true)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiGrid className="me-2 h-5 w-5 shrink-0" />
                    {t("nav.dashboard")}
                  </Link>
                  {showChatBell && (
                    <Link
                      to="/courses"
                      className={linkClass(false, true)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiMessageCircle className="me-2 h-5 w-5 shrink-0" />
                      {t("dashboardExtra.instructorChat")}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className={linkClass(false, true)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiUser className="me-2 h-5 w-5 shrink-0" />
                    {t("nav.profile")}
                  </Link>
                  <Link
                    to="/settings"
                    className={linkClass(false, true)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiSettings className="me-2 h-5 w-5 shrink-0" />
                    {t("dashboard.settings")}
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center rounded-xl px-4 py-3.5 text-sm font-medium text-[#ff8a8a] transition-colors hover:bg-red-500/15"
                    onClick={handleLogout}
                  >
                    <FiLogOut className="me-2 h-5 w-5 shrink-0" />
                    {t("nav.logout")}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 px-1">
                  <StudentNotificationsBell />
                  {showChatBell && <StudentChatBell />}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                {renderAuthButtons(true)}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default SiteNavbar;
