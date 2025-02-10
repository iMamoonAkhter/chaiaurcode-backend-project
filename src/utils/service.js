import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";
import { asyncHandler } from "./asynchandler.js";
import jwt from "jsonwebtoken";
import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
import nodemailer from "nodemailer";
//Twilio Services
let OTP, user;
let v2 = "MG59c6835e3a2225befd08b2ab37b059b7";
let digits = "0123456789";
export const twilioMessageService = async (req, res) => {
    try {
        const number = "+923270902251"; // Include "+" for E.164 format
        const username = "Mamoon";
        OTP = "";
        for (let i = 0; i < 4; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
        }

        console.log("Number: ", number, " OTP:", OTP);

        const response = await client.messages.create({
            body: `Your verification code is ${OTP}`, // Avoid sensitive keywords
            messagingServiceSid: v2,
            to: number,
        });

        console.log("Twilio Response:", response); // Log full response

        if (!response) {
            throw new ApiError(401, "Message not sent");
        }

        return res.status(200).json(new ApiResponse(200, "Message Sent Successfully", response));
    } catch (error) {
        console.error("Error:", error);
        throw new ApiError(500, "OTP Internal Error");
    }
};






//Nodemailer

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.AUTHENTICATION_EMAIL,
        pass: process.env.AUTHENTICATION_PASSWORD,
      },
    });
    const mailOption = {
      from: `<${options.email}>`,
      to: process.env.AUTHENTICATION_EMAIL,
      subject: options.subject,
      html: options.html,
    };
    await transporter.sendMail(mailOption);
  };
  
  const contactFormSubmissionEmailMessage = (name, email,phone, message) => {
    return `<div>
          <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 20px;">
          <h2 style="text-align: center; color: #17aae0">Contact Form Query</h2>
          <table>
              <tr style="vertical-align: top;">
                <td><h4 style="color: #17aae0"> Name: </h4></td>
                <td><p> ${name} </p></td>
              </tr>
               <tr style="vertical-align: top;">
                <td><h4 style="color: #17aae0"> Phone: </h4></td>
                <td><p> ${phone} </p></td>
              </tr>
              <tr style="vertical-align: top;">
                <td><h4 style="color: #17aae0"> Email: </h4></td>
                <td><p> ${email} </p></td>
              </tr>
              <tr style="vertical-align: top;">
                <td><h4 style="color: #17aae0"> Query: </h4></td>
                <td style="overflow-wrap: break-word; max-width: 530px;"><p> ${message} </p></td>
              </tr>
            </table>
        </div>
      </div>
    </div>`;
  };
  
 export  const contactFormSubmission = asyncHandler(async (req, res, next) => {
    try {
      const name = req.body.name;
      const email = req.body.email;
      const phone = req.body.phone;
      const message = req.body.message;
  
      await sendEmail({
        from: email,
        email: process.env.AUTHENTICATION_EMAIL,
        subject: "Contact Form Query",
        html: contactFormSubmissionEmailMessage(name, email,phone, message),
      });
      res.status(200).json(new ApiResponse(200, "Message sent successfully!"));
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  });
  


//OTP section
let otpData = {}; 
export const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;

        // Get the token from cookies
        const token = req.cookies.auth_token; // Access token from cookie

        if (!token) {
            throw new ApiError(400, "Token is required for verification");
        }

        // Decode JWT token to extract the email
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const email = decoded.email;

        if (!email) {
            throw new ApiError(400, "Invalid token");
        }

        // Validate if OTP exists
        if (!otpData[email]) {
            throw new ApiError(400, "OTP not sent yet");
        }

        const { OTP, expirationTime } = otpData[email];

        // Check if OTP has expired
        if (Date.now() > expirationTime) {
            throw new ApiError(401, "OTP Expired");
        }

        // Verify OTP
        if (otp !== OTP) {
            throw new ApiError(401, "Invalid OTP");
        }

        // Clear OTP after successful verification (to prevent reuse)
        delete otpData[email];
        //Using email, generate the token and store
        // Respond with success
        return res.status(200).json(new ApiResponse(200, "Verified OTP Successfully!", email));
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "Internal Error during verification");
    }
};


const sendEmailOTP = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.AUTHENTICATION_EMAIL,
      pass: process.env.AUTHENTICATION_PASSWORD,
    },
  });

  //Check the email exist or not in database

  const mailOptions = {
    from: `"Backend Services" <${process.env.AUTHENTICATION_EMAIL}>`,  // Sender
    to: options.email,  // ✅ Send OTP to the user's email
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

// 🔥 Function to generate OTP email content
const otpEmailTemplate = (OTP) => {
  return `
    <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 6px; padding: 20px;">
        <h2 style="text-align: center; color: #17aae0">Your OTP Code</h2>
        <p style="text-align: center; font-size: 24px; font-weight: bold; color: #333;">${OTP}</p>
        <p style="text-align: center; color: #666;">Use this OTP to complete your verification process. It expires in 10 minutes.</p>
      </div>
    </div>`;
};

export const sendOTP = asyncHandler(async (req, res) => {
    try {
        const email = req.body.email;
    
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // 🔢 Generate a 6-digit OTP
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationTime = Date.now() + 100000; // 10 minutes from now

        // Store OTP and expiration time
        otpData[email] = { OTP, expirationTime };

        // Generate a JWT with the email embedded
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        // 📨 Send OTP Email
        const result = await sendEmailOTP({
            email: email,
            subject: "Your OTP Code",
            html: otpEmailTemplate(OTP),
        });

        // Set token in the cookie (with HttpOnly flag for security)
        res.cookie('auth_token', token, {
            httpOnly: true, // Makes cookie accessible only via HTTP (not JS)
            secure: process.env.NODE_ENV === 'production', // Secure cookies in production
            maxAge: 60 * 60 * 1000, // 1 hour expiry time for the token
        });

        // 📩 Respond with success (without sending the token back in the body)
        res.status(200).json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
        return res.status(500).send({ error: error.message });
    }
});
