const mysql = require('D:/Karthi/LMS/node_modules/mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'lms_service'
  });

  const [cols] = await conn.query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'lms_service' AND (COLUMN_NAME LIKE '%email%' OR COLUMN_NAME LIKE '%mail%')
  `);
  console.log('--- Email Columns Across All Tables ---');
  console.table(cols);

  const [videoCols] = await conn.query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'lms_service' AND (COLUMN_NAME LIKE '%video%' OR COLUMN_NAME LIKE '%url%')
  `);
  console.log('--- Video / URL Columns Across All Tables ---');
  console.table(videoCols);

  // Check unique constraints across database
  const [indexes] = await conn.query(`
    SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, NON_UNIQUE
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'lms_service' AND NON_UNIQUE = 0
  `);
  console.log('--- Existing Unique Constraints / Primary Keys ---');
  console.table(indexes);

  await conn.end();
}

main().catch(console.error);
