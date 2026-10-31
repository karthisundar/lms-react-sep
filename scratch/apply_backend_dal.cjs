const fs = require('fs');
const path = require('path');

console.log('--- Applying Backend DAL Updates ---');

// 1. Update D:/Karthi/LMS/src/db/dal/user.ts
const userDalFile = 'D:/Karthi/LMS/src/db/dal/user.ts';
let userDalCode = fs.readFileSync(userDalFile, 'utf-8');

// Update checkCreateUser
const oldCheckCreateUserRegex = /export const checkCreateUser = async \(queryData: any\): Promise<any> => {[\s\S]*?if \(!password\) {\s*throw new Error\("Password field is mandatory"\);\s*}\s*};/;

const newCheckCreateUser = `export const checkCreateUser = async (queryData: any): Promise<any> => {
  const name = queryData?.name?.trim();
  const rawEmail = queryData?.email;
  const email = rawEmail ? rawEmail.trim().toLowerCase() : undefined;
  const password = queryData?.password;
  const phone_number = queryData?.phoneNumber;
  const user_ref_id = queryData?.user_ref_id;

  const EMAIL_REGEX = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (email && !EMAIL_REGEX.test(email)) {
    const err: any = new Error("Invalid email format");
    err.status = 400;
    err.field = "email";
    throw err;
  }

  // ---- UPDATE FLOW ----
  if (user_ref_id) {
    const findUser = await User.findOne({ where: { user_ref_id } });
    if (!findUser) {
      throw new Error("User not found");
    }

    if (email) {
      const checkEmail = await User.findOne({
        where: {
          [Op.and]: [
            sequelizeConnection.where(
              sequelizeConnection.fn("LOWER", sequelizeConnection.col("email")),
              email
            ),
            { user_ref_id: { [Op.ne]: user_ref_id } },
          ],
        },
      });
      if (checkEmail) {
        const err: any = new Error("This email address is already registered.");
        err.code = "EMAIL_ALREADY_EXISTS";
        err.status = 409;
        err.field = "email";
        throw err;
      }
    }

    // password not mandatory on update, only validate if provided
    if (password) {
      const decodedPassword = Buffer.from(password, "base64").toString("utf-8");
      if (!decodedPassword) {
        throw new Error("Invalid password");
      }
    }

    return;
  }

  // ---- CREATE FLOW ----
  if (email) {
    const checkEmail = await User.findOne({
      where: sequelizeConnection.where(
        sequelizeConnection.fn("LOWER", sequelizeConnection.col("email")),
        email
      ),
    });
    if (checkEmail) {
      const err: any = new Error("This email address is already registered.");
      err.code = "EMAIL_ALREADY_EXISTS";
      err.status = 409;
      err.field = "email";
      throw err;
    }
  }

  if (!password) {
    throw new Error("Password field is mandatory");
  }
};`;

if (oldCheckCreateUserRegex.test(userDalCode)) {
  userDalCode = userDalCode.replace(oldCheckCreateUserRegex, newCheckCreateUser);
  console.log('Replaced checkCreateUser in user.ts DAL');
} else {
  console.log('Could not match old checkCreateUser, inspect manual replacement');
}

// Update createUser in user.ts
const oldCreateUserRegex = /export const createUser = async \(\s*queryData: any,\s*payload: any,\s*\): Promise<any> => {[\s\S]*?logger\.error\("Error createUser\/user\.ts", error\);\s*throw new Error\(error\);\s*}\s*};/;

const newCreateUser = `export const createUser = async (
  queryData: any,
  payload: any,
): Promise<any> => {
  try {
    const name = queryData?.name?.trim();
    const rawEmail = queryData?.email;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : undefined;
    const password = queryData?.password;
    const phone_number = queryData?.phoneNumber;
    const user_ref_id = queryData?.user_ref_id;
    const is_active = queryData?.is_active ?? queryData?.active;
    let role_id: number = 2;
    const role = queryData?.role;
    if (role) {
      const findRole = await UserRole.findOne({
        where: {
          role_name: role,
        },
        nest: true,
        raw: true,
      });
      role_id = findRole?.role_id;
    }

    const findUser = await getActionUser(payload?.user_ref_id);

    // ---- UPDATE FLOW: user_ref_id present ----
    if (user_ref_id) {
      const updateObj: any = {
        name,
        phone_number,
        updatedBy: findUser?.user_id,
        updatedAt: new Date(),
      };

      if (email) {
        updateObj.email = email;
      }

      // password comes base64 (btoa) encoded, decode then encrypt
      if (password) {
        updateObj.password = await userService.passwordChangetoEncrypt(
          password,
          1,
        );
      }

      // active/inactive flag, only update if explicitly present
      if (is_active !== undefined && is_active !== null) {
        updateObj.is_active = is_active;
        updateObj.status = is_active;
      }

      await sequelizeConnection.transaction(
        async (transaction: Transaction) => {
          await User.update(updateObj, {
            where: { user_ref_id },
            transaction,
          });
        },
      );
      return true;
    }

    // ---- CREATE FLOW: user_ref_id not present, create new user ----
    const decodePassword = await userService.passwordChangetoEncrypt(
      password,
      1,
    );
    const isActiveDefault = true;
    let obj: any = {
      name,
      email,
      password: decodePassword,
      phone_number,
      is_active: isActiveDefault,
      createdBy: findUser?.user_id,
      createdAt: new Date(),
      status: isActiveDefault,
    };

    await sequelizeConnection.transaction(async (transaction: Transaction) => {
      const newUser = await User.create(obj, { transaction });
      const user_id = newUser?.dataValues?.user_id;
      obj.user_id = user_id;
      obj.role_id = role_id;
      await UserRoleMapping.create(obj, { transaction });
    });

    return true;
  } catch (error: any) {
    if (
      error?.name === "SequelizeUniqueConstraintError" ||
      error?.original?.code === "ER_DUP_ENTRY" ||
      error?.code === "EMAIL_ALREADY_EXISTS"
    ) {
      const err: any = new Error("This email address is already registered.");
      err.code = "EMAIL_ALREADY_EXISTS";
      err.status = 409;
      err.field = "email";
      throw err;
    }
    logger.error("Error createUser/user.ts", error);
    throw error;
  }
};`;

if (oldCreateUserRegex.test(userDalCode)) {
  userDalCode = userDalCode.replace(oldCreateUserRegex, newCreateUser);
  console.log('Replaced createUser in user.ts DAL');
} else {
  console.log('Could not match old createUser regex in user.ts');
}

fs.writeFileSync(userDalFile, userDalCode, 'utf-8');
console.log('Saved D:/Karthi/LMS/src/db/dal/user.ts');

// 2. Update D:/Karthi/LMS/src/db/dal/videos.ts
const videoDalFile = 'D:/Karthi/LMS/src/db/dal/videos.ts';
let videoDalCode = fs.readFileSync(videoDalFile, 'utf-8');

const oldCreateVideoRegex = /export const createVideo = async \(\s*queryData: any,\s*payload: any,\s*\): Promise<any> => {[\s\S]*?if \(!bucketId\) {\s*throw new Error\("VIDEO_E_00006"\);\s*}/;

const newCreateVideo = `export const createVideo = async (
  queryData: any,
  payload: any,
): Promise<any> => {
  try {
    const videoRefId = queryData?.videoRefId?.trim();

    const title = queryData?.title?.trim();
    let filename = queryData?.filename?.trim();
    let url = queryData?.url?.trim();
    const sessionId = queryData?.sessionId?.trim();
    const bucketId = queryData?.bucketId?.trim();

    /**
     * =========================================
     * VALIDATION & SANITIZATION
     * =========================================
     */

    if (!title) {
      throw new Error("VIDEO_E_00002");
    }

    // External provider check (YouTube, Google Drive, Vimeo)
    const isExternal = /youtube\\.com|youtu\\.be|drive\\.google\\.com|vimeo\\.com/i.test(url);
    if (isExternal) {
      if (!/^https?:\\/\\//i.test(url)) {
        throw new Error("Invalid external video URL format");
      }
      if (!filename) {
        filename = title;
      }
    } else {
      // S3, CDN, or relative file storage:
      // Extract only the relative object key or filename; NEVER store complete URL
      let candidateKey = url || filename;
      if (candidateKey.startsWith("http://") || candidateKey.startsWith("https://")) {
        try {
          const parsed = new URL(candidateKey);
          candidateKey = parsed.pathname.replace(/^\\/+/, "");
        } catch {
          throw new Error("Invalid video URL format");
        }
      }

      // Path traversal security check
      if (candidateKey.includes("..") || candidateKey.includes("\\\\")) {
        throw new Error("Invalid filename: Path traversal is prohibited");
      }

      candidateKey = candidateKey.replace(/^\\/+/, "");
      if (!candidateKey) {
        throw new Error("VIDEO_E_00003");
      }

      url = candidateKey;
      if (!filename || filename.startsWith("http://") || filename.startsWith("https://")) {
        filename = candidateKey.split("/").pop() || candidateKey;
      }
    }

    if (!url) {
      throw new Error("VIDEO_E_00004");
    }

    if (!sessionId) {
      throw new Error("VIDEO_E_00005");
    }

    if (!bucketId) {
      throw new Error("VIDEO_E_00006");
    }`;

if (oldCreateVideoRegex.test(videoDalCode)) {
  videoDalCode = videoDalCode.replace(oldCreateVideoRegex, newCreateVideo);
  console.log('Replaced createVideo in videos.ts DAL');
  fs.writeFileSync(videoDalFile, videoDalCode, 'utf-8');
  console.log('Saved D:/Karthi/LMS/src/db/dal/videos.ts');
} else {
  console.log('Could not match old createVideo regex in videos.ts');
}
