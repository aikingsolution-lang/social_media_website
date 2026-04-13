export function generateOtp(length = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
}

export function isCooldownActive(lastRequestedAt?: Date | null): boolean {
    if (!lastRequestedAt) return false;
    const cooldownSeconds = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
    const diffMs = Date.now() - new Date(lastRequestedAt).getTime();
    return diffMs < cooldownSeconds * 1000;
}

export function tooManyAttempts(attempts: number): boolean {
    const maxAttempts = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);
    return attempts >= maxAttempts;
}