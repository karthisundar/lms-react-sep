const nodemailer = require('D:/Karthi/LMS/node_modules/nodemailer');
const emailService = require('D:/Karthi/LMS/src/config/contactEnquiryEmailService');

// Test that sendAdminEnquiryEmail formats and sends properly using a nodemailer json/stream transport
async function testSuccessfulEmail() {
  const testTransporter = nodemailer.createTransport({
    jsonTransport: true,
  });

  emailService.setTransporterForTesting(testTransporter);

  const result = await emailService.sendAdminEnquiryEmail({
    id: 999,
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 234 567 8900',
    subject: 'AI & Data Science',
    message: 'Hello, I want to know about batch timings.',
    source: '/courses/ai-data-science',
    created_at: new Date(),
  });

  console.log('Email delivery accepted by transport:', result);
  emailService.setTransporterForTesting(null); // restore
}

testSuccessfulEmail().catch(console.error);
