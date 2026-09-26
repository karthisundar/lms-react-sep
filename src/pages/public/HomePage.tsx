// src/pages/public/HomePage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code as Code2,
  Sparkles,
  ArrowRight,
  Brain,
  ShieldCheck,
  Cloud,
  Database,
  Cpu,
  Layers,
  GraduationCap,
  Award,
  Users,
  CheckCircle2,
  Play,
  Terminal,
  BookOpen,
  Briefcase,
  Clock,
  Star,
  Quote,
} from 'lucide-react';
import PublicHeader from '@/components/public/PublicHeader';
import PublicFooter from '@/components/public/PublicFooter';
import CourseCard from '@/components/public/CourseCard';
import { coursesData, courseCategories, getFeaturedCourses } from '@/data/coursesData';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const featuredCourses = getFeaturedCourses();

  // Category selection for the interactive category filter
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');

  const filteredCourses =
    selectedCategorySlug === 'all'
      ? coursesData
      : coursesData.filter((c) => c.categorySlug === selectedCategorySlug);

  const categories = [
    {
      name: 'AI & Data Science',
      slug: 'ai-data-science',
      icon: Brain,
      color: 'from-blue-600 to-indigo-600',
      description: 'Machine Learning, Deep Learning, Statistics & Python modeling',
    },
    {
      name: 'Generative AI',
      slug: 'generative-ai',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-600',
      description: 'LLMs, Prompt Engineering, RAG & Autonomous Agentic systems',
    },
    {
      name: 'Full Stack Development',
      slug: 'full-stack',
      icon: Layers,
      color: 'from-emerald-600 to-teal-600',
      description: 'React, TypeScript, Node.js, Spring Boot & Cloud Databases',
    },
    {
      name: 'Cyber Security',
      slug: 'cyber-security',
      icon: ShieldCheck,
      color: 'from-red-600 to-orange-600',
      description: 'Ethical Hacking, Penetration Testing, OWASP & SIEM Defense',
    },
    {
      name: 'Cloud & DevOps',
      slug: 'cloud-devops',
      icon: Cloud,
      color: 'from-cyan-600 to-blue-600',
      description: 'AWS Architecture, Docker, Kubernetes & Terraform CI/CD',
    },
    {
      name: 'Data Engineering',
      slug: 'data-engineering',
      icon: Database,
      color: 'from-amber-600 to-orange-600',
      description: 'Apache Spark, Kafka, Hadoop & AWS Scalable Data Lakes',
    },
  ];

  const benefits = [
    {
      icon: Brain,
      title: 'Industry-Aligned Curriculum',
      description:
        'Designed in collaboration with senior engineers and data scientists to reflect current production tech stacks.',
    },
    {
      icon: Terminal,
      title: 'Hands-On Project Labs',
      description:
        'Build production-grade applications, multi-agent AI tools, and distributed architectures instead of just watching videos.',
    },
    {
      icon: Users,
      title: '1-on-1 Code Reviews & Mentorship',
      description:
        'Receive personalized guidance, actionable code feedback, and architectural reviews from experienced practitioners.',
    },
    {
      icon: Clock,
      title: 'Flexible & Self-Paced Learning',
      description:
        'Structured modular tracks tailored for working professionals, balancing depth with modern schedule flexibility.',
    },
    {
      icon: Award,
      title: 'Recognized Industry Certifications',
      description:
        'Validate your technical capability with verified credential badges to showcase on LinkedIn and in technical interviews.',
    },
    {
      icon: Briefcase,
      title: 'Career & Placement Support',
      description:
        'Technical mock interviews, GitHub portfolio polish, system design prep, and direct connections to tech recruiters.',
    },
  ];

  const learningSteps = [
    {
      step: '01',
      title: 'Core Foundations & Architecture',
      description:
        'Deep dive into essential paradigms, mathematical principles, language mechanics, and architectural foundations.',
    },
    {
      step: '02',
      title: 'Hands-On Labs & Sprints',
      description:
        'Practice with guided coding challenges, simulated cyber ranges, and real-time development environments.',
    },
    {
      step: '03',
      title: 'Production Capstone Projects',
      description:
        'Architect end-to-end full-stack applications, scalable RAG systems, and enterprise data streaming pipelines.',
    },
    {
      step: '04',
      title: 'Certification & Career Launch',
      description:
        'Undergo final technical portfolio reviews, earn verified credentialing, and prepare for high-impact roles.',
    },
  ];

  const testimonials = [
    {
      quote:
        'The Generative AI and Agentic development track is second to none. Building autonomous multi-agent teams with CrewAI helped me land an AI Engineer role at a top enterprise tech firm.',
      name: 'Priya Sharma',
      role: 'AI Engineer',
      course: 'Generative AI & Agentic AI',
      rating: 5,
    },
    {
      quote:
        'The hands-on rigor in Full Stack Web Development completely transformed my skills. You do not just learn syntax; you architect real databases, write tests, and deploy on AWS.',
      name: 'Alex Martinez',
      role: 'Full Stack Developer',
      course: 'Full Stack Web Development',
      rating: 5,
    },
    {
      quote:
        'Going from basic Python to building computer vision and NLP models was seamless due to the structured curriculum and dedicated mentor code reviews.',
      name: 'David Chen',
      role: 'Data Scientist',
      course: 'Data Science & Artificial Intelligence',
      rating: 5,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <PublicHeader />

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 lg:pt-24 lg:pb-32">
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px] dark:bg-brand-600/20" />
          <div className="absolute top-1/3 -right-40 h-80 w-80 rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-600/15" />
          <div className="absolute -bottom-20 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px] dark:bg-emerald-600/15" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Hero Left Text */}
            <div className="text-center lg:col-span-7 lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm dark:border-brand-900/60 dark:bg-brand-950/50 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                <span>Next-Generation Technology & AI Curriculum</span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-6xl">
                <span className="block text-gray-900 dark:text-white">Learn. Build. Grow.</span>
                <span className="mt-1 block bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Master High-Impact Tech Skills
                </span>
              </h1>

              {/* Subheading */}
              <p className="mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl dark:text-gray-300">
                Build practical technology skills through structured courses, hands-on projects and expert-led learning. From Agentic AI and Data Science to Full Stack and Cloud Architecture.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className="btn-primary h-12 w-full sm:w-auto px-7 text-base font-semibold shadow-lg shadow-brand-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore Courses</span>
                  <ArrowRight className="h-5 w-5" />
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
                    <span>Login to Portal</span>
                  </button>
                )}
              </div>

              {/* Trust Metrics Strip */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-200/80 pt-6 text-left dark:border-gray-800">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">7+</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Specialized Programs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">100%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Project-Based Labs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">4.9/5</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Student Satisfaction</p>
                </div>
              </div>
            </div>

            {/* Hero Right Visual: Interactive Tech/AI Dashboard Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Subtle outer glow */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 opacity-30 blur-xl dark:opacity-40" />

                <div className="relative rounded-2xl border border-gray-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90">
                  {/* Mock IDE / Terminal Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80" />
                      <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                      <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="font-mono text-xs font-medium text-gray-400">agent_pipeline.py</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      LIVE RUN
                    </span>
                  </div>

                  {/* Code snippet simulation */}
                  <div className="mt-4 space-y-2 font-mono text-xs text-gray-700 dark:text-gray-300">
                    <p className="text-gray-400"># Autonomous Multi-Agent Orchestration</p>
                    <p>
                      <span className="text-purple-600 dark:text-purple-400">from</span> crewai{' '}
                      <span className="text-purple-600 dark:text-purple-400">import</span> Agent, Crew, Task
                    </p>
                    <p>
                      <span className="text-brand-600 dark:text-brand-400">researcher</span> = Agent(
                    </p>
                    <p className="pl-4">
                      role=<span className="text-emerald-600 dark:text-emerald-400">'Senior AI Researcher'</span>,
                    </p>
                    <p className="pl-4">tools=[VectorRAGSearch(), CodeExec()]</p>
                    <p>)</p>
                    <p className="text-gray-400 pt-1"># Executing task with human verification...</p>
                  </div>

                  {/* Feature Badges in Hero Card */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                          <Brain className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">Generative AI & LLMs</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">RAG, Embeddings & Agents</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">Production Full Stack</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">React, Node, TypeScript & SQL</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Course Categories Section ("Explore Technology & AI") */}
      <section className="border-y border-gray-200/80 bg-gray-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Technology Domains
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Explore Technology & AI
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Select a specialized domain to view in-depth programs engineered for industry impact.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => navigate(`/courses?category=${cat.slug}`)}
                  className="group relative flex flex-col text-left rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-400">
                      View Courses &rarr;
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900 transition-colors group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                    {cat.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {cat.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Featured Courses Section */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Flagship Offerings
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                Featured Programs
              </h2>
              <p className="mt-2 max-w-2xl text-base text-gray-600 dark:text-gray-400">
                Our most in-demand technical programs designed to equip you with production-grade engineering mastery.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/courses')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              <span>Browse All 7 Courses</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Featured Courses Grid: 3-column on desktop, 2 on tablet, 1 on mobile */}
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} featured={true} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us / Learning Benefits */}
      <section id="benefits" className="border-t border-gray-200/80 bg-gray-50/60 py-20 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              The CodeClass Advantage
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Why Learn With Us?
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              We bridge the gap between academic theory and real-world technology execution.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Learning Process Section */}
      <section id="process" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Our Methodology
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              How You Will Learn
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              A structured 4-step pedagogical pathway designed to turn beginners and intermediate coders into confident practitioners.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {learningSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm transition-all hover:border-brand-300 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-4xl font-extrabold text-brand-200 dark:text-brand-900/60">
                  {step.step}
                </div>
                <h3 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Student Stories / Social Proof Section */}
      <section className="border-y border-gray-200/80 bg-gray-50/60 py-20 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Student Experiences
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              Learners Transformed
            </h2>
            <p className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Read how our students leveled up their careers across top global engineering teams.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {Array.from({ length: item.rating }).map((_, r) => (
                      <Star key={r} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 italic">
                    "{item.quote}"
                  </p>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>
                  <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                    {item.course}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Call To Action (CTA) Section */}
      <section id="contact" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-20 lg:px-16">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-40 pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
                Enrollment Open
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
                Ready to Accelerate Your Tech Career?
              </h2>
              <p className="mt-4 text-lg text-white/90">
                Join thousands of learners mastering AI, Full Stack Development, Cloud & Cybersecurity with CodeClass.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  className="h-12 w-full sm:w-auto rounded-xl bg-white px-8 text-base font-semibold text-brand-800 shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  Browse All Courses
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-12 w-full sm:w-auto rounded-xl border border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
                >
                  Sign In to Learn
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
