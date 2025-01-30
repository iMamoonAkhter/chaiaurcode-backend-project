import { URL } from "../models/url.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynchandler.js";
import shortid from "shortid"
let redirectURL= "";
export const generateNewShortURL = asyncHandler(async(req, res)=>{
    try {
        const body = req.body;
        if (!body.url) {
            res.status(400).json(ApiError(400, "URL is required"))
        }
        const shortIdd = shortid(8);
        /*await URL.create({
            shortId: shortId,
            redirectURL: body.url,
            visitedHistory: [],
        })*/
        redirectURL = body.url;


        return res.status(200).json(new ApiResponse(200, {url: `http://localhost:8000/api/v1/url/${shortIdd}`}))
    } catch (error) {
        res.status(500).json(ApiError(500,"Internal Error"))

    }
})

export const shortURL = asyncHandler(async(req, res)=>{
    try {
        const shorrt = req.params.shortId;
        /*const entry = await URL.findOneAndUpdate(
            {
                shorrt,
            },
            {
                $push: {
                    visitHistory: {timestamps: Date.now()},
                }
            }
        )*/

        res.redirect(redirectURL);
    } catch (error) {
        console.log(error.message)
    }
})

export const handleGetAnalytics = asyncHandler(async(req, res)=>{
    try {
        const sss = req.params.shortId;
        //await URL.findOne({shortId: sss});
        return res.status(200, new ApiResponse(sss))
    } catch (error) {
        res.status(500).json(new ApiError(500, "Internal Error"))
    }
})