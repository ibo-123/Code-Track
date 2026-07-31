import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter once when server starts
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email configuration error:", error.message);
  } else {
    console.log("✅ Email service is ready");
  }
});

/**
 * Generic email sender
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"CodeTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
    throw error;
  }
};

/**
 * Send email verification link
 */
export const sendVerificationEmail = async (
  email,
  name,
  token
) => {
const verificationLink =
  `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">

    <h1 style="color:#2563eb;">
      Welcome to CodeTrack 🚀
    </h1>

    <p>Hello <strong>${name}</strong>,</p>

    <p>
      Thank you for creating a CodeTrack account.
      Please verify your email address by clicking the button below.
    </p>

    <a
      href="${verificationLink}"
      style="
        display:inline-block;
        background:#2563eb;
        color:white;
        padding:14px 24px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
        margin:20px 0;
      "
    >
      Verify Email
    </a>

    <p>
      Or copy and paste this link into your browser:
    </p>

    <p>
      ${verificationLink}
    </p>

    <hr/>

    <small>
      This verification link expires in 24 hours.
    </small>

  </div>
  `;

  return sendEmail(
    email,
    "Verify your CodeTrack account",
    html
  );
};