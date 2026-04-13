export function getPasswordOtpTemplate({
    otp,
    email,
    appName = "Social Automation",
    expireMinutes = 10,
}: {
    otp: string;
    email: string;
    appName?: string;
    expireMinutes?: number;
}) {
    const subject = `${otp} is your password reset code`;

    const text = `
${appName}

We received a request to reset the password for ${email}.

Your OTP code is: ${otp}

This code will expire in ${expireMinutes} minutes.

If you did not request this, please ignore this email.
`.trim();

    const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1020;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:linear-gradient(180deg,#111827 0%,#0f172a 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 20px;background:linear-gradient(135deg,#111827 0%,#1f2937 100%);">
                <div style="font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#67e8f9;font-weight:700;">
                  ${appName}
                </div>
                <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;color:#ffffff;">
                  Reset your password
                </h1>
                <p style="margin:0;font-size:15px;line-height:1.7;color:#cbd5e1;">
                  We received a request to reset the password for
                  <strong style="color:#ffffff;">${email}</strong>.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 10px;">
                <p style="margin:0 0 14px;font-size:14px;color:#94a3b8;">
                  Use the verification code below:
                </p>

                <div style="margin:18px 0 22px;padding:18px 20px;border-radius:16px;background:#020617;border:1px solid rgba(103,232,249,0.18);text-align:center;">
                  <div style="font-size:34px;letter-spacing:10px;font-weight:800;color:#67e8f9;">
                    ${otp}
                  </div>
                </div>

                <p style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#cbd5e1;">
                  This code will expire in <strong style="color:#ffffff;">${expireMinutes} minutes</strong>.
                </p>

                <p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#94a3b8;">
                  For your security, never share this code with anyone.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 32px 28px;">
                <div style="padding:16px 18px;border-radius:14px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);font-size:13px;line-height:1.7;color:#94a3b8;">
                  If you did not request a password reset, you can safely ignore this email.
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;line-height:1.6;color:#64748b;text-align:center;">
                © ${new Date().getFullYear()} ${appName}. Secure access for your workspace.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    return { subject, text, html };
}