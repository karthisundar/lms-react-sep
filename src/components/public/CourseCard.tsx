// src/components/public/CourseCard.tsx
import { Link } from 'react-router-dom';
import { Clock, BarChart3, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Course } from '@/data/coursesData';

interface CourseCardProps {
  course: Course;
  featured?: boolean;
}

export default function CourseCard({ course, featured = false }: CourseCardProps) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-gray-900 ${
        featured
          ? 'border-brand-200 shadow-md shadow-brand-500/5 dark:border-brand-900/60'
          : 'border-gray-200/90 shadow-sm dark:border-gray-800'
      }`}
    >
      {/* Course Banner Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
            {course.category}
          </span>
          {course.badge && (
            <span className="rounded-full bg-brand-600/90 px-2.5 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-md">
              {course.badge}
            </span>
          )}
        </div>

        {/* Rating overlay badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-amber-300 backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-current text-amber-400" />
          <span>{course.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Title */}
        <h3 className="text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          <Link to={course.route} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {course.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="mt-2.5 text-sm leading-relaxed text-gray-600 dark:text-gray-400 line-clamp-2">
          {course.description}
        </p>

        {/* Key Highlights list (first 2 highlights) */}
        {course.highlights && course.highlights.length > 0 && (
          <ul className="mt-3.5 space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
            {course.highlights.slice(0, 2).map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Metadata Footer */}
        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Clock className="h-3.5 w-3.5 text-brand-500" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <BarChart3 className="h-3.5 w-3.5 text-brand-500" />
              <span>{course.level}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {course.studentsCount} Students
            </span>
            <span className="relative z-10 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform group-hover:translate-x-1 dark:text-brand-400">
              <span>View Course</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
