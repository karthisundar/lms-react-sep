// src/data/coursesData.ts

export interface CourseModule {
  title: string;
  description: string;
  topics: string[];
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  categorySlug: string;
  duration: string;
  level: string;
  mode: string;
  certification: string;
  rating: number;
  reviewsCount: number;
  studentsCount: string;
  image: string;
  featured: boolean;
  popular: boolean;
  badge?: string;
  highlights: string[];
  learningOutcomes: string[];
  curriculum: CourseModule[];
  targetAudience: string[];
  prerequisites: string;
  route: string;
}

export const coursesData: Course[] = [
  {
    id: 1,
    title: "Data Science and Artificial Intelligence",
    slug: "data-science-and-artificial-intelligence",
    description: "Build practical expertise in data analysis, machine learning and artificial intelligence through structured lessons, hands-on exercises and real-world projects.",
    longDescription: "Master the complete data science lifecycle from data ingestion, exploratory data analysis, and advanced machine learning to deep neural networks and modern AI deployment. This comprehensive program combines rigorous mathematical foundations with practical industry workflows in Python, Pandas, Scikit-Learn, PyTorch, and cloud MLOps.",
    category: "AI & Data Science",
    categorySlug: "ai-data-science",
    duration: "4-10 Months",
    level: "Beginner to Advanced",
    mode: "Live Interactive & Hands-on Labs",
    certification: "Certified Data Science & AI Practitioner",
    rating: 4.9,
    reviewsCount: 1420,
    studentsCount: "3,800+",
    featured: true,
    popular: true,
    badge: "Most Enrolled",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/data-science-and-artificial-intelligence",
    highlights: [
      "End-to-end Python & ML ecosystem mastery",
      "Real-world enterprise capstone projects",
      "Deep Learning with PyTorch & Computer Vision",
      "Production deployment with FastAPI & Docker"
    ],
    learningOutcomes: [
      "Master Python programming for scientific computing, statistics, and data analysis",
      "Perform robust Exploratory Data Analysis (EDA) using NumPy, Pandas, Seaborn, and Matplotlib",
      "Build and evaluate supervised and unsupervised Machine Learning models with Scikit-Learn",
      "Implement advanced deep neural networks for computer vision and NLP using PyTorch",
      "Understand feature engineering, cross-validation, hyperparameter tuning, and ensemble methods",
      "Learn Generative AI foundations, embeddings, vector databases, and LLM prompting",
      "Deploy scalable ML models as REST APIs using FastAPI, Docker, and cloud services",
      "Complete comprehensive industry capstone projects with full source control and documentation"
    ],
    curriculum: [
      {
        title: "Module 1: Python for Data Science & Computing",
        description: "Foundational programming, data structures, algorithm efficiency, and scientific libraries.",
        topics: [
          "Python syntax, control flow, functions, and object-oriented programming",
          "NumPy multidimensional arrays, vectorization, and mathematical operations",
          "Data cleaning, reshaping, indexing, and wrangling with Pandas",
          "Interactive data visualization with Matplotlib, Seaborn, and Plotly"
        ]
      },
      {
        title: "Module 2: Applied Statistics & Probability",
        description: "Core statistical techniques essential for inference, hypothesis testing, and predictive modeling.",
        topics: [
          "Descriptive statistics, central tendency, dispersion, and probability distributions",
          "Hypothesis testing, p-values, confidence intervals, and A/B testing methodology",
          "Linear regression, correlation analysis, and multiple regression models",
          "Dimensionality reduction concepts and Principal Component Analysis (PCA)"
        ]
      },
      {
        title: "Module 3: Machine Learning Algorithms",
        description: "Hands-on implementation of core predictive algorithms and model evaluation.",
        topics: [
          "Supervised learning: Logistic Regression, Decision Trees, and Random Forests",
          "Advanced ensembles: Gradient Boosting, XGBoost, LightGBM, and CatBoost",
          "Unsupervised learning: K-Means clustering, hierarchical clustering, and DBSCAN",
          "Model evaluation metrics: ROC-AUC, Precision-Recall, F1-Score, and Cross-Validation"
        ]
      },
      {
        title: "Module 4: Deep Learning & Neural Networks",
        description: "Designing, training, and optimizing deep neural networks with PyTorch.",
        topics: [
          "Perceptrons, multi-layer neural networks, backpropagation, and loss functions",
          "Convolutional Neural Networks (CNNs) for image classification and object detection",
          "Recurrent Neural Networks (RNNs) and LSTMs for sequential data and time series",
          "Transfer learning, pre-trained models, and GPU acceleration"
        ]
      },
      {
        title: "Module 5: Generative AI & Natural Language Processing",
        description: "Text processing, transformers, embeddings, and modern GenAI integrations.",
        topics: [
          "Tokenization, TF-IDF, Word2Vec, and sequence-to-sequence architectures",
          "Transformer architectures, attention mechanisms, and BERT/GPT fundamentals",
          "Prompt engineering techniques, OpenAI API, and open-source models (HuggingFace)",
          "Retrieval-Augmented Generation (RAG) with vector databases"
        ]
      },
      {
        title: "Module 6: MLOps & Production Capstone",
        description: "Deploying, monitoring, and scaling production AI systems.",
        topics: [
          "Packaging models with FastAPI and containerization using Docker",
          "Model versioning, experiment tracking (MLflow), and CI/CD pipelines",
          "End-to-end Capstone Project presentation and portfolio review"
        ]
      }
    ],
    targetAudience: [
      "Software developers looking to transition into Data Science and Machine Learning",
      "Data analysts seeking to advance to ML engineering and predictive modeling",
      "STEM graduates wanting industry-grade portfolio projects and career support"
    ],
    prerequisites: "Basic programming curiosity and high school mathematics. Prior coding experience is helpful but not required."
  },
  {
    id: 2,
    title: "Generative AI And Agentic AI Development",
    slug: "generative-ai-agentic-ai-development",
    description: "Learn how to build modern Generative AI applications using LLMs, prompt engineering, RAG, AI agents, tool calling and agent orchestration.",
    longDescription: "Step into the bleeding edge of Artificial Intelligence. This program teaches you to architect, build, and deploy production-ready Generative AI systems and autonomous agentic workflows. Gain hands-on experience with Large Language Models, advanced RAG architectures, vector databases, LangChain, LlamaIndex, CrewAI, AutoGen, and enterprise agent orchestration.",
    category: "Generative AI",
    categorySlug: "generative-ai",
    duration: "4-10 Months",
    level: "Intermediate to Advanced",
    mode: "Live Online & Real-World Lab Sprints",
    certification: "Certified Agentic AI Solutions Architect",
    rating: 4.95,
    reviewsCount: 980,
    studentsCount: "2,400+",
    featured: true,
    popular: true,
    badge: "Trending & High Demand",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/generative-ai-agentic-ai-development",
    highlights: [
      "Autonomous Multi-Agent Orchestration (CrewAI & AutoGen)",
      "Production-grade Hybrid RAG with Vector Stores",
      "Fine-tuning with LoRA / PEFT & Quantization",
      "Function Calling, Tool Use & Structured JSON outputs"
    ],
    learningOutcomes: [
      "Understand Transformer internals, self-attention, context windows, and token dynamics",
      "Master advanced prompt engineering (Chain-of-Thought, ReAct, Few-Shot, System Instructions)",
      "Design and deploy production Retrieval-Augmented Generation (RAG) pipelines with hybrid search",
      "Implement vector embeddings and search with Pinecone, ChromaDB, Weaviate, and Qdrant",
      "Build complex LLM applications using LangChain, LangGraph, and LlamaIndex",
      "Construct autonomous AI agents with function calling, browser automation, and code interpreters",
      "Orchestrate multi-agent teams using CrewAI and AutoGen with human-in-the-loop controls",
      "Fine-tune open-weight models (Llama 3, Mistral) using LoRA, QLoRA, and parameter-efficient tuning",
      "Implement LLM security, prompt injection defenses, guardrails (NeMo), and latency optimization",
      "Deploy scalable Generative AI microservices with streaming responses and observability"
    ],
    curriculum: [
      {
        title: "Module 1: Foundations of LLMs & Generative AI",
        description: "Transformer architecture, tokenizer mechanics, self-attention, and API integrations.",
        topics: [
          "Evolution of Generative AI: From NLP to Large Multimodal Models",
          "Transformer architectures: Encoders, Decoders, and Attention mechanisms",
          "Working with OpenAI, Anthropic Claude, and Google Gemini developer APIs",
          "Open-weights ecosystem: HuggingFace, Ollama, vLLM, and local inference"
        ]
      },
      {
        title: "Module 2: Advanced Prompt Engineering & Structured Outputs",
        description: "System design with deterministic LLM outputs and reasoning chains.",
        topics: [
          "Zero-shot, Few-shot, Chain-of-Thought, and directional stimulus prompting",
          "Enforcing structured JSON outputs using Pydantic, Instructor, and JSON Mode",
          "ReAct (Reason + Act) prompting framework fundamentals",
          "Prompt versioning, evaluation frameworks, and regression testing"
        ]
      },
      {
        title: "Module 3: Enterprise RAG Systems & Vector Databases",
        description: "Grounding LLMs with private knowledge bases, chunking, and semantic search.",
        topics: [
          "Document ingestion, parsing (PDFs, Markdown, audio), and optimal chunking strategies",
          "Embedding models, distance metrics (Cosine, Euclidean), and indexing",
          "Vector databases: Pinecone, ChromaDB, and pgvector in PostgreSQL",
          "Advanced RAG: Hybrid search, cross-encoder rerankers, contextual compression, and metadata filters"
        ]
      },
      {
        title: "Module 4: LangChain, LangGraph & State Machines",
        description: "Chaining operations, memory management, and cyclic state machines.",
        topics: [
          "LangChain expression language (LCEL), chains, and document loaders",
          "Conversation buffer memory, entity memory, and summary memory",
          "LangGraph: Building cyclical, stateful AI workflows and durable execution graphs",
          "Human-in-the-loop approvals, checkpoints, and time-travel debugging"
        ]
      },
      {
        title: "Module 5: Autonomous Agents & Tool Use",
        description: "Equipping models with live web browsing, API calls, and Python sandboxes.",
        topics: [
          "Function calling and tool integration (OpenAI Tools, custom Python tools)",
          "Web scraping agents, database querying agents, and dynamic code execution",
          "Planning algorithms: Task decomposition, self-reflection, and error recovery",
          "Building an Autonomous Financial Research & Market Intelligence Agent"
        ]
      },
      {
        title: "Module 6: Multi-Agent Systems & Team Orchestration",
        description: "Designing cooperative and competitive multi-agent teams.",
        topics: [
          "Multi-agent concepts: Roles, goals, backstories, and collaboration protocols",
          "CrewAI framework: Tasks, crews, hierarchical vs sequential execution",
          "Microsoft AutoGen: Conversational agent patterns and group chat managers",
          "Multi-agent software engineering squad: Product Manager, Coder, Reviewer, and QA Agents"
        ]
      },
      {
        title: "Module 7: Fine-Tuning, Guardrails & Production Deployment",
        description: "Fine-tuning open weights, model alignment, security, and scalable serving.",
        topics: [
          "Dataset preparation, instruction formatting, and evaluation sets",
          "Parameter-Efficient Fine-Tuning (PEFT), LoRA, and QLoRA on GPUs",
          "LLM Guardrails: Preventing hallucinations, jailbreaks, and sensitive data leakage",
          "Capstone Project: Multi-Agent Enterprise Customer Success & Code Generation Platform"
        ]
      }
    ],
    targetAudience: [
      "AI engineers and developers wanting to specialize in agentic systems and RAG",
      "Full-stack developers looking to integrate intelligence into production apps",
      "Technical architects aiming to design enterprise-grade LLM infrastructure"
    ],
    prerequisites: "Proficiency in Python programming and basic familiarity with APIs and databases."
  },
  {
    id: 3,
    title: "Full Stack Web Development",
    slug: "full-stack-web-development",
    description: "Learn modern frontend and backend development by building production-ready web applications using JavaScript, TypeScript, React, Node.js, APIs and databases.",
    longDescription: "Become an industry-ready full-stack software engineer. This hands-on program covers every layer of modern web engineering: from dynamic, responsive client applications in React and TypeScript to robust REST and GraphQL backends in Node.js, relational database architecture with PostgreSQL, authentication, and cloud deployment with CI/CD.",
    category: "Full Stack Development",
    categorySlug: "full-stack",
    duration: "4-10 Months",
    level: "Beginner to Advanced",
    mode: "Live Classes & Real Production Projects",
    certification: "Full Stack Software Engineering Certificate",
    rating: 4.88,
    reviewsCount: 1650,
    studentsCount: "4,200+",
    featured: true,
    popular: true,
    badge: "Career Accelerating",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/full-stack-web-development",
    highlights: [
      "Modern React 18+, TypeScript & Tailwind CSS",
      "Node.js, Express & PostgreSQL backend architecture",
      "Production JWT/OAuth Authentication & Security",
      "Docker containerization & CI/CD deployment"
    ],
    learningOutcomes: [
      "Master modern semantic HTML5, CSS3, Flexbox, CSS Grid, and responsive Tailwind CSS",
      "Write clean, idiomatic modern JavaScript (ES6+) and type-safe TypeScript",
      "Build complex interactive single-page applications using React components, hooks, and context",
      "Architect RESTful APIs with Node.js, Express, input validation, and error handling",
      "Design relational databases, write efficient SQL queries, and manage migrations with PostgreSQL & Prisma",
      "Implement secure authentication with JSON Web Tokens (JWT), bcrypt, cookies, and OAuth2",
      "Manage client state, caching, and server synchronization with React Query and Zustand",
      "Containerize full-stack apps with Docker and deploy to cloud environments (AWS, Vercel, Railway)",
      "Write automated unit and integration tests with Jest, React Testing Library, and Supertest",
      "Build a complete multi-tenant production SaaS capstone project from scratch"
    ],
    curriculum: [
      {
        title: "Module 1: Modern Web Foundations & Responsive UI",
        description: "Modern semantic markup, responsive design principles, and utility-first styling.",
        topics: [
          "HTML5 semantic structures, accessibility (a11y), and SEO fundamentals",
          "Advanced CSS: Flexbox layouts, Grid systems, and CSS variables",
          "Tailwind CSS architecture: Responsive breakpoints, dark mode, and component extraction",
          "Version control with Git & GitHub: Branching, pull requests, and code reviews"
        ]
      },
      {
        title: "Module 2: JavaScript Mastery & TypeScript Fundamentals",
        description: "Core language mechanics, asynchronous programming, and strong static typing.",
        topics: [
          "ES6+ features: Destructuring, spread/rest, arrow functions, modules, and closures",
          "Asynchronous JavaScript: Promises, async/await, fetch API, and event loop",
          "TypeScript essentials: Types, interfaces, generics, unions, and type guards",
          "Tooling: Node.js runtime, npm/pnpm package managers, and Vite build tool"
        ]
      },
      {
        title: "Module 3: React 18 & Frontend Architecture",
        description: "Component-driven design, state management, and modern React patterns.",
        topics: [
          "JSX, component lifecycle, props, and conditional rendering",
          "React Hooks: useState, useEffect, useCallback, useMemo, and custom hooks",
          "Client-side routing with React Router v6: Dynamic parameters, loaders, and protected routes",
          "Server state management with TanStack Query (React Query) and global state with Zustand"
        ]
      },
      {
        title: "Module 4: Node.js & Backend API Engineering",
        description: "Building scalable server applications, routing, and REST architectural constraints.",
        topics: [
          "Node.js architecture, event-driven I/O, streams, and file system operations",
          "Express framework: Middleware pipelines, route handlers, and error handlers",
          "Request validation with Zod, CORS configuration, and security headers (Helmet)",
          "RESTful API design best practices, status codes, and API documentation with Swagger"
        ]
      },
      {
        title: "Module 5: Database Engineering (PostgreSQL & MongoDB)",
        description: "Data modeling, relational integrity, querying, and ORM abstractions.",
        topics: [
          "Relational database design: Normalization, primary/foreign keys, and constraints",
          "PostgreSQL: Complex joins, indexing, transactions, and aggregate queries",
          "Object-Relational Mapping (ORM) using Prisma / Sequelize: Schemas, migrations, and queries",
          "NoSQL document databases: MongoDB and Mongoose for unstructured workloads"
        ]
      },
      {
        title: "Module 6: Security, Auth & DevOps Deployment",
        description: "Hardening applications, identity management, and automated deployments.",
        topics: [
          "Authentication flows: Password hashing (bcrypt), JWT tokens, and refresh tokens",
          "Role-Based Access Control (RBAC) and route protection on client and server",
          "Containerizing frontend and backend applications with Docker and Docker Compose",
          "Continuous Integration / Continuous Deployment (CI/CD) with GitHub Actions and cloud hosting"
        ]
      },
      {
        title: "Module 7: Capstone: Enterprise SaaS Application",
        description: "Designing, developing, and deploying a commercial-grade full-stack project.",
        topics: [
          "Architecture planning, database schema design, and technical spec creation",
          "Iterative sprint development, code reviews, and live production deployment",
          "Technical interview preparation, portfolio presentation, and career mentoring"
        ]
      }
    ],
    targetAudience: [
      "Beginners eager to break into tech with in-demand full-stack skills",
      "Frontend developers wanting to master backend architecture and databases",
      "Self-taught coders looking for structured production-grade engineering practices"
    ],
    prerequisites: "Basic computer literacy and problem-solving mindset. No prior programming degree needed."
  },
  {
    id: 4,
    title: "Cyber Security and Ethical Hacking",
    slug: "cyber-security-and-ethical-hacking",
    description: "Master defensive and offensive security principles, network defense, penetration testing, ethical hacking techniques, and incident response.",
    longDescription: "Protect critical digital infrastructure and understand how adversaries think. This comprehensive cybersecurity program equips you with offensive penetration testing skills, vulnerability assessments, web application exploitation (OWASP Top 10), defensive SIEM monitoring, threat intelligence, and digital forensics in simulated laboratory environments.",
    category: "Cyber Security",
    categorySlug: "cyber-security",
    duration: "4-10 Months",
    level: "Beginner to Advanced",
    mode: "Live Interactive & Virtual Hacking Labs",
    certification: "Certified Ethical Hacker & Defense Specialist",
    rating: 4.87,
    reviewsCount: 890,
    studentsCount: "2,100+",
    featured: true,
    popular: false,
    badge: "Industry Certified",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/cyber-security-and-ethical-hacking",
    highlights: [
      "Virtual penetration testing labs & CTF challenges",
      "OWASP Top 10 Web App Exploitation & Mitigation",
      "Defensive Security Operations (SOC) & SIEM Splunk",
      "Network Packet Analysis with Wireshark & Nmap"
    ],
    learningOutcomes: [
      "Understand enterprise network protocols, packet structure, and firewall architectures",
      "Perform reconnaissance, port scanning, and vulnerability discovery with Nmap and Nessus",
      "Exploit web application flaws including SQL Injection, XSS, CSRF, and SSRF",
      "Utilize penetration testing frameworks such as Metasploit, Burp Suite, and Kali Linux",
      "Implement defensive security monitoring, log analysis, and incident triage with Splunk",
      "Analyze malicious payloads, reverse shell execution, and privilege escalation techniques",
      "Configure cryptographic standards, PKI certificates, VPNs, and Zero Trust models",
      "Execute simulated Red Team vs. Blue Team exercises and prepare technical audit reports"
    ],
    curriculum: [
      {
        title: "Module 1: Networking & Linux Security Foundations",
        description: "TCP/IP models, Linux administration, packet flow, and security baselines.",
        topics: [
          "Network fundamentals: OSI model, subnetting, DNS, DHCP, and ARP protocols",
          "Kali Linux mastery: Bash scripting, permission models, and security utilities",
          "Network traffic inspection with Wireshark and tcpdump",
          "Configuring firewalls (iptables, UFW) and basic intrusion detection"
        ]
      },
      {
        title: "Module 2: Reconnaissance & Vulnerability Assessment",
        description: "Information gathering, target enumeration, and automated vulnerability scanning.",
        topics: [
          "Open Source Intelligence (OSINT) and domain footprinting techniques",
          "Active scanning with Nmap: NSE scripts, firewall evasion, and service detection",
          "Vulnerability scanners: Nessus and OpenVAS deployment and report analysis",
          "CVSS vulnerability scoring and threat intelligence feeds"
        ]
      },
      {
        title: "Module 3: Web Application Penetration Testing",
        description: "Deconstructing OWASP Top 10 vulnerabilities with interactive lab targets.",
        topics: [
          "Intercepting and tampering HTTP traffic with Burp Suite Professional",
          "Injection attacks: SQL Injection, Command Injection, and NoSQL Injection",
          "Broken authentication, session hijacking, and JWT tampering",
          "Cross-Site Scripting (XSS), CSRF, and Server-Side Request Forgery (SSRF)"
        ]
      },
      {
        title: "Module 4: Exploitation & Post-Exploitation",
        description: "Payload generation, exploitation frameworks, and system persistence.",
        topics: [
          "Metasploit Framework: Exploits, payloads, encoders, and meterpreter sessions",
          "Linux and Windows privilege escalation vectors",
          "Password cracking with Hashcat, John the Ripper, and rainbow tables",
          "Lateral movement, internal pivoting, and persistence mechanisms"
        ]
      },
      {
        title: "Module 5: Defensive Operations (Blue Team & SIEM)",
        description: "Security Operations Center (SOC) workflows and threat detection.",
        topics: [
          "Security Information and Event Management (SIEM) with Splunk and ELK",
          "Analyzing authentication logs, firewall alerts, and suspicious endpoint behavior",
          "Incident response phases: Preparation, Detection, Containment, Eradication, and Lessons Learned",
          "Digital forensics basics: Memory analysis and disk artifact examination"
        ]
      },
      {
        title: "Module 6: Cloud Security & Capstone Audit",
        description: "Cloud IAM policies, compliance frameworks, and comprehensive security auditing.",
        topics: [
          "AWS and Azure cloud security fundamentals: IAM, security groups, and S3 bucket security",
          "Compliance standards: NIST Cybersecurity Framework, ISO 27001, and GDPR",
          "Capstone Project: Full-Scope Penetration Test, Remediation Plan, and Executive Briefing"
        ]
      }
    ],
    targetAudience: [
      "IT administrators, network engineers, and system admins transitioning to security",
      "Software developers aiming to specialize in application security and DevSecOps",
      "Aspiring ethical hackers seeking industry-recognized credentials"
    ],
    prerequisites: "Basic understanding of computer networking and operating systems."
  },
  {
    id: 5,
    title: "Cloud Computing and DevOps",
    slug: "cloud-computing-and-devops",
    description: "Architect resilient cloud infrastructures, automate CI/CD pipelines, containerize applications, and manage infrastructure as code with AWS, Docker, Kubernetes and Terraform.",
    longDescription: "Bridge the gap between software development and IT operations. This immersive program covers cloud architecture on Amazon Web Services (AWS), microservice containerization with Docker, scalable orchestration with Kubernetes, Infrastructure as Code using Terraform, and high-velocity CI/CD automation with GitHub Actions and Prometheus/Grafana observability.",
    category: "Cloud & DevOps",
    categorySlug: "cloud-devops",
    duration: "4-10 Months",
    level: "Intermediate",
    mode: "Live Cloud Labs & Project Sprints",
    certification: "Certified Cloud Architect & DevOps Engineer",
    rating: 4.92,
    reviewsCount: 1100,
    studentsCount: "2,900+",
    featured: true,
    popular: false,
    badge: "Enterprise Standard",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/cloud-computing-and-devops",
    highlights: [
      "Comprehensive AWS Solutions Architect Curriculum",
      "Kubernetes & Docker Container Orchestration",
      "Infrastructure as Code with Terraform & Ansible",
      "Production CI/CD Pipelines with GitHub Actions"
    ],
    learningOutcomes: [
      "Architect highly available, fault-tolerant, and secure systems on AWS",
      "Containerize legacy and modern applications using Docker multi-stage builds",
      "Deploy, manage, and scale microservices using Kubernetes (EKS/k8s), pods, and Helm",
      "Provision and version cloud infrastructure reliably using Terraform and GitOps",
      "Build automated CI/CD deployment pipelines with automated testing and canary rollouts",
      "Implement enterprise monitoring, distributed tracing, and logging with Prometheus & Grafana",
      "Configure cloud networking: VPCs, subnets, NAT gateways, route tables, and load balancers",
      "Apply Site Reliability Engineering (SRE) principles: SLIs, SLOs, and error budgets"
    ],
    curriculum: [
      {
        title: "Module 1: AWS Cloud Architecture & Core Services",
        description: "Global cloud infrastructure, compute, storage, databases, and IAM security.",
        topics: [
          "AWS Cloud fundamentals, regions, availability zones, and IAM policies",
          "Compute services: EC2 instances, Auto Scaling Groups, and Elastic Load Balancing",
          "Storage: Amazon S3 bucket policies, lifecycle rules, EBS volumes, and EFS",
          "Databases & Serverless: RDS (PostgreSQL/MySQL), DynamoDB, and AWS Lambda"
        ]
      },
      {
        title: "Module 2: Cloud Networking & Security Hardening",
        description: "Designing isolated Virtual Private Clouds (VPC) and defense-in-depth.",
        topics: [
          "VPC design: Public/private subnets, Internet Gateways, NAT Gateways, and Route Tables",
          "Network Access Control Lists (NACLs) vs Security Groups configuration",
          "AWS CloudFront CDN, Route 53 DNS routing, and AWS Certificate Manager (SSL)",
          "Cost optimization, AWS Budgets, and CloudWatch alarms"
        ]
      },
      {
        title: "Module 3: Containerization with Docker",
        description: "Packaging microservices into lightweight, reproducible container images.",
        topics: [
          "Container runtime vs virtual machines, Docker daemon, and client CLI",
          "Writing optimized Dockerfiles: Multi-stage builds and layer caching",
          "Managing multi-container environments using Docker Compose",
          "Image security scanning and publishing to Amazon ECR and Docker Hub"
        ]
      },
      {
        title: "Module 4: Orchestration with Kubernetes (K8s)",
        description: "Production container management, automated scaling, and self-healing.",
        topics: [
          "Kubernetes architecture: Control plane, worker nodes, kubelet, and etcd",
          "Core resources: Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer)",
          "ConfigMaps, Secrets, Ingress Controllers, and persistent storage volumes",
          "Package management with Helm charts and deploying to Amazon EKS"
        ]
      },
      {
        title: "Module 5: Infrastructure as Code (IaC) with Terraform",
        description: "Declarative infrastructure provisioning and modular cloud engineering.",
        topics: [
          "Terraform workflow: init, plan, apply, destroy, and state management",
          "HCL syntax: Providers, resources, variables, outputs, and data sources",
          "Building reusable modules for VPCs, EKS clusters, and database instances",
          "Remote state storage with S3, DynamoDB state locking, and GitOps workflows"
        ]
      },
      {
        title: "Module 6: CI/CD Automation & Observability",
        description: "Continuous integration pipelines and real-time observability stacks.",
        topics: [
          "GitHub Actions: Workflows, runners, secrets, and automated build/test triggers",
          "Zero-downtime deployment strategies: Rolling updates, Blue-Green, and Canary releases",
          "Observability with Prometheus metrics collection and Grafana visualization dashboards",
          "Capstone Project: Multi-Environment Production Cloud Infrastructure & Microservices CI/CD"
        ]
      }
    ],
    targetAudience: [
      "Software developers seeking to control deployment pipelines and cloud infrastructure",
      "Systems engineers wanting to transition to cloud architects and DevOps specialists",
      "Technical leads aiming to build automated, highly available production systems"
    ],
    prerequisites: "Basic command-line (Linux) proficiency and familiarity with web technologies."
  },
  {
    id: 6,
    title: "Java and JavaScript Full Stack Development",
    slug: "java-javascript-full-stack-development",
    description: "Master enterprise software development combining Java Spring Boot on the backend with modern JavaScript/TypeScript and React on the frontend.",
    longDescription: "Unite the power of enterprise Java with the agility of modern JavaScript. This dual-stack program equips you with battle-tested server-side capabilities in Java 21, Spring Boot, Hibernate, microservices, and Apache Kafka, paired with responsive, dynamic frontend applications built in modern React, TypeScript, and Tailwind CSS.",
    category: "Full Stack Development",
    categorySlug: "full-stack",
    duration: "4-10 Months",
    level: "Beginner to Advanced",
    mode: "Live Interactive & Enterprise Case Studies",
    certification: "Enterprise Full Stack Java & React Developer",
    rating: 4.86,
    reviewsCount: 750,
    studentsCount: "1,850+",
    featured: false,
    popular: true,
    badge: "Enterprise Pick",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/java-javascript-full-stack-development",
    highlights: [
      "Java 21 Core, OOP, Streams & Concurrency",
      "Enterprise Spring Boot 3 & Spring Cloud Microservices",
      "Modern React & TypeScript client integration",
      "Distributed Event Streaming with Apache Kafka"
    ],
    learningOutcomes: [
      "Master Object-Oriented Programming, Design Patterns, Streams, and Generics in Java",
      "Build robust enterprise backends using Spring Boot 3, Spring Data JPA, and Hibernate",
      "Develop responsive client interfaces using modern React, TypeScript, and Tailwind CSS",
      "Design relational schemas, optimize complex SQL queries, and implement connection pools",
      "Secure REST APIs with Spring Security, JWT authentication, and Role-Based Access Control",
      "Implement distributed microservice architectures with Eureka, Gateway, and Feign Clients",
      "Integrate asynchronous messaging and event-driven architectures with Apache Kafka",
      "Deploy full-stack Java/React applications using Docker containers and cloud infrastructure"
    ],
    curriculum: [
      {
        title: "Module 1: Java 21 Fundamentals & OOP Mastery",
        description: "Core language syntax, memory management, collections, and functional programming.",
        topics: [
          "Java language foundations, JVM, JRE, memory heap/stack, and garbage collection",
          "Object-oriented principles: Encapsulation, inheritance, polymorphism, and abstraction",
          "Java Collections Framework: Lists, Sets, Maps, and sorting algorithms",
          "Functional programming: Lambda expressions, Stream API, and Optional"
        ]
      },
      {
        title: "Module 2: Enterprise Backend with Spring Boot 3",
        description: "Dependency injection, REST controllers, exception handling, and validation.",
        topics: [
          "Spring Core: Inversion of Control (IoC), Dependency Injection, and ApplicationContext",
          "Spring Boot starters, auto-configuration, and application.properties/yaml profiles",
          "Building RESTful APIs: @RestController, @RequestMapping, and ResponseEntity",
          "Input validation with Jakarta Validation and centralized global exception handling"
        ]
      },
      {
        title: "Module 3: Database Persistence with JPA & Hibernate",
        description: "Entity relationships, database mapping, transaction management, and repositories.",
        topics: [
          "Relational databases: PostgreSQL/MySQL configuration and database migrations with Flyway",
          "Spring Data JPA: @Entity, @Table, @Id, and CRUD/JPA repositories",
          "Entity relationships: @OneToMany, @ManyToOne, and @ManyToMany with cascading",
          "Custom JPQL queries, native SQL queries, pagination, and transaction management"
        ]
      },
      {
        title: "Module 4: Modern React & TypeScript Frontend Integration",
        description: "Connecting enterprise Java APIs to modern client applications.",
        topics: [
          "React components, JSX, hooks (useState, useEffect), and custom hooks",
          "TypeScript type definitions for backend DTOs and API responses",
          "Consuming REST endpoints using Axios with interceptors for JWT injection",
          "State management and form validation with React Hook Form and Zod"
        ]
      },
      {
        title: "Module 5: Security, Microservices & Kafka",
        description: "Spring Security, microservices communication, and asynchronous event streaming.",
        topics: [
          "Spring Security 6: Filter chains, user details service, and stateless JWT validation",
          "Microservices architecture: Spring Cloud Gateway, Eureka Service Discovery, and Feign",
          "Event-driven architecture with Apache Kafka: Topics, producers, and consumer groups",
          "Testing: Unit testing with JUnit 5, Mockito, and integration tests with Testcontainers"
        ]
      },
      {
        title: "Module 6: Enterprise Capstone Project",
        description: "Developing a production banking or e-commerce multi-tier platform.",
        topics: [
          "Domain-driven design and architectural blueprinting",
          "Full-stack implementation: Java Spring Boot microservices + React client",
          "Dockerizing the database, backend, Kafka, and frontend containers",
          "Production deployment, monitoring with Actuator, and career portfolio defense"
        ]
      }
    ],
    targetAudience: [
      "Developers aspiring to enter enterprise IT, banking, fintech, and large-scale tech companies",
      "Java developers looking to add modern frontend React skills to their toolkit",
      "Computer science students seeking deep enterprise software engineering credentials"
    ],
    prerequisites: "Basic programming knowledge in any object-oriented language."
  },
  {
    id: 7,
    title: "Big Data, AWS and Hadoop",
    slug: "big-data-aws-hadoop",
    description: "Process massive datasets at scale with Apache Hadoop, Spark, Kafka, and cloud data warehouse architectures on AWS.",
    longDescription: "Unleash the full potential of large-scale distributed data engineering. Learn to build fault-tolerant, high-throughput data lakes and real-time streaming architectures using the Apache Hadoop ecosystem, Apache Spark, PySpark, Apache Kafka, AWS EMR, Athena, Redshift, and Apache Airflow.",
    category: "Data Engineering",
    categorySlug: "data-engineering",
    duration: "4-10 Months",
    level: "Intermediate",
    mode: "Live Cloud Labs & Scaled Pipeline Sprints",
    certification: "Certified Enterprise Big Data & Cloud Engineer",
    rating: 4.89,
    reviewsCount: 680,
    studentsCount: "1,600+",
    featured: false,
    popular: false,
    badge: "Big Data Specialist",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    route: "/courses/big-data-aws-hadoop",
    highlights: [
      "Apache Hadoop & HDFS Distributed Architecture",
      "Massive Scale Data Processing with PySpark & Spark SQL",
      "Real-Time Streaming Pipelines with Apache Kafka",
      "AWS Data Lake (S3, Glue, Athena, Redshift)"
    ],
    learningOutcomes: [
      "Understand distributed systems, cluster computing, and the CAP theorem",
      "Store and manage Petabyte-scale files across distributed clusters with HDFS and YARN",
      "Execute batch and real-time data transformations with Apache Spark and PySpark",
      "Ingest high-velocity real-time event streams using Apache Kafka and Spark Streaming",
      "Architect AWS modern data platforms using Amazon S3, AWS Glue, and Amazon Athena",
      "Build cloud data warehouses and run analytical queries using Amazon Redshift",
      "Orchestrate complex dependent data pipelines with Apache Airflow DAGs",
      "Optimize data storage with Parquet, ORC, Delta Lake, and compression codecs"
    ],
    curriculum: [
      {
        title: "Module 1: Big Data Fundamentals & Hadoop Ecosystem",
        description: "Distributed storage, cluster compute nodes, and ecosystem tools.",
        topics: [
          "The 5 V's of Big Data and distributed computing paradigms",
          "Hadoop Distributed File System (HDFS): NameNodes, DataNodes, and replication",
          "YARN (Yet Another Resource Negotiator): Resource allocation and cluster scheduling",
          "SQL on Hadoop with Apache Hive: Tables, partitioning, and bucketing"
        ]
      },
      {
        title: "Module 2: Distributed Processing with Apache Spark",
        description: "In-memory distributed computing with Spark Core and DataFrames.",
        topics: [
          "Spark architecture: Driver, Executors, SparkContext, and DAG engine",
          "Resilient Distributed Datasets (RDDs): Transformations, actions, and lineage",
          "PySpark DataFrames API: Schema enforcement, filtering, aggregations, and joins",
          "Spark SQL: Temporary views, window functions, and Catalyst query optimizer"
        ]
      },
      {
        title: "Module 3: Real-Time Streaming with Apache Kafka & Spark",
        description: "High-throughput message brokers and continuous stream processing.",
        topics: [
          "Kafka architecture: Topics, partitions, brokers, producers, and consumer groups",
          "Kafka Connect and Schema Registry for real-time data ingestion",
          "Spark Structured Streaming: Watermarking, windowed operations, and output modes",
          "Building a real-time IoT / Financial fraud detection pipeline"
        ]
      },
      {
        title: "Module 4: AWS Cloud Data Lake & Lakehouse Engineering",
        description: "Serverless data processing, metadata catalogs, and columnar storage.",
        topics: [
          "Amazon S3 as an enterprise Data Lake: Object storage, prefixes, and lifecycle policies",
          "AWS Glue Data Catalog, Crawlers, and Serverless ETL jobs",
          "Interactive SQL queries on S3 files using Amazon Athena and Presto",
          "Modern table formats: Apache Iceberg and Delta Lake for ACID transactions"
        ]
      },
      {
        title: "Module 5: Cloud Data Warehousing with Amazon Redshift",
        description: "Columnar database architecture, distribution keys, and analytics at scale.",
        topics: [
          "Amazon Redshift architecture: Leader node, compute nodes, and slices",
          "Table design: Distribution styles (KEY, EVEN, ALL) and Sort Keys",
          "Data ingestion with COPY command from S3 and concurrency scaling",
          "Analytical reporting and BI dashboard integration"
        ]
      },
      {
        title: "Module 6: Pipeline Orchestration with Apache Airflow & Capstone",
        description: "Workflow scheduling, monitoring, and end-to-end data pipeline project.",
        topics: [
          "Airflow architecture: Scheduler, Webserver, Workers, and Metadata database",
          "Authoring Directed Acyclic Graphs (DAGs): Tasks, operators, and sensors",
          "Error handling, retries, notifications, and backfilling historical data",
          "Capstone Project: End-to-end Big Data Lakehouse pipeline from Kafka to Redshift"
        ]
      }
    ],
    targetAudience: [
      "Data engineers and ETL developers looking to upgrade to modern cloud and Spark stacks",
      "Software developers and DBA professionals seeking high-scale data engineering roles",
      "Analytics professionals wanting to engineer real-time and distributed data pipelines"
    ],
    prerequisites: "Intermediate knowledge of SQL and programming experience in Python."
  }
];

export const courseCategories = [
  { name: "All Programs", slug: "all", count: 7 },
  { name: "AI & Data Science", slug: "ai-data-science", count: 1 },
  { name: "Generative AI", slug: "generative-ai", count: 1 },
  { name: "Full Stack Development", slug: "full-stack", count: 2 },
  { name: "Cyber Security", slug: "cyber-security", count: 1 },
  { name: "Cloud & DevOps", slug: "cloud-devops", count: 1 },
  { name: "Data Engineering", slug: "data-engineering", count: 1 }
];

export function getAllCourses(): Course[] {
  return coursesData;
}

export function getFeaturedCourses(): Course[] {
  return coursesData.filter((c) => c.featured);
}

export function getPopularCourses(): Course[] {
  return coursesData.filter((c) => c.popular);
}

export function getCourseBySlug(slug: string): Course | undefined {
  const normalized = (slug || "").trim().toLowerCase();
  
  // Direct match or alias matching for generative-ai
  if (
    normalized === "generative-ai-and-agentic-ai-development" ||
    normalized === "generative-ai-agentic-ai-development"
  ) {
    return coursesData.find((c) => c.slug === "generative-ai-agentic-ai-development");
  }

  return coursesData.find((c) => c.slug.toLowerCase() === normalized);
}
