require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Send email via Gmail SMTP
 * @param {string} to - receiver email
 * @param {string} sub - subject
 * @param {string} body - html body content
 * @returns {Promise<boolean>}
 */
const Mailer = async (to, sub, body) => {
  try {
    const email = (process.env.EMAIL || "").trim();
   
    const mailPass = (process.env.EMAIL_PASS || "").replace(/\s/g, "");

    console.log("MAIL CHECK:", {
      to,
      email: email || "MISSING",
      passExists: Boolean(mailPass),
      passLength: mailPass.length,
    });

    if (!email || !mailPass) {
      console.error("MAIL ERROR: EMAIL or EMAIL_PASS missing in environment");
      return false;
    }

    if (!to) {
      console.error("MAIL ERROR: receiver email (to) is empty");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, 
      auth: {
        user: email,
        pass: mailPass,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
    });

   
    try {
      await transporter.verify();
      console.log("MAIL: SMTP connection verified");
    } catch (verifyErr) {
      console.error("MAIL VERIFY ERROR:", verifyErr.message);
     
    }

    const mailOptions = {
      from: `"To-Let RoomRentify" <${email}>`,
      to,
      subject: sub || "Notification",
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;">
  <div style="margin:0 auto;width:100%;max-width:650px;background:#ffffff;min-height:200px;text-align:center;padding:25px;border:1px solid rgba(255,241,207,0.62);box-sizing:border-box;">
    <img
      src="https://res.cloudinary.com/dgamp83c3/image/upload/v1690659104/to-let-images/rentlogo_jzns35.png"
      alt="To-Let"
      title="To-Let"
      width="150"
      style="display:block;margin:0 auto;"
    />
    <div style="color:#101828;font-size:20px;font-weight:600;padding:25px 0;font-family:Inter,Arial,sans-serif;">
      ${sub || ""}
    </div>
    <div style="color:#101828;font-size:18px;padding:25px 0;font-family:Inter,Arial,sans-serif;margin-bottom:40px;line-height:1.5;">
      ${body || ""}
    </div>
    <div style="color:#344054;font-size:14px;padding:25px 0;font-family:Inter,Arial,sans-serif;">
      If you did not request this, you can safely ignore this email.
    </div>
  </div>
  <div style="margin:0 auto;font-family:Inter,Arial,sans-serif;width:100%;max-width:650px;padding:25px;background:rgba(255,241,207,0.62);text-align:center;box-sizing:border-box;">
    <div style="font-size:13px;color:#344054;">
      Copyright © 2025 Pradum Sonkar, All rights reserved.
    </div>
  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response || info.messageId);
    return true;
  } catch (error) {
    console.error("MAIL ERROR:", error.message);
    if (error.response) console.error("MAIL RESPONSE:", error.response);
    return false;
  }
};

module.exports = Mailer;