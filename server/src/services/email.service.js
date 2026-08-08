import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail Error:", error.message);
  } else {
    console.log("✅ Gmail is ready");
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
    <div
      style="
        font-family: Arial, sans-serif;
        max-width: 600px;
        margin: auto;
        padding: 30px;
        background: #f8fafc;
      "
    >

      <div
        style="
          background: white;
          padding: 30px;
          border-radius: 12px;
        "
      >

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

        <div
          style="
            text-align: center;
            margin: 30px 0;
          "
        >

          <div
            style="
              display: inline-block;
              padding: 18px 30px;
              background: #eff6ff;
              color: #2563eb;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              border-radius: 10px;
            "
          >
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

        <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;">

        <p
          style="
            color:#94a3b8;
            font-size:12px;
            text-align:center;
          "
        >
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














// import nodemailer from "nodemailer";
// import { google } from "googleapis";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Load local env vars from server/.env and repo root .env
// dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// function getGmailEnv() {
//   const {
//     EMAIL_USER,
//     GMAIL_CLIENT_ID,
//     GMAIL_CLIENT_SECRET,
//     GMAIL_REDIRECT_URI,
//     GMAIL_REFRESH_TOKEN,
//   } = process.env;

//   if (
//     !EMAIL_USER ||
//     !GMAIL_CLIENT_ID ||
//     !GMAIL_CLIENT_SECRET ||
//     !GMAIL_REDIRECT_URI ||
//     !GMAIL_REFRESH_TOKEN
//   ) {
//     throw new Error(
//       "Missing Gmail OAuth env vars. Required: EMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN"
//     );
//   }

//   return {
//     EMAIL_USER,
//     GMAIL_CLIENT_ID,
//     GMAIL_CLIENT_SECRET,
//     GMAIL_REDIRECT_URI,
//     GMAIL_REFRESH_TOKEN,
//   };
// }

// function createOauth2Client({ GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI, GMAIL_REFRESH_TOKEN }) {
//   const oauth2Client = new google.auth.OAuth2(
//     GMAIL_CLIENT_ID,
//     GMAIL_CLIENT_SECRET,
//     GMAIL_REDIRECT_URI
//   );

//   oauth2Client.setCredentials({
//     refresh_token: GMAIL_REFRESH_TOKEN,
//   });

//   return oauth2Client;
// }

// async function getAccessToken(oauth2Client) {
//   const accessTokenResponse = await oauth2Client.getAccessToken();
//   const accessToken =
//     typeof accessTokenResponse === "string"
//       ? accessTokenResponse
//       : accessTokenResponse?.token ?? accessTokenResponse?.access_token;

//   if (!accessToken) {
//     throw new Error("Unable to generate Gmail access token");
//   }

//   return accessToken;
// }

// export async function getTransporter() {
//   const env = getGmailEnv();
//   const oauth2Client = createOauth2Client(env);
//   const accessToken = await getAccessToken(oauth2Client);

//   return nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 465,
//     secure: true,
//     auth: {
//       type: "OAuth2",
//       user: env.EMAIL_USER,
//       clientId: env.GMAIL_CLIENT_ID,
//       clientSecret: env.GMAIL_CLIENT_SECRET,
//       refreshToken: env.GMAIL_REFRESH_TOKEN,
//       accessToken,
//     },
//   });
// }