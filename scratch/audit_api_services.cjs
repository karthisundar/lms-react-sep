const fs = require('fs');

const content = fs.readFileSync('d:/Karthi/New User LMS/src/services/api.ts', 'utf8');

// Find all occurrences of request( or request<...>(
const lines = content.split('\n');
const apiCalls = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('request<') || line.includes('request(')) {
    // gather context around this line (next 5 lines)
    const context = lines.slice(i, i + 6).join(' ');
    const urlMatch = context.match(/request(?:<[^>]+>)?\(\s*([`'"][^`'"]+[`'"])/);
    const methodMatch = context.match(/method:\s*['"]([A-Z]+)['"]/i);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    if (urlMatch) {
      apiCalls.push({
        line: i + 1,
        method,
        url: urlMatch[1].replace(/[`'"]/g, ''),
        snippet: line.trim()
      });
    }
  }
}

console.log(JSON.stringify(apiCalls, null, 2));
console.log(`Total API service calls found in api.ts: ${apiCalls.length}`);
