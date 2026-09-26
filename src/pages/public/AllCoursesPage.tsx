// src/pages/public/AllCoursesPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Sparkles, Layers, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import CourseCard from '@/components/public/CourseCard';
import { coursesData, courseCategories } from '@/data/coursesData';

export default function AllCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Keep query params in sync if changed from outside
  useEffect(() => {
    const cat = searchParams.get('category') || 'all';
    setSelectedCategory(cat);
  }, [searchParams]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    if (slug === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: slug });
    }
  };

  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) => {
      // Category match
      const matchesCategory =
        selectedCategory === 'all' || course.categorySlug === selectedCategory;

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        course.highlights.some((h) => h.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicHeader />

      {/* Page Hero Header */}
      <section className="relative border-b border-gray-200/80 bg-gradient-to-b from-gray-50/80 to-white py-14 sm:py-18 dark:border-gray-800 dark:from-gray-900/60 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">
            <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Courses</span>
          </nav>

          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
              All Courses
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
              Explore our professional technology and AI learning programs. Built for practical engineering competence, enterprise architecture, and career progression.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-8 max-w-xl">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by course title, technology, or topic..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm placeholder-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
            {courseCategories.map((category) => {
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Results count & active query indicators */}
          <div className="mt-6 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Showing <strong className="text-gray-900 dark:text-white">{filteredCourses.length}</strong> of{' '}
              {coursesData.length} programs
            </span>
            {(selectedCategory !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  searchParams.delete('category');
                  setSearchParams(searchParams);
                }}
                className="text-brand-600 hover:underline dark:text-brand-400"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Course Cards Grid */}
          {filteredCourses.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-800">
              <BookOpen className="h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                No matching courses found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search query or switching to another category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn-secondary mt-5"
              >
                View All Courses
              </button>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
