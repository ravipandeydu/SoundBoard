import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

if (!process.env.EMAIL_FROM) {
  throw new Error("Missing EMAIL_FROM environment variable");
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error("Missing NEXT_PUBLIC_APP_URL environment variable");
}

const resend = new Resend(process.env.RESEND_API_KEY);

const createVerificationEmailHtml = (
  email: string,
  verificationUrl: string
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      background: linear-gradient(to bottom right, #1e1e2e, #2d2b42);
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .title {
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      text-align: center;
    }
    .text {
      color: #e2e8f0;
      margin-bottom: 24px;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: linear-gradient(to right, #6366f1, #8b5cf6);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
      margin: 0 auto;
    }
    .button:hover {
      background: linear-gradient(to right, #4f46e5, #7c3aed);
    }
    .footer {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 32px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">Verify your email address</h1>
    <p class="text">
      Thanks for signing up! To get started, please verify your email address by clicking the button below:
    </p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">
        Verify Email Address
      </a>
    </div>
    <p class="footer">
      If you didn't create an account, you can safely ignore this email.
      <br>
      This link will expire in 24 hours.
    </p>
  </div>
</body>
</html>
`;

const createPasswordResetEmailHtml = (email: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your password</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      background: linear-gradient(to bottom right, #1e1e2e, #2d2b42);
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .title {
      color: #fff;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
      text-align: center;
    }
    .text {
      color: #e2e8f0;
      margin-bottom: 24px;
      text-align: center;
    }
    .button {
      display: inline-block;
      background: linear-gradient(to right, #6366f1, #8b5cf6);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      text-align: center;
      margin: 0 auto;
    }
    .button:hover {
      background: linear-gradient(to right, #4f46e5, #7c3aed);
    }
    .footer {
      color: #94a3b8;
      font-size: 14px;
      margin-top: 32px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="title">Reset Your Password</h1>
    <p class="text">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">
        Reset Password
      </a>
    </div>
    <p class="footer">
      If you didn't request a password reset, you can safely ignore this email.
      <br>
      This link will expire in 1 hour.
    </p>
  </div>
</body>
</html>
`;

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: email,
      subject: "Verify your email address",
      html: createVerificationEmailHtml(email, verificationUrl),
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: email,
      subject: "Reset your password",
      html: createPasswordResetEmailHtml(email, resetUrl),
    });

    if (error) {
      console.error("Failed to send password reset email:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}
