const mysql = require('D:/Karthi/LMS/node_modules/mysql2');
const conn = mysql.createConnection({ host: 'localhost', user: 'root', password: 'root', database: 'lms_service' });
conn.query("SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'lms_service' AND COLUMN_NAME LIKE '%email%';", (err, res) => {
  if (err) console.error(err);
  else console.log('Tables with email columns:', res);
  conn.end();
});
