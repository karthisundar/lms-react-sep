const fs = require('fs');

const files = [
  'D:/Karthi/LMS/src/components/user/user.controller.ts',
  'D:/Karthi/LMS/src/components/session/session.controller.ts',
  'D:/Karthi/LMS/src/components/video/video.controller.ts',
  'D:/Karthi/LMS/src/components/lesson/lesson.controller.ts',
  'D:/Karthi/LMS/src/components/question/question.controller.ts',
  'D:/Karthi/LMS/src/components/contact/contact.controller.ts',
];

for (const f of files) {
  console.log('=== ' + f.split('/').pop() + ' ===');
  const content = fs.readFileSync(f, 'utf8');
  // Match register() method body
  const regMatch = content.match(/register\(\)\s*:\s*Router\s*\{([\s\S]*?return\s+this\.router;)/);
  if (regMatch) {
    console.log(regMatch[1].trim());
  }
}
