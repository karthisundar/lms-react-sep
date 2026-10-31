const fs = require('fs');

// Fix jwt.utils.ts
const jwtPath = 'D:/Karthi/LMS/src/components/auth/jwt.utils.ts';
let jwtContent = fs.readFileSync(jwtPath, 'utf8');
jwtContent = jwtContent.replace(
  'export const verifyJWT = (token: string) => {',
  'export const verifyJWT = (token: string): { payload: any; expired: boolean; token?: string } => {'
);
fs.writeFileSync(jwtPath, jwtContent, 'utf8');
console.log('Fixed verifyJWT in jwt.utils.ts');

// Fix environment.ts
const envPath = 'D:/Karthi/LMS/src/environments/environment.ts';
let envContent = fs.readFileSync(envPath, 'utf8');
envContent = envContent.replace(
  `    public transport = {
        "name": "",
        "host": "",
        "port": null,
        "secure": null,
        "auth": null,
        dsn: null

    }`,
  `    public transport: {
        name: string;
        host: string;
        port: number | null;
        secure: boolean | null;
        auth: any;
        dsn: any;
    } = {
        "name": "",
        "host": "",
        "port": null,
        "secure": null,
        "auth": null,
        dsn: null
    }`
);
fs.writeFileSync(envPath, envContent, 'utf8');
console.log('Fixed transport in environment.ts');
