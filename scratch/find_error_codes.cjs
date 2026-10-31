const fs = require('fs');
const path = require('path');
const dalDir = 'D:/Karthi/LMS/src/db/dal';
const files = fs.readdirSync(dalDir);
const errorCodes = [];

files.forEach(f => {
  if (f.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(dalDir, f), 'utf8');
    const regex = /throw new Error\((["'])(.*?)\1\)/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      errorCodes.push({ file: f, code: m[2] });
    }
  }
});

console.log(JSON.stringify(errorCodes, null, 2));
