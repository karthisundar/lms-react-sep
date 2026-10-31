const fs = require('fs');

const content = fs.readFileSync('src/services/api.ts', 'utf8');
const lines = content.split('\n');

const exportedApis = [];
let currentApi = null;

lines.forEach((line, idx) => {
  const exportMatch = line.match(/^export const (\w+Api) =/);
  if (exportMatch) {
    currentApi = { name: exportMatch[1], line: idx + 1, methods: [] };
    exportedApis.push(currentApi);
  } else if (currentApi) {
    const methodMatch = line.match(/^\s+(\w+):\s*(?:async\s*)?\(/);
    if (methodMatch) {
      currentApi.methods.push({ name: methodMatch[1], line: idx + 1 });
    }
    if (line.match(/^};/)) {
      currentApi = null;
    }
  }
});

console.log(JSON.stringify(exportedApis, null, 2));
