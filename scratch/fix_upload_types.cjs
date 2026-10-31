const fs = require('fs');

function fixUploadFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace('metadata: (req, file, cb) =>', 'metadata: (req: any, file: any, cb: any) =>');
  content = content.replace('key: (req, file, cb) =>', 'key: (req: any, file: any, cb: any) =>');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
}

fixUploadFile('D:/Karthi/LMS/src/middleware/videoUpload.ts');
fixUploadFile('D:/Karthi/LMS/src/middleware/lessonNotesUpload.ts');
