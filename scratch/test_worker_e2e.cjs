const Environment = require('D:/Karthi/LMS/src/environments/environment.ts').default;
const { setGlobalEnvironment } = require('D:/Karthi/LMS/src/global.ts');
const env = new Environment();
setGlobalEnvironment(env);

const nodemailer = require('D:/Karthi/LMS/node_modules/nodemailer');
const emailService = require('D:/Karthi/LMS/src/config/contactEnquiryEmailService.ts');
const { createContactEnquiry, getContactEnquiryById } = require('D:/Karthi/LMS/src/db/dal/contacts.ts');

async function testWorkerSuccess() {
  const testTransporter = nodemailer.createTransport({ jsonTransport: true });
  emailService.setTransporterForTesting(testTransporter);

  console.log('Creating enquiry for successful send test...');
  const { enquiry } = await createContactEnquiry({
    name: 'Success Test User',
    email: 'success@example.com',
    phone: '+1 555-9988',
    subject: 'Cloud & DevOps',
    message: 'Testing successful worker flow.',
    source: '/courses/cloud-devops'
  });
  console.log('Created enquiry ID:', enquiry.id);

  console.log('Waiting 3 seconds for worker to process...');
  await new Promise(r => setTimeout(r, 3000));

  const updated = await getContactEnquiryById(enquiry.id);
  console.log('Updated Enquiry email_status:', updated.email_status);
  console.log('Updated Enquiry email_sent_at:', updated.email_sent_at);
  console.log('Email logs count:', updated.emailLogs?.length);
  if (updated.emailLogs?.length > 0) {
    const latestLog = updated.emailLogs[updated.emailLogs.length - 1];
    console.log('Latest log status:', latestLog.status);
    console.log('Latest log provider_message_id:', latestLog.provider_message_id);
    console.log('Latest log sent_at:', latestLog.sent_at);
  }

  process.exit(0);
}
testWorkerSuccess().catch(err => {
  console.error(err);
  process.exit(1);
});
