const mysql = require('D:/Karthi/LMS/node_modules/mysql2');

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'lms_service'
});

const createEnquiriesTable = `
CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NULL,
  subject VARCHAR(200) NULL,
  message TEXT NOT NULL,
  source VARCHAR(500) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  email_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  email_sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_status (status),
  INDEX idx_enquiries_email_status (email_status),
  INDEX idx_enquiries_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const createEmailLogsTable = `
CREATE TABLE IF NOT EXISTS contact_enquiry_email_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id BIGINT NULL,
  recipient_email VARCHAR(254) NOT NULL,
  email_type VARCHAR(60) NOT NULL DEFAULT 'ADMIN_ENQUIRY_NOTIFICATION',
  attempt_number INT NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  subject VARCHAR(255) NOT NULL,
  provider_message_id VARCHAR(500) NULL,
  error_message TEXT NULL,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email_logs_enquiry (enquiry_id),
  INDEX idx_email_logs_status (status),
  INDEX idx_email_logs_attempt (attempt_number),
  INDEX idx_email_logs_created_at (created_at),
  CONSTRAINT fk_enquiry_log FOREIGN KEY (enquiry_id) REFERENCES contact_enquiries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

conn.connect((err) => {
  if (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL lms_service.');

  conn.query(createEnquiriesTable, (err1) => {
    if (err1) {
      console.error('Error creating contact_enquiries:', err1);
      conn.end();
      process.exit(1);
    }
    console.log('contact_enquiries table created successfully.');

    conn.query(createEmailLogsTable, (err2) => {
      if (err2) {
        console.error('Error creating contact_enquiry_email_logs:', err2);
        conn.end();
        process.exit(1);
      }
      console.log('contact_enquiry_email_logs table created successfully.');
      conn.end();
    });
  });
});
