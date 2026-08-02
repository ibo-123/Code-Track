import nodemailer from "nodemailer";
console.log("SMTP HOST: 108.177.127.109");
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ Email credentials missing");
}
const transporter = nodemailer.createTransport({
  host: "108.177.127.109",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  tls: {
    servername: "smtp.gmail.com",
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});
console.log("Connecting to Gmail...");
transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail Error:", error.message);
  } else {
    console.log("✅ Gmail SMTP is ready");
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"CodeTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
    throw error;
  }
};

export const sendVerificationEmail = async (
  email,
  name,
  token
) => {
  const verificationLink =
    `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
      <h2>Hello ${name} 👋</h2>

      <p>Thank you for registering with <strong>CodeTrack</strong>.</p>

      <p>Please verify your email by clicking the button below.</p>

      <a
        href="${verificationLink}"
        style="
          background:#2563eb;
          color:#ffffff;
          padding:12px 20px;
          text-decoration:none;
          border-radius:6px;
          display:inline-block;
        "
      >
        Verify Email
      </a>

      <p style="margin-top:20px;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>

      <p>
        <a href="${verificationLink}">
          ${verificationLink}
        </a>
      </p>

      <hr>

      <small>
        This verification link expires in 24 hours.
      </small>
    </div>
  `;

  return await sendEmail(
    email,
    "Verify your CodeTrack Account",
    html
  );
};