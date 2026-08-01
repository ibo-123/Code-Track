import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email,
  name,
  token
) => {

  const verificationLink =
    `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "CodeTrack <onboarding@resend.dev>",
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Hello ${name}</h2>

      <a href="${verificationLink}">
      Verify Email
      </a>
    `,
  });
};