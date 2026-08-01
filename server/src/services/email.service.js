import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send Email Verification
 */
export const sendVerificationEmail = async (
  email,
  name,
  token
) => {
  const verificationLink =
    `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  try {
    const data = await resend.emails.send({
      from: "CodeTrack <onboarding@resend.dev>",
      to: email,
      subject: "Verify your CodeTrack Account",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;">
          <h2 style="color:#2563eb;">
            Welcome to CodeTrack 🚀
          </h2>

          <p>Hello <strong>${name}</strong>,</p>

          <p>
            Thank you for creating your CodeTrack account.
            Please verify your email by clicking the button below.
          </p>

          <p style="margin:30px 0;">
            <a
              href="${verificationLink}"
              style="
                background:#2563eb;
                color:white;
                padding:14px 24px;
                text-decoration:none;
                border-radius:8px;
                font-weight:bold;
              "
            >
              Verify Email
            </a>
          </p>

          <p>
            If the button doesn't work, copy and paste this link into your browser:
          </p>

          <p>
            <a href="${verificationLink}">
              ${verificationLink}
            </a>
          </p>

          <hr>

          <p style="color:#666;">
            This verification link expires in 24 hours.
          </p>
        </div>
      `,
    });

    console.log("✅ Verification email sent:", data);

    return data;
  } catch (error) {
    console.error("❌ Resend Error:", error);

    throw error;
  }
};