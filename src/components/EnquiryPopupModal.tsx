// src/components/EnquiryPopupModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Phone,
  Mail,
  User,
  BookOpen,
} from 'lucide-react';
import { submitContactEnquiry } from '@/services/contactService';

export interface EnquiryPopupModalProps {
  /**
   * Scroll percentage threshold (0.0 to 1.0).
   * Default is 0.40 (40% of the page's scrollable distance).
   */
  scrollThreshold?: number;
  /**
   * Optional pre-selected course name or subject.
   */
  defaultCourse?: string;
  /**
   * Optional custom source tracking string.
   */
  source?: string;
  /**
   * Optional manual control to open the modal (e.g. from an "Enquire Now" button).
   */
  isOpen?: boolean;
  /**
   * Callback when modal is closed.
   */
  onClose?: () => void;
}

const STORAGE_KEY_DISMISSED = 'cc_enquiry_dismissed';
const STORAGE_KEY_SUBMITTED = 'cc_enquiry_submitted';

const AVAILABLE_COURSES = [
  'Full Stack Web Development',
  'Generative AI & Agentic AI',
  'Data Science & Artificial Intelligence',
  'Cloud Architecture & DevOps',
  'Cyber Security & Ethical Hacking',
  'Enterprise Data Engineering',
  'Other / General Enquiry',
];

export default function EnquiryPopupModal({
  scrollThreshold = 0.40,
  defaultCourse = '',
  source,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: EnquiryPopupModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(defaultCourse || AVAILABLE_COURSES[0]);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  // Update subject if defaultCourse prop changes
  useEffect(() => {
    if (defaultCourse) {
      setSubject(defaultCourse);
    }
  }, [defaultCourse]);

  // Sync with controlled isOpen if provided
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        hasTriggeredRef.current = true;
      }
    }
  }, [controlledIsOpen]);

  // Check session storage on mount
  const isSessionBlocked = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      const dismissed = sessionStorage.getItem(STORAGE_KEY_DISMISSED);
      const alreadySubmitted = sessionStorage.getItem(STORAGE_KEY_SUBMITTED);
      return Boolean(dismissed || alreadySubmitted);
    } catch {
      return false;
    }
  }, []);

  // Scroll listener logic
  useEffect(() => {
    // If modal is manually controlled or already blocked by session, do nothing
    if (controlledIsOpen !== undefined || isSessionBlocked() || hasTriggeredRef.current) {
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (hasTriggeredRef.current || isSessionBlocked()) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollHeight =
            document.documentElement.scrollHeight - window.innerHeight;

          if (scrollHeight > 100) {
            const currentRatio = scrollTop / scrollHeight;
            if (currentRatio >= scrollThreshold) {
              hasTriggeredRef.current = true;
              setIsOpen(true);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold, controlledIsOpen, isSessionBlocked]);

  // Accessible keyboard ESC listener & focus management
  useEffect(() => {
    if (!isOpen) return;

    // Focus first input upon opening
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 150);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Dismiss modal
  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
    } catch {
      // ignore storage error
    }
    if (controlledOnClose) {
      controlledOnClose();
    }
  };

  // Form validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    } else if (name.trim().length > 150) {
      errors.name = 'Full name cannot exceed 150 characters.';
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    } else if (email.trim().length > 254) {
      errors.email = 'Email address cannot exceed 254 characters.';
    }

    if (phone.trim()) {
      if (phone.trim().length > 30) {
        errors.phone = 'Phone number cannot exceed 30 characters.';
      } else if (!/^[+0-9\s()\-\.]+$/.test(phone.trim())) {
        errors.phone = 'Phone number contains invalid characters.';
      }
    }

    if (!message.trim() || message.trim().length < 5) {
      errors.message = 'Please provide a message or inquiry (at least 5 characters).';
    } else if (message.trim().length > 5000) {
      errors.message = 'Message cannot exceed 5000 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Honeypot check for bots
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      const currentPath =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '';

      const res = await submitContactEnquiry({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
        source: source || currentPath || 'scroll_triggered_popup',
      });

      if (res.success) {
        setSubmitted(true);
        setSubmittedId(res.data?.id || null);
        try {
          sessionStorage.setItem(STORAGE_KEY_SUBMITTED, 'true');
        } catch {
          // ignore
        }
      } else {
        setErrorMsg(res.message || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'A network error occurred while submitting your enquiry. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop with blur & smooth fade */}
      <div
        className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg transform overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-6 shadow-2xl transition-all duration-300 sm:p-8 dark:border-gray-800 dark:bg-gray-900 motion-reduce:transition-none motion-reduce:transform-none"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close enquiry popup"
          className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          /* Success Screen */
          <div className="py-6 text-center animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h3
              id="enquiry-modal-title"
              className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
            >
              Enquiry Submitted!
            </h3>

            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Thank you, <span className="font-semibold text-gray-900 dark:text-white">{name}</span>. We've received your enquiry and our admissions advisors will review it and contact you within 24 hours.
            </p>

            {submittedId && (
              <div className="mt-4 inline-block rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Enquiry Reference ID: #{submittedId}
              </div>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={handleDismiss}
                className="btn-primary w-full py-3 text-sm font-semibold shadow-md"
              >
                Close & Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          /* Enquiry Form */
          <div>
            {/* Header Badge & Title */}
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200/80 bg-brand-50/80 px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900/60 dark:bg-brand-950/50 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Quick Course Enquiry</span>
              </div>

              <h2
                id="enquiry-modal-title"
                className="mt-3 text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
              >
                Need Guidance on Courses?
              </h2>

              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
                Fill in your details below and our faculty advisors will connect with curriculum syllabus and batch timings.
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
              noValidate
            >
              {/* Anti-spam Honeypot */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Full Name */}
              <div>
                <label
                  htmlFor="enquiry-name"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    ref={firstInputRef}
                    id="enquiry-name"
                    type="text"
                    required
                    maxLength={150}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: '' }));
                    }}
                    placeholder="e.g. John Doe"
                    disabled={submitting}
                    className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 ${
                      fieldErrors.name
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Email Address */}
                <div>
                  <label
                    htmlFor="enquiry-email"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="enquiry-email"
                      type="email"
                      required
                      maxLength={254}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="john@example.com"
                      disabled={submitting}
                      className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 ${
                        fieldErrors.email
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="enquiry-phone"
                    className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Phone Number
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="enquiry-phone"
                      type="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder="+91 98765 43210"
                      disabled={submitting}
                      className={`block w-full rounded-xl border pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 ${
                        fieldErrors.phone
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Course / Program Selection */}
              <div>
                <label
                  htmlFor="enquiry-subject"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Course / Topic of Interest
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <select
                    id="enquiry-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={submitting}
                    className="block w-full rounded-xl border border-gray-200 pl-9 pr-8 py-2 text-sm text-gray-900 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-gray-600"
                  >
                    {AVAILABLE_COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="enquiry-message"
                  className="block text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Your Message or Question <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <textarea
                    id="enquiry-message"
                    rows={3}
                    required
                    maxLength={5000}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (fieldErrors.message) setFieldErrors((p) => ({ ...p, message: '' }));
                    }}
                    placeholder="Tell us what you would like to know (e.g. curriculum, prerequisites, schedule, career support)..."
                    disabled={submitting}
                    className={`block w-full rounded-xl border p-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 ${
                      fieldErrors.message
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  />
                </div>
                {fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={submitting}
                  className="btn-secondary px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Maybe Later
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold shadow-md shadow-brand-500/20 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Enquiry</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
