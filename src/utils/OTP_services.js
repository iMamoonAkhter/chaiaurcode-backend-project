import { asyncHandler } from "./asynchandler.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import nodemailer from "nodemailer";

// Temporary storage for OTPs & user data before verification
let tempUserData = {};
let otpData = {};

/**
 * 📩 Send OTP via Email
 */
const sendEmailOTP = async (email, OTP) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.AUTHENTICATION_EMAIL,
            pass: process.env.AUTHENTICATION_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Backend Services" <${process.env.AUTHENTICATION_EMAIL}>`,
        to: email,
        subject: "Your OTP Code",
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 20px;">
                    <h2 style="text-align: center; color: #17aae0">Your OTP Code</h2>
                    <p style="text-align: center; font-size: 24px; font-weight: bold; color: #333;">${OTP}</p>
                    <p style="text-align: center; color: #666;">Use this OTP to complete your verification process. It expires in 10 minutes.</p>
                </div>
            </div>`,
    };

    await transporter.sendMail(mailOptions);
};

/**
 * 📝 Register User (Upload Avatar & Send OTP)
 */
export const registerUser1 = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
        throw new ApiError(409, "User with this email or username already exists");
    }

    // Upload avatar & cover image
    const avatarPath = req.files?.avatar?.[0]?.path || null;
    const coverImagePath = req.files?.coverImage?.[0]?.path || null;

    if (!avatarPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarPath);
    const coverImage = coverImagePath ? await uploadOnCloudinary(coverImagePath) : null;

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Generate OTP
    const OTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store OTP and temp user details
    otpData[email] = { OTP, expirationTime };
    tempUserData[email] = {
        fullname,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    };

    // Generate JWT token
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "10m" });

    // Set token in cookies
    res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000, // 10 minutes
    });

    // Send OTP via email
    await sendEmailOTP(email, OTP);

    return res.status(200).json(new ApiResponse(200, { message: "OTP sent successfully!" }));
});

/**
 * ✅ Verify OTP
 */
export const verifyOTPAndRegister = asyncHandler(async (req, res) => {
    try {
        const { otp } = req.body;
        const token = req.cookies.auth_token;

        if (!token) {
            throw new ApiError(400, "Token is required for verification");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        

        if (!otpData[decoded.email]) {
            throw new ApiError(400, "OTP not sent yet");
        }

        const { OTP, expirationTime } = otpData[email];

        if (Date.now() > expirationTime) {
            throw new ApiError(401, "OTP Expired");
        }

        if (otp !== OTP) {
            throw new ApiError(401, "Invalid OTP");
        }

        // OTP verified successfully
        delete otpData[email];

        // Check if temp user data exists
        if (!tempUserData[email]) {
            throw new ApiError(400, "User data expired or missing");
        }

        // Create user in the database
        const user = await User.create(tempUserData[email]);
        delete tempUserData[email]; // Remove temporary stored data

        res.status(201).json(new ApiResponse(201, user, "User registered successfully!"));
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "Internal error during OTP verification and registration");
    }
});
