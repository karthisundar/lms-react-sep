const fs = require('fs');

console.log('1. Updating serverlabel.config.json...');
const serverLabelPath = 'D:/Karthi/LMS/src/config/serverlabel.config.json';
const serverLabels = JSON.parse(fs.readFileSync(serverLabelPath, 'utf8'));

const newServerLabels = {
  COURSE_E_00001: { message: "Course not found.", type: "Error" },
  COURSE_E_00002: { message: "Course name is mandatory.", type: "Error" },
  COURSE_S_00001: { message: "Course created successfully.", type: "Success" },
  COURSE_S_00002: { message: "Course updated successfully.", type: "Success" },
  COURSE_S_00003: { message: "Course deleted successfully.", type: "Success" },

  MODULE_E_00001: { message: "Module not found.", type: "Error" },
  MODULE_E_00002: { message: "Module name is mandatory.", type: "Error" },
  MODULE_E_00004: { message: "Module not found.", type: "Error" },
  MODULE_E_00005: { message: "Associated course not found.", type: "Error" },
  MODULE_S_00001: { message: "Module created successfully.", type: "Success" },
  MODULE_S_00002: { message: "Module updated successfully.", type: "Success" },
  MODULE_S_00003: { message: "Module deleted successfully.", type: "Success" },

  LESSON_E_00001: { message: "Lesson not found.", type: "Error" },
  LESSON_E_00002: { message: "Lesson name is mandatory.", type: "Error" },
  LESSON_E_00003: { message: "Module reference is mandatory.", type: "Error" },
  LESSON_E_00004: { message: "Video reference is mandatory.", type: "Error" },
  LESSON_E_00005: { message: "Lesson not found.", type: "Error" },
  LESSON_S_00001: { message: "Lesson created successfully.", type: "Success" },
  LESSON_S_00002: { message: "Lesson updated successfully.", type: "Success" },
  LESSON_S_00003: { message: "Lesson deleted successfully.", type: "Success" },

  VIDEO_E_00001: { message: "Video not found.", type: "Error" },
  VIDEO_E_00002: { message: "Video title is mandatory.", type: "Error" },
  VIDEO_E_00003: { message: "Video file or URL is mandatory.", type: "Error" },
  VIDEO_E_00004: { message: "Bucket reference is mandatory.", type: "Error" },
  VIDEO_E_00005: { message: "Video duration is mandatory.", type: "Error" },
  VIDEO_E_00006: { message: "External video URL is mandatory.", type: "Error" },
  VIDEO_S_00001: { message: "Video created successfully.", type: "Success" },
  VIDEO_S_00002: { message: "Video updated successfully.", type: "Success" },
  VIDEO_S_00003: { message: "Video deleted successfully.", type: "Success" },

  SESSION_E_00001: { message: "Session not found.", type: "Error" },
  SESSION_E_00002: { message: "Session name is mandatory.", type: "Error" },
  SESSION_E_00003: { message: "Session date is mandatory.", type: "Error" },
  SESSION_E_00004: { message: "Session mapping not found.", type: "Error" },
  SESSION_S_00001: { message: "Session created successfully.", type: "Success" },
  SESSION_S_00002: { message: "Session updated successfully.", type: "Success" },
  SESSION_S_00003: { message: "Session deleted successfully.", type: "Success" },

  LESSON_VIDEO_MAPPING_E_00001: { message: "Lesson video mapping already exists.", type: "Error" },
  LESSON_VIDEO_MAPPING_E_00002: { message: "Lesson video mapping not found.", type: "Error" },
  LESSON_VIDEO_MAPPING_E_00003: { message: "Lesson and video references are mandatory.", type: "Error" },

  LESSON_NOTES_E_00001: { message: "Lesson notes not found.", type: "Error" },
  LESSON_NOTES_E_00002: { message: "Lesson reference is mandatory.", type: "Error" },
  LESSON_NOTES_E_00003: { message: "Lesson notes title is mandatory.", type: "Error" },

  USER_SESSION_E_00001: { message: "User session mapping not found.", type: "Error" },
  USER_SESSION_E_00002: { message: "User reference is mandatory.", type: "Error" },
  USER_SESSION_E_00003: { message: "Session reference is mandatory.", type: "Error" },
  USER_SESSION_E_00004: { message: "User session mapping already exists.", type: "Error" },
  USER_SESSION_E_00005: { message: "Invalid user session mapping data.", type: "Error" },

  USER_LESSON_E_00001: { message: "User lesson mapping not found.", type: "Error" },
  USER_LESSON_E_00002: { message: "User and lesson references are mandatory.", type: "Error" }
};

Object.assign(serverLabels, newServerLabels);
fs.writeFileSync(serverLabelPath, JSON.stringify(serverLabels, null, 2), 'utf8');
console.log('serverlabel.config.json updated successfully.');

console.log('2. Updating clientlabel.config.json...');
const clientLabelPath = 'D:/Karthi/LMS/src/config/clientlabel.config.json';
const clientLabels = JSON.parse(fs.readFileSync(clientLabelPath, 'utf8'));

// Format flat items into clientlabel format
for (const [code, item] of Object.entries(newServerLabels)) {
  clientLabels[code] = {
    code: code,
    message: item.message,
    type: item.type
  };
}
fs.writeFileSync(clientLabelPath, JSON.stringify(clientLabels, null, 2), 'utf8');
console.log('clientlabel.config.json updated successfully.');

console.log('3. Updating error-handler.ts...');
const errorHandlerPath = 'D:/Karthi/LMS/src/middleware/error-handler.ts';
const newErrorHandlerContent = `import * as express from "express";
import { StatusCodes } from "http-status-codes";
import serverLabelConfig from "../config/serverlabel.config.json";

const serverLabels = serverLabelConfig as Record<string, { message: string; type: string }>;

const errorHandler = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void => {
  if (err) {
    const isUniqueConstraint =
      err?.name === "SequelizeUniqueConstraintError" ||
      err?.original?.code === "ER_DUP_ENTRY" ||
      err?.code === "EMAIL_ALREADY_EXISTS";

    const rawCode = err?.code || (typeof err?.message === "string" ? err.message.trim() : "");
    const mappedLabel = serverLabels[rawCode];

    let statusCode: number = err.status || err.statusCode;
    if (!statusCode) {
      if (isUniqueConstraint || rawCode === "USER_E_00009" || rawCode.includes("_ALREADY_EXISTS") || rawCode.includes("_E_00001") && rawCode.includes("MAPPING_E_00001")) {
        statusCode = StatusCodes.CONFLICT;
      } else if (
        rawCode === "USER_E_00001" ||
        rawCode === "COURSE_E_00001" ||
        rawCode === "MODULE_E_00001" ||
        rawCode === "MODULE_E_00004" ||
        rawCode === "MODULE_E_00005" ||
        rawCode === "LESSON_E_00001" ||
        rawCode === "LESSON_E_00005" ||
        rawCode === "VIDEO_E_00001" ||
        rawCode === "SESSION_E_00001" ||
        rawCode === "SESSION_E_00004" ||
        rawCode === "LESSON_VIDEO_MAPPING_E_00002" ||
        rawCode === "LESSON_NOTES_E_00001" ||
        rawCode === "USER_SESSION_E_00001" ||
        rawCode === "USER_LESSON_E_00001" ||
        rawCode?.toLowerCase().includes("not found") ||
        rawCode?.toLowerCase().includes("not_found")
      ) {
        statusCode = StatusCodes.NOT_FOUND;
      } else if (
        rawCode === "USER_E_00004" ||
        rawCode === "USER_E_00005" ||
        rawCode === "USER_E_00012" ||
        rawCode === "Unauthorized" ||
        rawCode === "Invalid credential" ||
        rawCode?.toLowerCase().includes("unauthorized")
      ) {
        statusCode = StatusCodes.UNAUTHORIZED;
      } else if (
        rawCode.startsWith("COURSE_E_") ||
        rawCode.startsWith("MODULE_E_") ||
        rawCode.startsWith("LESSON_E_") ||
        rawCode.startsWith("VIDEO_E_") ||
        rawCode.startsWith("SESSION_E_") ||
        rawCode.startsWith("USER_E_") ||
        rawCode.startsWith("Product_E_") ||
        rawCode.startsWith("CLUB_E_") ||
        rawCode.startsWith("SALES_E_") ||
        rawCode.includes("mandatory") ||
        rawCode.includes("required") ||
        rawCode.includes("Invalid")
      ) {
        statusCode = StatusCodes.BAD_REQUEST;
      } else {
        statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      }
    }

    const errorCode = err?.code || (isUniqueConstraint ? "EMAIL_ALREADY_EXISTS" : (mappedLabel ? rawCode : undefined));
    const errorMessage = isUniqueConstraint
      ? "This email address is already registered."
      : (mappedLabel?.message || (err?.message && !err.message.startsWith("USER_E_") && !err.message.startsWith("COURSE_E_") && !err.message.startsWith("MODULE_E_") && !err.message.startsWith("LESSON_E_") && !err.message.startsWith("VIDEO_E_") && !err.message.startsWith("SESSION_E_") ? err.message.trim() : "An error occurred during the request."));

    const body: any = {
      statusCode,
      success: false,
      code: errorCode,
      message: errorMessage,
      field: err?.field || (isUniqueConstraint || rawCode === "USER_E_00009" ? "email" : undefined),
      fields: err?.fields || (err?.field ? [err.field] : undefined),
      response: {
        type: err?.errorMessageType?.type || mappedLabel?.type || "Error",
        code: [errorCode || rawCode || errorMessage],
        message: errorMessage,
        name: err?.name,
        stack: process.env.NODE_ENV === "development" ? err?.stack?.trim() : undefined,
      },
    };

    res.status(statusCode);
    res.send(body);
  }
};

export default errorHandler;
`;

fs.writeFileSync(errorHandlerPath, newErrorHandlerContent, 'utf8');
console.log('error-handler.ts updated successfully.');

console.log('4. Updating user.controller.ts...');
const userControllerPath = 'D:/Karthi/LMS/src/components/user/user.controller.ts';
let userControllerContent = fs.readFileSync(userControllerPath, 'utf8');

if (!userControllerContent.includes('this.router.post("/logout"')) {
  userControllerContent = userControllerContent.replace(
    'this.router.get("/logout", this.logout.bind(this));',
    'this.router.get("/logout", this.logout.bind(this));\n    this.router.post("/logout", this.logout.bind(this));'
  );
}

if (!userControllerContent.includes('this.router.get("/me"')) {
  userControllerContent = userControllerContent.replace(
    'this.router.get("/getUserDetails", this.getUserDetails.bind(this));',
    'this.router.get("/getUserDetails", this.getUserDetails.bind(this));\n    this.router.get("/me", this.getUserDetails.bind(this));'
  );
}

fs.writeFileSync(userControllerPath, userControllerContent, 'utf8');
console.log('user.controller.ts updated successfully.');

console.log('5. Updating dal/user.ts...');
const dalUserPath = 'D:/Karthi/LMS/src/db/dal/user.ts';
let dalUserContent = fs.readFileSync(dalUserPath, 'utf8');

// Update logout
const oldLogoutRegex = /export const logout = async \(token: any\): Promise<any> => \{[\s\S]*?await transaction\.commit\(\);\s*return true;\s*\} catch \(error\) \{[\s\S]*?throw new Error\(error\);\s*\}\s*\};/;
const newLogoutCode = `export const logout = async (token: any): Promise<any> => {
  if (!token) {
    return true;
  }
  const cleanToken = typeof token === "string" ? token.replace(/^Bearer\\s+/i, "").trim() : token;
  const transaction = await sequelizeConnection.transaction();

  try {
    await User_token.destroy({
      where: {
        token: {
          [Op.in]: [token, cleanToken],
        },
      },
      transaction,
    });
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw new Error(error);
  }
};`;

if (oldLogoutRegex.test(dalUserContent)) {
  dalUserContent = dalUserContent.replace(oldLogoutRegex, newLogoutCode);
  console.log('logout in dal/user.ts replaced successfully.');
} else {
  console.log('Warning: oldLogoutRegex did not match directly, checking if already updated.');
}

// Update getUserDetails
const oldGetUserDetailsRegex = /export const getUserDetails = async \(\s*userRefId: string,\s*payload\?: any,?\s*\): Promise<any> => \{[\s\S]*?const newRefId = userRefId \? userRefId : payload\?\.user_ref_id;[\s\S]*?if \(!user\) \{\s*throw new Error\("USER_E_00001"\);\s*\};?/;
const newGetUserDetailsSnippet = `export const getUserDetails = async (
  userRefId: any,
  payload?: any,
): Promise<any> => {
  try {
    let targetRefId: string | undefined;
    if (typeof userRefId === "string" && userRefId.trim()) {
      targetRefId = userRefId.trim();
    } else if (typeof userRefId === "object" && userRefId !== null) {
      targetRefId = userRefId.userRefId || userRefId.user_ref_id || userRefId.id;
    }
    if (!targetRefId) {
      targetRefId = payload?.user_ref_id || payload?.userRefId;
    }

    let whereClause: any = {};
    if (targetRefId) {
      whereClause.user_ref_id = targetRefId;
    } else if (payload?.user_id || payload?.id) {
      whereClause.user_id = payload.user_id || payload.id;
    } else {
      throw new Error("USER_E_00001");
    }

    const user = await User.findOne({
      where: whereClause,
      attributes: [
        "user_id",
        "user_ref_id",
        "name",
        "email",
        "phone_number",
        "is_active",
        "createdAt",
        "updatedAt",
      ],
      raw: true,
    });

    if (!user) {
      throw new Error("USER_E_00001");
    }`;

if (oldGetUserDetailsRegex.test(dalUserContent)) {
  dalUserContent = dalUserContent.replace(oldGetUserDetailsRegex, newGetUserDetailsSnippet);
  console.log('getUserDetails in dal/user.ts replaced successfully.');
} else {
  console.log('Warning: oldGetUserDetailsRegex did not match directly.');
}

fs.writeFileSync(dalUserPath, dalUserContent, 'utf8');
console.log('dal/user.ts updated.');
