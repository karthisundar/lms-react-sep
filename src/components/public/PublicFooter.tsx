// src/components/public/PublicFooter.tsx
import { Link } from 'react-router-dom';
import { Code as Code2, Mail, Phone, MapPin, ShieldCheck, Award, BookOpen, ExternalLink, Heart } from 'lucide-react';
import { coursesData } from '@/data/coursesData';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: About & Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                  CodeClass
                </span>
                <span className="text-[10px] font-medium tracking-wide uppercase text-brand-600 dark:text-brand-400">
                  School of Tech & AI
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Industry-aligned professional technology education. Build production-grade skills in Data Science, Generative AI, Full Stack Development, Cloud & Cybersecurity through practical, hands-on learning.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Verified Curriculum
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Award className="h-4 w-4 text-brand-500" />
                Industry Certified
              </span>
            </div>
          </div>

          {/* Col 2: Technology Programs */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-900 dark:text-white">
              Technology Programs
            </h3>
            <ul className="mt-4 space-y-2.5">
              {coursesData.slice(0, 5).map((course) => (
                <li key={course.id}>
                  <Link
                    to={course.route}
                    className="text-sm text-gray-600 transition-colors hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 line-clamp-1"
                  >
                    {course.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                >
                  <span>View All 7 Programs</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation & Platform */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-900 dark:text-white">
              Platform & Learning
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  All Courses Directory
                </Link>
              </li>
              <li>
                <a href="/#benefits" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Learning Benefits
                </a>
              </li>
              <li>
                <a href="/#process" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  4-Step Learning Process
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <a href="/#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Admissions & Mentorship
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Support */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-900 dark:text-white">
              Contact & Support
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 shrink-0" />
                <span>Global Technology Learning Campus, Online & Hybrid Hubs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span>admissions@codeclass.edu</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span>+1 (800) 555-TECH</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-200 pt-8 sm:flex sm:items-center sm:justify-between dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; {currentYear} CodeClass. All rights reserved. Professional Technology & AI Learning Platform.
          </p>
          <div className="mt-4 flex space-x-6 sm:mt-0 text-xs text-gray-500 dark:text-gray-400">
            <span className="hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</span>
            <span className="hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</span>
            <span className="hover:text-gray-700 dark:hover:text-gray-300">Honor Code</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
