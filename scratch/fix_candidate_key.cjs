const fs = require('fs');

const p = 'D:/Karthi/LMS/src/db/dal/videos.ts';
let content = fs.readFileSync(p, 'utf8');

const regex = /let candidateKey = url \|\| filename;[\r\n\s]+if \(candidateKey\.startsWith\(/;
const replacement = `let candidateKey = url || filename;
      if (!candidateKey) {
        throw new Error("VIDEO_E_00003");
      }
      if (candidateKey.startsWith(`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(p, content, 'utf8');
  console.log('Successfully patched candidateKey in dal/videos.ts!');
} else {
  console.log('Regex did not match in dal/videos.ts');
}
