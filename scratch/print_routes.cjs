const fs = require('fs');

const files = [
  'D:/Karthi/LMS/src/components/user/user.controller.ts',
  'D:/Karthi/LMS/src/components/bucket/bucket.controller.ts',
  'D:/Karthi/LMS/src/components/session/session.controller.ts',
  'D:/Karthi/LMS/src/components/video/video.controller.ts',
  'D:/Karthi/LMS/src/components/course/course.controller.ts',
  'D:/Karthi/LMS/src/components/module/module.controller.ts',
  'D:/Karthi/LMS/src/components/lesson/lesson.controller.ts',
  'D:/Karthi/LMS/src/components/question/question.controller.ts',
  'D:/Karthi/LMS/src/components/contact/contact.controller.ts',
];

for (const f of files) {
  console.log('=== ' + f.split('/').pop() + ' ===');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('this.router.') || l.includes('router.')) {
      console.log(`  [${idx + 1}] ${l.trim()}`);
    }
  });
}
