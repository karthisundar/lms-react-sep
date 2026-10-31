const fs = require('fs');
const path = require('path');

const controllers = [
  { prefix: '/api/user', file: 'D:/Karthi/LMS/src/components/user/user.controller.ts' },
  { prefix: '/api/bucketMaster', file: 'D:/Karthi/LMS/src/components/bucket/bucket.controller.ts' },
  { prefix: '/api/sessionMaster', file: 'D:/Karthi/LMS/src/components/session/session.controller.ts' },
  { prefix: '/api/video', file: 'D:/Karthi/LMS/src/components/video/video.controller.ts' },
  { prefix: '/api/course', file: 'D:/Karthi/LMS/src/components/course/course.controller.ts' },
  { prefix: '/api/module', file: 'D:/Karthi/LMS/src/components/module/module.controller.ts' },
  { prefix: '/api/lesson', file: 'D:/Karthi/LMS/src/components/lesson/lesson.controller.ts' },
  { prefix: '/api/question', file: 'D:/Karthi/LMS/src/components/question/question.controller.ts' },
  { prefix: '', file: 'D:/Karthi/LMS/src/components/contact/contact.controller.ts' },
];

const results = [];

for (const c of controllers) {
  if (!fs.existsSync(c.file)) continue;
  const content = fs.readFileSync(c.file, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(/(this\.router|router)\.(get|post|put|delete|patch)\(\s*["']([^"']+)["']/i);
    if (match) {
      const method = match[2].toUpperCase();
      const routePath = match[3];
      const fullPath = (c.prefix + (routePath.startsWith('/') ? routePath : '/' + routePath)).replace(/\/+/g, '/');
      results.push({
        controller: path.basename(c.file),
        method,
        fullPath,
        line: i + 1,
        code: line
      });
    }
  }
}

console.log(JSON.stringify(results, null, 2));
console.log(`Total backend routes found: ${results.length}`);
