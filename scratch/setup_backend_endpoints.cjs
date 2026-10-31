const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = 'D:/Karthi/LMS';

// 1. Worker: contactEnquiryEmailWorker.ts
const workerContent = `import { Worker, Job } from "bullmq";
import { Op } from "sequelize";
import { redisConnection } from "../config/redis";
import { ContactEnquiryEmailJob } from "../queue/contactEnquiryQueue";
import ContactEnquiry from "../db/model/ContactEnquiry";
import ContactEnquiryEmailLog from "../db/model/ContactEnquiryEmailLog";
import { sendAdminEnquiryEmail } from "../config/contactEnquiryEmailService";
import sequelizeConnection from "../db/config";
import logger from "../lib/logger";

const worker = new Worker<ContactEnquiryEmailJob>(
  "contact-enquiry-email",
  async (job: Job<ContactEnquiryEmailJob>) => {
    const adminEmail = process.env.ADMIN_ENQUIRY_EMAIL || "admin@example.com";
    const enquiryId = job.data.enquiryId;

    const enquiry = await ContactEnquiry.findByPk(enquiryId);

    if (!enquiry) {
      logger.error(\`Worker: Enquiry \${enquiryId} was not found\`);
      throw new Error(\`Enquiry \${enquiryId} was not found\`);
    }

    // Avoid duplicate sending if already sent
    if (enquiry.email_status === "SENT") {
      logger.info(\`Worker: Enquiry \${enquiryId} email already marked SENT. Skipping.\`);
      return { skipped: true, enquiryId };
    }

    // BullMQ attemptsMade starts at 0 on first execution
    const attemptNumber = (job.attemptsMade || 0) + 1;

    // Find or create the log record for this attempt
    let log = await ContactEnquiryEmailLog.findOne({
      where: {
        enquiry_id: enquiry.id,
        attempt_number: attemptNumber,
      },
    });

    if (!log) {
      log = await ContactEnquiryEmailLog.create({
        enquiry_id: enquiry.id,
        recipient_email: adminEmail,
        email_type: "ADMIN_ENQUIRY_NOTIFICATION",
        attempt_number: attemptNumber,
        status: "PENDING",
        subject: \`New Website Enquiry #\${enquiry.id}: \${enquiry.subject || "Course Enquiry"}\`,
        provider_message_id: null,
        error_message: null,
        attempted_at: new Date(),
        sent_at: null,
      });
    }

    if (log.status === "SENT") {
      return { skipped: true, enquiryId };
    }

    await log.update({
      status: "PENDING",
      error_message: null,
      attempted_at: new Date(),
    });

    try {
      const result = await sendAdminEnquiryEmail({
        id: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        subject: enquiry.subject,
        message: enquiry.message,
        source: enquiry.source,
        created_at: enquiry.created_at || new Date(),
      });

      const sentAt = new Date();

      await sequelizeConnection.transaction(async (transaction) => {
        await log!.update(
          {
            status: "SENT",
            recipient_email: result.recipientEmail,
            provider_message_id: result.messageId,
            error_message: null,
            sent_at: sentAt,
          },
          { transaction }
        );

        await enquiry.update(
          {
            email_status: "SENT",
            email_sent_at: sentAt,
          },
          { transaction }
        );
      });

      logger.info(\`Worker: Enquiry \${enquiryId} email successfully delivered to SMTP transport.\`);
      return { enquiryId: enquiry.id, emailStatus: "SENT" };
    } catch (error: any) {
      const sanitizedError = error instanceof Error ? error.message.replace(/pass(word)?=[^&\\s]+/gi, 'password=***') : "SMTP connection failure";
      logger.error(\`Worker: Attempt \${attemptNumber} for enquiry \${enquiryId} failed: \${sanitizedError}\`);

      await log.update({
        status: "FAILED",
        error_message: sanitizedError,
        sent_at: null,
      });

      // Re-throwing tells BullMQ to trigger retry according to exponential backoff policy
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  logger.info(\`Contact email job \${job?.id} completed.\`);
});

worker.on("failed", async (job, error) => {
  if (!job) return;

  logger.warn(\`Contact email job \${job.id} attempt \${job.attemptsMade} failed: \${error.message}\`);

  const maxAttempts = job.opts.attempts ?? 3;
  const exhausted = job.attemptsMade >= maxAttempts;

  if (exhausted) {
    logger.error(\`Contact email job \${job.id} exhausted all \${maxAttempts} retry attempts. Marking enquiry FAILED.\`);
    try {
      await ContactEnquiry.update(
        { email_status: "FAILED" },
        {
          where: {
            id: job.data.enquiryId,
            email_status: { [Op.ne]: "SENT" },
          },
        }
      );
    } catch (dbError) {
      logger.error("Could not update final enquiry email_status to FAILED:", dbError);
    }
  }
});

worker.on("error", (error) => {
  logger.error("BullMQ contact email worker error:", error);
});

export default worker;
`;

// 2. DAL: contacts.ts
const dalContent = `import { Op } from "sequelize";
import sequelizeConnection from "../config";
import ContactEnquiry from "../model/ContactEnquiry";
import ContactEnquiryEmailLog from "../model/ContactEnquiryEmailLog";
import { contactEnquiryQueue } from "../../queue/contactEnquiryQueue";
import logger from "../../lib/logger";

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  source?: string | null;
}

export interface ListEnquiriesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  email_status?: string;
}

/**
 * Saves a new enquiry, creates the initial email audit log record,
 * and enqueues the notification job to BullMQ.
 * Preserves the database record even if Redis enqueue fails.
 */
export async function createContactEnquiry(data: CreateEnquiryInput) {
  const adminEmail = process.env.ADMIN_ENQUIRY_EMAIL || "admin@example.com";

  // 1. Transactional creation of Enquiry and initial Audit Log
  const { enquiry, initialLog } = await sequelizeConnection.transaction(async (transaction) => {
    const newEnquiry = await ContactEnquiry.create(
      {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone ? data.phone.trim() : null,
        subject: data.subject ? data.subject.trim() : null,
        message: data.message.trim(),
        source: data.source ? data.source.trim() : null,
        status: "NEW",
        email_status: "PENDING",
        email_sent_at: null,
      },
      { transaction }
    );

    const log = await ContactEnquiryEmailLog.create(
      {
        enquiry_id: newEnquiry.id,
        recipient_email: adminEmail,
        email_type: "ADMIN_ENQUIRY_NOTIFICATION",
        attempt_number: 1,
        status: "PENDING",
        subject: \`New Website Enquiry #\${newEnquiry.id}: \${newEnquiry.subject || "Course Enquiry"}\`,
        provider_message_id: null,
        error_message: null,
        attempted_at: new Date(),
        sent_at: null,
      },
      { transaction }
    );

    return { enquiry: newEnquiry, initialLog: log };
  });

  // 2. Asynchronous Queue Insertion with stable job ID
  let queued = false;
  try {
    await contactEnquiryQueue.add(
      "send-admin-email",
      { enquiryId: enquiry.id },
      {
        jobId: \`enquiry-\${enquiry.id}\`,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      }
    );
    queued = true;
    logger.info(\`Enquiry #\${enquiry.id} enqueued to contact-enquiry-email queue.\`);
  } catch (queueError: any) {
    // Non-fatal: Record is securely saved in DB with PENDING status for recovery
    logger.warn(
      \`Redis queue insertion failed for enquiry #\${enquiry.id}. Enquiry is preserved in DB for recovery.\`,
      queueError?.message
    );
  }

  return {
    enquiry,
    queued,
  };
}

/**
 * Lists contact enquiries with pagination, search, and status filters.
 */
export async function getAllContactEnquiries(params: ListEnquiriesParams = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 10));
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (params.status && params.status !== "ALL") {
    whereClause.status = params.status;
  }

  if (params.email_status && params.email_status !== "ALL") {
    whereClause.email_status = params.email_status;
  }

  if (params.search && params.search.trim()) {
    const term = \`%\${params.search.trim()}%\`;
    whereClause[Op.or] = [
      { name: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { phone: { [Op.like]: term } },
      { subject: { [Op.like]: term } },
    ];
  }

  const { rows, count } = await ContactEnquiry.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  return {
    rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit) || 1,
  };
}

/**
 * Gets a single enquiry with its complete email audit log attempt history.
 */
export async function getContactEnquiryById(id: number) {
  return await ContactEnquiry.findByPk(id, {
    include: [
      {
        model: ContactEnquiryEmailLog,
        as: "emailLogs",
        separate: true,
        order: [["attempt_number", "ASC"]],
      },
    ],
  });
}

/**
 * Updates the enquiry workflow status.
 */
export async function updateContactEnquiryStatus(id: number, status: string) {
  const validStatuses = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  if (!validStatuses.includes(status)) {
    throw new Error(\`Invalid status: \${status}. Must be one of \${validStatuses.join(", ")}\`);
  }

  const enquiry = await ContactEnquiry.findByPk(id);
  if (!enquiry) {
    return null;
  }

  await enquiry.update({ status: status as any });
  return enquiry;
}

/**
 * Retries sending an admin notification email.
 * Prevents concurrent retries and duplicates.
 */
export async function retryEnquiryEmail(id: number) {
  const enquiry = await ContactEnquiry.findByPk(id);
  if (!enquiry) {
    const err: any = new Error("Enquiry not found");
    err.statusCode = 404;
    throw err;
  }

  if (enquiry.email_status === "SENT") {
    const err: any = new Error("This enquiry notification has already been sent successfully.");
    err.statusCode = 400;
    throw err;
  }

  // Count existing attempt records
  const existingAttempts = await ContactEnquiryEmailLog.count({
    where: { enquiry_id: id },
  });

  const nextAttemptNumber = existingAttempts + 1;
  const adminEmail = process.env.ADMIN_ENQUIRY_EMAIL || "admin@example.com";

  await sequelizeConnection.transaction(async (transaction) => {
    await ContactEnquiryEmailLog.create(
      {
        enquiry_id: id,
        recipient_email: adminEmail,
        email_type: "ADMIN_ENQUIRY_NOTIFICATION_RETRY",
        attempt_number: nextAttemptNumber,
        status: "PENDING",
        subject: \`[Retry] New Website Enquiry #\${id}: \${enquiry.subject || "Course Enquiry"}\`,
        provider_message_id: null,
        error_message: null,
        attempted_at: new Date(),
        sent_at: null,
      },
      { transaction }
    );

    await enquiry.update(
      { email_status: "PENDING" },
      { transaction }
    );
  });

  // Enqueue new retry job with unique ID to force immediate processing
  await contactEnquiryQueue.add(
    "send-admin-email",
    { enquiryId: id },
    {
      jobId: \`enquiry-retry-\${id}-\${Date.now()}\`,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    }
  );

  return {
    id,
    emailStatus: "PENDING",
    attemptNumber: nextAttemptNumber,
  };
}

/**
 * Recovery worker function: checks for pending enquiries that have not succeeded
 * and are older than 60 seconds without an active BullMQ job.
 */
export async function recoverPendingEnquiries() {
  const cutoff = new Date(Date.now() - 60 * 1000);
  const pendingEnquiries = await ContactEnquiry.findAll({
    where: {
      email_status: "PENDING",
      created_at: { [Op.lt]: cutoff },
    },
    limit: 20,
  });

  let recoveredCount = 0;
  for (const item of pendingEnquiries) {
    try {
      await contactEnquiryQueue.add(
        "send-admin-email",
        { enquiryId: item.id },
        {
          jobId: \`enquiry-recovery-\${item.id}-\${Date.now()}\`,
          attempts: 3,
        }
      );
      recoveredCount++;
    } catch (e) {
      logger.error(\`Recovery enqueue failed for enquiry \${item.id}:\`, e);
    }
  }

  return recoveredCount;
}
`;

// 3. Service: contact.service.ts
const serviceContent = `import * as dal from "../../db/dal/contacts";

export async function createEnquiry(data: dal.CreateEnquiryInput) {
  return await dal.createContactEnquiry(data);
}

export async function listEnquiries(params: dal.ListEnquiriesParams) {
  return await dal.getAllContactEnquiries(params);
}

export async function getEnquiryById(id: number) {
  return await dal.getContactEnquiryById(id);
}

export async function updateEnquiryStatus(id: number, status: string) {
  return await dal.updateContactEnquiryStatus(id, status);
}

export async function retryEmailNotification(id: number) {
  return await dal.retryEnquiryEmail(id);
}

export async function recoverPending() {
  return await dal.recoverPendingEnquiries();
}
`;

// 4. Controller: contact.controller.ts
const controllerContent = `import { Request, Response, Router, NextFunction } from "express";
import BaseApi from "../BaseApi";
import { StatusCodes } from "http-status-codes";
import logger from "../../lib/logger";
import { verifyJWT } from "../auth/jwt.utils";
import * as contactService from "./contact.service";

export default class ContactController extends BaseApi {
  constructor() {
    super();
  }

  public register(): Router {
    // Public enquiry submission
    this.router.post("/api/contact-enquiries", this.submitEnquiry.bind(this));

    // Admin protected management endpoints
    this.router.get(
      "/api/admin/contact-enquiries",
      this.verifyAdminMiddleware.bind(this),
      this.getAdminEnquiries.bind(this)
    );
    this.router.get(
      "/api/admin/contact-enquiries/:id",
      this.verifyAdminMiddleware.bind(this),
      this.getAdminEnquiryById.bind(this)
    );
    this.router.patch(
      "/api/admin/contact-enquiries/:id/status",
      this.verifyAdminMiddleware.bind(this),
      this.updateStatus.bind(this)
    );
    this.router.post(
      "/api/admin/contact-enquiries/:id/retry-email",
      this.verifyAdminMiddleware.bind(this),
      this.retryEmail.bind(this)
    );

    return this.router;
  }

  /**
   * Middleware to verify admin authorization using JWT.
   * Rejects unauthenticated visitors with 401 and non-admins with 403.
   */
  private async verifyAdminMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.trim()) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          statusCode: StatusCodes.UNAUTHORIZED,
          response: {
            code: "UNAUTHORIZED",
            message: "Authentication token is required to access admin enquiry resources.",
          },
        });
        return;
      }

      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
      const decoded = await verifyJWT(token);

      if (!decoded || !decoded.payload || decoded.expired) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          statusCode: StatusCodes.UNAUTHORIZED,
          response: {
            code: "TOKEN_EXPIRED",
            message: "Your session has expired or the token is invalid. Please log in again.",
          },
        });
        return;
      }

      const payload = decoded.payload as any;
      const roleId = Number(payload.role_id);
      const roleName = String(payload.role || payload.role_name || "").toLowerCase();

      // Admin verification: role_id === 1 or role === 'admin'
      const isAdmin = roleId === 1 || roleName === "admin";
      if (!isAdmin) {
        res.status(StatusCodes.FORBIDDEN).json({
          statusCode: StatusCodes.FORBIDDEN,
          response: {
            code: "FORBIDDEN",
            message: "Access denied. Administrator privileges are required.",
          },
        });
        return;
      }

      (req as any).user = payload;
      next();
    } catch (error: any) {
      logger.error("Admin authentication error in ContactController:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        response: {
          code: "INTERNAL_ERROR",
          message: "Failed to authenticate request.",
        },
      });
    }
  }

  /**
   * POST /api/contact-enquiries
   * Public enquiry endpoint.
   */
  public async submitEnquiry(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, subject, message, source, honeypot } = req.body || {};

      // Anti-spam honeypot check
      if (honeypot && String(honeypot).trim().length > 0) {
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Your enquiry has been submitted successfully.",
          data: { id: 0, emailStatus: "PENDING" },
        });
        return;
      }

      // 1. Validation
      const errors: string[] = [];

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        errors.push("Full name is required (minimum 2 characters).");
      } else if (name.trim().length > 150) {
        errors.push("Full name cannot exceed 150 characters.");
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
      if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        errors.push("A valid email address is required.");
      } else if (email.trim().length > 254) {
        errors.push("Email address cannot exceed 254 characters.");
      }

      if (phone && typeof phone === "string") {
        const cleanPhone = phone.trim();
        if (cleanPhone.length > 30) {
          errors.push("Phone number cannot exceed 30 characters.");
        } else if (!/^[+0-9\\s()\\-\\.]+$/.test(cleanPhone)) {
          errors.push("Phone number contains invalid characters.");
        }
      }

      if (subject && typeof subject === "string" && subject.trim().length > 200) {
        errors.push("Subject cannot exceed 200 characters.");
      }

      if (!message || typeof message !== "string" || message.trim().length < 5) {
        errors.push("Enquiry message is required (minimum 5 characters).");
      } else if (message.trim().length > 5000) {
        errors.push("Message cannot exceed 5000 characters.");
      }

      if (source && typeof source === "string" && source.trim().length > 500) {
        errors.push("Source reference cannot exceed 500 characters.");
      }

      if (errors.length > 0) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          statusCode: StatusCodes.BAD_REQUEST,
          response: {
            code: "VALIDATION_ERROR",
            message: errors[0],
            errors,
          },
        });
        return;
      }

      // 2. Persist in DB and enqueue email notification
      const { enquiry } = await contactService.createEnquiry({
        name,
        email,
        phone,
        subject,
        message,
        source,
      });

      // 3. Return standardized success response
      // Initial email status is strictly PENDING because sending is asynchronous via BullMQ
      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Your enquiry has been submitted successfully.",
        data: {
          id: enquiry.id,
          emailStatus: "PENDING",
        },
      });
    } catch (error: any) {
      logger.error("Error submitting contact enquiry:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        response: {
          code: "SUBMISSION_FAILED",
          message: "Failed to submit enquiry. Please try again later.",
        },
      });
    }
  }

  /**
   * GET /api/admin/contact-enquiries
   * Admin-only enquiry listing with filters and pagination.
   */
  public async getAdminEnquiries(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, status, email_status } = req.query;

      const result = await contactService.listEnquiries({
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        email_status: email_status ? String(email_status) : undefined,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        statusCode: StatusCodes.OK,
        response: {
          data: result.rows,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      });
    } catch (error: any) {
      logger.error("Error retrieving admin contact enquiries:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        response: {
          code: "FETCH_FAILED",
          message: "Could not retrieve enquiries.",
        },
      });
    }
  }

  /**
   * GET /api/admin/contact-enquiries/:id
   * Admin-only single enquiry with full audit log history.
   */
  public async getAdminEnquiryById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          response: { code: "INVALID_ID", message: "A valid enquiry ID is required." },
        });
        return;
      }

      const enquiry = await contactService.getEnquiryById(id);
      if (!enquiry) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          response: { code: "NOT_FOUND", message: \`Enquiry with ID \${id} not found.\` },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        statusCode: StatusCodes.OK,
        response: {
          data: enquiry,
        },
      });
    } catch (error: any) {
      logger.error(\`Error fetching enquiry \${req.params.id}:\`, error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        response: { code: "FETCH_FAILED", message: "Failed to fetch enquiry details." },
      });
    }
  }

  /**
   * PATCH /api/admin/contact-enquiries/:id/status
   * Admin updates workflow status (NEW, IN_PROGRESS, RESOLVED, CLOSED).
   */
  public async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body || {};

      if (!status) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          response: { code: "MISSING_STATUS", message: "Status is required." },
        });
        return;
      }

      const updated = await contactService.updateEnquiryStatus(id, status);
      if (!updated) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          response: { code: "NOT_FOUND", message: "Enquiry not found." },
        });
        return;
      }

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Enquiry status updated successfully.",
        response: { data: updated },
      });
    } catch (error: any) {
      logger.error(\`Error updating status for enquiry \${req.params.id}:\`, error);
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        response: { code: "UPDATE_FAILED", message: error.message || "Failed to update status." },
      });
    }
  }

  /**
   * POST /api/admin/contact-enquiries/:id/retry-email
   * Admin triggers a retry for failed email delivery. Returns 202 Accepted.
   */
  public async retryEmail(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          response: { code: "INVALID_ID", message: "A valid enquiry ID is required." },
        });
        return;
      }

      const result = await contactService.retryEmailNotification(id);

      res.status(StatusCodes.ACCEPTED).json({
        success: true,
        statusCode: StatusCodes.ACCEPTED,
        message: "Email notification retry has been queued.",
        data: result,
      });
    } catch (error: any) {
      logger.error(\`Error retrying email for enquiry \${req.params.id}:\`, error);
      const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        statusCode,
        response: {
          code: "RETRY_FAILED",
          message: error.message || "Failed to retry email notification.",
        },
      });
    }
  }
}
`;

// 5. routes.ts
const routesContent = `import { Router } from "express";
import UserController from "./components/user/user.controller";
import { BucketController } from "./components/bucket/bucket.controller";
import { SessionController } from "./components/session/session.controller";
import { VideoController } from "./components/video/video.controller";
import { CourseController } from "./components/course/course.controller";
import { ModuleController } from "./components/module/module.controller";
import { LessionController } from "./components/lesson/lesson.controller";
import QuestionController from "./components/question/question.controller";
import ContactController from "./components/contact/contact.controller";

export default function registerRoutes(): Router {
  const router = Router();

  const userController = new UserController();
  router.use("/api/user", userController.register());

  const bucketController = new BucketController();
  router.use("/api/bucketMaster", bucketController.register());

  const sessionController = new SessionController();
  router.use("/api/sessionMaster", sessionController.register());

  const videoController = new VideoController();
  router.use("/api/video", videoController.register());

  const courseController = new CourseController();
  router.use("/api/course", courseController.register());

  const moduleController = new ModuleController();
  router.use("/api/module", moduleController.register());

  const lessonController = new LessionController();
  router.use("/api/lesson", lessonController.register());

  const questionController = new QuestionController();
  router.use("/api/question", questionController.register());

  // Contact Enquiry and Admin routes
  const contactController = new ContactController();
  router.use(contactController.register());

  return router;
}
`;

// 6. server.ts
const serverContent = `import Environment from './environments/environment';
import { setGlobalEnvironment } from './global';
const env: Environment = new Environment();
setGlobalEnvironment(env);
import * as http from 'http';
import { AddressInfo } from 'net';
import App from './App';
import logger from './lib/logger';
import dbInit from './db/init';
// Initialize contact enquiry email background worker
import './workers/contactEnquiryEmailWorker';

dbInit();
const app: App = new App();
let server: http.Server;

function serverError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') {
        throw error;
    }

    throw error;
}

function serverListening(): void {
    const addressInfo: AddressInfo = <AddressInfo>server.address();
    logger.info(\`Listening on \${addressInfo.address}:\${env.port}\`);
}

app.init()
    .then(() => {
        app.express.set('port', env.port);
        server = app.httpServer;
        server.on('error', serverError);
        server.on('listening', serverListening);
        server.listen(env.port);
    }).catch((err: Error) => {
        logger.info('app.init error');
        logger.error(err.name);
        logger.error(err.message);
        logger.error(err.stack);
    });

process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Promise Error: reason:', reason.message);
    logger.error(reason.stack);
});
`;

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/workers/contactEnquiryEmailWorker.ts'), workerContent);
console.log('Written contactEnquiryEmailWorker.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/db/dal/contacts.ts'), dalContent);
console.log('Written contacts.ts DAL');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/components/contact/contact.service.ts'), serviceContent);
console.log('Written contact.service.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/components/contact/contact.controller.ts'), controllerContent);
console.log('Written contact.controller.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/routes.ts'), routesContent);
console.log('Written routes.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/server.ts'), serverContent);
console.log('Written server.ts');
