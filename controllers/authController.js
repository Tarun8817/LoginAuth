import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import UserModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";


// Register Controller
export const register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new UserModel({ firstName, lastName, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Ather Ai",
            text: `Hello ${firstName} ${lastName},\n\nWelcome to our platform!`,
        });

        return res.json({ success: true, message: "User registered successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Login Controller
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const user = await UserModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid Email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid password" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                email: user.email
            },
            token,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Logout Controller
export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });
        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Send Verify OTP
export const sendVerifyOtp = async (req, res) => {
    const { constId } = req.body;
    console.log("constId from req.body:", constId);

    if (!mongoose.Types.ObjectId.isValid(constId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    try {
        const user = await UserModel.findById(constId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.isAccountVerified) {
            return res.status(400).json({ success: false, message: "Your account is already verified" });
        }
        if (!mongoose.Types.ObjectId.isValid(constId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format",
            });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}. Valid for 24 hours. Do not share it.`,
        });

        return res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Verify Email OTP
export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    console.log("Verifying OTP for userId:", userId);

    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "Please provide userId and otp" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid Otp" });
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Otp expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: "Account verified successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true, message: "User is authenticated" });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Send Reset Password OTP
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 9000000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Reset your password",
            text: `Your OTP is ${otp}. Valid for 24 hours.`,
        });

        return res.json({ success: true, message: "OTP sent to your email" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Email, otp and new password are required" });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid Otp" });
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Otp expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Password reset successfully" });

    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
