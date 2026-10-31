const fs = require('fs');

// 1. App.ts
let p = 'D:/Karthi/LMS/src/App.ts';
let content = fs.readFileSync(p, 'utf8');
content = content.replace("import express, { request } from 'express';", "import express from 'express';");
content = content.replace("import * as clientLabel from '../src/config/clientlabel.config.json'\n", "");
content = content.replace(/const corsOptions = \{[\s\S]*?\};\n/g, "");
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned App.ts');

// 2. bucket.controller.ts
p = 'D:/Karthi/LMS/src/components/bucket/bucket.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
content = content.replace('import clientLabel from "../../config/clientlabel.config.json";\n', '');
content = content.replace('import serverLabel from "../../config/serverlabel.config.json";\n', '');
content = content.replace('import { checkAccess } from "../../middleware/authorization";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned bucket.controller.ts');

// 3. course.controller.ts
p = 'D:/Karthi/LMS/src/components/course/course.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned course.controller.ts');

// 4. lesson.controller.ts
p = 'D:/Karthi/LMS/src/components/lesson/lesson.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned lesson.controller.ts');

// 5. module.controller.ts
p = 'D:/Karthi/LMS/src/components/module/module.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned module.controller.ts');

// 6. session.controller.ts
p = 'D:/Karthi/LMS/src/components/session/session.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned session.controller.ts');

// 7. video.controller.ts
p = 'D:/Karthi/LMS/src/components/video/video.controller.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../../lib/logger";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned video.controller.ts');

// 8. db/config.ts
p = 'D:/Karthi/LMS/src/db/config.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import logger from "../lib/logger";\n', '');
content = content.replace('console.log(global.environment, "from config 112");\n\n', '');
content = content.replace('  console.log("test");\n', '');
content = content.replace(/\/\/ async function initializeDatabase[\s\S]*?\/\/ initializeDatabase\(\);\n/, '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned db/config.ts');

// 9. Sequelize models (ModelStatic, Sequelize)
const models = [
  'BucketMaster.ts',
  'MenuItems.ts',
  'MenuMaster.ts',
  'RoleMenuAccess.ts',
  'User.ts',
  'UserMaping.ts',
  'UserRole.ts',
  'UserToken.ts'
];
models.forEach(m => {
  const modelPath = 'D:/Karthi/LMS/src/db/model/' + m;
  let mc = fs.readFileSync(modelPath, 'utf8');
  mc = mc.replace('import { DataTypes, Model, ModelStatic, Optional, Sequelize } from "sequelize";', 'import { DataTypes, Model, Optional } from "sequelize";');
  fs.writeFileSync(modelPath, mc, 'utf8');
});
console.log('Cleaned models ModelStatic and Sequelize');

// 10. QuestionAnswer.ts
p = 'D:/Karthi/LMS/src/db/model/QuestionAnswer.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import { QuestionMaster } from "./QuestionMaster";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned QuestionAnswer.ts');

// 11. QuestionMaster.ts
p = 'D:/Karthi/LMS/src/db/model/QuestionMaster.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('import { LessonMaster } from "./LessonMaster";\n', '');
content = content.replace('import { QuestionAnswer } from "./QuestionAnswer";\n', '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned QuestionMaster.ts');

// 12. authorization.ts
p = 'D:/Karthi/LMS/src/middleware/authorization.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace("import * as service from '../components/user/user.service'\n", '');
content = content.replace(/\/\/ export const checkAccess1[\s\S]*?\/\/ \}\n/, '');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned authorization.ts');

// 13. error-handler.ts
p = 'D:/Karthi/LMS/src/middleware/error-handler.ts';
content = fs.readFileSync(p, 'utf8');
content = content.replace('  req: express.Request,\n  res: express.Response,\n  next: express.NextFunction,', '  _req: express.Request,\n  res: express.Response,\n  _next: express.NextFunction,');
fs.writeFileSync(p, content, 'utf8');
console.log('Cleaned error-handler.ts');
