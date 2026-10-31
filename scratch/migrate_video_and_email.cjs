const mysql = require('D:/Karthi/LMS/node_modules/mysql2/promise');

async function runMigration() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'lms_service'
  });

  console.log('--- Step 1: Backup video_master ---');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS video_master_backup AS SELECT * FROM video_master;
  `);
  console.log('video_master_backup table verified/created.');

  console.log('--- Step 2: Inspect existing video_master records ---');
  const [existingVideos] = await conn.query('SELECT videoId, videoRefId, title, filename, url FROM video_master');
  console.log('Current video records before migration:', existingVideos);

  for (const v of existingVideos) {
    const rawUrl = (v.url || '').trim();
    // Check if it's an external provider (YouTube, Google Drive, Vimeo)
    const isExternal = /youtube\.com|youtu\.be|drive\.google\.com|vimeo\.com/i.test(rawUrl);
    if (isExternal) {
      console.log(`Video ID ${v.videoId} is external provider (${rawUrl}). Retaining as external URL.`);
      continue;
    }

    // Check if it's a full S3/CDN/HTTP URL
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      try {
        const parsed = new URL(rawUrl);
        // Extract relative pathname without leading slash or query params
        const relativeKey = parsed.pathname.replace(/^\/+/, '');
        const filename = relativeKey.split('/').pop() || v.filename;

        console.log(`Migrating Video ID ${v.videoId}:`);
        console.log(`  Old URL: ${rawUrl}`);
        console.log(`  New relativeKey (url): ${relativeKey}`);
        console.log(`  New filename: ${filename}`);

        await conn.query(
          'UPDATE video_master SET url = ?, filename = ? WHERE videoId = ?',
          [relativeKey, filename, v.videoId]
        );
      } catch (err) {
        console.error(`Error parsing URL for videoId ${v.videoId}:`, err);
      }
    } else {
      console.log(`Video ID ${v.videoId} is already relative or filename (${rawUrl}).`);
    }
  }

  const [migratedVideos] = await conn.query('SELECT videoId, videoRefId, title, filename, url FROM video_master');
  console.log('Video records after migration:', migratedVideos);

  console.log('--- Step 3: Add database unique constraint on user active email ---');
  // Check if index already exists
  const [indexes] = await conn.query(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'lms_service' AND TABLE_NAME = 'user' AND INDEX_NAME = 'uq_user_active_email'
  `);

  if (indexes.length === 0) {
    console.log('Creating unique index uq_user_active_email on user...');
    await conn.query(`
      CREATE UNIQUE INDEX uq_user_active_email ON user (
        (LOWER(TRIM(email))),
        (CASE WHEN deletedAt IS NULL THEN 1 ELSE NULL END)
      );
    `);
    console.log('Index uq_user_active_email created successfully.');
  } else {
    console.log('Index uq_user_active_email already exists.');
  }

  // Check if uq_user_ref_id exists
  const [refIndexes] = await conn.query(`
    SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'lms_service' AND TABLE_NAME = 'user' AND INDEX_NAME = 'uq_user_ref_id'
  `);
  if (refIndexes.length === 0) {
    console.log('Creating unique index uq_user_ref_id on user...');
    await conn.query(`
      CREATE UNIQUE INDEX uq_user_ref_id ON user (user_ref_id);
    `);
    console.log('Index uq_user_ref_id created successfully.');
  } else {
    console.log('Index uq_user_ref_id already exists.');
  }

  console.log('--- Step 4: Verification test for unique index ---');
  try {
    // Attempt duplicate insert of an active email
    await conn.query(`
      INSERT INTO user (user_ref_id, name, email, password, is_active, createdAt)
      VALUES (UUID(), 'Duplicate Test', 'JOE@GMAIL.COM', 'pwd123', 1, NOW())
    `);
    console.error('ERROR: Duplicate email was allowed! Unique constraint failed.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('SUCCESS: Duplicate active email rejected by MySQL unique index (ER_DUP_ENTRY).');
    } else {
      console.log('Unique constraint check caught error:', err.message);
    }
  }

  await conn.end();
}

runMigration().catch(console.error);
