const fs = require('fs');
const path = require('path');

const targetDir = 'D:/Karthi/LMS/src/types';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const declContent = `declare module 'multer-s3' {
  import { S3Client } from '@aws-sdk/client-s3';
  import { StorageEngine } from 'multer';

  interface Options {
    s3: S3Client | any;
    bucket: string | ((req: any, file: any, cb: (error: any, bucket?: string) => void) => void);
    contentType?: any;
    metadata?: (req: any, file: any, cb: (error: any, metadata?: any) => void) => void;
    key?: (req: any, file: any, cb: (error: any, key?: string) => void) => void;
    acl?: string | ((req: any, file: any, cb: (error: any, acl?: string) => void) => void);
  }

  interface MulterS3 {
    (options: Options): StorageEngine;
    AUTO_CONTENT_TYPE: any;
    DEFAULT_CONTENT_TYPE: any;
  }

  const multerS3: MulterS3;
  export = multerS3;
}
`;

fs.writeFileSync(path.join(targetDir, 'declarations.d.ts'), declContent, 'utf8');
console.log('Created D:/Karthi/LMS/src/types/declarations.d.ts');
