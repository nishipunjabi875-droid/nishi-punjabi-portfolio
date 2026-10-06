const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

class EmailReporter {
  static async sendDashboardEmail(stats, recipientEmail = 'nishi.punjabi@woodenstreet.com') {
    if (config.sendEmail === false || process.env.SEND_EMAIL === 'false') {
      console.log(`\nℹ Email notifications disabled (SEND_EMAIL=false). Dashboard and Excel reports saved locally.`);
      return false;
    }

    console.log(`\n📧 Preparing to send QA Automation Dashboard to: ${recipientEmail}...`);

    const dashboardHtml = fs.existsSync(config.dashboardPath) 
      ? fs.readFileSync(config.dashboardPath, 'utf8')
      : `<h1>Ticket QA Automation Summary</h1><p>Passed: ${stats.passed}, Failed: ${stats.failed}</p>`;

    const smtpHost = process.env.SMTP_HOST || 'mail.woodenstreet.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const mailOptions = {
      from: `"WoodenStreet QA Automation" <${smtpUser || 'nishi.punjabi@woodenstreet.com'}>`,
      to: recipientEmail,
      subject: `[QA Report] Website Ticket Creation QA Automation — ${stats.passRate}% Pass Rate (${new Date().toLocaleDateString()})`,
      html: dashboardHtml,
      attachments: [
        {
          filename: 'dashboard.html',
          path: config.dashboardPath
        },
        {
          filename: 'ticket-report.xlsx',
          path: config.excelReportPath
        }
      ]
    };

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✓ Email sent successfully via Zimbra to ${recipientEmail}! (Message ID: ${info.messageId})`);
        return true;
      } catch (err) {
        console.error(`⚠️ Failed to send email via Zimbra to ${recipientEmail}: ${err.message}`);
        return false;
      }
    } else {
      console.log(`ℹ SMTP credentials (SMTP_USER & SMTP_PASS) not set in .env.`);
      console.log(`  The HTML Dashboard and Excel Report have been generated and attached at:`);
      console.log(`  - Dashboard: ${config.dashboardPath}`);
      console.log(`  - Excel Report: ${config.excelReportPath}`);
      return false;
    }
  }
}

module.exports = EmailReporter;
