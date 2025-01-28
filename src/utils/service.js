import { ApiError } from "./ApiError.js";
import { ApiResponse } from "./ApiResponse.js";
import { asyncHandler } from "./asynchandler.js";
import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

let OTP, user;
let v2 = "MG59c6835e3a2225befd08b2ab37b059b7"
export const messageService = async (req, res) => {
    try {
        const number = "+923217902988"; // Include "+" for E.164 format
        const username = "Mamoon";
        let digits = "0123456789";
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



export const verifyOTP = async(req, res)=>{
    try {
        const {otp} = req.body;
        if(otp != OTP){
            throw new ApiError(401, "Invalid Otp");
        }
        //save user info

        return res.status(200).json(new ApiResponse(200, "Verified OTP Successfully!"))
    } catch (error) {
        throw new ApiError(500, "verify Internal Error");
        
    }
}