const fs = require('fs');
const p = 'D:/Karthi/LMS/src/environments/environment.ts';
let content = fs.readFileSync(p, 'utf8');

content = content.replace('public AWSProfileName: string;', 'public AWSProfileName: string = "";');

const vars = [
  'secretKey',
  'AWSAccessKeyId',
  'AWSSecretKey',
  'bucket',
  'serviceUrl',
  'headerImagePath',
  'productDetailsImagePath',
  'barCodeImage',
  'AWSRegin',
  'storeLogo',
  'qrCodePath',
  'client_url',
  'email_url',
  'cc_email',
  'resellerSiteUrl',
  'onlineStoreUrl',
  'onlineStoreConsumerKey',
  'onlineStoreConsumerSecret'
];

for (const v of vars) {
  const re = new RegExp('this\\.' + v + ' = process\\.env\\.([a-zA-Z0-9_]+)', 'g');
  content = content.replace(re, 'this.' + v + ' = process.env.$1 || "";');
}

content = content.replace('this.transport.name = process.env.email_type;', 'this.transport.name = process.env.email_type || "";');
content = content.replace('this.transport.host = process.env.email_host;', 'this.transport.host = process.env.email_host || "";');

fs.writeFileSync(p, content, 'utf8');
console.log('Fixed environment.ts');
