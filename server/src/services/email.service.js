import nodemailer from "nodemailer";
import dns from "dns";

dns.lookup("smtp.gmail.com", { family: 4 }, (err, address) => {
  console.log("GMAIL IPV4:", address);
});

console.log("SMTP HOST: 108.177.127.109");

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
    <div>
      <h2>Hello ${name} 👋</h2>

      <p>Thank you for registering with <strong>CodeTrack</strong>.</p>

      <p>
        Verify your email:
      </p>

      <a href="${verificationLink}">
        Verify Email
      </a>

      <p>
        This link expires in 24 hours.
      </p>

    </div>
  `;


  return await sendEmail(
    email,
    "Verify your CodeTrack Account",
    html
  );
};