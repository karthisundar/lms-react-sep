const fs = require('fs');

const content = fs.readFileSync('d:/Karthi/New User LMS/src/services/api.ts', 'utf8');

// Match exported API services like export const courseMasterApi = { ... }
const serviceRegex = /export\s+const\s+([a-zA-Z0-9_]+Api)\s*=\s*\{([\s\S]*?)\n\};/g;
let match;
const services = [];

while ((match = serviceRegex.exec(content)) !== null) {
  const serviceName = match[1];
  const body = match[2];
  
  // Find method names inside body
  const methodRegex = /([a-zA-Z0-9_]+)\s*:\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*Promise<[^>]+>)?\s*=>/g;
  let methodMatch;
  const methods = [];
  while ((methodMatch = methodRegex.exec(body)) !== null) {
    methods.push({
      methodName: methodMatch[1],
      params: methodMatch[2].trim()
    });
  }
  services.push({ serviceName, methods });
}

console.log(JSON.stringify(services, null, 2));
let totalMethods = 0;
services.forEach(s => totalMethods += s.methods.length);
console.log(`Total services: ${services.length}, Total methods: ${totalMethods}`);
