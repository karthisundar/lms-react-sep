const fs = require('fs');
const path = require('path');

console.log('--- Applying Backend Updates ---');

// 1. Create D:\Karthi\LMS\src\middleware\videoUpload.ts
const videoUploadContent = `import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import s3Client from "../config/s3";

const allowedMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-matroska",
  "video/x-msvideo",
  "video/mp2t",
  "application/x-mpegURL",
  "application/vnd.apple.mpegurl",
];

const allowedExtensions = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".mkv",
  ".avi",
  ".m4v",
  ".m3u8",
  ".ts",
];

const fileFilter: multer.Options["fileFilter"] = (req, file, callback) => {
  const originalName = file.originalname.toLowerCase();
  const extension = originalName.substring(originalName.lastIndexOf("."));

  const mimeValid = allowedMimeTypes.includes(file.mimetype.toLowerCase());
  const extValid = allowedExtensions.includes(extension);

  if (!mimeValid && !extValid) {
    return callback(
      new Error("Only MP4, WEBM, OGG, MOV, MKV, and AVI video files are allowed.")
    );
  }

  callback(null, true);
};

// Check if S3 credentials and bucket are configured
const isS3Configured = Boolean(
  process.env.AWS_S3_BUCKET_NAME &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

let storage: multer.StorageEngine;

if (isS3Configured) {
  storage = multerS3({
    s3: s3Client,
    bucket: process.env.AWS_S3_BUCKET_NAME as string,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
      });
    },
    key: (req, file, cb) => {
      const sanitizedName = file.originalname
        .replace(/\\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      const safeKey = \`videos/\${Date.now()}-\${randomUUID().slice(0, 8)}-\${sanitizedName}\`;
      cb(null, safeKey);
    },
  });
} else {
  // Local disk storage fallback
  const localUploadDir = path.resolve(__dirname, "../../appData/videos");
  if (!fs.existsSync(localUploadDir)) {
    fs.mkdirSync(localUploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, localUploadDir);
    },
    filename: (req, file, cb) => {
      const sanitizedName = file.originalname
        .replace(/\\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
      const fileName = \`\${Date.now()}-\${randomUUID().slice(0, 8)}-\${sanitizedName}\`;
      cb(null, fileName);
    },
  });
}

export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
});

export default videoUpload;
`;

fs.writeFileSync('D:/Karthi/LMS/src/middleware/videoUpload.ts', videoUploadContent, 'utf-8');
console.log('Created D:/Karthi/LMS/src/middleware/videoUpload.ts');

// 2. Update D:\Karthi\LMS\src\middleware\error-handler.ts
const errorHandlerContent = `import ApiError from "../abstractions/ApiError";
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';

const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
	if (err) {
		const isUniqueConstraint =
			err?.name === 'SequelizeUniqueConstraintError' ||
			err?.original?.code === 'ER_DUP_ENTRY' ||
			err?.code === 'EMAIL_ALREADY_EXISTS';

		const statusCode: number = err.status || (isUniqueConstraint ? StatusCodes.CONFLICT : StatusCodes.INTERNAL_SERVER_ERROR);
		const errorCode = err?.code || (isUniqueConstraint ? 'EMAIL_ALREADY_EXISTS' : undefined);
		const errorMessage = isUniqueConstraint
			? 'This email address is already registered.'
			: (err?.message?.trim() || 'An error occurred during the request.');

		let body: any = {
			statusCode,
			success: false,
			code: errorCode,
			message: errorMessage,
			field: err?.field || (isUniqueConstraint ? 'email' : undefined),
			fields: err?.fields || (err?.field ? [err.field] : undefined),
			response: {
				type: err?.errorMessageType?.type,
				code: [errorCode || errorMessage],
				message: errorMessage,
				name: err?.name,
				stack: process.env.NODE_ENV === 'development' ? err?.stack?.trim() : undefined,
			}
		};

		res.status(statusCode);
		res.send(body);
	}
};

export default errorHandler;
`;

fs.writeFileSync('D:/Karthi/LMS/src/middleware/error-handler.ts', errorHandlerContent, 'utf-8');
console.log('Updated D:/Karthi/LMS/src/middleware/error-handler.ts');

// 3. Update D:\Karthi\LMS\src\components\video\video.controller.ts
const videoControllerFile = 'D:/Karthi/LMS/src/components/video/video.controller.ts';
let videoControllerCode = fs.readFileSync(videoControllerFile, 'utf-8');

if (!videoControllerCode.includes('videoUpload')) {
  videoControllerCode = videoControllerCode.replace(
    'import * as service from "./video.service";',
    'import * as service from "./video.service";\\nimport videoUpload from "../../middleware/videoUpload";\\nimport { verifyJWT } from "../auth/jwt.utils";'
  );

  videoControllerCode = videoControllerCode.replace(
    'this.router.post("/createVideo", this.createVideo.bind(this));',
    'this.router.post("/upload", videoUpload.single("video"), this.uploadVideo.bind(this));\\n    this.router.post("/createVideo", this.createVideo.bind(this));'
  );

  const uploadMethod = `
  public async uploadVideo(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const token = await verifyJWT(authHeader);
      const user = token?.payload;
      if (!user) {
        res.status(401).json({ success: false, message: "Invalid session" });
        return;
      }

      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ success: false, message: "No video file provided" });
        return;
      }

      // Safe relative object key or filename
      const relativeKey = file.key || \`videos/\${file.filename}\`;
      const filename = path.basename(relativeKey);

      res.locals.data = returnSuccess(StatusCodes.OK, "Video uploaded successfully", {
        fileName: filename,
        relativeKey,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
      super.send(res);
    } catch (error) {
      next(error);
    }
  }
`;

  videoControllerCode = videoControllerCode.replace(
    '  public async createVideo(',
    uploadMethod + '\n  public async createVideo('
  );

  fs.writeFileSync(videoControllerFile, videoControllerCode, 'utf-8');
  console.log('Updated D:/Karthi/LMS/src/components/video/video.controller.ts');
}

console.log('Backend changes applied successfully.');
