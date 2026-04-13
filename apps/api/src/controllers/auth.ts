import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "database/src/index";
import { sendEmail } from "../utils/sendEmail";
import { getPasswordOtpTemplate } from "../utils/emailTemplates";
import {
  generateOtp,
  isCooldownActive,
  tooManyAttempts,
} from "../utils/authSecurity";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const resetPasswordWithOtpSchema = z.object({
  email: z.string().email("Valid email is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUserToken = (user: { id: string; email: string }) => {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = signUserToken(user);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      accessToken: token,
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// alias for frontend /api/auth/signup
export const signup = register;

export const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = signUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const me = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Do not reveal whether user exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email is registered, an OTP has been sent.",
      });
    }

    if (isCooldownActive(user.resetOtpRequestedAt)) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    const otp = generateOtp(6);
    const expireMinutes = Number(process.env.OTP_EXPIRE_MINUTES || 10);
    const resetOtpExpiry = new Date(Date.now() + expireMinutes * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiry,
        resetOtpAttempts: 0,
        resetOtpRequestedAt: new Date(),
      },
    });

    const template = getPasswordOtpTemplate({
      otp,
      email,
      expireMinutes,
    });

    await sendEmail({
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    return res.status(200).json({
      success: true,
      message: "If that email is registered, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const parsed = resetPasswordWithOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const { email, otp, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (tooManyAttempts(user.resetOtpAttempts || 0)) {
      return res.status(429).json({
        success: false,
        message: "Too many invalid attempts. Please request a new OTP.",
      });
    }

    if (new Date(user.resetOtpExpiry).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.resetOtp !== otp) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetOtpAttempts: {
            increment: 1,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiry: null,
        resetOtpAttempts: 0,
        resetOtpRequestedAt: null,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};