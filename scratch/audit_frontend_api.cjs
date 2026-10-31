const fs = require('fs');

const apiContent = fs.readFileSync('d:/Karthi/New User LMS/src/services/api.ts', 'utf8');

// Match request calls like request.get, request.post, request.delete, request.patch
const matches = [];
const regex = /request\.(get|post|put|delete|patch)(?:<[^>]+>)?\(\s*([`'"][^`'"]+[`'"])/g;
let m;
while ((m = regex.exec(apiContent)) !== null) {
  matches.push({
    method: m[1].toUpperCase(),
    url: m[2].replace(/[`'"]/g, '')
  });
}

console.log('Frontend request calls in api.ts:');
console.log(JSON.stringify(matches, null, 2));
console.log(`Total frontend api calls: ${matches.length}`);
