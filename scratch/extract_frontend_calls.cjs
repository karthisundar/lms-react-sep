const fs = require('fs');

const content = fs.readFileSync('src/services/api.ts', 'utf8');
const lines = content.split('\n');
const apiCalls = [];

lines.forEach((line, idx) => {
  const m = line.match(/request<[^>]+>\(([^,\)]+)(?:,\s*\{([^}]+)\})?/);
  if (m) {
    const rawUrl = m[1].replace(/[`'"]/g, '').trim();
    let method = 'GET';
    if (m[2]) {
      const methMatch = m[2].match(/method:\s*['"]([^'"]+)['"]/);
      if (methMatch) method = methMatch[1];
    }
    apiCalls.push({ line: idx + 1, url: rawUrl, method });
  }
});

console.log(`Found ${apiCalls.length} request calls in src/services/api.ts`);
apiCalls.forEach(c => console.log(`${c.line}: [${c.method}] ${c.url}`));
