const fs = require('fs');
let routes = fs.readFileSync('D:/Karthi/LMS/src/routes.ts', 'utf8');
routes = routes.replace('router.use("/api/contact", contactController.register());', 'router.use(contactController.register());');
fs.writeFileSync('D:/Karthi/LMS/src/routes.ts', routes);
console.log('routes.ts updated successfully:');
console.log(fs.readFileSync('D:/Karthi/LMS/src/routes.ts', 'utf8'));
