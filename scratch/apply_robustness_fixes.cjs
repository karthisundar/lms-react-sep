const fs = require('fs');

console.log('1. Updating getActionUser in dal/user.ts...');
const userDalPath = 'D:/Karthi/LMS/src/db/dal/user.ts';
let userDalContent = fs.readFileSync(userDalPath, 'utf8');

const oldGetActionUserRegex = /export const getActionUser = async \(user_ref_id: string\): Promise<User> => \{[\s\S]*?return findUser;\s*\};/;
const newGetActionUserSnippet = `export const getActionUser = async (user_ref_id?: any, userId?: any): Promise<any> => {
  try {
    if (user_ref_id && typeof user_ref_id === 'string' && user_ref_id.trim()) {
      const findUser = await User.findOne({
        where: { user_ref_id: user_ref_id.trim() },
        nest: true,
        raw: true,
      });
      if (findUser) return findUser;
    }
    if (userId) {
      const findUser = await User.findOne({
        where: { user_id: userId },
        nest: true,
        raw: true,
      });
      if (findUser) return findUser;
    }
    return null;
  } catch {
    return null;
  }
};`;

if (oldGetActionUserRegex.test(userDalContent)) {
  userDalContent = userDalContent.replace(oldGetActionUserRegex, newGetActionUserSnippet);
  fs.writeFileSync(userDalPath, userDalContent, 'utf8');
  console.log('getActionUser updated successfully in dal/user.ts.');
} else {
  console.log('Notice: oldGetActionUserRegex did not match.');
}

console.log('2. Updating createBucket in dal/bucket.ts...');
const bucketDalPath = 'D:/Karthi/LMS/src/db/dal/bucket.ts';
let bucketDalContent = fs.readFileSync(bucketDalPath, 'utf8');

// Replace createBucket
const oldCreateBucketRegex = /export const createBucket = async \([\s\S]*?return true;\s*\} catch \(error\) \{[\s\S]*?throw error;\s*\}\s*\};/;
const newCreateBucketSnippet = `export const createBucket = async (
  queryData: any,
  payload: any,
): Promise<any> => {
  try {
    const bucketRefId = queryData?.bucketRefId?.trim();
    const bucketName = queryData?.bucketName?.trim();
    const serviceUrl = queryData?.serviceUrl?.trim() || queryData?.url?.trim() || 'https://s3.amazonaws.com';
    let status = 1;
    if (queryData?.status !== undefined && queryData?.status !== null) {
      if (typeof queryData.status === 'boolean') {
        status = queryData.status ? 1 : 0;
      } else if (typeof queryData.status === 'string') {
        status = queryData.status.toLowerCase() === 'active' || queryData.status === '1' ? 1 : 0;
      } else {
        status = Number(queryData.status) || 0;
      }
    }

    if (!bucketName) {
      throw new Error("Bucket name is mandatory.");
    }

    // Get logged-in/action user
    const findUser = await getActionUser(payload?.user_ref_id, payload?.user_id || payload?.id);

    // UPDATE FLOW
    if (bucketRefId) {
      const existingBucket = await BucketMaster.findOne({
        where: { bucketRefId },
      });

      if (!existingBucket) {
        throw new Error("BUCKET_E_00001");
      }

      const updateObj: any = {
        bucketName,
        serviceUrl,
        status,
        updatedBy: findUser?.user_id,
        updatedAt: new Date(),
      };

      await sequelizeConnection.transaction(async (transaction: Transaction) => {
        await BucketMaster.update(updateObj, {
          where: { bucketRefId },
          transaction,
        });
      });

      return { bucketRefId, bucketName, serviceUrl, status };
    }

    // CREATE FLOW
    const newRefId = randomUUID();
    const newBucketObj: any = {
      bucketRefId: newRefId,
      bucketName,
      serviceUrl,
      status,
      createdBy: findUser?.user_id,
      createdAt: new Date(),
    };

    await sequelizeConnection.transaction(async (transaction: Transaction) => {
      await BucketMaster.create(newBucketObj, { transaction });
    });

    return newBucketObj;
  } catch (error) {
    logger.error("Error createBucket/bucketMaster.ts", error);
    throw error;
  }
};`;

if (oldCreateBucketRegex.test(bucketDalContent)) {
  bucketDalContent = bucketDalContent.replace(oldCreateBucketRegex, newCreateBucketSnippet);
  fs.writeFileSync(bucketDalPath, bucketDalContent, 'utf8');
  console.log('createBucket updated successfully in dal/bucket.ts.');
} else {
  console.log('Notice: oldCreateBucketRegex did not match.');
}

console.log('3. Updating createSession in dal/session.ts...');
const sessionDalPath = 'D:/Karthi/LMS/src/db/dal/session.ts';
let sessionDalContent = fs.readFileSync(sessionDalPath, 'utf8');

const oldSessionNameLine = 'const sessionName = queryData?.name?.trim();';
const newSessionNameLine = 'const sessionName = (queryData?.sessionName || queryData?.name)?.trim();';
if (sessionDalContent.includes(oldSessionNameLine)) {
  sessionDalContent = sessionDalContent.replace(oldSessionNameLine, newSessionNameLine);
}

const oldSessionDateLine = 'const date = queryData?.date ? new Date(queryData.date) : null;';
const newSessionDateLine = 'const rawDate = queryData?.sessionDate || queryData?.date;\n    const date = rawDate ? new Date(rawDate) : null;';
if (sessionDalContent.includes(oldSessionDateLine)) {
  sessionDalContent = sessionDalContent.replace(oldSessionDateLine, newSessionDateLine);
}

fs.writeFileSync(sessionDalPath, sessionDalContent, 'utf8');
console.log('createSession updated in dal/session.ts.');

console.log('4. Updating submitEnquiry in contact.controller.ts...');
const contactControllerPath = 'D:/Karthi/LMS/src/components/contact/contact.controller.ts';
let contactControllerContent = fs.readFileSync(contactControllerPath, 'utf8');

const oldExtractLine = 'const { name, email, phone, subject, message, source, honeypot } = req.body || {};';
const newExtractLine = `const body = req.body || {};
      const name = (body.name || body.fullName || "").trim();
      const email = (body.email || "").trim();
      const phone = (body.phone || body.phoneNumber || "").trim();
      const subject = (body.subject || body.courseInterest || "").trim();
      const message = (body.message || "").trim();
      const source = (body.source || body.learningMode || "").trim();
      const honeypot = body.honeypot;`;

if (contactControllerContent.includes(oldExtractLine)) {
  contactControllerContent = contactControllerContent.replace(oldExtractLine, newExtractLine);
  fs.writeFileSync(contactControllerPath, contactControllerContent, 'utf8');
  console.log('submitEnquiry updated in contact.controller.ts.');
} else {
  console.log('Notice: oldExtractLine in contact.controller.ts not found directly.');
}
