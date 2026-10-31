const fs = require('fs');
const filePath = 'D:/Karthi/LMS/tsconfig.json';
let content = fs.readFileSync(filePath, 'utf8');
if (!content.includes('"ignoreDeprecations"')) {
  content = content.replace('"skipLibCheck": true', '"skipLibCheck": true,\n    "ignoreDeprecations": "6.0"');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Added ignoreDeprecations: 6.0 to backend tsconfig.json');
} else {
  console.log('ignoreDeprecations already present');
}
