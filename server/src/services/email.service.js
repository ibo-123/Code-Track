import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  family: 4,

  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail OAuth2 Error:", error.message);
  } else {
    console.log("✅ Gmail OAuth2 is ready");
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
          margin:30px 0;
          border:none;
          border-top:1px solid #e2e8f0;
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