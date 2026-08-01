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

transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Gmail Error:", error.message);
  } else {
    console.log("✅ Gmail is ready");
  }
});

export const sendEmail = async (to, subject, html) => {
  const info = await transporter.sendMail({
    from: `"CodeTrack" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);

  return info;
};

export const sendVerificationEmail = async (
  email,
  name,
  token
) => {
  const verificationLink =
    `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family:Arial;padding:20px">
      <h2>Hello ${name} 👋</h2>

      <p>Thank you for registering with CodeTrack.</p>

      <a
        href="${verificationLink}"
        style="
          background:#2563eb;
          color:white;
          padding:12px 20px;
          text-decoration:none;
          border-radius:6px;
          display:inline-block;
        "
      >
        Verify Email
      </a>

      <p style="margin-top:20px">
        If the button doesn't work, copy this link:
      </p>

      <p>${verificationLink}</p>

      <hr>

      <small>
        This link expires in 24 hours.
      </small>
    </div>
  `;

  return sendEmail(
    email,
    "Verify your CodeTrack Account",
    html
  );
};