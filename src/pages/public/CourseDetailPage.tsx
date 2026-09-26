// src/pages/public/CourseDetailPage.tsx
import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  BarChart3,
  Award,
  Laptop,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowRight,
  ArrowLeft,
  Users,
  ShieldCheck,
  Sparkles,
  BookOpen,
  CirclePlay as PlayCircle,
  LogIn,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import { getCourseBySlug, getAllCourses } from '@/data/coursesData';
import { useAuth } from '@/context/AuthContext';

export default function CourseDetailPage() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const course = useMemo(() => {
    return courseSlug ? getCourseBySlug(courseSlug) : undefined;
  }, [courseSlug]);

  // Collapsible modules state: open all or individual
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({
    0: true, // open first module by default
    1: true,
  });

  const toggleModule = (index: number) => {
    setOpenModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleExpandAll = () => {
    if (!course) return;
    const allOpen: Record<number, boolean> = {};
    course.curriculum.forEach((_, idx) => {
      allOpen[idx] = true;
    });
    setOpenModules(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenModules({});
  };

  const handleStartLearning = () => {
    if (user) {
      // User is already authenticated: take directly to learning platform
      navigate(user.role === 'admin' ? '/admin' : '/sessions');
    } else {
      // Unauthenticated: navigate to login page
      navigate('/login');
    }
  };

  // 404 Course Not Found Fallback
  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <PublicHeader />
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <BookOpen className="h-16 w-16 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Course Program Not Found
          </h1>
          <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
            The course program you requested does not exist or has been moved.
          </p>
          <div className="mt-6 flex gap-4">
            <Link to="/courses" className="btn-primary">
              Browse All Courses
            </Link>
            <Link to="/" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const allModulesOpen =
    course.curriculum.length > 0 &&
    course.curriculum.every((_, idx) => !!openModules[idx]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-200/80 bg-gradient-to-b from-gray-50/90 via-gray-50/40 to-white pt-10 pb-16 lg:pt-14 lg:pb-20 dark:border-gray-800 dark:from-gray-900/70 dark:via-gray-900/30 dark:to-gray-950">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-[120px] dark:bg-brand-600/15" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-6">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">
              Home
            </Link>
            <span>/</span>
            <Link to="/courses" className="hover:text-brand-600 dark:hover:text-brand-400">
              Courses
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white truncate max-w-xs">{course.title}</span>
          </nav>

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Course Headline & CTAs */}
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {course.category}
                </span>
                {course.badge && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {course.badge}
                  </span>
                )}
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                  <Star className="h-4 w-4 fill-current text-amber-400" />
                  <span>{course.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({course.reviewsCount} reviews)</span>
                </div>
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-gray-900 dark:text-white leading-tight">
                {course.title}
              </h1>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                {course.longDescription || course.description}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="button"
                  onClick={handleStartLearning}
                  className="btn-primary h-12 w-full sm:w-auto px-8 text-base font-semibold shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Start Learning</span>
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={() => navigate(user.role === 'admin' ? '/admin' : '/sessions')}
                    className="btn-secondary h-12 w-full sm:w-auto px-6 text-base font-semibold"
                  >
                    <span>Go to My Sessions</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="btn-secondary h-12 w-full sm:w-auto px-6 text-base font-semibold"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Login to Continue</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Key Card Preview */}
            <div className="lg:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white text-xs font-semibold">
                    Interactive Online Cohort
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-4 w-4 text-brand-500" />
                      Duration
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {course.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BarChart3 className="h-4 w-4 text-brand-500" />
                      Skill Level
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {course.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Laptop className="h-4 w-4 text-brand-500" />
                      Learning Mode
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {course.mode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Award className="h-4 w-4 text-brand-500" />
                      Certification
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Included
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleStartLearning}
                      className="btn-primary w-full h-10 text-sm font-semibold justify-center"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Information Stat Strip */}
      <section className="border-b border-gray-200 bg-gray-50/70 py-6 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{course.duration}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Difficulty</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{course.level}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Format</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Hands-on Labs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Credential</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Verified Certificate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Course Details Body */}
      <main className="flex-1 py-14 lg:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-14">
              {/* Section 1: What You Will Learn */}
              <section>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    What You Will Learn
                  </h2>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Comprehensive skills and production-level competencies mastered throughout this program:
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                        {outcome}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 2: Course Curriculum */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 pb-4 dark:border-gray-800">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      Course Curriculum
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {course.curriculum.length} Structured In-Depth Modules • Industry Capstones
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={allModulesOpen ? handleCollapseAll : handleExpandAll}
                      className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                      {allModulesOpen ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-3.5">
                  {course.curriculum.map((module, index) => {
                    const isOpen = !!openModules[index];
                    return (
                      <div
                        key={index}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors dark:border-gray-800 dark:bg-gray-900"
                      >
                        <button
                          type="button"
                          onClick={() => toggleModule(index)}
                          className="flex w-full items-center justify-between p-4 text-left font-semibold text-gray-900 hover:bg-gray-50/80 dark:text-white dark:hover:bg-gray-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              {index + 1}
                            </span>
                            <div>
                              <span className="text-base font-semibold">{module.title}</span>
                              <p className="text-xs font-normal text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 italic">
                              {module.description}
                            </p>
                            <ul className="space-y-2">
                              {module.topics.map((topic, tIdx) => (
                                <li key={tIdx} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300">
                                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                                  <span>{topic}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 3: Target Audience & Prerequisites */}
              <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 sm:p-8 dark:border-gray-800 dark:bg-gray-900/60">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Who Should Take This Course?
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {course.targetAudience.map((audience, aIdx) => (
                    <li key={aIdx} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
                      <span>{audience}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Prerequisites:</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {course.prerequisites}
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar Column: Sticky Enrollment Box */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Program Summary
                </h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enroll today to access full lessons, code repositories and live cohorts.
                </p>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleStartLearning}
                    className="btn-primary w-full h-12 text-base font-semibold justify-center shadow-md shadow-brand-600/20"
                  >
                    <span>Start Learning</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {!user && (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="btn-secondary w-full h-11 text-sm font-semibold justify-center"
                    >
                      Login to Existing Account
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>30-Day Money-Back Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-brand-500" />
                    <span>Verified Completion Certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span>Private Community & Mentor Access</span>
                  </div>
                </div>

                {/* Other Programs quick links */}
                <div className="mt-8 border-t border-gray-100 pt-5 dark:border-gray-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                    Other Tech Programs
                  </h4>
                  <div className="space-y-2">
                    {getAllCourses()
                      .filter((c) => c.id !== course.id)
                      .slice(0, 3)
                      .map((c) => (
                        <Link
                          key={c.id}
                          to={c.route}
                          className="block rounded-lg p-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-gray-800/60 dark:hover:text-brand-400"
                        >
                          {c.title} &rarr;
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
