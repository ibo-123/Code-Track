import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const accessToken = await oauth2Client.getAccessToken();

  if (!accessToken?.token) {
    throw new Error("Failed to generate Gmail access token");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
};

export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"CodeTrack" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    throw error;
  }
};

export const sendVerificationOtp = async (
  email,
  name,
  otp
) => {
  const html = `
    <div style="
      font-family: Arial, sans-serif;
      background: #f8fafc;
      padding: 40px 20px;
    ">
      <div style="
        max-width: 500px;
        margin: auto;
        background: white;
        padding: 30px;
        border-radius: 12px;
      ">

        <h2 style="color: #2563eb;">
          Welcome to CodeTrack 🚀
        </h2>

        <p>
          Hello <strong>${name}</strong>,
        </p>

        <p>
          Thank you for creating your CodeTrack account.
          Use the verification code below to verify your email address.
        </p>

        <div style="
          text-align: center;
          margin: 30px 0;
        ">
          <div style="
            display: inline-block;
            padding: 18px 30px;
            background: #eff6ff;
            color: #2563eb;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            border-radius: 10px;
          ">
            ${otp}
          </div>
        </div>

        <p>
          This code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p style="color:#64748b;">
          If you did not create a CodeTrack account,
          you can safely ignore this email.
        </p>

        <hr style="
          margin: 30px 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        ">

        <p style="
          color:#94a3b8;
          font-size:12px;
          text-align:center;
        ">
          © CodeTrack
        </p>

      </div>
    </div>
  `;

  return sendEmail(
    email,
    "Your CodeTrack verification code",
    html
  );
};