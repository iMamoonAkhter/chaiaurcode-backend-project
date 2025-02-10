import { URL } from "../models/url.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import shortid from "shortid"
let redirectURL= "";
export const generateNewShortURL = asyncHandler(async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json(new ApiError(400, "URL is required"));
        }

        // Check if URL already exists
        const checkURL = await URL.findOne({ redirectURL: url });
        
        if (checkURL) {
            console.log("Existing URL:", checkURL);
            return res.status(200).json(new ApiResponse(200, { url: `http://localhost:8000/api/v1/url/${checkURL.shortId}` }));
        }

        // Generate new shortId
        const shortId = shortid.generate();

        // Save new short URL to the database
        const result = await URL.create({
            shortId,
            redirectURL: url,
            visitedHistory: [],
        });

        console.log("New URL Created:", result);

        return res.status(201).json(new ApiResponse(201, { url: `http://localhost:8000/api/v1/url/${shortId}` }));

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
});

export const shortURL = asyncHandler(async(req, res)=>{
    try {
        const shorrt = req.params.shortId;
        const entry = await URL.findOneAndUpdate(
            {
                shorrt,
            },
            {
                $push: {
                    visitHistory: {timestamps: Date.now()},
                }
            }
        )
        console.log(entry);
        const result = await URL.findOne({shortId: shorrt});
        if(result){
            res.redirect(result.redirectURL);
        }
    } catch (error) {
        console.log(error.message)
    }
})

export const handleGetAnalytics = asyncHandler(async(req, res)=>{
    try {
        const sss = req.params.shortId;
        console.log(sss)
        const result = await URL.findOne({shortId: sss});
        if (!result) {
            return res.status(404).json(new ApiError(404, "Short URL not found"));
        }
        return res.status(200).json(new ApiResponse(200, result));
    } catch (error) {
        res.status(500).json(new ApiError(500, "Internal Error"))
    }
})