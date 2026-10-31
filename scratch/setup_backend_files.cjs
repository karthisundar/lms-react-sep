const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = 'D:/Karthi/LMS';

// 1. ContactEnquiry.ts
const contactEnquiryContent = `import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import sequelizeConnection from "../config";

export interface ContactEnquiryAttributes {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  email_status: "PENDING" | "SENT" | "FAILED";
  email_sent_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export type ContactEnquiryCreationAttributes = Optional<
  ContactEnquiryAttributes,
  | "id"
  | "phone"
  | "subject"
  | "source"
  | "status"
  | "email_status"
  | "email_sent_at"
  | "created_at"
  | "updated_at"
>;

export class ContactEnquiry
  extends Model<ContactEnquiryAttributes, ContactEnquiryCreationAttributes>
  implements ContactEnquiryAttributes
{
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare subject: string | null;
  declare message: string;
  declare source: string | null;
  declare status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  declare email_status: "PENDING" | "SENT" | "FAILED";
  declare email_sent_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initContactEnquiry(sequelize: Sequelize = sequelizeConnection) {
  ContactEnquiry.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "NEW",
      },
      email_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDING",
      },
      email_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "contact_enquiries",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return ContactEnquiry;
}

initContactEnquiry(sequelizeConnection);

export default ContactEnquiry;
`;

// 2. ContactEnquiryEmailLog.ts
const emailLogContent = `import { DataTypes, Model, Optional, Sequelize } from "sequelize";
import sequelizeConnection from "../config";

export interface ContactEnquiryEmailLogAttributes {
  id: number;
  enquiry_id: number | null;
  recipient_email: string;
  email_type: string;
  attempt_number: number;
  status: "PENDING" | "SENT" | "FAILED";
  subject: string;
  provider_message_id: string | null;
  error_message: string | null;
  attempted_at: Date;
  sent_at: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

export type ContactEnquiryEmailLogCreationAttributes = Optional<
  ContactEnquiryEmailLogAttributes,
  | "id"
  | "enquiry_id"
  | "email_type"
  | "attempt_number"
  | "status"
  | "provider_message_id"
  | "error_message"
  | "attempted_at"
  | "sent_at"
  | "created_at"
  | "updated_at"
>;

export class ContactEnquiryEmailLog
  extends Model<
    ContactEnquiryEmailLogAttributes,
    ContactEnquiryEmailLogCreationAttributes
  >
  implements ContactEnquiryEmailLogAttributes
{
  declare id: number;
  declare enquiry_id: number | null;
  declare recipient_email: string;
  declare email_type: string;
  declare attempt_number: number;
  declare status: "PENDING" | "SENT" | "FAILED";
  declare subject: string;
  declare provider_message_id: string | null;
  declare error_message: string | null;
  declare attempted_at: Date;
  declare sent_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initContactEnquiryEmailLog(sequelize: Sequelize = sequelizeConnection) {
  ContactEnquiryEmailLog.init(
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      enquiry_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      recipient_email: {
        type: DataTypes.STRING(254),
        allowNull: false,
      },
      email_type: {
        type: DataTypes.STRING(60),
        allowNull: false,
        defaultValue: "ADMIN_ENQUIRY_NOTIFICATION",
      },
      attempt_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDING",
      },
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      provider_message_id: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      attempted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "contact_enquiry_email_logs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );
  return ContactEnquiryEmailLog;
}

initContactEnquiryEmailLog(sequelizeConnection);

export default ContactEnquiryEmailLog;
`;

// 3. associations.ts
const associationsContent = `import LessonMaster from "./LessonMaster";
import QuestionMaster from "./QuestionMaster";
import QuestionAnswer from "./QuestionAnswer";
import ContactEnquiry from "./ContactEnquiry";
import ContactEnquiryEmailLog from "./ContactEnquiryEmailLog";

// One lesson has many questions.
LessonMaster.hasMany(QuestionMaster, {
  foreignKey: "lessonId",
  sourceKey: "lessonId",
  as: "questions",
});

QuestionMaster.belongsTo(LessonMaster, {
  foreignKey: "lessonId",
  targetKey: "lessonId",
  as: "lesson",
});

// One question has many answers.
QuestionMaster.hasMany(QuestionAnswer, {
  foreignKey: "questionId",
  sourceKey: "questionId",
  as: "answers",
});

QuestionAnswer.belongsTo(QuestionMaster, {
  foreignKey: "questionId",
  targetKey: "questionId",
  as: "question",
});

// Contact Enquiry associations
ContactEnquiry.hasMany(ContactEnquiryEmailLog, {
  foreignKey: "enquiry_id",
  sourceKey: "id",
  as: "emailLogs",
});

ContactEnquiryEmailLog.belongsTo(ContactEnquiry, {
  foreignKey: "enquiry_id",
  targetKey: "id",
  as: "enquiry",
});
`;

// 4. init.ts
const initContent = `import BucketMaster from "./model/BucketMaster";
import CourseMaster from "./model/CourseMaster";
import LessonMaster from "./model/LessonMaster";
import LessonNoteMaster from "./model/LessonNotes";
import LessonVideoMapping from "./model/LessonVideoMapping";
import MenuItems from "./model/MenuItems";
import MenuMaster from "./model/MenuMaster";
import ModuleMaster from "./model/ModuleMaster";
import RoleMenuAccess from "./model/RoleMenuAccess";
import SessionMaster from "./model/SessionMaster";
import User from "./model/User";
import UserLessonMapping from "./model/UserLessonMapping";
import UserRoleMapping from "./model/UserMaping";
import UserRole from "./model/UserRole";
import UserSessionMapping from "./model/UserSessionMapping";
import User_token from "./model/UserToken";
import VideoMaster from "./model/VideoMaster";
import VideoWatchProgress from "./model/VideoWatchProgress";
import LecturerCourseMapping from "./model/LecturerCourseMapping";
import QuestionMaster from "./model/QuestionMaster";
import QuestionAnswer from "./model/QuestionAnswer";
import ContactEnquiry from "./model/ContactEnquiry";
import ContactEnquiryEmailLog from "./model/ContactEnquiryEmailLog";
import "./model/associations";

const dbInit = () =>
  Promise.all([
    User.sync(),
    User_token.sync(),
    SessionMaster.sync(),
    UserRoleMapping.sync(),
    UserRole.sync(),
    BucketMaster.sync(),
    VideoMaster.sync(),
    UserSessionMapping.sync(),
    RoleMenuAccess.sync(),
    MenuMaster.sync(),
    MenuItems.sync(),
    VideoWatchProgress.sync(),
    CourseMaster.sync(),
    LessonMaster.sync(),
    LessonNoteMaster.sync(),
    LessonVideoMapping.sync(),
    ModuleMaster.sync(),
    UserLessonMapping.sync(),
    LecturerCourseMapping.sync(),
    QuestionMaster.sync(),
    QuestionAnswer.sync(),
    ContactEnquiry.sync(),
    ContactEnquiryEmailLog.sync(),
  ]);

export default dbInit;
`;

// 5. contactEnquiryEmailService.ts
const emailServiceContent = `import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.SMTP_HOST || "127.0.0.1";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER || "dev_user";
  const smtpPassword = process.env.SMTP_PASSWORD || "dev_password";

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    // Prevent unhandled connection hangs
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });

  return cachedTransporter;
}

// For unit tests: allow injecting custom or mock transporter
export function setTransporterForTesting(testTransporter: Transporter | null) {
  cachedTransporter = testTransporter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// Strip CR/LF to prevent header injection attacks
function sanitizeHeader(value: string): string {
  return value.replace(/[\\r\\n]/g, " ").trim();
}

export interface EnquiryEmailData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  created_at: Date;
}

/**
 * Sends an email notification to the configured administrator.
 * 
 * NOTE ON RELIABILITY:
 * SMTP transport acceptance (a successful return from sendMail) only confirms that the
 * immediate upstream SMTP relay or mail server accepted the message for delivery.
 * It does NOT guarantee final mailbox delivery to the recipient's inbox.
 */
export async function sendAdminEnquiryEmail(enquiry: EnquiryEmailData) {
  const adminEmail = sanitizeHeader(process.env.ADMIN_ENQUIRY_EMAIL || "admin@example.com");
  const emailFrom = sanitizeHeader(process.env.EMAIL_FROM || "no-reply@example.com");

  const message = escapeHtml(enquiry.message).replace(/\\r?\\n/g, "<br>");
  const name = escapeHtml(enquiry.name);
  const email = escapeHtml(enquiry.email);
  const phone = escapeHtml(enquiry.phone || "Not provided");
  const subject = escapeHtml(enquiry.subject || "General Enquiry");
  const source = escapeHtml(enquiry.source || "Not provided");
  const submittedAt = escapeHtml(new Date(enquiry.created_at).toISOString());

  const mailOptions: SendMailOptions = {
    from: emailFrom,
    to: adminEmail,
    subject: sanitizeHeader(\`New Website Enquiry #\${enquiry.id}: \${enquiry.subject || "Course Enquiry"}\`),
    replyTo: sanitizeHeader(enquiry.email),
    text: [
      \`New Website Enquiry #\${enquiry.id}\`,
      \`----------------------------------------\`,
      \`Name: \${enquiry.name}\`,
      \`Email: \${enquiry.email}\`,
      \`Phone: \${enquiry.phone || "Not provided"}\`,
      \`Subject: \${enquiry.subject || "General enquiry"}\`,
      \`Source: \${enquiry.source || "Not provided"}\`,
      \`Submitted (UTC): \${submittedAt}\`,
      \`\`,
      \`Message:\`,
      enquiry.message,
    ].join("\\n"),
    html: \`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #111827; font-size: 20px; font-weight: 700;">New Website Enquiry #\${enquiry.id}</h2>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">A visitor has submitted a new enquiry via the scroll popup form.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600; width: 30%;">Full Name</td>
              <td style="padding: 10px 12px; color: #111827; font-weight: 500;">\${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600;">Email Address</td>
              <td style="padding: 10px 12px; color: #111827;"><a href="mailto:\${email}" style="color: #4f46e5; text-decoration: none;">\${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600;">Phone Number</td>
              <td style="padding: 10px 12px; color: #111827;">\${phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600;">Subject / Course</td>
              <td style="padding: 10px 12px; color: #111827;">\${subject}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600;">Source URL</td>
              <td style="padding: 10px 12px; color: #6b7280; font-size: 13px;">\${source}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
              <td style="padding: 10px 12px; color: #4b5563; font-weight: 600;">Submitted At</td>
              <td style="padding: 10px 12px; color: #6b7280; font-size: 13px;">\${submittedAt}</td>
            </tr>
          </tbody>
        </table>
        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; color: #334155; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Visitor Message:</h4>
          <p style="margin: 0; color: #1e293b; line-height: 1.6; font-size: 14px;">\${message}</p>
        </div>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; text-align: center; color: #9ca3af; font-size: 12px;">
          This is an automated notification from your LMS Course Platform. Reply directly to this email to contact the visitor.
        </div>
      </div>
    \`,
  };

  const transporter = getTransporter();
  const result = await transporter.sendMail(mailOptions);

  return {
    recipientEmail: adminEmail,
    messageId: result.messageId || null,
  };
}
`;

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/db/model/ContactEnquiry.ts'), contactEnquiryContent);
console.log('Written ContactEnquiry.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/db/model/ContactEnquiryEmailLog.ts'), emailLogContent);
console.log('Written ContactEnquiryEmailLog.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/db/model/associations.ts'), associationsContent);
console.log('Written associations.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/db/init.ts'), initContent);
console.log('Written init.ts');

fs.writeFileSync(path.join(BACKEND_ROOT, 'src/config/contactEnquiryEmailService.ts'), emailServiceContent);
console.log('Written contactEnquiryEmailService.ts');
