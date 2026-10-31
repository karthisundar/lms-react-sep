const fs = require('fs');
const envPath = 'D:/Karthi/LMS/src/environments/environment.ts';
let content = fs.readFileSync(envPath, 'utf8');

// Replace public transport = { ... } with explicit typing
content = content.replace(
  /public\s+transport\s*=\s*\{[\s\S]*?dsn:\s*null[\s\S]*?\}/,
  `public transport: {
        name: string;
        host: string;
        port: number | null;
        secure: boolean | null;
        auth: any;
        dsn: any;
    } = {
        name: "",
        host: "",
        port: null,
        secure: null,
        auth: null,
        dsn: null
    }`
);

fs.writeFileSync(envPath, content, 'utf8');
console.log('Successfully updated transport in environment.ts');
