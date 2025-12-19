const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendLowStockAlert = async (items) => {
  if (!items.length) return;

  const htmlList = items.map(item => 
    `<li><strong>${item.name}</strong> - Stock: ${item.quantity}/${item.minThreshold}</li>`
  ).join('');

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: '🚨 Low Stock Alert - Inventory System',
    html: `
      <h2>Low Stock Alert!</h2>
      <p>These items need restocking:</p>
      <ul>${htmlList}</ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.log('⚠️ Email failed (ok for now):', error.message);
  }
};

module.exports = { sendLowStockAlert };
